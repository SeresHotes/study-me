import { useState } from 'react';
import type { TrackableType } from '../types';
import { TRACKABLE_TYPES } from '../lib/trackables';
import { addTrackable } from '../db/service';

export default function AddTrackableForm({
  studyId,
  onDone,
}: {
  studyId: string;
  onDone: () => void;
}) {
  const [name, setName] = useState('');
  const [type, setType] = useState<TrackableType>('scale');
  const [unit, setUnit] = useState('');
  const [min, setMin] = useState('1');
  const [max, setMax] = useState('5');
  const [optionsText, setOptionsText] = useState('');

  const canSave = name.trim().length > 0 && (type !== 'enum' || parseOptions(optionsText).length > 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;
    await addTrackable({
      studyId,
      name,
      type,
      unit: type === 'number' ? unit : undefined,
      min: type === 'scale' ? Number(min) : undefined,
      max: type === 'scale' ? Number(max) : undefined,
      options: type === 'enum' ? parseOptions(optionsText) : undefined,
    });
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
            placeholder={'Напр.\nменструация\nфолликулярная\nовуляция\nлютеиновая'}
          />
        </div>
      )}

      <div className="btn-row">
        <button type="button" className="btn btn-ghost" onClick={onDone}>
          Отмена
        </button>
        <button type="submit" className="btn btn-primary" disabled={!canSave} style={{ flex: 1 }}>
          Добавить
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
