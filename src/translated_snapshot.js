/*
 * YiCun translated-snapshot customization for Zotero Connector 5.0.217.
 * Modified 2026-10-26: readable attachment titles; capture checks retained.
 * SPDX-License-Identifier: AGPL-3.0-or-later
 * Captures the live, translated DOM. It never refetches the page URL.
 */
Zotero.TranslatedSnapshot = {
	version: '0.2.0-rc.1',
	minTranslatedChars: 40,
	minPageChars: 200,
	readyTimeout: 12000,
	stableFor: 1000,
	pollEvery: 250,

	attachmentTitle(item) {
		// Attachment labels are independent of citation metadata and filesystem names.
		const title = String(item?.title || '')
			.replace(/<\/?(?:i|b|sub|sup|span|em|strong)(?:\s[^>]*)?>/gi, '')
			.replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/gu, ' ')
			.replace(/\s+/gu, ' ').trim();
		const chars = Array.from(title);
		const label = chars.length > 120 ? chars.slice(0, 119).join('') + '…' : title;
		return label ? '译文快照 · ' + label : '译文快照';
	},

	normalize(text) {
		return String(text || '').replace(/[\s\u200b-\u200d\ufeff]+/gu, '');
	},

	isEligible(items, itemType, doc = document) {
		return items.length === 1 && itemType !== 'multiple'
			&& /^(text\/html|application\/xhtml\+xml)(;|$)/i.test(doc.contentType)
			&& /^https?:/i.test(doc.location.href);
	},

	queryDeep(root, selector) {
		let result = Array.from(root.querySelectorAll(selector));
		for (let node of root.querySelectorAll('*')) {
			if (node.shadowRoot) result.push(...this.queryDeep(node.shadowRoot, selector));
			if (node.localName === 'template' && node.content) {
				result.push(...this.queryDeep(node.content, selector));
			}
		}
		return result;
	},

	isVisible(node) {
		if (!node.getClientRects().length) return false;
		for (let current = node; current; current = current.parentElement || current.getRootNode()?.host) {
			const style = current.ownerDocument.defaultView.getComputedStyle(current);
			if (style.display === 'none' || style.visibility === 'hidden'
				|| style.visibility === 'collapse' || Number(style.opacity) === 0) return false;
		}
		return true;
	},

	translationNodes(doc) {
		let nodes = this.queryDeep(doc, '.immersive-translate-target-inner');
		if (!nodes.length) nodes = this.queryDeep(doc, '.immersive-translate-target-wrapper');
		return nodes;
	},

	inspect(doc = document) {
		const translated = this.translationNodes(doc)
			.filter(node => this.isVisible(node))
			.map(node => this.normalize(node.innerText || node.textContent)).filter(Boolean);
		const translatedChars = translated.reduce((sum, value) => sum + value.length, 0);
		let visibleText = doc.body?.innerText || '';
		// innerText excludes text inside shadow roots, so include visible translated text there.
		visibleText += translated.join('');
		const pageChars = this.normalize(visibleText).length;
		const fingerprint = translated.join('\u241e');
		const samples = [];
		const sampleCount = Math.min(translated.length, 40);
		for (let i = 0; i < sampleCount; i++) {
			const index = sampleCount < 2 ? 0 : Math.floor(i * (translated.length - 1) / (sampleCount - 1));
			samples.push(translated[index].slice(0, 160));
		}
		return { url: doc.location.href, translatedChars, pageChars, samples, fingerprint };
	},

	async waitForReady(expectedURL, doc = document) {
		const started = Date.now();
		let fingerprint = null;
		let unchangedSince = started;
		let report;
		while (Date.now() - started <= this.readyTimeout) {
			if (doc.location.href !== expectedURL) throw new Error('页面地址已改变，请在目标论文页重新保存。');
			report = this.inspect(doc);
			if (report.fingerprint !== fingerprint) {
				fingerprint = report.fingerprint;
				unchangedSince = Date.now();
			}
			if (report.translatedChars >= this.minTranslatedChars && report.pageChars >= this.minPageChars
				&& Date.now() - unchangedSince >= this.stableFor) return report;
			await new Promise(resolve => setTimeout(resolve, this.pollEvery));
		}
		throw new Error('未检测到足够且稳定的可见译文；请完成沉浸式翻译后重试。PDF 保存不受此检查影响。');
	},

	async validate(content, expected, currentURL = document.location.href) {
		if (currentURL !== expected.url) throw new Error('抓取期间页面地址已改变，已拒绝该快照。');
		if (typeof content !== 'string' || content.length < 500) throw new Error('快照内容为空或过短，已拒绝保存。');
		const saved = new DOMParser().parseFromString(content, 'text/html');
		for (let node of saved.querySelectorAll('script,noscript,meta[http-equiv="refresh" i]')) node.remove();
		const targets = this.translationNodes(saved).map(node => this.normalize(node.textContent)).filter(Boolean);
		const translatedText = targets.join('');
		const savedChars = targets.reduce((sum, text) => sum + text.length, 0);
		if (savedChars < this.minTranslatedChars) throw new Error('快照未包含有效译文，已拒绝保存。');
		if (expected.samples.some(sample => !translatedText.includes(sample))) {
			throw new Error('快照中的译文与当前页面不一致，已拒绝保存。');
		}
		const pageText = this.normalize(saved.body?.textContent);
		if (pageText.length < this.minPageChars) throw new Error('快照正文过短，已拒绝保存。');
		// Check actual rendering too: text in a hidden DOM is not a usable snapshot.
		const rendered = await this.checkRendering(saved, expected);
		return { translatedChars: rendered.translatedChars, sampleCount: expected.samples.length, capturedAt: new Date().toISOString() };
	},

	async checkRendering(saved, expected) {
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
			if (report.translatedChars < this.minTranslatedChars || report.pageChars < this.minPageChars
				|| expected.samples.some(sample => !report.fingerprint.includes(sample))) {
				throw new Error('快照离线显示为空白、隐藏或缺少译文，已拒绝保存。');
			}
			return report;
		}
		finally {
			clearTimeout(timer);
			frame.remove();
		}
	},

	annotate(content, report) {
		const value = `v${this.version};translatedChars=${report.translatedChars};samples=${report.sampleCount};at=${report.capturedAt}`;
		const meta = `<meta name="zotero-translated-snapshot" content="${value}">`;
		// SingleFile may omit optional <head> tags when compressHTML is enabled.
		if (/<head\b[^>]*>/i.test(content)) return content.replace(/<head\b[^>]*>/i, match => match + meta);
		const doc = new DOMParser().parseFromString(content, 'text/html');
		doc.head.insertAdjacentHTML('afterbegin', meta);
		return '<!doctype html>' + doc.documentElement.outerHTML;
	},

	reportFailure(error) {
		const text = '译文快照未保存：' + error.message;
		if (Zotero.Inject?.notify) {
			Promise.resolve(Zotero.Inject.notify(text, [{ title: '知道了' }], 10000)).catch(() => {});
		}
	}
};
