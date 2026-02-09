import type React from 'react';
import Select from './Select';

export interface Room {
  /** Room unique identifier */
  id: string;
  /** Room display name */
  name: string;
  /** Room is offline */
  isOffline?: boolean;
  /** Room has low battery */
  hasLowBattery?: boolean;
  /** Room has critical battery */
  hasCriticalBattery?: boolean;
  /** Room is currently heating */
  heating?: boolean;
}

export interface RoomSelectorProps {
  /** Array of room objects */
  rooms?: Room[];
  /** Currently selected room ID */
  selectedRoomId?: string;
  /** Change handler (receives event) */
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  /** Icon emoji (default: 🚪) */
  icon?: string;
  /** Label text (default: Seleziona Stanza) */
  label?: string;
  /** Color variant */
  variant?: 'default' | 'ember' | 'ocean';
  /** Additional classes */
  className?: string;
}

/**
 * RoomSelector Component - Ember Noir Design System
 *
 * Reusable room selector for multi-room devices.
 * Shows only when multiple rooms are available.
 * Includes visual indicators for offline/battery/heating status.
 */
export default function RoomSelector({
  rooms = [],
  selectedRoomId,
  onChange,
  icon = '🚪',
  label = 'Seleziona Stanza',
  variant = 'default',
  className = '',
}: RoomSelectorProps): React.ReactElement | null {
  // Don't render if only 1 room or no rooms
  if (rooms.length <= 1) {
    return null;
  }

  // Build room labels with status indicators
  const roomOptions = rooms.map(room => {
    let statusIndicator = '';
    if (room.isOffline) {
      statusIndicator = ' 📵';
    } else if (room.hasCriticalBattery) {
      statusIndicator = ' 🪫';
    } else if (room.hasLowBattery) {
      statusIndicator = ' 🔋';
    } else if (room.heating) {
      statusIndicator = ' 🔥';
    }

    return {
      value: room.id,
      label: `${room.name}${statusIndicator}`
    };
  });

  return (
    <div className={`mb-4 sm:mb-6 ${className}`}>
      <Select
        variant={variant}
        icon={icon}
        label={label}
        value={selectedRoomId || ''}
        onChange={onChange as (event: { target: { value: string | number } }) => void}
        options={roomOptions}
        className="text-base sm:text-lg"
      />
    </div>
  );
}
