import Select from './Select';

/**
 * RoomSelector Component
 *
 * Reusable room selector for multi-room devices.
 * Shows only when multiple rooms are available.
 *
 * @param {Object} props
 * @param {Array} props.rooms - Array of room objects {id, name}
 * @param {string} props.selectedRoomId - Currently selected room ID
 * @param {Function} props.onChange - Change handler (receives event)
 * @param {string} props.icon - Icon emoji (default: 🚪)
 * @param {string} props.label - Label text (default: Seleziona Stanza)
 * @param {string} props.className - Additional classes
 */
export default function RoomSelector({
  rooms = [],
  selectedRoomId,
  onChange,
  icon = '🚪',
  label = 'Seleziona Stanza',
  className = '',
}) {
  // Don't render if only 1 room or no rooms
  if (rooms.length <= 1) {
    return null;
  }

  return (
    <div className={`mb-4 sm:mb-6 ${className}`}>
      <Select
        liquid
        label={`${icon} ${label}`}
        value={selectedRoomId || ''}
        onChange={onChange}
        options={rooms.map(room => ({
          value: room.id,
          label: room.name
        }))}
        className="text-base sm:text-lg"
      />
    </div>
  );
}
