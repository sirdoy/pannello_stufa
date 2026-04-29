import { Minus, Plus } from 'lucide-react';

/**
 * Apple-Home-style radial dial primitive (CONTEXT D-13) — 220×220 SVG (270° arc) +
 * 68px Outfit center value + 28px ° superscript + 12px sublabel + 44×44 ± buttons.
 *
 * NO drag/touch on the arc (CONTEXT D-13) — only ± buttons drive `onChange`.
 *
 * Visual contract verbatim from bundle `sheets.jsx:536-579`. Buttons are bare (no Pressable, D-24).
 */
export interface RadialDialProps {
  value: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
  color: string;
  label: string;
}

export function RadialDial({ value, min, max, onChange, color, label }: RadialDialProps) {
  const pct = max === min ? 0 : (value - min) / (max - min);
  const size = 220;
  const r = 92;
  const circ = 2 * Math.PI * r;
  const arcLen = circ * 0.75;

  return (
    <div
      data-testid="radial-dial"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '8px 0 16px',
        position: 'relative',
      }}
    >
      <svg width={size} height={size} style={{ transform: 'rotate(135deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.08)" /* AUDIT-EXCEPTION (sheets.jsx:549) */
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={`${arcLen} ${circ}`}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={`${arcLen * pct} ${circ}`}
          style={{ filter: `drop-shadow(0 0 12px ${color})`, transition: 'stroke-dasharray .3s' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          data-testid="radial-dial-value"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 68,
            fontWeight: 600,
            color: '#fff', // AUDIT-EXCEPTION (sheets.jsx:560)
            lineHeight: 1,
            letterSpacing: -3,
          }}
        >
          {value}
          <span style={{ fontSize: 28, opacity: 0.5 }}>°</span>
        </div>
        <div
          data-testid="radial-dial-label"
          style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}
        >
          {label}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 14 }}>
        <button
          type="button"
          data-testid="radial-dial-minus"
          data-sheet-focusable="true"
          aria-label="Diminuisci temperatura"
          onClick={() => onChange(Math.max(min, value - 1))}
          style={{
            width: 44,
            height: 44,
            borderRadius: 999,
            border: 'none',
            background: 'rgba(255,255,255,0.08)', // AUDIT-EXCEPTION (sheets.jsx:567)
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          <Minus size={18} strokeWidth={2.2} />
        </button>
        <button
          type="button"
          data-testid="radial-dial-plus"
          data-sheet-focusable="true"
          aria-label="Aumenta temperatura"
          onClick={() => onChange(Math.min(max, value + 1))}
          style={{
            width: 44,
            height: 44,
            borderRadius: 999,
            border: 'none',
            background: 'rgba(255,255,255,0.08)', // AUDIT-EXCEPTION (sheets.jsx:572)
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          <Plus size={18} strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}
