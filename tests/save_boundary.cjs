// SPDX-License-Identifier: AGPL-3.0-or-later
// Execute the actual patched ItemSaver method, replacing only transports/capture.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const extension = path.resolve(process.argv[2]);
const calls = [];
const Zotero = {
  debug:()=>{}, logError:()=>{}, Messaging:{sendMessage:()=>{}},
  Utilities:{randomString:()=> 'fixtureid', deepCopy:x=>JSON.parse(JSON.stringify(x))},
  Connector:{getPref:async()=>true,
    callMethod:async(method,data)=>{calls.push({method,data});return {filesEditable:true};},
    saveSingleFile:async(options,data)=>{calls.push({method:'saveSingleFile',data});}},
  SingleFile:{retrievePageData:async()=>'<html><body>synthetic translated content</body></html>'},
};
const context = vm.createContext({Zotero, URL, document:{contentType:'text/html', location:{href:'https://example.invalid/article'}}, console});
vm.runInContext(fs.readFileSync(path.join(extension,'itemSaver.js'),'utf8'), context);
Zotero.TranslatedSnapshot.waitForReady = async url=>({url});
Zotero.TranslatedSnapshot.reportFailure = ()=>{};
(async()=>{
  const item = {id:'fixture-parent',title:'Example article',itemType:'journalArticle',attachments:[
    {id:'fixture-pdf',title:'Full Text PDF',mimeType:'application/pdf',url:'https://example.invalid/article.pdf'},
  ]};
  const saver = new Zotero.ItemSaver({sessionID:'fixture-session',itemType:'journalArticle'});
  const pdfs=[];
  saver._saveAttachmentsToZotero = async()=>{pdfs.push(...item.attachments);};
  await saver.saveItems([item],()=>{});
  const saved = calls.find(call=>call.method==='saveSingleFile').data;
  assert.equal(saved.title, '译文快照 · Example article');
  assert.equal(saved.items[0].id, 'fixture-parent');
  assert.equal(saved.items[0].title, 'Example article');
  assert.equal(pdfs[0].id, 'fixture-pdf');
  assert.equal(pdfs[0].title, 'Full Text PDF');
  saver._snapshotAttachment.title='译文快照未保存';
  await saver._executeSingleFile(()=>{});
  assert.equal(saver._snapshotAttachment.title,'译文快照 · Example article');
  assert.equal(calls.filter(call=>call.method==='saveItems').length,1);
  assert.equal(pdfs.length,1);
  console.log('PASS actual ItemSaver naming, unchanged parent/PDF, retry restores title');
})().catch(error=>{console.error(error);process.exitCode=1;});
