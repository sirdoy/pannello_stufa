/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DeviceCardErrorBoundary from '@/app/components/ErrorBoundary/DeviceCardErrorBoundary';
import { ValidationError } from '@/lib/errors';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock UI components
jest.mock('@/app/components/ui', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card" className={className}>
      {children}
    </div>
  ),
  Button: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick: () => void;
  }) => (
    <button data-testid="button" onClick={onClick}>
      {children}
    </button>
  ),
  Heading: ({ children }: { children: React.ReactNode }) => (
    <h3 data-testid="heading">{children}</h3>
  ),
  Text: ({ children }: { children: React.ReactNode }) => (
    <p data-testid="text">{children}</p>
  ),
}));

describe('DeviceCardErrorBoundary', () => {
  // Suppress console.error for error boundary tests
  const originalError = console.error;

  beforeAll(() => {
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalError;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);
  });

  // Test component that throws an error
  const BrokenComponent = ({ shouldThrow = true }: { shouldThrow?: boolean }) => {
    if (shouldThrow) {
      throw new Error('Component crashed');
    }
    return <div data-testid="working-component">Working</div>;
  };

  // Test component that throws ValidationError
  const ValidationBrokenComponent = () => {
    throw ValidationError.maintenanceRequired({ reason: 'test' });
  };

  it('renders children when no error occurs', () => {
    render(
      <DeviceCardErrorBoundary deviceName="Stufa" deviceIcon="🔥">
        <BrokenComponent shouldThrow={false} />
      </DeviceCardErrorBoundary>
    );

    expect(screen.getByTestId('working-component')).toBeInTheDocument();
  });

  it('shows ErrorFallback when child throws Error (crash isolation)', () => {
    render(
      <DeviceCardErrorBoundary deviceName="Stufa" deviceIcon="🔥">
        <BrokenComponent />
      </DeviceCardErrorBoundary>
    );

    // Should show error fallback UI
    expect(screen.getByTestId('heading')).toHaveTextContent('Errore: Stufa');
    expect(screen.getByText('🔥')).toBeInTheDocument();
    expect(screen.getByTestId('text')).toHaveTextContent('Component crashed');
    expect(screen.getByTestId('button')).toHaveTextContent('Riprova');
  });

  it('does NOT show ErrorFallback when child throws ValidationError (re-thrown, bypasses boundary)', () => {
    // Wrap in a parent error boundary to catch the re-thrown ValidationError
    class ParentBoundary extends React.Component<
      { children: React.ReactNode },
      { error: Error | null }
    > {
      state: { error: Error | null } = { error: null };

      static getDerivedStateFromError(error: Error) {
        return { error };
      }

      render() {
        const { error } = this.state;
        if (error) {
          return <div data-testid="parent-caught">Parent caught: {error.message}</div>;
        }
        return this.props.children;
      }
    }

    render(
      <ParentBoundary>
        <DeviceCardErrorBoundary deviceName="Stufa" deviceIcon="🔥">
          <ValidationBrokenComponent />
        </DeviceCardErrorBoundary>
      </ParentBoundary>
    );

    // ValidationError should bypass DeviceCardErrorBoundary and be caught by parent
    expect(screen.getByTestId('parent-caught')).toHaveTextContent(
      'Manutenzione richiesta - Conferma la pulizia prima di accendere'
    );
  });

  it('calls fetch to /api/analytics/error when error is caught (fire-and-forget logging)', async () => {
    render(
      <DeviceCardErrorBoundary deviceName="Stufa" deviceIcon="🔥">
        <BrokenComponent />
      </DeviceCardErrorBoundary>
    );

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/analytics/error',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    );
  });

  it('fetch body includes device name and error message', async () => {
    render(
      <DeviceCardErrorBoundary deviceName="Stufa" deviceIcon="🔥">
        <BrokenComponent />
      </DeviceCardErrorBoundary>
    );

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    const fetchCall = mockFetch.mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);

    expect(body).toEqual({
      device: 'Stufa',
      component: 'DeviceCard',
      message: 'Component crashed',
      stack: expect.any(String),
    });
  });

  it('clicking "Riprova" resets boundary and re-renders children', async () => {
    let shouldThrow = true;

    const ToggleableComponent = () => {
      if (shouldThrow) {
        throw new Error('Component crashed');
      }
      return <div data-testid="working-component">Working after reset</div>;
    };

    render(
      <DeviceCardErrorBoundary deviceName="Stufa" deviceIcon="🔥">
        <ToggleableComponent />
      </DeviceCardErrorBoundary>
    );

    // Should show error fallback
    expect(screen.getByTestId('heading')).toHaveTextContent('Errore: Stufa');

    // Disable error before clicking reset
    shouldThrow = false;

    // Click Riprova button
    fireEvent.click(screen.getByTestId('button'));

    // Should show working component after reset
    await waitFor(() => {
      expect(screen.getByTestId('working-component')).toBeInTheDocument();
    });
  });

  it('handles fetch failure gracefully (fire-and-forget)', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    render(
      <DeviceCardErrorBoundary deviceName="Stufa" deviceIcon="🔥">
        <BrokenComponent />
      </DeviceCardErrorBoundary>
    );

    // Should still show error fallback despite fetch failure
    expect(screen.getByTestId('heading')).toHaveTextContent('Errore: Stufa');

    // Fetch was attempted
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    // No error thrown (fire-and-forget)
  });
});
