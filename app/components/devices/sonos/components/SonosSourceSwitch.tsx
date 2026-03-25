'use client';

interface SonosSourceSwitchProps {
  uid: string;
  role: 'soundbar' | 'sub' | 'surround' | 'speaker';
  onSwitchSource: (uid: string, source: 'tv' | 'line_in') => Promise<void>;
  currentSource?: 'tv' | 'streaming' | 'radio' | 'line_in' | 'airplay' | 'unknown' | null;
}

export default function SonosSourceSwitch({
  uid,
  role,
  onSwitchSource,
  currentSource,
}: SonosSourceSwitchProps) {
  // Only render for soundbar role
  if (role !== 'soundbar') {
    return null;
  }

  const isTvActive = currentSource === 'tv';
  const isLineInActive = currentSource === 'line_in';

  const activeClass = 'bg-amber-500/80 text-white';
  const inactiveClass = 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 [html:not(.dark)_&]:bg-slate-200 [html:not(.dark)_&]:text-slate-500';

  return (
    <div className="inline-flex items-center gap-1 mt-2">
      <button
        onClick={() => void onSwitchSource(uid, 'tv')}
        className={`text-xs px-3 py-1 rounded-md transition-colors ${isTvActive ? activeClass : inactiveClass}`}
        aria-label="Sorgente TV"
        aria-pressed={isTvActive}
      >
        TV
      </button>
      <button
        onClick={() => void onSwitchSource(uid, 'line_in')}
        className={`text-xs px-3 py-1 rounded-md transition-colors ${isLineInActive ? activeClass : inactiveClass}`}
        aria-label="Sorgente Line-in"
        aria-pressed={isLineInActive}
      >
        Line-in
      </button>
    </div>
  );
}
