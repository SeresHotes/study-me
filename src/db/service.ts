import { db } from './db';
import type { Study, Trackable, Entry, StudyStatus, EntryValue } from '../types';

// Все мутации данных идут через этот модуль. Когда появится бэкенд/Google Sheets,
// здесь же добавится запись в удалённое хранилище (или очередь синхронизации),
// а UI менять не придётся.

const now = () => new Date().toISOString();
const uid = () => crypto.randomUUID();

// ---- Studies ----

export interface StudyInput {
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
}

export async function createStudy(input: StudyInput): Promise<string> {
  const ts = now();
  const study: Study = {
    id: uid(),
    name: input.name.trim(),
    description: input.description?.trim() || undefined,
    startDate: input.startDate,
    endDate: input.endDate || undefined,
    status: 'active',
    createdAt: ts,
    updatedAt: ts,
  };
  await db.studies.add(study);
  return study.id;
}

export async function updateStudy(id: string, patch: Partial<StudyInput>): Promise<void> {
  await db.studies.update(id, { ...patch, updatedAt: now() });
}

export async function setStudyStatus(id: string, status: StudyStatus): Promise<void> {
  await db.studies.update(id, { status, updatedAt: now() });
}

export async function deleteStudy(id: string): Promise<void> {
  await db.transaction('rw', db.studies, db.trackables, db.entries, async () => {
    await db.entries.where('studyId').equals(id).delete();
    await db.trackables.where('studyId').equals(id).delete();
    await db.studies.delete(id);
  });
}

// ---- Trackables ----

export interface TrackableInput {
  studyId: string;
  name: string;
  type: Trackable['type'];
  unit?: string;
  min?: number;
  max?: number;
  options?: string[];
}

export async function addTrackable(input: TrackableInput): Promise<string> {
  const ts = now();
  const count = await db.trackables.where('studyId').equals(input.studyId).count();
  const trackable: Trackable = {
    id: uid(),
    studyId: input.studyId,
    name: input.name.trim(),
    type: input.type,
    order: count,
    unit: input.unit?.trim() || undefined,
    min: input.min,
    max: input.max,
    options: input.options?.map((o) => o.trim()).filter(Boolean),
    createdAt: ts,
    updatedAt: ts,
  };
  await db.trackables.add(trackable);
  return trackable.id;
}

export async function updateTrackable(
  id: string,
  patch: Partial<Omit<Trackable, 'id' | 'studyId' | 'createdAt' | 'updatedAt'>>,
): Promise<void> {
  await db.trackables.update(id, { ...patch, updatedAt: now() });
}

export async function deleteTrackable(id: string): Promise<void> {
  await db.transaction('rw', db.trackables, db.entries, async () => {
    await db.entries.where('trackableId').equals(id).delete();
    await db.trackables.delete(id);
  });
}

// ---- Entries ----

export async function addEntry(input: {
  studyId: string;
  trackableId: string;
  value: EntryValue;
  loggedAt: string;
  note?: string;
}): Promise<string> {
  const ts = now();
  const entry: Entry = {
    id: uid(),
    studyId: input.studyId,
    trackableId: input.trackableId,
    value: input.value,
    note: input.note?.trim() || undefined,
    loggedAt: input.loggedAt,
    createdAt: ts,
    updatedAt: ts,
  };
  await db.entries.add(entry);
  return entry.id;
}

export async function deleteEntry(id: string): Promise<void> {
  await db.entries.delete(id);
}
