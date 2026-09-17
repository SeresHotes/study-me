import { Link, Outlet, useLocation } from 'react-router-dom';

export default function App() {
  const { pathname } = useLocation();
  const isHome = pathname === '/';

  return (
    <div className="app">
      <header className="app-header">
        <Link to="/" className="brand">
          <span className="brand-mark">◐</span>
          <span className="brand-name">StudyMe</span>
        </Link>
        {isHome && (
          <Link to="/new" className="btn btn-primary btn-sm">
            + Исследование
          </Link>
        )}
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
