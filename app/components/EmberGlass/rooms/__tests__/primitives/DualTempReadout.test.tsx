/**
 * Phase 179 — DualTempReadout primitive spec
 * Bundle analog: rooms.jsx:530-557
 * TDD RED: tests written before component exists.
 */
import { render, screen } from '@testing-library/react';
import { DualTempReadout } from '../../primitives/DualTempReadout';

describe('DualTempReadout (D-36)', () => {
  test('renders current temperature formatted to 1 decimal', () => {
    render(<DualTempReadout current={21.3} target={22.0} tone="#b080ff" />);
    expect(screen.getByText(/21\.3/)).toBeInTheDocument();
  });

  test('renders target temperature formatted to 1 decimal', () => {
    render(<DualTempReadout current={21.3} target={22.0} tone="#b080ff" />);
    expect(screen.getByText(/22\.0/)).toBeInTheDocument();
  });

  test('renders "Attuale" label (Italian frozen copy)', () => {
    render(<DualTempReadout current={20.0} target={21.5} tone="var(--accent)" />);
    expect(screen.getByText('Attuale')).toBeInTheDocument();
  });

  test('renders "Target" label (Italian frozen copy)', () => {
    render(<DualTempReadout current={20.0} target={21.5} tone="var(--accent)" />);
    expect(screen.getByText('Target')).toBeInTheDocument();
  });

  test('target value element uses tone color in inline style', () => {
    const { container } = render(<DualTempReadout current={20.0} target={21.5} tone="#b080ff" />);
    // Find any element whose computed/inline style contains the tone color
    // React serializes inline style as semicolon-separated key:value pairs; check all elements
    const allElements = container.querySelectorAll('*');
    const hasTone = Array.from(allElements).some((el) => {
      const style = (el as HTMLElement).style;
      return style.color === 'rgb(176, 128, 255)' || // browser parses #b080ff → rgb
        (el.getAttribute('style') ?? '').toLowerCase().includes('#b080ff') ||
        (el.getAttribute('style') ?? '').toLowerCase().includes('b080ff');
    });
    expect(hasTone).toBe(true);
  });

  test('renders ChevronRight separator between Attuale and Target', () => {
    // lucide-react renders an SVG; check for svg presence
    const { container } = render(<DualTempReadout current={20.0} target={21.5} tone="var(--accent)" />);
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });
});
