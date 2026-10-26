/* Local-only bootstrap diagnostics. No network transmission or user data collection. */
(() => {
  const state = self.ZTSS_LOCAL_STARTUP = {phase:'imports',currentScript:null,imported:0,error:null};
  state.fail = error => {
    state.phase='failed';
    state.error={message:String(error?.message || error),stack:String(error?.stack || '').slice(0,2500)};
  };
  self.addEventListener('unhandledrejection',event=>state.fail(event.reason));
  self.addEventListener('error',event=>state.fail(event.error || event.message));
  chrome.runtime.onMessage.addListener((message,sender,sendResponse)=>{
    if(message?.type!=='ZTSS_LOCAL_STARTUP_STATUS' || sender.id!==chrome.runtime.id) return;
    sendResponse({version:chrome.runtime.getManifest().version,phase:state.phase,currentScript:state.currentScript,
      imported:state.imported,error:state.error,initialized:!!self.Zotero?.initialized,
      offscreenInitialized:!!self.Zotero?.OffscreenManager?.offscreenPageInitialized});
  });
})();
