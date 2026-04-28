import { render } from '@testing-library/react';
import { Flame } from 'lucide-react';
import { CardHead } from '../CardHead';

describe('CardHead (Phase 177 — DASH-01)', () => {
  test('renders icon, label, and right slot when provided', () => {
    const { container, getByText } = render(
      <CardHead
        Icon={Flame}
        label="Stufa"
        tone="#ff7a4a"
        right={<span data-testid="right-slot">RIGHT</span>}
      />,
    );
    // Icon present (lucide-react renders an svg)
    expect(container.querySelector('svg')).not.toBeNull();
    // Label rendered with the right text
    expect(getByText('Stufa')).toBeInTheDocument();
    // Right slot rendered
    const right = container.querySelector('[data-testid="right-slot"]');
    expect(right).not.toBeNull();
  });

  test('tile background uses color-mix with the tone color', () => {
    const { container } = render(<CardHead Icon={Flame} label="Lights" tone="#f5c84a" />);
    // The tile is the first inner div of the row whose width style is set (32px).
    const divs = Array.from(container.querySelectorAll('div')) as HTMLElement[];
    const tile = divs.find((d) => d.style.width === '32px');
    expect(tile).toBeDefined();
    expect(tile!.style.background).toContain('color-mix');
    // jsdom normalizes hex → rgb inside color-mix(); assert via rgb form.
    expect(tile!.style.background).toContain('rgb(245, 200, 74)');
  });

  test('label has fontSize: 13 (px)', () => {
    const { getByText } = render(<CardHead Icon={Flame} label="Climate" tone="#5eafff" />);
    const label = getByText('Climate') as HTMLElement;
    expect(label.style.fontSize).toBe('13px');
  });
});
