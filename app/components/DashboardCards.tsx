import { redirect } from 'next/navigation';
import { auth0 } from '@/lib/auth0';
import { splitIntoColumns } from '@/lib/utils/dashboardColumns';
import StoveCard from './devices/stove/StoveCard';
import ThermostatCard from './devices/thermostat/ThermostatCard';
import CameraCard from './devices/camera/CameraCard';
import LightsCard from './devices/lights/LightsCard';
import WeatherCardWrapper from './devices/weather/WeatherCardWrapper';
import NetworkCard from './devices/network/NetworkCard';
import {
  getUnifiedDeviceConfigAdmin,
  getVisibleDashboardCards,
} from '@/lib/services/unifiedDeviceConfigService';
import { EmptyState } from './ui';
import { DeviceCardErrorBoundary } from './ErrorBoundary';

// Card component registry - maps card IDs to React components
const CARD_COMPONENTS: Record<string, React.ComponentType> = {
  stove: StoveCard,
  thermostat: ThermostatCard,
  weather: WeatherCardWrapper,
  lights: LightsCard,
  camera: CameraCard,
  network: NetworkCard,
};

// Device metadata for error boundaries
const DEVICE_META: Record<string, { name: string; icon: string }> = {
  stove: { name: 'Stufa', icon: '🔥' },
  thermostat: { name: 'Termostato', icon: '🌡️' },
  weather: { name: 'Meteo', icon: '☀️' },
  lights: { name: 'Luci', icon: '💡' },
  camera: { name: 'Camera', icon: '📷' },
  network: { name: 'Rete', icon: '📡' },
};

/**
 * DashboardCards — Async Server Component
 *
 * Fetches session + device config server-side and renders the masonry card grid.
 * Wrapped in a Suspense boundary by page.tsx; loading.tsx provides the fallback.
 *
 * Auth: redirects to /auth/login if no valid session is found.
 * Layout: matches loading.tsx masonry (even→left, odd→right).
 */
export default async function DashboardCards() {
  const session = await auth0.getSession();

  // CRITICAL: If no valid session, redirect to login
  // This handles the case where cookie exists but session is invalid (e.g., after logout)
  if (!session || !session.user) {
    redirect('/auth/login');
  }

  // Non-null assertion safe here because redirect above will exit if null
  const user = session.user;
  const userId = user.sub;

  // Fetch unified device config server-side (with automatic migration)
  const deviceConfig = await getUnifiedDeviceConfigAdmin(userId);

  // Get visible dashboard cards (enabled && dashboardVisible, sorted by order)
  const visibleCards = getVisibleDashboardCards(deviceConfig);

  // Precompute left/right columns by index parity (even→left, odd→right)
  const { left: leftColumn, right: rightColumn } = splitIntoColumns(visibleCards);

  // Shared card renderer — used by both mobile and desktop layouts
  const renderCard = (card: typeof visibleCards[number], flatIndex: number) => {
    const CardComponent = CARD_COMPONENTS[card.id];
    if (!CardComponent) return null;
    return (
      <div
        key={card.id}
        className="animate-spring-in transition-all duration-300 ease-out"
        style={{ animationDelay: `${flatIndex * 100}ms` }}
      >
        <DeviceCardErrorBoundary
          deviceName={DEVICE_META[card.id]?.name ?? card.id}
          deviceIcon={DEVICE_META[card.id]?.icon ?? '⚠️'}
        >
          <CardComponent />
        </DeviceCardErrorBoundary>
      </div>
    );
  };

  return (
    <>
      {/* Mobile: single column, flat order (LAYOUT-03) */}
      <div className="flex flex-col gap-6 sm:hidden">
        {visibleCards.map((card, index) => renderCard(card, index))}
      </div>

      {/* Desktop: two-column masonry (LAYOUT-01, LAYOUT-02, EDGE-01) */}
      <div className="hidden sm:flex sm:flex-row gap-8 lg:gap-10">
        <div className={`flex flex-col gap-8 lg:gap-10 min-w-0 ${rightColumn.length === 0 ? 'w-full' : 'flex-1'}`}>
          {leftColumn.map(({ card, flatIndex }) => renderCard(card, flatIndex))}
        </div>
        {rightColumn.length > 0 && (
          <div className="flex flex-col gap-8 lg:gap-10 flex-1 min-w-0">
            {rightColumn.map(({ card, flatIndex }) => renderCard(card, flatIndex))}
          </div>
        )}
      </div>

      {/* Empty State using new EmptyState component */}
      {visibleCards.length === 0 && (
        <EmptyState
          icon="🏠"
          title="Nessun dispositivo configurato"
          description="Aggiungi i tuoi dispositivi per iniziare"
        />
      )}
    </>
  );
}
