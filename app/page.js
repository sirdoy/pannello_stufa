import { auth0 } from '@/lib/auth0';
import StoveCard from './components/devices/stove/StoveCard';
import ThermostatCard from './components/devices/thermostat/ThermostatCard';
import LightsCard from './components/devices/lights/LightsCard';
import SandboxToggle from './components/sandbox/SandboxToggle';
import { getEnabledDevicesForUser } from '@/lib/devicePreferencesService';

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
      {/* Page header - Enhanced hierarchy */}
      <div className="mb-8 sm:mb-12">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-1 w-12 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full" />
          <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
            Dashboard
          </span>
        </div>
        <h1 className="text-fluid-3xl font-bold text-neutral-900 dark:text-white mb-3">
          I tuoi dispositivi
        </h1>
        <p className="text-fluid-base text-neutral-600 dark:text-neutral-400 max-w-2xl">
          Controlla e monitora tutti i dispositivi della tua casa in tempo reale
        </p>
      </div>

      {/* Sandbox Toggle - Solo in localhost */}
      <SandboxToggle />

      {/* Devices grid - Mobile: stack, Desktop: 2 columns - Increased spacing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
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
                <div className="p-6 rounded-3xl bg-white/[0.08] dark:bg-white/[0.05] backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-liquid">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">{device.icon}</span>
                    <h2 className="text-xl font-bold text-neutral-900 dark:text-white">{device.name}</h2>
                  </div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">In arrivo - Integrazione Spotify + Sonos</p>
                </div>
              </div>
            );
          }
          return null;
        })}
      </div>

      {/* Empty State */}
      {enabledDevices.length === 0 && (
        <div className="text-center py-12">
          <p className="text-neutral-500 dark:text-neutral-400">Nessun dispositivo configurato</p>
        </div>
      )}
    </main>
  );
}
