export type Theme = 'system' | 'light' | 'dark';

const KEY = 'studyme-theme';
const ORDER: Theme[] = ['system', 'light', 'dark'];

export function getTheme(): Theme {
  const v = localStorage.getItem(KEY);
  return v === 'light' || v === 'dark' || v === 'system' ? v : 'system';
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  if (theme === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);
}

export function setTheme(theme: Theme): void {
  localStorage.setItem(KEY, theme);
  applyTheme(theme);
}

export function initTheme(): void {
  applyTheme(getTheme());
}

export function nextTheme(theme: Theme): Theme {
  return ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
}

export function themeIcon(theme: Theme): string {
  return theme === 'system' ? '🌗' : theme === 'light' ? '☀️' : '🌙';
}

export function themeLabel(theme: Theme): string {
  return theme === 'system' ? 'Системная' : theme === 'light' ? 'Светлая' : 'Тёмная';
}
