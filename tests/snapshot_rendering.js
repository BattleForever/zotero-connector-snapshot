// SPDX-License-Identifier: AGPL-3.0-or-later
// Real checkRendering, native iframe CSP, synthetic snapshots only.
(async()=>{
 const results=[],reports=[];
 const helper=Zotero.PageSnapshot;
 const originalInspect=helper.inspect;
 helper.inspect=function(doc){
  if(doc!==document)reports.push({bases:doc.querySelectorAll('base').length,
   csp:doc.querySelector('meta[http-equiv="Content-Security-Policy"]').content,
   text:doc.body.innerText});
  return originalInspect.call(this,doc);
 };
 for(const name of ['absolute-base','empty-base','undefined-base','blank','hidden']){
  const base=name==='absolute-base'?'https://example.invalid/article':name==='empty-base'?'':'undefined';
  const content='<!doctype html><html><head><base href="'+base+'"><style>body{'+(name==='hidden'?'display:none':'color:blue')+'}</style></head><body>'+(name==='blank'?'':'Original article. 当前已显示的中文。')+'</body></html>';
  try{
   const expected={url:location.href};
   const result=await helper.validate(content,expected);
   const report=reports.at(-1),saved=helper.annotate(content,result);
   const checks={noBaseInValidation:report.bases===0,basePolicyRetained:report.csp.includes("base-uri 'none'"),
    savedOriginalBaseUnchanged:saved.includes('<base href="'+base+'">'),visibleTextPreserved:report.text.includes('当前已显示的中文')};
   results.push({name,pass:!['blank','hidden'].includes(name)&&Object.values(checks).every(Boolean),checks,report});
  }catch(error){results.push({name,pass:['blank','hidden'].includes(name)&&/空白或隐藏/.test(error.message),error:error.message});}
 }
 const receipt={complete:true,pass:results.every(r=>r.pass),results};
 document.getElementById('result').textContent=JSON.stringify(receipt,null,2);
 await fetch('/result',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(receipt)});
})().catch(error=>document.getElementById('result').textContent=String(error.stack||error));
