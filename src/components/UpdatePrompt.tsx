import { useRegisterSW } from 'virtual:pwa-register/react';
import { useT } from '../lib/i18n';

// Показывает плашку «доступна новая версия» и обновляет service worker
// по нажатию (registerType: 'prompt' в vite.config).
export default function UpdatePrompt() {
  const { t } = useT();
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div className="update-bar">
      <span>{t('update.available')}</span>
      <div className="update-actions">
        <button className="btn btn-sm btn-ghost" onClick={() => setNeedRefresh(false)}>
          {t('update.later')}
        </button>
        <button className="btn btn-sm btn-primary" onClick={() => updateServiceWorker(true)}>
          {t('update.update')}
        </button>
      </div>
    </div>
  );
}
