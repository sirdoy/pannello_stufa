'use client';

import { useState, useEffect } from 'react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { X } from 'lucide-react';
import { getPowerBadgeClass, getFanBadgeClass } from '@/lib/schedulerStats';

const DURATION_PRESETS = [
  { value: 15, label: '15 minuti' },
  { value: 30, label: '30 minuti' },
  { value: 60, label: '1 ora' },
  { value: 120, label: '2 ore' },
  { value: 'custom', label: 'Personalizzata' },
];

export default function AddIntervalModal({
  isOpen,
  day,
  suggestedStart = '00:00',
  onConfirm,
  onCancel,
}) {
  const [start, setStart] = useState(suggestedStart);
  const [durationPreset, setDurationPreset] = useState(30);
  const [customMinutes, setCustomMinutes] = useState(60);
  const [power, setPower] = useState(2);
  const [fan, setFan] = useState(3);

  // Update start when suggestedStart changes (e.g., when opening modal)
  useEffect(() => {
    if (isOpen) {
      setStart(suggestedStart);
      setDurationPreset(30);
      setCustomMinutes(60);
      setPower(2);
      setFan(3);
    }
  }, [isOpen, suggestedStart]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  // Calculate end time
  const calculateEnd = () => {
    const minutes = durationPreset === 'custom' ? customMinutes : durationPreset;
    const [h, m] = start.split(':').map(Number);
    const totalMinutes = h * 60 + m + minutes;
    const endH = String(Math.floor(totalMinutes / 60) % 24).padStart(2, '0');
    const endM = String(totalMinutes % 60).padStart(2, '0');
    return `${endH}:${endM}`;
  };

  const end = calculateEnd();

  // Validation
  const isValidInterval = () => {
    if (!start) return false;
    const minutes = durationPreset === 'custom' ? customMinutes : durationPreset;
    if (durationPreset === 'custom' && (!customMinutes || customMinutes < 15)) return false;

    // Check if end time wraps to next day (start > end means crossing midnight)
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    // Don't allow intervals that cross midnight
    if (endMinutes <= startMinutes) return false;

    return true;
  };

  const handleConfirm = () => {
    if (!isValidInterval()) return;

    const minutes = durationPreset === 'custom' ? customMinutes : durationPreset;
    onConfirm({
      start,
      duration: minutes,
      power,
      fan,
    });
  };

  const powerOptions = [1, 2, 3, 4, 5];
  const fanOptions = [1, 2, 3, 4, 5, 6];

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-sm animate-fadeIn"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-interval-title"
    >
      <Card
        liquid
        className="max-w-lg w-full p-6 animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2
            id="add-interval-title"
            className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2"
          >
            <span>➕</span>
            <span>Aggiungi Intervallo - {day}</span>
          </h2>
          <button
            onClick={onCancel}
            className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-white/[0.05] transition-colors"
            aria-label="Chiudi"
          >
            <X className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4 mb-6">
          {/* Start Time */}
          <div>
            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
              ⏰ Ora inizio
            </label>
            <input
              type="time"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-600 focus:border-transparent transition-all duration-200"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
              ⏱️ Durata
            </label>
            <select
              value={durationPreset}
              onChange={(e) => setDurationPreset(e.target.value === 'custom' ? 'custom' : Number(e.target.value))}
              className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-600 focus:border-transparent transition-all duration-200"
            >
              {DURATION_PRESETS.map(preset => (
                <option key={preset.value} value={preset.value}>
                  {preset.label}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Duration Input */}
          {durationPreset === 'custom' && (
            <div>
              <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                Minuti
              </label>
              <input
                type="number"
                min="15"
                max="1440"
                value={customMinutes}
                onChange={(e) => setCustomMinutes(Number(e.target.value))}
                className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-600 focus:border-transparent transition-all duration-200"
                placeholder="Es: 90 per 1h 30min"
              />
            </div>
          )}

          {/* End Time Preview */}
          <div className="p-4 bg-neutral-100 dark:bg-neutral-800/50 rounded-xl">
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Orario fine calcolato:</p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">{end}</p>
            {!isValidInterval() && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                ⚠️ {durationPreset === 'custom' && customMinutes < 15
                  ? 'Durata minima: 15 minuti'
                  : 'L\'intervallo non può attraversare la mezzanotte'}
              </p>
            )}
          </div>

          {/* Power & Fan */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                ⚡ Potenza
              </label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-md text-xs font-bold ${getPowerBadgeClass(power)}`}>
                    P{power}
                  </span>
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">
                    Livello {power}
                  </span>
                </div>
                <select
                  value={power}
                  onChange={(e) => setPower(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-600 focus:border-transparent transition-all duration-200"
                >
                  {powerOptions.map(p => (
                    <option key={p} value={p}>Livello {p}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                💨 Ventola
              </label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-md text-xs font-bold ${getFanBadgeClass(fan)}`}>
                    V{fan}
                  </span>
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">
                    Livello {fan}
                  </span>
                </div>
                <select
                  value={fan}
                  onChange={(e) => setFan(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-600 focus:border-transparent transition-all duration-200"
                >
                  {fanOptions.map(f => (
                    <option key={f} value={f}>Livello {f}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
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
            variant="success"
            onClick={handleConfirm}
            disabled={!isValidInterval()}
            className="flex-1"
          >
            Aggiungi Intervallo
          </Button>
        </div>
      </Card>
    </div>
  );
}
