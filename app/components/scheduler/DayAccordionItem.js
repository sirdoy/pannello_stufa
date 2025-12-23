'use client';

import { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import TimeBar from './TimeBar';
import ScheduleInterval from './ScheduleInterval';
import { Copy } from 'lucide-react';

export default function DayAccordionItem({
  day,
  intervals,
  isExpanded,
  onToggle,
  onAddInterval,
  onRemoveInterval,
  onChangeInterval,
  onDuplicate,
  saveStatus,
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);

  const handleIntervalClick = (index) => {
    setSelectedIndex(selectedIndex === index ? null : index);
  };

  // Calcola preview: orario totale coperto
  const getTimeRangePreview = () => {
    if (intervals.length === 0) return 'Nessun intervallo configurato';

    const sorted = [...intervals].sort((a, b) => a.start.localeCompare(b.start));
    const first = sorted[0].start;
    const last = sorted[sorted.length - 1].end;

    return `${first} - ${last}`;
  };

  // Calcola durata totale in ore
  const getTotalDuration = () => {
    if (intervals.length === 0) return 0;

    const totalMinutes = intervals.reduce((sum, interval) => {
      const [startH, startM] = interval.start.split(':').map(Number);
      const [endH, endM] = interval.end.split(':').map(Number);
      const start = startH * 60 + startM;
      const end = endH * 60 + endM;
      return sum + (end - start);
    }, 0);

    return (totalMinutes / 60).toFixed(1);
  };

  return (
    <Card liquid className="overflow-hidden">
      {/* Header - sempre visibile */}
      <div className="w-full">
        <button
          onClick={onToggle}
          className="w-full p-6 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-white/[0.02] transition-colors duration-200"
        >
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {/* Icona giorno e nome */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="text-2xl">📅</span>
              <div className="text-left">
                <h2 className="text-xl font-bold text-neutral-900 dark:text-white">{day}</h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {intervals.length} {intervals.length === 1 ? 'intervallo' : 'intervalli'}
                  {intervals.length > 0 && ` • ${getTotalDuration()}h totali`}
                </p>
              </div>
            </div>

            {/* Preview compatta - solo quando collassato */}
            {!isExpanded && intervals.length > 0 && (
              <div className="hidden md:flex items-center gap-3 ml-auto mr-4">
                <div className="text-sm font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 px-3 py-1.5 rounded-lg border border-primary-200 dark:border-primary-800">
                  ⏰ {getTimeRangePreview()}
                </div>
              </div>
            )}

            {/* Feature 4: Save indicator - solo quando espanso */}
            {isExpanded && saveStatus && (
              <div className="ml-auto mr-4">
                {saveStatus.isSaving ? (
                  <span className="text-sm text-blue-500 dark:text-blue-400 animate-pulse">
                    Salvataggio...
                  </span>
                ) : (
                  <span className="text-sm text-green-600 dark:text-green-400">
                    ✓ Salvato
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Feature 3: Duplicate button - solo quando espanso e ci sono intervalli */}
          {isExpanded && intervals.length > 0 && onDuplicate && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate(day);
              }}
              className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-white/[0.05] transition-colors"
              aria-label="Duplica giorno"
              title="Duplica su altri giorni"
            >
              <Copy className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
            </button>
          )}

          {/* Icona expand/collapse */}
          <div className="ml-4 flex-shrink-0">
            <span className={`text-2xl transition-transform duration-300 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}>
              ⌄
            </span>
          </div>
        </button>

        {/* TimeBar compatta - solo quando collassato e ci sono intervalli */}
        {!isExpanded && intervals.length > 0 && (
          <div className="px-6 pb-4">
            <div className="relative h-4 w-full bg-neutral-200 dark:bg-neutral-700 rounded-lg overflow-hidden shadow-inner">
              {intervals.map((range, idx) => {
                const totalMinutes = 24 * 60;
                const [startH, startM] = range.start.split(':').map(Number);
                const [endH, endM] = range.end.split(':').map(Number);
                const start = startH * 60 + startM;
                const end = endH * 60 + endM;
                const left = (start / totalMinutes) * 100;
                const width = ((end - start) / totalMinutes) * 100;

                return (
                  <div
                    key={idx}
                    className="absolute top-0 bottom-0 bg-gradient-to-r from-primary-400 to-accent-500 dark:from-primary-500 dark:to-accent-600"
                    style={{ left: `${left}%`, width: `${width}%` }}
                    title={`${range.start} - ${range.end} | ⚡${range.power} 💨${range.fan}`}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Contenuto collassabile */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'
        } overflow-hidden`}
      >
        <div className="px-6 pb-6 space-y-4">
          {/* TimeBar */}
          {intervals.length > 0 && (
            <TimeBar
              intervals={intervals}
              hoveredIndex={hoveredIndex}
              selectedIndex={selectedIndex}
              onHover={setHoveredIndex}
              onClick={handleIntervalClick}
            />
          )}

          {/* Lista intervalli */}
          {intervals.length > 0 ? (
            <div className="space-y-3">
              {intervals.map((range, index) => (
                <ScheduleInterval
                  key={index}
                  range={range}
                  isHighlighted={index === hoveredIndex || index === selectedIndex}
                  onRemove={() => onRemoveInterval(index)}
                  onChange={(field, value, isBlur) => onChangeInterval(index, field, value, isBlur)}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => handleIntervalClick(index)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
              <p className="text-lg mb-2">📭 Nessun intervallo configurato</p>
              <p className="text-sm">Aggiungi il primo intervallo per iniziare</p>
            </div>
          )}

          {/* Pulsante aggiungi */}
          <Button
            liquid
            variant="success"
            icon="+"
            onClick={onAddInterval}
            className="w-full"
          >
            Aggiungi intervallo
          </Button>
        </div>
      </div>
    </Card>
  );
}