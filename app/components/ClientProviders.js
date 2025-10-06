'use client';

import { VersionProvider } from '@/app/context/VersionContext';

/**
 * Wrapper per tutti i provider client-side
 * Permette di usare Context in layout.js (Server Component)
 */
export default function ClientProviders({ children }) {
  return (
    <VersionProvider>
      {children}
    </VersionProvider>
  );
}
