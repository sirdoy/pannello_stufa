'use client';
import { useState } from 'react';
import { Button, Text, ConfirmDialog } from '@/app/components/ui';
import { NETATMO_ROUTES } from '@/lib/routes';
import { X, Flame, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface Room {
  id: string;
  name: string;
  mode?: string;
  setpoint?: number;
  endtime?: number;
  [key: string]: unknown;
}

interface ActiveOverrideBadgeProps {
  room: Room;
  onCancelled?: () => void;
}

/**
 * ActiveOverrideBadge - Shows active override with cancel option
 */
export default function ActiveOverrideBadge({
  room,
  onCancelled,
}: ActiveOverrideBadgeProps) {
  const [showConfirm, setShowConfirm] = useState<boolean>(false);
  const [cancelling, setCancelling] = useState<boolean>(false);

  if (!room || room.mode !== 'manual') {
    return null;
  }

  // Calculate remaining time
  const endDate = room.endtime ? new Date(room.endtime * 1000) : null;
  const now = new Date();
  const remainingMinutes = endDate ? Math.max(0, Math.round((endDate.getTime() - now.getTime()) / 60000)) : null;

  const formatRemaining = (minutes: number | null): string => {
    if (!minutes) return '';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const handleCancel = async (): Promise<void> => {
    try {
      setCancelling(true);

      const res = await fetch(NETATMO_ROUTES.setRoomThermpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_id: room.id,
          mode: 'home', // Return to schedule
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Impossibile annullare override');
      }

      setShowConfirm(false);
      onCancelled?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('Cancel override failed:', message);
      // Keep dialog open on error
    } finally {
      setCancelling(false);
    }
  };

  return (
    <>
      {/* Badge */}
      <button
        onClick={() => setShowConfirm(true)}
        className="
          flex items-center gap-3
          bg-ember-500/20 hover:bg-ember-500/30
          border border-ember-500/40
          rounded-xl px-4 py-3
          transition-colors
          group
        "
      >
        <div className="flex items-center gap-2">
          <Flame className="text-ember-400" size={20} />
          <div className="text-left">
            <Text variant="body" weight="bold" className="text-ember-300">
              {room.setpoint}°C
            </Text>
            <Text variant="tertiary" size="xs">
              {room.name}
            </Text>
          </div>
        </div>

        <div className="flex items-center gap-2 text-ember-400/70">
          <Clock size={14} />
          <Text variant="tertiary" size="xs">
            {remainingMinutes !== null && endDate ? (
              <>fino alle {format(endDate, 'HH:mm', { locale: it })}</>
            ) : (
              'Override attivo'
            )}
          </Text>
        </div>

        <X
          size={16}
          className="text-slate-400 group-hover:text-ember-400 transition-colors"
        />
      </button>

      {/* Confirm dialog */}
      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleCancel}
        title="Annulla Override"
        message={`Vuoi tornare alla programmazione normale per ${room.name}?`}
        confirmText="Annulla Override"
        cancelText="Mantieni"
        variant="warning"
        loading={cancelling}
      />
    </>
  );
}
