import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth0 } from '@/lib/auth0';
import StoveCard from './EmberGlass/cards/StoveCard';
import ClimateCard from './EmberGlass/cards/ClimateCard';
import LightsCard from './EmberGlass/cards/LightsCard';
import SonosCard from './EmberGlass/cards/SonosCard';
import WeatherCard from './EmberGlass/cards/WeatherCard';
import CameraCard from './EmberGlass/cards/CameraCard';
import NetworkCard from './EmberGlass/cards/NetworkCard';
import RaspiCard from './EmberGlass/cards/RaspiCard';
import TuyaCard from './EmberGlass/cards/TuyaCard';
import DirigeraCard from './EmberGlass/cards/DirigeraCard';
import { GlassCardSkeleton } from './EmberGlass/GlassCardSkeleton';
import {
  getUnifiedDeviceConfigAdmin,
  getVisibleDashboardCards,
} from '@/lib/services/unifiedDeviceConfigService';
import { EmptyState } from './ui';
import { DeviceCardErrorBoundary } from './ErrorBoundary';

// Card component registry - maps card IDs to React components
const CARD_COMPONENTS: Record<string, React.ComponentType> = {
  stove: StoveCard,
  thermostat: ClimateCard,
  weather: WeatherCard,
  lights: LightsCard,
  camera: CameraCard,
  network: NetworkCard,
  raspi: RaspiCard,
  sonos: SonosCard,
  dirigera: DirigeraCard,
  tuya: TuyaCard,
};

// Device metadata for error boundaries
const DEVICE_META: Record<string, { name: string; icon: string }> = {
  stove: { name: 'Stufa', icon: '🔥' },
  thermostat: { name: 'Termostato', icon: '🌡️' },
  weather: { name: 'Meteo', icon: '☀️' },
  lights: { name: 'Luci', icon: '💡' },
  camera: { name: 'Camera', icon: '📷' },
  network: { name: 'Rete', icon: '📡' },
  raspi: { name: 'Raspberry Pi', icon: '🖥️' },
  sonos: { name: 'Sonos', icon: '🎵' },
  dirigera: { name: 'DIRIGERA', icon: '🔌' },
  tuya: { name: 'Tuya', icon: '⚡' },
};

/**
 * DashboardCards — Async Server Component
 *
 * Phase 177: Renders the equal-size 1:1 EmberGlass card grid (DASH-01).
 * All 10 device cards render in a single 2-column grid (mobile + desktop) with
 * v9.0 stagger animation preserved (animate-spring-in + animationDelay).
 *
 * Auth: redirects to /auth/login if no valid session is found.
 *
 * Each card is wrapped in a per-card Suspense boundary with the shared
 * GlassCardSkeleton fallback (DS-24), inside a DeviceCardErrorBoundary for
 * error isolation.
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

  // Get visible dashboard cards (visible: true, hasHomepageCard: true, sorted by order)
  const visibleCards = getVisibleDashboardCards(deviceConfig);

  // Empty State using EmptyState component
  if (visibleCards.length === 0) {
    return (
      <EmptyState
        icon="🏠"
        title="Nessun dispositivo configurato"
        description="Aggiungi i tuoi dispositivi per iniziare"
      />
    );
  }

  // Phase 177 (DASH-01): single 2-col grid replacing v8.1 masonry layout.
  // Identical 1:1 card footprint on mobile + desktop.
  return (
    <div className="grid grid-cols-2 gap-3 max-w-md sm:max-w-2xl mx-auto px-3">
      {visibleCards.map((card, flatIndex) => {
        const CardComponent = CARD_COMPONENTS[card.id];
        if (!CardComponent) return null;
        const meta = DEVICE_META[card.id] ?? { name: card.id, icon: '⚠️' };
        return (
          <div
            key={card.id}
            className="animate-spring-in transition-all duration-300 ease-out"
            style={{ animationDelay: `${flatIndex * 100}ms` }}
          >
            <DeviceCardErrorBoundary deviceName={meta.name} deviceIcon={meta.icon}>
              <Suspense fallback={<GlassCardSkeleton />}>
                <CardComponent />
              </Suspense>
            </DeviceCardErrorBoundary>
          </div>
        );
      })}
    </div>
  );
}
