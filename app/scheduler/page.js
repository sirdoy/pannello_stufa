'use client';

import { useState, useEffect } from 'react';
import { saveSchedule, getWeeklySchedule, setSchedulerMode, getFullSchedulerMode, clearSemiManualMode, getNextScheduledChange, setSemiManualMode } from '@/lib/schedulerService';
import { logSchedulerAction } from '@/lib/logService';
import Card from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import ModeIndicator from '@/app/components/ui/ModeIndicator';
import DayScheduleCard from '@/app/components/scheduler/DayScheduleCard';

const daysOfWeek = [
  'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'
];

export default function WeeklyScheduler() {
  const [schedule, setSchedule] = useState(() =>
    daysOfWeek.reduce((acc, day) => {
      acc[day] = [];
      return acc;
    }, {})
  );
  const [schedulerEnabled, setSchedulerEnabled] = useState(false);
  const [semiManualMode, setSemiManualModeState] = useState(false);
  const [returnToAutoAt, setReturnToAutoAt] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getWeeklySchedule();
      const filledData = daysOfWeek.reduce((acc, day) => {
        acc[day] = data[day] || [];
        return acc;
      }, {});
      setSchedule(filledData);

      const mode = await getFullSchedulerMode();
      setSchedulerEnabled(mode.enabled);
      setSemiManualModeState(mode.semiManual || false);
      setReturnToAutoAt(mode.returnToAutoAt || null);
    };
    fetchData();
  }, []);

  const addTimeRange = async (day) => {
    const daySchedule = schedule[day];
    const lastEnd = daySchedule.length ? daySchedule[daySchedule.length - 1].end : '00:00';
    if (lastEnd >= '23:59') return;

    const newStart = lastEnd;
    const newEnd = incrementTime(lastEnd, 30);
    const newRange = { start: newStart, end: newEnd, power: 2, fan: 3 };

    const updatedSchedule = {
      ...schedule,
      [day]: [...daySchedule, newRange],
    };
    setSchedule(updatedSchedule);
    await saveSchedule(day, updatedSchedule[day]);
    await logSchedulerAction.addInterval(day);
  };

  const incrementTime = (time, minutesToAdd) => {
    const [h, m] = time.split(':').map(Number);
    const total = h * 60 + m + minutesToAdd;
    const newH = String(Math.floor(total / 60)).padStart(2, '0');
    const newM = String(total % 60).padStart(2, '0');
    return `${newH}:${newM}`;
  };

  const isValidRange = (start, end) => {
    return start < end;
  };

  const handleChange = async (day, index, field, value) => {
    const updated = [...schedule[day]];
    updated[index][field] = value;

    const { start, end } = updated[index];
    if (field === 'start' || field === 'end') {
      if (!isValidRange(start, end)) {
        alert('L\'orario di fine deve essere successivo all\'orario di inizio.');
        return;
      }
    }

    const updatedSchedule = { ...schedule, [day]: updated };
    setSchedule(updatedSchedule);
    await saveSchedule(day, updated);
    await logSchedulerAction.updateSchedule(day);

    // Se siamo in semi-manuale, aggiorna il returnToAutoAt
    if (semiManualMode) {
      const nextChange = await getNextScheduledChange();
      if (nextChange) {
        await setSemiManualMode(nextChange);
        setReturnToAutoAt(nextChange);
      }
    }
  };

  const toggleSchedulerMode = async () => {
    const newMode = !schedulerEnabled;
    setSchedulerEnabled(newMode);
    await setSchedulerMode(newMode);
    await logSchedulerAction.toggleMode(newMode);

    // Reset semi-manual quando si cambia modalità manualmente
    if (semiManualMode) {
      await clearSemiManualMode();
      await logSchedulerAction.clearSemiManual();
      setSemiManualModeState(false);
      setReturnToAutoAt(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Card */}
      <Card className="p-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-6">Pianificazione Settimanale</h1>

        {/* Status e toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl bg-neutral-50">
          <ModeIndicator
            enabled={schedulerEnabled}
            semiManual={semiManualMode}
            returnToAutoAt={returnToAutoAt}
            showConfigButton={false}
          />

          <Button
            variant={schedulerEnabled ? 'danger' : 'success'}
            onClick={toggleSchedulerMode}
            className="w-full sm:w-auto"
          >
            {schedulerEnabled ? 'Disattiva Scheduler' : 'Attiva Scheduler'}
          </Button>
        </div>
      </Card>

      {/* Days Cards */}
      {daysOfWeek.map((day) => (
        <DayScheduleCard
          key={day}
          day={day}
          intervals={schedule[day]}
          onAddInterval={() => addTimeRange(day)}
          onRemoveInterval={async (index) => {
            const updated = schedule[day].filter((_, i) => i !== index);
            const updatedSchedule = { ...schedule, [day]: updated };
            setSchedule(updatedSchedule);
            await saveSchedule(day, updated);
            await logSchedulerAction.removeInterval(day, index);
          }}
          onChangeInterval={(index, field, value) => handleChange(day, index, field, value)}
        />
      ))}
    </div>
  );
}
