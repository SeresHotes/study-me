import { db } from '../db/db';
import type { Study, Trackable, Entry } from '../types';
import { t } from './i18n';

// Формат резервной копии. version — версия формата бэкапа (не схемы БД),
// пригодится, если структура экспорта поменяется.
export interface Backup {
  app: 'studyme';
  version: number;
  exportedAt: string;
  studies: Study[];
  trackables: Trackable[];
  entries: Entry[];
}

export const BACKUP_VERSION = 1;

export async function exportData(): Promise<Backup> {
  const [studies, trackables, entries] = await Promise.all([
    db.studies.toArray(),
    db.trackables.toArray(),
    db.entries.toArray(),
  ]);
  return {
    app: 'studyme',
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    studies,
    trackables,
    entries,
  };
}

export function downloadBackup(backup: Backup): void {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `studyme-backup-${backup.exportedAt.slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export interface ImportResult {
  studies: number;
  trackables: number;
  entries: number;
}

/** Импортирует бэкап через upsert по id: восстанавливает на чистом устройстве
 *  и мержит с существующими данными (совпадающие id перезаписываются). */
export async function importData(raw: unknown): Promise<ImportResult> {
  const b = raw as Partial<Backup> | null;
  if (
    !b ||
    b.app !== 'studyme' ||
    !Array.isArray(b.studies) ||
    !Array.isArray(b.trackables) ||
    !Array.isArray(b.entries)
  ) {
    throw new Error(t('data.notStudyMe'));
  }

  await db.transaction('rw', db.studies, db.trackables, db.entries, async () => {
    await db.studies.bulkPut(b.studies as Study[]);
    await db.trackables.bulkPut(b.trackables as Trackable[]);
    await db.entries.bulkPut(b.entries as Entry[]);
  });

  return {
    studies: b.studies.length,
    trackables: b.trackables.length,
    entries: b.entries.length,
  };
}
