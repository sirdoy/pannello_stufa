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
        group relative flex h-12
        min-w-10 items-center
        justify-center text-xs
        font-semibold transition-all
        duration-200 hover:z-10
        hover:scale-y-110
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
        pointer-events-none absolute -bottom-8 left-1/2
        z-20 -translate-x-1/2 rounded bg-black/80 px-2 py-1
        text-xs whitespace-nowrap
        text-white opacity-0
        transition-opacity group-hover:opacity-100
        
      ">
        {startTime}-{endTime}
      </div>
    </div>
  );
}
