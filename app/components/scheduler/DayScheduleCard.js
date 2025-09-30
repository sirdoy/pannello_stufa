import Card from '../ui/Card';
import Button from '../ui/Button';
import TimeBar from './TimeBar';
import ScheduleInterval from './ScheduleInterval';

export default function DayScheduleCard({
  day,
  intervals,
  onAddInterval,
  onRemoveInterval,
  onChangeInterval,
}) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📅</span>
          <div>
            <h2 className="text-xl font-bold text-neutral-900">{day}</h2>
            <p className="text-sm text-neutral-500">
              {intervals.length} {intervals.length === 1 ? 'intervallo' : 'intervalli'}
            </p>
          </div>
        </div>
      </div>

      <TimeBar intervals={intervals} />

      <div className="space-y-3">
        {intervals.map((range, index) => (
          <ScheduleInterval
            key={index}
            range={range}
            onRemove={() => onRemoveInterval(index)}
            onChange={(field, value) => onChangeInterval(index, field, value)}
          />
        ))}
      </div>

      <Button
        variant="success"
        icon="+"
        onClick={onAddInterval}
        className="mt-4 w-full"
      >
        Aggiungi intervallo
      </Button>
    </Card>
  );
}