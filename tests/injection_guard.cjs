// SPDX-License-Identifier: AGPL-3.0-or-later
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const extension=path.resolve(process.argv[2]);
const text=fs.readFileSync(path.join(extension,'background.js'),'utf8');
const start=text.indexOf('this.injectTranslationScripts = async function(');
const end=text.indexOf('\n\tthis.INJECTION_TIMEOUT',start);
const method=text.slice(start,end).trim();
const injected=vm.createContext({});
const config=fs.readFileSync(path.join(extension,'zotero_config.js'),'utf8');
vm.runInContext(config,injected);
const errors=[];
let injections=0;
const Zotero={debug:()=>{},Promise:{defer:()=>{let resolve,reject;const promise=new Promise((ok,no)=>{resolve=ok;reject=no});return{promise,resolve,reject}}},Messaging:{sendMessage:async()=>'pong'},Connector_Browser:{injectScripts:async()=>{injections++;try{vm.runInContext(config,injected)}catch(e){errors.push(e.message)}}}};
const caller=vm.createContext({Zotero,_injectTranslationScripts:['zotero_config.js']});
vm.runInContext('(function(){'+method+'}).call(Zotero.Connector_Browser)',caller);
(async()=>{
  await Zotero.Connector_Browser.injectTranslationScripts({id:1,url:'https://fixture.invalid'},17);
  const injectSource=fs.readFileSync(path.join(extension,'inject/inject.js'),'utf8');
  const prefix=injectSource.slice(0,injectSource.indexOf('// check whether this is a hidden browser window'));
  const listeners={};
  vm.runInNewContext(prefix,{window:{top:{}},Zotero:{Messaging:{addMessageListener:(name,fn)=>listeners[name]=fn}}});
  const childPing=typeof listeners.ping==='function'&&listeners.ping()==='pong';
  const result={pass:injections===0&&errors.length===0&&childPing,injections,errors,initialized_child_frame_answers_ping:childPing};
  console.log(JSON.stringify(result,null,2));
  process.exitCode=result.pass?0:1;
})();
