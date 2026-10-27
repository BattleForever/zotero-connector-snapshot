/* Diagnostic UI is restricted to this project's localhost test fixture. */
(() => {
  if(location.origin!=='http://127.0.0.1:18765' || location.pathname!=='/tests/live_extension.html' || window.top!==window) return;
  const start=()=>{
    const output=document.createElement('pre');
    output.id='ztss-extension-startup';
    output.style.cssText='white-space:pre-wrap;border:1px solid #bbc;padding:14px;background:#f6f8fa';
    output.textContent='正在读取修改版扩展的实际启动状态…';
    document.body.appendChild(output);
    const button=document.createElement('button');
    button.id='ztss-native-save-test';
    button.textContent='验收：调用原版保存与目录选择';
    const actionOutput=document.createElement('pre');
    actionOutput.id='ztss-save-action-result';
    const traceOutput=document.createElement('pre');
    traceOutput.id='ztss-save-trace';
    const trace=[];
    const record=(stage,detail)=>{
      trace.push({stage,detail});
      traceOutput.textContent=JSON.stringify({contentInitialized:!!window.Zotero?.initialized,
        translatorCount:window.Zotero?.PageSaving?.translators?.length,trace:trace.slice(-30)},null,2);
    };
    // Targeted call boundaries, only on this synthetic localhost fixture.
    const wrap=(target,key,label)=>{
      if(typeof target?.[key]!=='function') return;
      const original=target[key];
      target[key]=async function(...args){
        record(label,'entered');
        try { const result=await original.apply(this,args); record(label,'returned'); return result; }
        catch(error) { record(label,String(error?.message||error)); throw error; }
      };
    };
    wrap(window.Zotero?.Inject,'checkActionToServer','checkActionToServer');
    wrap(window.Zotero?.PageSaving,'onTranslate','onTranslate');
    wrap(window.Zotero?.PageSaving,'onSaveAsWebpage','onSaveAsWebpage');
    wrap(window.Zotero?.Connector,'checkIsOnline','checkIsOnline');
    const messaging=window.Zotero?.Messaging;
    if(messaging) {
      for(const key of ['sendMessage','receiveMessage']) {
        const original=messaging[key];
        messaging[key]=async function(...args) {
          const name=key==='receiveMessage'?args[0]?.[0]:args[0];
          if(typeof name!=='string'||!name.startsWith('progressWindow')) return original.apply(this,args);
          record(key,name+' entered');
          try {const value=await original.apply(this,args);
            record(key,name+' returned '+JSON.stringify(value));return value;
          } catch(error) {record(key,name+' '+String(error?.message||error));throw error;}
        };
      }
    }
    const OriginalFrame=window.Zotero?.Frame;
    if(OriginalFrame) window.Zotero.Frame=class extends OriginalFrame {
      constructor(attributes,...rest) {
        super(attributes,...rest);
        if(attributes?.id!=='zotero-progress-window-frame') return;
        record('progress-frame','constructed');
        this.initializedPromise.then(()=>record('progress-frame','loaded'),
          error=>record('progress-frame','load failed: '+String(error?.message||error)));
        setTimeout(()=>record('progress-frame',{connected:this.frame?.isConnected,
          display:this.frame?.style.display}),1500);
      }
    };
    button.addEventListener('click',()=>{
      actionOutput.textContent='正在调用原版 Connector 保存入口…';
      record('save-click','entered');
      chrome.runtime.sendMessage(['Connector_Browser.onZoteroButtonElementClick',[]],response=>{
        actionOutput.textContent=chrome.runtime.lastError ? '保存调用错误：'+chrome.runtime.lastError.message : '保存入口返回：'+JSON.stringify(response);
      });
    });
    document.body.append(button,actionOutput,traceOutput);
    record('fixture','popup-diagnostic-1');
    let count=0;
    const poll=()=>{
      count++;
      chrome.runtime.sendMessage({type:'ZTSS_LOCAL_STARTUP_STATUS'},response=>{
        output.textContent=chrome.runtime.lastError ? '启动诊断：'+chrome.runtime.lastError.message : JSON.stringify(response,null,2);
      });
      if(count<12) setTimeout(poll,1000);
    };
    poll();
  };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
