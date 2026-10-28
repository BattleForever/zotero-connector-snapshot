// SPDX-License-Identifier: AGPL-3.0-or-later
// The actual bundled SingleFile parseHTML function under a real HTTP base-uri restriction.
(async()=>{
 const cases=[];
 for(const [name,url] of [['same-document',location.href],['missing',undefined],['empty','']]){
  const doc=parseSingleFileHTML('<html><head><title>Synthetic</title></head><body><a href="relative.pdf">Original 当前中文</a></body></html>',url);
  cases.push({name,baseCount:doc.querySelectorAll('base').length,baseURI:doc.baseURI,href:doc.querySelector('a').href,
   text:doc.body.textContent});
 }
 // Native CSP reporting is asynchronous; wait in the fixture, never in UI automation.
 await new Promise(r=>setTimeout(r,500));
 const evidence=await fetch('/reports').then(r=>r.json());
 const result={complete:true,pass:cases.every(c=>c.baseCount===0&&c.baseURI===location.href&&c.href===new URL('relative.pdf',location.href).href)&&evidence.length===0,
  cases,nativeCSPReports:evidence};
 document.getElementById('result').textContent=JSON.stringify(result,null,2);
 await fetch('/result',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(result)});
})().catch(error=>document.getElementById('result').textContent=String(error.stack||error));
