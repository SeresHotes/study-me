import type { Trackable, TrackableType, EntryValue } from '../types';
import { formatTime } from './date';
import { t } from './i18n';

export interface TypeMeta {
  type: TrackableType;
  icon: string;
}

// Порядок типов в форме создания. Подписи/подсказки — через i18n (typeLabel/typeHint).
export const TRACKABLE_TYPES: TypeMeta[] = [
  { type: 'scale', icon: '📊' },
  { type: 'number', icon: '🔢' },
  { type: 'bool', icon: '✅' },
  { type: 'time', icon: '🕒' },
  { type: 'enum', icon: '🏷️' },
  { type: 'text', icon: '📝' },
];

export const typeMeta = (type: TrackableType): TypeMeta =>
  TRACKABLE_TYPES.find((t) => t.type === type) ?? TRACKABLE_TYPES[0];

export const typeLabel = (type: TrackableType): string => t(`type.${type}.label`);
export const typeHint = (type: TrackableType): string => t(`type.${type}.hint`);

/** Человекочитаемое значение записи для истории/сводки. */
export function formatValue(trackable: Trackable, value: EntryValue): string {
  switch (trackable.type) {
    case 'bool':
      return value ? t('control.yes') : t('control.no');
    case 'number':
      return trackable.unit ? `${value} ${trackable.unit}` : String(value);
    case 'scale': {
      const max = trackable.max ?? 5;
      return `${value} / ${max}`;
    }
    case 'time':
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
