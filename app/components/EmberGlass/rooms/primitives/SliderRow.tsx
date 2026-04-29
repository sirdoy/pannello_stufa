'use client';
/**
 * SliderRow — Phase 179 rooms primitive
 * Bundle source: rooms.jsx:559-585
 * Labeled gradient bar — read-only by default; becomes tap-to-seek when onChange is provided.
 *
 * Key differences from Phase 178 Slider.tsx:
 * - No native <input type=range> — renders a plain div with gradient fill (D-36).
 * - Click on track computes x-percentage → emits onChange(rounded value) (tap-to-seek).
 * - Disabled dims to opacity 0.45 and short-circuits onChange.
 *
 * D-02: inline-style + var(--token) only. D-37: no useMemo/useCallback.
 * D-62: bare element, NOT a glass surface — no Pressable wrap.
 * D-67: inline event handlers allowed.
 *
 * T-179-02-01 mitigation: x coordinate is clamped to [0, rect.width] before computing fraction.
 */
import type { CSSProperties, MouseEvent } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface SliderRowProps {
  label: string;
  value: number;
  unit?: string;
  min?: number;
  max?: number;
  tone?: string;
  Icon?: LucideIcon;
  disabled?: boolean;
  onChange?: (next: number) => void;
}

export function SliderRow({
  label,
  value,
  unit = '',
  min = 0,
  max = 100,
  tone = 'var(--accent)',
  Icon,
  disabled = false,
  onChange,
}: SliderRowProps){
  // Clamp + compute fill percentage
  const range = max === min ? 1 : max - min;
  const pct = Math.max(0, Math.min(100, ((value - min) / range) * 100));

  const interactive = !disabled && typeof onChange === 'function';

  function handleTrackClick(e: MouseEvent<HTMLDivElement>) {
    if (!interactive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    // T-179-02-01: clamp x to [0, rect.width]
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const fraction = x / rect.width;
    const next = Math.round(min + fraction * (max - min));
    onChange!(next);
  }

  const containerStyle: CSSProperties = {
    opacity: disabled ? 0.45 : 1,
  };

  const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  };

  const labelGroupStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 11,
    color: 'var(--text-2)',
  };

  const valueStyle: CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: '#fff', // AUDIT-EXCEPTION (rooms.jsx:568)
    fontVariantNumeric: 'tabular-nums',
  };

  const trackStyle: CSSProperties = {
    height: 6,
    borderRadius: 999,
    background: 'rgba(255,255,255,0.08)', // AUDIT-EXCEPTION (rooms.jsx:573)
    position: 'relative',
    overflow: 'hidden',
    cursor: interactive ? 'pointer' : 'default',
  };

  const fillStyle: CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: `${pct}%`,
    background: `linear-gradient(90deg, ${tone} 0%, color-mix(in oklab, ${tone} 70%, #fff) 100%)`,
    borderRadius: 999,
    boxShadow: disabled ? 'none' : `0 0 8px color-mix(in oklab, ${tone} 40%, transparent)`,
  };

  return (
    <div data-testid="slider-row" style={containerStyle}>
      <div style={headerStyle}>
        <div style={labelGroupStyle}>
          {Icon ? <Icon size={12} strokeWidth={2} /> : null}
          <span>{label}</span>
        </div>
        <span style={valueStyle}>{value}{unit}</span>
      </div>
      <div
        data-testid="slider-row-track"
        style={trackStyle}
        onClick={handleTrackClick}
        role={interactive ? 'slider' : undefined}
        aria-valuenow={interactive ? value : undefined}
        aria-valuemin={interactive ? min : undefined}
        aria-valuemax={interactive ? max : undefined}
        aria-disabled={disabled || undefined}
      >
        <div data-testid="slider-row-fill" style={fillStyle} />
      </div>
    </div>
  );
}
