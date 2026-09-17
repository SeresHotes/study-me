import { useRegisterSW } from 'virtual:pwa-register/react';

// Показывает плашку «доступна новая версия» и обновляет service worker
// по нажатию (registerType: 'prompt' в vite.config).
export default function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div className="update-bar">
      <span>🔄 Доступна новая версия</span>
      <div className="update-actions">
        <button className="btn btn-sm btn-ghost" onClick={() => setNeedRefresh(false)}>
          Позже
        </button>
        <button className="btn btn-sm btn-primary" onClick={() => updateServiceWorker(true)}>
          Обновить
        </button>
      </div>
    </div>
  );
}
