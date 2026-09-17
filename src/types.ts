// Доменные типы StudyMe.
// У каждой сущности есть id/createdAt/updatedAt — это упрощает будущую
// синхронизацию с Google Sheets или бэкендом (детект изменений по updatedAt).

export type TrackableType = 'scale' | 'number' | 'bool' | 'time' | 'enum' | 'text';

export interface Trackable {
  id: string;
  studyId: string;
  name: string;
  type: TrackableType;
  order: number;
  color?: string; // цвет показателя (для календаря/статистики); необязателен — есть фолбэк по order

  // Конфигурация под конкретный тип (используются не все поля):
  unit?: string; // number: единица измерения, напр. "порций", "мл"
  min?: number; // scale: минимум шкалы
  max?: number; // scale: максимум шкалы
  options?: string[]; // enum: варианты выбора
  multi?: boolean; // enum: разрешён выбор нескольких вариантов
  createdAt: string;
  updatedAt: string;
}

// Значение записи: число (number/scale), строка (time "HH:MM", enum, text),
// булево (bool) либо массив строк (enum с мультивыбором).
export type EntryValue = number | boolean | string | string[];

export interface Entry {
  id: string;
  studyId: string;
  trackableId: string;
  value: EntryValue;
  note?: string;
  loggedAt: string; // ISO — момент, к которому относится отметка
  createdAt: string;
  updatedAt: string;
}

export type StudyStatus = 'active' | 'archived';

export interface Study {
  id: string;
  name: string;
  description?: string;
  startDate: string; // ISO
  endDate?: string; // ISO, опционально (бессрочное исследование)
  status: StudyStatus;
  createdAt: string;
  updatedAt: string;
}
