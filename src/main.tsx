import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createHashRouter } from 'react-router-dom';
import App from './App';
import StudiesPage from './pages/StudiesPage';
import NewStudyPage from './pages/NewStudyPage';
import StudyDetailPage from './pages/StudyDetailPage';
import { initTheme } from './lib/theme';
import './index.css';

initTheme();

// HashRouter (URL с #) — надёжен на GitHub Pages: перезагрузка глубокой
// ссылки не даёт 404, т.к. сервер всегда отдаёт index.html.
const router = createHashRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <StudiesPage /> },
      { path: 'new', element: <NewStudyPage /> },
      { path: 'study/:id', element: <StudyDetailPage /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
