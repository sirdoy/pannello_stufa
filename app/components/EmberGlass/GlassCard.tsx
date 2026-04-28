'use client';

/**
 * GlassCard — Phase 177 (DASH-01)
 *
 * 1:1 square glass surface. When `onOpen` is provided, wraps root in Pressable
 * (Phase 175 DS-07) and sets cursor: pointer. When omitted, renders as a static
 * glass surface (WeatherCard / RaspiCard, SC-#3).
 *
 * Bundle source (PRIMARY visual contract):
 *   .planning/inbox/ember-glass-design/project/components/cards.jsx:7-50
 *
 * RC-clean — no manual memoization hooks (D-28 — React Compiler discipline).
 */

import type { CSSProperties, ReactNode } from 'react';
import { Pressable } from './Pressable';

export interface GlassCardProps {
  children: ReactNode;
  tone?: string;
  onOpen?: () => void;
  style?: CSSProperties;
  'data-testid'?: string;
}

const baseStyle: CSSProperties = {
  position: 'relative',
  borderRadius: 'var(--r-card)',
  padding: 'var(--pad-card)',
  aspectRatio: '1 / 1',
  overflow: 'hidden',
  background: 'var(--glass-bg)',
  backdropFilter: 'blur(var(--glass-blur)) saturate(180%)',
  WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(180%)',
  border: '0.5px solid var(--glass-border)',
  boxShadow: 'var(--glass-shadow)',
  display: 'flex',
  flexDirection: 'column',
};

export function GlassCard({ children, tone, onOpen, style, ...rest }: GlassCardProps) {
  // Default test selector is data-testid="glass-card"; consumer cards override
  // (e.g. data-testid="stove-card") via the rest['data-testid'] passthrough.
  const testId = rest['data-testid'] ?? 'glass-card';

  const inner = (
    <>
      {tone && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.55,
            pointerEvents: 'none',
            background: `radial-gradient(120% 70% at 100% 0%, ${tone} 0%, transparent 55%)`,
          }}
        />
      )}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          pointerEvents: 'none',
          boxShadow: 'inset 1px 1px 0 rgba(255,255,255,0.08)',
        }}
      />
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
        }}
      >
        {children}
      </div>
    </>
  );

  if (onOpen) {
    return (
      <Pressable
        data-testid={testId}
        onClick={onOpen}
        style={{ ...baseStyle, cursor: 'pointer', ...style }}
      >
        {inner}
      </Pressable>
    );
  }
  return (
    <div data-testid={testId} style={{ ...baseStyle, ...style }}>
      {inner}
    </div>
  );
}
