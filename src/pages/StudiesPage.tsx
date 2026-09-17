import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import type { Study } from '../types';
import { formatDate, studyProgress } from '../lib/date';
import { useT } from '../lib/i18n';
import DataTools from '../components/DataTools';

export default function StudiesPage() {
  const { t } = useT();
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
      <>
        <div className="empty">
          <span className="empty-emoji">◐</span>
          <p>
            {t('studies.emptyTitle')}
            <br />
            {t('studies.emptyHint')}
          </p>
          <Link to="/new" className="btn btn-primary">
            {t('studies.new')}
          </Link>
        </div>
        <DataTools hasData={false} />
      </>
    );
  }

  const sorted = [...studies].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'active' ? -1 : 1;
    return b.startDate.localeCompare(a.startDate);
  });

  return (
    <div className="stack">
      <h1 className="page-title">{t('studies.title')}</h1>
      {sorted.map((s) => (
        <StudyCard key={s.id} study={s} trackableCount={counts?.[s.id] ?? 0} />
      ))}
      <DataTools hasData={studies.length > 0} />
    </div>
  );
}

function StudyCard({ study, trackableCount }: { study: Study; trackableCount: number }) {
  const { t } = useT();
  const p = studyProgress(study.startDate, study.endDate);

  return (
    <Link to={`/study/${study.id}`} className="card study-card">
      <div className="study-card-top">
        <h2 className="study-title">{study.name}</h2>
        {study.status === 'archived' ? (
          <span className="badge">{t('studies.archived')}</span>
        ) : p.isOver ? (
          <span className="badge badge-over">{t('studies.over')}</span>
        ) : (
          <span className="badge badge-active">{t('studies.active')}</span>
        )}
      </div>
      {study.description && <p className="study-desc">{study.description}</p>}

      {p.percent !== null && (
        <div className="progress">
          <div className="progress-bar" style={{ width: `${p.percent}%` }} />
        </div>
      )}

      <div className="meta-row">
        <span>{t('studies.since', { date: formatDate(study.startDate) })}</span>
        {study.endDate ? (
          p.daysLeft !== null && p.daysLeft >= 0 ? (
            <span>{t('studies.daysLeft', { n: p.daysLeft })}</span>
          ) : (
            <span>{t('studies.finished')}</span>
          )
        ) : (
          <span>{t('studies.openEnded', { n: p.elapsedDays })}</span>
        )}
        <span>{t('studies.metricsCount', { n: trackableCount })}</span>
      </div>
    </Link>
  );
}
