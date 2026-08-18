/**
 * Reliable local business-date helpers.
 *
 * NEPTUNE operates in Sri Lanka (UTC+05:30). Business dates (assignment dates,
 * "today" filters) must be derived from the LOCAL calendar, never from
 * `toISOString()`-based UTC slicing, which can shift the date by one day.
 */

const DATE_KEY_RE = /^(\d{4})-(\d{2})-(\d{2})/;

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Today's date as a local YYYY-MM-DD string. */
export function localToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Extracts the YYYY-MM-DD date key from an ISO string or Date.
 *
 * The backend stores assignment dates as midnight-UTC dates (e.g.
 * "2026-08-15T00:00:00.000Z"); the YYYY-MM-DD prefix is the intended business
 * date and is returned verbatim to avoid timezone shifting. Other formats
 * fall back to the local calendar date.
 */
export function toDateKey(value: string | Date | null | undefined): string {
  if (value === null || value === undefined || value === '') return '';
  const iso = value instanceof Date ? value.toISOString() : String(value);
  const match = DATE_KEY_RE.exec(iso);
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  const parsed = new Date(iso);
  if (!Number.isNaN(parsed.getTime())) {
    return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`;
  }
  return '';
}

/** Formats a YYYY-MM-DD key for display without timezone shifting. */
export function formatDateKey(key: string): string {
  const match = DATE_KEY_RE.exec(key);
  if (!match) return key || '—';
  const d = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}