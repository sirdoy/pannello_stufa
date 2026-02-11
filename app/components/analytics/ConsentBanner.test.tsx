import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ConsentBanner from './ConsentBanner';
import * as analyticsConsentService from '@/lib/analyticsConsentService';

// Mock analyticsConsentService
jest.mock('@/lib/analyticsConsentService');

describe('ConsentBanner', () => {
  const mockedGetConsentState = jest.mocked(analyticsConsentService.getConsentState);
  const mockedSetConsentState = jest.mocked(analyticsConsentService.setConsentState);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not render when consent already granted', () => {
    mockedGetConsentState.mockReturnValue('granted');

    const { container } = render(<ConsentBanner />);

    // Banner should not be in DOM
    expect(container.firstChild).toBeNull();
  });

  it('does not render when consent already denied', () => {
    mockedGetConsentState.mockReturnValue('denied');

    const { container } = render(<ConsentBanner />);

    // Banner should not be in DOM
    expect(container.firstChild).toBeNull();
  });

  it('renders when consent is unknown', async () => {
    mockedGetConsentState.mockReturnValue('unknown');

    render(<ConsentBanner />);

    // Wait for useEffect to run
    await waitFor(() => {
      expect(screen.getByText('Analytics & Usage Statistics')).toBeInTheDocument();
    });
  });

  it('shows both buttons with identical styling', async () => {
    mockedGetConsentState.mockReturnValue('unknown');

    render(<ConsentBanner />);

    await waitFor(() => {
      expect(screen.getByText('Analytics & Usage Statistics')).toBeInTheDocument();
    });

    // Find both buttons
    const acceptButton = screen.getByRole('button', { name: /accept analytics/i });
    const rejectButton = screen.getByRole('button', { name: /reject analytics/i });

    // Both buttons should exist
    expect(acceptButton).toBeInTheDocument();
    expect(rejectButton).toBeInTheDocument();

    // Both should have flex-1 class for equal width
    expect(acceptButton).toHaveClass('flex-1');
    expect(rejectButton).toHaveClass('flex-1');
  });

  it('calls setConsentState(true) when Accept clicked', async () => {
    mockedGetConsentState.mockReturnValue('unknown');

    render(<ConsentBanner />);

    await waitFor(() => {
      expect(screen.getByText('Analytics & Usage Statistics')).toBeInTheDocument();
    });

    const acceptButton = screen.getByRole('button', { name: /accept analytics/i });
    fireEvent.click(acceptButton);

    expect(mockedSetConsentState).toHaveBeenCalledWith(true);
    // Note: window.location.reload() is called but cannot be tested in jsdom
  });

  it('calls setConsentState(false) when Reject clicked', async () => {
    mockedGetConsentState.mockReturnValue('unknown');

    render(<ConsentBanner />);

    await waitFor(() => {
      expect(screen.getByText('Analytics & Usage Statistics')).toBeInTheDocument();
    });

    const rejectButton = screen.getByRole('button', { name: /reject analytics/i });
    fireEvent.click(rejectButton);

    expect(mockedSetConsentState).toHaveBeenCalledWith(false);
    // Note: No reload on reject (component doesn't call it)
  });

  it('hides banner after Accept clicked', async () => {
    mockedGetConsentState.mockReturnValue('unknown');

    const { container } = render(<ConsentBanner />);

    await waitFor(() => {
      expect(screen.getByText('Analytics & Usage Statistics')).toBeInTheDocument();
    });

    const acceptButton = screen.getByRole('button', { name: /accept analytics/i });
    fireEvent.click(acceptButton);

    // Banner should be removed from DOM
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it('hides banner after Reject clicked', async () => {
    mockedGetConsentState.mockReturnValue('unknown');

    const { container } = render(<ConsentBanner />);

    await waitFor(() => {
      expect(screen.getByText('Analytics & Usage Statistics')).toBeInTheDocument();
    });

    const rejectButton = screen.getByRole('button', { name: /reject analytics/i });
    fireEvent.click(rejectButton);

    // Banner should be removed from DOM
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it('mentions essential controls work without consent', async () => {
    mockedGetConsentState.mockReturnValue('unknown');

    render(<ConsentBanner />);

    await waitFor(() => {
      // Check text content includes "essential" message
      expect(screen.getByText(/essential stove controls work without consent/i)).toBeInTheDocument();
    });
  });

  it('has accessible labels on buttons', async () => {
    mockedGetConsentState.mockReturnValue('unknown');

    render(<ConsentBanner />);

    await waitFor(() => {
      expect(screen.getByText('Analytics & Usage Statistics')).toBeInTheDocument();
    });

    // Check aria-label attributes exist
    const acceptButton = screen.getByLabelText('Accept analytics tracking');
    const rejectButton = screen.getByLabelText('Reject analytics tracking');

    expect(acceptButton).toBeInTheDocument();
    expect(rejectButton).toBeInTheDocument();
  });
});
