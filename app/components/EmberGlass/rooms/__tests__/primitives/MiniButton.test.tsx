/**
 * Phase 179 — MiniButton primitive spec
 * Bundle analog: rooms.jsx:591-604
 * TDD RED: tests written before component exists.
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { Power } from 'lucide-react';
import { MiniButton } from '../../primitives/MiniButton';

describe('MiniButton (D-36)', () => {
  test('renders label-only when only label prop is given', () => {
    render(<MiniButton label="Power" />);
    expect(screen.getByText('Power')).toBeInTheDocument();
  });

  test('renders icon+label when both props are provided', () => {
    render(<MiniButton Icon={Power} label="Power" />);
    expect(screen.getByText('Power')).toBeInTheDocument();
    // lucide icon renders as SVG
    const { container } = render(<MiniButton Icon={Power} label="Power" />);
    expect(container.querySelector('svg')).not.toBeNull();
  });

  test('filled=true applies tone-tinted background style', () => {
    const { container } = render(<MiniButton label="Power" filled tone="#f5c84a" />);
    const btn = container.querySelector('button') as HTMLButtonElement;
    const style = btn.getAttribute('style') ?? '';
    expect(style).toContain('#f5c84a');
  });

  test('onClick fires when clicked and not disabled', () => {
    const onClick = jest.fn();
    render(<MiniButton label="Power" onClick={onClick} />);
    fireEvent.click(screen.getByText('Power'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test('disabled=true does NOT fire onClick', () => {
    const onClick = jest.fn();
    render(<MiniButton label="Power" onClick={onClick} disabled />);
    fireEvent.click(screen.getByText('Power'));
    expect(onClick).not.toHaveBeenCalled();
  });

  test('disabled=true applies opacity 0.5 in inline style', () => {
    const { container } = render(<MiniButton label="Power" disabled />);
    const btn = container.querySelector('button') as HTMLButtonElement;
    const style = btn.getAttribute('style') ?? '';
    expect(style).toContain('0.5');
  });

  test('default tone is var(--accent) when no tone prop is passed', () => {
    const { container } = render(<MiniButton label="Power" filled />);
    const btn = container.querySelector('button') as HTMLButtonElement;
    const style = btn.getAttribute('style') ?? '';
    expect(style).toContain('var(--accent)');
  });

  describe('pending (ROADMAP M81)', () => {
    test('not pending: no spinner, no busy state', () => {
      render(<MiniButton Icon={Power} label="Power" />);
      const btn = screen.getByTestId('mini-button-power');
      expect(btn).not.toHaveAttribute('aria-busy');
      expect(btn).not.toHaveAttribute('aria-disabled');
      expect(screen.queryByTestId('mini-button-spinner')).not.toBeInTheDocument();
      expect(btn.querySelector('svg.lucide-power')).not.toBeNull();
    });

    test('pending: spinner in place of the icon, label still shown', () => {
      render(<MiniButton Icon={Power} label="Power" pending />);
      const btn = screen.getByTestId('mini-button-power');
      expect(screen.getByTestId('mini-button-spinner')).toBeInTheDocument();
      expect(btn.querySelector('svg.lucide-power')).toBeNull();
      expect(screen.getByText('Power')).toBeInTheDocument();
      expect(btn).toHaveAccessibleName('Power');
    });

    test('pending: spinner shown also without an icon', () => {
      render(<MiniButton label="Power" pending />);
      expect(screen.getByTestId('mini-button-spinner')).toBeInTheDocument();
    });

    test('pending: busy and aria-disabled, but not natively disabled nor dimmed', () => {
      render(<MiniButton label="Power" pending />);
      const btn = screen.getByTestId('mini-button-power');
      expect(btn).toHaveAttribute('aria-busy', 'true');
      expect(btn).toHaveAttribute('aria-disabled', 'true');
      expect(btn).toBeEnabled();
      expect(btn.style.opacity).toBe('1');
      expect(btn.style.cursor).toBe('default');
    });

    test('pending: a tap does NOT fire onClick', () => {
      const onClick = jest.fn();
      render(<MiniButton label="Power" onClick={onClick} pending />);
      fireEvent.click(screen.getByTestId('mini-button-power'));
      fireEvent.click(screen.getByTestId('mini-button-power'));
      expect(onClick).not.toHaveBeenCalled();
    });

    test('onClick fires again once pending is over', () => {
      const onClick = jest.fn();
      const { rerender } = render(<MiniButton label="Power" onClick={onClick} pending />);
      fireEvent.click(screen.getByTestId('mini-button-power'));
      rerender(<MiniButton label="Power" onClick={onClick} />);
      expect(screen.queryByTestId('mini-button-spinner')).not.toBeInTheDocument();
      fireEvent.click(screen.getByTestId('mini-button-power'));
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    test('disabled wins over pending for the cursor', () => {
      render(<MiniButton label="Power" disabled pending />);
      const btn = screen.getByTestId('mini-button-power');
      expect(btn).toBeDisabled();
      expect(btn.style.cursor).toBe('not-allowed');
    });
  });
});
