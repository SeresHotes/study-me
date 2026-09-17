import { useState } from 'react';
import type { Study } from '../types';
import { updateStudy } from '../db/service';
import { dayKey } from '../lib/date';
import { useT } from '../lib/i18n';

// Редактирование исследования: название, описание, даты. Тип отметок и записи
// не трогаем — их правят на своих экранах. Даты хранятся в ISO, а <input type=date>
// работает с YYYY-MM-DD, поэтому конвертируем туда-обратно через dayKey.
export default function EditStudyForm({ study, onDone }: { study: Study; onDone: () => void }) {
  const { t } = useT();
  const [name, setName] = useState(study.name);
  const [description, setDescription] = useState(study.description ?? '');
  const [startDate, setStartDate] = useState(dayKey(study.startDate));
  const [endDate, setEndDate] = useState(study.endDate ? dayKey(study.endDate) : '');
  const [saving, setSaving] = useState(false);

  const canSave = name.trim().length > 0 && !saving;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    await updateStudy(study.id, {
      name: name.trim(),
      description: description.trim() || undefined,
      startDate: new Date(startDate).toISOString(),
      endDate: endDate ? new Date(endDate).toISOString() : undefined,
    });
    onDone();
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="edit-name">{t('newStudy.name')}</label>
        <input
          id="edit-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('newStudy.namePh')}
          autoFocus
        />
      </div>

      <div className="field">
        <label htmlFor="edit-desc">{t('newStudy.why')}</label>
        <textarea
          id="edit-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('newStudy.whyPh')}
        />
      </div>

      <div className="row-2">
        <div className="field">
          <label htmlFor="edit-start">{t('newStudy.start')}</label>
          <input
            id="edit-start"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="edit-end">{t('newStudy.end')}</label>
          <input
            id="edit-end"
            type="date"
            min={startDate}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      <div className="row-2">
        <button type="button" className="btn btn-block" onClick={onDone}>
          {t('common.cancel')}
        </button>
        <button type="submit" className="btn btn-primary btn-block" disabled={!canSave}>
          {t('common.save')}
        </button>
      </div>
    </form>
  );
}
