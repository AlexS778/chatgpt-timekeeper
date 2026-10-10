import test from 'node:test';
import assert from 'node:assert/strict';
import { formatLocalTimestamp, planStamp, prefixLength } from '../src/time.js';
const now = new Date('2026-10-10T17:02:00Z');
const old = '[Local time: 2024-02-29T20:02:00+03:00 | Europe/Moscow]\n';
const readable = '[Local time: 2024-02-29 20:02:00 GMT+3]\n';
const prefix = formatLocalTimestamp(now) + '\n';

test('prefix preserves every original character, including CRLF, whitespace, Unicode and code', () => {
  const text = '  Привет 👋\r\n```js\nconst x = "<b>";\n```\n\n';
  assert.equal(planStamp(text, now).text, prefix + text);
  assert.equal(planStamp(text, now).remove, 0);
});
test('refresh anchored prefix; keep quoted and unanchored timestamps', () => {
  const text = `Original\n> ${old}quoted\n${old}inside`;
  const plan = planStamp(old + text, now);
  assert.equal(plan.remove, old.length);
  assert.equal(plan.text, prefix + text);
  assert.equal(planStamp(' ' + old + text, now).text, prefix + ' ' + old + text);
  assert.equal(planStamp(plan.text, now).text, plan.text);
});
test('empty drafts and prefix-only drafts remain unstamped', () => {
  for (const value of ['', ' \n\t\r', old, old + ' \n', readable, readable + ' \n']) assert.equal(planStamp(value, now), null);
});
test('readable and legacy stamps refresh once without consuming user-written dates', () => {
  const text = '2026-10-10 23:38:30 GMT+3\nMy own date\n' + readable + 'quoted';
  for (const stamp of [old, readable]) {
    assert.equal(planStamp(stamp + text, now).remove, stamp.length);
    assert.equal(planStamp(stamp + text, now).text, prefix + text);
  }
  assert.equal(planStamp(text, now).remove, 0);
  assert.equal(prefixLength(readable), readable.length);
  assert.equal(prefixLength(readable.replace('GMT+3', 'GMT-3:30')), readable.length + 3);
  for (const value of [readable.trimEnd(), readable.replace('GMT+3', 'GMT+03'),
    readable.replace('GMT+3', 'GMT+3:00'), readable.replace('GMT+3', 'GMT+24'),
    readable.replace('20:02:00', '99:02:00'), readable.replace('GMT+3', 'GMT+3:60')]) {
    assert.equal(prefixLength(value), 0);
  }
});
test('only canonical prefix plus newline is recognized', () => {
  assert.equal(prefixLength(old), old.length);
  const fallback = '[Local time: 2026-10-10T20:02:00+05:30 | UTC+05:30]\n';
  assert.equal(prefixLength(fallback), fallback.length);
  const alias = old.replace('Europe/Moscow', 'CET');
  assert.equal(prefixLength(alias), alias.length);
  for (const text of [old.trimEnd(), old.replace('20:02:00', '99:02:00'), old.replace('02-29', '99-29'), old.replace('Local time', 'Local Time')]) {
    assert.equal(prefixLength(text), 0);
  }
});
