/**
 * BigSlider — Phase 182 (D-06)
 *
 * Full-width 72px-tall slider with color-mix gradient fill. Shows the
 * percentage value as large display text. Transparent overlay
 * `<input type="range">` handles pointer interaction. Default color is
 * var(--accent) so the slider live-recolors with the accent picker.
 *
 * Bundle source:
 *   .planning/inbox/ember-glass-design/project/components/sheets.jsx:515-533
 *
 * Adaptation: bundle's `<IconBulb>` -> `<Lightbulb>` from lucide-react
 * (Pitfall 2). D-08: all styles verbatim.
 * RC-clean — no manual memoization hooks.
 */
import { Lightbulb } from 'lucide-react';

export interface BigSliderProps {
  value: number;            // 0..100 (percent)
  onChange: (next: number) => void;
  color?: string;           // default: 'var(--accent)'
}

export function BigSlider({
  value,
  onChange,
  color = 'var(--accent)',
}: BigSliderProps): React.ReactElement {
  return (
    <div
      data-testid="big-slider"
      style={{
        position: 'relative',
        height: 72,
        borderRadius: 20,
        overflow: 'hidden',
        background: 'rgba(255,255,255,0.06)',
        border: '0.5px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* gradient fill track */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: `${value}%`,
          background: `linear-gradient(90deg, color-mix(in oklab, ${color} 70%, transparent) 0%, ${color} 100%)`,
        }}
      />
      {/* transparent range input overlay */}
      <input
        type="range"
        min="0"
        max="100"
        value={value}
        aria-valuenow={value}
        data-testid="big-slider-input"
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0,
          cursor: 'pointer',
          width: '100%',
          height: '100%',
        }}
      />
      {/* label overlay — pointerEvents: none so the input receives events */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          pointerEvents: 'none',
        }}
      >
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, color: '#fff' }}>
          {value}%
        </div>
        <Lightbulb size={22} stroke="rgba(255,255,255,0.7)" />
      </div>
    </div>
  );
}
