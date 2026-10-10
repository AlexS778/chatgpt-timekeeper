// Phase 0 only: run in a fresh ChatGPT test tab's developer console.
// Deferred Phase 0 variant. Reload removes listeners. Not a production adapter.
// Only harmless drafts beginning with the marker below can be modified.
(() => {
  const marker = 'Timekeeper feasibility test';
  const controller = new AbortController();
  let busy = false;
  function onGesture(event) {
    if (!event.isTrusted || busy) return;
    const editors = [...document.querySelectorAll('form .ProseMirror[contenteditable="true"][role="textbox"]')]
      .filter(editor => editor.getClientRects().length);
    if (editors.length !== 1) return;
    const editor = editors[0];
    const form = editor.closest('form');
    const button = form.querySelector('button[type="submit"][aria-label="Send"]');
    if (!button || button.disabled) return;
    if (event.type === 'click') {
      if (event.target.closest?.('button') !== button) return;
    } else if (event.key !== 'Enter' || event.shiftKey || event.ctrlKey || event.altKey || event.metaKey ||
               event.isComposing || event.keyCode === 229 || event.repeat || !editor.contains(event.target)) {
      return;
    }
    const original = editor.innerText;
    if (!original.startsWith(marker)) return;
    busy = true;
    try {
      const now = new Date();
      const pad = n => String(n).padStart(2, '0');
      const offset = -now.getTimezoneOffset();
      const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const iso = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
      const prefix = `[Local time: ${iso}${offset >= 0 ? '+' : '-'}${pad(Math.floor(Math.abs(offset) / 60))}:${pad(Math.abs(offset) % 60)} | ${zone}]\n`;
      const selection = document.getSelection();
      editor.focus();
      const range = document.createRange();
      range.selectNodeContents(editor.firstElementChild || editor);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      let nativeInput = false;
      const observe = input => { nativeInput ||= input.isTrusted; };
      editor.addEventListener('input', observe);
      const accepted = document.execCommand('insertText', false, prefix);
      editor.removeEventListener('input', observe);
      if (accepted && nativeInput && editor.innerText === prefix + original) {
        event.preventDefault();
        event.stopImmediatePropagation();
        queueMicrotask(() => {
          if (editor.isConnected && button.isConnected && !button.disabled && editor.innerText === prefix + original) {
            button.click(); // One continuation of this gesture, never an automatic retry.
          }
        });
      }
      // Diagnostics contain no draft, timestamp, URL, or history.
      console.info('Timekeeper deferred spike', { gesture: event.type, accepted, nativeInput,
        visibleExact: editor.innerText === prefix + original });
    } finally {
      busy = false;
      controller.abort(); // One test attempt only. No automatic retry.
    }
  }
  for (const type of ['click', 'keydown']) {
    window.addEventListener(type, onGesture, { capture: true, signal: controller.signal });
  }
  return 'Timekeeper single-attempt spike armed; reload to remove it.';
})();
