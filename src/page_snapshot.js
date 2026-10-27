/*
 * Live-page snapshot customization for Zotero Connector 5.0.217.
 * Modified 2026-10-26: save original or translated pages without a translation gate.
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
Zotero.PageSnapshot = {
	version: '0.2.0-rc.3',

	attachmentTitle(item) {
		// Attachment labels are independent of citation metadata and filesystem names.
		const title = String(item?.title || '')
			.replace(/<\/?(?:i|b|sub|sup|span|em|strong)(?:\s[^>]*)?>/gi, '')
			.replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/gu, ' ')
			.replace(/\s+/gu, ' ').trim();
		const chars = Array.from(title);
		const label = chars.length > 120 ? chars.slice(0, 119).join('') + '…' : title;
		return label ? '网页快照 · ' + label : '网页快照';
	},

	normalize(text) {
		return String(text || '').replace(/[\s\u200b-\u200d\ufeff]+/gu, '');
	},

	isEligible(items, itemType, doc = document) {
		return items.length === 1 && itemType !== 'multiple'
			&& /^(text\/html|application\/xhtml\+xml)(;|$)/i.test(doc.contentType)
			&& /^https?:/i.test(doc.location.href);
	},

	isVisible(node) {
		if (!node?.getClientRects().length) return false;
		for (let current = node; current; current = current.parentElement || current.getRootNode()?.host) {
			const style = current.ownerDocument.defaultView.getComputedStyle(current);
			if (style.display === 'none' || style.visibility === 'hidden'
				|| style.visibility === 'collapse' || Number(style.opacity) === 0) return false;
		}
		return true;
	},

	inspect(doc = document) {
		let text = this.isVisible(doc.body) ? doc.body.innerText || '' : '';
		// Include visible text in open shadow roots without depending on a translation add-on.
		const visit = root => {
			for (const host of root.querySelectorAll('*')) {
				if (!host.shadowRoot || !this.isVisible(host)) continue;
				for (const child of host.shadowRoot.children) {
					if (this.isVisible(child)) text += child.innerText || '';
				}
				visit(host.shadowRoot);
			}
		};
		visit(doc);
		return { url: doc.location.href, pageChars: this.normalize(text).length };
	},

	async waitForReady(expectedURL, doc = document) {
		if (doc.location.href !== expectedURL) throw new Error('页面地址已改变，请在目标论文页重新保存。');
		const report = this.inspect(doc);
		if (!report.pageChars) throw new Error('当前网页没有可见正文，请加载完成后重试。PDF 保存不受影响。');
		return report;
	},

	async validate(content, expected, currentURL = document.location.href) {
		if (currentURL !== expected.url) throw new Error('抓取期间页面地址已改变，已拒绝该快照。');
		if (typeof content !== 'string' || !content.trim()) throw new Error('快照内容为空，已拒绝保存。');
		const saved = new DOMParser().parseFromString(content, 'text/html');
		for (const node of saved.querySelectorAll('script,noscript,meta[http-equiv="refresh" i]')) node.remove();
		// No language, translator marker, or translation sample is required.
		const rendered = await this.checkRendering(saved);
		return { pageChars: rendered.pageChars, capturedAt: new Date().toISOString() };
	},

	async checkRendering(saved) {
		const frame = document.createElement('iframe');
		frame.setAttribute('sandbox', 'allow-same-origin');
		frame.setAttribute('aria-hidden', 'true');
		frame.style.cssText = 'position:fixed;left:-100000px;top:0;width:1440px;height:1000px;border:0;pointer-events:none;';
		const csp = saved.createElement('meta');
		csp.httpEquiv = 'Content-Security-Policy';
		csp.content = "default-src 'none'; style-src 'unsafe-inline' data:; img-src data: blob:; font-src data:; script-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'";
		saved.head.prepend(csp);
		frame.srcdoc = '<!doctype html>' + saved.documentElement.outerHTML;
		let timer;
		try {
			await new Promise((resolve, reject) => {
				timer = setTimeout(() => reject(new Error('无法完成快照的离线显示检查，已拒绝保存。')), 5000);
				frame.addEventListener('load', resolve, { once: true });
				document.body.appendChild(frame);
			});
			const report = this.inspect(frame.contentDocument);
			if (!report.pageChars) throw new Error('快照离线显示为空白或隐藏，已拒绝保存。');
			return report;
		}
		finally {
			clearTimeout(timer);
			frame.remove();
		}
	},

	annotate(content, report) {
		const value = `v${this.version};visibleChars=${report.pageChars};at=${report.capturedAt}`;
		const meta = `<meta name="zotero-page-snapshot" content="${value}">`;
		if (/<head\b[^>]*>/i.test(content)) return content.replace(/<head\b[^>]*>/i, match => match + meta);
		const doc = new DOMParser().parseFromString(content, 'text/html');
		doc.head.insertAdjacentHTML('afterbegin', meta);
		return '<!doctype html>' + doc.documentElement.outerHTML;
	},

	reportFailure(error) {
		const text = '网页快照未保存：' + error.message;
		if (Zotero.Inject?.notify) {
			Promise.resolve(Zotero.Inject.notify(text, [{ title: '知道了' }], 10000)).catch(() => {});
		}
	}
};
