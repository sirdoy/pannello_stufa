'use client';

import { useState, useEffect } from 'react';
import type { ScheduleInterval } from '@/lib/scheduler/schedulerService';

export interface TimeBarProps {
  intervals: ScheduleInterval[];
  hoveredIndex: number | null;
  selectedIndex: number | null;
  onHover: (index: number | null) => void;
  onClick: (index: number) => void;
  onIntervalClick?: (index: number, range: ScheduleInterval) => void;
  height?: string;
}

interface TooltipData {
  range: ScheduleInterval;
  x: number;
  y: number;
}

export default function TimeBar({
  intervals,
  hoveredIndex,
  selectedIndex,
  onHover,
  onClick,
  onIntervalClick,
}: TimeBarProps) {
  const totalMinutes = 24 * 60;
  const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection (< 768px = md breakpoint)
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleMouseEnter = (index: number, range: ScheduleInterval, event: React.MouseEvent<HTMLDivElement>) => {
    onHover(index);
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipData({
      range,
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
  };

  const handleMouseLeave = () => {
    onHover(null);
    setTooltipData(null);
  };

  return (
    <div className="relative mb-8 w-full">
      {/* Barra base */}
      <div className="shadow-liquid-sm relative h-8 w-full overflow-hidden rounded-xl bg-neutral-200/80 ring-1 ring-neutral-300/50 backdrop-blur-sm ring-inset">
        {intervals.map((range, idx) => {
          const [startH, startM] = range.start.split(':').map(Number);
          const [endH, endM] = range.end.split(':').map(Number);
          const start = startH! * 60 + startM!;
          const end = endH! * 60 + endM!;
          const left = (start / totalMinutes) * 100;
          const width = ((end - start) / totalMinutes) * 100;
          const isActive = idx === hoveredIndex || idx === selectedIndex;

          return (
            <div
              key={idx}
              role="button"
              aria-label={`Intervallo ${range.start} - ${range.end}, potenza ${range.power}, ventola ${range.fan}`}
              tabIndex={0}
              className={`absolute inset-y-0 cursor-pointer transition-all duration-200 ${
                isActive
                  ? 'z-10 scale-y-110 bg-linear-to-r from-primary-500 to-accent-600 shadow-lg'
                  : 'bg-linear-to-r from-primary-400 to-accent-500 hover:from-primary-500 hover:to-accent-600'
              } ${isMobile ? 'active:scale-y-115' : ''}`}
              style={{ left: `${left}%`, width: `${width}%` }}
              onMouseEnter={!isMobile ? (e) => handleMouseEnter(idx, range, e) : undefined}
              onMouseLeave={!isMobile ? handleMouseLeave : undefined}
              onClick={() => {
                if (isMobile && onIntervalClick) {
                  onIntervalClick(idx, range);
                } else {
                  onClick(idx);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (isMobile && onIntervalClick) {
                    onIntervalClick(idx, range);
                  } else {
                    onClick(idx);
                  }
                }
              }}
            />
          );
        })}
      </div>

      {/* Tooltip - nascosto su mobile e se intervallo è selezionato */}
      {tooltipData && selectedIndex === null && !isMobile && (
        <div
          className="shadow-liquid-xl pointer-events-none fixed relative z-9000 overflow-hidden rounded-lg bg-neutral-900/95 px-3 py-2 text-xs font-semibold text-white ring-1 ring-white/10 backdrop-blur-3xl ring-inset before:pointer-events-none before:absolute before:inset-0 before:bg-linear-to-br before:from-white/8 before:to-transparent"
          style={{
            left: `${tooltipData.x}px`,
            top: `${tooltipData.y}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="relative z-10 space-y-1">
            <div>⏰ {tooltipData.range.start} - {tooltipData.range.end}</div>
            <div className="flex gap-3">
              <span>⚡ Potenza: {tooltipData.range.power}</span>
              <span>💨 Ventola: {tooltipData.range.fan}</span>
            </div>
          </div>
          {/* Freccia del tooltip */}
          <div className="absolute bottom-0 left-1/2 z-10 -translate-x-1/2 translate-y-full transform">
            <div className="size-0 border-x-4 border-t-4 border-transparent border-t-neutral-900/95"></div>
          </div>
        </div>
      )}

      {/* Etichette orari sopra/sotto - nascosti su mobile molto piccolo */}
      {intervals.length > 0 && (
        <div className="xs:block relative hidden w-full">
          {intervals.map((range, idx) => {
            const [startH, startM] = range.start.split(':').map(Number);
            const [endH, endM] = range.end.split(':').map(Number);
            const start = startH! * 60 + startM!;
            const end = endH! * 60 + endM!;
            const startLeft = (start / totalMinutes) * 100;
            const endLeft = (end / totalMinutes) * 100;
            return (
              <div key={idx}>
                <span
                  className="shadow-liquid-sm absolute -top-7 rounded-lg bg-primary-500/8 px-2 py-0.5 text-xs font-semibold text-primary-600 ring-1 ring-primary-500/20 backdrop-blur-2xl"
                  style={{ left: `${startLeft}%`, transform: 'translateX(-50%)' }}
                >
                  {range.start}
                </span>
                <span
                  className="shadow-liquid-sm absolute top-10 rounded-lg bg-primary-500/8 px-2 py-0.5 text-xs font-semibold text-primary-600 ring-1 ring-primary-500/20 backdrop-blur-2xl"
                  style={{ left: `${endLeft}%`, transform: 'translateX(-50%)' }}
                >
                  {range.end}
                </span>
              </div>
            );
          })}
        </div>
      )}
      {/* Indicatori ore principali per riferimento */}
      <div className="relative mt-3 w-full">
        {[0, 6, 12, 18, 24].map(hour => (
          <span
            key={hour}
            className="absolute font-mono text-xs text-neutral-400"
            style={{ left: `${(hour / 24) * 100}%`, transform: 'translateX(-50%)' }}
          >
            {hour.toString().padStart(2, '0')}:00
          </span>
        ))}
      </div>
    </div>
  );
}