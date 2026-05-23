import { writable, derived, type Readable } from 'svelte/store';
import { db } from '$db/database';
import type { UserProfile, DailyGoals } from '$lib/types';
import { calculateGoals } from '$lib/nutrition/macros';

export const profile = writable<UserProfile | null>(null);
export const profileLoaded = writable<boolean>(false);

/**
 * Carga el perfil desde IndexedDB al store.
 */
export async function loadProfile(): Promise<UserProfile | null> {
  const p = await db.profile.get(1);
  profile.set(p ?? null);
  profileLoaded.set(true);
  return p ?? null;
}

/**
 * Guarda el perfil. Si no existe → lo crea.
 */
export async function saveProfile(p: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
  const existing = await db.profile.get(1);
  const now = new Date().toISOString();
  const full: UserProfile = {
    id: 1,
    ...p,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now
  };
  await db.profile.put(full);
  profile.set(full);
}

/**
 * Metas diarias derivadas del perfil (BMR, TDEE, macros).
 */
export const goals: Readable<DailyGoals | null> = derived(profile, $p =>
  $p ? calculateGoals($p) : null
);
