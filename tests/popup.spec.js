import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
test('popup previews time and saves only enabled; toggle is keyboard accessible', async ({ page }, testInfo) => {
  const manifest = JSON.parse(await readFile(new URL('manifest.json', root), 'utf8'));
  await page.addInitScript(({ version, namespace }) => {
    window.stored = {};
    window.listeners = [];
    window[namespace] = { runtime: { getManifest() { return { version }; } }, storage: {
      local: { get(_key, callback) {
        if (callback) callback(stored); else return Promise.resolve(stored);
      }, set(value, callback) {
        stored = value; for (const listener of listeners) listener({ enabled: { newValue: value.enabled } }, 'local');
        if (callback) callback(); else return Promise.resolve();
      } }, onChanged: { addListener(listener) { listeners.push(listener); }, removeListener() {} }
    } };
  }, { version: manifest.version, namespace: testInfo.project.name === 'firefox' ? 'browser' : 'chrome' });
  await page.context().route('http://fixture.test/**', async route => {
    const path = new URL(route.request().url()).pathname.slice(1);
    const body = await readFile(new URL(path, root));
    await route.fulfill({ body,
      headers: { 'Content-Security-Policy': manifest.content_security_policy.extension_pages },
      contentType: path.endsWith('.js') ? 'text/javascript' : path.endsWith('.css') ? 'text/css' : 'text/html' });
  });
  await page.goto('http://fixture.test/popup.html');
  const toggle = page.getByRole('switch');
  await expect(toggle).toBeChecked(); await expect(toggle).toBeEnabled();
  await expect(page.locator('#version')).toHaveText(`Version ${manifest.version} · Preview`);
  await expect(page.locator('#clock')).toHaveText(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}/);
  await toggle.focus(); await toggle.press('Space');
  await expect(toggle).not.toBeChecked();
  expect(await page.evaluate(() => stored)).toEqual({ enabled: false });
  await toggle.focus();
  for (const name of ['Source', 'Report an issue', 'Privacy']) {
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name, exact: true })).toBeFocused();
  }
  const privacy = page.getByRole('link', { name: 'Privacy', exact: true });
  const opened = page.waitForEvent('popup');
  await privacy.press('Enter');
  const policy = await opened;
  await expect(policy.getByRole('heading', { name: 'ChatGPT Timekeeper privacy policy' })).toBeVisible();
  await expect(policy.getByText(/timestamp and your message are sent to ChatGPT/)).toBeVisible();
  await policy.close();
  await page.setViewportSize({ width: 300, height: 600 });
  await page.emulateMedia({ colorScheme: 'light' });
  expect(await page.locator('body').evaluate(body => body.scrollHeight)).toBeLessThanOrEqual(600);
  await page.screenshot({ path: testInfo.outputPath('popup-light.png') });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.setViewportSize({ width: 240, height: 600 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('popup.png') });
});
