import Select from './Select';

/**
 * RoomSelector Component - Ember Noir Design System
 *
 * Reusable room selector for multi-room devices.
 * Shows only when multiple rooms are available.
 * Includes visual indicators for offline/battery status.
 *
 * @param {Object} props
 * @param {Array} props.rooms - Array of room objects {id, name, isOffline?, hasLowBattery?, hasCriticalBattery?}
 * @param {string} props.selectedRoomId - Currently selected room ID
 * @param {Function} props.onChange - Change handler (receives event)
 * @param {string} props.icon - Icon emoji (default: 🚪)
 * @param {string} props.label - Label text (default: Seleziona Stanza)
 * @param {'default'|'ember'|'ocean'} props.variant - Color variant
 * @param {string} props.className - Additional classes
 */
export default function RoomSelector({
  rooms = [],
  selectedRoomId,
  onChange,
  icon = '🚪',
  label = 'Seleziona Stanza',
  variant = 'default',
  className = '',
}) {
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
        label={`${icon} ${label}`}
        value={selectedRoomId || ''}
        onChange={onChange}
        options={roomOptions}
        className="text-base sm:text-lg"
      />
    </div>
  );
}
