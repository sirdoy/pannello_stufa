import { POWER_LABELS, FAN_LABELS } from '@/lib/schedulerStats';
import { Edit2, Trash2 } from 'lucide-react';
import Card from '../ui/Card';
import ActionButton from '../ui/ActionButton';
import ProgressBar from '../ui/ProgressBar';
import Text from '../ui/Text';
import type { ScheduleInterval as ScheduleIntervalType } from '@/lib/schedulerService';

export interface ScheduleIntervalProps {
  range: ScheduleIntervalType;
  onRemove: () => void;
  onEdit?: () => void;
  onChange?: (field: string, value: string | number, isBlur?: boolean) => void;
  isHighlighted?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onClick?: () => void;
}

export default function ScheduleInterval({
  range,
  onRemove,
  onEdit,
  isHighlighted = false,
  onMouseEnter,
  onMouseLeave,
  onClick,
}: ScheduleIntervalProps) {
  const powerLabel = POWER_LABELS[range.power as keyof typeof POWER_LABELS];
  const fanLabel = FAN_LABELS[range.fan as keyof typeof FAN_LABELS];

  return (
    <Card
      variant="glass"
      className={`cursor-pointer transition-all duration-300 p-4 ${
        isHighlighted
          ? 'bg-ember-900/30 [html:not(.dark)_&]:bg-ember-50/80 ring-2 ring-ember-600 [html:not(.dark)_&]:ring-ember-400 shadow-liquid-lg scale-[1.01]'
          : ''
      }`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    >
      <div className="flex flex-col gap-5">
        {/* Time Range */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Text className="text-2xl">⏰</Text>
            <div>
              <Text size="lg" weight="bold">
                {range.start} - {range.end}
              </Text>
              <Text variant="tertiary" size="sm">
                {(() => {
                  const [startH, startM] = range.start.split(':').map(Number);
                  const [endH, endM] = range.end.split(':').map(Number);
                  const durationMin = (endH * 60 + endM) - (startH * 60 + startM);
                  const hours = Math.floor(durationMin / 60);
                  const minutes = durationMin % 60;
                  return hours > 0
                    ? `${hours}h${minutes > 0 ? ` ${minutes}min` : ''}`
                    : `${minutes}min`;
                })()}
              </Text>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {onEdit && (
              <ActionButton
                icon={<Edit2 />}
                variant="ocean"
                size="md"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                title="Modifica intervallo"
                ariaLabel="Modifica intervallo"
              />
            )}
            <ActionButton
              icon={<Trash2 />}
              variant="danger"
              size="md"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              title="Rimuovi intervallo"
              ariaLabel="Rimuovi intervallo"
            />
          </div>
        </div>

        {/* Power Progress Bar */}
        <ProgressBar
          value={powerLabel.percent}
          gradient={powerLabel.gradient}
          size="md"
          animated
          leftContent={
            <>
              <Text as="span" className="text-lg">⚡</Text>
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

        {/* Fan Progress Bar */}
        <ProgressBar
          value={fanLabel.percent}
          color="info"
          size="md"
          animated
          leftContent={
            <>
              <Text as="span" className="text-lg">💨</Text>
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
    </Card>
  );
}