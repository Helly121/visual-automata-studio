/**
 * Storage adapter interface and implementation for Visual Automata Studio.
 * Persists user progress, quiz attempts, and challenge completions.
 *
 * Current Limitations (documented per requirements):
 * - Browser LocalStorage scope: Progress is persisted per-browser profile and domain.
 * - Quota: ~5MB browser localStorage cap (plenty for thousands of attempt records).
 * - Clear Data: Clearing browser cache/cookies resets local progress.
 * - Sync: Multi-device cloud sync is not supported without backend authentication.
 */

export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export class LocalStorageAdapter implements StorageAdapter {
  getItem(key: string): string | null {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return null;
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  setItem(key: string, value: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  }

  removeItem(key: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch {
      // ignore
    }
  }
}

/** Fallback memory adapter for tests and SSR environments */
export class MemoryStorageAdapter implements StorageAdapter {
  private store: Map<string, string> = new Map();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }
}

export const defaultStorage: StorageAdapter =
  typeof window !== 'undefined' && window.localStorage
    ? new LocalStorageAdapter()
    : new MemoryStorageAdapter();
