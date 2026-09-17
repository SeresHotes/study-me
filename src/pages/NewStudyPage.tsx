import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createStudy } from '../db/service';
import { todayDateInput } from '../lib/date';

export default function NewStudyPage() {
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
        ← Назад
      </Link>
      <h1 className="page-title">Новое исследование</h1>

      <form className="stack" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="name">Название</label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Напр. Сон и настроение, октябрь"
            autoFocus
          />
        </div>

        <div className="field">
          <label htmlFor="desc">Зачем это исследование (необязательно)</label>
          <textarea
            id="desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Гипотеза, что хочу понять…"
          />
        </div>

        <div className="row-2">
          <div className="field">
            <label htmlFor="start">Начало</label>
            <input
              id="start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="end">Конец (необязательно)</label>
            <input
              id="end"
              type="date"
              min={startDate}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
        <p className="note">
          Оставь конец пустым для бессрочного наблюдения. Показатели добавишь на следующем шаге.
        </p>

        <button type="submit" className="btn btn-primary btn-block" disabled={!canSave}>
          Создать исследование
        </button>
      </form>
    </div>
  );
}
