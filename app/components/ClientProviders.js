'use client';

import { Auth0Provider } from '@auth0/nextjs-auth0/client';
import { VersionProvider } from '@/app/context/VersionContext';
import { ThemeProvider } from '@/app/context/ThemeContext';
import { PageTransitionProvider } from '@/app/context/PageTransitionContext';
import { ToastProvider } from '@/app/components/ui';
import ThemeScript from './ThemeScript';
import { OfflineBanner } from '@/app/components/ui';
import PWAInitializer from './PWAInitializer';

/**
 * Wrapper per tutti i provider client-side
 * Permette di usare Context in layout.js (Server Component)
 */
export default function ClientProviders({ children }) {
  return (
    <Auth0Provider>
      <ThemeScript />
      <ThemeProvider>
        <PageTransitionProvider>
          <VersionProvider>
            <ToastProvider>
              <PWAInitializer />
              <OfflineBanner fixed showPendingCount />
              {children}
            </ToastProvider>
          </VersionProvider>
        </PageTransitionProvider>
      </ThemeProvider>
    </Auth0Provider>
  );
}
