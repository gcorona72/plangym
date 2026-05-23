import { BaseRepository } from './BaseRepository';
import { db } from '$db/database';
import type { UserProfile } from '$lib/types';

export class ProfileRepository extends BaseRepository<UserProfile, number> {
  constructor() {
    super(db.profile);
  }

  /** Solo hay un perfil → id=1. */
  async get(): Promise<UserProfile | null> {
    return (await this.getById(1)) ?? null;
  }

  async save(profile: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserProfile> {
    const existing = await this.get();
    const now = new Date().toISOString();
    const full: UserProfile = {
      id: 1,
      ...profile,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now
    };
    await this.upsert(full);
    return full;
  }
}

export const profileRepository = new ProfileRepository();
