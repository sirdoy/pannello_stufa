'use client';

import { useState, useEffect } from 'react';
import { getWeeklySchedule, getFullSchedulerMode, getNextScheduledChange } from '@/lib/schedulerService';
import { saveSchedule as apiSaveSchedule, setSchedulerMode, setSemiManualMode, clearSemiManualMode } from '@/lib/schedulerApiClient';
import {
  getAllSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  setActiveSchedule,
} from '@/lib/schedulesApiClient';
import { logSchedulerAction } from '@/lib/logService';
import { db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { Card, Button, ModeIndicator, Skeleton, Toast, ConfirmDialog, Heading, PageLayout } from '@/app/components/ui';
import WeeklyTimeline from '@/app/components/scheduler/WeeklyTimeline';
import DayEditPanel from '@/app/components/scheduler/DayEditPanel';
import WeeklySummaryCard from '@/app/components/scheduler/WeeklySummaryCard';
import DuplicateDayModal from '@/app/components/scheduler/DuplicateDayModal';
import AddIntervalModal from '@/app/components/scheduler/AddIntervalModal';
import ScheduleSelector from '@/app/components/scheduler/ScheduleSelector';
import CreateScheduleModal from '@/app/components/scheduler/CreateScheduleModal';
import ScheduleManagementModal from '@/app/components/scheduler/ScheduleManagementModal';

const daysOfWeek = [
  'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'
] as const;

type DayOfWeek = typeof daysOfWeek[number];

interface ScheduleInterval {
  start: string;
  end: string;
  power?: number;
}

type WeekSchedule = Record<DayOfWeek, ScheduleInterval[]>;

interface ConfirmDialogState {
  isOpen: boolean;
  day: DayOfWeek | null;
  intervalIndex: number | null;
}

interface DuplicateModalState {
  isOpen: boolean;
  sourceDay: DayOfWeek | null;
}

interface AddIntervalModalState {
  isOpen: boolean;
  mode: 'add' | 'edit';
  day: DayOfWeek | null;
  index: number | null;
  initialInterval: ScheduleInterval | null;
  suggestedStart: string;
}

interface ToastMessage {
  message: string;
  icon?: string;
  variant?: string;
}

interface SaveStatus {
  isSaving: boolean;
  day: DayOfWeek | null;
}

export default function WeeklyScheduler() {
  const [schedule, setSchedule] = useState<WeekSchedule>(() =>
    daysOfWeek.reduce((acc, day) => {
      acc[day] = [];
      return acc;
    }, {} as WeekSchedule)
  );
  const [schedulerEnabled, setSchedulerEnabled] = useState<boolean>(false);
  const [semiManualMode, setSemiManualModeState] = useState<boolean>(false);
  const [returnToAutoAt, setReturnToAutoAt] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    isOpen: false,
    day: null,
    intervalIndex: null,
  });
  const [duplicateModal, setDuplicateModal] = useState<DuplicateModalState>({
    isOpen: false,
    sourceDay: null,
  });
  const [addIntervalModal, setAddIntervalModal] = useState<AddIntervalModalState>({
    isOpen: false,
    mode: 'add',
    day: null,
    index: null,
    initialInterval: null,
    suggestedStart: '00:00',
  });
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [lastLocalSave, setLastLocalSave] = useState<number | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({
    isSaving: false,
    day: null,
  });
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Lunedì');

  // Multi-schedule management states
  const [schedules, setSchedules] = useState<any[]>([]);
  const [activeScheduleId, setActiveScheduleId] = useState<string>('default');
  const [loadingSchedules, setLoadingSchedules] = useState<boolean>(true);
  const [createScheduleModal, setCreateScheduleModal] = useState<boolean>(false);
  const [manageSchedulesModal, setManageSchedulesModal] = useState<boolean>(false);

  // Load all schedules on mount
  useEffect(() => {
    const loadSchedules = async () => {
      try {
        const allSchedules = await getAllSchedules();
        setSchedules(allSchedules.schedules || []);
        setActiveScheduleId(allSchedules.activeScheduleId || 'default');
      } catch (error) {
        console.error('Error loading schedules:', error);
        setToast({
          message: 'Errore caricamento pianificazioni',
          icon: '❌',
          variant: 'error',
        });
      } finally {
        setLoadingSchedules(false);
      }
    };
    loadSchedules();
  }, []);

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
    // Listen to active schedule ID changes first
    let scheduleSlotsUnsubscribe;

    const activeIdRef = ref(db, 'schedules-v2/activeScheduleId');
    const activeIdUnsubscribe = onValue(activeIdRef, async (idSnapshot) => {
      const activeId = idSnapshot.val() || 'default';

      // Unsubscribe from previous schedule if exists
      if (scheduleSlotsUnsubscribe) {
        scheduleSlotsUnsubscribe();
      }

      // Subscribe to active schedule's slots
      const scheduleSlotsRef = ref(db, `schedules-v2/schedules/${activeId}/slots`);
      scheduleSlotsUnsubscribe = onValue(scheduleSlotsRef, (slotsSnapshot) => {
        const data = slotsSnapshot.val();
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
    });

    return () => {
      activeIdUnsubscribe();
      if (scheduleSlotsUnsubscribe) {
        scheduleSlotsUnsubscribe();
      }
    };
  }, [lastLocalSave]);

  // Wrapper for saveSchedule that tracks local saves
  const saveSchedule = async (day: DayOfWeek, intervals: ScheduleInterval[]): Promise<void> => {
    setLastLocalSave(Date.now());
    await apiSaveSchedule(day, intervals);
  };

  const addTimeRange = (day: DayOfWeek): void => {
    const daySchedule = schedule[day];

    // Trova l'ultimo intervallo in ordine temporale
    const sorted = sortIntervals(daySchedule);
    const lastEnd = sorted.length ? sorted[sorted.length - 1].end : '00:00';

    // Check if day is full
    if (lastEnd >= '23:59') {
      setToast({
        message: '⏰ Giornata completa - impossibile aggiungere altri intervalli',
        icon: '⚠️',
        variant: 'warning',
      });
      return;
    }

    // Open modal with suggested start time
    setAddIntervalModal({
      isOpen: true,
      mode: 'add',
      day,
      index: null,
      initialInterval: null,
      suggestedStart: lastEnd,
    });
  };

  const handleEditIntervalRequest = (day: DayOfWeek, index: number): void => {
    const interval = schedule[day][index];
    setAddIntervalModal({
      isOpen: true,
      mode: 'edit',
      day,
      index,
      initialInterval: interval,
      suggestedStart: interval.start,
    });
  };

  const incrementTime = (time: string, minutesToAdd: number): string => {
    const [h, m] = time.split(':').map(Number);
    const total = h * 60 + m + minutesToAdd;
    const newH = String(Math.floor(total / 60) % 24).padStart(2, '0');
    const newM = String(total % 60).padStart(2, '0');
    return `${newH}:${newM}`;
  };

  const isValidRange = (start: string, end: string): boolean => {
    return start < end;
  };

  // Ordina gli intervalli per orario di inizio
  const sortIntervals = (intervals: ScheduleInterval[]): ScheduleInterval[] => {
    return [...intervals].sort((a, b) => {
      if (a.start < b.start) return -1;
      if (a.start > b.start) return 1;
      return 0;
    });
  };

  // Applica collegamento tra intervalli adiacenti e rimuove sovrapposizioni
  const applyAdjacentLinksAndRemoveOverlaps = (intervals: ScheduleInterval[], changedIndex: number, originalStart: string, originalEnd: string, field: 'start' | 'end'): ScheduleInterval[] => {
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

  const handleActivateSemiManual = async () => {
    try {
      // Calculate next scheduled change
      const nextChange = await getNextScheduledChange();

      if (!nextChange) {
        // No scheduled intervals found
        setToast({
          message: 'Nessun intervallo programmato. Configura la pianificazione prima di attivare la modalità semi-automatica.',
          icon: '⚠️',
          variant: 'warning',
        });
        return;
      }

      // Activate semi-manual mode (API also enables scheduler)
      await setSemiManualMode(nextChange);
      setSchedulerEnabled(true);
      setSemiManualModeState(true);
      setReturnToAutoAt(nextChange);

      await logSchedulerAction.toggleMode(true);

      setToast({
        message: 'Modalità Semi-Automatica attivata',
        icon: '⚙️',
        variant: 'success',
      });
    } catch (error) {
      console.error('Error activating semi-manual mode:', error);
      setToast({
        message: 'Errore nell\'attivazione della modalità semi-automatica',
        icon: '❌',
        variant: 'error',
      });
    }
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

  const handleConfirmAddInterval = async ({ start, end, duration, power, fan }) => {
    const { day, mode, index } = addIntervalModal;

    const intervalData = { start, end, power, fan };
    const daySchedule = schedule[day];
    let newSchedule;

    if (mode === 'edit') {
      // Edit mode: replace existing interval
      newSchedule = [...daySchedule];
      newSchedule[index] = intervalData;
      newSchedule = sortIntervals(newSchedule);
    } else {
      // Add mode: add new interval
      newSchedule = sortIntervals([...daySchedule, intervalData]);
    }

    const updatedSchedule = {
      ...schedule,
      [day]: newSchedule,
    };
    setSchedule(updatedSchedule);

    try {
      await saveSchedule(day, newSchedule);

      if (mode === 'edit') {
        await logSchedulerAction.updateSchedule(day);
        setToast({
          message: 'Intervallo modificato',
          icon: '✅',
          variant: 'success',
        });
      } else {
        await logSchedulerAction.addInterval(day);
        setToast({
          message: 'Intervallo aggiunto',
          icon: '✅',
          variant: 'success',
        });
      }
    } catch (error) {
      setToast({
        message: 'Errore durante il salvataggio',
        icon: '❌',
        variant: 'error',
      });
    }

    // Close modal
    setAddIntervalModal({
      isOpen: false,
      mode: 'add',
      day: null,
      index: null,
      initialInterval: null,
      suggestedStart: '00:00',
    });
  };

  const handleCancelAddInterval = () => {
    setAddIntervalModal({
      isOpen: false,
      mode: 'add',
      day: null,
      index: null,
      initialInterval: null,
      suggestedStart: '00:00',
    });
  };

  // Multi-schedule handlers
  const handleSelectSchedule = async (scheduleId) => {
    try {
      await setActiveSchedule(scheduleId);
      setActiveScheduleId(scheduleId);

      // Reload schedule data for new active schedule
      const data = await getWeeklySchedule();
      const filledData = daysOfWeek.reduce((acc, day) => {
        acc[day] = sortIntervals(data[day] || []);
        return acc;
      }, {});
      setSchedule(filledData);

      setToast({
        message: 'Pianificazione attiva cambiata',
        icon: '✅',
        variant: 'success',
      });
    } catch (error) {
      console.error('Error setting active schedule:', error);
      setToast({
        message: 'Errore cambio pianificazione',
        icon: '❌',
        variant: 'error',
      });
    }
  };

  const handleCreateSchedule = async ({ name, copyFromId }) => {
    try {
      const newSchedule = await createSchedule(name, copyFromId);

      // Reload schedules list
      const allSchedules = await getAllSchedules();
      setSchedules(allSchedules.schedules || []);

      setCreateScheduleModal(false);
      setToast({
        message: `Pianificazione "${name}" creata`,
        icon: '✨',
        variant: 'success',
      });
    } catch (error) {
      console.error('Error creating schedule:', error);
      setToast({
        message: error.message || 'Errore creazione pianificazione',
        icon: '❌',
        variant: 'error',
      });
    }
  };

  const handleRenameSchedule = async (scheduleId, newName) => {
    try {
      await updateSchedule(scheduleId, { name: newName });

      // Reload schedules list
      const allSchedules = await getAllSchedules();
      setSchedules(allSchedules.schedules || []);

      setToast({
        message: 'Nome aggiornato',
        icon: '✅',
        variant: 'success',
      });
    } catch (error) {
      console.error('Error renaming schedule:', error);
      setToast({
        message: error.message || 'Errore rinomina pianificazione',
        icon: '❌',
        variant: 'error',
      });
    }
  };

  const handleDeleteSchedule = async (scheduleId) => {
    try {
      await deleteSchedule(scheduleId);

      // Reload schedules list
      const allSchedules = await getAllSchedules();
      setSchedules(allSchedules.schedules || []);

      setToast({
        message: 'Pianificazione eliminata',
        icon: '🗑️',
        variant: 'success',
      });
    } catch (error) {
      console.error('Error deleting schedule:', error);
      setToast({
        message: error.message || 'Errore eliminazione pianificazione',
        icon: '❌',
        variant: 'error',
      });
    }
  };

  if (loading) {
    return <Skeleton.Scheduler />;
  }

  return (
    <PageLayout
      maxWidth="7xl"
      header={
        <PageLayout.Header
          title="Pianificazione Settimanale"
          description="Gestisci gli orari di accensione automatica della stufa"
        />
      }
    >
      {/* Header Row - 2 columns on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Mode and Schedule Selector */}
        <Card variant="glass" className="p-6 sm:p-8">
          {/* Schedule Selector */}
          <div className="mb-6">
            <ScheduleSelector
              schedules={schedules}
              activeScheduleId={activeScheduleId}
              onSelectSchedule={handleSelectSchedule}
              onCreateNew={() => setCreateScheduleModal(true)}
              loading={loadingSchedules}
            />
            {/* Manage Schedules Button */}
            <Button
              variant="subtle"
              onClick={() => setManageSchedulesModal(true)}
              className="w-full mt-3"
              size="sm"
              icon="⚙️"
            >
              Gestisci Pianificazioni
            </Button>
          </div>

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
                  variant="warning"
                  onClick={handleClearSemiManual}
                  className="flex-1"
                  icon="↩️"
                  size="sm"
                >
                  Torna in Automatico
                </Button>
              )}
              {!schedulerEnabled && (
                <Button
                  variant="ember"
                  onClick={handleActivateSemiManual}
                  className="flex-1"
                  icon="⚙️"
                  size="sm"
                >
                  Semi-Auto
                </Button>
              )}
              <Button
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
      <Card variant="glass" className="p-6">
        <div className="mb-4">
          <Heading level={2} size="lg">
            📅 Panoramica Settimanale
          </Heading>
        </div>
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
        onEditIntervalModal={(index) => handleEditIntervalRequest(selectedDay, index)}
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

      {/* Add/Edit Interval Modal */}
      <AddIntervalModal
        isOpen={addIntervalModal.isOpen}
        mode={addIntervalModal.mode}
        day={addIntervalModal.day}
        initialInterval={addIntervalModal.initialInterval}
        suggestedStart={addIntervalModal.suggestedStart}
        onConfirm={handleConfirmAddInterval}
        onCancel={handleCancelAddInterval}
      />

      {/* Create Schedule Modal */}
      <CreateScheduleModal
        isOpen={createScheduleModal}
        existingSchedules={schedules}
        onConfirm={handleCreateSchedule}
        onCancel={() => setCreateScheduleModal(false)}
      />

      {/* Manage Schedules Modal */}
      <ScheduleManagementModal
        isOpen={manageSchedulesModal}
        schedules={schedules}
        activeScheduleId={activeScheduleId}
        onSetActive={handleSelectSchedule}
        onRename={handleRenameSchedule}
        onDelete={handleDeleteSchedule}
        onClose={() => setManageSchedulesModal(false)}
      />

      {/* Toast Notifications */}
      {toast && (
        <Toast
          variant={toast.variant}
          open={!!toast}
          onOpenChange={(open) => !open && setToast(null)}
          duration={3000}
        >
          {toast.message}
        </Toast>
      )}
    </PageLayout>
  );
}
