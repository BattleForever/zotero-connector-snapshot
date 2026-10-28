// SPDX-License-Identifier: AGPL-3.0-or-later
// Bounded local delivery states only: no URL, article text, metadata, cookies or message payload.
	function traceDelivery(name, phase, tab, frameId, responded) {
		if (typeof self === 'undefined' || !self.ZTSS_LOCAL_STARTUP) return;
		if (!['connectorReady', 'translate', 'saveAsWebpage', 'progressWindow.show',
			'progressWindowIframe.registered', 'progressWindowIframe.shown'].includes(name)) return;
		const entries = self.ZTSS_LOCAL_STARTUP.delivery || (self.ZTSS_LOCAL_STARTUP.delivery = []);
		entries.push({name, phase, tabId:tab?.id, frameId, responded, time:Date.now()});
		if (entries.length > 40) entries.splice(0, entries.length - 40);
	}
