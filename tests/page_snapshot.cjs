// SPDX-License-Identifier: AGPL-3.0-or-later
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const context = vm.createContext({Zotero:{}});
vm.runInContext(fs.readFileSync(path.join(root,'src/page_snapshot.js'),'utf8'),context);
const helper = context.Zotero.PageSnapshot;
function page(text, display='block') {
  const doc={location:{href:'https://example.invalid/article'}, contentType:'text/html',
    querySelectorAll:selector=>{assert.equal(selector,'*');return [];},
    defaultView:{getComputedStyle:()=>({display,visibility:'visible',opacity:'1'})}};
  doc.body={innerText:text,getClientRects:()=>[{}],ownerDocument:doc,getRootNode:()=>doc};
  return doc;
}
(async()=>{
  const original=page('An original English paper without any translation add-on.');
  const report=await helper.waitForReady(original.location.href,original);
  assert.ok(report.pageChars>0);
  assert.equal(report.url,original.location.href);
  const translated=page('English abstract. 这是当前页面已经显示的中文摘要。');
  assert.ok((await helper.waitForReady(translated.location.href,translated)).pageChars>0);
  const short=page('A short abstract.');
  assert.ok((await helper.waitForReady(short.location.href,short)).pageChars>0);
  const empty=page(' \n ');
  await assert.rejects(()=>helper.waitForReady(empty.location.href,empty),/没有可见正文/);
  const hidden=page('hidden article','none');
  await assert.rejects(()=>helper.waitForReady(hidden.location.href,hidden),/没有可见正文/);
  await assert.rejects(()=>helper.waitForReady('https://example.invalid/other',original),/页面地址已改变/);
  assert.ok(helper.isEligible([{}],'journalArticle',original));
  assert.ok(!helper.isEligible([{},{}],'journalArticle',original));
  assert.ok(!helper.isEligible([{}],'multiple',original));
  assert.ok(!helper.isEligible([{}],'journalArticle',{...original,contentType:'application/pdf'}));
  console.log('PASS original, translated and short pages; blank/hidden/navigation guards; eligibility');
})().catch(error=>{console.error(error);process.exitCode=1;});
