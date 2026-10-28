// SPDX-License-Identifier: AGPL-3.0-or-later
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'../assets/quickstart.html'),'utf8');
const start=source.indexOf('function installationFolder(href) {'),end=source.indexOf('\n}',start)+2;
assert.ok(start>=0&&end>start);
const get=vm.runInNewContext('('+source.slice(start,end)+')',{URL,decodeURIComponent});
for(const [url,wanted] of [
 ['file:///C:/Addons/Snapshot/start.html','C:\\Addons\\Snapshot\\extension'],
 ['file:///D:/%E8%BD%AF%E4%BB%B6/Paper%20Snapshot/start.html','D:\\软件\\Paper Snapshot\\extension'],
 ['file:///Users/user/Addons/start.html','/Users/user/Addons/extension'],
 ['file:///home/user/addons/start.html','/home/user/addons/extension']
])assert.equal(get(url),wanted);
assert.match(get('http://127.0.0.1:18771/start.html'),/解压后/);
console.log('PASS quickstart folder paths for Windows, Chinese/spaces, macOS, Linux and HTTP preview');
