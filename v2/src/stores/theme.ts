import { writable } from 'svelte/store';

/**
 * Tema visual: claro / oscuro / auto (sigue al sistema).
 * Persiste en localStorage y aplica la clase `dark` en <html>
 * (Tailwind darkMode: 'class').
 */

export type ThemeMode = 'light' | 'dark' | 'auto';

const STORAGE_KEY = 'plangym_theme';
const media = typeof window !== 'undefined'
  ? window.matchMedia('(prefers-color-scheme: dark)')
  : null;

function load(): ThemeMode {
  if (typeof localStorage === 'undefined') return 'auto';
  const v = localStorage.getItem(STORAGE_KEY);
  return v === 'light' || v === 'dark' || v === 'auto' ? v : 'auto';
}

function isDark(mode: ThemeMode): boolean {
  if (mode === 'dark') return true;
  if (mode === 'light') return false;
  return media?.matches ?? false;
}

function apply(mode: ThemeMode) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', isDark(mode));
  // theme-color de la barra del navegador móvil
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', isDark(mode) ? '#0f172a' : '#3b82f6');
}

export const theme = writable<ThemeMode>(load());

export function setTheme(mode: ThemeMode) {
  localStorage.setItem(STORAGE_KEY, mode);
  theme.set(mode);
  apply(mode);
}

/** Llamar una vez al arrancar la app. */
export function initTheme() {
  apply(load());
  // Si está en auto, reaccionar a cambios del sistema
  media?.addEventListener('change', () => {
    if (load() === 'auto') apply('auto');
  });
}
