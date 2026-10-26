// SPDX-License-Identifier: AGPL-3.0-or-later
// Runs the real ItemSaver call site, with only destination transports replaced.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const extension = path.resolve(process.argv[2]);
const base = path.resolve(process.argv[3]);
const results = [];
const digest = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
async function test(name, fn) {
  try { await fn(); results.push({name, pass:true}); }
  catch(e) { results.push({name, pass:false, detail:e.message}); }
}
async function main() {
  const context = vm.createContext({Zotero:{Messaging:null,debug:()=>{}}, URL, console, setTimeout, clearTimeout});
  vm.runInContext(fs.readFileSync(path.join(extension,'itemSaver.js'),'utf8'),context);
  await test('original_cloud_fallback_is_preserved',async()=>{
    const saver = new context.Zotero.ItemSaver({sessionID:'parity-fixture'});
    saver._saveToZotero = async()=>{saver._snapshotAttachment={_translatedSnapshot:true};throw {status:0};};
    saver._saveToServer = async()=>({destination:'original-cloud-fallback'});
    const result = await saver.saveItems([]);
    if(result.destination!=='original-cloud-fallback') throw new Error('Original fallback was removed');
  });
  for(const file of ['ui/ProgressWindow.js','progressWindow/progressWindow.js','inject/progressWindow_inject.js','ui/tree/tree.js']) {
    await test('unchanged_original_collection_picker:'+file,()=>{
      if(digest(path.join(extension,file))!==digest(path.join(base,file))) throw new Error('Original picker code changed');
    });
  }
  const result={pass:results.filter(r=>r.pass).length,total:results.length,results};
  console.log(JSON.stringify(result,null,2));
  process.exitCode=result.pass===result.total?0:1;
}
main().catch(e=>{console.error(e);process.exitCode=1;});
