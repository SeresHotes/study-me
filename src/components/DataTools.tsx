import { useRef, useState } from 'react';
import { exportData, downloadBackup, importData } from '../lib/backup';
import { useT } from '../lib/i18n';

export default function DataTools({ hasData }: { hasData: boolean }) {
  const { t } = useT();
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  async function handleExport() {
    const backup = await exportData();
    downloadBackup(backup);
    setMsg({ text: t('data.exported'), ok: true });
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // чтобы повторный выбор того же файла сработал
    if (!file) return;
    if (!confirm(t('data.confirmImport'))) return;
    try {
      const json = JSON.parse(await file.text());
      const r = await importData(json);
      setMsg({ text: t('data.imported', { s: r.studies, t: r.trackables, e: r.entries }), ok: true });
    } catch (err) {
      setMsg({ text: t('data.importError', { msg: (err as Error).message }), ok: false });
    }
  }

  return (
    <div className="card stack" style={{ marginTop: 8 }}>
      <div className="section-title" style={{ margin: 0 }}>
        {t('data.title')}
      </div>
      <p className="note" style={{ margin: 0 }}>
        {t('data.note')}
      </p>
      <div className="btn-row">
        <button className="btn" style={{ flex: 1 }} onClick={handleExport} disabled={!hasData}>
          {t('data.export')}
        </button>
        <button className="btn" style={{ flex: 1 }} onClick={() => fileRef.current?.click()}>
          {t('data.import')}
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
