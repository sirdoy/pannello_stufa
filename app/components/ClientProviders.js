'use client';

import { Auth0Provider } from '@auth0/nextjs-auth0/client';
import { VersionProvider } from '@/app/context/VersionContext';
import { ThemeProvider } from '@/app/context/ThemeContext';
import ThemeScript from './ThemeScript';

/**
 * Wrapper per tutti i provider client-side
 * Permette di usare Context in layout.js (Server Component)
 */
export default function ClientProviders({ children }) {
  return (
    <Auth0Provider>
      <ThemeScript />
      <ThemeProvider>
        <VersionProvider>
          {children}
        </VersionProvider>
      </ThemeProvider>
    </Auth0Provider>
  );
}
