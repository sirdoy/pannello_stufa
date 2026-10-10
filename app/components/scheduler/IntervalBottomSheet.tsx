'use client';
import { Edit2, Trash2, Wind, Zap } from 'lucide-react';
import { POWER_LABELS, FAN_LABELS } from '@/lib/scheduler/schedulerStats';
import BottomSheet from '../ui/BottomSheet';
import ProgressBar from '../ui/ProgressBar';
import Button from '../ui/Button';
import Text from '../ui/Text';
import type { ScheduleInterval } from '@/lib/scheduler/schedulerService';

export interface IntervalBottomSheetProps {
  range: ScheduleInterval | undefined;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  /** Climate control decides power and fan: show the time range only */
  hideLevels?: boolean;
}

export default function IntervalBottomSheet({
  range,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  hideLevels = false,
}: IntervalBottomSheetProps) {
  if (!isOpen || !range) return null;

  // Calcola durata intervallo
  const getDuration = () => {
    const [startH, startM] = range.start.split(':').map(Number);
    const [endH, endM] = range.end.split(':').map(Number);
    const durationMin = endH! * 60 + endM! - (startH! * 60 + startM!);
    const hours = Math.floor(durationMin / 60);
    const minutes = durationMin % 60;
    return hours > 0
      ? `${hours}h${minutes > 0 ? ` ${minutes}min` : ''}`
      : `${minutes}min`;
  };

  const powerLabel = POWER_LABELS[range.power as keyof typeof POWER_LABELS];
  const fanLabel = FAN_LABELS[range.fan as keyof typeof FAN_LABELS];

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={`${range.start} - ${range.end}`}
      showCloseButton={true}
      showHandle={true}
      closeOnBackdrop={true}
    >
      {/* Durata */}
      <Text variant="secondary" size="sm" className="mb-6">
        {getDuration()}
      </Text>

      {!hideLevels && (
        <>
          {/* Potenza */}
          <div className="mb-5">
            <ProgressBar
              value={powerLabel.percent}
              gradient={powerLabel.gradient}
              size="md"
              animated
              leftContent={
                <>
                  <Zap size={16} className="text-(--text-2)" aria-hidden="true" />
                  <Text as="span" variant="secondary" size="sm">
                    Potenza
                  </Text>
            </>
          }
          rightContent={
            <>
              <Text as="span" variant="tertiary" size="xs">
                P{range.power}
              </Text>
              <Text as="span" size="sm">
                {powerLabel.text}
              </Text>
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
              <Wind size={16} className="text-(--text-2)" aria-hidden="true" />
              <Text as="span" variant="secondary" size="sm">
                Ventola
              </Text>
            </>
          }
          rightContent={
            <>
              <Text as="span" variant="tertiary" size="xs">
                V{range.fan}
              </Text>
              <Text as="span" size="sm">
                {fanLabel.text}
              </Text>
            </>
          }
        />
      </div>
        </>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          variant="subtle"
          colorScheme="ocean"
          size="md"
          fullWidth
          onClick={onEdit}
          icon={<Edit2 size={16} />}
        >
          Modifica
        </Button>

        <Button
          variant="danger"
          size="md"
          fullWidth
          onClick={onDelete}
          icon={<Trash2 size={16} />}
        >
          Elimina
        </Button>
      </div>
    </BottomSheet>
  );
}
