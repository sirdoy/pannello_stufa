'use client';

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
      <div className="inline-flex items-center gap-2 mt-2">
        <button
          onClick={() => void onUnjoinGroup(uid)}
          className="text-xs px-2 py-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-md transition-colors"
          aria-label="Separa altoparlante dal gruppo"
        >
          Separa
        </button>
      </div>
    );
  }

  // Show join dropdown for standalone coordinator (single-member zone)
  if (isCoordinator && zoneMemberCount === 1) {
    const otherZones = availableZones.filter(z => z.coordinator_uid !== uid);

    return (
      <div className="inline-flex items-center gap-2 mt-2">
        <select
          onChange={e => {
            const targetUid = e.target.value;
            if (targetUid) {
              void onJoinGroup(uid, targetUid);
              // Reset select after action
              e.target.value = '';
            }
          }}
          defaultValue=""
          className="text-xs bg-slate-700/50 text-slate-300 rounded-md border-0 px-2 py-1 [html:not(.dark)_&]:bg-slate-200 [html:not(.dark)_&]:text-slate-600"
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
        </select>
      </div>
    );
  }

  // Coordinator in multi-member zone: render nothing
  return null;
}
