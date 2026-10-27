// SPDX-License-Identifier: AGPL-3.0-or-later
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const extension=path.resolve(process.argv[2]),base=path.resolve(process.argv[3]);
const file='offscreen/offscreenSandbox.html';
const actual=fs.readFileSync(path.join(extension,file),'utf8');
const original=fs.readFileSync(path.join(base,file),'utf8');
function policy(html){return html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)"/)[1]
  .split(';').map(x=>x.trim()).filter(Boolean);}
const effective=policy(original).filter(x=>!x.startsWith('frame-ancestors '));
assert.ok(!policy(actual).some(x=>x.startsWith('frame-ancestors ')), 'Ignored meta frame-ancestors directive remains');
assert.deepEqual(policy(actual),effective,'Effective sandbox CSP changed');
assert.ok(effective.includes("default-src 'none'"));
assert.ok(effective.includes("script-src 'self' 'unsafe-eval'"));
assert.ok(effective.includes("form-action 'none'"));
const scripts=html=>Array.from(html.matchAll(/<script src="([^"]+)"/g),x=>x[1]);
assert.deepEqual(scripts(actual),scripts(original),'Sandbox script list changed');
console.log('PASS ignored directive removed; effective CSP and sandbox scripts unchanged');
