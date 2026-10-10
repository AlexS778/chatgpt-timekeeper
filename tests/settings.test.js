import test from 'node:test';
import assert from 'node:assert/strict';
import { createSettings } from '../src/settings.js';

for (const kind of ['browser', 'chrome']) {
  test(`${kind}: defaults, persistence, live updates, and only enabled is stored`, async () => {
    let values = {}, listener;
    const api = { runtime: {}, storage: { local: {}, onChanged: {
      addListener(fn) { listener = fn; }, removeListener(fn) { assert.equal(listener, fn); listener = null; }
    } } };
    api.storage.local.get = (key, callback) => {
      assert.equal(key, 'enabled');
      if (callback) callback(values); else return Promise.resolve(values);
    };
    api.storage.local.set = (value, callback) => {
      assert.deepEqual(Object.keys(value), ['enabled']);
      values = value;
      if (callback) callback(); else return Promise.resolve();
    };
    const settings = createSettings({ [kind]: api });
    assert.equal(await settings.read(), true);
    await settings.write(false);
    assert.equal(await settings.read(), false);
    let enabled;
    const unsubscribe = settings.watch(value => { enabled = value; });
    listener({ enabled: { newValue: true } }, 'sync');
    assert.equal(enabled, undefined);
    listener({ enabled: { newValue: false } }, 'local');
    assert.equal(enabled, false);
    listener({ enabled: {} }, 'local');
    assert.equal(enabled, true);
    unsubscribe();
    assert.throws(() => settings.write('true'), TypeError);
  });
}
test('missing storage and callback errors are surfaced without logging content', async () => {
  assert.throws(() => createSettings({}));
  const settings = createSettings({ chrome: { runtime: { lastError: { message: 'Denied' } }, storage: {
    onChanged: {}, local: { get(_key, callback) { callback(); } }
  } } });
  await assert.rejects(settings.read(), /Denied/);
});
