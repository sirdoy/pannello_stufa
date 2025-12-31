'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Edit2, Trash2, X } from 'lucide-react';
import { POWER_LABELS, FAN_LABELS } from '@/lib/schedulerStats';

export default function IntervalBottomSheet({
  range,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}) {
  const [mounted, setMounted] = useState(false);

  // Assicura che il componente sia montato (client-side only)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Blocca scroll del body quando bottom sheet è aperto
  useEffect(() => {
    if (isOpen) {
      // Salva scroll position attuale
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      return () => {
        // Ripristina scroll position
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  if (!isOpen || !range || !mounted) return null;

  // Calcola durata intervallo
  const getDuration = () => {
    const [startH, startM] = range.start.split(':').map(Number);
    const [endH, endM] = range.end.split(':').map(Number);
    const durationMin = endH * 60 + endM - (startH * 60 + startM);
    const hours = Math.floor(durationMin / 60);
    const minutes = durationMin % 60;
    return hours > 0
      ? `${hours}h${minutes > 0 ? ` ${minutes}min` : ''}`
      : `${minutes}min`;
  };

  const powerLabel = POWER_LABELS[range.power];
  const fanLabel = FAN_LABELS[range.fan];

  // Renderizza usando portal per posizionamento corretto al viewport
  return createPortal(
    <>
      {/* Overlay backdrop */}
      <div
        className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm z-[8999] animate-fadeIn"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Bottom Sheet */}
      <div
        className="fixed inset-x-0 bottom-0 z-[9000] animate-slide-in-from-bottom"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bottom-sheet-title"
      >
        {/* Sheet Content */}
        <div className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-3xl rounded-t-3xl shadow-liquid-lg border-t border-neutral-300/50 dark:border-neutral-700/50 p-6">
          {/* Handle Bar (drag indicator) */}
          <div className="w-12 h-1.5 bg-neutral-400/50 dark:bg-neutral-600/50 rounded-full mx-auto mb-6" />

          {/* Header: Time + Close Button */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <div
                id="bottom-sheet-title"
                className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2"
              >
                <span className="text-2xl">⏰</span>
                {range.start} - {range.end}
              </div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                {getDuration()}
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-neutral-200/50 dark:bg-neutral-800/50 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-300/50 dark:hover:bg-neutral-700/50 transition-all duration-200 backdrop-blur-sm"
              aria-label="Chiudi"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Potenza */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚡</span>
                <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                  Potenza
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400">
                  P{range.power}
                </span>
                <span className="text-sm font-medium text-neutral-900 dark:text-white">
                  {powerLabel.text}
                </span>
              </div>
            </div>
            <div className="relative h-3 bg-neutral-200/50 dark:bg-neutral-800/50 rounded-full overflow-hidden backdrop-blur-sm">
              <div
                className={`absolute inset-y-0 left-0 bg-gradient-to-r ${powerLabel.gradient} rounded-full transition-all duration-500 shadow-md`}
                style={{ width: `${powerLabel.percent}%` }}
              />
            </div>
          </div>

          {/* Ventola */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">💨</span>
                <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                  Ventola
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400">
                  V{range.fan}
                </span>
                <span className="text-sm font-medium text-neutral-900 dark:text-white">
                  {fanLabel.text}
                </span>
              </div>
            </div>
            <div className="relative h-3 bg-neutral-200/50 dark:bg-neutral-800/50 rounded-full overflow-hidden backdrop-blur-sm">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 rounded-full transition-all duration-500 shadow-md"
                style={{ width: `${fanLabel.percent}%` }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onEdit}
              className="flex-1 min-h-[44px] py-3 px-4 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 dark:hover:bg-blue-500/30 transition-all duration-200 backdrop-blur-sm ring-1 ring-blue-500/30 dark:ring-blue-500/40 font-semibold flex items-center justify-center gap-2"
              aria-label="Modifica intervallo"
            >
              <Edit2 className="w-5 h-5" />
              Modifica
            </button>

            <button
              onClick={onDelete}
              className="flex-1 min-h-[44px] py-3 px-4 rounded-2xl bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/20 dark:hover:bg-red-500/30 transition-all duration-200 backdrop-blur-sm ring-1 ring-red-500/30 dark:ring-red-500/40 font-semibold flex items-center justify-center gap-2"
              aria-label="Rimuovi intervallo"
            >
              <Trash2 className="w-5 h-5" />
              Elimina
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
