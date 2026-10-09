'use client';

import Button from '@/app/components/ui/Button';
import InlineSelect from '@/app/components/ui/InlineSelect';

interface SonosGroupControlsProps {
  uid: string;
  isCoordinator: boolean;
  zoneMemberCount: number;
  availableZones: Array<{ group_id: string; label: string; coordinator_uid: string }>;
  onJoinGroup: (uid: string, targetUid: string) => Promise<void>;
  onUnjoinGroup: (uid: string) => Promise<void>;
}

export default function SonosGroupControls({
  uid,
  isCoordinator,
  zoneMemberCount,
  availableZones,
  onJoinGroup,
  onUnjoinGroup,
}: SonosGroupControlsProps) {
  // Show unjoin button for non-coordinator members in a multi-member zone
  if (!isCoordinator && zoneMemberCount > 1) {
    return (
      <div className="mt-2 inline-flex items-center gap-2">
        <Button
          variant="danger"
          size="sm"
          onClick={() => void onUnjoinGroup(uid)}
          aria-label="Separa altoparlante dal gruppo"
        >
          Separa
        </Button>
      </div>
    );
  }

  // Show join dropdown for standalone coordinator (single-member zone)
  if (isCoordinator && zoneMemberCount === 1) {
    const otherZones = availableZones.filter(z => z.coordinator_uid !== uid);

    return (
      <div className="mt-2 inline-flex items-center gap-2">
        {/* InlineSelect: an action menu that resets itself to the empty value */}
        <InlineSelect
          size="md"
          onChange={e => {
            const targetUid = e.target.value;
            if (targetUid) {
              void onJoinGroup(uid, targetUid);
              // Reset select after action
              e.target.value = '';
            }
          }}
          defaultValue=""
          aria-label="Unisci a un gruppo"
        >
          <option value="" disabled>
            Unisci a...
          </option>
          {otherZones.map(zone => (
            <option key={zone.group_id} value={zone.coordinator_uid}>
              {zone.label}
            </option>
          ))}
        </InlineSelect>
      </div>
    );
  }

  // Coordinator in multi-member zone: render nothing
  return null;
}
