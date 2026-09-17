import { useMemo, useState, type CSSProperties } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import type { Entry, Trackable } from '../types';
import { dayKey, formatDate, formatTime, monthYearLabel, weekdayShort } from '../lib/date';
import { formatValue, typeMeta } from '../lib/trackables';
import { trackableColor, resolveColor } from '../lib/colors';
import { useIsDark } from '../lib/theme';
import { useT } from '../lib/i18n';
import { deleteEntry } from '../db/service';
import QuickLogModal from './QuickLogModal';

const pad = (n: number) => String(n).padStart(2, '0');
const keyOf = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

export default function Journal({
  studyId,
  trackables,
  onGotoTrackables,
}: {
  studyId: string;
  trackables: Trackable[];
  onGotoTrackables: () => void;
}) {
  const { t: tr } = useT();
  const isDark = useIsDark();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selected, setSelected] = useState<string>(dayKey(now.toISOString()));
  const [adding, setAdding] = useState<Trackable | null>(null);
  const [editing, setEditing] = useState<Entry | null>(null);
  const [toast, setToast] = useState('');

  const entries = useLiveQuery(
    () => db.entries.where('studyId').equals(studyId).toArray(),
    [studyId],
  );

  const byTrackable = useMemo(() => {
    const m: Record<string, Trackable> = {};
    for (const t of trackables) m[t.id] = t;
    return m;
  }, [trackables]);

  const byDay = useMemo(() => {
    const m: Record<string, Entry[]> = {};
    for (const e of entries ?? []) {
      const k = dayKey(e.loggedAt);
      (m[k] ??= []).push(e);
    }
    return m;
  }, [entries]);

  if (entries === undefined) return null;

  if (trackables.length === 0) {
    return (
      <div className="empty">
        <span className="empty-emoji">📊</span>
        <p>{tr('journal.emptyMetrics')}</p>
        <button className="btn btn-primary" onClick={onGotoTrackables}>
          {tr('journal.addMetrics')}
        </button>
      </div>
    );
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = (new Date(year, month, 1).getDay() + 6) % 7;
  const todayKey = dayKey(now.toISOString());

  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function shift(delta: number) {
    const m = month + delta;
    const y = year + Math.floor(m / 12);
    setYear(y);
    setMonth(((m % 12) + 12) % 12);
  }

  function dayColors(key: string): string[] {
    const list = byDay[key];
    if (!list) return [];
    const ids = new Set(list.map((e) => e.trackableId));
    return trackables.filter((t) => ids.has(t.id)).map((t) => resolveColor(trackableColor(t), isDark));
  }

  const selectedEntries = (byDay[selected] ?? []).sort((a, b) => b.loggedAt.localeCompare(a.loggedAt));
  const isToday = selected === todayKey;

  return (
    <div>
      <div className="cal-head">
        <button className="icon-btn" onClick={() => shift(-1)} aria-label="‹">
          ‹
        </button>
        <div className="cal-title">{monthYearLabel(year, month)}</div>
        <button className="icon-btn" onClick={() => shift(1)} aria-label="›">
          ›
        </button>
      </div>

      <div className="cal-grid cal-weekdays">
        {weekdayShort().map((w) => (
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
              className={`cal-cell ${key === selected ? 'selected' : ''} ${key === todayKey ? 'today' : ''}`}
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
        {isToday
          ? tr('journal.today')
          : tr('journal.addFor', { date: formatDate(`${selected}T12:00:00`) })}
      </div>
      <div className="quick-grid">
        {trackables.map((t) => {
          const color = resolveColor(trackableColor(t), isDark);
          return (
            <button
              key={t.id}
              className="quick-btn"
              style={{ '--qc': color } as CSSProperties}
              onClick={() => setAdding(t)}
            >
              <span className="quick-icon">{typeMeta(t.type).icon}</span>
              <span className="quick-name">{t.name}</span>
            </button>
          );
        })}
      </div>
      {toast && (
        <p className="note" style={{ textAlign: 'center', color: 'var(--ok)', marginTop: 12 }}>
          ✓ {tr('journal.logged', { name: toast })}
        </p>
      )}

      <div className="section-title" style={{ marginTop: 20 }}>
        {tr('journal.entriesFor', { date: formatDate(`${selected}T12:00:00`) })}
      </div>
      {selectedEntries.length === 0 ? (
        <p className="note">{tr('journal.emptyDay')}</p>
      ) : (
        selectedEntries.map((e) => {
          const t = byTrackable[e.trackableId];
          return (
            <div className="entry-item" key={e.id}>
              <div className="entry-main">
                <span className="entry-name">
                  {t && <span className="dot" style={{ background: resolveColor(trackableColor(t), isDark) }} />}
                  {t ? `${typeMeta(t.type).icon} ${t.name}` : tr('journal.deletedMetric')}
                </span>
                <span className="entry-value">{t ? formatValue(t, e.value) : String(e.value)}</span>
                {e.note && <span className="note">{e.note}</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <span className="entry-time">{formatTime(e.loggedAt)}</span>
                {t && (
                  <button className="icon-btn" title={tr('common.edit')} onClick={() => setEditing(e)}>
                    ✎
                  </button>
                )}
                <button className="icon-btn" title={tr('common.delete')} onClick={() => deleteEntry(e.id)}>
                  ✕
                </button>
              </div>
            </div>
          );
        })
      )}

      {adding && (
        <QuickLogModal
          studyId={studyId}
          trackable={adding}
          initialDate={selected}
          onClose={() => setAdding(null)}
          onSaved={(name) => setToast(name)}
        />
      )}
      {editing && byTrackable[editing.trackableId] && (
        <QuickLogModal
          studyId={studyId}
          trackable={byTrackable[editing.trackableId]}
          entry={editing}
          onClose={() => setEditing(null)}
          onSaved={() => setEditing(null)}
        />
      )}
    </div>
  );
}
