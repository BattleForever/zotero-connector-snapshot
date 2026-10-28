// SPDX-License-Identifier: AGPL-3.0-or-later
// Real toolbar action + real Inject.init: first click arrives during page initialization.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const extension=path.resolve(process.argv[2]);
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return{promise,resolve};};
const init=deferred(),detection=deferred(),listeners={};
let handlersInstalled=false,saveCalls=0,saveRoute,settled=false;
const info={url:'https://example.invalid/article',translators:null};
const browser={runtime:{getURL:p=>'chrome-extension://fixture/'+p}};
const document={contentType:'text/html',visibilityState:'visible',readyState:'complete',addEventListener(){}};
const window={location:{protocol:'https:',href:info.url}};window.top=window;
const pageZotero={Promise:{defer:deferred,resolve:Promise.resolve.bind(Promise)},isSafari:false,isDebug:false,
  Utilities:{debounce:fn=>fn},Messaging:{addMessageListener:(name,fn)=>{listeners[name]=fn;}},
  initInject:()=>init.promise,PageSaving:{
    async onPageLoad(){await detection.promise;info.translators=[{translatorID:'fixture'}];},
    async onTranslate(){saveCalls++;saveRoute='translator';return 'saved';},
    async onSaveAsWebpage(){saveCalls++;saveRoute='webpage';return 'saved';}
  }};
vm.runInNewContext(fs.readFileSync(path.join(extension,'inject/inject.js'),'utf8'),
  {Zotero:pageZotero,browser,window,document,console,setTimeout,clearTimeout,URL});
const originalAdd=pageZotero.Inject._addMessageListeners;
pageZotero.Inject._addMessageListeners=function(){originalAdd.call(this);handlersInstalled=true;};
pageZotero.Inject._addZoteroButtonElementListener=()=>{};
pageZotero.Inject._handleOAuthComplete=()=>{};
const message=async(name,args)=>listeners[name]?listeners[name](args):undefined;
const backgroundZotero={isSafari:false,isChromium:true,HostPermissions:{checkChromiumActionPermissions:async()=>true},
  Promise:{delay:ms=>new Promise(r=>setTimeout(r,ms))},Messaging:{sendMessage:message},
  Prefs:{get:()=>false},Connector:{isOnline:true,prefs:{automaticSnapshots:true}},
  Connector_Browser:{getTabInfo:()=>info,
    saveWithTranslator:()=>message('translate',[0,'fixture',{}]),
    saveAsWebpage:()=>message('saveAsWebpage',['fixture',{}])}};
const code=fs.readFileSync(path.join(extension,'background.js'),'utf8');
const helper=code.indexOf('async function _waitForPageScripts(tab) {');
const start=helper<0?code.indexOf('\tasync function _ensureScriptsInjected(tab) {'):helper;
const end=code.indexOf('\n\t/**',code.indexOf('\tasync function _browserAction(tab) {',start));
assert.ok(start>=0&&end>start);
const action=vm.runInNewContext('(function(){'+code.slice(start,end)+';return _browserAction;})()',
  {Zotero:backgroundZotero,self:{},_isBetaBuildBeyondExpiration:false,setTimeout,clearTimeout,console});
(async()=>{
  const pending=action({id:1}).then(value=>{settled=true;return value;});
  for(let i=0;i<12;i++)await Promise.resolve();
  assert.equal(settled,false,'First click returned before page handlers were initialized');
  assert.equal(saveCalls,0);
  init.resolve();
  for(let i=0;i<12;i++)await Promise.resolve();
  assert.equal(handlersInstalled,true);
  assert.equal(saveCalls,0,'Must wait for initial translator detection to preserve PDF/article routing');
  detection.resolve();
  assert.equal(await pending,'saved');
  assert.equal(saveCalls,1);
  assert.equal(saveRoute,'translator');
  console.log('PASS first toolbar click waits for actual page initialization/detection and saves once using original translator route');
})().catch(error=>{console.error(error.message);process.exitCode=1;});
