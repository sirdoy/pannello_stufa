'use client';

import { useState, useRef, useEffect } from 'react';
import Button from '../ui/Button';
import Text from '../ui/Text';

/**
 * ScheduleSelector Component
 *
 * Dropdown selector for managing multiple schedules.
 * Shows all available schedules with active indicator and management options.
 *
 * @param {Object} props
 * @param {Array} props.schedules - Array of schedule objects {id, name, enabled, isActive}
 * @param {string} props.activeScheduleId - ID of currently active schedule
 * @param {Function} props.onSelectSchedule - Callback when schedule is selected
 * @param {Function} props.onCreateNew - Callback to create new schedule
 * @param {boolean} props.loading - Loading state
 */
export default function ScheduleSelector({
  schedules = [],
  activeScheduleId,
  onSelectSchedule,
  onCreateNew,
  loading = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const activeSchedule = schedules.find(s => s.id === activeScheduleId);
  const otherSchedules = schedules.filter(s => s.id !== activeScheduleId);
  const hasSchedules = schedules.length > 0;

  const handleSelect = (scheduleId) => {
    onSelectSchedule(scheduleId);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selector Button - Enhanced iOS 18 Liquid Glass */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className="
          w-full min-h-[56px] px-4 py-3
          bg-white/[0.12] [html:not(.dark)_&]:bg-white/[0.08]
          backdrop-blur-3xl backdrop-saturate-[1.6] backdrop-brightness-[1.05]
          rounded-2xl shadow-liquid-sm
          isolation-isolate
          hover:bg-white/[0.18] [html:not(.dark)_&]:hover:bg-white/[0.12]
          hover:shadow-liquid
          hover:scale-[1.01]
          active:scale-[0.99]
          transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
          flex items-center justify-between gap-3
          relative
          before:absolute before:inset-0 before:rounded-[inherit]
          before:bg-gradient-to-br before:from-white/[0.15] [html:not(.dark)_&]:before:from-white/[0.10]
          before:to-transparent
          before:pointer-events-none before:z-[-1]
          after:absolute after:inset-0 after:rounded-[inherit]
          after:shadow-[inset_0_1px_0_rgba(255,255,255,0.2),inset_0_-1px_0_rgba(0,0,0,0.05)]
          [html:not(.dark)_&]:after:shadow-[inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-1px_0_rgba(0,0,0,0.15)]
          after:pointer-events-none after:z-[-1]
        "
      >
        {/* Left: Active Schedule Info */}
        <div className="flex items-center gap-3 flex-1 text-left">
          <div className="w-2 h-2 rounded-full bg-sage-500 shadow-sage-glow-sm animate-pulse" />
          <div className="flex-1 min-w-0">
            <Text variant="tertiary" size="xs" weight="medium">
              Pianificazione Attiva
            </Text>
            <Text weight="semibold" className="truncate">
              {loading ? 'Caricamento...' : activeSchedule?.name || 'Nessuna'}
            </Text>
          </div>
        </div>

        {/* Right: Dropdown Icon */}
        <svg
          className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} [html:not(.dark)_&]:text-slate-500`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu - Enhanced iOS 18 Liquid Glass */}
      {isOpen && (
        <div className="
          absolute z-50 w-full mt-2
          bg-white/[0.15] [html:not(.dark)_&]:bg-white/[0.10]
          backdrop-blur-4xl backdrop-saturate-[1.8] backdrop-brightness-[1.05]
          rounded-2xl shadow-liquid-lg
          isolation-isolate
          overflow-hidden animate-scale-in origin-top
        ">
          {!hasSchedules ? (
            /* No Schedules - Migration Required */
            <div className="p-4">
              <div className="text-center py-4">
                <div className="text-3xl mb-3">📅</div>
                <Text weight="semibold" size="sm" variant="secondary" className="mb-2">
                  Nessuna pianificazione trovata
                </Text>
                <Text variant="secondary" size="xs" className="mb-4">
                  Esegui la migrazione per creare la struttura v2
                </Text>
                <div className="bg-slate-700/40 rounded-xl p-3 text-left [html:not(.dark)_&]:bg-slate-100/60">
                  <Text as="code" size="xs" className="block">
                    npm run migrate:schedules
                  </Text>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-700/60 [html:not(.dark)_&]:border-slate-200/60">
                <button
                  onClick={() => {
                    onCreateNew();
                    setIsOpen(false);
                  }}
                  className="w-full px-4 py-3 bg-ember-500/20 hover:bg-ember-500/25 rounded-xl transition-all duration-150 flex items-center justify-center gap-2 [html:not(.dark)_&]:bg-ember-500/10 [html:not(.dark)_&]:hover:bg-ember-500/15"
                >
                  <svg className="w-5 h-5 text-ember-300 [html:not(.dark)_&]:text-ember-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <Text as="span" variant="ember" size="sm" weight="semibold">
                    Crea Prima Pianificazione
                  </Text>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Active Schedule Section */}
              <div className="p-3 border-b border-slate-700/60 [html:not(.dark)_&]:border-slate-200/60">
                <Text as="div" variant="tertiary" size="xs" weight="semibold" className="uppercase tracking-wider mb-2 px-2">
                  Attiva
                </Text>
                <div className="px-3 py-2 bg-sage-950/30 rounded-xl flex items-center gap-3 [html:not(.dark)_&]:bg-sage-50/50">
                  <div className="w-2 h-2 rounded-full bg-sage-500 shadow-sage-glow-sm" />
                  <Text as="div" size="sm" weight="semibold" variant="sage" className="flex-1">
                    {activeSchedule?.name}
                  </Text>
                  <Text as="div" size="xs" variant="sage">✓</Text>
                </div>
              </div>

          {/* Other Schedules Section */}
          {otherSchedules.length > 0 && (
            <div className="p-3 border-b border-slate-700/60 [html:not(.dark)_&]:border-slate-200/60">
              <Text as="div" variant="tertiary" size="xs" weight="semibold" className="uppercase tracking-wider mb-2 px-2">
                Disponibili
              </Text>
              <div className="space-y-1">
                {otherSchedules.map((schedule) => (
                  <button
                    key={schedule.id}
                    onClick={() => handleSelect(schedule.id)}
                    className="w-full px-3 py-2 text-left rounded-xl hover:bg-slate-700/50 transition-all duration-150 flex items-center gap-3 group [html:not(.dark)_&]:hover:bg-slate-100/80"
                  >
                    <div className="w-2 h-2 rounded-full bg-slate-600 group-hover:bg-ember-500 transition-colors [html:not(.dark)_&]:bg-slate-300 [html:not(.dark)_&]:group-hover:bg-ember-400" />
                    <Text as="div" size="sm" weight="medium" variant="secondary" className="flex-1 group-hover:text-white [html:not(.dark)_&]:group-hover:text-slate-900">
                      {schedule.name}
                    </Text>
                  </button>
                ))}
              </div>
            </div>
          )}

              {/* Create New Button */}
              <div className="p-3">
                <button
                  onClick={() => {
                    onCreateNew();
                    setIsOpen(false);
                  }}
                  className="w-full px-4 py-3 bg-ember-500/20 hover:bg-ember-500/25 rounded-xl transition-all duration-150 flex items-center justify-center gap-2 [html:not(.dark)_&]:bg-ember-500/10 [html:not(.dark)_&]:hover:bg-ember-500/15"
                >
                  <svg className="w-5 h-5 text-ember-300 [html:not(.dark)_&]:text-ember-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <Text as="span" variant="ember" size="sm" weight="semibold">
                    Crea Nuova Pianificazione
                  </Text>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
