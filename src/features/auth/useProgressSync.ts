import { useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { CloudProgressAdapter } from './cloudProgressAdapter';
import { progressManager, EMPTY_STATE } from '@/features/learning/progressStore';
import { LocalStorageAdapter, MemoryStorageAdapter } from '@/features/learning/storageAdapter';

const GUEST_STORAGE_KEY = 'vas_learning_progress_v1';

/**
 * Synchronizes the `progressManager` singleton's storage adapter with the
 * current authentication state.
 *
 * - Logged in  → use CloudProgressAdapter (Supabase, per-user isolated)
 * - Logged out → use MemoryStorageAdapter (guest / ephemeral)
 *
 * Guest migration: when a user logs in and has pre-existing localStorage data,
 * we merge it into their cloud record (cloud wins on conflicts to avoid
 * overwriting further progress made on other devices).
 */
export function useProgressSync() {
  const { user, isLoading } = useAuth();
  const prevUserId = useRef<string | null>(null);

  useEffect(() => {
    if (isLoading) return;

    const userId = user?.id ?? null;

    // Nothing changed
    if (userId === prevUserId.current) return;
    prevUserId.current = userId;

    if (userId) {
      // User just logged in
      const cloudAdapter = new CloudProgressAdapter(userId);

      cloudAdapter.initialize().then(() => {
        // Guest migration: if there is local progress and the cloud has none,
        // seed the cloud record with the guest's progress so they don't lose work.
        const cloudData = cloudAdapter.getItem(GUEST_STORAGE_KEY);
        if (!cloudData) {
          const localAdapter = new LocalStorageAdapter();
          const localData = localAdapter.getItem(GUEST_STORAGE_KEY);
          if (localData) {
            // Write local data to cloud
            cloudAdapter.setItem(GUEST_STORAGE_KEY, localData);
          }
        }

        // Switch progressManager to cloud
        progressManager.reinitialize(cloudAdapter);
      });
    } else {
      // User logged out → switch to ephemeral in-memory adapter
      // (avoids cross-contamination between different accounts on same browser)
      progressManager.reinitialize(new MemoryStorageAdapter(), EMPTY_STATE);
    }
  }, [user, isLoading]);
}
