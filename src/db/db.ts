import Dexie, { type Table } from 'dexie';
import type { Study, Trackable, Entry } from '../types';
import { suggestColor } from '../lib/colors';

// Локальная БД (IndexedDB). Единственный источник правды на первом этапе.
// Чтения делаем реактивными через dexie-react-hooks useLiveQuery,
// записи — через сервис-слой (см. service.ts).
export class StudyMeDB extends Dexie {
  studies!: Table<Study, string>;
  trackables!: Table<Trackable, string>;
  entries!: Table<Entry, string>;

  constructor() {
    super('studyme');
    this.version(1).stores({
      studies: 'id, status, startDate, updatedAt',
      trackables: 'id, studyId, order, updatedAt',
      entries: 'id, studyId, trackableId, loggedAt, updatedAt',
    });

    // v2: у показателей появился цвет — бэкфиллим существующие по порядку.
    this.version(2)
      .stores({
        studies: 'id, status, startDate, updatedAt',
        trackables: 'id, studyId, order, updatedAt',
        entries: 'id, studyId, trackableId, loggedAt, updatedAt',
      })
      .upgrade(async (tx) => {
        await tx
          .table('trackables')
          .toCollection()
          .modify((t: Trackable) => {
            if (!t.color) t.color = suggestColor(t.order);
          });
      });
  }
}

export const db = new StudyMeDB();
