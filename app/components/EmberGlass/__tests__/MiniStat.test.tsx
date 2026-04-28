import { render } from '@testing-library/react';
import { MiniStat } from '../MiniStat';

describe('MiniStat (Phase 177 — DASH-09)', () => {
  test('renders label and value text content', () => {
    const { getByText } = render(<MiniStat label="CPU" value="42%" bar={0.42} />);
    expect(getByText('CPU')).toBeInTheDocument();
    expect(getByText('42%')).toBeInTheDocument();
  });

  test('clamps bar=1.5 so fill width is 100%', () => {
    const { container } = render(<MiniStat label="RAM" value="100%" bar={1.5} />);
    // Track is the outer div with height 3; fill is the inner div
    const fill = container.querySelector('div > div > div') as HTMLElement;
    expect(fill).not.toBeNull();
    expect(fill.style.width).toBe('100%');
  });

  test('clamps bar=-0.5 so fill width is 0%', () => {
    const { container } = render(<MiniStat label="RAM" value="0%" bar={-0.5} />);
    const fill = container.querySelector('div > div > div') as HTMLElement;
    expect(fill).not.toBeNull();
    expect(fill.style.width).toBe('0%');
  });

  test('fill background uses var(--accent)', () => {
    const { container } = render(<MiniStat label="CPU" value="50%" bar={0.5} />);
    const fill = container.querySelector('div > div > div') as HTMLElement;
    expect(fill.style.background).toContain('var(--accent)');
  });
});
