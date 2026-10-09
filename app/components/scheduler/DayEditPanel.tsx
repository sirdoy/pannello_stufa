'use client';

import { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import ActionButton from '../ui/ActionButton';
import Badge from '../ui/Badge';
import EmptyState from '../ui/EmptyState';
import Heading from '../ui/Heading';
import Text from '../ui/Text';
import TimeBar from './TimeBar';
import ScheduleInterval from './ScheduleInterval';
import IntervalBottomSheet from './IntervalBottomSheet';
import { getDayTotalHours } from '@/lib/scheduler/schedulerStats';
import { Check, Copy, Inbox, Plus, Save } from 'lucide-react';
import type { ScheduleInterval as ScheduleIntervalType } from '@/lib/scheduler/schedulerService';

export interface DayEditPanelProps {
  day: string;
  intervals: ScheduleIntervalType[];
  onAddInterval: (day: string) => void;
  onEditIntervalModal?: (index: number) => void;
  onDeleteInterval: (index: number) => void;
  onDuplicate?: (day: string) => void;
  saveStatus?: {
    isSaving: boolean;
  };
}

interface BottomSheetData {
  index: number;
  range: ScheduleIntervalType;
}

export default function DayEditPanel({
  day,
  intervals,
  onAddInterval,
  onEditIntervalModal,
  onDeleteInterval,
  onDuplicate,
  saveStatus,
}: DayEditPanelProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [bottomSheetData, setBottomSheetData] = useState<BottomSheetData | null>(null);

  const totalHours = getDayTotalHours(intervals);

  const handleIntervalClick = (index: number) => {
    setSelectedIndex(selectedIndex === index ? null : index);
  };

  // Handler per apertura bottom sheet da timeline (mobile)
  const handleTimelineIntervalClick = (index: number, range: ScheduleIntervalType) => {
    setBottomSheetData({ index, range });
    setSelectedIndex(index); // Sincronizza con selezione
  };

  // Handler azioni bottom sheet
  const handleBottomSheetEdit = () => {
    if (bottomSheetData && onEditIntervalModal) {
      onEditIntervalModal(bottomSheetData.index);
      setBottomSheetData(null);
    }
  };

  const handleBottomSheetDelete = () => {
    if (bottomSheetData) {
      onDeleteInterval(bottomSheetData.index);
      setBottomSheetData(null);
    }
  };

  return (
    <Card variant="glass" className="p-4 md:p-6">
      {/* Header - mobile-first responsive */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Left: Title + Info */}
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <Heading level={3} size="2xl">
              {day}
            </Heading>
            <Badge variant="neutral" size="lg">
              {intervals.length} {intervals.length === 1 ? 'intervallo' : 'intervalli'}
              {intervals.length > 0 && ` • ${totalHours.toFixed(1)}h`}
            </Badge>
          </div>

          {/* Save indicator */}
          {saveStatus && (
            <div className="flex items-center">
              {saveStatus.isSaving ? (
                <Text as="span" variant="ocean" size="sm" className="flex animate-pulse items-center gap-1">
                  <Save size={16} aria-hidden="true" />
                  Salvataggio...
                </Text>
              ) : (
                <Text as="span" variant="sage" size="sm" className="flex items-center gap-1">
                  <Check size={16} aria-hidden="true" />
                  Salvato
                </Text>
              )}
            </div>
          )}
        </div>

        {/* Right: Action Buttons - icon-only su mobile, con testo su desktop */}
        <div className="flex gap-2 self-end md:gap-3 md:self-auto">
          {/* Duplicate button - only if intervals exist */}
          {intervals.length > 0 && onDuplicate && (
            <>
              {/* Mobile: icon-only ActionButton */}
              <ActionButton
                icon={<Copy />}
                variant="ember"
                size="md"
                onClick={() => onDuplicate(day)}
                title="Duplica su altri giorni"
                ariaLabel="Duplica su altri giorni"
                className="sm:hidden"
              />
              {/* Desktop: Button with text */}
              <Button
                variant="subtle"
                onClick={() => onDuplicate(day)}
                className="hidden sm:flex"
              >
                <Copy className="mr-2 size-4" />
                Duplica
              </Button>
            </>
          )}

          {/* Add button */}
          <>
            {/* Mobile: icon-only ActionButton */}
            <ActionButton
              icon={<Plus />}
              variant="sage"
              size="md"
              onClick={() => onAddInterval(day)}
              title="Aggiungi intervallo"
              ariaLabel="Aggiungi intervallo"
              className="sm:hidden"
            />
            {/* Desktop: Button with text */}
            <Button
              variant="success"
              onClick={() => onAddInterval(day)}
              className="hidden sm:flex"
            >
              <Plus className="mr-2 size-4" />
              Aggiungi
            </Button>
          </>
        </div>
      </div>

      {/* Timeline visual (if intervals exist) */}
      {intervals.length > 0 && (
        <div className="mb-6">
          <TimeBar
            intervals={intervals}
            hoveredIndex={hoveredIndex}
            selectedIndex={selectedIndex}
            onHover={setHoveredIndex}
            onClick={handleIntervalClick}
            onIntervalClick={handleTimelineIntervalClick}
            height="h-12"
          />
        </div>
      )}

      {/* Intervals list */}
      <div className="space-y-3">
        {intervals.length === 0 ? (
          <EmptyState
            size="lg"
            level={4}
            icon={<Inbox size={40} className="text-(--text-2)" />}
            title={`Nessun intervallo configurato per ${day}`}
            description="Aggiungi il primo intervallo per iniziare"
            action={
              <Button
                variant="success"
                onClick={() => onAddInterval(day)}
                icon={<Plus size={16} />}
              >
                Aggiungi primo intervallo
              </Button>
            }
          />
        ) : (
          intervals.map((range, index) => (
            <ScheduleInterval
              key={index}
              range={range}
              isHighlighted={index === hoveredIndex || index === selectedIndex}
              onRemove={() => onDeleteInterval(index)}
              onEdit={onEditIntervalModal ? () => onEditIntervalModal(index) : undefined}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => handleIntervalClick(index)}
            />
          ))
        )}
      </div>

      {/* Bottom Sheet Mobile */}
      <IntervalBottomSheet
        range={bottomSheetData?.range}
        isOpen={!!bottomSheetData}
        onClose={() => setBottomSheetData(null)}
        onEdit={handleBottomSheetEdit}
        onDelete={handleBottomSheetDelete}
      />
    </Card>
  );
}
