'use client';

/**
 * GlassCardSkeleton — Phase 177 (DASH-01 Suspense fallback).
 *
 * 1:1 square shimmer placeholder. Matches the GlassCard outer footprint
 * exactly so the dashboard does not shift on hydration.
 *
 * Tailwind `animate-pulse` is the single allowed Tailwind utility on this
 * primitive (D-02 carve-out for the shimmer); all other visual values stay
 * inline + `var(--token)` for bundle fidelity.
 */
export function GlassCardSkeleton() {
  return (
    <div
      data-testid="glass-card-skeleton"
      className="animate-pulse"
      style={{
        aspectRatio: '1 / 1',
        borderRadius: 'var(--r-card)',
        background: 'rgba(255, 255, 255, 0.05)',
        border: '0.5px solid var(--glass-border)',
      }}
    />
  );
}
