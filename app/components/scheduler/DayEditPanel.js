'use client';

import { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import TimeBar from './TimeBar';
import ScheduleInterval from './ScheduleInterval';
import { getDayTotalHours } from '@/lib/schedulerStats';
import { Copy } from 'lucide-react';

export default function DayEditPanel({
  day,
  intervals,
  onAddInterval,
  onEditInterval,
  onDeleteInterval,
  onDuplicate,
  saveStatus,
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);

  const totalHours = getDayTotalHours(intervals);

  const handleIntervalClick = (index) => {
    setSelectedIndex(selectedIndex === index ? null : index);
  };

  return (
    <Card liquid className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h3 className="text-2xl font-bold text-neutral-900 dark:text-white">
            {day}
          </h3>
          <span className="text-sm text-neutral-600 dark:text-neutral-400">
            {intervals.length} {intervals.length === 1 ? 'intervallo' : 'intervalli'}
            {intervals.length > 0 && ` • ${totalHours.toFixed(1)}h totali`}
          </span>

          {/* Save indicator */}
          {saveStatus && (
            <div className="ml-4">
              {saveStatus.isSaving ? (
                <span className="text-sm text-blue-500 dark:text-blue-400 animate-pulse">
                  💾 Salvataggio...
                </span>
              ) : (
                <span className="text-sm text-green-600 dark:text-green-400">
                  ✓ Salvato
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          {/* Duplicate button - only if intervals exist */}
          {intervals.length > 0 && onDuplicate && (
            <Button
              liquid
              variant="secondary"
              onClick={() => onDuplicate(day)}
              icon={<Copy className="w-4 h-4" />}
              title="Duplica su altri giorni"
            >
              Duplica
            </Button>
          )}

          <Button
            liquid
            variant="success"
            onClick={() => onAddInterval(day)}
            icon="+"
          >
            Aggiungi intervallo
          </Button>
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
            height="h-12"
          />
        </div>
      )}

      {/* Intervals list */}
      <div className="space-y-3">
        {intervals.length === 0 ? (
          <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-lg mb-2">Nessun intervallo configurato per {day}</p>
            <p className="text-sm mb-4">Aggiungi il primo intervallo per iniziare</p>
            <Button
              liquid
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
              onChange={(field, value, isBlur) => onEditInterval(index, field, value, isBlur)}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => handleIntervalClick(index)}
            />
          ))
        )}
      </div>
    </Card>
  );
}
