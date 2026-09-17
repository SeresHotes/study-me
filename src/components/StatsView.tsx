import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import type { Entry, Trackable, EntryValue } from '../types';
import { formatValue, typeMeta } from '../lib/trackables';
import { formatDate, formatTime, dayKey } from '../lib/date';
import { trackableColor, resolveColor } from '../lib/colors';
import { useIsDark } from '../lib/theme';
import { computeStats, computeDistribution } from '../lib/stats';
import { LineChart, BarChart, DotPlot, DistBars } from './Charts';
import QuickLogModal from './QuickLogModal';

type Preset = '7' | '30' | '90' | 'all';
const PRESETS: { key: Preset; label: string }[] = [
  { key: '7', label: '7 дней' },
  { key: '30', label: '30 дней' },
  { key: '90', label: '90 дней' },
  { key: 'all', label: 'Всё' },
];

const DAY = 86400000;
const startOfDay = (ts: number) => {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};
const ts = (iso: string) => new Date(iso).getTime();
const axisDate = (t: number) => {
  const d = new Date(t);
  return `${d.getDate()}.${d.getMonth() + 1}`;
};

export default function StatsView({
  studyId,
  trackables,
}: {
  studyId: string;
  trackables: Trackable[];
}) {
  const isDark = useIsDark();
  const [preset, setPreset] = useState<Preset>('30');
  const [sel, setSel] = useState<string | null>(null); // null = все показатели
  const [table, setTable] = useState(false);

  const entries = useLiveQuery(
    () => db.entries.where('studyId').equals(studyId).toArray(),
    [studyId],
  );

  const byTrackable = useMemo(() => {
    const m: Record<string, Entry[]> = {};
    for (const e of entries ?? []) (m[e.trackableId] ??= []).push(e);
    return m;
  }, [entries]);

  if (entries === undefined) return null;

  if (trackables.length === 0) {
    return (
      <div className="empty">
        <span className="empty-emoji">📈</span>
        <p>Добавь показатели, чтобы видеть статистику.</p>
      </div>
    );
  }

  const from =
    preset === 'all'
      ? entries.length
        ? startOfDay(Math.min(...entries.map((e) => ts(e.loggedAt))))
        : startOfDay(Date.now())
      : startOfDay(Date.now()) - (Number(preset) - 1) * DAY;

  const inRange = (e: Entry) => ts(e.loggedAt) >= from;
  const shown = sel === null ? trackables : trackables.filter((t) => t.id === sel);

  const rangeEntries = entries.filter(inRange);
  const scopedEntries = rangeEntries.filter((e) => sel === null || e.trackableId === sel);
  const totalEntries = scopedEntries.length;
  const activeDays = new Set(scopedEntries.map((e) => dayKey(e.loggedAt))).size;

  return (
    <div className="stack">
      {/* Фильтры одной строкой над графиками */}
      <div className="filters">
        <div className="seg">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              className={`seg-btn ${preset === p.key ? 'active' : ''}`}
              onClick={() => setPreset(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="seg seg-2">
          <button className={`seg-btn ${!table ? 'active' : ''}`} onClick={() => setTable(false)}>
            📈 Графики
          </button>
          <button className={`seg-btn ${table ? 'active' : ''}`} onClick={() => setTable(true)}>
            ▤ Таблица
          </button>
        </div>
        <div className="chips filter-chips">
          <button
            className={`chip chip-filter ${sel === null ? 'active' : ''}`}
            onClick={() => setSel(null)}
          >
            Все
          </button>
          {trackables.map((t) => {
            const c = resolveColor(trackableColor(t), isDark);
            const active = sel === t.id;
            return (
              <button
                key={t.id}
                className={`chip chip-filter ${active ? 'active' : ''}`}
                style={active ? { borderColor: c } : undefined}
                onClick={() => setSel(t.id)}
              >
                <span className="dot" style={{ background: c }} />
                {t.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="stat-overview card">
        <div className="stat-big">
          <span className="stat-big-num">{totalEntries}</span>
          <span className="stat-big-label">записей за период</span>
        </div>
        <div className="stat-big">
          <span className="stat-big-num">{activeDays}</span>
          <span className="stat-big-label">дней с отметками</span>
        </div>
        <div className="stat-big">
          <span className="stat-big-num">{shown.length}</span>
          <span className="stat-big-label">показателей</span>
        </div>
      </div>

      {table ? (
        <TableView studyId={studyId} trackables={trackables} entries={scopedEntries} />
      ) : (
        shown.map((t) => {
          const rows = (byTrackable[t.id] ?? []).filter(inRange);
          const color = resolveColor(trackableColor(t), isDark);
          return (
            <TrackableChart key={t.id} trackable={t} entries={rows} color={color} from={from} />
          );
        })
      )}
    </div>
  );
}

function TrackableChart({
  trackable: t,
  entries,
  color,
  from,
}: {
  trackable: Trackable;
  entries: Entry[];
  color: string;
  from: number;
}) {
  const values = entries.map((e) => e.value);
  const stats = computeStats(t, values);

  return (
    <div className="card">
      <div className="trackable-input-head" style={{ marginBottom: 10 }}>
        <span className="dot" style={{ background: color }} />
        <span>
          {typeMeta(t.type).icon} {t.name}
        </span>
      </div>

      {values.length === 0 ? (
        <p className="note">Нет записей за выбранный период.</p>
      ) : (
        <>
          <div className="stat-grid" style={{ marginBottom: 12 }}>
            {stats.map((s) => (
              <div className="stat-cell" key={s.label}>
                <span className="stat-val">{s.value}</span>
                <span className="stat-lbl">{s.label}</span>
              </div>
            ))}
          </div>
          {renderChart(t, entries, color, from)}
        </>
      )}
    </div>
  );
}

function renderChart(t: Trackable, entries: Entry[], color: string, from: number) {
  const sorted = [...entries].sort((a, b) => ts(a.loggedAt) - ts(b.loggedAt));

  switch (t.type) {
    case 'scale': {
      const points = sorted.map((e) => ({ t: ts(e.loggedAt), v: Number(e.value) }));
      return (
        <LineChart
          points={points}
          color={color}
          yMin={t.min ?? 1}
          yMax={t.max ?? 5}
          fmtV={(n) => String(Math.round(n))}
          fmtDate={axisDate}
        />
      );
    }
    case 'number': {
      const nums = sorted.map((e) => Number(e.value)).filter((n) => !Number.isNaN(n));
      const points = sorted
        .map((e) => ({ t: ts(e.loggedAt), v: Number(e.value) }))
        .filter((p) => !Number.isNaN(p.v));
      let yMin = Math.min(...nums);
      let yMax = Math.max(...nums);
      if (yMin === yMax) {
        yMin -= 1;
        yMax += 1;
      }
      const round = (n: number) => String(Math.round(n * 10) / 10);
      return (
        <LineChart points={points} color={color} yMin={yMin} yMax={yMax} fmtV={round} fmtDate={axisDate} />
      );
    }
    case 'bool': {
      const bars = dailyTrueCounts(entries, from);
      return <BarChart bars={bars} color={color} fmtV={(n) => `${n} раз`} />;
    }
    case 'time': {
      const points = sorted
        .map((e) => ({ t: startOfDay(ts(e.loggedAt)), min: timeToMin(e.value) }))
        .filter((p): p is { t: number; min: number } => p.min !== null);
      return <DotPlot points={points} color={color} fmtDate={axisDate} />;
    }
    case 'enum': {
      const dist = computeDistribution(t, entries.map((e) => e.value));
      return <DistBars items={dist} color={color} />;
    }
    case 'text':
    default:
      return <p className="note">{entries.length} заметок за период.</p>;
  }
}

function dailyTrueCounts(entries: Entry[], from: number): { label: string; value: number; full: string }[] {
  const today = startOfDay(Date.now());
  const start = startOfDay(from);
  const counts: Record<number, number> = {};
  for (const e of entries) {
    if (e.value !== true) continue;
    const d = startOfDay(ts(e.loggedAt));
    counts[d] = (counts[d] ?? 0) + 1;
  }
  const out: { label: string; value: number; full: string }[] = [];
  for (let d = start; d <= today; d += DAY) {
    out.push({ label: axisDate(d), value: counts[d] ?? 0, full: formatDate(new Date(d).toISOString()) });
  }
  return out;
}

function timeToMin(v: EntryValue): number | null {
  if (typeof v !== 'string') return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(v);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

function TableView({
  studyId,
  trackables,
  entries,
}: {
  studyId: string;
  trackables: Trackable[];
  entries: Entry[];
}) {
  const [editing, setEditing] = useState<Entry | null>(null);
  const byId = useMemo(() => {
    const m: Record<string, Trackable> = {};
    for (const t of trackables) m[t.id] = t;
    return m;
  }, [trackables]);

  const sorted = [...entries].sort((a, b) => b.loggedAt.localeCompare(a.loggedAt));

  if (sorted.length === 0) return <p className="note">Нет записей за выбранный период.</p>;

  return (
    <div className="card table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Когда</th>
            <th>Показатель</th>
            <th>Значение</th>
            <th aria-label="Действия" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((e) => {
            const t = byId[e.trackableId];
            return (
              <tr key={e.id}>
                <td className="td-when">
                  {formatDate(e.loggedAt).replace(/ \d{4}$/, '')}, {formatTime(e.loggedAt)}
                </td>
                <td>{t ? t.name : '—'}</td>
                <td className="td-val">
                  {t ? formatValue(t, e.value) : String(e.value)}
                  {e.note && <span className="note"> · {e.note}</span>}
                </td>
                <td className="td-act">
                  {t && (
                    <button className="icon-btn" title="Изменить" onClick={() => setEditing(e)}>
                      ✎
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {editing && byId[editing.trackableId] && (
        <QuickLogModal
          studyId={studyId}
          trackable={byId[editing.trackableId]}
          entry={editing}
          onClose={() => setEditing(null)}
          onSaved={() => setEditing(null)}
        />
      )}
    </div>
  );
}
