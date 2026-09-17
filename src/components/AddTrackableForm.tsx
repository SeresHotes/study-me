import { useState } from 'react';
import type { Trackable, TrackableType } from '../types';
import { TRACKABLE_TYPES, typeMeta } from '../lib/trackables';
import { addTrackable, updateTrackable } from '../db/service';
import ColorPalette from './ColorPalette';

export default function AddTrackableForm({
  studyId,
  suggestedColor,
  trackable,
  onDone,
}: {
  studyId: string;
  suggestedColor: string;
  trackable?: Trackable; // если задан — режим редактирования
  onDone: () => void;
}) {
  const editing = !!trackable;
  const [name, setName] = useState(trackable?.name ?? '');
  const [type, setType] = useState<TrackableType>(trackable?.type ?? 'scale');
  const [color, setColor] = useState(trackable?.color ?? suggestedColor);
  const [unit, setUnit] = useState(trackable?.unit ?? '');
  const [min, setMin] = useState(String(trackable?.min ?? 1));
  const [max, setMax] = useState(String(trackable?.max ?? 5));
  const [optionsText, setOptionsText] = useState((trackable?.options ?? []).join('\n'));
  const [multi, setMulti] = useState(trackable?.multi ?? false);

  const canSave = name.trim().length > 0 && (type !== 'enum' || parseOptions(optionsText).length > 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;
    const fields = {
      name: name.trim(),
      color,
      unit: type === 'number' ? unit.trim() || undefined : undefined,
      min: type === 'scale' ? Number(min) : undefined,
      max: type === 'scale' ? Number(max) : undefined,
      options: type === 'enum' ? parseOptions(optionsText) : undefined,
      multi: type === 'enum' ? multi : undefined,
    };
    if (editing) {
      await updateTrackable(trackable.id, fields);
    } else {
      await addTrackable({ studyId, type, ...fields });
    }
    onDone();
  }

  return (
    <form className="card stack" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="tname">Что отслеживаем</label>
        <input
          id="tname"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Напр. Настроение"
          autoFocus
        />
      </div>

      {editing ? (
        <div className="field">
          <label>Тип показателя</label>
          <div className="type-option selected" style={{ cursor: 'default' }}>
            <span className="type-option-label">
              {typeMeta(type).icon} {typeMeta(type).label}
            </span>
            <span className="type-option-hint">Тип нельзя изменить после создания</span>
          </div>
        </div>
      ) : (
        <div className="field">
          <label>Тип показателя</label>
          <div className="type-grid">
            {TRACKABLE_TYPES.map((t) => (
              <button
                key={t.type}
                type="button"
                className={`type-option ${type === t.type ? 'selected' : ''}`}
                onClick={() => setType(t.type)}
              >
                <span className="type-option-label">
                  {t.icon} {t.label}
                </span>
                <span className="type-option-hint">{t.hint}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="field">
        <label>
          Цвет <span className="dot" style={{ background: color, marginLeft: 4 }} />
        </label>
        <ColorPalette value={color} onPick={setColor} />
      </div>

      {type === 'number' && (
        <div className="field">
          <label htmlFor="unit">Единица измерения (необязательно)</label>
          <input
            id="unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="Напр. часов, мл, порций"
          />
        </div>
      )}

      {type === 'scale' && (
        <div className="row-2">
          <div className="field">
            <label htmlFor="min">Мин.</label>
            <input id="min" type="number" value={min} onChange={(e) => setMin(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="max">Макс.</label>
            <input id="max" type="number" value={max} onChange={(e) => setMax(e.target.value)} />
          </div>
        </div>
      )}

      {type === 'enum' && (
        <div className="field">
          <label htmlFor="opts">Варианты (по одному в строке)</label>
          <textarea
            id="opts"
            value={optionsText}
            onChange={(e) => setOptionsText(e.target.value)}
            placeholder={'Напр.\nдом\nработа\nулица\nв гостях'}
          />
          <label className="check-row">
            <input type="checkbox" checked={multi} onChange={(e) => setMulti(e.target.checked)} />
            Можно выбрать несколько
          </label>
        </div>
      )}

      <div className="btn-row">
        <button type="button" className="btn btn-ghost" onClick={onDone}>
          Отмена
        </button>
        <button type="submit" className="btn btn-primary" disabled={!canSave} style={{ flex: 1 }}>
          {editing ? 'Сохранить' : 'Добавить'}
        </button>
      </div>
    </form>
  );
}

function parseOptions(text: string): string[] {
  return text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}
