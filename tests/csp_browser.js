// SPDX-License-Identifier: AGPL-3.0-or-later
// Synthetic data only. Exercise actual Translate.setDocument under both generated policies.
(async()=>{
  const params=new URLSearchParams(location.search), mode=params.get('case');
  const output=document.getElementById('result');
  if(!mode) {
    const run=params.get('summary');
    if(!run) {
      output.textContent='Ready. Three top-level cases avoid background-frame event throttling.';
      const link=document.createElement('a');link.textContent='Start baseline test';
      link.href='csp_browser.html?case=before&run='+Date.now();document.body.appendChild(link);
      return;
    }
    const results=['before','after','boundaries'].map(name=>JSON.parse(sessionStorage.getItem('ZTSS_CSP_'+run+'_'+name)));
    if(results.some(r=>!r))throw new Error('Complete all three cases before opening the summary');
    let evidence;
    const deadline=Date.now()+1000;
    do {evidence=await fetch('/evidence?run='+run).then(r=>r.json());}
    while(Date.now()<deadline&&((evidence.reports.before?.length||0)<2||(evidence.reports.boundaries?.length||0)<5));
    const fields=['title','text','inlineStyle','styleTag','json','xpathCount','contentType'];
    const sameData=fields.every(key=>results[0].data?.[key]===results[1].data?.[key]);
    const checks={
      baselineReproduced:(evidence.reports.before||[]).filter(r=>r['effective-directive'].startsWith('style-src')).length===2,
      normalParseHasNoCSPReports:(evidence.reports.after||[]).length===0,
      originalDOMDataPreserved:sameData&&results[1].data?.xpathCount===1,
      parsedScriptsStayInert:results.every(r=>r.parsedScriptsStayInert===true),
      inlineScriptAndNetworkBlocked:Object.values(results[2].boundaries||{}).length===5&&Object.values(results[2].boundaries).every(Boolean),
      noNetworkRequestsReachedServer:evidence.networkHits.length===0,
      actualSetDocumentResponded:results.every(r=>r.setDocumentResponded===true)
    };
    const receipt={complete:true,pass:Object.values(checks).every(Boolean),checks,results,...evidence};
    output.textContent=JSON.stringify(receipt,null,2);
    await fetch('/result',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(receipt)});
    return;
  }
  const handlers={};let receivedDocument;
  window.Zotero={isChromium:true,isDebug:false,
    Translate:{Web:class{setDocument(doc){receivedDocument=doc;}},ItemSaver:class{}},
    OffscreenSandbox:{addMessageListener(name,handler){handlers[name]=handler;}},
    HTTP:{wrapDocument:doc=>doc}};
  await new Promise((resolve,reject)=>{
    const script=document.createElement('script');script.src='/extension/offscreen/offscreenTranslate.js';
    script.onload=resolve;script.onerror=reject;document.head.appendChild(script);
  });
  Zotero.OffscreenTranslate.init();
  window.__parsedScriptRan=false;
  const html='<!doctype html><html><head><meta name="citation_title" content="Synthetic paper"><style id="css">@import url("/network-import"); p{color:red}</style><script type="application/ld+json">{"headline":"Synthetic paper"}</script></head><body><p id="article" style="color:blue; background-image:url(/network-background)">Original and 当前中文。</p><script>window.__parsedScriptRan=true;</script></body></html>';
  await handlers['Translate.new'](1,0);
  const responded=await handlers['Translate.setDocument'](html,'https://example.invalid/article','',1,0);
  const doc=receivedDocument;
  const data={title:doc.querySelector('meta[name="citation_title"]').content,
    text:doc.querySelector('#article').textContent,inlineStyle:doc.querySelector('#article').getAttribute('style'),
    styleTag:doc.querySelector('#css').textContent,json:doc.querySelector('script[type="application/ld+json"]').textContent,
    contentType:doc.contentType,xpathCount:doc.evaluate('//p',doc,null,XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,null).snapshotLength};
  const boundaries={};
  if(mode==='boundaries') {
    window.__activeScriptRan=false;
    const script=document.createElement('script');script.textContent='window.__activeScriptRan=true';document.body.appendChild(script);
    boundaries.inlineScriptBlocked=!window.__activeScriptRan;
    try{await fetch('/network-fetch');boundaries.fetchBlocked=false;}catch{boundaries.fetchBlocked=true;}
    boundaries.xhrBlocked=await new Promise(resolve=>{const xhr=new XMLHttpRequest();xhr.onerror=()=>resolve(true);xhr.onload=()=>resolve(false);try{xhr.open('GET','/network-xhr');xhr.send();}catch{resolve(true);}});
    boundaries.imageBlocked=await new Promise(resolve=>{const img=new Image();img.onerror=()=>resolve(true);img.onload=()=>resolve(false);img.src='/network-image';document.body.appendChild(img);});
    boundaries.externalCSSBlocked=await new Promise(resolve=>{const link=document.createElement('link');link.rel='stylesheet';link.onerror=()=>resolve(true);link.onload=()=>resolve(false);link.href='/network-css';document.head.appendChild(link);});
  }
  const result={mode,data,boundaries,setDocumentResponded:responded===true,parsedScriptsStayInert:!window.__parsedScriptRan};
  output.textContent=JSON.stringify(result,null,2);
  const run=params.get('run');sessionStorage.setItem('ZTSS_CSP_'+run+'_'+mode,JSON.stringify(result));
  const next={before:['after','Continue: patched parser'],after:['boundaries','Continue: blocked operations']};
  const link=document.createElement('a');
  link.textContent=next[mode]?.[1]||'Show results';
  link.href=next[mode]?'csp_browser.html?case='+next[mode][0]+'&run='+run:'csp_browser.html?summary='+run;
  document.body.appendChild(link);
})().catch(error=>{
  const result={error:String(error.stack||error)};
  document.getElementById('result').textContent=JSON.stringify(result);
  if(parent!==window)parent.postMessage({type:'ZTSS_CSP_CASE',result},location.origin);
});
