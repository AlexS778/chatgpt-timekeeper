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

export function formatLocalTimestamp(now, timeZone) {
  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) throw new TypeError('Invalid date');
  const date = `${String(now.getFullYear()).padStart(4, '0')}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  return `[Local time: ${date}T${time}${formatOffset(now)} | ${localTimeZone(now, timeZone)}]`;
}

// Deliberately anchored, including the separator. Only our exact prefix is refreshed.
const autoPrefix = /^\[Local time: \d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d[+-](?:[01]\d|2[0-3]):[0-5]\d \| (?:UTC(?:[+-]\d{2}:\d{2})?|[A-Za-z_+-][A-Za-z0-9_+.-]*(?:\/[A-Za-z0-9_+.-]+)*)\]\n/;

export function prefixLength(text) {
  return text.match(autoPrefix)?.[0].length ?? 0;
}

export function planStamp(text, now, timeZone) {
  const remove = prefixLength(text);
  if (!text.slice(remove).trim()) return null;
  const insert = `${formatLocalTimestamp(now, timeZone)}\n`;
  return { remove, insert, text: insert + text.slice(remove) };
}
