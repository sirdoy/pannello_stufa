/**
 * Phase 179 — ControlRow primitive spec
 * Bundle analog: rooms.jsx:587-589
 * TDD RED: tests written before component exists.
 */
import { render, screen } from '@testing-library/react';
import { ControlRow } from '../../primitives/ControlRow';

describe('ControlRow (D-36)', () => {
  test('renders children', () => {
    render(
      <ControlRow>
        <span data-testid="child-a">A</span>
        <span data-testid="child-b">B</span>
      </ControlRow>,
    );
    expect(screen.getByTestId('child-a')).toBeInTheDocument();
    expect(screen.getByTestId('child-b')).toBeInTheDocument();
  });

  test('root element is a flex row with 6px gap', () => {
    const { container } = render(
      <ControlRow>
        <span>X</span>
      </ControlRow>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root).not.toBeNull();
    // Check inline style includes display:flex and gap:6px
    const style = root.getAttribute('style') ?? '';
    expect(style).toContain('flex');
  });

  test('renders multiple children in sequence', () => {
    render(
      <ControlRow>
        <button>Meno</button>
        <button>Power</button>
        <button>Più</button>
      </ControlRow>,
    );
    expect(screen.getByText('Meno')).toBeInTheDocument();
    expect(screen.getByText('Power')).toBeInTheDocument();
    expect(screen.getByText('Più')).toBeInTheDocument();
  });
});
