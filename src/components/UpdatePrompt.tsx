import { useRegisterSW } from 'virtual:pwa-register/react';
import { useT } from '../lib/i18n';

// Как часто открытое приложение опрашивает сервер на предмет новой версии.
// Без этого service worker перепроверяется только при перезапуске приложения
// (или раз в ~24ч по логике браузера), поэтому плашка появляется с задержкой.
const UPDATE_CHECK_INTERVAL_MS = 60 * 1000;

// Показывает плашку «доступна новая версия» и обновляет service worker
// по нажатию (registerType: 'prompt' в vite.config).
export default function UpdatePrompt() {
  const { t } = useT();
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;
      setInterval(() => {
        void registration.update();
      }, UPDATE_CHECK_INTERVAL_MS);
    },
  });

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
