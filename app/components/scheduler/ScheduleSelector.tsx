'use client';

import { useState } from 'react';
import { ChevronDown, Plus, Check } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '../ui/Popover';
import Button from '../ui/Button';
import Text from '../ui/Text';
import { cn } from '@/lib/utils/cn';

interface Schedule {
  id: string;
  name: string;
  enabled?: boolean;
  isActive?: boolean;
}

export interface ScheduleSelectorProps {
  schedules?: Schedule[];
  activeScheduleId: string;
  onSelectSchedule: (scheduleId: string) => void;
  onCreateNew: () => void;
  loading?: boolean;
}

export default function ScheduleSelector({
  schedules = [],
  activeScheduleId,
  onSelectSchedule,
  onCreateNew,
  loading = false,
}: ScheduleSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const activeSchedule = schedules.find(s => s.id === activeScheduleId);
  const otherSchedules = schedules.filter(s => s.id !== activeScheduleId);
  const hasSchedules = schedules.length > 0;

  const handleSelect = (scheduleId: string) => {
    onSelectSchedule(scheduleId);
    setIsOpen(false);
  };

  const handleCreateNew = () => {
    onCreateNew();
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          disabled={loading}
          className={cn(
            // Base styles matching design system Select trigger
            'flex items-center justify-between w-full rounded-xl font-medium font-display cursor-pointer',
            'bg-slate-800/60 backdrop-blur-xl border border-slate-700/50',
            'text-slate-100',
            'transition-all duration-200',
            // Focus ring - ember glow
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-ember-500/50',
            'focus-visible:border-ember-500/60',
            // Hover
            'hover:bg-slate-800/80 hover:border-slate-600/60',
            // Disabled
            'disabled:opacity-50 disabled:cursor-not-allowed',
            // Light mode
            '[html:not(.dark)_&]:bg-white/80 [html:not(.dark)_&]:border-slate-300/60',
            '[html:not(.dark)_&]:text-slate-900',
            '[html:not(.dark)_&]:hover:bg-white/90 [html:not(.dark)_&]:hover:border-slate-400/60',
            // Size - matching Select md
            'px-4 py-4 min-h-[56px]'
          )}
        >
          {/* Left: Active Schedule Info */}
          <div className="flex items-center gap-3 flex-1 text-left">
            <div className="w-2 h-2 rounded-full bg-sage-500 shadow-sage-glow-sm animate-pulse shrink-0" />
            <div className="flex-1 min-w-0">
              <Text variant="tertiary" size="xs">
                Pianificazione Attiva
              </Text>
              <Text className="truncate">
                {loading ? 'Caricamento...' : activeSchedule?.name || 'Nessuna'}
              </Text>
            </div>
          </div>

          {/* Right: Dropdown Icon */}
          <ChevronDown
            className={cn(
              'h-5 w-5 text-slate-400 transition-transform duration-200 shrink-0 ml-2',
              '[html:not(.dark)_&]:text-slate-500',
              isOpen && 'rotate-180'
            )}
          />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={8}
        className="w-[var(--radix-popover-trigger-width)] p-0 overflow-hidden"
      >
        {!hasSchedules ? (
          /* No Schedules - Migration Required */
          <div className="p-4">
            <div className="text-center py-4">
              <div className="text-3xl mb-3">📅</div>
              <Text size="sm" variant="secondary" className="mb-2">
                Nessuna pianificazione trovata
              </Text>
              <Text variant="tertiary" size="xs" className="mb-4">
                Esegui la migrazione per creare la struttura v2
              </Text>
              <div className="bg-slate-700/40 rounded-xl p-3 text-left [html:not(.dark)_&]:bg-slate-100/60">
                <Text as="code" size="xs" className="block font-mono">
                  npm run migrate:schedules
                </Text>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-700/50 [html:not(.dark)_&]:border-slate-200">
              <Button
                variant="ember"
                size="sm"
                className="w-full"
                onClick={handleCreateNew}
              >
                <Plus className="w-4 h-4 mr-2" />
                Crea Prima Pianificazione
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Active Schedule Section */}
            <div className="p-3 border-b border-slate-700/50 [html:not(.dark)_&]:border-slate-200">
              <Text as="div" variant="tertiary" size="xs" className="uppercase tracking-wider mb-2 px-2">
                Attiva
              </Text>
              <div className="px-3 py-2 bg-sage-950/30 rounded-xl flex items-center gap-3 [html:not(.dark)_&]:bg-sage-50/50">
                <div className="w-2 h-2 rounded-full bg-sage-500 shadow-sage-glow-sm shrink-0" />
                <Text as="div" size="sm" variant="sage" className="flex-1">
                  {activeSchedule?.name}
                </Text>
                <Check className="w-4 h-4 text-sage-400 [html:not(.dark)_&]:text-sage-600" />
              </div>
            </div>

            {/* Other Schedules Section */}
            {otherSchedules.length > 0 && (
              <div className="p-3 border-b border-slate-700/50 [html:not(.dark)_&]:border-slate-200">
                <Text as="div" variant="tertiary" size="xs" className="uppercase tracking-wider mb-2 px-2">
                  Disponibili
                </Text>
                <div className="space-y-1">
                  {otherSchedules.map((schedule) => (
                    <button
                      key={schedule.id}
                      onClick={() => handleSelect(schedule.id)}
                      className={cn(
                        'w-full px-3 py-2 text-left rounded-xl flex items-center gap-3 group',
                        'transition-colors duration-150',
                        'hover:bg-slate-700/50 [html:not(.dark)_&]:hover:bg-slate-100'
                      )}
                    >
                      <div className={cn(
                        'w-2 h-2 rounded-full shrink-0 transition-colors',
                        'bg-slate-600 group-hover:bg-ember-500',
                        '[html:not(.dark)_&]:bg-slate-300 [html:not(.dark)_&]:group-hover:bg-ember-400'
                      )} />
                      <Text
                        as="div"
                        size="sm"
                       
                        variant="secondary"
                        className="flex-1 group-hover:text-slate-100 [html:not(.dark)_&]:group-hover:text-slate-900"
                      >
                        {schedule.name}
                      </Text>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Create New Button */}
            <div className="p-3">
              <Button
                variant="ember"
                size="sm"
                className="w-full"
                onClick={handleCreateNew}
              >
                <Plus className="w-4 h-4 mr-2" />
                Crea Nuova Pianificazione
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
