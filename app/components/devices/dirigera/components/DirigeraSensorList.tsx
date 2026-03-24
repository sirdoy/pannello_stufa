import type { DirigeraSensor } from '@/types/dirigeraProxy';
import type { SensorFilter } from '../hooks/useDirigeraFullData';
import DirigeraSensorRow from './DirigeraSensorRow';

interface DirigeraSensorListProps {
  sensors: DirigeraSensor[];
  filter: SensorFilter;
}

/**
 * DirigeraSensorList — Sorted container of sensor rows for the /dirigera page.
 *
 * Sorts by room then custom_name in Italian locale.
 * showFreshness is true for contact/motion filters (data_freshness field present),
 * false for "all" (base DirigeraSensor lacks data_freshness).
 */
export default function DirigeraSensorList({ sensors, filter }: DirigeraSensorListProps) {
  if (sensors.length === 0) {
    return (
      <p className="text-sm text-slate-400 py-4 text-center">
        Nessun sensore trovato
      </p>
    );
  }

  const sorted = [...sensors].sort((a, b) => {
    const roomCmp = (a.room ?? '').localeCompare(b.room ?? '', 'it');
    if (roomCmp !== 0) return roomCmp;
    return a.custom_name.localeCompare(b.custom_name, 'it');
  });

  const showFreshness = filter !== 'all';

  return (
    <div className="space-y-3">
      {sorted.map(sensor => (
        <DirigeraSensorRow key={sensor.id} sensor={sensor} showFreshness={showFreshness} />
      ))}
    </div>
  );
}
