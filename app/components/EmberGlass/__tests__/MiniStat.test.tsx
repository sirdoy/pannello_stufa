import { render } from '@testing-library/react';
import { MiniStat } from '../MiniStat';

describe('MiniStat (Phase 177 — DASH-09)', () => {
  test('renders label and value text content', () => {
    const { getByText } = render(<MiniStat label="CPU" value="42%" bar={0.42} />);
    expect(getByText('CPU')).toBeInTheDocument();
    expect(getByText('42%')).toBeInTheDocument();
  });

  // Helper: pick the fill div (inner div whose width style is a percent string).
  function findFill(container: HTMLElement): HTMLElement {
    const candidates = Array.from(container.querySelectorAll('div')) as HTMLElement[];
    const fill = candidates.find(
      (d) => typeof d.style.width === 'string' && d.style.width.endsWith('%'),
    );
    if (!fill) throw new Error('MiniStat fill div not found');
    return fill;
  }

  test('clamps bar=1.5 so fill width is 100%', () => {
    const { container } = render(<MiniStat label="RAM" value="100%" bar={1.5} />);
    expect(findFill(container).style.width).toBe('100%');
  });

  test('clamps bar=-0.5 so fill width is 0%', () => {
    const { container } = render(<MiniStat label="RAM" value="0%" bar={-0.5} />);
    expect(findFill(container).style.width).toBe('0%');
  });

  test('fill background uses var(--accent)', () => {
    const { container } = render(<MiniStat label="CPU" value="50%" bar={0.5} />);
    expect(findFill(container).style.background).toContain('var(--accent)');
  });
});
