/**
 * Phase 179 — StatChip primitive spec
 * Bundle analog: rooms.jsx:516-528
 * TDD RED: tests written before component exists.
 */
import { render, screen } from '@testing-library/react';
import { StatChip } from '../../primitives/StatChip';

describe('StatChip (D-36)', () => {
  test('renders given label text', () => {
    render(<StatChip label="Target" value="3/5" />);
    expect(screen.getByText('Target')).toBeInTheDocument();
  });

  test('renders given value text', () => {
    render(<StatChip label="Fiamma" value="3" />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  test('value element has tabular-nums fontVariantNumeric', () => {
    const { container } = render(<StatChip label="Ora" value="450W" />);
    // Find the div containing the value — it should have fontVariantNumeric: 'tabular-nums'
    const valueEl = container.querySelector('[style*="tabular-nums"]');
    expect(valueEl).not.toBeNull();
  });

  test('accepts tone prop without crash', () => {
    expect(() => render(<StatChip label="Ora" value="450W" tone="#f5c84a" />)).not.toThrow();
  });

  test('accepts numeric value prop', () => {
    render(<StatChip label="Ventola" value={5} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });
});
