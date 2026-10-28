// SPDX-License-Identifier: AGPL-3.0-or-later
// A first click can beat initInject's storage/HTTP work. Do not send to absent listeners.
async function _waitForPageScripts(tab) {
    const info=Zotero.Connector_Browser.getTabInfo(tab.id);
    if(info.uninjectable || !/^https?:/.test(tab.url || info.url || '')) return false;
    for(let attempt=0;attempt<20;attempt++) {
        const ready=await new Promise((resolve,reject)=>{
            const timer=setTimeout(()=>reject(new Error('Zotero page initialization timed out. Refresh the article page and retry.')),15000);
            Zotero.Messaging.sendMessage('connectorReady',null,tab,0).then(value=>{
                clearTimeout(timer);resolve(value);
            },error=>{clearTimeout(timer);reject(error);});
        });
        if(ready===true) return true;
        await Zotero.Promise.delay(50);
    }
    throw new Error('Zotero page scripts are unavailable. Refresh the article page after reloading the extension.');
}
