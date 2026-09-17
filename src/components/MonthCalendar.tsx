import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import type { Entry, Trackable } from '../types';
import { dayKey, formatDate, formatTime } from '../lib/date';
import { formatValue, typeMeta } from '../lib/trackables';
import { trackableColor, resolveColor } from '../lib/colors';
import { useIsDark } from '../lib/theme';
import { deleteEntry } from '../db/service';

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

const pad = (n: number) => String(n).padStart(2, '0');
const keyOf = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

export default function MonthCalendar({
  studyId,
  trackables,
}: {
  studyId: string;
  trackables: Trackable[];
}) {
  const isDark = useIsDark();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selected, setSelected] = useState<string>(dayKey(now.toISOString()));

  const entries = useLiveQuery(
    () => db.entries.where('studyId').equals(studyId).toArray(),
    [studyId],
  );

  const byTrackable = useMemo(() => {
    const m: Record<string, Trackable> = {};
    for (const t of trackables) m[t.id] = t;
    return m;
  }, [trackables]);

  // dayKey -> записи этого дня
  const byDay = useMemo(() => {
    const m: Record<string, Entry[]> = {};
    for (const e of entries ?? []) {
      const k = dayKey(e.loggedAt);
      (m[k] ??= []).push(e);
    }
    return m;
  }, [entries]);

  if (entries === undefined) return null;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = (new Date(year, month, 1).getDay() + 6) % 7; // Пн = 0
  const todayKey = dayKey(now.toISOString());

  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function shift(delta: number) {
    const m = month + delta;
    const y = year + Math.floor(m / 12);
    const nm = ((m % 12) + 12) % 12;
    setYear(y);
    setMonth(nm);
  }

  /** Уникальные цвета показателей, отмеченных в этот день (в порядке показателей). */
  function dayColors(key: string): string[] {
    const list = byDay[key];
    if (!list) return [];
    const ids = new Set(list.map((e) => e.trackableId));
    return trackables.filter((t) => ids.has(t.id)).map((t) => resolveColor(trackableColor(t), isDark));
  }

  const selectedEntries = (byDay[selected] ?? []).sort((a, b) =>
    b.loggedAt.localeCompare(a.loggedAt),
  );

  return (
    <div>
      <div className="cal-head">
        <button className="icon-btn" onClick={() => shift(-1)} aria-label="Предыдущий месяц">
          ‹
        </button>
        <div className="cal-title">
          {MONTHS[month]} {year}
        </div>
        <button className="icon-btn" onClick={() => shift(1)} aria-label="Следующий месяц">
          ›
        </button>
      </div>

      <div className="cal-grid cal-weekdays">
        {WEEKDAYS.map((w) => (
          <div key={w} className="cal-weekday">
            {w}
          </div>
        ))}
      </div>

      <div className="cal-grid">
        {cells.map((d, i) => {
          if (d === null) return <div key={`b${i}`} className="cal-cell empty" />;
          const key = keyOf(year, month, d);
          const colors = dayColors(key);
          return (
            <button
              key={key}
              className={`cal-cell ${key === selected ? 'selected' : ''} ${
                key === todayKey ? 'today' : ''
              }`}
              onClick={() => setSelected(key)}
            >
              <span className="cal-day">{d}</span>
              <span className="cal-dots">
                {colors.slice(0, 4).map((c, idx) => (
                  <span key={idx} className="cal-dot" style={{ background: c }} />
                ))}
                {colors.length > 4 && <span className="cal-more">+{colors.length - 4}</span>}
              </span>
            </button>
          );
        })}
      </div>

      <div className="section-title" style={{ marginTop: 18 }}>
        {formatDate(`${selected}T12:00:00`)}
      </div>
      {selectedEntries.length === 0 ? (
        <p className="note">В этот день ничего не отмечено.</p>
      ) : (
        selectedEntries.map((e) => {
          const t = byTrackable[e.trackableId];
          return (
            <div className="entry-item" key={e.id}>
              <div className="entry-main">
                <span className="entry-name">
                  {t && <span className="dot" style={{ background: resolveColor(trackableColor(t), isDark) }} />}
                  {t ? `${typeMeta(t.type).icon} ${t.name}` : 'Показатель удалён'}
                </span>
                <span className="entry-value">{t ? formatValue(t, e.value) : String(e.value)}</span>
                {e.note && <span className="note">{e.note}</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span className="entry-time">{formatTime(e.loggedAt)}</span>
                <button className="icon-btn" title="Удалить" onClick={() => deleteEntry(e.id)}>
                  ✕
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
