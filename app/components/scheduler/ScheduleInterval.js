import { POWER_LABELS, FAN_LABELS } from '@/lib/schedulerStats';
import { Edit2, Trash2 } from 'lucide-react';

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
    <div
      className={`rounded-3xl p-5 transition-all duration-300 cursor-pointer ${
        isHighlighted
          ? 'bg-primary-50/80 dark:bg-primary-900/30 backdrop-blur-xl ring-2 ring-primary-400 dark:ring-primary-600 shadow-liquid-lg scale-[1.01]'
          : 'bg-white/[0.12] dark:bg-white/[0.08] backdrop-blur-2xl ring-1 ring-white/25 dark:ring-white/15 shadow-liquid hover:shadow-liquid-lg hover:bg-white/[0.16] dark:hover:bg-white/[0.12]'
      }`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    >
      <div className="flex flex-col gap-4">
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
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="p-3 rounded-full bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 dark:hover:bg-blue-500/30 transition-all duration-200 backdrop-blur-sm ring-1 ring-blue-500/30 dark:ring-blue-500/40"
                title="Modifica intervallo"
                aria-label="Modifica intervallo"
              >
                <Edit2 className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="p-3 rounded-full bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/20 dark:hover:bg-red-500/30 transition-all duration-200 backdrop-blur-sm ring-1 ring-red-500/30 dark:ring-red-500/40"
              title="Rimuovi intervallo"
              aria-label="Rimuovi intervallo"
            >
              <Trash2 className="w-5 h-5" />
              </button>
          </div>
        </div>

        {/* Power Progress Bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚡</span>
              <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                Potenza
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400">
                P{range.power}
              </span>
              <span className="text-sm font-medium text-neutral-900 dark:text-white">
                {powerLabel.text}
              </span>
            </div>
          </div>
          <div className="relative h-3 bg-neutral-200/50 dark:bg-neutral-800/50 rounded-full overflow-hidden backdrop-blur-sm">
            <div
              className={`absolute inset-y-0 left-0 bg-gradient-to-r ${powerLabel.gradient} rounded-full transition-all duration-500 shadow-md`}
              style={{ width: `${powerLabel.percent}%` }}
            />
          </div>
        </div>

        {/* Fan Progress Bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">💨</span>
              <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                Ventola
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400">
                V{range.fan}
              </span>
              <span className="text-sm font-medium text-neutral-900 dark:text-white">
                {fanLabel.text}
              </span>
            </div>
          </div>
          <div className="relative h-3 bg-neutral-200/50 dark:bg-neutral-800/50 rounded-full overflow-hidden backdrop-blur-sm">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 rounded-full transition-all duration-500 shadow-md"
              style={{ width: `${fanLabel.percent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}