import { auth0 } from '@/lib/auth0';
import StoveCard from './components/devices/stove/StoveCard';
import ThermostatCard from './components/devices/thermostat/ThermostatCard';
import LightsCard from './components/devices/lights/LightsCard';
import SandboxToggle from './components/sandbox/SandboxToggle';
import { getEnabledDevicesForUser } from '@/lib/devicePreferencesService';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const session = await auth0.getSession();
  const user = session?.user;
  const userId = user?.sub;
  const enabledDevices = await getEnabledDevicesForUser(userId);

  return (
    <main>
      {/* Page header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">
          I tuoi dispositivi
        </h1>
        <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 mt-2">
          Controlla e monitora tutti i dispositivi della tua casa
        </p>
      </div>

      {/* Sandbox Toggle - Solo in localhost */}
      <SandboxToggle />

      {/* Devices grid - Mobile: stack, Desktop: 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {enabledDevices.map((device) => {
          // Render device-specific card
          if (device.id === 'stove') {
            return <StoveCard key={device.id} />;
          }
          if (device.id === 'thermostat') {
            return <ThermostatCard key={device.id} />;
          }
          if (device.id === 'lights') {
            return <LightsCard key={device.id} />;
          }
          if (device.id === 'sonos') {
            // Placeholder - future implementation
            return (
              <div key={device.id} className="p-6 rounded-2xl bg-white/[0.08] dark:bg-white/[0.05] backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-liquid">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{device.icon}</span>
                  <h2 className="text-xl font-bold text-neutral-900 dark:text-white">{device.name}</h2>
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">In arrivo - Integrazione Spotify + Sonos</p>
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
