'use client';

import { useState, useEffect } from 'react';
import { getWeeklySchedule, getFullSchedulerMode, getNextScheduledChange } from '@/lib/schedulerService';
import { saveSchedule as apiSaveSchedule, setSchedulerMode, setSemiManualMode, clearSemiManualMode } from '@/lib/schedulerApiClient';
import { logSchedulerAction } from '@/lib/logService';
import { db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import Card from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import ModeIndicator from '@/app/components/ui/ModeIndicator';
import Skeleton from '@/app/components/ui/Skeleton';
import Toast from '@/app/components/ui/Toast';
import ConfirmDialog from '@/app/components/ui/ConfirmDialog';
import WeeklyTimeline from '@/app/components/scheduler/WeeklyTimeline';
import DayEditPanel from '@/app/components/scheduler/DayEditPanel';
import WeeklySummaryCard from '@/app/components/scheduler/WeeklySummaryCard';
import DuplicateDayModal from '@/app/components/scheduler/DuplicateDayModal';

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
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    day: null,
    intervalIndex: null,
  });
  const [duplicateModal, setDuplicateModal] = useState({
    isOpen: false,
    sourceDay: null,
  });
  const [toast, setToast] = useState(null);
  const [lastLocalSave, setLastLocalSave] = useState(null);
  const [saveStatus, setSaveStatus] = useState({
    isSaving: false,
    day: null,
  });
  const [selectedDay, setSelectedDay] = useState('Lunedì'); // Selected day for edit panel

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

        // Auto-select first day with intervals ONLY on initial load
        const firstDayWithIntervals = daysOfWeek.find(day => filledData[day] && filledData[day].length > 0);
        if (firstDayWithIntervals) {
          setSelectedDay(firstDayWithIntervals);
        }

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

  // Feature 1: Real-Time Firebase Sync - Listen for remote changes
  useEffect(() => {
    const schedulerRef = ref(db, 'stoveScheduler');

    const unsubscribe = onValue(schedulerRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      // Check if update is from another device (within 2s window)
      const now = Date.now();
      const isLocalUpdate = lastLocalSave && (now - lastLocalSave < 2000);

      if (!isLocalUpdate) {
        console.log('[Scheduler] Aggiornamento remoto ricevuto');

        // Update local state with remote data
        const remoteSchedule = daysOfWeek.reduce((acc, day) => {
          acc[day] = sortIntervals(data[day] || []);
          return acc;
        }, {});

        setSchedule(remoteSchedule);

        // Show toast notification
        setToast({
          message: 'Pianificazione aggiornata da altro dispositivo',
          icon: '🔄',
          variant: 'info',
        });
      }
    });

    return () => unsubscribe();
  }, [lastLocalSave]);

  // Wrapper for saveSchedule that tracks local saves
  const saveSchedule = async (day, intervals) => {
    setLastLocalSave(Date.now());
    await apiSaveSchedule(day, intervals);
  };

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

    try {
      await saveSchedule(day, newSchedule);
      await logSchedulerAction.addInterval(day);

      // Feature 2: Toast notification
      setToast({
        message: 'Intervallo aggiunto',
        icon: '✅',
        variant: 'success',
      });
    } catch (error) {
      setToast({
        message: 'Errore durante il salvataggio',
        icon: '❌',
        variant: 'error',
      });
    }
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
      // Feature 4: Show saving indicator
      setSaveStatus({ isSaving: true, day });

      try {
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

        // Feature 2: Toast notification
        setToast({
          message: 'Intervallo aggiornato',
          icon: '💾',
          variant: 'success',
        });

        // Feature 4: Show success briefly
        setSaveStatus({ isSaving: false, day });
        setTimeout(() => {
          setSaveStatus({ isSaving: false, day: null });
        }, 1000);

        // Se siamo in semi-manuale, aggiorna il returnToAutoAt
        if (semiManualMode && (field === 'start' || field === 'end')) {
          const nextChange = await getNextScheduledChange();
          if (nextChange) {
            await setSemiManualMode(nextChange);
            setReturnToAutoAt(nextChange);
          }
        }
      } catch (error) {
        setSaveStatus({ isSaving: false, day: null });
        setToast({
          message: 'Errore durante il salvataggio',
          icon: '❌',
          variant: 'error',
        });
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

    // Feature 2: Toast notification
    setToast({
      message: `Modalità cambiata in ${newMode ? 'Automatico' : 'Manuale'}`,
      icon: newMode ? '⏰' : '🔧',
      variant: 'success',
    });

    // Reset semi-manual quando si cambia modalità manualmente
    if (semiManualMode) {
      await clearSemiManualMode();
      await logSchedulerAction.clearSemiManual();
      setSemiManualModeState(false);
      setReturnToAutoAt(null);
    }
  };

  const handleClearSemiManual = async () => {
    await clearSemiManualMode();
    await logSchedulerAction.clearSemiManual();
    setSemiManualModeState(false);
    setReturnToAutoAt(null);

    // Feature 2: Toast notification
    setToast({
      message: 'Ritorno in modalità Automatico',
      icon: '↩️',
      variant: 'success',
    });
  };

  const handleRemoveIntervalRequest = (day, index) => {
    setConfirmDialog({
      isOpen: true,
      day,
      intervalIndex: index,
    });
  };

  const handleConfirmRemoveInterval = async () => {
    const { day, intervalIndex } = confirmDialog;
    const updated = schedule[day].filter((_, i) => i !== intervalIndex);
    const updatedSchedule = { ...schedule, [day]: updated };
    setSchedule(updatedSchedule);

    try {
      await saveSchedule(day, updated);
      await logSchedulerAction.removeInterval(day, intervalIndex);

      // Feature 2: Toast notification
      setToast({
        message: 'Intervallo eliminato',
        icon: '🗑️',
        variant: 'success',
      });
    } catch (error) {
      setToast({
        message: 'Errore durante l\'eliminazione',
        icon: '❌',
        variant: 'error',
      });
    }

    setConfirmDialog({ isOpen: false, day: null, intervalIndex: null });
  };

  const handleCancelRemoveInterval = () => {
    setConfirmDialog({ isOpen: false, day: null, intervalIndex: null });
  };

  const handleDuplicateDay = (sourceDay) => {
    setDuplicateModal({
      isOpen: true,
      sourceDay,
    });
  };

  const handleConfirmDuplicate = async (targetDays) => {
    const { sourceDay } = duplicateModal;
    const sourceIntervals = schedule[sourceDay];

    if (!sourceIntervals || sourceIntervals.length === 0) {
      setDuplicateModal({ isOpen: false, sourceDay: null });
      return;
    }

    try {
      // Duplicate to all selected days
      const updatedSchedule = { ...schedule };

      for (const targetDay of targetDays) {
        // Deep copy intervals to avoid reference issues
        const duplicatedIntervals = sourceIntervals.map(interval => ({ ...interval }));
        updatedSchedule[targetDay] = sortIntervals(duplicatedIntervals);

        // Save each day to Firebase
        await saveSchedule(targetDay, duplicatedIntervals);
        await logSchedulerAction.duplicateDay(sourceDay, targetDay);
      }

      // Update local state
      setSchedule(updatedSchedule);

      // Show success toast
      setToast({
        message: `Pianificazione duplicata su ${targetDays.length} ${targetDays.length === 1 ? 'giorno' : 'giorni'}`,
        icon: '📋',
        variant: 'success',
      });
    } catch (error) {
      setToast({
        message: 'Errore durante la duplicazione',
        icon: '❌',
        variant: 'error',
      });
    }

    setDuplicateModal({ isOpen: false, sourceDay: null });
  };

  const handleCancelDuplicate = () => {
    setDuplicateModal({ isOpen: false, sourceDay: null });
  };

  if (loading) {
    return <Skeleton.Scheduler />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Row - 2 columns on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Title + Mode */}
        <Card liquid className="p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white mb-6">
            Pianificazione Settimanale
          </h1>

          {/* Mode indicator and controls */}
          <div className="flex flex-col gap-4">
            <ModeIndicator
              enabled={schedulerEnabled}
              semiManual={semiManualMode}
              returnToAutoAt={returnToAutoAt}
              showConfigButton={false}
            />

            <div className="flex gap-3">
              {schedulerEnabled && semiManualMode && (
                <Button
                  liquid
                  variant="warning"
                  onClick={handleClearSemiManual}
                  className="flex-1"
                  icon="↩️"
                  size="sm"
                >
                  Torna in Automatico
                </Button>
              )}
              <Button
                liquid
                variant={schedulerEnabled ? 'danger' : 'success'}
                onClick={toggleSchedulerMode}
                className="flex-1"
                size="sm"
              >
                {schedulerEnabled ? 'Disattiva' : 'Attiva'}
              </Button>
            </div>
          </div>
        </Card>

        {/* Right: Weekly Stats */}
        <WeeklySummaryCard schedule={schedule} />
      </div>

      {/* Weekly Timeline - Always Visible */}
      <Card liquid className="p-6">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
          📅 Panoramica Settimanale
        </h2>
        <WeeklyTimeline
          schedule={schedule}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
        />
      </Card>

      {/* Day Edit Panel - Shows selected day */}
      <DayEditPanel
        day={selectedDay}
        intervals={schedule[selectedDay] || []}
        onAddInterval={() => addTimeRange(selectedDay)}
        onEditInterval={(index, field, value, isBlur) => handleChange(selectedDay, index, field, value, isBlur)}
        onDeleteInterval={(index) => handleRemoveIntervalRequest(selectedDay, index)}
        onDuplicate={handleDuplicateDay}
        saveStatus={saveStatus.day === selectedDay ? saveStatus : null}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Elimina intervallo"
        message="Sei sicuro di voler eliminare questo intervallo? L'azione non può essere annullata."
        confirmText="Elimina"
        cancelText="Annulla"
        confirmVariant="danger"
        icon="🗑️"
        onConfirm={handleConfirmRemoveInterval}
        onCancel={handleCancelRemoveInterval}
      />

      {/* Duplicate Day Modal */}
      <DuplicateDayModal
        isOpen={duplicateModal.isOpen}
        sourceDay={duplicateModal.sourceDay}
        excludeDays={[duplicateModal.sourceDay]}
        onConfirm={handleConfirmDuplicate}
        onCancel={handleCancelDuplicate}
      />

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          icon={toast.icon}
          variant={toast.variant}
          duration={3000}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  );
}
