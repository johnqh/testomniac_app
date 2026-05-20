import { useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { useQueryClient } from '@tanstack/react-query';
import { getFirebaseAuth } from '@sudobility/auth_lib';
import { useScanProgressStore } from '@sudobility/testomniac_lib';

/**
 * Listens for Firebase auth state changes and clears cached data on logout.
 * Resets the Zustand scan progress store and TanStack Query cache so stale
 * data from a previous session doesn't persist across login/logout cycles.
 */
export function useAuthCleanup() {
  const queryClient = useQueryClient();
  const resetScanProgress = useScanProgressStore(s => s.reset);
  const previousUid = useRef<string | null>(null);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, user => {
      const currentUid = user?.uid ?? null;

      // User logged out, or switched to a different user
      if (previousUid.current && currentUid !== previousUid.current) {
        resetScanProgress();
        queryClient.clear();
      }

      previousUid.current = currentUid;
    });

    return unsubscribe;
  }, [queryClient, resetScanProgress]);
}
