import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
test('popup previews time and saves only enabled; toggle is keyboard accessible', async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    window.stored = {};
    window.listeners = [];
    window.browser = { storage: {
      local: { async get() { return stored; }, async set(value) {
        stored = value; for (const listener of listeners) listener({ enabled: { newValue: value.enabled } }, 'local');
      } }, onChanged: { addListener(listener) { listeners.push(listener); }, removeListener() {} }
    } };
  });
  await page.route('http://fixture.test/**', async route => {
    const path = new URL(route.request().url()).pathname.slice(1);
    const body = await readFile(new URL(path, root));
    await route.fulfill({ body, contentType: path.endsWith('.js') ? 'text/javascript' : path.endsWith('.css') ? 'text/css' : 'text/html' });
  });
  await page.goto('http://fixture.test/popup.html');
  const toggle = page.getByRole('switch');
  await expect(toggle).toBeChecked(); await expect(toggle).toBeEnabled();
  await expect(page.locator('#clock')).toHaveText(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}/);
  await toggle.focus(); await toggle.press('Space');
  await expect(toggle).not.toBeChecked();
  expect(await page.evaluate(() => stored)).toEqual({ enabled: false });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.setViewportSize({ width: 240, height: 420 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('popup.png') });
});
