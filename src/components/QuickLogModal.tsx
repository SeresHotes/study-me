import { useState, type CSSProperties } from 'react';
import type { Trackable, EntryValue } from '../types';
import { addEntry } from '../db/service';
import { dateTimeInputToIso, nowDateTimeInput } from '../lib/date';
import { isEmptyValue, typeMeta } from '../lib/trackables';
import { trackableColor, resolveColor } from '../lib/colors';
import { useIsDark } from '../lib/theme';
import TrackableControl from './TrackableControl';

interface Props {
  studyId: string;
  trackable: Trackable;
  onClose: () => void;
  onSaved: (name: string) => void;
}

export default function QuickLogModal({ studyId, trackable, onClose, onSaved }: Props) {
  const [value, setValue] = useState<EntryValue | undefined>(undefined);
  const [when, setWhen] = useState(nowDateTimeInput());
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const isDark = useIsDark();

  const color = resolveColor(trackableColor(trackable), isDark);
  const canSave = !isEmptyValue(value) && !saving;

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    await addEntry({
      studyId,
      trackableId: trackable.id,
      value: value as EntryValue,
      loggedAt: dateTimeInputToIso(when),
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
        </div>

        <div className="field">
          <label>Значение</label>
          <TrackableControl trackable={trackable} value={value} onChange={setValue} />
        </div>

        <div className="field">
          <label htmlFor="q-when">Когда</label>
          <input
            id="q-when"
            type="datetime-local"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
          />
        </div>

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
