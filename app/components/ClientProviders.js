'use client';

import { UserProvider } from '@auth0/nextjs-auth0/client';
import { VersionProvider } from '@/app/context/VersionContext';

/**
 * Wrapper per tutti i provider client-side
 * Permette di usare Context in layout.js (Server Component)
 */
export default function ClientProviders({ children }) {
  return (
    <UserProvider>
      <VersionProvider>
        {children}
      </VersionProvider>
    </UserProvider>
  );
}
