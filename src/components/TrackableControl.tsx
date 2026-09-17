import type { Trackable, EntryValue } from '../types';

interface Props {
  trackable: Trackable;
  value: EntryValue | undefined;
  onChange: (value: EntryValue | undefined) => void;
}

/** Рендерит подходящий инпут под тип показателя. Выделение окрашивается
 *  в цвет показателя через CSS-переменную --accent на обёртке. */
export default function TrackableControl({ trackable, value, onChange }: Props) {
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

    case 'enum': {
      const opts = trackable.options ?? [];
      if (trackable.multi) {
        const arr = Array.isArray(value) ? value : [];
        return (
          <div className="chips">
            {opts.map((opt) => {
              const on = arr.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  className={`chip ${on ? 'selected' : ''}`}
                  onClick={() => {
                    const next = on ? arr.filter((x) => x !== opt) : [...arr, opt];
                    onChange(next.length ? next : undefined);
                  }}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        );
      }
      return (
        <div className="chips">
          {opts.map((opt) => (
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
    }

    case 'text':
    default:
      return (
        <textarea
          placeholder="Текст…"
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value || undefined)}
        />
      );
  }
}
