import { render } from '@testing-library/react';
import { GlassCardSkeleton } from '../GlassCardSkeleton';

describe('GlassCardSkeleton (EmberGlass primitive — Phase 177 / DASH-01 fallback)', () => {
  test('has data-testid="glass-card-skeleton"', () => {
    const { getByTestId } = render(<GlassCardSkeleton />);
    expect(getByTestId('glass-card-skeleton')).not.toBeNull();
  });

  test('renders with aspectRatio "1 / 1" (DASH-01 1:1 footprint)', () => {
    const { getByTestId } = render(<GlassCardSkeleton />);
    const el = getByTestId('glass-card-skeleton');
    expect(el.style.aspectRatio).toBe('1 / 1');
  });

  test('className includes animate-pulse (D-02 carve-out for shimmer)', () => {
    const { getByTestId } = render(<GlassCardSkeleton />);
    expect(getByTestId('glass-card-skeleton').className).toContain('animate-pulse');
  });

  test('uses var(--r-card) for borderRadius and var(--glass-border) for border', () => {
    const { getByTestId } = render(<GlassCardSkeleton />);
    const el = getByTestId('glass-card-skeleton');
    expect(el.style.borderRadius).toContain('var(--r-card)');
    expect(el.style.border).toContain('var(--glass-border)');
  });
});
