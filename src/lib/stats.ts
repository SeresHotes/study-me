import type { Trackable, EntryValue } from '../types';

export interface Stat {
  label: string;
  value: string;
}

export interface DistItem {
  label: string;
  count: number;
  percent: number;
}

const round = (n: number) => (Math.round(n * 10) / 10).toString();

function timeToMin(v: EntryValue): number | null {
  if (typeof v !== 'string') return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(v);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

function minToTime(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = Math.round(mins % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Числовые сводки по показателю (кроме распределения enum/bool — см. distribution). */
export function computeStats(t: Trackable, values: EntryValue[]): Stat[] {
  const n = values.length;
  if (n === 0) return [{ label: 'Записей', value: '0' }];

  switch (t.type) {
    case 'number':
    case 'scale': {
      const nums = values.map(Number).filter((v) => !Number.isNaN(v));
      if (nums.length === 0) return [{ label: 'Записей', value: String(n) }];
      const sum = nums.reduce((a, b) => a + b, 0);
      const unit = t.type === 'number' && t.unit ? ` ${t.unit}` : '';
      const rows: Stat[] = [
        { label: 'Записей', value: String(n) },
        { label: 'Среднее', value: round(sum / nums.length) + unit },
        { label: 'Мин', value: Math.min(...nums) + unit },
        { label: 'Макс', value: Math.max(...nums) + unit },
      ];
      if (t.type === 'number') rows.push({ label: 'Сумма', value: round(sum) + unit });
      return rows;
    }

    case 'bool': {
      const yes = values.filter((v) => v === true).length;
      return [
        { label: 'Записей', value: String(n) },
        { label: 'Да', value: `${yes} · ${Math.round((yes / n) * 100)}%` },
        { label: 'Нет', value: String(n - yes) },
      ];
    }

    case 'time': {
      const mins = values.map(timeToMin).filter((v): v is number => v !== null);
      if (mins.length === 0) return [{ label: 'Записей', value: String(n) }];
      const avg = mins.reduce((a, b) => a + b, 0) / mins.length;
      return [
        { label: 'Записей', value: String(n) },
        { label: 'В среднем', value: minToTime(avg) },
        { label: 'Раньше всего', value: minToTime(Math.min(...mins)) },
        { label: 'Позже всего', value: minToTime(Math.max(...mins)) },
      ];
    }

    case 'enum':
      return [{ label: 'Записей', value: String(n) }];

    case 'text':
    default:
      return [{ label: 'Заметок', value: String(n) }];
  }
}

/** Распределение по вариантам — для enum и bool (для цветных полосок). */
export function computeDistribution(t: Trackable, values: EntryValue[]): DistItem[] {
  const n = values.length;
  if (n === 0) return [];

  if (t.type === 'bool') {
    const yes = values.filter((v) => v === true).length;
    const no = n - yes;
    return [
      { label: 'Да', count: yes, percent: Math.round((yes / n) * 100) },
      { label: 'Нет', count: no, percent: Math.round((no / n) * 100) },
    ];
  }

  if (t.type === 'enum') {
    const counts: Record<string, number> = {};
    for (const v of values) {
      const k = String(v);
      counts[k] = (counts[k] ?? 0) + 1;
    }
    // сохраняем порядок вариантов показателя, затем прочие
    const order = t.options ?? [];
    const keys = [...order.filter((k) => k in counts), ...Object.keys(counts).filter((k) => !order.includes(k))];
    return keys.map((k) => ({ label: k, count: counts[k], percent: Math.round((counts[k] / n) * 100) }));
  }

  return [];
}
