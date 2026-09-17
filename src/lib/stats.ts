import type { Trackable, EntryValue } from '../types';
import { t } from './i18n';

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
export function computeStats(trackable: Trackable, values: EntryValue[]): Stat[] {
  const n = values.length;
  if (n === 0) return [{ label: t('stat.count'), value: '0' }];

  switch (trackable.type) {
    case 'number':
    case 'scale': {
      const nums = values.map(Number).filter((v) => !Number.isNaN(v));
      if (nums.length === 0) return [{ label: t('stat.count'), value: String(n) }];
      const sum = nums.reduce((a, b) => a + b, 0);
      const unit = trackable.type === 'number' && trackable.unit ? ` ${trackable.unit}` : '';
      const rows: Stat[] = [
        { label: t('stat.count'), value: String(n) },
        { label: t('stat.avg'), value: round(sum / nums.length) + unit },
        { label: t('stat.min'), value: Math.min(...nums) + unit },
        { label: t('stat.max'), value: Math.max(...nums) + unit },
      ];
      if (trackable.type === 'number') rows.push({ label: t('stat.sum'), value: round(sum) + unit });
      return rows;
    }

    case 'bool': {
      const yes = values.filter((v) => v === true).length;
      return [
        { label: t('stat.count'), value: String(n) },
        { label: t('stat.yes'), value: `${yes} · ${Math.round((yes / n) * 100)}%` },
        { label: t('stat.no'), value: String(n - yes) },
      ];
    }

    case 'time': {
      const mins = values.map(timeToMin).filter((v): v is number => v !== null);
      if (mins.length === 0) return [{ label: t('stat.count'), value: String(n) }];
      const avg = mins.reduce((a, b) => a + b, 0) / mins.length;
      return [
        { label: t('stat.count'), value: String(n) },
        { label: t('stat.avgTime'), value: minToTime(avg) },
        { label: t('stat.earliest'), value: minToTime(Math.min(...mins)) },
        { label: t('stat.latest'), value: minToTime(Math.max(...mins)) },
      ];
    }

    case 'enum':
      return [{ label: t('stat.count'), value: String(n) }];

    case 'text':
    default:
      return [{ label: t('stat.notes'), value: String(n) }];
  }
}

/** Распределение по вариантам — для enum и bool (для цветных полосок). */
export function computeDistribution(trackable: Trackable, values: EntryValue[]): DistItem[] {
  const n = values.length;
  if (n === 0) return [];

  if (trackable.type === 'bool') {
    const yes = values.filter((v) => v === true).length;
    const no = n - yes;
    return [
      { label: t('stat.yes'), count: yes, percent: Math.round((yes / n) * 100) },
      { label: t('stat.no'), count: no, percent: Math.round((no / n) * 100) },
    ];
  }

  if (trackable.type === 'enum') {
    const counts: Record<string, number> = {};
    for (const v of values) {
      const picks = Array.isArray(v) ? v : [v];
      for (const p of picks) {
        const k = String(p);
        counts[k] = (counts[k] ?? 0) + 1;
      }
    }
    const order = trackable.options ?? [];
    const keys = [
      ...order.filter((k) => k in counts),
      ...Object.keys(counts).filter((k) => !order.includes(k)),
    ];
    return keys.map((k) => ({ label: k, count: counts[k], percent: Math.round((counts[k] / n) * 100) }));
  }

  return [];
}
