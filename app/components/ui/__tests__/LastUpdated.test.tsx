/**
 * LastUpdated Component Tests
 */
import { render, screen } from '@testing-library/react';
import { LastUpdated } from '../LastUpdated';

// Mock useRelativeTime to isolate component from hook logic
jest.mock('@/lib/hooks/useRelativeTime', () => ({
  useRelativeTime: jest.fn(),
}));

import { useRelativeTime } from '@/lib/hooks/useRelativeTime';

const mockUseRelativeTime = jest.mocked(useRelativeTime);

describe('LastUpdated', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders null when tsMs is null', () => {
    mockUseRelativeTime.mockReturnValue(null);
    const { container } = render(<LastUpdated tsMs={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders "Aggiornato Adesso" when relative time is "Adesso"', () => {
    mockUseRelativeTime.mockReturnValue('Adesso');
    render(<LastUpdated tsMs={Date.now()} />);
    expect(screen.getByText('Aggiornato Adesso')).toBeInTheDocument();
  });

  it('renders "Aggiornato 30s fa" when relative time is "30s fa"', () => {
    mockUseRelativeTime.mockReturnValue('30s fa');
    render(<LastUpdated tsMs={Date.now() - 30_000} />);
    expect(screen.getByText('Aggiornato 30s fa')).toBeInTheDocument();
  });

  it('has className "text-xs" applied', () => {
    mockUseRelativeTime.mockReturnValue('Adesso');
    render(<LastUpdated tsMs={Date.now()} />);
    const el = screen.getByText('Aggiornato Adesso');
    expect(el).toHaveClass('text-xs');
  });

  it('accepts and applies custom className prop', () => {
    mockUseRelativeTime.mockReturnValue('Adesso');
    render(<LastUpdated tsMs={Date.now()} className="my-custom-class" />);
    const el = screen.getByText('Aggiornato Adesso');
    expect(el).toHaveClass('my-custom-class');
  });

  it('passes tsMs to useRelativeTime hook', () => {
    mockUseRelativeTime.mockReturnValue('2m fa');
    const ts = Date.now() - 120_000;
    render(<LastUpdated tsMs={ts} />);
    expect(mockUseRelativeTime).toHaveBeenCalledWith(ts);
  });
});
