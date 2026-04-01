import type { DirigeraHealthResponse } from '@/types/dirigeraProxy';

interface DirigeraHealthSectionProps {
  health: DirigeraHealthResponse;
}

/**
 * DirigeraHealthSection — Hub info section for the /dirigera page.
 *
 * Displays firmware version, connected sensor count, and hub reachability
 * in a horizontal flex row with label/value pairs.
 */
export default function DirigeraHealthSection({ health }: DirigeraHealthSectionProps) {
  return (
    <div className="rounded-2xl bg-slate-800/50 p-4">
      <div className="flex flex-wrap gap-6">
        {/* Firmware */}
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-slate-400">Firmware</span>
          <span className="text-sm font-medium">{health.firmware_version}</span>
        </div>

        {/* Connected sensors */}
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-slate-400">Sensori connessi</span>
          <span className="text-sm font-medium">{health.connected_sensors}</span>
        </div>

        {/* Hub reachability */}
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-slate-400">Hub raggiungibile</span>
          <span className="flex items-center gap-1.5 text-sm font-medium">
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                health.is_reachable ? 'bg-success-500' : 'bg-danger-500'
              }`}
              aria-hidden="true"
            />
            {health.is_reachable ? 'Sì' : 'No'}
          </span>
        </div>
      </div>
    </div>
  );
}
