import { useState, type CSSProperties } from 'react';
import type { Trackable, Entry, EntryValue } from '../types';
import { addEntry, updateEntry } from '../db/service';
import { dateTimeInputToIso, isoToDateTimeInput, nowDateTimeInput, todayDateInput, dayKey } from '../lib/date';
import { isEmptyValue, typeMeta } from '../lib/trackables';
import { trackableColor, resolveColor } from '../lib/colors';
import { useIsDark } from '../lib/theme';
import TrackableControl from './TrackableControl';

interface Props {
  studyId: string;
  trackable: Trackable;
  entry?: Entry; // если задан — режим редактирования
  onClose: () => void;
  onSaved: (name: string) => void;
}

export default function QuickLogModal({ studyId, trackable, entry, onClose, onSaved }: Props) {
  const isTime = trackable.type === 'time';
  const [value, setValue] = useState<EntryValue | undefined>(entry ? entry.value : undefined);
  const [whenDT, setWhenDT] = useState(entry ? isoToDateTimeInput(entry.loggedAt) : nowDateTimeInput());
  const [whenDate, setWhenDate] = useState(entry ? dayKey(entry.loggedAt) : todayDateInput());
  const [note, setNote] = useState(entry?.note ?? '');
  const [saving, setSaving] = useState(false);
  const isDark = useIsDark();

  const color = resolveColor(trackableColor(trackable), isDark);
  const canSave = !isEmptyValue(value) && !saving;

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    // Для показателя-времени момент дня берётся из самого значения,
    // а «Когда» задаёт только дату — второй тайм-селектор не нужен.
    const loggedAt =
      isTime && typeof value === 'string'
        ? new Date(`${whenDate}T${value}`).toISOString()
        : dateTimeInputToIso(whenDT);

    if (entry) await updateEntry(entry.id, { value: value as EntryValue, loggedAt, note });
    else
      await addEntry({
        studyId,
        trackableId: trackable.id,
        value: value as EntryValue,
        loggedAt,
        note,
      });

    onSaved(trackable.name);
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="sheet"
        style={{ '--accent': color } as CSSProperties}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-handle" />
        <div className="sheet-title">
          <span className="dot" style={{ background: color }} />
          {typeMeta(trackable.type).icon} {trackable.name}
          {entry && <span className="sheet-mode">изменить</span>}
        </div>

        <div className="field">
          <label>Значение</label>
          <TrackableControl trackable={trackable} value={value} onChange={setValue} />
        </div>

        {isTime ? (
          <div className="field">
            <label htmlFor="q-date">Дата</label>
            <input
              id="q-date"
              type="date"
              value={whenDate}
              onChange={(e) => setWhenDate(e.target.value)}
            />
          </div>
        ) : (
          <div className="field">
            <label htmlFor="q-when">Когда</label>
            <input
              id="q-when"
              type="datetime-local"
              value={whenDT}
              onChange={(e) => setWhenDT(e.target.value)}
            />
          </div>
        )}

        {trackable.type !== 'text' && (
          <div className="field">
            <label htmlFor="q-note">Заметка (необязательно)</label>
            <input
              id="q-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Комментарий…"
            />
          </div>
        )}

        <div className="btn-row">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Отмена
          </button>
          <button
            type="button"
            className="btn btn-primary"
            style={{ flex: 1, background: color, borderColor: color }}
            onClick={handleSave}
            disabled={!canSave}
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}
