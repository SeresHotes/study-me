import Dexie, { type Table } from 'dexie';
import type { Study, Trackable, Entry } from '../types';

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
  }
}

export const db = new StudyMeDB();
