const editorCandidates = 'form .ProseMirror[contenteditable="true"][role="textbox"], form textarea#prompt-textarea, form textarea#mobile-composer-prompt';
const sendCandidates = 'button[type="submit"][aria-label="Send"], button[data-testid="send-button"]';

export function findComposer(document) {
  const editors = [...document.querySelectorAll(editorCandidates)].filter(editor =>
    editor.isConnected && editor.getClientRects().length && !editor.closest('[hidden],[inert],[aria-hidden="true"]') &&
    !editor.disabled && !editor.readOnly);
  if (editors.length !== 1) return null;
  const editor = editors[0];
  const form = editor.closest('form');
  // The observed signed-out desktop page uses this textarea ID and a different English send label.
  const candidates = editor.id === 'mobile-composer-prompt'
    ? 'button[type="submit"][aria-label="Send message"]' : sendCandidates;
  const buttons = [...form.querySelectorAll(candidates)].filter(button => button.getClientRects().length);
  if (buttons.length !== 1) return null;
  return { editor, form, button: buttons[0] };
}

// Accept observed plain paragraphs and literal-paste spans with text/native line breaks.
// Unknown rich nodes fail closed.
// points[i] is the DOM position corresponding to UTF-16 offset i in the draft.
export function snapshotEditor(editor) {
  if (editor.tagName === 'TEXTAREA') return { text: editor.value };
  const paragraphs = [...editor.childNodes];
  if (!paragraphs.length || paragraphs.some(node => node.nodeType !== 1 || node.tagName !== 'P')) return null;
  let text = '';
  const points = [];
  const offsets = new Map();
  function record(node, offset, position = text.length) {
    if (!offsets.has(node)) offsets.set(node, new Map());
    offsets.get(node).set(offset, position);
    points[position] = { node, offset };
  }
  function appendText(node) {
    for (let index = 0; index <= node.data.length; index++) record(node, index, text.length + index);
    text += node.data;
  }
  for (let pIndex = 0; pIndex < paragraphs.length; pIndex++) {
    const paragraph = paragraphs[pIndex];
    if (pIndex) text += '\n';
    record(editor, pIndex);
    record(paragraph, 0);
    const children = [...paragraph.childNodes];
    for (let cIndex = 0; cIndex < children.length; cIndex++) {
      const node = children[cIndex];
      record(paragraph, cIndex);
      if (node.nodeType === 3) {
        appendText(node);
      } else if (node.nodeType === 1 && node.tagName === 'SPAN' && node.attributes.length === 1 &&
          node.getAttribute('data-prompt-literal-paste') === '' && [...node.childNodes].every(child => child.nodeType === 3 ||
            (child.nodeType === 1 && child.tagName === 'BR' && child.attributes.length === 0 && !child.childNodes.length))) {
        // ChatGPT marks pasted plain text with this exact wrapper (observed 2026-10-10).
        // Native prefix insertion can introduce a plain BR inside the span.
        record(node, 0);
        [...node.childNodes].forEach((child, index) => {
          if (child.nodeType === 3) appendText(child);
          else text += '\n';
          record(node, index + 1);
        });
      } else if (node.nodeType === 1 && node.tagName === 'BR') {
        // ProseMirror's trailing BR is a caret helper, not draft text.
        if (!node.classList.contains('ProseMirror-trailingBreak') && children.length !== 1) text += '\n';
      } else return null;
      record(paragraph, cIndex + 1);
    }
  }
  record(editor, paragraphs.length);
  return { text, points, offset: (node, offset) => offsets.get(node)?.get(offset) };
}

export function editPrefix(editor, snapshot, plan) {
  const document = editor.ownerDocument;
  const previousFocus = document.activeElement;
  const textarea = editor.tagName === 'TEXTAREA';
  const selection = document.getSelection();
  let saved;
  if (textarea) {
    saved = { start: editor.selectionStart, end: editor.selectionEnd, direction: editor.selectionDirection };
  } else if (selection?.rangeCount && editor.contains(selection.anchorNode) && editor.contains(selection.focusNode)) {
    saved = { start: snapshot.offset(selection.anchorNode, selection.anchorOffset),
      end: snapshot.offset(selection.focusNode, selection.focusOffset) };
    if (saved.start === undefined || saved.end === undefined) return false;
  }
  let nativeInput = false;
  let completed = false;
  const observe = event => { nativeInput ||= event.isTrusted; };
  const shift = index => index < plan.remove ? plan.insert.length : index + plan.insert.length - plan.remove;
  function restoreSelection(after, changed) {
    if (!saved) return;
    const start = changed ? shift(saved.start) : saved.start;
    const end = changed ? shift(saved.end) : saved.end;
    if (textarea) editor.setSelectionRange(start, end, saved.direction);
    else if (after?.points[start] && after.points[end]) {
      const anchor = after.points[start], focus = after.points[end];
      selection.setBaseAndExtent(anchor.node, anchor.offset, focus.node, focus.offset);
    }
  }
  try {
    editor.focus({ preventScroll: true });
    if (textarea) editor.setSelectionRange(0, plan.remove);
    else {
      const start = snapshot.points[0], end = snapshot.points[plan.remove];
      if (!start || !end) return false;
      const range = document.createRange();
      range.setStart(start.node, start.offset);
      range.setEnd(end.node, end.offset);
      selection.removeAllRanges();
      selection.addRange(range);
    }
    editor.addEventListener('input', observe);
    const accepted = document.execCommand('insertText', false, plan.insert);
    const after = snapshotEditor(editor);
    if (accepted && nativeInput && after?.text === plan.text) {
      completed = true;
      // Keep focus in the editor until its mutation observer reconciles the edit.
      // Restoring focus synchronously can make ProseMirror postpone that reconciliation.
      return () => {
        if (editor.isConnected) restoreSelection(snapshotEditor(editor), true);
        if (previousFocus?.isConnected && previousFocus !== editor) previousFocus.focus({ preventScroll: true });
      };
    }
    // Undo only a command that actually changed this draft. Never set DOM/value directly.
    if (after?.text !== snapshot.text) document.execCommand('undo');
    restoreSelection(snapshotEditor(editor), false);
    return false;
  } catch {
    const after = snapshotEditor(editor);
    if (after?.text !== snapshot.text) {
      try { document.execCommand('undo'); } catch { /* No synthetic second send. */ }
    }
    restoreSelection(snapshotEditor(editor), false);
    return false;
  } finally {
    editor.removeEventListener('input', observe);
    if (!completed && previousFocus?.isConnected && previousFocus !== editor) previousFocus.focus({ preventScroll: true });
  }
}
