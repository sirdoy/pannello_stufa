import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SonosSleepTimer from '../SonosSleepTimer';

describe('SonosSleepTimer', () => {
  const onSetTimer = jest.fn();

  beforeEach(() => {
    onSetTimer.mockClear();
  });

  it('renders preset buttons (15, 30, 45, 60, 90 min)', () => {
    render(<SonosSleepTimer remainingSeconds={null} onSetTimer={onSetTimer} />);
    const buttons = screen.getAllByRole('button');
    const presetButtons = buttons.filter(btn => /\d+ min/.test(btn.textContent ?? ''));
    expect(presetButtons).toHaveLength(5);
    expect(screen.getByText('15 min')).toBeInTheDocument();
    expect(screen.getByText('30 min')).toBeInTheDocument();
    expect(screen.getByText('45 min')).toBeInTheDocument();
    expect(screen.getByText('60 min')).toBeInTheDocument();
    expect(screen.getByText('90 min')).toBeInTheDocument();
  });

  it('shows remaining time when timer active', () => {
    render(<SonosSleepTimer remainingSeconds={2700} onSetTimer={onSetTimer} />);
    expect(screen.getByText('45:00')).toBeInTheDocument();
  });

  it('shows cancel button when timer active', () => {
    render(<SonosSleepTimer remainingSeconds={900} onSetTimer={onSetTimer} />);
    expect(screen.getByLabelText('Annulla timer')).toBeInTheDocument();
  });

  it('does not show cancel when no timer', () => {
    render(<SonosSleepTimer remainingSeconds={null} onSetTimer={onSetTimer} />);
    expect(screen.queryByLabelText('Annulla timer')).not.toBeInTheDocument();
  });

  it('clicking preset calls onSetTimer with seconds', () => {
    render(<SonosSleepTimer remainingSeconds={null} onSetTimer={onSetTimer} />);
    fireEvent.click(screen.getByText('30 min'));
    expect(onSetTimer).toHaveBeenCalledWith(1800);
  });

  it('clicking cancel calls onSetTimer with 0', () => {
    render(<SonosSleepTimer remainingSeconds={600} onSetTimer={onSetTimer} />);
    fireEvent.click(screen.getByLabelText('Annulla timer'));
    expect(onSetTimer).toHaveBeenCalledWith(0);
  });

  it('formats time with leading zeros correctly', () => {
    render(<SonosSleepTimer remainingSeconds={65} onSetTimer={onSetTimer} />);
    expect(screen.getByText('01:05')).toBeInTheDocument();
  });
});
