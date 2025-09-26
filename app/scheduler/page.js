'use client';

import { useState, useEffect } from 'react';
import { saveSchedule, getWeeklySchedule, setSchedulerMode, getSchedulerMode } from '@/lib/schedulerService';

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

  useEffect(() => {
    const fetchData = async () => {
      const data = await getWeeklySchedule();
      const filledData = daysOfWeek.reduce((acc, day) => {
        acc[day] = data[day] || [];
        return acc;
      }, {});
      setSchedule(filledData);

      const mode = await getSchedulerMode();
      setSchedulerEnabled(mode);
    };
    fetchData();
  }, []);

  const addTimeRange = (day) => {
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
    saveSchedule(day, updatedSchedule[day]);
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

  const handleChange = (day, index, field, value) => {
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
    saveSchedule(day, updated);
  };

  const toggleSchedulerMode = async () => {
    const newMode = !schedulerEnabled;
    setSchedulerEnabled(newMode);
    await setSchedulerMode(newMode);
  };

  const TimeBar = ({ intervals }) => {
    const totalMinutes = 24 * 60;

    return (
      <div className="relative w-full mb-8">
        {/* Barra base */}
        <div className="relative h-6 sm:h-4 w-full bg-gray-200 rounded overflow-hidden">
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
                className="absolute top-0 bottom-0 bg-green-500 rounded-sm"
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
                    className="absolute -top-6 text-xs sm:text-[10px] text-gray-600 font-mono bg-white px-1 rounded"
                    style={{ left: `${startLeft}%`, transform: 'translateX(-50%)' }}
                  >
                    {range.start}
                  </span>
                  <span
                    className="absolute top-7 text-xs sm:text-[10px] text-gray-600 font-mono bg-white px-1 rounded"
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
        <div className="relative w-full mt-2">
          {[0, 6, 12, 18, 24].map(hour => (
            <span
              key={hour}
              className="absolute text-xs text-gray-400 font-mono"
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
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      {/* Header mobile-first */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold mb-4">Scheduler Settimanale Stufa</h1>

        {/* Status e toggle - stack su mobile, inline su desktop */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center justify-center sm:justify-start">
            <span className="text-sm font-medium mr-2">Modalità:</span>
            <div className="flex items-center gap-2">
              <span className={`text-lg ${schedulerEnabled ? 'text-green-600' : 'text-orange-600'}`}>
                {schedulerEnabled ? '⏰' : '🔧'}
              </span>
              <span className={`font-semibold ${schedulerEnabled ? 'text-green-600' : 'text-orange-600'}`}>
                {schedulerEnabled ? 'Automatica' : 'Manuale'}
              </span>
            </div>
          </div>

          <button
            onClick={toggleSchedulerMode}
            className={`w-full sm:w-auto px-6 py-3 sm:px-4 sm:py-2 rounded-lg text-white font-medium transition-colors text-center ${
              schedulerEnabled
                ? 'bg-red-600 hover:bg-red-700 active:bg-red-800'
                : 'bg-green-600 hover:bg-green-700 active:bg-green-800'
            }`}
          >
            {schedulerEnabled ? 'Disattiva Scheduler' : 'Attiva Scheduler'}
          </button>
        </div>
      </div>
      {daysOfWeek.map((day) => (
        <div key={day} className="mb-8 bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800">{day}</h2>
            <span className="text-sm text-gray-500">
              {schedule[day].length} {schedule[day].length === 1 ? 'intervallo' : 'intervalli'}
            </span>
          </div>

          <TimeBar intervals={schedule[day]} />

          <div className="space-y-4">
            {schedule[day].map((range, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                {/* Layout mobile: stack verticalmente */}
                <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                  {/* Orari */}
                  <div className="flex items-center gap-2 flex-1">
                    <label className="text-sm font-medium text-gray-600 min-w-12">Dalle:</label>
                    <input
                      type="time"
                      value={range.start}
                      onChange={(e) => handleChange(day, index, 'start', e.target.value)}
                      className="flex-1 border border-gray-300 p-3 sm:p-2 rounded-lg text-base sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex items-center gap-2 flex-1">
                    <label className="text-sm font-medium text-gray-600 min-w-12">Alle:</label>
                    <input
                      type="time"
                      value={range.end}
                      onChange={(e) => handleChange(day, index, 'end', e.target.value)}
                      className="flex-1 border border-gray-300 p-3 sm:p-2 rounded-lg text-base sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Controlli Power e Fan */}
                  <div className="flex gap-2 sm:gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Potenza</label>
                      <select
                        value={range.power}
                        onChange={(e) => handleChange(day, index, 'power', Number(e.target.value))}
                        className="w-full border border-gray-300 p-3 sm:p-2 rounded-lg text-base sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      >
                        {[0, 1, 2, 3, 4, 5].map(p => (
                          <option key={p} value={p}>P{p}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Ventola</label>
                      <select
                        value={range.fan}
                        onChange={(e) => handleChange(day, index, 'fan', Number(e.target.value))}
                        className="w-full border border-gray-300 p-3 sm:p-2 rounded-lg text-base sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      >
                        {[1, 2, 3, 4, 5, 6].map(f => (
                          <option key={f} value={f}>F{f}</option>
                        ))}
                      </select>
                    </div>

                    {/* Pulsante rimuovi */}
                    <div className="flex items-end">
                      <button
                        onClick={() => {
                          const updated = schedule[day].filter((_, i) => i !== index);
                          const updatedSchedule = { ...schedule, [day]: updated };
                          setSchedule(updatedSchedule);
                          saveSchedule(day, updated);
                        }}
                        className="p-3 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Rimuovi intervallo"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => addTimeRange(day)}
            className="mt-4 w-full sm:w-auto px-4 py-3 sm:py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <span className="text-lg">+</span>
            Aggiungi intervallo
          </button>
        </div>
      ))}
    </div>
  );
}
