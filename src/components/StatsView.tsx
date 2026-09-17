import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import type { Entry, Trackable } from '../types';
import { typeMeta } from '../lib/trackables';
import { trackableColor } from '../lib/colors';
import { computeStats, computeDistribution } from '../lib/stats';
import { dayKey } from '../lib/date';

export default function StatsView({
  studyId,
  trackables,
}: {
  studyId: string;
  trackables: Trackable[];
}) {
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

  const totalEntries = entries.length;
  const activeDays = new Set(entries.map((e) => dayKey(e.loggedAt))).size;

  return (
    <div className="stack">
      <div className="stat-overview card">
        <div className="stat-big">
          <span className="stat-big-num">{totalEntries}</span>
          <span className="stat-big-label">записей</span>
        </div>
        <div className="stat-big">
          <span className="stat-big-num">{activeDays}</span>
          <span className="stat-big-label">дней с отметками</span>
        </div>
        <div className="stat-big">
          <span className="stat-big-num">{trackables.length}</span>
          <span className="stat-big-label">показателей</span>
        </div>
      </div>

      {trackables.map((t) => {
        const values = (byTrackable[t.id] ?? []).map((e) => e.value);
        const color = trackableColor(t);
        const stats = computeStats(t, values);
        const dist = computeDistribution(t, values);
        return (
          <div className="card" key={t.id}>
            <div className="trackable-input-head" style={{ marginBottom: 12 }}>
              <span className="dot" style={{ background: color }} />
              <span>
                {typeMeta(t.type).icon} {t.name}
              </span>
            </div>

            {values.length === 0 ? (
              <p className="note">Пока нет записей.</p>
            ) : (
              <>
                <div className="stat-grid">
                  {stats.map((s) => (
                    <div className="stat-cell" key={s.label}>
                      <span className="stat-val">{s.value}</span>
                      <span className="stat-lbl">{s.label}</span>
                    </div>
                  ))}
                </div>

                {dist.length > 0 && (
                  <div className="dist">
                    {dist.map((d, i) => (
                      <div className="dist-row" key={d.label}>
                        <span className="dist-label">{d.label}</span>
                        <div className="dist-track">
                          <div
                            className="dist-bar"
                            style={{
                              width: `${d.percent}%`,
                              background: shade(color, i, dist.length),
                            }}
                          />
                        </div>
                        <span className="dist-pct">{d.percent}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Слегка варьируем прозрачность цвета для разных сегментов распределения. */
function shade(color: string, index: number, total: number): string {
  if (total <= 1) return color;
  const min = 0.5;
  const alpha = 1 - (index / Math.max(1, total - 1)) * (1 - min);
  return `color-mix(in srgb, ${color} ${Math.round(alpha * 100)}%, transparent)`;
}
