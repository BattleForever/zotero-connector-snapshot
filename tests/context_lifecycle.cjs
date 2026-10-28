// SPDX-License-Identifier: AGPL-3.0-or-later
// Real generated content RPC methods, invalidated before/during a background call.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(process.argv[2]),source=fs.readFileSync(path.join(root,'messaging_inject.js'),'utf8');
function setup(){
  let sends=0,post=0,notices=0,fail;
  const events={},nodes=new Map();
  const runtime={id:'fixture',async sendMessage(){sends++;if(fail)throw fail;return{ok:true};}};
  const browser={runtime};
  const document={body:{prepend(node){notices++;nodes.set(node.id,node);}},
    getElementById:id=>nodes.get(id),createElement:()=>({setAttribute(){}})};
  const window={addEventListener:(name,fn)=>events[name]=fn};window.top=window;
  const Zotero={isChromium:true,debug(){},logError(){},Promise};
  const MESSAGES={Debug:{log:{response:false}},Fixture:{request:{inject:{postReceive:v=>{post++;assert.ok(v);return v;}}}}};
  vm.runInNewContext(source,{Zotero,browser,window,document,MESSAGES,MESSAGE_SEPARATOR:'.',console,
    chrome:{runtime:{onMessage:{addListener(){}}}}});
  Zotero.Messaging.init();
  return{Zotero,browser,events,runtime,get counts(){return{sends,post,notices};},fail(error){fail=error;}};
}
(async()=>{
  let test=setup();
  assert.equal((await test.Zotero.Fixture.request()).ok,true);
  test.browser.runtime=undefined;
  assert.equal(await test.Zotero.Debug.log('late notification'),undefined);
  let cancellation;
  await assert.rejects(()=>test.Zotero.Fixture.request(),e=>{cancellation=e;return e.name==='AbortError'&&/刷新/.test(e.message);});
  assert.deepEqual(test.counts,{sends:1,post:1,notices:1});
  let prevented=false;
  test.events.unhandledrejection({reason:cancellation,preventDefault(){prevented=true;}});
  assert.equal(prevented,true,'Dispose only this context cancellation at the lifecycle boundary');
  prevented=false;
  test.events.unhandledrejection({reason:new Error('Real failure'),preventDefault(){prevented=true;}});
  assert.equal(prevented,false,'Never conceal unrelated rejected operations');
  test=setup();test.fail(new Error('Extension context invalidated.'));
  await assert.rejects(()=>test.Zotero.Fixture.request(),e=>e.name==='AbortError');
  assert.equal(test.counts.post,0);
  test=setup();test.fail(new Error('Real transport failure'));
  await assert.rejects(()=>test.Zotero.Fixture.request(),/Real transport failure/);
  assert.equal(test.counts.notices,0);
  console.log('PASS disposed content context cancels RPC and asks for refresh; live RPC and ordinary failures preserved');
})().catch(error=>{console.error(error);process.exitCode=1;});
