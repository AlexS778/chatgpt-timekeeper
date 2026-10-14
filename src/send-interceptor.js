import { findComposer, snapshotEditor, editPrefix, matchesStamp } from './chatgpt-adapter.js';
import { planStamp } from './time.js';

export function installInterceptor(window, isEnabled, clock = () => new Date()) {
  const busy = new WeakSet();
  const composing = new WeakSet();
  // A click can synchronously trigger submit; an Enter can trigger click then submit.
  // Guard only that event turn. A later retry always gets a fresh timestamp.
  const attempted = new WeakSet();
  function handle(event) {
    if (!isEnabled() || !event.isTrusted || event.defaultPrevented) return;
    const composer = findComposer(window.document);
    if (!composer) return;
    const { editor, button } = composer;
    if (button.disabled || button.getAttribute('aria-disabled') === 'true' || composing.has(editor)) return;
    if (event.type === 'keydown') {
      if (!editor.contains(event.target) || event.key !== 'Enter' || event.shiftKey || event.ctrlKey ||
          event.altKey || event.metaKey || event.isComposing || event.keyCode === 229 || event.repeat) return;
    } else if (event.type === 'click') {
      if (event.target.closest?.('button') !== button || event.button !== 0) return;
    } else {
      // Submit is only a secondary signal of a gesture already handled above.
      // requestSubmit() alone is not evidence of a legitimate user gesture.
      return;
    }
    if (busy.has(editor)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    if (attempted.has(editor)) return;
    const snapshot = snapshotEditor(editor);
    if (!snapshot) return;
    const plan = planStamp(snapshot.text, clock());
    if (!plan) return;
    if (snapshot.rich) {
      const breaks = snapshot.prefixBlock ? snapshot.prefixBreaks : 2;
      const line = plan.insert.slice(0, -1);
      plan.remove = snapshot.prefixBlock ? snapshot.prefixBlock.textContent.length + breaks : 0;
      plan.insert = line + '\n'.repeat(breaks);
      plan.text = plan.insert + snapshot.text.slice(plan.remove);
    }
    attempted.add(editor);
    window.setTimeout(() => attempted.delete(editor), 0);
    busy.add(editor);
    let deferred = false;
    try {
      const restore = editPrefix(editor, snapshot, plan);
      if (!restore) return;
      // Wait for both native-edit reconciliation and the original activation to
      // finish. Chromium suppresses a simulated click reentered from a microtask
      // inside keyboard/accessible button activation. A task releases that guard.
      event.preventDefault();
      event.stopImmediatePropagation();
      // A failed rollback leaves a draft for manual review, never a continuation.
      if (restore.blocked) return;
      window.setTimeout(() => {
        try {
          try { restore(); } catch { /* Focus restoration must never cause a second send. */ }
          const current = findComposer(window.document);
          if (current?.editor !== editor || current.button.disabled ||
              current.button.getAttribute('aria-disabled') === 'true' ||
              !matchesStamp(snapshotEditor(editor), snapshot, plan)) return;
          current.button.click();
        } finally { busy.delete(editor); }
      }, 0);
      deferred = true;
    }
    finally { if (!deferred) busy.delete(editor); }
    // No automatic retries. A synthetic continuation is ignored by this interceptor.
  }
  const onComposition = event => {
    if (event.type === 'compositionstart') composing.add(event.target);
    else composing.delete(event.target);
  };
  for (const type of ['click', 'keydown', 'submit']) window.addEventListener(type, handle, true);
  for (const type of ['compositionstart', 'compositionend']) window.addEventListener(type, onComposition, true);
  return () => {
    for (const type of ['click', 'keydown', 'submit']) window.removeEventListener(type, handle, true);
    for (const type of ['compositionstart', 'compositionend']) window.removeEventListener(type, onComposition, true);
  };
}
