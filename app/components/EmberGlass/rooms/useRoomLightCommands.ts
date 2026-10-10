'use client';

import { useRouter } from 'next/navigation';
import { useLightsData } from '@/app/components/devices/lights/hooks/useLightsData';
import { useLightsCommands } from '@/app/components/devices/lights/hooks/useLightsCommands';

/**
 * Light commands for a device of the Rooms tab: a refused command is reported to the card through
 * `onError` (the lights hook keeps it in its own state, which the card does not see).
 */
export function useRoomLightCommands(onError?: (message: string | null) => void) {
  const router = useRouter();
  const data = useLightsData();
  return useLightsCommands({
    lightsData: {
      setRefreshing: data.setRefreshing,
      setLoadingMessage: data.setLoadingMessage,
      setError: (message) => {
        data.setError(message);
        onError?.(message);
      },
      fetchData: data.fetchData,
      groups: data.groups,
      checkConnection: data.checkConnection,
      connected: data.connected,
    },
    router,
  });
}
