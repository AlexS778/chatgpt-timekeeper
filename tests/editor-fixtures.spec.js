import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
const html = await readFile(new URL('./fixtures/composer.html', import.meta.url), 'utf8');
// An explicit bundle path also lets these checks verify an extracted release ZIP.
const content = await readFile(process.env.TIMEKEEPER_CONTENT_SCRIPT ?? new URL('../content.js', import.meta.url), 'utf8');
const formattedSample = await readFile(new URL('./fixtures/add-two-numbers.html', import.meta.url), 'utf8');
const old = '[Local time: 2024-02-29T20:02:00+03:00 | Europe/Moscow]\n';

async function setup(page, kind = 'contenteditable') {
  await page.route('http://fixture.test/**', async route => {
    const path = new URL(route.request().url()).pathname.slice(1);
    const body = path === 'composer.html' ? html : await readFile(new URL(`../${path}`, import.meta.url));
    await route.fulfill({ body, contentType: path.endsWith('.js') ? 'text/javascript' : 'text/html' });
  });
  await page.goto('http://fixture.test/composer.html');
  await page.waitForFunction(() => window.fixture?.bind);
  if (kind !== 'contenteditable') await page.evaluate(kind => {
    const form = document.querySelector('#composer');
    const textarea = document.createElement('textarea');
    textarea.id = kind === 'guest-textarea' ? 'mobile-composer-prompt' : 'prompt-textarea';
    form.querySelector('[contenteditable]').replaceWith(textarea);
    if (kind === 'guest-textarea') form.querySelector('button').setAttribute('aria-label', 'Send message');
    // Replace the form to remove old submit listeners before rebinding.
    form.replaceWith(form.cloneNode(true)); fixture.bind();
  }, kind);
  await page.addScriptTag({ content });
  await page.clock.install({ time: new Date('2026-10-10T17:02:00Z') });
  const editor = page.locator('#composer textarea, #composer .ProseMirror[contenteditable]');
  return editor;
}
async function fillDraft(editor, text) {
  if (await editor.evaluate(element => element.tagName === 'TEXTAREA')) await editor.fill(text);
  else await editor.evaluate((_element, value) => fixture.setDraft(value), text);
}
async function sent(page) { return page.evaluate(() => fixture.messages); }
function unstamped(message) { return message.slice(message.indexOf('\n') + 1); }

for (const gesture of ['click', 'Enter']) {
  test(`formatted LeetCode paste: ${gesture} preserves every model node and sends once`, async ({ page }) => {
    const editor = await setup(page);
    await editor.evaluate((_element, html) => fixture.setFormattedDraft(html), formattedSample);
    const before = await page.evaluate(() => ({ text: fixture.model, doc: fixture.view.state.doc.toJSON() }));
    if (gesture === 'click') await page.locator('#composer button[type="submit"]').click();
    else await editor.press('Enter');
    await expect.poll(() => sent(page)).toHaveLength(1);
    const message = (await sent(page))[0];
    expect(message).toMatch(/^\[Local time:/);
    expect(unstamped(message)).toBe('\n' + before.text);
    const doc = await page.evaluate(() => fixture.documents[0]);
    expect(doc.content.slice(2)).toEqual(before.doc.content);
    expect(doc.content[0]).toEqual({ type: 'paragraph', content: [{ type: 'text', text: message.split('\n')[0] }] });
    await page.clock.runFor(1000);
    expect(await page.evaluate(() => fixture.submissions)).toBe(1);
  });
}

for (const [kind, html] of [
  ['heading', '<h2><em>Heading 👋</em></h2><p>Keep <strong>bold</strong> and <code>code</code>.</p>'],
  ['list', '<ol start="3"><li><p>First <strong>item</strong></p><ul><li><p>Nested item 👋</p></li></ul></li><li><p>Second item</p></li></ol>'],
  ['code block', '<pre><code>func add(a, b int) int {\n\treturn a + b\n}\n</code></pre>'],
  ['inline marks', '<p><strong><a href="https://example.com/problem">Bold link</a></strong>, <em>italics</em>, <code>&lt;value&gt;</code> and<br>a hard break 👋.</p>'],
  ['literal markup', '<p><strong>&lt;script&gt;alert("keep this literal")&lt;/script&gt;</strong> &amp; &lt;img src=x onerror=alert(1)&gt;</p>']
]) {
  test(`formatted ${kind}: prefix is plain and original document is preserved`, async ({ page }) => {
    const editor = await setup(page);
    await editor.evaluate((_element, html) => fixture.setFormattedDraft(html), html);
    const before = await page.evaluate(() => ({ text: fixture.model, doc: fixture.view.state.doc.toJSON() }));
    if (kind === 'code block') expect(before.doc.content[0].type).toBe('code_block');
    await editor.press('Enter');
    await expect.poll(() => sent(page)).toHaveLength(1);
    expect((await sent(page))[0]).toMatch(/^\[Local time:/);
    expect(unstamped((await sent(page))[0])).toBe('\n' + before.text);
    const doc = await page.evaluate(() => fixture.documents[0]);
    expect(doc.content.slice(2)).toEqual(before.doc.content);
    expect(doc.content[0].content).toEqual([{ type: 'text', text: (await sent(page))[0].split('\n')[0] }]);
    expect(await page.evaluate(() => fixture.submissions)).toBe(1);
  });
}

test('formatted draft: selection, undo of a separate edit and explicit retry preserve the rich document', async ({ page }) => {
  const editor = await setup(page);
  await editor.evaluate((_element, html) => fixture.setFormattedDraft(html + '<p>Tail 👋</p>'), formattedSample);
  const before = await page.evaluate(() => ({ text: fixture.model, doc: fixture.view.state.doc.toJSON() }));
  // The editor groups adjacent edits shortly after paste. Finish that history
  // group before checking that one undo removes only the timestamp edit.
  await page.clock.runFor(1000);
  await editor.evaluate(element => {
    const text = element.lastElementChild.firstChild;
    document.getSelection().setBaseAndExtent(text, text.length - 2, text, text.length);
    fixture.failedSend = true;
  });
  await editor.press('Enter');
  await expect.poll(() => page.evaluate(() => fixture.submissions)).toBe(1);
  await expect.poll(() => page.evaluate(() => fixture.model)).toMatch(/^\[Local time:/);
  await expect.poll(() => editor.evaluate(() => document.getSelection().toString())).toBe('👋');
  expect(await page.evaluate(() => fixture.view.state.doc.toJSON().content.slice(2))).toEqual(before.doc.content);
  await editor.press('ControlOrMeta+z');
  await expect.poll(() => page.evaluate(() => fixture.view.state.doc.toJSON())).toEqual(before.doc);
  await page.clock.runFor(2000);
  await page.locator('#composer button[type="submit"]').click();
  await expect.poll(() => page.evaluate(() => fixture.submissions)).toBe(2);
  const firstStamp = await page.evaluate(() => fixture.model);
  await page.clock.runFor(2000);
  await page.evaluate(() => { fixture.failedSend = false; });
  await editor.press('Enter');
  await expect.poll(() => sent(page)).toHaveLength(1);
  const message = (await sent(page))[0];
  expect(message).not.toBe(firstStamp);
  expect(message.match(/\[Local time:/g)).toHaveLength(1);
  expect(unstamped(message)).toBe('\n' + before.text);
  expect(await page.evaluate(() => fixture.documents[0].content.slice(2))).toEqual(before.doc.content);
  await page.clock.runFor(1000);
  expect(await page.evaluate(() => fixture.submissions)).toBe(3);
});

test('formatted paste: formatting changed while pending cancels submission even when text is identical', async ({ page }) => {
  const editor = await setup(page);
  await editor.evaluate((_element, html) => fixture.setFormattedDraft(html), formattedSample);
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 60_000));
  await page.locator('#composer button[type="submit"]').click();
  const stamped = await page.evaluate(() => fixture.model);
  expect(stamped).toMatch(/^\[Local time:/);
  await page.evaluate(() => {
    const view = fixture.view;
    const start = view.state.doc.firstChild.nodeSize + view.state.doc.child(1).nodeSize + 1;
    view.dispatch(view.state.tr.addMark(start, start + 1, view.state.schema.mark('em')));
  });
  expect(await page.evaluate(() => fixture.model)).toBe(stamped);
  await page.clock.runFor(1000);
  expect(await sent(page)).toHaveLength(0);
  expect(await page.evaluate(() => fixture.submissions)).toBe(0);
});

test('formatted paste: native mismatch is undone without losing links or marks', async ({ page }) => {
  const editor = await setup(page);
  await editor.evaluate((_element, html) => fixture.setFormattedDraft(html), formattedSample);
  const before = await page.evaluate(() => ({ text: fixture.model, doc: fixture.view.state.doc.toJSON() }));
  await page.evaluate(() => {
    const native = document.execCommand.bind(document);
    document.execCommand = (command, ui, value) => native(command, ui, command === 'insertHTML' ? '<p>Wrong prefix</p>' : value);
  });
  await editor.press('Enter');
  await expect.poll(() => sent(page)).toHaveLength(1);
  expect(await sent(page)).toEqual([before.text]);
  expect(await page.evaluate(() => fixture.documents[0])).toEqual(before.doc);
  await page.clock.runFor(1000);
  expect(await page.evaluate(() => fixture.submissions)).toBe(1);
});

test('formatted paste: an unverified edit with failed rollback is retained without any submission', async ({ page }) => {
  const editor = await setup(page);
  await editor.evaluate((_element, html) => fixture.setFormattedDraft(html), formattedSample);
  await page.evaluate(() => {
    const native = document.execCommand.bind(document);
    document.execCommand = (command, ...args) => {
      if (command === 'undo') return false;
      if (command === 'insertHTML') { native(command, ...args); return false; }
      return native(command, ...args);
    };
  });
  await editor.press('Enter');
  await page.clock.runFor(2000);
  expect(await page.evaluate(() => fixture.model)).toMatch(/^\[Local time:/);
  expect(await sent(page)).toHaveLength(0);
  expect(await page.evaluate(() => fixture.submissions)).toBe(0);
});

test('formatted draft: refresh a separate legacy prefix without stacking or changing the body', async ({ page }) => {
  const editor = await setup(page);
  await editor.evaluate((_element, html) => fixture.setFormattedDraft(html), `<p>${old.trimEnd()}</p>${formattedSample}`);
  const before = await page.evaluate(() => fixture.view.state.doc.toJSON());
  await editor.press('Enter');
  await expect.poll(() => sent(page)).toHaveLength(1);
  const message = (await sent(page))[0];
  expect(message).toMatch(/^\[Local time: 2026-10-10 /);
  expect(message.match(/\[Local time:/g)).toHaveLength(1);
  expect(await page.evaluate(() => fixture.documents[0].content.slice(1))).toEqual(before.content.slice(1));
  expect(await page.evaluate(() => fixture.submissions)).toBe(1);
});

for (const kind of ['textarea', 'guest-textarea', 'contenteditable']) {
  for (const key of ['Space', 'Enter']) test(`${kind}: Tab to Send then ${key} submits the stamped framework model once`, async ({ page }) => {
    const editor = await setup(page, kind);
    const draft = 'Focused Send Привет 👋';
    await fillDraft(editor, draft);
    await editor.focus();
    await editor.press('Tab');
    const button = page.locator('#composer button[type="submit"]');
    await expect(button).toBeFocused();
    await button.press(key);
    await expect.poll(() => sent(page)).toHaveLength(1);
    expect(unstamped((await sent(page))[0])).toBe(draft);
    expect((await sent(page))[0].match(/\[Local time:/g)).toHaveLength(1);
    await page.clock.runFor(1000);
    expect(await sent(page)).toHaveLength(1);
  });
  test(`${kind}: pending activation suppresses a second gesture and never retries a failed send`, async ({ page }) => {
    const editor = await setup(page, kind);
    const draft = '  Привет 👋\n\n```js\nconst a = "<b>";\n```\n尾\n';
    await fillDraft(editor, draft);
    await page.clock.pauseAt(await page.evaluate(() => Date.now() + 60_000));
    await page.evaluate(() => { fixture.failedSend = true; });
    await editor.focus(); await editor.press('Tab');
    const button = page.locator('#composer button[type="submit"]');
    await expect(button).toBeFocused();
    await button.press('Space');
    const stamped = await page.evaluate(() => fixture.model);
    expect(unstamped(stamped)).toBe(draft);
    await button.press('Space');
    await page.clock.runFor(1000);
    expect(await sent(page)).toHaveLength(0);
    expect(await page.evaluate(() => fixture.submissions)).toBe(1);
    expect(await page.evaluate(() => fixture.model)).toBe(stamped);
    await page.evaluate(() => { fixture.failedSend = false; });
    // Only an explicit new user gesture retries, refreshing the prefix once.
    await button.press('Space'); await page.clock.runFor(1000);
    expect(await sent(page)).toHaveLength(1);
    expect(await page.evaluate(() => fixture.submissions)).toBe(2);
    const message = (await sent(page))[0];
    expect(message).not.toBe(stamped);
    expect(unstamped(message)).toBe(draft);
    expect(message.match(/\[Local time:/g)).toHaveLength(1);
    await page.clock.runFor(1000);
    expect(await sent(page)).toHaveLength(1);
  });
  test(`${kind}: a draft changed before continuation is retained without submission`, async ({ page }) => {
    const editor = await setup(page, kind);
    await fillDraft(editor, 'Original');
    await page.clock.pauseAt(await page.evaluate(() => Date.now() + 60_000));
    await editor.press('Tab');
    await page.locator('#composer button[type="submit"]').press('Space');
    await fillDraft(editor, 'Edited while pending 👋');
    await page.clock.runFor(1000);
    expect(await sent(page)).toHaveLength(0);
    expect(await page.evaluate(() => fixture.submissions)).toBe(0);
    expect(await page.evaluate(() => fixture.model)).toBe('Edited while pending 👋');
    await editor.press('Enter'); await page.clock.runFor(1000);
    expect(await sent(page)).toHaveLength(1);
    expect(unstamped((await sent(page))[0])).toBe('Edited while pending 👋');
  });
  test(`${kind}: click and Enter update the controlled model exactly once`, async ({ page }) => {
    const editor = await setup(page, kind);
    const draft = '  Привет 👋\n```js\nconst a = "<b>";\n```\n尾\n';
    await fillDraft(editor, draft);
    await page.evaluate(() => {
      fixture.nativeInsertions = 0;
      const native = document.execCommand.bind(document);
      document.execCommand = (command, ...args) => {
        if (command === 'insertText') fixture.nativeInsertions++;
        return native(command, ...args);
      };
    });
    const before = await page.evaluate(() => fixture.inputs);
    await page.locator('#composer button[type="submit"]').click();
    await expect.poll(() => sent(page)).toHaveLength(1);
    let messages = await sent(page);
    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatch(/^\[Local time: 2026-10-10 \d{2}:\d{2}:\d{2} GMT[+-]\d{1,2}(?::\d{2})?\]\n/);
    expect(unstamped(messages[0])).toBe(draft);
    // A newline insertion emits multiple input events in Chromium. Count editing
    // commands and submitted messages, rather than assuming one event per command.
    expect(await page.evaluate(() => fixture.inputs)).toBeGreaterThan(before);
    expect(await page.evaluate(() => fixture.nativeInsertions)).toBe(1);
    await page.clock.runFor(1000);
    await fillDraft(editor, 'Second message'); await editor.press('Enter');
    await expect.poll(() => sent(page)).toHaveLength(2);
    messages = await sent(page);
    expect(messages).toHaveLength(2);
    expect(unstamped(messages[1])).toBe('Second message');
    expect(await page.evaluate(() => fixture.nativeInsertions)).toBe(2);
  });
  test(`${kind}: retry refreshes prefix, selection follows original text, undo restores draft`, async ({ page }) => {
    const editor = await setup(page, kind);
    await fillDraft(editor, old + 'Original 👋');
    await editor.evaluate(element => {
      element.focus();
      if (element.tagName === 'TEXTAREA') element.setSelectionRange(element.value.length - 2, element.value.length);
      else { const text = element.lastElementChild.firstChild; document.getSelection().setBaseAndExtent(text, text.length - 2, text, text.length); }
      fixture.failedSend = true;
    });
    await editor.press('Enter');
    await expect.poll(() => page.evaluate(() => fixture.submissions)).toBe(1);
    expect(await sent(page)).toHaveLength(0);
    const value = await page.evaluate(() => fixture.model);
    expect(unstamped(value)).toBe('Original 👋'); expect(value.includes('2024')).toBe(false);
    await expect.poll(() => editor.evaluate(element => element.tagName === 'TEXTAREA'
      ? element.value.slice(element.selectionStart, element.selectionEnd) : document.getSelection().toString())).toBe('👋');
    await editor.press('ControlOrMeta+z');
    await expect.poll(() => page.evaluate(() => fixture.model)).toBe(old + 'Original 👋');
    await page.clock.runFor(2000);
    await page.evaluate(() => { fixture.failedSend = false; });
    await editor.press('Enter');
    await expect.poll(() => sent(page)).toHaveLength(1);
    expect(unstamped((await sent(page))[0])).toBe('Original 👋');
  });
  test(`${kind}: disabled, blank, Shift+Enter, modifiers, composition and unrelated controls`, async ({ page }) => {
    const editor = await setup(page, kind);
    await fillDraft(editor, 'Hello'); await editor.press('Shift+Enter');
    expect(await sent(page)).toHaveLength(0);
    expect(await page.evaluate(() => fixture.model)).not.toContain('[Local time:');
    await editor.press('Alt+Enter');
    await editor.dispatchEvent('compositionstart'); await editor.press('Enter');
    expect(await page.evaluate(() => fixture.model)).not.toContain('[Local time:');
    await editor.dispatchEvent('compositionend');
    await page.locator('#search').fill('Search text'); await page.locator('#unrelated').click();
    expect(await page.evaluate(() => fixture.model)).not.toContain('[Local time:');
    await page.evaluate(() => browser.storage.local.set({ enabled: false }));
    await fillDraft(editor, 'Disabled'); await editor.press('Enter');
    expect((await sent(page)).at(-1)).toBe('Disabled');
    await page.evaluate(() => browser.storage.local.set({ enabled: true }));
    await page.clock.runFor(1000); await fillDraft(editor, ' \n\t'); await editor.press('Enter');
    expect((await sent(page)).at(-1)).toBe(' \n\t');
  });
  test(`${kind}: failed editing leaves the original message and normal send intact`, async ({ page }) => {
    const editor = await setup(page, kind);
    await fillDraft(editor, 'Unchanged');
    await page.evaluate(() => { document.execCommand = () => false; });
    await editor.press('Enter');
    expect(await sent(page)).toEqual(['Unchanged']);
  });
  test(`${kind}: a mismatched native edit is undone and never resumed twice`, async ({ page }) => {
    const editor = await setup(page, kind);
    await fillDraft(editor, 'Keep this draft');
    await page.evaluate(() => {
      const native = document.execCommand.bind(document);
      document.execCommand = (command, ui, value) => native(command, ui, command === 'insertText' ? 'Wrong prefix' : value);
    });
    await editor.press('Enter');
    expect(await sent(page)).toEqual(['Keep this draft']);
    expect(await editor.evaluate(element => element.tagName === 'TEXTAREA' ? element.value : element.innerText)).toBe('Keep this draft');
  });
}
test('ambiguous composers and unknown rich content are not edited', async ({ page }) => {
  const editor = await setup(page);
  await fillDraft(editor, 'Unknown');
  await editor.evaluate(() => fixture.setUnknownDraft('Unknown'));
  await editor.press('Enter'); expect(await sent(page)).toEqual(['Unknown']);
  await page.clock.runFor(1000); await fillDraft(editor, 'Ambiguous');
  await page.evaluate(() => document.body.append(document.querySelector('#composer').cloneNode(true)));
  await editor.first().press('Enter'); expect((await sent(page)).at(-1)).toBe('Ambiguous');
});
test('SPA editor replacement is discovered at the next gesture; synthetic gestures are ignored', async ({ page }) => {
  await setup(page);
  await page.evaluate(() => {
    const form = document.querySelector('#composer'); form.replaceWith(form.cloneNode(true));
    fixture.bind(); history.pushState({}, '', '#another-chat');
  });
  const editor = page.locator('#composer .ProseMirror[contenteditable]');
  await fillDraft(editor, 'New editor');
  await editor.dispatchEvent('keydown', { key: 'Enter' });
  expect((await sent(page)).at(-1)).toBe('New editor');
  await page.clock.runFor(1000); await editor.press('Backspace'); await editor.press('Enter');
  await expect.poll(() => sent(page)).toHaveLength(2);
  expect((await sent(page)).at(-1)).toMatch(/^\[Local time:/);
});
test('native typing, backspace and framework paste update the model before a single send', async ({ page }) => {
  const editor = await setup(page);
  await fillDraft(editor, 'A'); await editor.press('End'); await editor.press('B'); await editor.press('Backspace');
  await page.evaluate(() => {
    fixture.view.pasteText('\nПривет 👋\n```js\nconst a = "<b>";\n```');
  });
  const original = await page.evaluate(() => fixture.model);
  expect(original).toContain('Привет 👋');
  await editor.press('Enter');
  await expect.poll(() => sent(page)).toHaveLength(1);
  expect(unstamped((await sent(page))[0])).toBe(original);
  await page.clock.runFor(1000);
  expect(await sent(page)).toHaveLength(1);
});

test('ChatGPT literal-paste spans preserve multiline text, selection, undo and retry', async ({ page }) => {
  const editor = await setup(page);
  const draft = '  Привет 👋\n\n```js\nconst a = "<b>";\n```\n尾\n';
  await editor.evaluate((_element, text) => fixture.setPastedDraft(text), draft);
  await editor.evaluate(element => {
    const text = element.firstElementChild.firstChild.firstChild;
    document.getSelection().setBaseAndExtent(text, text.length - 2, text, text.length);
    fixture.failedSend = true;
  });
  await editor.press('Enter');
  await expect.poll(() => page.evaluate(() => fixture.submissions)).toBe(1);
  expect(await sent(page)).toHaveLength(0);
  await expect.poll(() => page.evaluate(() => fixture.model)).toMatch(/^\[Local time:/);
  expect(unstamped(await page.evaluate(() => fixture.model))).toBe(draft);
  await expect.poll(() => editor.evaluate(() => document.getSelection().toString())).toBe('👋');
  await editor.press('ControlOrMeta+z');
  await expect.poll(() => page.evaluate(() => fixture.model)).toBe(draft);
  await page.clock.runFor(2000);
  await page.evaluate(() => { fixture.failedSend = false; });
  await page.getByRole('button', { name: 'Send', exact: true }).last().click();
  await expect.poll(() => sent(page)).toHaveLength(1);
  expect(unstamped((await sent(page))[0])).toBe(draft);
});
