// SPDX-License-Identifier: AGPL-3.0-or-later
// Actual sandbox RPC -> actual background messaging, including a tab closing mid-work.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(process.argv[2]);
let delivery=[],lookupError;
const Zotero={initDeferred:{promise:Promise.resolve()},Promise,debug(){}};
const browser={tabs:{
  async get(id){if(lookupError)throw lookupError;return{id};},
  async query(){throw Error('A closed explicit target must never fall back to the active tab');},
  async sendMessage(id,args){delivery.push({id,args});return args[0]==='remote-error'?['error',JSON.stringify({message:'Real translator error'})]:'delivered';}
}};
vm.runInNewContext(fs.readFileSync(path.join(root,'messaging.js'),'utf8'),{Zotero,browser,console});
const Generic=require(path.join(root,'messagingGeneric.js'));
let receive;
new Generic({overrideTarget:Zotero,handlerFunctionOverrides:{'Messaging.sendMessage':true},supportsResponse:true,
  sendMessage(){},addMessageListener(fn){receive=fn;}});
const remote={};
new Generic({overrideTarget:remote,functionOverrides:{'Messaging.sendMessage':true},supportsResponse:true,
  sendMessage:(...args)=>receive(args),addMessageListener(){}});
(async()=>{
  assert.equal(await remote.Messaging.sendMessage('live',[],7,0),'delivered');
  lookupError=new Error('No tab with id: 424242.');
  assert.equal(await remote.Messaging.sendMessage('late-detection',[],424242,0),undefined);
  assert.equal(await Zotero.Messaging.sendToZoteroFrames('late-ui',[],424242),undefined);
  assert.equal(delivery.length,1,'No delivery or active-tab substitution after close');
  lookupError=new Error('Tabs API failed unexpectedly');
  await assert.rejects(()=>remote.Messaging.sendMessage('live',[],7,0),/unexpectedly/);
  lookupError=null;
  await assert.rejects(()=>remote.Messaging.sendMessage('remote-error',[],7,0),/Real translator error/);
  console.log('PASS closed-tab RPC is undeliverable; live routing and real error propagation are preserved');
})().catch(error=>{console.error(error);process.exitCode=1;});
