import { supabase } from '@/lib/supabase';
import type { StorageAdapter } from '@/features/learning/storageAdapter';

/**
 * Supabase-backed StorageAdapter.
 *
 * Persists the `LearningState` JSON blob in a single `user_progress` row,
 * keyed by the authenticated user ID.
 *
 * Row Level Security on the `user_progress` table guarantees that a user
 * can only ever read and write their own row — enforced at the database level.
 *
 * Design notes:
 * - `getItem` fetches synchronously from an in-memory cache populated on first
 *   load; background refreshes keep it current.
 * - `setItem` writes optimistically to the cache and persists to Supabase
 *   asynchronously so the UI never stalls.
 * - `removeItem` clears the row from the database and the cache.
 */
export class CloudProgressAdapter implements StorageAdapter {
  private userId: string;
  private cache: Map<string, string> = new Map();
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  constructor(userId: string) {
    this.userId = userId;
  }

  /** Pre-load data from Supabase so that first getItem() is sync. */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      const { data, error } = await supabase
        .from('user_progress')
        .select('data')
        .eq('user_id', this.userId)
        .maybeSingle();

      if (error) {
        console.warn('[CloudProgressAdapter] Failed to load progress:', error.message);
        return;
      }

      if (data?.data && typeof data.data === 'object') {
        const progressData = data.data as Record<string, string>;
        for (const [k, v] of Object.entries(progressData)) {
          this.cache.set(k, v);
        }
      }

      this.initialized = true;
    })();

    return this.initPromise;
  }

  getItem(key: string): string | null {
    return this.cache.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.cache.set(key, value);

    // Build the full JSON payload from cache for upsert
    const payload: Record<string, string> = {};
    this.cache.forEach((v, k) => {
      payload[k] = v;
    });

    // Fire-and-forget upsert — errors are logged but not surfaced in the UI
    supabase
      .from('user_progress')
      .upsert(
        { user_id: this.userId, data: payload, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' },
      )
      .then(({ error }) => {
        if (error) {
          console.warn('[CloudProgressAdapter] Failed to save progress:', error.message);
        }
      });
  }

  removeItem(key: string): void {
    this.cache.delete(key);

    if (this.cache.size === 0) {
      // Delete the row entirely when all keys are removed
      supabase
        .from('user_progress')
        .delete()
        .eq('user_id', this.userId)
        .then(({ error }) => {
          if (error) {
            console.warn('[CloudProgressAdapter] Failed to delete progress:', error.message);
          }
        });
    } else {
      // Update the row with remaining keys
      const payload: Record<string, string> = {};
      this.cache.forEach((v, k) => {
        payload[k] = v;
      });
      supabase
        .from('user_progress')
        .upsert(
          { user_id: this.userId, data: payload, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' },
        )
        .then(({ error }) => {
          if (error) {
            console.warn('[CloudProgressAdapter] Failed to update progress:', error.message);
          }
        });
    }
  }
}
