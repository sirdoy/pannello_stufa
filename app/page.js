import { auth0 } from '@/lib/auth0';
import StoveCard from './components/devices/stove/StoveCard';
import ThermostatCard from './components/devices/thermostat/ThermostatCard';
import LightsCard from './components/devices/lights/LightsCard';
import SandboxToggle from './components/sandbox/SandboxToggle';
import { getEnabledDevicesForUser } from '@/lib/devicePreferencesService';
import { Section, Grid, Heading, Text, Divider, EmptyState } from './components/ui';

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
                  <div className="p-6 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-white/[0.06] shadow-card [html:not(.dark)_&]:bg-white/90 [html:not(.dark)_&]:border-black/[0.06] [html:not(.dark)_&]:shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl">{device.icon}</span>
                      <Heading level={2} size="lg">{device.name}</Heading>
                    </div>
                    <Text variant="secondary">In arrivo - Integrazione Spotify + Sonos</Text>
                  </div>
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
