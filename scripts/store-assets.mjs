// Render listing compositions from unmodified real captures. No generated UI.
// Development only: uses the project's pinned Playwright, never ships in the extension.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const root = new URL('../', import.meta.url);
const output = new URL('docs/images/store/', root);
await mkdir(output, { recursive: true });
async function bitmap(path) {
  return `data:image/png;base64,${(await readFile(new URL(path, root))).toString('base64')}`;
}
const action = await bitmap('docs/images/timekeeper-in-action.png');
const popup = await bitmap('docs/images/timekeeper-popup.png');
const icon = await bitmap('icons/icon-128.png');
const screenshot = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="800" viewBox="0 0 1280 800">
  <rect width="1280" height="800" fill="#11151b"/>
  <rect width="1280" height="180" fill="#075e5a"/>
  <image href="${icon}" x="36" y="34" width="112" height="112"/>
  <g font-family="Arial, sans-serif" fill="#ffffff">
    <text x="170" y="83" font-size="42" font-weight="700">ChatGPT Timekeeper</text>
    <text x="170" y="128" font-size="26">Add your local time to outgoing messages</text>
    <text x="38" y="236" font-size="23">A real ChatGPT message with its timestamp</text>
    <text x="932" y="236" font-size="23">One on/off switch</text>
  </g>
  <rect x="0" y="270" width="910" height="370" fill="#000000"/>
  <image href="${action}" x="25" y="308" width="860" height="280"/>
  <rect x="910" y="270" width="370" height="435" fill="#1c1b22"/>
  <image href="${popup}" x="945" y="270" width="300" height="435"/>
  <g font-family="Arial, sans-serif" fill="#bce5dc">
    <text x="38" y="688" font-size="23">No developer collection. No chat history stored.</text>
    <text x="38" y="743" font-size="18" fill="#cad2df">Desktop preview · Actual Firefox captures · Version 0.1.1</text>
    <text x="38" y="776" font-size="18" fill="#cad2df">Stop dictation before Send. Independent project; not affiliated with OpenAI.</text>
  </g>
</svg>`;
const promo = `<svg xmlns="http://www.w3.org/2000/svg" width="440" height="280" viewBox="0 0 440 280">
  <rect width="440" height="280" fill="#075e5a"/>
  <circle cx="400" cy="22" r="145" fill="#087870"/>
  <image href="${icon}" x="145" y="12" width="150" height="150"/>
  <g font-family="Arial, sans-serif" text-anchor="middle" fill="#ffffff">
    <text x="220" y="186" font-size="25" font-weight="700">ChatGPT Timekeeper</text>
    <text x="220" y="215" font-size="17">Your local time, in each message</text>
    <text x="220" y="254" font-size="14" fill="#bce5dc">Desktop preview · Independent project</text>
  </g>
</svg>`;
const browser = await chromium.launch();
try {
  for (const [name, svg, width, height] of [
    ['timekeeper-screenshot', screenshot, 1280, 800],
    ['timekeeper-promo', promo, 440, 280]
  ]) {
    await writeFile(new URL(`${name}.svg`, output), svg);
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    await page.setContent(`<html><body style="margin:0">${svg}</body></html>`);
    await page.evaluate(async () => { await document.fonts.ready; });
    await page.screenshot({ path: new URL(`${name}.png`, output).pathname });
    await page.close();
    console.log(`Prepared docs/images/store/${name}.png (${width}×${height})`);
  }
} finally {
  await browser.close();
}
