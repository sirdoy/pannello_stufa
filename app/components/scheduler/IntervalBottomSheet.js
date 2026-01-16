'use client';
import { Edit2, Trash2 } from 'lucide-react';
import { POWER_LABELS, FAN_LABELS } from '@/lib/schedulerStats';
import BottomSheet from '../ui/BottomSheet';
import ProgressBar from '../ui/ProgressBar';
import Button from '../ui/Button';
import Text from '../ui/Text';

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
      <Text variant="secondary" size="sm" className="mb-6">
        {getDuration()}
      </Text>

      {/* Potenza */}
      <div className="mb-5">
        <ProgressBar
          value={powerLabel.percent}
          gradient={powerLabel.gradient}
          size="md"
          animated
          leftContent={
            <>
              <Text as="span" className="text-xl">⚡</Text>
              <Text as="span" variant="secondary" size="sm" weight="semibold">
                Potenza
              </Text>
            </>
          }
          rightContent={
            <>
              <Text as="span" variant="tertiary" size="xs" weight="bold">
                P{range.power}
              </Text>
              <Text as="span" size="sm" weight="medium">
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
              <Text as="span" className="text-xl">💨</Text>
              <Text as="span" variant="secondary" size="sm" weight="semibold">
                Ventola
              </Text>
            </>
          }
          rightContent={
            <>
              <Text as="span" variant="tertiary" size="xs" weight="bold">
                V{range.fan}
              </Text>
              <Text as="span" size="sm" weight="medium">
                {fanLabel.text}
              </Text>
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
          className="bg-ocean-500/10 [html:not(.dark)_&]:bg-ocean-500/20 text-ocean-600 [html:not(.dark)_&]:text-ocean-400 hover:bg-ocean-500/20 [html:not(.dark)_&]:hover:bg-ocean-500/30 ring-1 ring-ocean-500/30 [html:not(.dark)_&]:ring-ocean-500/40"
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
          className="bg-ember-500/10 [html:not(.dark)_&]:bg-ember-500/20 text-ember-600 [html:not(.dark)_&]:text-ember-400 hover:bg-ember-500/20 [html:not(.dark)_&]:hover:bg-ember-500/30 ring-1 ring-ember-500/30 [html:not(.dark)_&]:ring-ember-500/40"
        >
          Elimina
        </Button>
      </div>
    </BottomSheet>
  );
}
