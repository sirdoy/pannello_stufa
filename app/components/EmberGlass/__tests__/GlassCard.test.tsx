import { fireEvent, render } from '@testing-library/react';
import { GlassCard } from '../GlassCard';

describe('GlassCard (Phase 177 — DASH-01)', () => {
  test('renders 1:1 aspect-ratio + glass tokens with no onOpen (no cursor pointer)', () => {
    const { getByTestId } = render(<GlassCard>x</GlassCard>);
    const el = getByTestId('glass-card');
    expect(el.style.aspectRatio).toBe('1 / 1');
    expect(el.style.borderRadius).toContain('var(--r-card)');
    expect(el.style.padding).toContain('var(--pad-card)');
    expect(el.style.background).toContain('var(--glass-bg)');
    expect(el.style.cursor).not.toBe('pointer');
  });

  test('with onOpen wraps in Pressable + cursor pointer + onClick fires onOpen exactly once', () => {
    const onOpen = jest.fn();
    const { getByTestId } = render(<GlassCard onOpen={onOpen}>x</GlassCard>);
    const el = getByTestId('glass-card');
    expect(el.style.cursor).toBe('pointer');
    // Pressable owns the press transition (transform/transition spread last)
    expect(el.style.transition).toContain('cubic-bezier(.34,1.56,.64,1)');
    fireEvent.click(el);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  test('with tone renders a radial-gradient overlay child using the tone color', () => {
    const { getByTestId } = render(<GlassCard tone="#ffb84a">x</GlassCard>);
    const el = getByTestId('glass-card');
    const overlay = Array.from(el.querySelectorAll('div')).find((d) =>
      (d.style.background || '').includes('radial-gradient'),
    ) as HTMLElement | undefined;
    expect(overlay).toBeDefined();
    expect(overlay!.style.background).toContain('radial-gradient');
    expect(overlay!.style.background).toContain('#ffb84a');
    expect(overlay!.style.opacity).toBe('0.55');
  });

  test('data-testid prop overrides default glass-card id', () => {
    const { getByTestId, queryByTestId } = render(
      <GlassCard data-testid="stove-card">x</GlassCard>,
    );
    expect(getByTestId('stove-card')).toBeInTheDocument();
    expect(queryByTestId('glass-card')).toBeNull();
  });
});
