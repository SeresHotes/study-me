import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import type { Study } from '../types';
import { formatDate, studyProgress } from '../lib/date';

export default function StudiesPage() {
  const studies = useLiveQuery(() => db.studies.toArray(), []);
  const counts = useLiveQuery(async () => {
    const all = await db.trackables.toArray();
    const map: Record<string, number> = {};
    for (const t of all) map[t.studyId] = (map[t.studyId] ?? 0) + 1;
    return map;
  }, []);

  if (studies === undefined) return null;

  if (studies.length === 0) {
    return (
      <div className="empty">
        <span className="empty-emoji">◐</span>
        <p>
          Пока нет ни одного исследования.
          <br />
          Запусти первое — на срок, с набором показателей.
        </p>
        <Link to="/new" className="btn btn-primary">
          + Новое исследование
        </Link>
      </div>
    );
  }

  const sorted = [...studies].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'active' ? -1 : 1;
    return b.startDate.localeCompare(a.startDate);
  });

  return (
    <div className="stack">
      <h1 className="page-title">Мои исследования</h1>
      {sorted.map((s) => (
        <StudyCard key={s.id} study={s} trackableCount={counts?.[s.id] ?? 0} />
      ))}
    </div>
  );
}

function StudyCard({ study, trackableCount }: { study: Study; trackableCount: number }) {
  const p = studyProgress(study.startDate, study.endDate);

  return (
    <Link to={`/study/${study.id}`} className="card study-card">
      <div className="study-card-top">
        <h2 className="study-title">{study.name}</h2>
        {study.status === 'archived' ? (
          <span className="badge">В архиве</span>
        ) : p.isOver ? (
          <span className="badge badge-over">Срок вышел</span>
        ) : (
          <span className="badge badge-active">Активно</span>
        )}
      </div>
      {study.description && <p className="study-desc">{study.description}</p>}

      {p.percent !== null && (
        <div className="progress">
          <div className="progress-bar" style={{ width: `${p.percent}%` }} />
        </div>
      )}

      <div className="meta-row">
        <span>📅 с {formatDate(study.startDate)}</span>
        {study.endDate ? (
          p.daysLeft !== null && p.daysLeft >= 0 ? (
            <span>⏳ осталось {p.daysLeft} дн.</span>
          ) : (
            <span>завершено</span>
          )
        ) : (
          <span>бессрочно · {p.elapsedDays} дн.</span>
        )}
        <span>📊 {trackableCount} показателей</span>
      </div>
    </Link>
  );
}
