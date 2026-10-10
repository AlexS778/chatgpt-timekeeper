import { formatLocalTimestamp, localTimeZone } from './src/time.js';
import { createSettings } from './src/settings.js';

const toggle = document.querySelector('#enabled');
const status = document.querySelector('#status');
const extension = globalThis.browser ?? globalThis.chrome;
document.querySelector('#version').textContent = `Version ${extension.runtime.getManifest().version} · Preview`;
const now = new Date();
const zone = localTimeZone(now);
document.querySelector('#clock').textContent = formatLocalTimestamp(now, zone)
  .slice('[Local time: '.length).split(' | ')[0].replace('T', ' ');
document.querySelector('#zone').textContent = zone;
function showError() {
  status.hidden = false;
  status.textContent = 'Could not save the setting. Reopen the popup to try again.';
}
try {
  const settings = createSettings();
  let current = await settings.read();
  toggle.checked = current;
  toggle.disabled = false;
  settings.watch(value => { current = value; toggle.checked = value; });
  toggle.addEventListener('change', async () => {
    toggle.disabled = true;
    try { await settings.write(toggle.checked); current = toggle.checked; status.hidden = true; }
    catch { toggle.checked = current; showError(); }
    finally { toggle.disabled = false; }
  });
} catch { showError(); }
