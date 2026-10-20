import { useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { LocalUserProgressAdapter } from './localProgressAdapter';
import { progressManager, EMPTY_STATE } from '@/features/learning/progressStore';
import { LocalStorageAdapter, MemoryStorageAdapter } from '@/features/learning/storageAdapter';

const GUEST_STORAGE_KEY = 'vas_learning_progress_v1';

/**
 * Synchronises the `progressManager` singleton's storage adapter with the
 * current authentication state.
 *
 * - Logged in  → LocalUserProgressAdapter  (namespaced per user-ID, fully isolated)
 * - Logged out → MemoryStorageAdapter       (ephemeral, no cross-user leakage)
 *
 * Guest migration: if the user has anonymous progress saved under the shared
 * localStorage key, it is copied into their personal namespace on first login
 * so they don't lose work done before signing in.
 */
export function useProgressSync() {
  const { user, isLoading } = useAuth();
  const prevUserId = useRef<string | null>(null);

  useEffect(() => {
    if (isLoading) return;

    const userId = user?.id ?? null;
    if (userId === prevUserId.current) return;
    prevUserId.current = userId;

    if (userId) {
      const userAdapter = new LocalUserProgressAdapter(userId);

      // Guest migration: if user has no progress yet, seed from the shared guest key
      const existingProgress = userAdapter.getItem(GUEST_STORAGE_KEY);
      if (!existingProgress) {
        const guestAdapter = new LocalStorageAdapter();
        const guestData = guestAdapter.getItem(GUEST_STORAGE_KEY);
        if (guestData) {
          userAdapter.setItem(GUEST_STORAGE_KEY, guestData);
        }
      }

      progressManager.reinitialize(userAdapter);
    } else {
      // Logged out — clear to empty in-memory state (no cross-account leakage)
      progressManager.reinitialize(new MemoryStorageAdapter(), EMPTY_STATE);
    }
  }, [user, isLoading]);
}
