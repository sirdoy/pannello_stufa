'use client';

import { useState, useEffect } from 'react';
import { saveSchedule, getWeeklySchedule, setSchedulerMode, getFullSchedulerMode, clearSemiManualMode, getNextScheduledChange, setSemiManualMode } from '@/lib/schedulerService';
import { logSchedulerAction } from '@/lib/logService';

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

  const TimeBar = ({ intervals }) => {
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
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Card */}
      <div className="card p-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-6">Pianificazione Settimanale</h1>

        {/* Status e toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl bg-neutral-50">
          <div className="flex items-center gap-3">
            <span className={`text-3xl ${
              schedulerEnabled && semiManualMode ? 'text-warning-500' :
              schedulerEnabled ? 'text-success-600' : 'text-accent-600'
            }`}>
              {schedulerEnabled && semiManualMode ? '⚙️' : schedulerEnabled ? '⏰' : '🔧'}
            </span>
            <div>
              <p className={`text-lg font-bold ${
                schedulerEnabled && semiManualMode ? 'text-warning-600' :
                schedulerEnabled ? 'text-success-600' : 'text-accent-600'
              }`}>
                {schedulerEnabled && semiManualMode ? 'Semi-manuale' :
                 schedulerEnabled ? 'Automatica' : 'Manuale'}
              </p>
              <p className="text-sm text-neutral-500">Modalità controllo</p>
              {schedulerEnabled && semiManualMode && returnToAutoAt && (
                <p className="text-xs text-neutral-500 mt-1">
                  Ritorno automatico: {new Date(returnToAutoAt).toLocaleString('it-IT', {
                    weekday: 'short',
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={toggleSchedulerMode}
            className={`w-full sm:w-auto px-6 py-3 rounded-xl text-white font-semibold shadow-card transition-all duration-200 active:scale-95 ${
              schedulerEnabled
                ? 'bg-primary-500 hover:bg-primary-600'
                : 'bg-success-600 hover:bg-success-700'
            }`}
          >
            {schedulerEnabled ? 'Disattiva Scheduler' : 'Attiva Scheduler'}
          </button>
        </div>
      </div>

      {/* Days Cards */}
      {daysOfWeek.map((day) => (
        <div key={day} className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📅</span>
              <div>
                <h2 className="text-xl font-bold text-neutral-900">{day}</h2>
                <p className="text-sm text-neutral-500">
                  {schedule[day].length} {schedule[day].length === 1 ? 'intervallo' : 'intervalli'}
                </p>
              </div>
            </div>
          </div>

          <TimeBar intervals={schedule[day]} />

          <div className="space-y-3">
            {schedule[day].map((range, index) => (
              <div key={index} className="bg-neutral-50 rounded-xl p-4 border border-neutral-200 hover:border-neutral-300 transition-colors duration-200">
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Orari */}
                  <div className="flex flex-col sm:flex-row gap-3 flex-1">
                    <div className="flex items-center gap-2 flex-1">
                      <label className="text-sm font-semibold text-neutral-700 min-w-fit whitespace-nowrap">⏰ Dalle</label>
                      <input
                        type="time"
                        value={range.start}
                        onChange={(e) => handleChange(day, index, 'start', e.target.value)}
                        className="input-modern text-sm"
                      />
                    </div>

                    <div className="flex items-center gap-2 flex-1">
                      <label className="text-sm font-semibold text-neutral-700 min-w-fit whitespace-nowrap">⏰ Alle</label>
                      <input
                        type="time"
                        value={range.end}
                        onChange={(e) => handleChange(day, index, 'end', e.target.value)}
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
                        onChange={(e) => handleChange(day, index, 'power', Number(e.target.value))}
                        className="select-modern text-sm"
                      >
                        {[0, 1, 2, 3, 4, 5].map(p => (
                          <option key={p} value={p}>Livello {p}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex-1 min-w-[100px]">
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">💨 Ventola</label>
                      <select
                        value={range.fan}
                        onChange={(e) => handleChange(day, index, 'fan', Number(e.target.value))}
                        className="select-modern text-sm"
                      >
                        {[1, 2, 3, 4, 5, 6].map(f => (
                          <option key={f} value={f}>Livello {f}</option>
                        ))}
                      </select>
                    </div>

                    {/* Pulsante rimuovi */}
                    <button
                      onClick={async () => {
                        const updated = schedule[day].filter((_, i) => i !== index);
                        const updatedSchedule = { ...schedule, [day]: updated };
                        setSchedule(updatedSchedule);
                        await saveSchedule(day, updated);
                        await logSchedulerAction.removeInterval(day, index);
                      }}
                      className="p-3 text-xl text-primary-600 hover:bg-primary-50 rounded-xl transition-colors duration-200 border border-primary-200"
                      title="Rimuovi intervallo"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => addTimeRange(day)}
            className="mt-4 w-full px-6 py-3 bg-success-600 hover:bg-success-700 active:scale-95 text-white rounded-xl font-semibold shadow-card transition-all duration-200 flex items-center justify-center gap-2"
          >
            <span className="text-xl">+</span>
            Aggiungi intervallo
          </button>
        </div>
      ))}
    </div>
  );
}
