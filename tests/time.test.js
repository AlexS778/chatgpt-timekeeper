import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { formatLocalTimestamp, localTimeZone } from '../src/time.js';

function formatIn(zone, instant) {
  const source = `import { formatLocalTimestamp } from './src/time.js'; console.log(formatLocalTimestamp(new Date(${JSON.stringify(instant)})));`;
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', source], {
    cwd: new URL('../', import.meta.url), env: { ...process.env, TZ: zone }, encoding: 'utf8'
  });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}

for (const [zone, instant, expected] of [
  ['UTC', '2024-02-29T23:59:59Z', '2024-02-29 23:59:59 GMT+0'],
  ['Asia/Tokyo', '2025-12-31T23:59:59Z', '2026-01-01 08:59:59 GMT+9'],
  ['Asia/Kolkata', '2026-10-10T10:00:00Z', '2026-10-10 15:30:00 GMT+5:30'],
  ['America/St_Johns', '2026-01-01T00:00:00Z', '2025-12-31 20:30:00 GMT-3:30'],
  ['Asia/Kathmandu', '2026-10-10T00:00:00Z', '2026-10-10 05:45:00 GMT+5:45'],
  ['America/New_York', '2026-03-08T06:59:59Z', '2026-03-08 01:59:59 GMT-5'],
  ['America/New_York', '2026-03-08T07:00:00Z', '2026-03-08 03:00:00 GMT-4'],
  ['America/New_York', '2026-11-01T05:59:59Z', '2026-11-01 01:59:59 GMT-4'],
  ['America/New_York', '2026-11-01T06:00:00Z', '2026-11-01 01:00:00 GMT-5']
]) {
  test(`${zone}: ${instant}`, () => {
    const value = formatIn(zone, instant);
    assert.equal(value, `[Local time: ${expected}]`);
  });
}

test('invalid zone falls back to offset; invalid date is rejected', () => {
  const now = new Date('2026-10-10T00:00:00Z');
  assert.match(localTimeZone(now, 'invalid|zone'), /^(UTC|UTC[+-]\d{2}:\d{2})$/);
  assert.match(localTimeZone(now, ''), /^(UTC|UTC[+-]\d{2}:\d{2})$/);
  assert.throws(() => formatLocalTimestamp(new Date(NaN)), TypeError);
  assert.ok(localTimeZone(new Date()));
});
