import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const files = ['LICENSE', 'content.js', 'manifest.json', 'popup.css', 'popup.html', 'popup.js', 'src/settings.js', 'src/time.js'];
const base = JSON.parse(await readFile(new URL('manifest.json', root), 'utf8'));
const metadata = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));
const lock = JSON.parse(await readFile(new URL('package-lock.json', root), 'utf8'));
assert.equal(base.version, metadata.version);
assert.equal(lock.version, metadata.version);
assert.equal(lock.packages[''].version, metadata.version);
assert.deepEqual(base.permissions, ['storage']);
assert.deepEqual(base.content_scripts[0].matches, ['https://chatgpt.com/*']);

async function list(directory, prefix = '') {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const name = prefix + entry.name;
    if (entry.isDirectory()) result.push(...await list(new URL(`${entry.name}/`, directory), `${name}/`));
    else {
      assert.ok(entry.isFile(), `Unexpected non-file: ${name}`);
      result.push(name);
    }
  }
  return result.sort();
}

for (const target of ['chromium', 'firefox']) {
  const directory = new URL(`dist/${target}/`, root);
  assert.deepEqual(await list(directory), files, `${target}: unexpected package contents`);
  for (const file of files.filter(file => file !== 'manifest.json')) {
    assert.deepEqual(await readFile(new URL(file, directory)), await readFile(new URL(file, root)), `${target}: stale ${file}`);
  }
  const manifest = JSON.parse(await readFile(new URL('manifest.json', directory), 'utf8'));
  if (target === 'firefox') {
    assert.deepEqual(manifest.browser_specific_settings, { gecko: {
      id: 'chatgpt-timekeeper@extensions.local', strict_min_version: '140.0',
      data_collection_permissions: { required: ['none'] }
    } });
    delete manifest.browser_specific_settings;
  }
  assert.deepEqual(manifest, base, `${target}: unexpected manifest changes`);
  console.log(`Verified dist/${target}/: ${files.length} allowlisted files, source equality and manifest`);
}
