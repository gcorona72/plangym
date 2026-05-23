import './app.css';
import App from './App.svelte';
import { runSeeds } from '$db/seedRunner';
import { registerSW } from 'virtual:pwa-register';

// PWA: actualización automática del Service Worker
registerSW({ immediate: true });

// Carga datos iniciales (idempotente)
runSeeds().catch(err => console.error('Error en runSeeds:', err));

const app = new App({
  target: document.getElementById('app')!
});

export default app;
