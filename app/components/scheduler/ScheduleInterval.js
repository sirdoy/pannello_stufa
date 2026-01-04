import { POWER_LABELS, FAN_LABELS } from '@/lib/schedulerStats';
import { Edit2, Trash2 } from 'lucide-react';
import Card from '../ui/Card';
import ActionButton from '../ui/ActionButton';
import ProgressBar from '../ui/ProgressBar';

export default function ScheduleInterval({
  range,
  onRemove,
  onEdit,
  isHighlighted = false,
  onMouseEnter,
  onMouseLeave,
  onClick,
}) {
  const powerLabel = POWER_LABELS[range.power];
  const fanLabel = FAN_LABELS[range.fan];

  return (
    <Card
      liquid
      className={`cursor-pointer transition-all duration-300 p-4 ${
        isHighlighted
          ? 'bg-primary-50/80 dark:bg-primary-900/30 ring-2 ring-primary-400 dark:ring-primary-600 shadow-liquid-lg scale-[1.01]'
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
            <div className="text-2xl">⏰</div>
            <div>
              <div className="text-lg font-bold text-neutral-900 dark:text-white">
                {range.start} - {range.end}
              </div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">
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
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {onEdit && (
              <ActionButton
                icon={<Edit2 />}
                variant="edit"
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
              variant="delete"
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
              <span className="text-lg">⚡</span>
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

        {/* Fan Progress Bar */}
        <ProgressBar
          value={fanLabel.percent}
          color="info"
          size="md"
          animated
          leftContent={
            <>
              <span className="text-lg">💨</span>
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
    </Card>
  );
}