'use client';

import { useState, useEffect } from 'react';

export default function TimeBar({
  intervals,
  hoveredIndex,
  selectedIndex,
  onHover,
  onClick,
  onIntervalClick,
}) {
  const totalMinutes = 24 * 60;
  const [tooltipData, setTooltipData] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection (< 768px = md breakpoint)
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleMouseEnter = (index, range, event) => {
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
    <div className="relative w-full mb-8">
      {/* Barra base */}
      <div className="relative h-8 w-full bg-neutral-200/80 backdrop-blur-sm rounded-xl overflow-hidden shadow-liquid-sm ring-1 ring-neutral-300/50 ring-inset">
        {intervals.map((range, idx) => {
          const [startH, startM] = range.start.split(':').map(Number);
          const [endH, endM] = range.end.split(':').map(Number);
          const start = startH * 60 + startM;
          const end = endH * 60 + endM;
          const left = (start / totalMinutes) * 100;
          const width = ((end - start) / totalMinutes) * 100;
          const isActive = idx === hoveredIndex || idx === selectedIndex;

          return (
            <div
              key={idx}
              className={`absolute top-0 bottom-0 transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-primary-500 to-accent-600 scale-y-110 z-10 shadow-lg'
                  : 'bg-gradient-to-r from-primary-400 to-accent-500 hover:from-primary-500 hover:to-accent-600'
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
            />
          );
        })}
      </div>

      {/* Tooltip - nascosto su mobile e se intervallo è selezionato */}
      {tooltipData && selectedIndex === null && !isMobile && (
        <div
          className="fixed z-[9000] bg-neutral-900/95 backdrop-blur-3xl text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-liquid-xl ring-1 ring-white/10 ring-inset pointer-events-none relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/[0.08] before:to-transparent before:pointer-events-none"
          style={{
            left: `${tooltipData.x}px`,
            top: `${tooltipData.y}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="space-y-1 relative z-10">
            <div>⏰ {tooltipData.range.start} - {tooltipData.range.end}</div>
            <div className="flex gap-3">
              <span>⚡ Potenza: {tooltipData.range.power}</span>
              <span>💨 Ventola: {tooltipData.range.fan}</span>
            </div>
          </div>
          {/* Freccia del tooltip */}
          <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-full z-10">
            <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-neutral-900/95"></div>
          </div>
        </div>
      )}

      {/* Etichette orari sopra/sotto - nascosti su mobile molto piccolo */}
      {intervals.length > 0 && (
        <div className="relative w-full hidden xs:block">
          {intervals.map((range, idx) => {
            const [startH, startM] = range.start.split(':').map(Number);
            const [endH, endM] = range.end.split(':').map(Number);
            const start = startH * 60 + startM;
            const end = endH * 60 + endM;
            const startLeft = (start / totalMinutes) * 100;
            const endLeft = (end / totalMinutes) * 100;
            return (
              <div key={idx}>
                <span
                  className="absolute -top-7 text-xs font-semibold text-primary-600 bg-primary-500/[0.08] backdrop-blur-2xl px-2 py-0.5 rounded-lg shadow-liquid-sm ring-1 ring-primary-500/20"
                  style={{ left: `${startLeft}%`, transform: 'translateX(-50%)' }}
                >
                  {range.start}
                </span>
                <span
                  className="absolute top-10 text-xs font-semibold text-primary-600 bg-primary-500/[0.08] backdrop-blur-2xl px-2 py-0.5 rounded-lg shadow-liquid-sm ring-1 ring-primary-500/20"
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
      <div className="relative w-full mt-3">
        {[0, 6, 12, 18, 24].map(hour => (
          <span
            key={hour}
            className="absolute text-xs text-neutral-400 font-mono"
            style={{ left: `${(hour / 24) * 100}%`, transform: 'translateX(-50%)' }}
          >
            {hour.toString().padStart(2, '0')}:00
          </span>
        ))}
      </div>
    </div>
  );
}