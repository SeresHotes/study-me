import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import type { Study, Trackable } from '../types';
import { deleteStudy, deleteTrackable, setStudyStatus, updateTrackable } from '../db/service';
import { formatDate, studyProgress } from '../lib/date';
import { typeMeta, typeLabel } from '../lib/trackables';
import { suggestColor, trackableColor, resolveColor } from '../lib/colors';
import { useIsDark } from '../lib/theme';
import { useT } from '../lib/i18n';
import AddTrackableForm from '../components/AddTrackableForm';
import EditStudyForm from '../components/EditStudyForm';
import ColorPalette from '../components/ColorPalette';
import Journal from '../components/Journal';
import StatsView from '../components/StatsView';

type Tab = 'journal' | 'stats' | 'trackables';

export default function StudyDetailPage() {
  const { t } = useT();
  const { id = '' } = useParams();
  const [tab, setTab] = useState<Tab>('journal');

  // Dexie .get() возвращает undefined и для «грузится», и для «не найдено» —
  // приводим отсутствие к null, чтобы отличить загрузку от несуществующего id.
  const study = useLiveQuery(async () => (await db.studies.get(id)) ?? null, [id]);
  const trackables = useLiveQuery(
    () => db.trackables.where('studyId').equals(id).sortBy('order'),
    [id],
  );

  if (study === undefined || trackables === undefined) return null;
  if (study === null) {
    return (
      <div className="empty">
        <p>{t('study.notFound')}</p>
        <Link to="/" className="btn">
          {t('study.toList')}
        </Link>
      </div>
    );
  }

  const p = studyProgress(study.startDate, study.endDate);

  return (
    <div>
      <Link to="/" className="back-link">
        {t('nav.allStudies')}
      </Link>
      <h1 className="page-title">{study.name}</h1>
      {study.description && <p className="study-desc">{study.description}</p>}
      <div className="meta-row">
        <span>{t('study.since', { date: formatDate(study.startDate) })}</span>
        {study.endDate && <span>{t('study.to', { date: formatDate(study.endDate) })}</span>}
        {p.daysLeft !== null && p.daysLeft >= 0 && <span>{t('study.daysLeft', { n: p.daysLeft })}</span>}
        {study.status === 'archived' && <span className="badge">{t('studies.archived')}</span>}
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'journal' ? 'active' : ''}`} onClick={() => setTab('journal')}>
          {t('study.tabJournal')}
        </button>
        <button className={`tab ${tab === 'stats' ? 'active' : ''}`} onClick={() => setTab('stats')}>
          {t('study.tabStats')}
        </button>
        <button className={`tab ${tab === 'trackables' ? 'active' : ''}`} onClick={() => setTab('trackables')}>
          {t('study.tabMetrics')}
        </button>
      </div>

      {tab === 'journal' && (
        <Journal studyId={id} trackables={trackables} onGotoTrackables={() => setTab('trackables')} />
      )}
      {tab === 'stats' && <StatsView studyId={id} trackables={trackables} />}
      {tab === 'trackables' && <TrackablesTab study={study} trackables={trackables} />}
    </div>
  );
}

// ---- Показатели и настройки ----

function TrackablesTab({ study, trackables }: { study: Study; trackables: Trackable[] }) {
  const { t: tr } = useT();
  const navigate = useNavigate();
  const isDark = useIsDark();
  const [adding, setAdding] = useState(false);
  const [editingColor, setEditingColor] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingStudy, setEditingStudy] = useState(false);

  async function handleDeleteStudy() {
    if (!confirm(tr('metrics.confirmDeleteStudy', { name: study.name }))) return;
    await deleteStudy(study.id);
    navigate('/');
  }

  async function handleDeleteTrackable(t: Trackable) {
    if (!confirm(tr('metrics.confirmDeleteMetric', { name: t.name }))) return;
    await deleteTrackable(t.id);
  }

  return (
    <div className="stack">
      <div className="section-title">{tr('metrics.title')}</div>
      {trackables.length === 0 && !adding && <p className="note">{tr('metrics.empty')}</p>}
      {trackables.map((t) => {
        const canonical = trackableColor(t);
        const color = resolveColor(canonical, isDark);
        if (editingId === t.id) {
          return (
            <AddTrackableForm
              key={t.id}
              studyId={study.id}
              suggestedColor={canonical}
              trackable={t}
              onDone={() => setEditingId(null)}
            />
          );
        }
        return (
          <div className="list-manage" key={t.id}>
            <div className="list-manage-item">
              <div className="entry-main">
                <span className="entry-name">
                  <button
                    className="dot dot-btn"
                    style={{ background: color }}
                    title={tr('metrics.changeColor')}
                    onClick={() => setEditingColor(editingColor === t.id ? null : t.id)}
                  />
                  {typeMeta(t.type).icon} {t.name}
                </span>
                <span className="note">{describeTrackable(t)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <button
                  className="icon-btn"
                  title={tr('common.edit')}
                  onClick={() => {
                    setEditingColor(null);
                    setEditingId(t.id);
                  }}
                >
                  ✎
                </button>
                <button className="icon-btn" title={tr('common.delete')} onClick={() => handleDeleteTrackable(t)}>
                  🗑
                </button>
              </div>
            </div>
            {editingColor === t.id && (
              <div className="color-edit">
                <ColorPalette
                  value={canonical}
                  onPick={async (c) => {
                    await updateTrackable(t.id, { color: c });
                    setEditingColor(null);
                  }}
                />
              </div>
            )}
          </div>
        );
      })}

      {adding ? (
        <AddTrackableForm
          studyId={study.id}
          suggestedColor={suggestColor(trackables.length)}
          onDone={() => setAdding(false)}
        />
      ) : (
        <button className="btn btn-block" onClick={() => setAdding(true)}>
          {tr('metrics.add')}
        </button>
      )}

      <div className="section-title" style={{ marginTop: 16 }}>
        {tr('metrics.studySection')}
      </div>
      {editingStudy ? (
        <EditStudyForm study={study} onDone={() => setEditingStudy(false)} />
      ) : (
        <button className="btn btn-block" onClick={() => setEditingStudy(true)}>
          {tr('metrics.editStudy')}
        </button>
      )}
      {study.status === 'active' ? (
        <button className="btn btn-block" onClick={() => setStudyStatus(study.id, 'archived')}>
          {tr('metrics.archive')}
        </button>
      ) : (
        <button className="btn btn-block" onClick={() => setStudyStatus(study.id, 'active')}>
          {tr('metrics.unarchive')}
        </button>
      )}
      <button className="btn btn-block btn-danger" onClick={handleDeleteStudy}>
        {tr('metrics.deleteStudy')}
      </button>
    </div>
  );
}

function describeTrackable(t: Trackable): string {
  const label = typeLabel(t.type);
  switch (t.type) {
    case 'scale':
      return `${label} · ${t.min ?? 1}–${t.max ?? 5}`;
    case 'number':
      return t.unit ? `${label} · ${t.unit}` : label;
    case 'enum':
      return `${label} · ${(t.options ?? []).join(', ')}`;
    default:
      return label;
  }
}
