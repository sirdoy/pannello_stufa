/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorFallback from '@/app/components/ErrorBoundary/ErrorFallback';

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

describe('ErrorFallback', () => {
  const mockResetErrorBoundary = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders device name in heading', () => {
    const error = new Error('Test error');

    render(
      <ErrorFallback
        error={error}
        resetErrorBoundary={mockResetErrorBoundary}
        deviceName="Stufa"
        deviceIcon="🔥"
      />
    );

    expect(screen.getByTestId('heading')).toHaveTextContent('Errore: Stufa');
  });

  it('renders device icon', () => {
    const error = new Error('Test error');

    render(
      <ErrorFallback
        error={error}
        resetErrorBoundary={mockResetErrorBoundary}
        deviceName="Stufa"
        deviceIcon="🔥"
      />
    );

    expect(screen.getByText('🔥')).toBeInTheDocument();
  });

  it('renders error message from error prop', () => {
    const error = new Error('Something went wrong');

    render(
      <ErrorFallback
        error={error}
        resetErrorBoundary={mockResetErrorBoundary}
        deviceName="Stufa"
        deviceIcon="🔥"
      />
    );

    expect(screen.getByTestId('text')).toHaveTextContent('Something went wrong');
  });

  it('renders "Riprova" button', () => {
    const error = new Error('Test error');

    render(
      <ErrorFallback
        error={error}
        resetErrorBoundary={mockResetErrorBoundary}
        deviceName="Stufa"
        deviceIcon="🔥"
      />
    );

    expect(screen.getByTestId('button')).toHaveTextContent('Riprova');
  });

  it('calls resetErrorBoundary when Riprova button is clicked', () => {
    const error = new Error('Test error');

    render(
      <ErrorFallback
        error={error}
        resetErrorBoundary={mockResetErrorBoundary}
        deviceName="Stufa"
        deviceIcon="🔥"
      />
    );

    fireEvent.click(screen.getByTestId('button'));

    expect(mockResetErrorBoundary).toHaveBeenCalledTimes(1);
  });

  it('shows fallback message when error has no message', () => {
    const error = {} as Error; // Error without message property

    render(
      <ErrorFallback
        error={error}
        resetErrorBoundary={mockResetErrorBoundary}
        deviceName="Stufa"
        deviceIcon="🔥"
      />
    );

    expect(screen.getByTestId('text')).toHaveTextContent(
      'Si è verificato un errore imprevisto'
    );
  });
});
