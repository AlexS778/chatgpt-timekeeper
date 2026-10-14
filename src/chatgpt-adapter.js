import { prefixLength } from './time.js';

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

export function snapshotEditor(editor) {
  return snapshotPlainEditor(editor) ?? snapshotRichEditor(editor);
}

// The plain-text pathway keeps its existing native editing and undo behavior.
// points[i] is the DOM position corresponding to UTF-16 offset i in the draft.
function snapshotPlainEditor(editor) {
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

const richBlocks = new Set(['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'UL', 'OL', 'PRE', 'BLOCKQUOTE']);

function snapshotRichEditor(editor) {
  const blocks = [...editor.childNodes];
  if (!blocks.length) return null;
  const first = blocks[0];
  // A rich timestamp occupies its own unformatted paragraph.
  const plainPrefix = first.tagName === 'P' &&
    [...first.childNodes].every(node => node.nodeType === 3 ||
      (node.tagName === 'BR' && node.classList.contains('ProseMirror-trailingBreak')));
  const firstText = first.textContent;
  const prefixBlock = plainPrefix && prefixLength(firstText + '\n') === firstText.length + 1 ? first : null;
  const separator = prefixBlock && blocks[1]?.tagName === 'P' && !blocks[1].textContent &&
    [...blocks[1].childNodes].every(node => node.tagName === 'BR') ? blocks[1] : null;
  const body = blocks.slice(prefixBlock ? separator ? 2 : 1 : 0);
  if (!body.length || body.some(node => node.nodeType !== 1 || !richBlocks.has(node.tagName))) return null;

  // Read text only to decide whether there is a draft and bookmark selection.
  // The body is opaque: preserving its complete markup also preserves links,
  // marks, lists, code and ChatGPT's decorated inline-link nodes.
  let text = '';
  const points = [];
  const offsets = new Map();
  function record(node, offset, position = text.length) {
    if (!offsets.has(node)) offsets.set(node, new Map());
    offsets.get(node).set(offset, position);
    points[position] = { node, offset };
  }
  function read(node) {
    if (node.nodeType === 3) {
      for (let index = 0; index <= node.data.length; index++) record(node, index, text.length + index);
      text += node.data;
      return;
    }
    record(node, 0);
    if (node.tagName === 'BR' && !node.classList.contains('ProseMirror-trailingBreak')) text += '\n';
    [...node.childNodes].forEach((child, index) => {
      read(child);
      record(node, index + 1);
    });
  }
  blocks.forEach((block, index) => {
    if (index) text += '\n';
    record(editor, index);
    if (block === separator) record(block, 0);
    else read(block);
  });
  record(editor, blocks.length);
  // An older prefix embedded in a formatted block cannot safely be replaced by
  // the separate-paragraph pathway. Leave that draft unchanged rather than stack.
  if (!prefixBlock && prefixLength(text)) return null;
  return { rich: true, text, points, prefixBlock, prefixBreaks: separator ? 2 : 1,
    bodyHTML: body.map(node => node.outerHTML).join(''),
    offset: (node, offset) => offsets.get(node)?.get(offset) };
}

export function matchesStamp(after, before, plan) {
  return after?.text === plan.text && (before.rich
    ? after.rich && after.prefixBlock && after.bodyHTML === before.bodyHTML
    : !after.rich);
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
  let edits = 0;
  const currentValue = () => textarea ? editor.value : editor.innerHTML;
  const originalValue = currentValue();
  function command(name, value) {
    const before = currentValue();
    try { return document.execCommand(name, false, value); }
    finally { if (currentValue() !== before) edits++; }
  }
  function rollback() {
    for (let index = 0; index < edits && currentValue() !== originalValue; index++) {
      document.execCommand('undo');
    }
    return currentValue() === originalValue;
  }
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
    else if (snapshot.rich) {
      const range = document.createRange();
      if (snapshot.prefixBlock) {
        range.selectNodeContents(snapshot.prefixBlock);
      } else {
        // Insert outside the original blocks so the timestamp inherits no
        // heading, code, bold or link formatting. Never rewrite the rich body.
        range.setStart(editor, 0);
        range.collapse(true);
      }
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      const start = snapshot.points[0], end = snapshot.points[plan.remove];
      if (!start || !end) return false;
      const range = document.createRange();
      range.setStart(start.node, start.offset);
      range.setEnd(end.node, end.offset);
      selection.removeAllRanges();
      selection.addRange(range);
    }
    editor.addEventListener('input', observe);
    const standalone = snapshot.rich && !snapshot.prefixBlock;
    const timestamp = plan.insert.trimEnd();
    let accepted = true;
    if (standalone) {
      // Two paragraphs force a block boundary in Chromium rather than inherit
      // the first link's marks. The empty paragraph is the visible blank line.
      const escape = text => text.replace(/[&<>]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[character]);
      const prefixHTML = `<p>${escape(timestamp)}</p><p></p>`;
      accepted = command('insertHTML', prefixHTML);
    } else {
      accepted = command('insertText', snapshot.rich ? timestamp : plan.insert);
    }
    const after = snapshotEditor(editor);
    if (accepted && nativeInput && matchesStamp(after, snapshot, plan)) {
      completed = true;
      // Keep focus in the editor until its mutation observer reconciles the edit.
      // Restoring focus synchronously can make ProseMirror postpone that reconciliation.
      return () => {
        if (editor.isConnected) restoreSelection(snapshotEditor(editor), true);
        if (previousFocus?.isConnected && previousFocus !== editor) previousFocus.focus({ preventScroll: true });
      };
    }
    // Undo only a command that actually changed this draft. Never set DOM/value directly.
    const reverted = rollback();
    restoreSelection(snapshotEditor(editor), false);
    return reverted ? false : { blocked: true };
  } catch {
    let reverted = false;
    try { reverted = rollback(); } catch { /* Retain an uncertain draft for manual review. */ }
    restoreSelection(snapshotEditor(editor), false);
    return reverted ? false : { blocked: true };
  } finally {
    editor.removeEventListener('input', observe);
    if (!completed && previousFocus?.isConnected && previousFocus !== editor) previousFocus.focus({ preventScroll: true });
  }
}
