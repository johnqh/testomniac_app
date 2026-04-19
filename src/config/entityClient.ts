import { useMemo } from 'react';
import { EntityClient } from '@sudobility/entity_client';
import { useFirebaseAuthNetworkClient } from '@sudobility/auth_lib';
import { CONSTANTS } from './constants';

/**
 * Hook that creates a memoized EntityClient instance.
 * Uses the app's API URL and Firebase auth for authentication.
 */
export function useEntityClient(): EntityClient {
  const networkClient = useFirebaseAuthNetworkClient();
  return useMemo(
    () =>
      new EntityClient({
        baseUrl: `${CONSTANTS.API_URL}/api/v1`,
        networkClient,
      }),
    [networkClient]
  );
}
