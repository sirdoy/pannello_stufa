'use client';

import { useState, useEffect, useMemo } from 'react';
import { saveSchedule, getWeeklySchedule } from '@/lib/schedulerService';

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

  useEffect(() => {
    const fetchData = async () => {
      const data = await getWeeklySchedule();
      const filledData = daysOfWeek.reduce((acc, day) => {
        acc[day] = data[day] || [];
        return acc;
      }, {});
      setSchedule(filledData);
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


  const TimeBar = ({ intervals }) => {
    const totalMinutes = 24 * 60;
    return (
      <div className="relative h-4 w-full bg-gray-200 rounded overflow-hidden mb-3">
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
              className="absolute top-0 bottom-0 bg-green-500"
              style={{ left: `${left}%`, width: `${width}%` }}
              title={`Accesa: ${range.start} - ${range.end}`}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Scheduler Settimanale Stufa</h1>
      {daysOfWeek.map((day) => (
        <div key={day} className="mb-8">
          <h2 className="text-lg font-semibold mb-2">{day}</h2>
          <TimeBar intervals={schedule[day]} />
          <div className="space-y-2">
            {schedule[day].map((range, index) => (
              <div key={index} className="flex gap-2 items-center">
                <input
                  type="time"
                  value={range.start}
                  onChange={(e) => handleChange(day, index, 'start', e.target.value)}
                  className="border p-1 rounded"
                />
                <span className="mx-1">→</span>
                <input
                  type="time"
                  value={range.end}
                  onChange={(e) => handleChange(day, index, 'end', e.target.value)}
                  className="border p-1 rounded"
                />
                <select
                  value={range.power}
                  onChange={(e) => handleChange(day, index, 'power', Number(e.target.value))}
                  className="border p-1 rounded"
                >
                  {[0, 1, 2, 3, 4, 5].map(p => <option key={p} value={p}>Power {p}</option>)}
                </select>
                <select
                  value={range.fan}
                  onChange={(e) => handleChange(day, index, 'fan', Number(e.target.value))}
                  className="border p-1 rounded"
                >
                  {[1, 2, 3, 4, 5, 6].map(f => <option key={f} value={f}>Fan {f}</option>)}
                </select>
              </div>
            ))}
          </div>
          <button
            onClick={() => addTimeRange(day)}
            className="mt-2 text-blue-600 hover:underline"
          >
            + Aggiungi intervallo
          </button>
        </div>
      ))}
    </div>
  );
}
