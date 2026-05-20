import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { useQueryClient } from '@tanstack/react-query';
import { getFirebaseAuth } from '@sudobility/auth_lib';
import { useScanProgressStore } from '@sudobility/testomniac_lib';

/**
 * Clears stale cached data when the user logs out or changes.
 * Resets the Zustand scan progress store and TanStack Query cache.
 */
export function useAuthCleanup() {
  const queryClient = useQueryClient();
  const resetScanProgress = useScanProgressStore(s => s.reset);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) return;

    return onAuthStateChanged(auth, user => {
      if (!user) {
        // User logged out — clear everything
        resetScanProgress();
        queryClient.clear();
      }
    });
  }, [queryClient, resetScanProgress]);
}
