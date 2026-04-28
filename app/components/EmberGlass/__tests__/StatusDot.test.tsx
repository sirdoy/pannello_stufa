import { render } from '@testing-library/react';
import { StatusDot } from '../StatusDot';

describe('StatusDot (Phase 177 — DASH-01)', () => {
  test('on={true} with default color uses var(--accent) glow', () => {
    const { getByTestId } = render(<StatusDot on />);
    const el = getByTestId('status-dot');
    expect(el.style.background).toContain('var(--accent)');
    expect(el.style.boxShadow).toContain('12px');
    expect(el.style.boxShadow).toContain('var(--accent)');
    expect(el.getAttribute('data-on')).toBe('true');
  });

  test('on={false} renders neutral background and no glow', () => {
    const { getByTestId } = render(<StatusDot on={false} />);
    const el = getByTestId('status-dot');
    expect(el.style.background).toContain('rgba(255, 255, 255, 0.18)');
    expect(el.style.boxShadow).toBe('none');
    expect(el.getAttribute('data-on')).toBe('false');
  });

  test('custom color is honored when on={true}', () => {
    const { getByTestId } = render(<StatusDot on color="#5eafff" />);
    const el = getByTestId('status-dot');
    expect(el.style.background).toContain('#5eafff');
    expect(el.style.boxShadow).toContain('#5eafff');
  });
});
