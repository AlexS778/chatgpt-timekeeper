const pad = number => String(number).padStart(2, '0');

export function formatOffset(now) {
  const minutes = -now.getTimezoneOffset();
  return `${minutes >= 0 ? '+' : '-'}${pad(Math.floor(Math.abs(minutes) / 60))}:${pad(Math.abs(minutes) % 60)}`;
}

export function localTimeZone(now = new Date(), candidate) {
  try {
    const zone = candidate ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (typeof zone === 'string' && zone.length && !/[\s|\[\]]/.test(zone)) {
      return new Intl.DateTimeFormat('en', { timeZone: zone }).resolvedOptions().timeZone;
    }
  } catch { /* Fall back to an explicit offset, without any remote lookup. */ }
  const offset = formatOffset(now);
  return offset === '+00:00' ? 'UTC' : `UTC${offset}`;
}

export function formatLocalTimestamp(now) {
  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) throw new TypeError('Invalid date');
  const date = `${String(now.getFullYear()).padStart(4, '0')}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  const offset = -now.getTimezoneOffset();
  const hours = Math.floor(Math.abs(offset) / 60);
  const minutes = Math.abs(offset) % 60;
  const gmt = `GMT${offset >= 0 ? '+' : '-'}${hours}${minutes ? `:${pad(minutes)}` : ''}`;
  return `[Local time: ${date} ${time} ${gmt}]`;
}

// Keep the old preview format readable so upgrading/retrying never stacks stamps.
// Both formats require our marker at the very start and the trailing newline.
const legacyPrefix = /^\[Local time: \d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d[+-](?:[01]\d|2[0-3]):[0-5]\d \| (?:UTC(?:[+-]\d{2}:\d{2})?|[A-Za-z_+-][A-Za-z0-9_+.-]*(?:\/[A-Za-z0-9_+.-]+)*)\]\n/;
const autoPrefix = /^\[Local time: \d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01]) (?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d GMT[+-](?:[0-9]|1\d|2[0-3])(?::(?:0[1-9]|[1-5]\d))?\]\n/;

export function prefixLength(text) {
  return (text.match(autoPrefix) ?? text.match(legacyPrefix))?.[0].length ?? 0;
}

export function planStamp(text, now) {
  const remove = prefixLength(text);
  if (!text.slice(remove).trim()) return null;
  const insert = `${formatLocalTimestamp(now)}\n`;
  return { remove, insert, text: insert + text.slice(remove) };
}
