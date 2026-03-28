/**
 * NavbarConnectionStatus Component Tests
 */
import { render, screen } from '@testing-library/react';
import { ReadyState } from 'react-use-websocket';
import { NavbarConnectionStatus, mapReadyState } from '../NavbarConnectionStatus';

jest.mock('@/app/context/WebSocketContext', () => ({
  useWebSocketContext: jest.fn(),
}));

import { useWebSocketContext } from '@/app/context/WebSocketContext';

const mockUseWebSocketContext = jest.mocked(useWebSocketContext);

describe('mapReadyState', () => {
  it('maps OPEN to online', () => {
    expect(mapReadyState(ReadyState.OPEN)).toBe('online');
  });

  it('maps CONNECTING to connecting', () => {
    expect(mapReadyState(ReadyState.CONNECTING)).toBe('connecting');
  });

  it('maps CLOSED to offline', () => {
    expect(mapReadyState(ReadyState.CLOSED)).toBe('offline');
  });

  it('maps CLOSING to offline', () => {
    expect(mapReadyState(ReadyState.CLOSING)).toBe('offline');
  });

  it('maps UNINSTANTIATED to offline', () => {
    expect(mapReadyState(ReadyState.UNINSTANTIATED)).toBe('offline');
  });
});

describe('NavbarConnectionStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders "Connesso via WS" when readyState is OPEN', () => {
    mockUseWebSocketContext.mockReturnValue({
      readyState: ReadyState.OPEN,
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
    });
    render(<NavbarConnectionStatus />);
    expect(screen.getByRole('status')).toHaveTextContent('Connesso via WS');
  });

  it('renders "Riconnessione..." when readyState is CONNECTING', () => {
    mockUseWebSocketContext.mockReturnValue({
      readyState: ReadyState.CONNECTING,
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
    });
    render(<NavbarConnectionStatus />);
    expect(screen.getByRole('status')).toHaveTextContent('Riconnessione...');
  });

  it('renders "Polling attivo" when readyState is CLOSED', () => {
    mockUseWebSocketContext.mockReturnValue({
      readyState: ReadyState.CLOSED,
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
    });
    render(<NavbarConnectionStatus />);
    expect(screen.getByRole('status')).toHaveTextContent('Polling attivo');
  });

  it('renders "Polling attivo" when readyState is CLOSING', () => {
    mockUseWebSocketContext.mockReturnValue({
      readyState: ReadyState.CLOSING,
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
    });
    render(<NavbarConnectionStatus />);
    expect(screen.getByRole('status')).toHaveTextContent('Polling attivo');
  });

  it('renders "Polling attivo" when readyState is UNINSTANTIATED', () => {
    mockUseWebSocketContext.mockReturnValue({
      readyState: ReadyState.UNINSTANTIATED,
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
    });
    render(<NavbarConnectionStatus />);
    expect(screen.getByRole('status')).toHaveTextContent('Polling attivo');
  });
});
