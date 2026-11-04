import type { AppData } from '@/types';
import { SCHEMA_VERSION } from '@/types';
import { createSeedData } from '@/data/seed';

const STORAGE_KEY = 'clearorigin-booking-prototype:data';

/**
 * Thin localStorage persistence layer.
 *
 * LIMITATION (documented, not hidden): this is single-device, single-browser
 * storage. It cannot provide real cross-user or cross-device locking, so two
 * different browsers booking the same instructor at the same instant could
 * both "succeed" from their own point of view. A production backend (see
 * docs/PROTOTYPE_PLAN.md §8) needs transactional writes to fix this.
 */
export const storageService = {
  load(): AppData {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return this.reset();
      }
      const parsed = JSON.parse(raw) as AppData;
      if (!parsed || parsed.schemaVersion !== SCHEMA_VERSION) {
        // Shape changed since this was saved — start fresh rather than risk
        // working with data the rest of the app doesn't understand.
        return this.reset();
      }
      return parsed;
    } catch {
      return this.reset();
    }
  },

  save(data: AppData): void {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },

  /** Restore the original fictional seed data, discarding all prototype changes. */
  reset(): AppData {
    const fresh = createSeedData(new Date());
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    return fresh;
  },
};
