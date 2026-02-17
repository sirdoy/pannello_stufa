import { auth0 } from '@/lib/auth0';
import StoveCard from './components/devices/stove/StoveCard';
import ThermostatCard from './components/devices/thermostat/ThermostatCard';
import CameraCard from './components/devices/camera/CameraCard';
import LightsCard from './components/devices/lights/LightsCard';
import WeatherCardWrapper from './components/devices/weather/WeatherCardWrapper';
import NetworkCard from './components/devices/network/NetworkCard';
import SandboxPanel from './components/sandbox/SandboxPanel';
import {
  getUnifiedDeviceConfigAdmin,
  getVisibleDashboardCards,
} from '@/lib/services/unifiedDeviceConfigService';
import { EmptyState } from './components/ui';
import { DeviceCardErrorBoundary } from './components/ErrorBoundary';

export const dynamic = 'force-dynamic';

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

export default async function Home() {
  const session = await auth0.getSession();

  // CRITICAL: If no valid session, redirect to login
  // This handles the case where cookie exists but session is invalid (e.g., after logout)
  if (!session || !session.user) {
    const { redirect } = await import('next/navigation');
    redirect('/auth/login');
  }

  // Non-null assertion safe here because redirect above will exit if null
  const user = session!.user;
  const userId = user.sub;

  // Fetch unified device config server-side (with automatic migration)
  const deviceConfig = await getUnifiedDeviceConfigAdmin(userId);

  // Get visible dashboard cards (enabled && dashboardVisible, sorted by order)
  const visibleCards = getVisibleDashboardCards(deviceConfig);

  // Precompute left/right columns by index parity (even→left, odd→right)
  const leftColumn: Array<{ card: typeof visibleCards[number]; flatIndex: number }> = [];
  const rightColumn: Array<{ card: typeof visibleCards[number]; flatIndex: number }> = [];
  visibleCards.forEach((card, i) => {
    if (i % 2 === 0) {
      leftColumn.push({ card, flatIndex: i });
    } else {
      rightColumn.push({ card, flatIndex: i });
    }
  });

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
    <section className="py-8 sm:py-12 lg:py-16">
      <h1 className="sr-only">Dashboard</h1>
      {/* Sandbox Panel - Solo in localhost quando abilitato */}
      <SandboxPanel />

      {/* Devices masonry layout */}

      {/* Mobile: single column, flat order (LAYOUT-03) */}
      <div className="flex flex-col gap-6 sm:hidden">
        {visibleCards.map((card, index) => renderCard(card, index))}
      </div>

      {/* Desktop: two-column masonry (LAYOUT-01, LAYOUT-02) */}
      <div className="hidden sm:flex sm:flex-row gap-8 lg:gap-10">
        <div className="flex flex-col gap-8 lg:gap-10 flex-1 min-w-0">
          {leftColumn.map(({ card, flatIndex }) => renderCard(card, flatIndex))}
        </div>
        <div className="flex flex-col gap-8 lg:gap-10 flex-1 min-w-0">
          {rightColumn.map(({ card, flatIndex }) => renderCard(card, flatIndex))}
        </div>
      </div>

      {/* Empty State using new EmptyState component */}
      {visibleCards.length === 0 && (
        <EmptyState
          icon="🏠"
          title="Nessun dispositivo configurato"
          description="Aggiungi i tuoi dispositivi per iniziare"
        />
      )}
    </section>
  );
}
