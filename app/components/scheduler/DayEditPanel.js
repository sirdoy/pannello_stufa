'use client';

import { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import ActionButton from '../ui/ActionButton';
import Heading from '../ui/Heading';
import Text from '../ui/Text';
import TimeBar from './TimeBar';
import ScheduleInterval from './ScheduleInterval';
import IntervalBottomSheet from './IntervalBottomSheet';
import { getDayTotalHours } from '@/lib/schedulerStats';
import { Copy, Plus } from 'lucide-react';

export default function DayEditPanel({
  day,
  intervals,
  onAddInterval,
  onEditIntervalModal,
  onDeleteInterval,
  onDuplicate,
  saveStatus,
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [bottomSheetData, setBottomSheetData] = useState(null);

  const totalHours = getDayTotalHours(intervals);

  const handleIntervalClick = (index) => {
    setSelectedIndex(selectedIndex === index ? null : index);
  };

  // Handler per apertura bottom sheet da timeline (mobile)
  const handleTimelineIntervalClick = (index, range) => {
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
      <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
        {/* Left: Title + Info */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <Heading level={3} className="text-2xl">
              {day}
            </Heading>
            <Text as="span" variant="secondary" size="sm" weight="medium" className="bg-slate-800/60 [html:not(.dark)_&]:bg-slate-100 px-3 py-1 rounded-full">
              {intervals.length} {intervals.length === 1 ? 'intervallo' : 'intervalli'}
              {intervals.length > 0 && ` • ${totalHours.toFixed(1)}h`}
            </Text>
          </div>

          {/* Save indicator */}
          {saveStatus && (
            <div className="flex items-center">
              {saveStatus.isSaving ? (
                <Text as="span" size="sm" className="text-blue-400 [html:not(.dark)_&]:text-blue-600 animate-pulse flex items-center gap-1">
                  💾 Salvataggio...
                </Text>
              ) : (
                <Text as="span" size="sm" className="text-green-400 [html:not(.dark)_&]:text-green-700 flex items-center gap-1">
                  ✓ Salvato
                </Text>
              )}
            </div>
          )}
        </div>

        {/* Right: Action Buttons - icon-only su mobile, con testo su desktop */}
        <div className="flex gap-2 md:gap-3 self-end md:self-auto">
          {/* Duplicate button - only if intervals exist */}
          {intervals.length > 0 && onDuplicate && (
            <>
              {/* Mobile: icon-only ActionButton */}
              <ActionButton
                icon={<Copy />}
                variant="primary"
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
                icon={<Copy className="w-4 h-4" />}
                className="hidden sm:flex"
              >
                Duplica
              </Button>
            </>
          )}

          {/* Add button */}
          <>
            {/* Mobile: icon-only ActionButton */}
            <ActionButton
              icon={<Plus />}
              variant="success"
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
              icon={<Plus className="w-4 h-4" />}
              className="hidden sm:flex"
            >
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
          <div className="text-center py-12">
            <div className="text-5xl mb-4">📭</div>
            <Text variant="tertiary" size="lg" className="mb-2">Nessun intervallo configurato per {day}</Text>
            <Text variant="tertiary" size="sm" className="mb-4">Aggiungi il primo intervallo per iniziare</Text>
            <Button
              variant="success"
              onClick={() => onAddInterval(day)}
              icon="+"
            >
              Aggiungi primo intervallo
            </Button>
          </div>
        ) : (
          intervals.map((range, index) => (
            <ScheduleInterval
              key={index}
              range={range}
              isHighlighted={index === hoveredIndex || index === selectedIndex}
              onRemove={() => onDeleteInterval(index)}
              onEdit={onEditIntervalModal ? () => onEditIntervalModal(index) : null}
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
