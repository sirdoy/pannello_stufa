/**
 * Custom range slider primitive (CONTEXT D-12) — 140×6 input with two-stop gradient fill.
 *
 * **Phase 178 consumption status:** UNUSED in Phase 178 (SonosSheet uses a plain
 * `<input type="range" accentColor="#b080ff">` per bundle `sheets.jsx:374-380`).
 * Shipped now (~30 LOC) for Phase 179 (Rooms tab lights brightness) per CONTEXT D-12.
 *
 * Visual contract verbatim from bundle `sheets.jsx:502-513`.
 */
export interface SliderProps {
  value: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
  color?: string;
}

export function Slider({ value, min, max, onChange, color = 'var(--accent)' }: SliderProps) {
  const pct = max === min ? 0 : (value - min) / (max - min);
  return (
    <input
      type="range"
      data-testid="slider"
      data-sheet-focusable="true"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{
        WebkitAppearance: 'none',
        appearance: 'none',
        width: 140,
        height: 6,
        borderRadius: 999,
        outline: 'none',
        background: `linear-gradient(to right, ${color} 0%, ${color} ${pct * 100}%, rgba(255,255,255,0.1) ${pct * 100}%, rgba(255,255,255,0.1) 100%)`, // AUDIT-EXCEPTION (sheets.jsx:510)
      }}
    />
  );
}
