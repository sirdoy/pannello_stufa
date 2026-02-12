'use client';

import { useState, useEffect } from 'react';

/**
 * Network quality classification based on effective connection type.
 */
export type NetworkQuality = 'slow' | 'fast' | 'unknown';

/**
 * Hook that tracks network quality using the Network Information API.
 * Returns 'slow' for slow-2g/2g, 'fast' for 3g/4g, or 'unknown' if API unavailable.
 * Progressive enhancement - assumes 'unknown' rather than 'fast' when API not available.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Network_Information_API
 */
export function useNetworkQuality(): NetworkQuality {
  const [quality, setQuality] = useState<NetworkQuality>(() => {
    return getNetworkQuality();
  });

  useEffect(() => {
    // Check if Network Information API is available
    const connection = (navigator as any).connection;
    if (!connection) {
      return;
    }

    const updateQuality = () => {
      setQuality(getNetworkQuality());
    };

    connection.addEventListener('change', updateQuality);

    return () => {
      connection.removeEventListener('change', updateQuality);
    };
  }, []);

  return quality;
}

/**
 * Helper to get current network quality from the Network Information API.
 */
function getNetworkQuality(): NetworkQuality {
  if (typeof navigator === 'undefined') {
    return 'unknown';
  }

  const connection = (navigator as any).connection;
  if (!connection || !connection.effectiveType) {
    return 'unknown';
  }

  const effectiveType = connection.effectiveType;

  if (effectiveType === 'slow-2g' || effectiveType === '2g') {
    return 'slow';
  }

  if (effectiveType === '3g' || effectiveType === '4g') {
    return 'fast';
  }

  return 'unknown';
}
