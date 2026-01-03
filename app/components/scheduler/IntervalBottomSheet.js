'use client';
import { Edit2, Trash2 } from 'lucide-react';
import { POWER_LABELS, FAN_LABELS } from '@/lib/schedulerStats';
import BottomSheet from '../ui/BottomSheet';
import ProgressBar from '../ui/ProgressBar';
import Button from '../ui/Button';

export default function IntervalBottomSheet({
  range,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}) {
  if (!isOpen || !range) return null;

  // Calcola durata intervallo
  const getDuration = () => {
    const [startH, startM] = range.start.split(':').map(Number);
    const [endH, endM] = range.end.split(':').map(Number);
    const durationMin = endH * 60 + endM - (startH * 60 + startM);
    const hours = Math.floor(durationMin / 60);
    const minutes = durationMin % 60;
    return hours > 0
      ? `${hours}h${minutes > 0 ? ` ${minutes}min` : ''}`
      : `${minutes}min`;
  };

  const powerLabel = POWER_LABELS[range.power];
  const fanLabel = FAN_LABELS[range.fan];

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={`${range.start} - ${range.end}`}
      icon="⏰"
      showCloseButton={true}
      showHandle={true}
      closeOnBackdrop={true}
    >
      {/* Durata */}
      <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
        {getDuration()}
      </div>

      {/* Potenza */}
      <div className="mb-5">
        <ProgressBar
          value={powerLabel.percent}
          gradient={powerLabel.gradient}
          size="md"
          animated
          leftContent={
            <>
              <span className="text-xl">⚡</span>
              <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                Potenza
              </span>
            </>
          }
          rightContent={
            <>
              <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400">
                P{range.power}
              </span>
              <span className="text-sm font-medium text-neutral-900 dark:text-white">
                {powerLabel.text}
              </span>
            </>
          }
        />
      </div>

      {/* Ventola */}
      <div className="mb-6">
        <ProgressBar
          value={fanLabel.percent}
          color="info"
          size="md"
          animated
          leftContent={
            <>
              <span className="text-xl">💨</span>
              <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                Ventola
              </span>
            </>
          }
          rightContent={
            <>
              <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400">
                V{range.fan}
              </span>
              <span className="text-sm font-medium text-neutral-900 dark:text-white">
                {fanLabel.text}
              </span>
            </>
          }
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          variant="primary"
          size="md"
          fullWidth
          onClick={onEdit}
          icon={<Edit2 />}
          iconPosition="left"
          liquid
          className="bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 dark:hover:bg-blue-500/30 ring-1 ring-blue-500/30 dark:ring-blue-500/40"
        >
          Modifica
        </Button>

        <Button
          variant="danger"
          size="md"
          fullWidth
          onClick={onDelete}
          icon={<Trash2 />}
          iconPosition="left"
          liquid
          className="bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/20 dark:hover:bg-red-500/30 ring-1 ring-red-500/30 dark:ring-red-500/40"
        >
          Elimina
        </Button>
      </div>
    </BottomSheet>
  );
}
