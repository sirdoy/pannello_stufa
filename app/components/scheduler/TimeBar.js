export default function TimeBar({ intervals }) {
  const totalMinutes = 24 * 60;

  return (
    <div className="relative w-full mb-8">
      {/* Barra base */}
      <div className="relative h-8 w-full bg-neutral-200 rounded-xl overflow-hidden shadow-inner">
        {intervals.map((range, idx) => {
          const [startH, startM] = range.start.split(':').map(Number);
          const [endH, endM] = range.end.split(':').map(Number);
          const start = startH * 60 + startM;
          const end = endH * 60 + endM;
          const left = (start / totalMinutes) * 100;
          const width = ((end - start) / totalMinutes) * 100;
          return (
            <div
              key={idx}
              className="absolute top-0 bottom-0 bg-gradient-to-r from-primary-400 to-accent-500 hover:from-primary-500 hover:to-accent-600 transition-all duration-200 cursor-pointer"
              style={{ left: `${left}%`, width: `${width}%` }}
              title={`Accesa: ${range.start} - ${range.end} (P:${range.power} F:${range.fan})`}
            />
          );
        })}
      </div>
      {/* Etichette orari sopra/sotto - nascosti su mobile molto piccolo */}
      {intervals.length > 0 && (
        <div className="relative w-full hidden xs:block">
          {intervals.map((range, idx) => {
            const [startH, startM] = range.start.split(':').map(Number);
            const [endH, endM] = range.end.split(':').map(Number);
            const start = startH * 60 + startM;
            const end = endH * 60 + endM;
            const startLeft = (start / totalMinutes) * 100;
            const endLeft = (end / totalMinutes) * 100;
            return (
              <div key={idx}>
                <span
                  className="absolute -top-7 text-xs font-semibold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-lg border border-primary-200"
                  style={{ left: `${startLeft}%`, transform: 'translateX(-50%)' }}
                >
                  {range.start}
                </span>
                <span
                  className="absolute top-10 text-xs font-semibold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-lg border border-primary-200"
                  style={{ left: `${endLeft}%`, transform: 'translateX(-50%)' }}
                >
                  {range.end}
                </span>
              </div>
            );
          })}
        </div>
      )}
      {/* Indicatori ore principali per riferimento */}
      <div className="relative w-full mt-3">
        {[0, 6, 12, 18, 24].map(hour => (
          <span
            key={hour}
            className="absolute text-xs text-neutral-400 font-mono"
            style={{ left: `${(hour / 24) * 100}%`, transform: 'translateX(-50%)' }}
          >
            {hour.toString().padStart(2, '0')}:00
          </span>
        ))}
      </div>
    </div>
  );
}