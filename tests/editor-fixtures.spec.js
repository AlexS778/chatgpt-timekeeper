import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
const html = await readFile(new URL('./fixtures/composer.html', import.meta.url), 'utf8');
const content = await readFile(new URL('../content.js', import.meta.url), 'utf8');
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
    const selected = await editor.evaluate(element => element.tagName === 'TEXTAREA'
      ? element.value.slice(element.selectionStart, element.selectionEnd) : document.getSelection().toString());
    expect(selected).toBe('👋');
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
  await editor.evaluate(() => fixture.setRichDraft('Unknown'));
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
  expect(await editor.evaluate(() => document.getSelection().toString())).toBe('👋');
  await editor.press('ControlOrMeta+z');
  await expect.poll(() => page.evaluate(() => fixture.model)).toBe(draft);
  await page.clock.runFor(2000);
  await page.evaluate(() => { fixture.failedSend = false; });
  await page.getByRole('button', { name: 'Send', exact: true }).last().click();
  await expect.poll(() => sent(page)).toHaveLength(1);
  expect(unstamped((await sent(page))[0])).toBe(draft);
});
