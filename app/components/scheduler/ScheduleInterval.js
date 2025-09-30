import Input from '../ui/Input';
import Select from '../ui/Select';

export default function ScheduleInterval({
  range,
  onRemove,
  onChange,
}) {
  const powerOptions = [0, 1, 2, 3, 4, 5].map(p => ({
    value: p,
    label: `Livello ${p}`,
  }));

  const fanOptions = [1, 2, 3, 4, 5, 6].map(f => ({
    value: f,
    label: `Livello ${f}`,
  }));

  return (
    <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200 hover:border-neutral-300 transition-colors duration-200">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Orari */}
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="flex items-center gap-2 flex-1">
            <label className="text-sm font-semibold text-neutral-700 min-w-fit whitespace-nowrap">⏰ Dalle</label>
            <input
              type="time"
              value={range.start}
              onChange={(e) => onChange('start', e.target.value)}
              className="input-modern text-sm"
            />
          </div>

          <div className="flex items-center gap-2 flex-1">
            <label className="text-sm font-semibold text-neutral-700 min-w-fit whitespace-nowrap">⏰ Alle</label>
            <input
              type="time"
              value={range.end}
              onChange={(e) => onChange('end', e.target.value)}
              className="input-modern text-sm"
            />
          </div>
        </div>

        {/* Controlli Power e Fan */}
        <div className="flex gap-3 items-end">
          <div className="flex-1 min-w-[100px]">
            <label className="block text-xs font-semibold text-neutral-700 mb-1">⚡ Potenza</label>
            <select
              value={range.power}
              onChange={(e) => onChange('power', Number(e.target.value))}
              className="select-modern text-sm"
            >
              {powerOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[100px]">
            <label className="block text-xs font-semibold text-neutral-700 mb-1">💨 Ventola</label>
            <select
              value={range.fan}
              onChange={(e) => onChange('fan', Number(e.target.value))}
              className="select-modern text-sm"
            >
              {fanOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Pulsante rimuovi */}
          <button
            onClick={onRemove}
            className="p-3 text-xl text-primary-600 hover:bg-primary-50 rounded-xl transition-colors duration-200 border border-primary-200"
            title="Rimuovi intervallo"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}