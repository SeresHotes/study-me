import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { getTheme, nextTheme, setTheme, themeIcon } from './lib/theme';
import { useT } from './lib/i18n';
import UpdatePrompt from './components/UpdatePrompt';

export default function App() {
  const { pathname } = useLocation();
  const isHome = pathname === '/';
  const { t, lang, setLang } = useT();
  const [theme, setThemeState] = useState(getTheme());

  function cycleTheme() {
    const next = nextTheme(theme);
    setTheme(next);
    setThemeState(next);
  }

  return (
    <div className="app">
      <header className="app-header">
        <Link to="/" className="brand">
          <span className="brand-mark">◐</span>
          <span className="brand-name">StudyMe</span>
        </Link>
        <div className="header-actions">
          <button
            className="btn btn-sm btn-ghost"
            onClick={() => setLang(lang === 'ru' ? 'en' : 'ru')}
            title={lang === 'ru' ? 'Switch to English' : 'Переключить на русский'}
          >
            {lang === 'ru' ? 'EN' : 'RU'}
          </button>
          <button
            className="btn btn-sm btn-ghost"
            onClick={cycleTheme}
            title={t(`theme.${theme}`)}
            aria-label={t(`theme.${theme}`)}
          >
            {themeIcon(theme)}
          </button>
          {isHome && (
            <Link to="/new" className="btn btn-primary btn-sm">
              {t('nav.newStudyShort')}
            </Link>
          )}
        </div>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
      <footer className="app-footer">StudyMe · {__APP_VERSION__}</footer>
      <UpdatePrompt />
    </div>
  );
}
