// SPDX-License-Identifier: AGPL-3.0-or-later
// A reloaded extension cannot reconnect an old isolated world. Dispose its RPCs explicitly.
	const contextCancellations = new WeakSet();
	let contextDisposed = false;
	function cancelDisposedContext() {
		contextDisposed = true;
		// This local notice works even after extension messaging is gone. Do not retry a save
		// in another tab or pretend that a request to the old extension succeeded.
		if (window.top === window && document.body && !document.getElementById('zotero-connector-refresh-required')) {
			const notice = document.createElement('p');
			notice.id = 'zotero-connector-refresh-required';
			notice.setAttribute('role', 'status');
			notice.textContent = 'Zotero Connector 已重新加载，请刷新此页后保存。需要译文快照时，请在刷新后重新翻译。';
			document.body.prepend(notice);
		}
		const error = new Error('Zotero Connector 已重新加载，请刷新此页后保存。');
		error.name = 'AbortError';
		contextCancellations.add(error);
		return error;
	}
	window.addEventListener('unhandledrejection', event => {
		// A lifecycle cancellation can outlive its old page's observer/timer. Consume only
		// errors created here; application, translator and ordinary transport errors remain visible.
		if (contextDisposed && contextCancellations.has(event.reason)) event.preventDefault();
	});
	async function sendToBackground(payload) {
		if (contextDisposed || !browser.runtime || typeof browser.runtime.sendMessage !== 'function') {
			throw cancelDisposedContext();
		}
		try {
			return await browser.runtime.sendMessage(payload);
		}
		catch (error) {
			if (error?.message === 'Extension context invalidated.') throw cancelDisposedContext();
			throw error;
		}
	}
