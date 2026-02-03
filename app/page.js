import { auth0 } from '@/lib/auth0';
import StoveCard from './components/devices/stove/StoveCard';
import ThermostatCard from './components/devices/thermostat/ThermostatCard';
import CameraCard from './components/devices/camera/CameraCard';
import LightsCard from './components/devices/lights/LightsCard';
import WeatherCardWrapper from './components/devices/weather/WeatherCardWrapper';
import SandboxToggle from './components/sandbox/SandboxToggle';
import { adminDbGet } from '@/lib/firebaseAdmin';
import { DEFAULT_CARD_ORDER } from '@/lib/services/dashboardPreferencesService';
import { Section, Grid, EmptyState } from './components/ui';

export const dynamic = 'force-dynamic';

// Card component registry - maps card IDs to React components
const CARD_COMPONENTS = {
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

  // Fetch dashboard preferences server-side
  const dashboardPath = `users/${userId}/dashboardPreferences`;
  const preferences = await adminDbGet(dashboardPath);
  const cardOrder = preferences?.cardOrder || DEFAULT_CARD_ORDER;

  // Filter to only visible cards
  const visibleCards = cardOrder.filter(card => card.visible !== false);

  return (
    <main>
      {/* Page header using new Section component */}
      <Section
        title="I tuoi dispositivi"
        description="Controlla e monitora tutti i dispositivi della tua casa in tempo reale"
        spacing="lg"
        level={1}
      >
        {/* Sandbox Toggle - Solo in localhost */}
        <SandboxToggle />

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
      </Section>
    </main>
  );
}
