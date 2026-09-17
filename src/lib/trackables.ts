import type { Trackable, TrackableType, EntryValue } from '../types';
import { formatTime } from './date';

export interface TypeMeta {
  type: TrackableType;
  label: string;
  hint: string;
  icon: string;
}

export const TRACKABLE_TYPES: TypeMeta[] = [
  { type: 'scale', label: 'Шкала', hint: 'Оценка по диапазону, напр. настроение 1–5', icon: '📊' },
  { type: 'number', label: 'Число', hint: 'Числовое значение с единицей, напр. часы сна', icon: '🔢' },
  { type: 'bool', label: 'Да / Нет', hint: 'Было или не было, напр. пил алкоголь', icon: '✅' },
  { type: 'time', label: 'Время', hint: 'Время суток, напр. время засыпания', icon: '🕒' },
  { type: 'enum', label: 'Выбор', hint: 'Один вариант из списка, напр. место: дом / работа', icon: '🏷️' },
  { type: 'text', label: 'Заметка', hint: 'Свободный текст', icon: '📝' },
];

export const typeMeta = (type: TrackableType): TypeMeta =>
  TRACKABLE_TYPES.find((t) => t.type === type) ?? TRACKABLE_TYPES[0];

/** Человекочитаемое значение записи для истории/сводки. */
export function formatValue(trackable: Trackable, value: EntryValue): string {
  switch (trackable.type) {
    case 'bool':
      return value ? 'Да' : 'Нет';
    case 'number':
      return trackable.unit ? `${value} ${trackable.unit}` : String(value);
    case 'scale': {
      const max = trackable.max ?? 5;
      return `${value} / ${max}`;
    }
    case 'time':
      // value хранится как "HH:MM"
      return String(value);
    case 'enum':
      return Array.isArray(value) ? value.join(', ') : String(value);
    case 'text':
    default:
      return String(value);
  }
}

/** Пустое ли значение из инпута (чтобы не сохранять незаполненные показатели). */
export function isEmptyValue(value: EntryValue | undefined | null): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

export { formatTime };
