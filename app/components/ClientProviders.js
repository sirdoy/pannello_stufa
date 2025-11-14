'use client';

import { UserProvider } from '@auth0/nextjs-auth0/client';
import { VersionProvider } from '@/app/context/VersionContext';
import { ThemeProvider } from '@/app/context/ThemeContext';
import ThemeScript from './ThemeScript';

/**
 * Wrapper per tutti i provider client-side
 * Permette di usare Context in layout.js (Server Component)
 */
export default function ClientProviders({ children }) {
  return (
    <UserProvider>
      <ThemeScript />
      <ThemeProvider>
        <VersionProvider>
          {children}
        </VersionProvider>
      </ThemeProvider>
    </UserProvider>
  );
}
