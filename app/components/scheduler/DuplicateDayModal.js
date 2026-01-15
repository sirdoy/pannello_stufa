'use client';

import { useState, useEffect } from 'react';
import Button from '../ui/Button';
import ActionButton from '../ui/ActionButton';
import { X } from 'lucide-react';

const daysOfWeek = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];

export default function DuplicateDayModal({ isOpen, sourceDay, excludeDays = [], onConfirm, onCancel }) {
  const [selectedDays, setSelectedDays] = useState([]);

  // Reset selected days when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedDays([]);
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const availableDays = daysOfWeek.filter(day => !excludeDays.includes(day));

  const toggleDay = (day) => {
    setSelectedDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const selectWeekdays = () => {
    const weekdays = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì'];
    setSelectedDays(weekdays.filter(day => availableDays.includes(day)));
  };

  const selectWeekend = () => {
    const weekend = ['Sabato', 'Domenica'];
    setSelectedDays(weekend.filter(day => availableDays.includes(day)));
  };

  const selectAll = () => {
    setSelectedDays([...availableDays]);
  };

  const handleConfirm = () => {
    if (selectedDays.length > 0) {
      onConfirm(selectedDays);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 [html:not(.dark)_&]:bg-black/70 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white/90 [html:not(.dark)_&]:bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-white/20 [html:not(.dark)_&]:border-white/10 shadow-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-900 [html:not(.dark)_&]:text-white">
            Duplica {sourceDay}
          </h2>
          <ActionButton
            icon={<X />}
            variant="close"
            size="md"
            onClick={onCancel}
            ariaLabel="Chiudi"
          />
        </div>

        {/* Description */}
        <p className="text-sm text-slate-600 [html:not(.dark)_&]:text-slate-400 mb-4">
          Seleziona i giorni su cui duplicare la pianificazione di {sourceDay}
        </p>

        {/* Quick Actions */}
        <div className="flex gap-2 mb-4">
          <Button
            liquid
            variant="secondary"
            size="sm"
            onClick={selectWeekdays}
            className="flex-1"
          >
            Giorni feriali
          </Button>
          <Button
            liquid
            variant="secondary"
            size="sm"
            onClick={selectWeekend}
            className="flex-1"
          >
            Weekend
          </Button>
          <Button
            liquid
            variant="secondary"
            size="sm"
            onClick={selectAll}
            className="flex-1"
          >
            Tutti
          </Button>
        </div>

        {/* Day Selection */}
        <div className="space-y-2 mb-6 max-h-[300px] overflow-y-auto">
          {availableDays.map(day => (
            <label
              key={day}
              className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 [html:not(.dark)_&]:bg-white/[0.03] hover:bg-slate-100 [html:not(.dark)_&]:hover:bg-white/[0.05] cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedDays.includes(day)}
                onChange={() => toggleDay(day)}
                className="w-5 h-5 rounded border-slate-300 [html:not(.dark)_&]:border-white/20 text-ocean-500 focus:ring-2 focus:ring-ocean-500"
              />
              <span className="text-slate-900 [html:not(.dark)_&]:text-white font-medium">
                {day}
              </span>
              {selectedDays.includes(day) && (
                <span className="ml-auto text-ocean-500 [html:not(.dark)_&]:text-ocean-400">✓</span>
              )}
            </label>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            liquid
            variant="secondary"
            onClick={onCancel}
            className="flex-1"
          >
            Annulla
          </Button>
          <Button
            liquid
            variant="primary"
            onClick={handleConfirm}
            disabled={selectedDays.length === 0}
            className="flex-1"
          >
            Duplica {selectedDays.length > 0 && `su ${selectedDays.length} ${selectedDays.length === 1 ? 'giorno' : 'giorni'}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
