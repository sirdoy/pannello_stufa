import { render } from '@testing-library/react';
import { PlayingBars } from '../PlayingBars';

describe('PlayingBars (EmberGlass primitive — Phase 177 / DASH-05)', () => {
  test('renders container with data-testid="playing-bars"', () => {
    const { getByTestId } = render(<PlayingBars />);
    expect(getByTestId('playing-bars')).not.toBeNull();
  });

  test('renders exactly 3 inner bar children', () => {
    const { getByTestId } = render(<PlayingBars />);
    const container = getByTestId('playing-bars');
    expect(container.children.length).toBe(3);
  });

  test('each bar has the matching sonosBar{i} animation', () => {
    const { getByTestId } = render(<PlayingBars />);
    const container = getByTestId('playing-bars');
    const bars = Array.from(container.children) as HTMLElement[];
    expect(bars[0]?.style.animation).toContain('sonosBar0');
    expect(bars[1]?.style.animation).toContain('sonosBar1');
    expect(bars[2]?.style.animation).toContain('sonosBar2');
  });

  test('container has flex-end alignment and 9px height (bundle cards.jsx:273)', () => {
    const { getByTestId } = render(<PlayingBars />);
    const container = getByTestId('playing-bars');
    expect(container.style.display).toBe('flex');
    expect(container.style.alignItems).toBe('flex-end');
    expect(container.style.height).toMatch(/9px/);
  });
});
