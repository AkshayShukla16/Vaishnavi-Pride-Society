/**
 * Utility functions for date and time formatting across Vaishnavi Pride Society PWA.
 *
 * WHY THIS APPROACH:
 * The user wants the database values (Supabase) and the card displays (frontend)
 * to match the exact clock time in India (IST) without timezone offset shifting.
 * 
 * To achieve this:
 * 1. getLocalISOString() returns timezone-less local string "YYYY-MM-DDTHH:mm:ss.sss" in IST.
 * 2. Supabase stores this as UTC but with the local time numbers (e.g. "2026-07-25T15:10:00+00:00").
 *    Thus, querying in Supabase SQL editor returns the exact local time and date.
 * 3. formatDateTime() and other formatters strip any timezone offsets (+00:00, +05:30, Z)
 *    and parse the date as pure local time, keeping the exact numbers.
 */

/**
 * Returns current time in Asia/Kolkata (IST) formatted as ISO string without offset.
 * Example output: "2026-07-25T14:42:07.123"
 */
export function getLocalISOString(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const parts = formatter.formatToParts(date);
  const getPart = (type: string) => parts.find(p => p.type === type)?.value || '';

  const year = getPart('year');
  const month = getPart('month');
  const day = getPart('day');
  let hour = getPart('hour');
  const minute = getPart('minute');
  const second = getPart('second');

  if (hour === '24') {
    hour = '00';
  }

  const ms = String(date.getMilliseconds()).padStart(3, '0');

  return `${year}-${month}-${day}T${hour}:${minute}:${second}.${ms}`;
}

/**
 * Parses any ISO string (handling spaces, offsets) into a local Date object by stripping offset.
 * Ensures the date is parsed as local numbers instead of converting between timezones.
 */
export function parseISOToLocalDate(isoString?: string | null): Date {
  if (!isoString) return new Date();
  try {
    let cleaned = isoString.includes(' ') ? isoString.replace(' ', 'T') : isoString;
    // Strip timezone offsets (+05:30, +00:00, Z, etc.) from the end of the string
    cleaned = cleaned.replace(/([+-]\d{2}:?\d{2}|Z|[+-]\d{2})$/, '');
    const date = new Date(cleaned);
    if (isNaN(date.getTime())) return new Date();
    return date;
  } catch {
    return new Date();
  }
}

/**
 * Formats any ISO timestamp string for display keeping exact local time.
 */
export function formatDateTime(isoString?: string | null): string {
  if (!isoString) return 'N/A';
  try {
    const date = parseISOToLocalDate(isoString);
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  } catch {
    return 'N/A';
  }
}

export function formatDateOnly(dateString?: string | null): string {
  if (!dateString) return 'N/A';
  try {
    const date = parseISOToLocalDate(dateString);
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return 'N/A';
  }
}

export function formatTimeOnly(isoString?: string | null): string {
  if (!isoString) return 'N/A';
  try {
    const date = parseISOToLocalDate(isoString);
    return new Intl.DateTimeFormat('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  } catch {
    return 'N/A';
  }
}
