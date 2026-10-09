'use client';

import { useState } from 'react';
import { CalendarDays, ChevronDown, Plus, Check } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '../ui/Popover';
import Button from '../ui/Button';
import Card from '../ui/Card';
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
            // Custom popover trigger (two-line row): same glass surface as Button subtle
            'flex w-full cursor-pointer items-center justify-between rounded-xl font-display font-medium',
            'border-[0.5px] border-white/14 bg-white/6 text-(--text-1)',
            'transition-colors duration-200',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-ember-500/50',
            'hover:bg-white/10',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'min-h-14 p-4'
          )}
        >
          {/* Left: Active Schedule Info */}
          <div className="flex flex-1 items-center gap-3 text-left">
            <div className="shadow-sage-glow-sm size-2 shrink-0 animate-pulse rounded-full bg-sage-500" />
            <div className="min-w-0 flex-1">
              <Text as="span" variant="tertiary" size="xs" className="block">
                Pianificazione Attiva
              </Text>
              <Text as="span" className="block truncate">
                {loading ? 'Caricamento...' : activeSchedule?.name || 'Nessuna'}
              </Text>
            </div>
          </div>

          {/* Right: Dropdown Icon */}
          <ChevronDown
            className={cn(
              'ml-2 size-5 shrink-0 text-(--text-2) transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
          />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={8}
        className="w-(--radix-popover-trigger-width) overflow-hidden p-0"
      >
        {!hasSchedules ? (
          /* No Schedules - Migration Required */
          <div className="p-4">
            <div className="py-4 text-center">
              <CalendarDays size={28} className="mx-auto mb-3 text-(--text-2)" aria-hidden="true" />
              <Text size="sm" variant="secondary" className="mb-2">
                Nessuna pianificazione trovata
              </Text>
              <Text variant="tertiary" size="xs" className="mb-4">
                Esegui la migrazione per creare la struttura v2
              </Text>
              <Card variant="subtle" padding={false} className="p-3 text-left">
                <Text as="code" size="xs" mono className="block">
                  npm run migrate:schedules
                </Text>
              </Card>
            </div>
            <div className="mt-3 border-t border-white/8 pt-3">
              <Button
                variant="ember"
                size="sm"
                className="w-full"
                onClick={handleCreateNew}
              >
                <Plus className="mr-2 size-4" />
                Crea Prima Pianificazione
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Active Schedule Section */}
            <div className="border-b border-white/8 p-3">
              <Text as="div" variant="label" className="mb-2 px-2">
                Attiva
              </Text>
              <div className="flex items-center gap-3 rounded-xl bg-sage-950/30 px-3 py-2 ">
                <div className="shadow-sage-glow-sm size-2 shrink-0 rounded-full bg-sage-500" />
                <Text as="div" size="sm" variant="sage" className="flex-1">
                  {activeSchedule?.name}
                </Text>
                <Check className="size-4 text-sage-400 " />
              </div>
            </div>

            {/* Other Schedules Section */}
            {otherSchedules.length > 0 && (
              <div className="border-b border-white/8 p-3">
                <Text as="div" variant="label" className="mb-2 px-2">
                  Disponibili
                </Text>
                <div className="space-y-1">
                  {otherSchedules.map((schedule) => (
                    <button
                      key={schedule.id}
                      onClick={() => handleSelect(schedule.id)}
                      className={cn(
                        'group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left',
                        'transition-colors duration-150',
                        'hover:bg-white/6'
                      )}
                    >
                      <div className={cn(
                        'size-2 shrink-0 rounded-full transition-colors',
                        'bg-white/20 group-hover:bg-ember-500'
                      )} />
                      <Text
                        as="div"
                        size="sm"
                        variant="secondary"
                        className="flex-1 group-hover:text-(--text-1)"
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
                <Plus className="mr-2 size-4" />
                Crea Nuova Pianificazione
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
