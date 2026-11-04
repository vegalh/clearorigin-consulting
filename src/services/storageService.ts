import type { AppData } from '@/types';
import { createSeedData } from '@/data/seed';
import { migrateToLatest } from './migrations';

export const STORAGE_KEY = 'clearorigin-booking-prototype:data';
export const BACKUP_KEY_PREFIX = 'clearorigin-booking-prototype:backup:';

/**
 * Thin localStorage persistence layer.
 *
 * LIMITATION (documented, not hidden): this is single-device, single-browser
 * storage. Checkout holds stored here keep two tabs of the same browser from
 * double-booking, but they cannot stop another person on another device from
 * picking the same time. A production backend (see docs/BOOKING_V3_PLAN.md
 * §5) needs server-authoritative holds and transactional writes.
 */
export const storageService = {
  load(): AppData {
    let raw: string | null = null;
    try {
      raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return this.reset();
      const result = migrateToLatest(JSON.parse(raw));
      if (result.ok) {
        if (result.migratedFrom !== undefined) {
          // Keep the pre-migration copy so a bad migration never loses data.
          this.backup(raw, `v${result.migratedFrom}`);
          this.save(result.data);
        }
        return result.data;
      }
    } catch {
      // fall through: unreadable JSON
    }
    if (raw) this.backup(raw, 'unreadable');
    return this.reset();
  },

  save(data: AppData): void {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Storage full or blocked (private mode): keep working in memory.
    }
  },

  backup(raw: string, label: string): void {
    try {
      window.localStorage.setItem(`${BACKUP_KEY_PREFIX}${label}:${Date.now()}`, raw);
    } catch {
      // Best effort only.
    }
  },

  /** Restore the original fictional seed data, discarding all prototype changes. */
  reset(): AppData {
    const fresh = createSeedData(new Date());
    this.save(fresh);
    return fresh;
  },
};
