import { useRef, useState } from 'react';
import { exportData, downloadBackup, importData } from '../lib/backup';

export default function DataTools({ hasData }: { hasData: boolean }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  async function handleExport() {
    const backup = await exportData();
    downloadBackup(backup);
    setMsg({ text: 'Файл резервной копии скачан', ok: true });
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // чтобы повторный выбор того же файла сработал
    if (!file) return;
    if (!confirm('Импортировать данные из файла? Записи с совпадающим id будут перезаписаны.')) return;
    try {
      const json = JSON.parse(await file.text());
      const r = await importData(json);
      setMsg({ text: `Импортировано: ${r.studies} иссл., ${r.trackables} показ., ${r.entries} записей`, ok: true });
    } catch (err) {
      setMsg({ text: `Ошибка импорта: ${(err as Error).message}`, ok: false });
    }
  }

  return (
    <div className="card stack" style={{ marginTop: 8 }}>
      <div className="section-title" style={{ margin: 0 }}>
        Данные
      </div>
      <p className="note" style={{ margin: 0 }}>
        Данные хранятся только в этом браузере. Делай резервную копию, чтобы не потерять их и
        перенести на другое устройство.
      </p>
      <div className="btn-row">
        <button className="btn" style={{ flex: 1 }} onClick={handleExport} disabled={!hasData}>
          ⬇ Экспорт
        </button>
        <button className="btn" style={{ flex: 1 }} onClick={() => fileRef.current?.click()}>
          ⬆ Импорт
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        style={{ display: 'none' }}
        onChange={handleFile}
      />
      {msg && (
        <p className="note" style={{ margin: 0, color: msg.ok ? 'var(--ok)' : 'var(--danger)' }}>
          {msg.ok ? '✓ ' : '✕ '}
          {msg.text}
        </p>
      )}
    </div>
  );
}
