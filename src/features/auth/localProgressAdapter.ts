import type { StorageAdapter } from '@/features/learning/storageAdapter';

/**
 * Per-user localStorage StorageAdapter.
 *
 * Each user's progress is stored under a key namespaced by their ID:
 *   `vas_progress_<userId>_<originalKey>`
 *
 * This gives complete isolation between accounts on the same browser —
 * User A's data is never readable by User B because the keys never overlap.
 *
 * No async I/O: all reads and writes are synchronous localStorage operations,
 * so the existing ProgressManager API works without any changes.
 */
export class LocalUserProgressAdapter implements StorageAdapter {
  private prefix: string;

  constructor(userId: string) {
    this.prefix = `vas_progress_${userId}_`;
  }

  private prefixed(key: string): string {
    return `${this.prefix}${key}`;
  }

  getItem(key: string): string | null {
    try {
      return localStorage.getItem(this.prefixed(key));
    } catch {
      return null;
    }
  }

  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(this.prefixed(key), value);
    } catch (e) {
      console.warn('[LocalUserProgressAdapter] Failed to write:', e);
    }
  }

  removeItem(key: string): void {
    try {
      localStorage.removeItem(this.prefixed(key));
    } catch {
      // ignore
    }
  }
}
