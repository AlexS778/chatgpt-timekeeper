import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
const root = new URL('../', import.meta.url);
test('manifest restricts access and has no background or network privileges', async () => {
  const manifest = JSON.parse(await readFile(new URL('manifest.json', root), 'utf8'));
  assert.equal(manifest.manifest_version, 3);
  assert.deepEqual(manifest.permissions, ['storage']);
  assert.deepEqual(manifest.content_scripts[0].matches, ['https://chatgpt.com/*']);
  assert.deepEqual(manifest.content_scripts[0].js, ['content.js']);
  for (const key of ['background', 'host_permissions', 'optional_permissions', 'externally_connectable', 'web_accessible_resources']) {
    assert.equal(manifest[key], undefined);
  }
});
test('shipping source has no network API, telemetry, unsafe HTML or direct submit calls', async () => {
  for (const file of ['content.js', 'popup.js', 'src/time.js', 'src/settings.js']) {
    const code = await readFile(new URL(file, root), 'utf8');
    assert.doesNotMatch(code, /\b(fetch|XMLHttpRequest|WebSocket|sendBeacon|eval)\s*\(|\bnew\s+Function\b/);
    assert.doesNotMatch(code, /\.innerHTML\s*=|\.outerHTML\s*=|insertAdjacentHTML\s*\(/);
    assert.doesNotMatch(code, /\.requestSubmit\s*\(|\.submit\s*\(|\.dispatchEvent\s*\(/);
    assert.doesNotMatch(code, /\bconsole\s*\./);
  }
});
test('assembled content script matches source', () => {
  execFileSync(process.execPath, ['scripts/build.mjs', '--check'], { cwd: root });
});
