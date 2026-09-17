import type { Trackable, EntryValue } from '../types';
import { typeMeta } from '../lib/trackables';

interface Props {
  trackable: Trackable;
  value: EntryValue | undefined;
  onChange: (value: EntryValue | undefined) => void;
}

export default function TrackableInput({ trackable, value, onChange }: Props) {
  const meta = typeMeta(trackable.type);

  return (
    <div className="trackable-input">
      <div className="trackable-input-head">
        <span className="trackable-type-icon">{meta.icon}</span>
        <span>{trackable.name}</span>
      </div>
      {renderControl(trackable, value, onChange)}
    </div>
  );
}

function renderControl(
  trackable: Trackable,
  value: EntryValue | undefined,
  onChange: (value: EntryValue | undefined) => void,
) {
  switch (trackable.type) {
    case 'scale': {
      const min = trackable.min ?? 1;
      const max = trackable.max ?? 5;
      const nums: number[] = [];
      for (let i = min; i <= max; i++) nums.push(i);
      return (
        <div className="scale-row">
          {nums.map((n) => (
            <button
              key={n}
              type="button"
              className={`scale-btn ${value === n ? 'selected' : ''}`}
              onClick={() => onChange(value === n ? undefined : n)}
            >
              {n}
            </button>
          ))}
        </div>
      );
    }

    case 'number':
      return (
        <input
          type="number"
          inputMode="decimal"
          placeholder={trackable.unit ? `значение, ${trackable.unit}` : 'значение'}
          value={value === undefined ? '' : String(value)}
          onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
        />
      );

    case 'bool':
      return (
        <div className="chips">
          <button
            type="button"
            className={`chip ${value === true ? 'selected' : ''}`}
            onClick={() => onChange(value === true ? undefined : true)}
          >
            Да
          </button>
          <button
            type="button"
            className={`chip ${value === false ? 'selected' : ''}`}
            onClick={() => onChange(value === false ? undefined : false)}
          >
            Нет
          </button>
        </div>
      );

    case 'time':
      return (
        <input
          type="time"
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value || undefined)}
        />
      );

    case 'enum':
      return (
        <div className="chips">
          {(trackable.options ?? []).map((opt) => (
            <button
              key={opt}
              type="button"
              className={`chip ${value === opt ? 'selected' : ''}`}
              onClick={() => onChange(value === opt ? undefined : opt)}
            >
              {opt}
            </button>
          ))}
        </div>
      );

    case 'text':
    default:
      return (
        <textarea
          placeholder="Заметка…"
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value || undefined)}
        />
      );
  }
}
