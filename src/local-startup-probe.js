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
    button.addEventListener('click',()=>{
      actionOutput.textContent='正在调用原版 Connector 保存入口…';
      chrome.runtime.sendMessage(['Connector_Browser.onZoteroButtonElementClick',[]],response=>{
        actionOutput.textContent=chrome.runtime.lastError ? '保存调用错误：'+chrome.runtime.lastError.message : '保存入口返回：'+JSON.stringify(response);
      });
    });
    document.body.append(button,actionOutput);
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
