import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createStudy } from '../db/service';
import { todayDateInput } from '../lib/date';
import { useT } from '../lib/i18n';

export default function NewStudyPage() {
  const { t } = useT();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(todayDateInput());
  const [endDate, setEndDate] = useState('');
  const [saving, setSaving] = useState(false);

  const canSave = name.trim().length > 0 && !saving;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    const id = await createStudy({
      name,
      description,
      startDate: new Date(startDate).toISOString(),
      endDate: endDate ? new Date(endDate).toISOString() : undefined,
    });
    navigate(`/study/${id}`);
  }

  return (
    <div>
      <Link to="/" className="back-link">
        {t('nav.allStudies')}
      </Link>
      <h1 className="page-title">{t('newStudy.title')}</h1>

      <form className="stack" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="name">{t('newStudy.name')}</label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('newStudy.namePh')}
            autoFocus
          />
        </div>

        <div className="field">
          <label htmlFor="desc">{t('newStudy.why')}</label>
          <textarea
            id="desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('newStudy.whyPh')}
          />
        </div>

        <div className="row-2">
          <div className="field">
            <label htmlFor="start">{t('newStudy.start')}</label>
            <input
              id="start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="end">{t('newStudy.end')}</label>
            <input
              id="end"
              type="date"
              min={startDate}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
        <p className="note">{t('newStudy.note')}</p>

        <button type="submit" className="btn btn-primary btn-block" disabled={!canSave}>
          {t('newStudy.create')}
        </button>
      </form>
    </div>
  );
}
