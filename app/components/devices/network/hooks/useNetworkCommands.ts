/**
 * useNetworkCommands Hook
 *
 * Encapsulates navigation handler for NetworkCard.
 * Simple hook that provides navigation to /network page.
 */

'use client';

import { useCallback } from 'react';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import type { UseNetworkCommandsReturn } from '../types';

/**
 * Parameters required by useNetworkCommands
 */
export interface UseNetworkCommandsParams {
  /** Next.js router for navigation */
  router: AppRouterInstance;
}

/**
 * Custom hook for network command execution
 *
 * @param params - Configuration parameters
 * @returns Command handlers
 */
export function useNetworkCommands(params: UseNetworkCommandsParams): UseNetworkCommandsReturn {
  const { router } = params;

  const navigateToNetwork = useCallback(() => {
    router.push('/network');
  }, [router]);

  return {
    navigateToNetwork,
  };
}
