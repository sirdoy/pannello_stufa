'use client';
import { getZoneColor } from '@/lib/utils/scheduleHelpers';

interface TimelineSlotProps {
  zoneType: number;
  zoneName: string;
  startTime: string;
  endTime: string;
  widthPercent: number;
}

/**
 * TimelineSlot - Single zone slot in timeline
 */
export default function TimelineSlot({
  zoneType,
  zoneName,
  startTime,
  endTime,
  widthPercent,
}: TimelineSlotProps) {
  const zoneColor = getZoneColor(zoneType);

  return (
    <div
      className="
        h-12 flex items-center justify-center
        text-xs font-semibold
        transition-all duration-200
        hover:scale-y-110 hover:z-10
        group relative
        min-w-[40px]
      "
      style={{
        width: `${widthPercent}%`,
        backgroundColor: zoneColor.bg,
        color: zoneColor.text,
      }}
      title={`${zoneName} (${startTime}-${endTime})`}
    >
      {/* Show zone name */}
      <span className="truncate px-1">{zoneName}</span>

      {/* Time tooltip on hover */}
      <div className="
        absolute -bottom-8 left-1/2 -translate-x-1/2
        bg-slate-900 text-white text-xs px-2 py-1 rounded
        opacity-0 group-hover:opacity-100
        transition-opacity pointer-events-none
        whitespace-nowrap z-20
        [html:not(.dark)_&]:bg-slate-800
      ">
        {startTime}-{endTime}
      </div>
    </div>
  );
}
