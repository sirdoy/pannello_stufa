import Card from '@/app/components/ui/Card';
import Text from '@/app/components/ui/Text';
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
    <Card>
      <div className="flex flex-wrap gap-6">
        {/* Firmware */}
        <div className="flex flex-col gap-0.5">
          <Text as="span" variant="secondary" size="xs">Firmware</Text>
          <Text as="span" size="sm" weight="medium">{health.firmware_version}</Text>
        </div>

        {/* Connected sensors */}
        <div className="flex flex-col gap-0.5">
          <Text as="span" variant="secondary" size="xs">Sensori connessi</Text>
          <Text as="span" size="sm" weight="medium">{health.connected_sensors}</Text>
        </div>

        {/* Hub reachability */}
        <div className="flex flex-col gap-0.5">
          <Text as="span" variant="secondary" size="xs">Hub raggiungibile</Text>
          <Text as="span" size="sm" weight="medium" className="flex items-center gap-1.5">
            <span
              className={`inline-block size-2 rounded-full ${
                health.is_reachable ? 'bg-success-500' : 'bg-danger-500'
              }`}
              aria-hidden="true"
            />
            {health.is_reachable ? 'Sì' : 'No'}
          </Text>
        </div>
      </div>
    </Card>
  );
}
