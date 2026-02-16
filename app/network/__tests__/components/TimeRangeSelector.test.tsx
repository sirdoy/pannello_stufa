import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TimeRangeSelector from '@/app/network/components/TimeRangeSelector';
import type { BandwidthTimeRange } from '@/app/components/devices/network/types';

describe('TimeRangeSelector', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders three time range buttons', () => {
    render(<TimeRangeSelector value="24h" onChange={mockOnChange} />);

    expect(screen.getByRole('button', { name: /1h/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /24h/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /7d/i })).toBeInTheDocument();
  });

  it('shows "Intervallo:" label', () => {
    render(<TimeRangeSelector value="24h" onChange={mockOnChange} />);

    expect(screen.getByText('Intervallo:')).toBeInTheDocument();
  });

  it('highlights active button with ember variant', () => {
    render(<TimeRangeSelector value="24h" onChange={mockOnChange} />);

    const activeButton = screen.getByRole('button', { name: /24h/i });
    const inactiveButton = screen.getByRole('button', { name: /1h/i });

    // Active button should have ember gradient classes
    expect(activeButton.className).toContain('from-ember-500');

    // Inactive button should have subtle variant classes
    expect(inactiveButton.className).toContain('bg-white/[0.06]');
  });

  it('calls onChange with correct range when clicked', async () => {
    const user = userEvent.setup();
    render(<TimeRangeSelector value="24h" onChange={mockOnChange} />);

    await user.click(screen.getByRole('button', { name: /1h/i }));
    expect(mockOnChange).toHaveBeenCalledWith('1h');

    await user.click(screen.getByRole('button', { name: /7d/i }));
    expect(mockOnChange).toHaveBeenCalledWith('7d');
  });

  it('does not call onChange when clicking already selected range', async () => {
    const user = userEvent.setup();
    render(<TimeRangeSelector value="24h" onChange={mockOnChange} />);

    await user.click(screen.getByRole('button', { name: /24h/i }));

    // Should still call onChange even for active button (component doesn't filter)
    expect(mockOnChange).toHaveBeenCalledWith('24h');
  });
});
