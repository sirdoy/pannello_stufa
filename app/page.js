import { auth0 } from '@/lib/auth0';
import StoveCard from './components/devices/stove/StoveCard';
import ThermostatCard from './components/devices/thermostat/ThermostatCard';
import LightsCard from './components/devices/lights/LightsCard';
import SandboxToggle from './components/sandbox/SandboxToggle';
import { getEnabledDevicesForUser } from '@/lib/devicePreferencesService';
import { Section, Grid, Text, EmptyState, Card, CardHeader, CardTitle, CardContent } from './components/ui';

export const dynamic = 'force-dynamic';

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
  const enabledDevices = await getEnabledDevicesForUser(userId);

  return (
    <main>
      {/* Page header using new Section component */}
      <Section
        title="I tuoi dispositivi"
        description="Controlla e monitora tutti i dispositivi della tua casa in tempo reale"
        spacing="section"
      >
        {/* Sandbox Toggle - Solo in localhost */}
        <SandboxToggle />

        {/* Devices grid using new Grid component */}
        <Grid cols={{ mobile: 1, desktop: 2, wide: 2 }} gap="large">
          {enabledDevices.map((device, index) => {
            // Staggered entrance animation wrapper
            const animationDelay = `${index * 100}ms`;

            // Render device-specific card
            if (device.id === 'stove') {
              return (
                <div key={device.id} className="animate-spring-in" style={{ animationDelay }}>
                  <StoveCard />
                </div>
              );
            }
            if (device.id === 'thermostat') {
              return (
                <div key={device.id} className="animate-spring-in" style={{ animationDelay }}>
                  <ThermostatCard />
                </div>
              );
            }
            if (device.id === 'lights') {
              return (
                <div key={device.id} className="animate-spring-in" style={{ animationDelay }}>
                  <LightsCard />
                </div>
              );
            }
            if (device.id === 'sonos') {
              // Placeholder - future implementation
              return (
                <div key={device.id} className="animate-spring-in" style={{ animationDelay }}>
                  <Card>
                    <CardHeader>
                      <CardTitle icon={device.icon}>{device.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Text variant="secondary">In arrivo - Integrazione Spotify + Sonos</Text>
                    </CardContent>
                  </Card>
                </div>
              );
            }
            return null;
          })}
        </Grid>

        {/* Empty State using new EmptyState component */}
        {enabledDevices.length === 0 && (
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
