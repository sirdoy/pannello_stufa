import { auth0 } from '@/lib/auth0';
import StoveCard from './components/devices/stove/StoveCard';
import ThermostatCard from './components/devices/thermostat/ThermostatCard';
import CameraCard from './components/devices/camera/CameraCard';
import LightsCard from './components/devices/lights/LightsCard';
import WeatherCardWrapper from './components/devices/weather/WeatherCardWrapper';
import SandboxPanel from './components/sandbox/SandboxPanel';
import {
  getUnifiedDeviceConfigAdmin,
  getVisibleDashboardCards,
} from '@/lib/services/unifiedDeviceConfigService';
import { Grid, EmptyState } from './components/ui';

export const dynamic = 'force-dynamic';

// Card component registry - maps card IDs to React components
const CARD_COMPONENTS: Record<string, React.ComponentType> = {
  stove: StoveCard,
  thermostat: ThermostatCard,
  weather: WeatherCardWrapper,
  lights: LightsCard,
  camera: CameraCard,
};

export default async function Home() {
  const session = await auth0.getSession();

  // CRITICAL: If no valid session, redirect to login
  // This handles the case where cookie exists but session is invalid (e.g., after logout)
  if (!session || !session.user) {
    const { redirect } = await import('next/navigation');
    redirect('/auth/login');
  }

  const user = session.user;
  const userId = user.sub;

  // Fetch unified device config server-side (with automatic migration)
  const deviceConfig = await getUnifiedDeviceConfigAdmin(userId);

  // Get visible dashboard cards (enabled && dashboardVisible, sorted by order)
  const visibleCards = getVisibleDashboardCards(deviceConfig);

  return (
    <section className="py-8 sm:py-12 lg:py-16">
      <h1 className="sr-only">Dashboard</h1>
      {/* Sandbox Panel - Solo in localhost quando abilitato */}
      <SandboxPanel />

      {/* Devices grid using new Grid component */}
      <Grid cols={2} gap="lg">
        {visibleCards.map((card, index) => {
          const CardComponent = CARD_COMPONENTS[card.id];
          if (!CardComponent) return null;

          return (
            <div
              key={card.id}
              className="animate-spring-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardComponent />
            </div>
          );
        })}
      </Grid>

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
