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
});
