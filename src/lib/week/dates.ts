/** Date helpers for the weekly calendar. Week starts Monday. Local time. */

/** 'YYYY-MM-DD' in local time (stable key, no timezone surprises). */
export function isoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Midnight Sunday of the week containing `date`. */
export function startOfWeek(date = new Date()): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - d.getDay()); // back up to Sunday (getDay: 0 = Sun)
  return d;
}

/** The seven Date objects of the week containing `date`, Sun→Sat. */
export function weekDates(date = new Date()): Date[] {
  const start = startOfWeek(date);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function weekdayShort(date: Date): string {
  return WEEKDAY_SHORT[date.getDay()];
}

/** Weekday labels, Sunday-first — index 0 = Sun … 6 = Sat. */
export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

/** A date's weekday as a Sunday-first index (0 = Sun … 6 = Sat) — i.e. JS `getDay()`. */
export function weekdayIndex(date = new Date()): number {
  return date.getDay();
}

const WEEKDAY_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Friendly full date, e.g. "Saturday, June 20". */
export function formatLongDate(date: Date): string {
  return `${WEEKDAY_LONG[date.getDay()]}, ${MONTH_LONG[date.getMonth()]} ${date.getDate()}`;
}

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** Range label for the week containing `date`, e.g. "Jun 22 – 28" or "Jun 29 – Jul 5". */
export function weekRangeLabel(date = new Date()): string {
  const days = weekDates(date);
  const start = days[0];
  const end = days[6];
  const startStr = `${MONTH_SHORT[start.getMonth()]} ${start.getDate()}`;
  const endStr =
    start.getMonth() === end.getMonth()
      ? `${end.getDate()}`
      : `${MONTH_SHORT[end.getMonth()]} ${end.getDate()}`;
  return `${startStr} – ${endStr}`;
}

export function isSameDay(a: Date, b: Date): boolean {
  return isoDate(a) === isoDate(b);
}

/** ISO keys for the last `n` days up to and including today (most recent first). */
export function recentDays(n: number, from = new Date()): string[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(from);
    d.setDate(from.getDate() - i);
    return isoDate(d);
  });
}
