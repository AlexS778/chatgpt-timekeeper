import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('manifest.json', root), 'utf8'));
const metadata = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));
if (manifest.version !== metadata.version) throw new Error('Manifest and package versions differ');
for (const target of ['firefox', 'chromium']) {
  const destination = new URL(`dist/${target}/`, root);
  // These are generated directories. Remove leftovers before copying the allowlist.
  await rm(destination, { recursive: true, force: true });
  await mkdir(destination, { recursive: true });
  for (const file of ['content.js', 'popup.html', 'popup.css', 'popup.js', 'privacy.html', 'LICENSE', 'icons']) {
    await cp(new URL(file, root), new URL(file, destination), { recursive: true });
  }
  await mkdir(new URL('src/', destination), { recursive: true });
  for (const file of ['time.js', 'settings.js']) await cp(new URL(`src/${file}`, root), new URL(`src/${file}`, destination));
  const browserManifest = structuredClone(manifest);
  if (target === 'firefox') browserManifest.browser_specific_settings = { gecko: {
    id: 'chatgpt-timekeeper@alexs778.github.io',
    strict_min_version: '140.0',
    data_collection_permissions: { required: ['personalCommunications', 'locationInfo'] }
  }, gecko_android: { strict_min_version: '142.0' } };
  await writeFile(new URL('manifest.json', destination), JSON.stringify(browserManifest, null, 2) + '\n');
  console.log(`Prepared dist/${target}/ (unsigned development package)`);
}
