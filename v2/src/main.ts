import './app.css';
import App from './App.svelte';
import { runSeeds } from '$db/seedRunner';
import { registerSW } from 'virtual:pwa-register';
import { initTheme } from '$stores/theme';

// Tema (claro/oscuro/auto) antes del primer render para evitar flash
initTheme();

// PWA: actualización automática del Service Worker
registerSW({ immediate: true });

// Carga datos iniciales (idempotente)
runSeeds().catch(err => console.error('Error en runSeeds:', err));

const app = new App({
  target: document.getElementById('app')!
});

export default app;
