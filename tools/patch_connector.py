# SPDX-License-Identifier: AGPL-3.0-or-later
# Based on Zotero Connector patch operations. Modified 2026-10-26.
from pathlib import Path
import json
import shutil

ASSETS = Path(__file__).resolve().parents[1] / 'src'


def replace_once(text, old, new):
    if text.count(old) != 1:
        raise ValueError('Unsupported source: patch anchor must occur exactly once')
    return text.replace(old, new, 1)


def apply(base, output, manifest):
    helper = (ASSETS / 'page_snapshot.js').read_text(encoding='utf-8')
    path = output / 'itemSaver.js'
    code = (base / 'itemSaver.js').read_text(encoding='utf-8')
    code = replace_once(code, 'const PRIMARY_ATTACHMENT_TYPES', helper + '\n\nconst PRIMARY_ATTACHMENT_TYPES')
    code = replace_once(code, '\t\tthis._singleFile = false;\n\n\t\tfor (let item of items)', '''\t\tthis._singleFile = false;

\t\t// Local customization: one snapshot of this live article, under the same parent.
\t\tif (automaticSnapshots && Zotero.PageSnapshot.isEligible(items, this._itemType)) {
\t\t\titems[0].attachments = (items[0].attachments || []).filter(a => a.mimeType !== 'text/html' || a.snapshot === false);
\t\t\titems[0].attachments.push({
\t\t\t\ttitle: Zotero.PageSnapshot.attachmentTitle(items[0]),
\t\t\t\turl: document.location.href,
\t\t\t\tmimeType: 'text/html',
\t\t\t\tsnapshot: true,
\t\t\t\t_pageSnapshot: true
\t\t\t});
\t\t}

\t\tfor (let item of items)''')
    code = replace_once(code, '\t\t\tdata.snapshotContent = await Zotero.SingleFile.retrievePageData();', '''\t\t\tconst pageContext = this._snapshotAttachment._pageSnapshot
\t\t\t\t? await Zotero.PageSnapshot.waitForReady(this._snapshotAttachment.url) : null;
\t\t\tdata.snapshotContent = await Zotero.SingleFile.retrievePageData({ pageContext });''')
    code = replace_once(code, '\t\t\tattachmentCallback(this._snapshotAttachment, 0);', '''\t\t\tif (this._snapshotAttachment._pageSnapshot) {
\t\t\t\tthis._snapshotAttachment.title = Zotero.PageSnapshot.attachmentTitle(this._items[0]);
\t\t\t}
\t\t\tattachmentCallback(this._snapshotAttachment, 0);''')
    code = replace_once(code, '\t\t\tattachmentCallback(this._snapshotAttachment, 100);', '''\t\t\tthis._pageSnapshotFailed = false;
\t\t\tattachmentCallback(this._snapshotAttachment, 100);''')
    code = replace_once(code, '\t\t\tdata.url = this._items[0].url || document.location.href;', '''\t\t\tdata.url = pageContext ? pageContext.url : (this._items[0].url || document.location.href);''')
    code = replace_once(code, '\t\t\tattachmentCallback(this._snapshotAttachment, false, e.message)', '''\t\t\tif (this._snapshotAttachment._pageSnapshot) {
\t\t\t\tthis._snapshotAttachment.title = '网页快照未保存';
\t\t\t\tthis._pageSnapshotFailed = true;
\t\t\t\tZotero.PageSnapshot.reportFailure(e);
\t\t\t}
\t\t\tattachmentCallback(this._snapshotAttachment, false, e.message)''')
    path.write_text(code, encoding='utf-8', newline='\n')

    # A surviving offscreen document reconnects once, without running cold startup again.
    path = output / 'offscreen' / 'offscreenSandbox.js'
    code = (base / 'offscreen' / 'offscreenSandbox.js').read_text(encoding='utf-8')
    code = replace_once(code, "\t\t\tZotero.debug('OffscreenSandbox: reinitialized');",
                        "\t\t\tZotero.debug('OffscreenSandbox: reinitialized');\n\t\t\treturn;")
    path.write_text(code, encoding='utf-8', newline='\n')

    path = output / 'inject' / 'pageSaving.js'
    code = (base / 'inject' / 'pageSaving.js').read_text(encoding='utf-8')
    code = replace_once(code, '''\t\t\tZotero.debug(`PageSaving.onTranslate: Reopening popup`);
\t\t\treturn Zotero.Messaging.sendMessage("progressWindow.show", [this.sessionDetails.id]);''', '''\t\t\tZotero.debug(`PageSaving.onTranslate: Reopening popup`);
\t\t\tZotero.Messaging.sendMessage("progressWindow.show", [this.sessionDetails.id]);
\t\t\tconst saver = this.sessionDetails.itemSaver;
\t\t\tif (saver?._pageSnapshotFailed && !saver._pageSnapshotRetrying) {
\t\t\t\tsaver._pageSnapshotRetrying = true;
\t\t\t\ttry {
\t\t\t\t\tawait saver._executeSingleFile(PageSaving._onAttachmentProgress);
\t\t\t\t\tZotero.Messaging.sendMessage("progressWindow.done", [true]);
\t\t\t\t}
\t\t\t\tfinally { saver._pageSnapshotRetrying = false; }
\t\t\t}
\t\t\treturn;''')
    path.write_text(code, encoding='utf-8', newline='\n')

    path = output / 'singlefile.js'
    code = (base / 'singlefile.js').read_text(encoding='utf-8')
    code = replace_once(code, 'retrievePageData: async function() {', 'retrievePageData: async function({ pageContext = null } = {}) {')
    code = replace_once(code, '\t\t\tconst config = await this._getConfig();', '''\t\t\tconst config = await this._getConfig();
\t\t\tif (pageContext) {
\t\t\t\t// Preserve current page styles and freeze the already-rendered page state.
\t\t\t\tObject.assign(config, { removeUnusedStyles: false, removeUnusedFonts: false,
\t\t\t\t\tloadDeferredImages: false, blockScripts: true, userScriptEnabled: false });
\t\t\t}''')
    code = replace_once(code, '\t\t\treturn pageData.content;', '''\t\t\tif (pageContext) {
\t\t\t\tconst report = await Zotero.PageSnapshot.validate(pageData.content, pageContext);
\t\t\t\treturn Zotero.PageSnapshot.annotate(pageData.content, report);
\t\t\t}
\t\t\treturn pageData.content;''')
    path.write_text(code, encoding='utf-8', newline='\n')

    # Avoid reinjecting an initialized child frame. Previously only frame 0 respected ping.
    path = output / 'background.js'
    code = (base / 'background.js').read_text(encoding='utf-8')
    code = replace_once(code, 'if (response && frameId == 0) return deferred.resolve();',
                        'if (response) return deferred.resolve();')
    # Keep the save promise attached to the original action so failures reach its caller.
    action_start = code.index('\tasync function _browserAction(tab) {')
    action_end = code.index('\n\t/**', action_start)
    action = code[action_start:action_end]
    action = replace_once(action, 'Zotero.Connector_Browser.saveWithTranslator(tab, 0, {fallbackOnFailure: true});',
                          'return Zotero.Connector_Browser.saveWithTranslator(tab, 0, {fallbackOnFailure: true});')
    action = action.replace('Zotero.Connector_Browser.saveAsWebpage(', 'return Zotero.Connector_Browser.saveAsWebpage(')
    code = code[:action_start] + action + code[action_end:]
    code = replace_once(code, 'Zotero.initGlobal();', '''Zotero.initGlobal().then(() => {
\tif (self.ZTSS_LOCAL_STARTUP) self.ZTSS_LOCAL_STARTUP.phase = 'ready';
}).catch(error => {
\tif (self.ZTSS_LOCAL_STARTUP) self.ZTSS_LOCAL_STARTUP.fail(error);
\tconsole.error(error);
});''')
    path.write_text(code, encoding='utf-8', newline='\n')

    path = output / 'inject' / 'inject.js'
    code = (base / 'inject' / 'inject.js').read_text(encoding='utf-8')
    code = replace_once(code, '''  Zotero.Messaging.addMessageListener("ping", function () {
    // Respond to indicate that script is injected
    return 'pong';
  });''', '')
    marker = '// check whether this is a hidden browser window being used for scraping'
    code = replace_once(code, marker, '''// Respond in every initialized frame, including frames used by publisher pages.
Zotero.Messaging.addMessageListener("ping", function () { return 'pong'; });

''' + marker)
    path.write_text(code, encoding='utf-8', newline='\n')

    for filename in ('local-startup-diagnostics.js', 'local-startup-probe.js'):
        shutil.copy2(ASSETS / filename, output / filename)
    path = output / 'background-worker.js'
    code = (base / 'background-worker.js').read_text(encoding='utf-8')
    code = replace_once(code, 'try {\n\tvar scriptsToImport', "self.importScripts('./local-startup-diagnostics.js');\n\ntry {\n\tvar scriptsToImport")
    code = replace_once(code, "\t\tself.importScripts('./'+script);", "\t\tself.ZTSS_LOCAL_STARTUP.currentScript = script;\n\t\tself.importScripts('./'+script);\n\t\tself.ZTSS_LOCAL_STARTUP.imported++;")
    code = replace_once(code, '} catch (e) {\n\tconsole.error(e);', '} catch (e) {\n\tself.ZTSS_LOCAL_STARTUP.fail(e);\n\tconsole.error(e);')
    path.write_text(code, encoding='utf-8', newline='\n')

    path = output / 'zotero.js'
    code = (base / 'zotero.js').read_text(encoding='utf-8')
    # Chrome can deliver a content-script request while the first storage await is pending.
    # Register synchronously; receiveMessage already waits on Zotero.initDeferred.promise.
    init_start = code.index('this.initGlobal = async function() {')
    init_end = code.index('\n\t};', init_start) + 5
    init = code[init_start:init_end]
    init = replace_once(init, '\t\tZotero.Messaging.init();\n', '')
    init = replace_once(init, 'this.initGlobal = async function() {',
                        'this.initGlobal = async function() {\n\t\tZotero.Messaging.init();')
    code = code[:init_start] + init + code[init_end:]
    for old, phase in [('\t\tawait Zotero.Errors.init();', 'error-log-init'),
                       ('\t\tawait Zotero.Prefs.init();', 'preferences-init'),
                       ('\t\tawait Zotero.Connector_Browser.init();', 'offscreen-and-browser-init'),
                       ('\t\tawait Zotero.i18n.init();', 'i18n-init')]:
        # The i18n line appears in several initializers, so instrument only initGlobal's first copy.
        if phase == 'i18n-init':
            code = code.replace(old, "\t\tif (global.ZTSS_LOCAL_STARTUP) global.ZTSS_LOCAL_STARTUP.phase = '" + phase + "';\n" + old, 1)
        else:
            code = replace_once(code, old, "\t\tif (global.ZTSS_LOCAL_STARTUP) global.ZTSS_LOCAL_STARTUP.phase = '" + phase + "';\n" + old)
    path.write_text(code, encoding='utf-8', newline='\n')

    # frame-ancestors has no effect in a meta policy. Keep every effective directive.
    path = output / 'offscreen' / 'offscreenSandbox.html'
    code = (base / 'offscreen' / 'offscreenSandbox.html').read_text(encoding='utf-8')
    code = replace_once(code, "form-action 'none'; frame-ancestors 'self';", "form-action 'none';")
    path.write_text(code, encoding='utf-8', newline='\n')

    custom_manifest = dict(manifest)
    custom_manifest.pop('key', None)
    custom_manifest.pop('update_url', None)
    custom_manifest['name'] = 'Zotero Connector · PDF 与网页快照'
    custom_manifest['short_name'] = 'Zotero Connector'
    custom_manifest['version_name'] = '0.2.0-rc.4 (Connector 5.0.217)'
    custom_manifest.pop('homepage_url', None)
    custom_manifest['version'] = '5.0.217.6'
    custom_manifest['content_scripts'][0]['js'].insert(0, 'local-startup-probe.js')
    custom_manifest['description'] = '保存论文时附加当前页面的网页快照，保留原有文库、分类和 PDF 保存流程。基于 Zotero Connector 的非官方修改版。'
    (output / 'manifest.json').write_text(json.dumps(custom_manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
