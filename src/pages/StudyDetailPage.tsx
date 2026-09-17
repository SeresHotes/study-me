import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import type { Entry, EntryValue, Trackable } from '../types';
import {
  addEntry,
  deleteEntry,
  deleteStudy,
  deleteTrackable,
  setStudyStatus,
} from '../db/service';
import {
  dateTimeInputToIso,
  dayKey,
  formatDate,
  formatTime,
  nowDateTimeInput,
  studyProgress,
} from '../lib/date';
import { formatValue, isEmptyValue, typeMeta } from '../lib/trackables';
import TrackableInput from '../components/TrackableInput';
import AddTrackableForm from '../components/AddTrackableForm';

type Tab = 'checkin' | 'history' | 'trackables';

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
        <button className={`tab ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>
          Записи
        </button>
        <button
          className={`tab ${tab === 'trackables' ? 'active' : ''}`}
          onClick={() => setTab('trackables')}
        >
          Показатели
        </button>
      </div>

      {tab === 'checkin' && <CheckInTab studyId={id} trackables={trackables} onGoto={setTab} />}
      {tab === 'history' && <HistoryTab studyId={id} trackables={trackables} />}
      {tab === 'trackables' && <TrackablesTab study={study} trackables={trackables} />}
    </div>
  );
}

// ---- Check-in ----

function CheckInTab({
  studyId,
  trackables,
  onGoto,
}: {
  studyId: string;
  trackables: Trackable[];
  onGoto: (t: Tab) => void;
}) {
  const [when, setWhen] = useState(nowDateTimeInput());
  const [values, setValues] = useState<Record<string, EntryValue | undefined>>({});
  const [justSaved, setJustSaved] = useState(0);

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

  const filledCount = trackables.filter((t) => !isEmptyValue(values[t.id])).length;

  async function handleSave() {
    const loggedAt = dateTimeInputToIso(when);
    const toSave = trackables.filter((t) => !isEmptyValue(values[t.id]));
    await Promise.all(
      toSave.map((t) =>
        addEntry({ studyId, trackableId: t.id, value: values[t.id] as EntryValue, loggedAt }),
      ),
    );
    setValues({});
    setWhen(nowDateTimeInput());
    setJustSaved(toSave.length);
  }

  return (
    <div className="stack">
      <div className="field">
        <label htmlFor="when">Когда</label>
        <input
          id="when"
          type="datetime-local"
          value={when}
          onChange={(e) => setWhen(e.target.value)}
        />
      </div>

      {trackables.map((t) => (
        <TrackableInput
          key={t.id}
          trackable={t}
          value={values[t.id]}
          onChange={(v) => {
            setJustSaved(0);
            setValues((prev) => ({ ...prev, [t.id]: v }));
          }}
        />
      ))}

      <button className="btn btn-primary btn-block" onClick={handleSave} disabled={filledCount === 0}>
        Сохранить {filledCount > 0 ? `(${filledCount})` : ''}
      </button>

      {justSaved > 0 && (
        <p className="note" style={{ textAlign: 'center', color: 'var(--ok)' }}>
          ✓ Сохранено записей: {justSaved}
        </p>
      )}
    </div>
  );
}

// ---- History ----

function HistoryTab({ studyId, trackables }: { studyId: string; trackables: Trackable[] }) {
  const entries = useLiveQuery(
    () => db.entries.where('studyId').equals(studyId).reverse().sortBy('loggedAt'),
    [studyId],
  );

  const byId = useMemo(() => {
    const m: Record<string, Trackable> = {};
    for (const t of trackables) m[t.id] = t;
    return m;
  }, [trackables]);

  if (entries === undefined) return null;

  if (entries.length === 0) {
    return (
      <div className="empty">
        <span className="empty-emoji">🗓️</span>
        <p>Пока нет ни одной записи. Отметься на вкладке «Отметиться».</p>
      </div>
    );
  }

  // сортировка reverse+sortBy даёт по возрастанию наоборот — приведём к убыванию
  const sorted = [...entries].sort((a, b) => b.loggedAt.localeCompare(a.loggedAt));

  const groups: { day: string; items: Entry[] }[] = [];
  for (const e of sorted) {
    const key = dayKey(e.loggedAt);
    const last = groups[groups.length - 1];
    if (last && last.day === key) last.items.push(e);
    else groups.push({ day: key, items: [e] });
  }

  return (
    <div>
      {groups.map((g) => (
        <div className="entry-day" key={g.day}>
          <div className="entry-day-title">{formatDate(g.items[0].loggedAt)}</div>
          {g.items.map((e) => {
            const t = byId[e.trackableId];
            return (
              <div className="entry-item" key={e.id}>
                <div className="entry-main">
                  <span className="entry-name">
                    {t ? `${typeMeta(t.type).icon} ${t.name}` : 'Показатель удалён'}
                  </span>
                  <span className="entry-value">{t ? formatValue(t, e.value) : String(e.value)}</span>
                  {e.note && <span className="note">{e.note}</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span className="entry-time">{formatTime(e.loggedAt)}</span>
                  <button
                    className="icon-btn"
                    title="Удалить запись"
                    onClick={() => deleteEntry(e.id)}
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ---- Trackables & settings ----

function TrackablesTab({
  study,
  trackables,
}: {
  study: { id: string; name: string; status: string };
  trackables: Trackable[];
}) {
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);

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
      {trackables.map((t) => (
        <div className="list-manage-item" key={t.id}>
          <div className="entry-main">
            <span className="entry-name">
              {typeMeta(t.type).icon} {t.name}
            </span>
            <span className="note">{describeTrackable(t)}</span>
          </div>
          <button className="icon-btn" title="Удалить" onClick={() => handleDeleteTrackable(t)}>
            🗑
          </button>
        </div>
      ))}

      {adding ? (
        <AddTrackableForm studyId={study.id} onDone={() => setAdding(false)} />
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
