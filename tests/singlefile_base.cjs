// SPDX-License-Identifier: AGPL-3.0-or-later
// Extract and execute the actual bundled parseHTML helper; preserve necessary base changes.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const code=fs.readFileSync(path.join(path.resolve(process.argv[2]),'lib/SingleFile/single-file.js'),'utf8');
const start=code.indexOf('function _h(n,e){'),end=code.indexOf('var Ph=',start);
assert.ok(start>=0&&end>start);
for(const mode of ['same','missing','empty','different','existing']){
 let writes=0,insertions=0;
 const base={getAttribute:()=>mode==='existing'?'https://example.invalid/assets/':null,
  setAttribute(name,value){assert.equal(name,'href');writes++;this.href=value;},remove(){}};
 const doc={baseURI:'https://example.invalid/article',head:{firstChild:null,insertBefore(){insertions++;}},
  querySelector:()=>mode==='existing'?base:null,createElement:()=>base};
 const parse=vm.runInNewContext('('+code.slice(start,end).trim()+')',{ih:class{parseFromString(){return doc;}}});
 const target={same:doc.baseURI,missing:undefined,empty:'',different:'https://example.invalid/other/',existing:'https://example.invalid/other/'}[mode];
 assert.equal(parse('<p>content</p>',target),doc);
 assert.equal(writes,mode==='different'?1:0,mode+' must avoid redundant/invalid base writes');
 assert.equal(insertions,mode==='different'?1:0);
 if(mode==='different')assert.equal(base.href,target);
}
console.log('PASS actual SingleFile parser skips absent/current base and retains existing/different bases');
