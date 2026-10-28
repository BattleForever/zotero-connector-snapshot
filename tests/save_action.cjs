// SPDX-License-Identifier: AGPL-3.0-or-later
// Exercise the real toolbar action, including the original translator/PDF/webpage branches.
const fs=require('node:fs'), path=require('node:path'), vm=require('node:vm');
const assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(path.resolve(process.argv[2]),'background.js'),'utf8');
const start=source.indexOf('\tasync function _browserAction(tab) {');
const end=source.indexOf('\n\t/**',start);
assert.ok(start>=0 && end>start);
(async()=>{
  for(const mode of ['translator','pdf','webpage']) {
    let finish, settled=false, called;
    const save=new Promise(resolve=>finish=resolve);
    const tab={id:1};
    const Zotero={HostPermissions:{checkChromiumActionPermissions:async()=>true},
      Prefs:{get:()=>false}, Connector:{isOnline:true,prefs:{automaticSnapshots:true}},
      Connector_Browser:{getTabInfo:()=>({translators:mode==='translator'?[{}]:[],isPDF:mode==='pdf'}),
        saveWithTranslator:(...args)=>{called=args;return save;},
        saveAsWebpage:(...args)=>{called=args;return save;}}};
    const context=vm.createContext({Zotero,self:{},_ensureScriptsInjected:async()=>true,_isBetaBuildBeyondExpiration:false});
    const action=vm.runInContext('('+source.slice(start,end).trim()+')',context);
    const result=action(tab).then(value=>{settled=true;return value;});
    for(let tick=0;tick<8;tick++) await Promise.resolve();
    assert.ok(called,mode+' must use original save route');
    assert.equal(settled,false,mode+' action must await the actual save');
    assert.equal(called[0],tab);
    if(mode!=='translator') assert.equal(called[2].snapshot,true);
    finish('saved:'+mode);
    assert.equal(await result,'saved:'+mode);
  }
  console.log('PASS actual toolbar action retains translator/PDF/webpage routing and save response');
})().catch(error=>{console.error(error.message);process.exitCode=1;});
