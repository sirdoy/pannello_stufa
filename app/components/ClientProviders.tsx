'use client';

import { Auth0Provider } from '@auth0/nextjs-auth0/client';
import { VersionProvider } from '@/app/context/VersionContext';
import { PageTransitionProvider } from '@/app/context/PageTransitionContext';
import { ToastProvider } from '@/app/components/ui';
import { OfflineBanner } from '@/app/components/ui';
import PWAInitializer from './PWAInitializer';
import AxeDevtools from './AxeDevtools';
import CommandPaletteProvider from './layout/CommandPaletteProvider';
import InstallPrompt from '@/app/components/pwa/InstallPrompt';
import { ReactNode } from 'react';
import { WebSocketContext } from '@/app/context/WebSocketContext';
import { useWebSocketManager } from '@/lib/hooks/useWebSocketManager';
import { OnlineStatusProvider } from '@/app/context/OnlineStatusContext';

interface ClientProvidersProps {
  children: ReactNode;
}

// Client-side bypass flag — requires NEXT_PUBLIC_BYPASS_AUTH=true in .env.local
const BYPASS_AUTH = process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true';

const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL ?? '';
const WS_API_KEY = process.env.NEXT_PUBLIC_WS_API_KEY ?? '';
const WS_URL = WS_BASE_URL && WS_API_KEY ? `${WS_BASE_URL}/ws/live?api_key=${WS_API_KEY}` : null;

const MOCK_USER = BYPASS_AUTH
  ? {
      sub: 'local-dev-user',
      email: 'dev@localhost',
      name: 'Local Dev User',
      nickname: 'dev',
      picture: '',
    }
  : undefined;

/**
 * Wrapper per tutti i provider client-side
 * Permette di usare Context in layout.js (Server Component)
 *
 * When NEXT_PUBLIC_BYPASS_AUTH=true: passes mock user to Auth0Provider as SWR
 * fallback, so useUser() returns the mock user immediately without Auth0 auth.
 * The /auth/profile route also returns the mock user in bypass mode, so SWR
 * revalidation keeps returning the mock user consistently.
 */
export default function ClientProviders({ children }: ClientProvidersProps) {
  const wsManager = useWebSocketManager(WS_URL);

  return (
    <Auth0Provider user={MOCK_USER}>
      <WebSocketContext.Provider value={wsManager}>
        <OnlineStatusProvider>
          <PageTransitionProvider>
            <VersionProvider>
              <ToastProvider>
                <CommandPaletteProvider>
                  <AxeDevtools />
                  <PWAInitializer />
                  <OfflineBanner fixed showPendingCount />
                  {children}
                  <InstallPrompt />
                </CommandPaletteProvider>
              </ToastProvider>
            </VersionProvider>
          </PageTransitionProvider>
        </OnlineStatusProvider>
      </WebSocketContext.Provider>
    </Auth0Provider>
  );
}
