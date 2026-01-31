'use client';
import { useState, useEffect } from 'react';
import { BottomSheet, Button, Text, Select, Banner } from '@/app/components/ui';
import { NETATMO_ROUTES } from '@/lib/routes';
import { useRoomStatus } from '@/lib/hooks/useRoomStatus';
import DurationPicker from './DurationPicker';
import TemperaturePicker from './TemperaturePicker';
import { Flame, CheckCircle } from 'lucide-react';

/**
 * ManualOverrideSheet - Bottom sheet for creating temperature overrides
 *
 * @param {boolean} isOpen - Sheet visibility
 * @param {Function} onClose - Close handler
 * @param {Function} onOverrideCreated - Success callback
 */
export default function ManualOverrideSheet({
  isOpen,
  onClose,
  onOverrideCreated,
}) {
  const { rooms, loading: roomsLoading } = useRoomStatus();

  // Form state
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [temperature, setTemperature] = useState(20);
  const [duration, setDuration] = useState(60); // 1 hour default
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Auto-select first room when loaded
  useEffect(() => {
    if (rooms.length > 0 && !selectedRoomId) {
      setSelectedRoomId(rooms[0].id);
      // Pre-fill temperature from current setpoint
      const room = rooms[0];
      if (room.setpoint) {
        setTemperature(room.setpoint);
      }
    }
  }, [rooms, selectedRoomId]);

  // Update temperature when room changes
  const handleRoomChange = (roomId) => {
    setSelectedRoomId(roomId);
    const room = rooms.find(r => r.id === roomId);
    if (room?.setpoint) {
      setTemperature(room.setpoint);
    }
  };

  const handleSubmit = async () => {
    if (!selectedRoomId) return;

    try {
      setSubmitting(true);
      setError(null);

      // Calculate endtime (UNIX timestamp in SECONDS)
      const endtime = Math.floor(Date.now() / 1000) + duration * 60;

      const res = await fetch(NETATMO_ROUTES.setRoomThermpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_id: selectedRoomId,
          mode: 'manual',
          temp: temperature,
          endtime,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || 'Impossibile impostare override');
      }

      // Show success briefly, then close
      setSuccess(true);
      setTimeout(() => {
        onOverrideCreated?.();
        onClose();
        // Reset state
        setSuccess(false);
        setError(null);
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Room options for select
  const roomOptions = rooms.map(r => ({
    value: r.id,
    label: `${r.name} (${r.temperature?.toFixed(1) || '--'}°C)`,
  }));

  const selectedRoom = rooms.find(r => r.id === selectedRoomId);

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Manual Boost"
      icon="🔥"
    >
      {/* Success state */}
      {success ? (
        <div className="text-center py-8">
          <CheckCircle className="w-16 h-16 text-sage-400 mx-auto mb-4" />
          <Text variant="sage" size="lg" weight="bold">Override applicato!</Text>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Room selector */}
          <div>
            <Text variant="label" size="sm" className="mb-1.5">Stanza</Text>
            <Select
              value={selectedRoomId}
              onChange={(e) => handleRoomChange(e.target.value)}
              options={roomOptions}
              disabled={roomsLoading || submitting}
              liquid
            />
            {selectedRoom && (
              <Text variant="tertiary" size="xs" className="mt-1">
                Attuale: {selectedRoom.setpoint}°C • {selectedRoom.mode === 'manual' ? 'Override attivo' : 'Programmato'}
              </Text>
            )}
          </div>

          {/* Temperature picker */}
          <TemperaturePicker
            value={temperature}
            onChange={setTemperature}
          />

          {/* Duration picker */}
          <DurationPicker
            value={duration}
            onChange={setDuration}
          />

          {/* Error message */}
          {error && (
            <Banner
              variant="error"
              icon="⚠️"
              description={error}
              compact
            />
          )}

          {/* Submit button */}
          <Button
            variant="ember"
            size="lg"
            onClick={handleSubmit}
            loading={submitting}
            disabled={!selectedRoomId || submitting}
            className="w-full"
            icon={<Flame />}
          >
            Applica Override
          </Button>

          {/* Help text */}
          <Text variant="tertiary" size="xs" className="text-center">
            L'override terminerà automaticamente. La programmazione normale riprenderà al termine.
          </Text>
        </div>
      )}
    </BottomSheet>
  );
}
