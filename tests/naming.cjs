// SPDX-License-Identifier: AGPL-3.0-or-later
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const context = vm.createContext({Zotero:{}});
vm.runInContext(fs.readFileSync(path.join(root, 'src/translated_snapshot.js'), 'utf8'), context);
const helper = context.Zotero.TranslatedSnapshot;
const tests = [
  ['english', () => assert.equal(helper.attachmentTitle({title:'Acoustic sensor'}), '译文快照 · Acoustic sensor')],
  ['chinese', () => assert.equal(helper.attachmentTitle({title:'声学传感器研究'}), '译文快照 · 声学传感器研究')],
  ['blank', () => assert.equal(helper.attachmentTitle({title:' \t '}), '译文快照')],
  ['missing', () => assert.equal(helper.attachmentTitle(), '译文快照')],
  ['formatting', () => assert.equal(helper.attachmentTitle({title:'A <i>surface</i>\n wave\u202e tag'}), '译文快照 · A surface wave tag')],
  ['long unicode', () => {
    const value = helper.attachmentTitle({title:'𠮷'.repeat(121)}).replace('译文快照 · ', '');
    assert.equal(Array.from(value).length, 120);
    assert.equal(value, '𠮷'.repeat(119) + '…');
  }],
  ['citation metadata remains intact', () => {
    const item = {title:'<i>Original</i> title',date:'2026'};
    const before = JSON.stringify(item);
    helper.attachmentTitle(item);
    assert.equal(JSON.stringify(item), before);
  }],
];
for (const [name, test] of tests) { test(); console.log('PASS ' + name); }
console.log(`${tests.length}/${tests.length} naming cases passed`);
