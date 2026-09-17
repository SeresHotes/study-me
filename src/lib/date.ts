import { getLang } from './i18n';

const localeOf = () => (getLang() === 'ru' ? 'ru-RU' : 'en-US');

const cache = new Map<string, Intl.DateTimeFormat>();
function fmt(kind: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `${localeOf()}:${kind}`;
  let f = cache.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(localeOf(), options);
    cache.set(key, f);
  }
  return f;
}

export const formatDate = (iso: string) =>
  fmt('date', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso));
export const formatDateShort = (iso: string) =>
  fmt('short', { day: 'numeric', month: 'short' }).format(new Date(iso));
export const formatTime = (iso: string) =>
  fmt('time', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));

/** «18 сен» — короткая подпись оси по дате (принимает ms). */
export const formatDayMonth = (t: number) =>
  fmt('dayMonth', { day: 'numeric', month: 'short' }).format(new Date(t));

/** «14:30» — подпись оси по времени суток (принимает ms). */
export const formatHourMin = (t: number) =>
  fmt('hourMin', { hour: '2-digit', minute: '2-digit' }).format(new Date(t));

/** «18 сен, 14:30» — полная подпись для тултипа (принимает ms). */
export const formatDateTime = (t: number) =>
  fmt('dateTime', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(
    new Date(t),
  );

/** Заголовок «Месяц Год» на текущем языке. */
export const monthYearLabel = (year: number, month: number) =>
  fmt('monthYear', { month: 'long', year: 'numeric' }).format(new Date(year, month, 1));

/** Короткие названия дней недели (с понедельника) на текущем языке. */
export function weekdayShort(): string[] {
  const f = fmt('weekday', { weekday: 'short' });
  // 2023-01-02 — понедельник.
  return Array.from({ length: 7 }, (_, i) => f.format(new Date(2023, 0, 2 + i)));
}

/** Ключ дня (YYYY-MM-DD) в локальной таймзоне — для группировки записей. */
export function dayKey(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** YYYY-MM-DD текущей даты в локальной таймзоне (для <input type="date">). */
export function todayDateInput(): string {
  return dayKey(new Date().toISOString());
}

/** YYYY-MM-DDTHH:MM текущего момента (для <input type="datetime-local">). */
export function nowDateTimeInput(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes(),
  )}`;
}

/** datetime-local -> ISO. */
export function dateTimeInputToIso(value: string): string {
  return new Date(value).toISOString();
}

/** ISO -> YYYY-MM-DDTHH:MM (локальное) для <input type="datetime-local">. */
export function isoToDateTimeInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes(),
  )}`;
}

export interface StudyProgress {
  totalDays: number | null; // null — бессрочное
  elapsedDays: number;
  daysLeft: number | null;
  percent: number | null;
  isOver: boolean;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function studyProgress(startISO: string, endISO?: string): StudyProgress {
  const start = new Date(startISO).getTime();
  const now = Date.now();
  const elapsedDays = Math.max(0, Math.floor((now - start) / DAY_MS));

  if (!endISO) {
    return { totalDays: null, elapsedDays, daysLeft: null, percent: null, isOver: false };
  }

  const end = new Date(endISO).getTime();
  const totalDays = Math.max(1, Math.round((end - start) / DAY_MS));
  const daysLeft = Math.ceil((end - now) / DAY_MS);
  const percent = Math.min(100, Math.max(0, Math.round(((now - start) / (end - start)) * 100)));
  return { totalDays, elapsedDays, daysLeft, percent, isOver: now > end };
}
