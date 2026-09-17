import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import type { Trackable } from '../types';
import { deleteStudy, deleteTrackable, setStudyStatus, updateTrackable } from '../db/service';
import { formatDate, studyProgress } from '../lib/date';
import { typeMeta } from '../lib/trackables';
import { suggestColor, trackableColor } from '../lib/colors';
import QuickLogModal from '../components/QuickLogModal';
import AddTrackableForm from '../components/AddTrackableForm';
import ColorPalette from '../components/ColorPalette';
import MonthCalendar from '../components/MonthCalendar';
import StatsView from '../components/StatsView';

type Tab = 'checkin' | 'calendar' | 'stats' | 'trackables';

export default function StudyDetailPage() {
  const { id = '' } = useParams();
  const [tab, setTab] = useState<Tab>('checkin');

  const study = useLiveQuery(() => db.studies.get(id), [id]);
  const trackables = useLiveQuery(
    () => db.trackables.where('studyId').equals(id).sortBy('order'),
    [id],
  );

  if (study === undefined || trackables === undefined) return null;
  if (study === null) {
    return (
      <div className="empty">
        <p>Исследование не найдено.</p>
        <Link to="/" className="btn">
          К списку
        </Link>
      </div>
    );
  }

  const p = studyProgress(study.startDate, study.endDate);

  return (
    <div>
      <Link to="/" className="back-link">
        ← Все исследования
      </Link>
      <h1 className="page-title">{study.name}</h1>
      {study.description && <p className="study-desc">{study.description}</p>}
      <div className="meta-row">
        <span>📅 с {formatDate(study.startDate)}</span>
        {study.endDate && <span>по {formatDate(study.endDate)}</span>}
        {p.daysLeft !== null && p.daysLeft >= 0 && <span>⏳ осталось {p.daysLeft} дн.</span>}
        {study.status === 'archived' && <span className="badge">В архиве</span>}
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'checkin' ? 'active' : ''}`} onClick={() => setTab('checkin')}>
          Отметиться
        </button>
        <button className={`tab ${tab === 'calendar' ? 'active' : ''}`} onClick={() => setTab('calendar')}>
          Календарь
        </button>
        <button className={`tab ${tab === 'stats' ? 'active' : ''}`} onClick={() => setTab('stats')}>
          Статистика
        </button>
        <button className={`tab ${tab === 'trackables' ? 'active' : ''}`} onClick={() => setTab('trackables')}>
          Показатели
        </button>
      </div>

      {tab === 'checkin' && <CheckInTab studyId={id} trackables={trackables} onGoto={setTab} />}
      {tab === 'calendar' && <MonthCalendar studyId={id} trackables={trackables} />}
      {tab === 'stats' && <StatsView studyId={id} trackables={trackables} />}
      {tab === 'trackables' && <TrackablesTab study={study} trackables={trackables} />}
    </div>
  );
}

// ---- Быстрый ввод ----

function CheckInTab({
  studyId,
  trackables,
  onGoto,
}: {
  studyId: string;
  trackables: Trackable[];
  onGoto: (t: Tab) => void;
}) {
  const [active, setActive] = useState<Trackable | null>(null);
  const [toast, setToast] = useState('');

  if (trackables.length === 0) {
    return (
      <div className="empty">
        <span className="empty-emoji">📊</span>
        <p>Сначала добавь показатели, которые будешь отслеживать.</p>
        <button className="btn btn-primary" onClick={() => onGoto('trackables')}>
          Добавить показатели
        </button>
      </div>
    );
  }

  return (
    <div>
      <p className="note" style={{ marginBottom: 12 }}>
        Нажми на показатель, чтобы внести запись.
      </p>
      <div className="quick-grid">
        {trackables.map((t) => {
          const color = trackableColor(t);
          return (
            <button
              key={t.id}
              className="quick-btn"
              style={{ borderColor: color }}
              onClick={() => setActive(t)}
            >
              <span className="quick-dot" style={{ background: color }} />
              <span className="quick-icon">{typeMeta(t.type).icon}</span>
              <span className="quick-name">{t.name}</span>
            </button>
          );
        })}
      </div>

      {toast && (
        <p className="note" style={{ textAlign: 'center', color: 'var(--ok)', marginTop: 14 }}>
          ✓ Записано: {toast}
        </p>
      )}

      {active && (
        <QuickLogModal
          studyId={studyId}
          trackable={active}
          onClose={() => setActive(null)}
          onSaved={(name) => setToast(name)}
        />
      )}
    </div>
  );
}

// ---- Показатели и настройки ----

function TrackablesTab({
  study,
  trackables,
}: {
  study: { id: string; name: string; status: string };
  trackables: Trackable[];
}) {
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const [editingColor, setEditingColor] = useState<string | null>(null);

  async function handleDeleteStudy() {
    if (!confirm(`Удалить исследование «${study.name}» вместе со всеми записями?`)) return;
    await deleteStudy(study.id);
    navigate('/');
  }

  async function handleDeleteTrackable(t: Trackable) {
    if (!confirm(`Удалить показатель «${t.name}» и все его записи?`)) return;
    await deleteTrackable(t.id);
  }

  return (
    <div className="stack">
      <div className="section-title">Показатели</div>
      {trackables.length === 0 && !adding && (
        <p className="note">Ещё нет показателей. Добавь первый.</p>
      )}
      {trackables.map((t) => {
        const color = trackableColor(t);
        return (
          <div className="list-manage" key={t.id}>
            <div className="list-manage-item">
              <div className="entry-main">
                <span className="entry-name">
                  <button
                    className="dot dot-btn"
                    style={{ background: color }}
                    title="Изменить цвет"
                    onClick={() => setEditingColor(editingColor === t.id ? null : t.id)}
                  />
                  {typeMeta(t.type).icon} {t.name}
                </span>
                <span className="note">{describeTrackable(t)}</span>
              </div>
              <button className="icon-btn" title="Удалить" onClick={() => handleDeleteTrackable(t)}>
                🗑
              </button>
            </div>
            {editingColor === t.id && (
              <div className="color-edit">
                <ColorPalette
                  value={color}
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
          + Добавить показатель
        </button>
      )}

      <div className="section-title" style={{ marginTop: 16 }}>
        Исследование
      </div>
      {study.status === 'active' ? (
        <button className="btn btn-block" onClick={() => setStudyStatus(study.id, 'archived')}>
          Завершить и в архив
        </button>
      ) : (
        <button className="btn btn-block" onClick={() => setStudyStatus(study.id, 'active')}>
          Вернуть в активные
        </button>
      )}
      <button className="btn btn-block btn-danger" onClick={handleDeleteStudy}>
        Удалить исследование
      </button>
    </div>
  );
}

function describeTrackable(t: Trackable): string {
  const meta = typeMeta(t.type);
  switch (t.type) {
    case 'scale':
      return `${meta.label} · ${t.min ?? 1}–${t.max ?? 5}`;
    case 'number':
      return t.unit ? `${meta.label} · ${t.unit}` : meta.label;
    case 'enum':
      return `${meta.label} · ${(t.options ?? []).join(', ')}`;
    default:
      return meta.label;
  }
}
