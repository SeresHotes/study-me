import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { getTheme, nextTheme, setTheme, themeIcon, themeLabel } from './lib/theme';

export default function App() {
  const { pathname } = useLocation();
  const isHome = pathname === '/';
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
            onClick={cycleTheme}
            title={`Тема: ${themeLabel(theme)}`}
            aria-label={`Тема: ${themeLabel(theme)}`}
          >
            {themeIcon(theme)}
          </button>
          {isHome && (
            <Link to="/new" className="btn btn-primary btn-sm">
              + Исследование
            </Link>
          )}
        </div>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
