// SPDX-License-Identifier: AGPL-3.0-or-later
// Synthetic content. Actual Zotero and PDF transports are replaced by recording stubs.
(async()=>{
 const results=[];
 const article=document.getElementById('article');
 const output=document.getElementById('result');
 const english='This original English article has no translation plug-in markers. The snapshot must save the current visible page alongside its PDF and preserve the same regular parent item. No language-specific gate should block an ordinary unmodified paper page.';
 const chinese='这段中文是在页面加载后插入的合成译文。网页快照应保留当前已经显示的内容；不需要识别翻译插件，也不需要先达到规定的译文字数。';
 const assert=(ok,message)=>{if(!ok)throw Error(message);};
 Zotero.SingleFile._hooksInjected=true;
 Zotero.SingleFile.singleFileFetch=(url,options)=>fetch(url,options);
 const getPageData=singlefile.getPageData;
 const retrieve=Zotero.SingleFile.retrievePageData;
 for(const name of ['original','translated','without-markers','blank-output','hidden-output']){
  try{
   window.fixture={calls:[],snapshots:[],pdfs:[],errors:[],progress:[]};
   article.replaceChildren();
   const para=document.createElement('p');para.textContent=english;article.appendChild(para);
   if(name==='translated'||name==='without-markers'){
    const runtime=document.createElement('p');runtime.textContent=chinese;
    if(name==='translated')runtime.className='immersive-translate-target-inner';
    article.appendChild(runtime);
   }
   Zotero.SingleFile.retrievePageData=retrieve;
   if(name==='blank-output'||name==='hidden-output'){
    Zotero.SingleFile.retrievePageData=async function(options){
     await getPageData(await this._getConfig(),{fetch:(url,init)=>fetch(url,init)});
     const content=name==='blank-output'?'<html><body></body></html>':'<html><head><style>body{display:none!important}</style></head><body>Hidden article</body></html>';
     const report=await Zotero.PageSnapshot.validate(content,options.pageContext);
     return Zotero.PageSnapshot.annotate(content,report);
    };
   }
   const item={id:'fixture-parent',itemType:'journalArticle',title:'Synthetic article',url:location.href,
    attachments:[{id:'fixture-pdf',title:'Original PDF',mimeType:'application/pdf',url:'https://example.invalid/a.pdf'}]};
   const saver=new Zotero.ItemSaver({sessionID:'fixture-'+name,itemType:'journalArticle',baseURI:location.href});
   saver._saveAttachmentsToZotero=async()=>{fixture.pdfs.push(...item.attachments);};
   await saver.saveItems([item],(attachment,progress,error)=>fixture.progress.push({title:attachment.title,progress,error}));
   assert(fixture.pdfs.length===1&&fixture.pdfs[0].parentItem==='fixture-parent','PDF parent changed');
   if(name==='blank-output'||name==='hidden-output'){
    assert(fixture.snapshots.length===0,'Invalid output was sent to Zotero');
    assert(fixture.progress.some(p=>p.progress===false&&p.title==='网页快照未保存'),'Missing visible failure');
   }else{
    assert(fixture.snapshots.length===1,'Snapshot not saved: '+fixture.errors.join(';'));
    const saved=fixture.snapshots[0];
    assert(saved.title==='网页快照 · Synthetic article','Wrong snapshot title');
    assert(saved.items[0].id==='fixture-parent','Snapshot parent changed');
    assert(saved.snapshotContent.includes(english),'Original text missing');
    if(name!=='original')assert(saved.snapshotContent.includes(chinese),'Runtime Chinese text missing');
    assert(saved.snapshotContent.includes('zotero-page-snapshot'),'No capture receipt marker');
   }
   results.push({name,pass:true});
  }catch(error){results.push({name,pass:false,error:error.stack||String(error)});}
  output.textContent=JSON.stringify({pass:results.filter(r=>r.pass).length,total:5,complete:results.length===5,results},null,2);
 }
 Zotero.SingleFile.retrievePageData=retrieve;
})().catch(error=>{document.getElementById('result').textContent=JSON.stringify({complete:true,pass:0,error:String(error)});});
