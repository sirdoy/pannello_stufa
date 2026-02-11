/**
 * Unit tests for Thermostat Settings Page
 * Tests auth race condition fix
 */

import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import ThermostatSettingsPage from '@/app/settings/thermostat/page';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock Auth0 useUser hook
jest.mock('@auth0/nextjs-auth0/client', () => ({
  useUser: jest.fn(),
}));

// Mock child components
jest.mock('@/app/components/SettingsLayout', () => {
  return function MockSettingsLayout({ children, title }: any) {
    return (
      <div data-testid="settings-layout">
        <h1>{title}</h1>
        {children}
      </div>
    );
  };
});

jest.mock('@/app/components/netatmo/StoveSyncPanel', () => {
  return function MockStoveSyncPanel() {
    return <div data-testid="stove-sync-panel">StoveSyncPanel</div>;
  };
});

jest.mock('@/app/components/netatmo/PidAutomationPanel', () => {
  return function MockPidAutomationPanel() {
    return <div data-testid="pid-automation-panel">PidAutomationPanel</div>;
  };
});

describe('ThermostatSettingsPage - Auth Race Condition Fix', () => {
  const mockPush = jest.fn();
  const mockUseUser = require('@auth0/nextjs-auth0/client').useUser;

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  });

  it('should show loading skeleton while auth is loading', () => {
    // Auth is still loading
    mockUseUser.mockReturnValue({ user: null, isLoading: true });

    render(<ThermostatSettingsPage />);

    // Should show settings layout with title
    expect(screen.getByText('Impostazioni termostato')).toBeInTheDocument();

    // Should show skeleton (check for animate-pulse class or shimmer)
    const skeleton = document.querySelector('[class*="animate"]');
    expect(skeleton).toBeTruthy();

    // Should NOT show actual content yet
    expect(screen.queryByTestId('stove-sync-panel')).not.toBeInTheDocument();
    expect(screen.queryByTestId('pid-automation-panel')).not.toBeInTheDocument();
  });

  it('should redirect to login when not authenticated', async () => {
    // Auth finished loading, but no user
    mockUseUser.mockReturnValue({ user: null, isLoading: false });

    render(<ThermostatSettingsPage />);

    // Should trigger redirect to login
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/auth/login');
    });

    // Should show redirect message (briefly before redirect)
    expect(screen.getByText(/Accesso richiesto/i)).toBeInTheDocument();
  });

  it('should render content when authenticated', () => {
    // Auth finished loading, user is authenticated
    const mockUser = { sub: 'auth0|123', email: 'test@example.com' };
    mockUseUser.mockReturnValue({ user: mockUser, isLoading: false });

    render(<ThermostatSettingsPage />);

    // Should show settings layout
    expect(screen.getByText('Impostazioni termostato')).toBeInTheDocument();

    // Should show both panels
    expect(screen.getByTestId('stove-sync-panel')).toBeInTheDocument();
    expect(screen.getByTestId('pid-automation-panel')).toBeInTheDocument();

    // Should NOT redirect
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should not make API calls while auth is loading', () => {
    // Auth is still loading
    mockUseUser.mockReturnValue({ user: null, isLoading: true });

    const { container } = render(<ThermostatSettingsPage />);

    // Verify panels are not rendered (so they can't make API calls)
    expect(screen.queryByTestId('stove-sync-panel')).not.toBeInTheDocument();
    expect(screen.queryByTestId('pid-automation-panel')).not.toBeInTheDocument();

    // Verify only skeleton is shown
    const skeleton = container.querySelector('[class*="Skeleton"]');
    expect(skeleton || container.innerHTML.includes('animate')).toBeTruthy();
  });

  it('should handle auth state transitions correctly', async () => {
    // Start with loading state
    const { rerender } = render(<ThermostatSettingsPage />);
    mockUseUser.mockReturnValue({ user: null, isLoading: true });

    // Should show skeleton
    expect(screen.queryByTestId('stove-sync-panel')).not.toBeInTheDocument();

    // Auth completes - user is authenticated
    const mockUser = { sub: 'auth0|123', email: 'test@example.com' };
    mockUseUser.mockReturnValue({ user: mockUser, isLoading: false });
    rerender(<ThermostatSettingsPage />);

    // Should now show content
    await waitFor(() => {
      expect(screen.getByTestId('stove-sync-panel')).toBeInTheDocument();
      expect(screen.getByTestId('pid-automation-panel')).toBeInTheDocument();
    });
  });
});
