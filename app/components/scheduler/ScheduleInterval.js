import Input from '../ui/Input';
import Select from '../ui/Select';
import { getPowerBadgeClass, getFanBadgeClass } from '@/lib/schedulerStats';
import { Edit2 } from 'lucide-react';

export default function ScheduleInterval({
  range,
  onRemove,
  onChange,
  onEdit,
  isHighlighted = false,
  onMouseEnter,
  onMouseLeave,
  onClick,
}) {
  const powerOptions = [1, 2, 3, 4, 5].map(p => ({
    value: p,
    label: `Livello ${p}`,
  }));

  const fanOptions = [1, 2, 3, 4, 5, 6].map(f => ({
    value: f,
    label: `Livello ${f}`,
  }));

  return (
    <div
      className={`rounded-xl p-4 border transition-all duration-200 cursor-pointer ${
        isHighlighted
          ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-400 dark:border-primary-600 shadow-lg scale-[1.02] ring-2 ring-primary-200 dark:ring-primary-700'
          : 'bg-neutral-50 dark:bg-white/[0.03] border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600 hover:shadow-md'
      }`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    >
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Orari */}
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="flex items-center gap-2 flex-1">
            <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 min-w-fit whitespace-nowrap">⏰ Dalle</label>
            <input
              type="time"
              value={range.start}
              onChange={(e) => onChange('start', e.target.value, false)}
              onBlur={(e) => onChange('start', e.target.value, true)}
              className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-xl text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-600 focus:border-transparent transition-all duration-200 text-sm"
            />
          </div>

          <div className="flex items-center gap-2 flex-1">
            <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 min-w-fit whitespace-nowrap">⏰ Alle</label>
            <input
              type="time"
              value={range.end}
              onChange={(e) => onChange('end', e.target.value, false)}
              onBlur={(e) => onChange('end', e.target.value, true)}
              className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-xl text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-600 focus:border-transparent transition-all duration-200 text-sm"
            />
          </div>
        </div>

        {/* Controlli Power e Fan con badges colorati */}
        <div className="flex gap-3 items-end">
          <div className="flex-1 min-w-[120px]">
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
              ⚡ Potenza
            </label>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-md text-xs font-bold ${getPowerBadgeClass(range.power)}`}>
                P{range.power}
              </span>
              <select
                value={range.power}
                onChange={(e) => onChange('power', Number(e.target.value), false)}
                onBlur={(e) => onChange('power', Number(e.target.value), true)}
                className="flex-1 px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-600 focus:border-transparent transition-all duration-200 appearance-none text-sm"
              >
                {powerOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex-1 min-w-[120px]">
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
              💨 Ventola
            </label>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-md text-xs font-bold ${getFanBadgeClass(range.fan)}`}>
                V{range.fan}
              </span>
              <select
                value={range.fan}
                onChange={(e) => onChange('fan', Number(e.target.value), false)}
                onBlur={(e) => onChange('fan', Number(e.target.value), true)}
                className="flex-1 px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-600 focus:border-transparent transition-all duration-200 appearance-none text-sm"
              >
                {fanOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Pulsanti azioni */}
          <div className="flex gap-2">
            {/* Pulsante modifica */}
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="p-3 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors duration-200 border border-blue-200 dark:border-blue-700 min-h-[44px] min-w-[44px]"
                title="Modifica intervallo"
                aria-label="Modifica intervallo"
              >
                <Edit2 className="w-5 h-5" />
              </button>
            )}

            {/* Pulsante rimuovi */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="p-3 text-xl text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-colors duration-200 border border-primary-200 dark:border-primary-700 min-h-[44px] min-w-[44px]"
              title="Rimuovi intervallo"
              aria-label="Rimuovi intervallo"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}