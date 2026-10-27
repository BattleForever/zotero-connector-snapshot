// SPDX-License-Identifier: AGPL-3.0-or-later
// Actual sandbox + background manager + MessagingGeneric, with real MessagePorts.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {MessageChannel} = require('node:worker_threads');
const root = path.resolve(process.argv[2]);
const ports = [];
const pending = [];
let sequence = 0, apiInitializations = 0, translateInitializations = 0;
const defer = () => {
  let resolve;
  const promise = new Promise(r => resolve = r);
  return {promise, resolve};
};
const within = async (promise, label) => {
  let timer;
  try {
    return await Promise.race([promise, new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(label + ' timed out')), 1000);
    })]);
  } finally { clearTimeout(timer); }
};
function context(Zotero) {
  const scope = vm.createContext({Zotero, OFFSCREEN_BACKGROUND_OVERRIDES: {},
    document: {addEventListener() {}}, window: {addEventListener() {}},
    console, setTimeout, setInterval() {}, self: {}});
  vm.runInContext(fs.readFileSync(path.join(root, 'messagingGeneric.js'), 'utf8'), scope);
  return scope;
}
const base = () => ({debug() {}, Utilities: {randomString: () => String(++sequence)}});
const Zotero = {...base(), Debug: {init() {}}, OffscreenTranslate: {init() {
  translateInitializations++;
  Zotero.OffscreenSandbox.addMessageListener('Translate.fixture', value => 'translated:' + value);
}}, async initOffscreen() { apiInitializations++; }};
const sandbox = context(Zotero);
vm.runInContext(fs.readFileSync(path.join(root, 'offscreen/offscreenSandbox.js'), 'utf8'), sandbox);
async function connect(generation) {
  // Each worker generation starts fresh; the offscreen sandbox stays alive.
  const worker = context({...base(), Promise: {defer}});
  vm.runInContext(fs.readFileSync(path.join(root, 'background/offscreenManager.js'), 'utf8'), worker);
  const {port1, port2} = new MessageChannel();
  ports.push(port1, port2);
  const init = Zotero.OffscreenSandbox.init(port1);
  pending.push(init);
  const connected = worker.self.onmessage({data: 'offscreen-port', ports: [port2]});
  await within(connected, 'Worker connection ' + generation);
  await within(worker.Zotero.OffscreenManager.messagingDeferred.promise, 'Worker ready ' + generation);
  const result = await within(worker.Zotero.OffscreenManager.sendMessage.call({
    getOffscreenPage: async () => ({}), _messaging: worker.Zotero.OffscreenManager._messaging
  }, 'Translate.fixture', [String(generation)]), 'First translation after restart ' + generation);
  assert.equal(result, 'translated:' + generation);
  await within(init, 'Sandbox connection ' + generation);
}
(async () => {
  for (let generation = 0; generation < 4; generation++) {
    await connect(generation);
    assert.equal(apiInitializations, 1, 'Reconnection must not reinitialize date/prefs APIs');
    assert.equal(translateInitializations, 1, 'Reconnection must retain translator handlers');
  }
  console.log('PASS cold boot and 3 worker restarts: first translator request responds; APIs initialize once');
})().catch(error => { console.error(error.message); process.exitCode = 1; })
  .finally(() => ports.forEach(port => port.close()));
