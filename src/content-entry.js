import { createSettings } from './settings.js';
import { installInterceptor } from './send-interceptor.js';

// Start disabled until storage resolves, so an unknown preference never mutates a draft.
let enabled = false;
try {
  const settings = createSettings();
  let revision = 0;
  settings.watch(value => { revision++; enabled = value; });
  const initialRevision = revision;
  settings.read().then(value => {
    if (revision === initialRevision) enabled = value;
  }).catch(() => { enabled = false; });
  installInterceptor(window, () => enabled);
} catch { /* Missing extension storage: allow ordinary, unstamped submission. */ }
