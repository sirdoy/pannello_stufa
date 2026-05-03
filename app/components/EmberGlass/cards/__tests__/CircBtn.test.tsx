import { fireEvent, render, screen } from '@testing-library/react';
import { Plus } from 'lucide-react';
import { CircBtn } from '../CircBtn';

describe('CircBtn (D-09)', () => {
  test('renders a 34x34 button', () => {
    render(<CircBtn Icon={Plus} onClick={() => undefined} tone="var(--accent)" />);
    const btn = screen.getByRole('button') as HTMLButtonElement;
    expect(btn).toBeInTheDocument();
    const style = btn.getAttribute('style') ?? '';
    expect(style).toContain('width: 34px');
    expect(style).toContain('height: 34px');
    expect(style).toContain('border-radius: 999px');
  });

  test('primary variant uses tone as background', () => {
    render(<CircBtn Icon={Plus} onClick={() => undefined} primary tone="#ff6600" />);
    const btn = screen.getByTestId('circ-btn-primary');
    const style = btn.getAttribute('style') ?? '';
    // Browsers may serialize as rgb() or hex — accept either.
    expect(style).toMatch(/background: (#ff6600|rgb\(255, 102, 0\))/);
  });

  test('default variant uses rgba(255,255,255,0.08) as background', () => {
    render(<CircBtn Icon={Plus} onClick={() => undefined} tone="var(--accent)" />);
    const btn = screen.getByTestId('circ-btn');
    const style = btn.getAttribute('style') ?? '';
    expect(style).toContain('rgba(255, 255, 255, 0.08)');
  });

  test('click fires onClick once', () => {
    const onClick = jest.fn();
    render(<CircBtn Icon={Plus} onClick={onClick} tone="var(--accent)" />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
