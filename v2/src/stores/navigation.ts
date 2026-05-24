import { writable } from 'svelte/store';

export type Route =
  | 'onboarding'
  | 'dashboard'
  | 'training'
  | 'gym_session'
  | 'day_detail'
  | 'nutrition'
  | 'shopping'
  | 'sleep'
  | 'weight'
  | 'help'
  | 'settings'
  | 'cardio'
  | 'cardio_live'
  | 'cardio_detail';

export const currentRoute = writable<Route>('dashboard');
export const routeParams = writable<Record<string, any>>({});

export function navigate(route: Route, params: Record<string, any> = {}) {
  routeParams.set(params);
  currentRoute.set(route);
  // Scroll al top en cada cambio de ruta
  if (typeof window !== 'undefined') window.scrollTo(0, 0);
}
