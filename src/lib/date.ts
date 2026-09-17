const dateFmt = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const dateShortFmt = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'short',
});

const timeFmt = new Intl.DateTimeFormat('ru-RU', {
  hour: '2-digit',
  minute: '2-digit',
});

export const formatDate = (iso: string) => dateFmt.format(new Date(iso));
export const formatDateShort = (iso: string) => dateShortFmt.format(new Date(iso));
export const formatTime = (iso: string) => timeFmt.format(new Date(iso));

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
