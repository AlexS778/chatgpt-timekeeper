import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { formatLocalTimestamp, localTimeZone } from '../src/time.js';

function formatIn(zone, instant, label = zone) {
  const source = `import { formatLocalTimestamp } from './src/time.js'; console.log(formatLocalTimestamp(new Date(${JSON.stringify(instant)}), ${JSON.stringify(label)}));`;
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', source], {
    cwd: new URL('../', import.meta.url), env: { ...process.env, TZ: zone }, encoding: 'utf8'
  });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}

for (const [zone, instant, expected] of [
  ['UTC', '2024-02-29T23:59:59Z', '2024-02-29T23:59:59+00:00 | UTC'],
  ['Asia/Tokyo', '2025-12-31T23:59:59Z', '2026-01-01T08:59:59+09:00 | Asia/Tokyo'],
  ['Asia/Kolkata', '2026-10-10T10:00:00Z', '2026-10-10T15:30:00+05:30 | Asia/Calcutta'],
  ['America/St_Johns', '2026-01-01T00:00:00Z', '2025-12-31T20:30:00-03:30 | America/St_Johns'],
  ['Asia/Kathmandu', '2026-10-10T00:00:00Z', '2026-10-10T05:45:00+05:45 | Asia/Katmandu'],
  ['America/New_York', '2026-03-08T06:59:59Z', '2026-03-08T01:59:59-05:00 | America/New_York'],
  ['America/New_York', '2026-03-08T07:00:00Z', '2026-03-08T03:00:00-04:00 | America/New_York'],
  ['America/New_York', '2026-11-01T05:59:59Z', '2026-11-01T01:59:59-04:00 | America/New_York'],
  ['America/New_York', '2026-11-01T06:00:00Z', '2026-11-01T01:00:00-05:00 | America/New_York']
]) {
  test(`${zone}: ${instant}`, () => {
    // ICU canonical aliases can change; assert the calendar/offset independently.
    const value = formatIn(zone, instant);
    assert.equal(value.split(' | ')[0], `[Local time: ${expected.split(' | ')[0]}`);
    assert.ok(value.endsWith(']'));
  });
}

test('invalid zone falls back to offset; invalid date is rejected', () => {
  assert.equal(formatIn('Asia/Kolkata', '2026-10-10T00:00:00Z', 'invalid|zone'),
    '[Local time: 2026-10-10T05:30:00+05:30 | UTC+05:30]');
  assert.equal(formatIn('UTC', '2026-10-10T00:00:00Z', ''), '[Local time: 2026-10-10T00:00:00+00:00 | UTC]');
  assert.throws(() => formatLocalTimestamp(new Date(NaN)), TypeError);
  assert.ok(localTimeZone(new Date()));
});
