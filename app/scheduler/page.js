'use client';

import { useState, useEffect } from 'react';
import { saveSchedule, getWeeklySchedule, setSchedulerMode, getFullSchedulerMode, clearSemiManualMode, getNextScheduledChange, setSemiManualMode } from '@/lib/schedulerService';
import { logSchedulerAction } from '@/lib/logService';
import Card from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import ModeIndicator from '@/app/components/ui/ModeIndicator';
import Skeleton from '@/app/components/ui/Skeleton';
import DayAccordionItem from '@/app/components/scheduler/DayAccordionItem';

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
  const [loading, setLoading] = useState(true);
  const [expandedDays, setExpandedDays] = useState(() =>
    daysOfWeek.reduce((acc, day) => {
      acc[day] = false; // Tutti collassati di default
      return acc;
    }, {})
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getWeeklySchedule();
        const filledData = daysOfWeek.reduce((acc, day) => {
          // Ordina gli intervalli caricati da Firebase
          acc[day] = sortIntervals(data[day] || []);
          return acc;
        }, {});
        setSchedule(filledData);

        const mode = await getFullSchedulerMode();
        setSchedulerEnabled(mode.enabled);
        setSemiManualModeState(mode.semiManual || false);
        setReturnToAutoAt(mode.returnToAutoAt || null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const addTimeRange = async (day) => {
    const daySchedule = schedule[day];

    // Trova l'ultimo intervallo in ordine temporale
    const sorted = sortIntervals(daySchedule);
    const lastEnd = sorted.length ? sorted[sorted.length - 1].end : '00:00';

    if (lastEnd >= '23:59') return;

    const newStart = lastEnd;
    const newEnd = incrementTime(lastEnd, 30);
    const newRange = { start: newStart, end: newEnd, power: 2, fan: 3 };

    // Aggiungi e ordina
    const newSchedule = sortIntervals([...daySchedule, newRange]);

    const updatedSchedule = {
      ...schedule,
      [day]: newSchedule,
    };
    setSchedule(updatedSchedule);
    await saveSchedule(day, newSchedule);
    await logSchedulerAction.addInterval(day);
  };

  const incrementTime = (time, minutesToAdd) => {
    const [h, m] = time.split(':').map(Number);
    const total = h * 60 + m + minutesToAdd;
    const newH = String(Math.floor(total / 60) % 24).padStart(2, '0');
    const newM = String(total % 60).padStart(2, '0');
    return `${newH}:${newM}`;
  };

  const isValidRange = (start, end) => {
    return start < end;
  };

  // Ordina gli intervalli per orario di inizio
  const sortIntervals = (intervals) => {
    return [...intervals].sort((a, b) => {
      if (a.start < b.start) return -1;
      if (a.start > b.start) return 1;
      return 0;
    });
  };

  // Applica collegamento tra intervalli adiacenti e rimuove sovrapposizioni
  const applyAdjacentLinksAndRemoveOverlaps = (intervals, changedIndex, originalStart, originalEnd, field) => {
    let result = [...intervals];
    const changedInterval = result[changedIndex];

    // 1. Collegamento bidirezionale con intervalli adiacenti
    result = result.map((interval, idx) => {
      // Non modificare l'intervallo che abbiamo cambiato
      if (idx === changedIndex) return interval;

      // Se questo intervallo terminava esattamente dove iniziava quello modificato
      // E abbiamo modificato lo start di quello cambiato
      if (field === 'start' && interval.end === originalStart) {
        return { ...interval, end: changedInterval.start };
      }

      // Se questo intervallo iniziava esattamente dove terminava quello modificato
      // E abbiamo modificato l'end di quello cambiato
      if (field === 'end' && interval.start === originalEnd) {
        return { ...interval, start: changedInterval.end };
      }

      return interval;
    });

    // 2. Rimuovi intervalli completamente sovrapposti
    result = result.filter((interval, idx) => {
      // Non rimuovere l'intervallo che abbiamo modificato
      if (idx === changedIndex) return true;

      // Rimuovi se l'intervallo è completamente contenuto in quello modificato
      const isCompletelyOverlapped =
        interval.start >= changedInterval.start &&
        interval.end <= changedInterval.end;

      return !isCompletelyOverlapped;
    });

    return result;
  };

  const handleChange = async (day, index, field, value, isBlur = false) => {
    const originalSchedule = schedule[day];
    const originalInterval = originalSchedule[index];
    const originalStart = originalInterval.start;
    const originalEnd = originalInterval.end;

    let updated = [...originalSchedule];
    updated[index] = { ...updated[index], [field]: value };

    if (isBlur) {
      // Al blur: applica tutte le validazioni e salva
      if (field === 'start' || field === 'end') {
        let { start, end } = updated[index];

        // Validazione: end deve essere > start di almeno 15 minuti
        if (end <= start) {
          end = incrementTime(start, 15);
          updated[index].end = end;
        }

        // Applica collegamento con adiacenti e rimuovi sovrapposizioni
        updated = applyAdjacentLinksAndRemoveOverlaps(
          updated,
          index,
          originalStart,
          originalEnd,
          field
        );
      }

      // Ordina gli intervalli e salva (per tutti i campi al blur)
      const sorted = sortIntervals(updated);
      const updatedSchedule = { ...schedule, [day]: sorted };
      setSchedule(updatedSchedule);

      await saveSchedule(day, sorted);
      await logSchedulerAction.updateSchedule(day);

      // Se siamo in semi-manuale, aggiorna il returnToAutoAt
      if (semiManualMode && (field === 'start' || field === 'end')) {
        const nextChange = await getNextScheduledChange();
        if (nextChange) {
          await setSemiManualMode(nextChange);
          setReturnToAutoAt(nextChange);
        }
      }
    } else {
      // Durante onChange (non blur), aggiorna solo lo stato locale senza ordinare né validare
      const updatedSchedule = { ...schedule, [day]: updated };
      setSchedule(updatedSchedule);
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

  const toggleDay = (day) => {
    setExpandedDays(prev => ({
      ...prev,
      [day]: !prev[day]
    }));
  };

  const expandAll = () => {
    setExpandedDays(daysOfWeek.reduce((acc, day) => {
      acc[day] = true;
      return acc;
    }, {}));
  };

  const collapseAll = () => {
    setExpandedDays(daysOfWeek.reduce((acc, day) => {
      acc[day] = false;
      return acc;
    }, {}));
  };

  if (loading) {
    return <Skeleton.Scheduler />;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Card */}
      <Card className="p-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-6">Pianificazione Settimanale</h1>

        {/* Status e toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl bg-neutral-50 mb-4">
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

        {/* Pulsanti Espandi/Comprimi tutto */}
        <div className="flex gap-3 justify-end">
          <Button
            variant="ghost"
            size="sm"
            icon="📂"
            onClick={expandAll}
          >
            Espandi tutto
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon="📁"
            onClick={collapseAll}
          >
            Comprimi tutto
          </Button>
        </div>
      </Card>

      {/* Days Cards */}
      {daysOfWeek.map((day) => (
        <DayAccordionItem
          key={day}
          day={day}
          intervals={schedule[day]}
          isExpanded={expandedDays[day]}
          onToggle={() => toggleDay(day)}
          onAddInterval={() => addTimeRange(day)}
          onRemoveInterval={async (index) => {
            const updated = schedule[day].filter((_, i) => i !== index);
            const updatedSchedule = { ...schedule, [day]: updated };
            setSchedule(updatedSchedule);
            await saveSchedule(day, updated);
            await logSchedulerAction.removeInterval(day, index);
          }}
          onChangeInterval={(index, field, value, isBlur) => handleChange(day, index, field, value, isBlur)}
        />
      ))}
    </div>
  );
}
