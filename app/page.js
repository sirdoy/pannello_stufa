import { getSession } from '@auth0/nextjs-auth0/edge';
import StoveCard from './components/devices/stove/StoveCard';
import ThermostatCard from './components/devices/thermostat/ThermostatCard';
import LightsCard from './components/devices/lights/LightsCard';
import { getEnabledDevices } from '@/lib/devices';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const session = await getSession();
  const user = session?.user;
  const enabledDevices = getEnabledDevices();

  return (
    <main>
      {/* Page header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">
          I tuoi dispositivi
        </h1>
        <p className="text-sm sm:text-base text-neutral-600 mt-2">
          Controlla e monitora tutti i dispositivi della tua casa
        </p>
      </div>

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
          // Future devices will be added here
          return null;
        })}
      </div>

      {/* Empty State */}
      {enabledDevices.length === 0 && (
        <div className="text-center py-12">
          <p className="text-neutral-500">Nessun dispositivo configurato</p>
        </div>
      )}
    </main>
  );
}
