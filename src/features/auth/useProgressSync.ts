import { useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { LocalUserProgressAdapter } from './localProgressAdapter';
import { progressManager, EMPTY_STATE } from '@/features/learning/progressStore';
import { MemoryStorageAdapter } from '@/features/learning/storageAdapter';

/**
 * Synchronises the `progressManager` singleton's storage adapter with the
 * current authentication state.
 *
 * - Logged in  → LocalUserProgressAdapter  (namespaced per user-ID, fully isolated)
 * - Logged out → MemoryStorageAdapter       (ephemeral, no cross-user leakage)
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
      progressManager.reinitialize(userAdapter);
    } else {
      // Logged out — clear to empty in-memory state (no cross-account leakage)
      progressManager.reinitialize(new MemoryStorageAdapter(), EMPTY_STATE);
    }
  }, [user, isLoading]);
}
