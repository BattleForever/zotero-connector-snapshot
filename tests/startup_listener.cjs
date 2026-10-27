// SPDX-License-Identifier: AGPL-3.0-or-later
// Actual initGlobal and messaging caller: an HTTP message arrives while storage is pending.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const extension=path.resolve(process.argv[2]);
const source=fs.readFileSync(path.join(extension,'zotero.js'),'utf8');
const start=source.indexOf('this.initGlobal = async function() {');
const end=source.indexOf('\n\t};',start)+5;
assert.ok(start>=0&&end>start,'Cannot find actual initGlobal method');
const listeners=[];
let finishInit, requests=0;
const initialization=new Promise(resolve=>finishInit=resolve);
const Zotero={Errors:{init:()=>new Promise(()=>{})}, initDeferred:{promise:initialization},
  Promise:{resolve:Promise.resolve.bind(Promise)},COHTTP:{request:async()=>{requests++;return {status:200,response:'fixture'};}}};
const sandbox=vm.createContext({Zotero,global:{},MESSAGE_SEPARATOR:'.',MESSAGES:{COHTTP:{request:{response:true,background:{}}}},
  browser:{runtime:{onMessage:{addListener:fn=>listeners.push(fn)}}},setTimeout,console});
vm.runInContext(fs.readFileSync(path.join(extension,'messaging.js'),'utf8'),sandbox);
vm.runInContext('(function(){'+source.slice(start,end)+'}).call(Zotero)',sandbox);
(async()=>{
  Zotero.initGlobal();
  assert.equal(listeners.length,1,'Runtime listener must be registered before awaiting error-log storage');
  const reply=listeners[0](['COHTTP.request',['GET','https://example.invalid']],{tab:{id:1},frameId:0});
  assert.equal(typeof reply?.then,'function','Early request must retain a response promise');
  await Promise.resolve();
  assert.equal(requests,0,'Request must wait for initialization');
  finishInit();
  const response=await reply;
  assert.equal(response.status,200,JSON.stringify(response));
  assert.equal(response.response,'fixture');
  assert.equal(requests,1);
  assert.equal(listeners.length,1,'Listener must not be registered twice');
  console.log('PASS runtime listener registers synchronously; early HTTP request waits and receives response');
})().catch(error=>{console.error(error.message);process.exitCode=1;});
