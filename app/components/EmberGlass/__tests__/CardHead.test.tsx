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
    // First inner div is the tile (parent has display:flex row); look for color-mix substring
    const tile = container.querySelector('div > div') as HTMLElement;
    expect(tile.style.background).toContain('color-mix');
    expect(tile.style.background).toContain('#f5c84a');
  });

  test('label has fontSize: 13 (px)', () => {
    const { getByText } = render(<CardHead Icon={Flame} label="Climate" tone="#5eafff" />);
    const label = getByText('Climate') as HTMLElement;
    expect(label.style.fontSize).toBe('13px');
  });
});
