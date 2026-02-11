import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import OfflineBanner from '../OfflineBanner';
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus';
import { useBackgroundSync } from '@/lib/hooks/useBackgroundSync';

// Mock the hooks
jest.mock('@/lib/hooks/useOnlineStatus', () => ({
  useOnlineStatus: jest.fn(),
}));

jest.mock('@/lib/hooks/useBackgroundSync', () => ({
  useBackgroundSync: jest.fn(),
}));

// Mock date-fns formatDistanceToNow for consistent testing
jest.mock('date-fns', () => ({
  formatDistanceToNow: jest.fn(() => '5 minuti fa'),
}));

const mockUseOnlineStatus = useOnlineStatus as jest.MockedFunction<typeof useOnlineStatus>;
const mockUseBackgroundSync = useBackgroundSync as jest.MockedFunction<typeof useBackgroundSync>;

describe('OfflineBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock values
    mockUseOnlineStatus.mockReturnValue({
      isOnline: true,
      wasOffline: false,
      lastOnlineAt: new Date(),
      offlineSince: null,
      checkConnection: jest.fn(),
    });

    mockUseBackgroundSync.mockReturnValue({
      pendingCommands: [],
      failedCommands: [],
      pendingCount: 0,
      isProcessing: false,
      lastSyncedCommand: null,
      hasPendingCommands: false,
      hasFailedCommands: false,
      queueStoveCommand: jest.fn(),
      refreshCommands: jest.fn(),
      retryCommand: jest.fn(),
      cancelCommand: jest.fn(),
      clearFailedCommands: jest.fn(),
      triggerSync: jest.fn(),
    });
  });

  afterEach(() => {
    // Clean up body padding
    document.body.style.paddingTop = '';
  });

  describe('Banner visibility', () => {
    it('does not render when online with no special messages', () => {
      mockUseOnlineStatus.mockReturnValue({
        isOnline: true,
        wasOffline: false,
        lastOnlineAt: new Date(),
        offlineSince: null,
        checkConnection: jest.fn(),
      });

      const { container } = render(<OfflineBanner />);
      expect(container.firstChild).toBeNull();
    });

    it('renders offline banner with "Sei offline" title when offline', () => {
      mockUseOnlineStatus.mockReturnValue({
        isOnline: false,
        wasOffline: false,
        lastOnlineAt: new Date(),
        offlineSince: new Date(),
        checkConnection: jest.fn(),
      });

      render(<OfflineBanner />);
      expect(screen.getByText('Sei offline')).toBeInTheDocument();
    });
  });

  describe('Last online timestamp', () => {
    it('shows last online timestamp using lastOnlineAt value', () => {
      const lastOnlineDate = new Date('2024-01-01T12:00:00Z');

      mockUseOnlineStatus.mockReturnValue({
        isOnline: false,
        wasOffline: false,
        lastOnlineAt: lastOnlineDate,
        offlineSince: new Date(),
        checkConnection: jest.fn(),
      });

      render(<OfflineBanner />);

      // Check that the timestamp section is rendered with the mocked formatted text
      expect(screen.getByText(/Ultimo aggiornamento:/)).toBeInTheDocument();
      expect(screen.getByText(/5 minuti fa/)).toBeInTheDocument();
    });

    it('does not show timestamp if lastOnlineAt is null', () => {
      mockUseOnlineStatus.mockReturnValue({
        isOnline: false,
        wasOffline: false,
        lastOnlineAt: null,
        offlineSince: new Date(),
        checkConnection: jest.fn(),
      });

      render(<OfflineBanner />);

      expect(screen.queryByText(/Ultimo aggiornamento:/)).not.toBeInTheDocument();
    });
  });

  describe('Command queue', () => {
    it('shows command queue section when pendingCommands has items', () => {
      mockUseOnlineStatus.mockReturnValue({
        isOnline: false,
        wasOffline: false,
        lastOnlineAt: new Date(),
        offlineSince: new Date(),
        checkConnection: jest.fn(),
      });

      mockUseBackgroundSync.mockReturnValue({
        pendingCommands: [
          {
            id: 1,
            label: 'Accensione stufa',
            icon: '🔥',
            formattedTime: '10:30',
            endpoint: 'stove/ignite',
          },
          {
            id: 2,
            label: 'Spegnimento stufa',
            icon: '🌙',
            formattedTime: '10:35',
            endpoint: 'stove/shutdown',
          },
        ],
        failedCommands: [],
        pendingCount: 2,
        isProcessing: false,
        lastSyncedCommand: null,
        hasPendingCommands: true,
        hasFailedCommands: false,
        queueStoveCommand: jest.fn(),
        refreshCommands: jest.fn(),
        retryCommand: jest.fn(),
        cancelCommand: jest.fn(),
        clearFailedCommands: jest.fn(),
        triggerSync: jest.fn(),
      });

      render(<OfflineBanner showPendingCount />);

      expect(screen.getByText('Comandi in coda (2)')).toBeInTheDocument();
    });

    it('does not show command queue when showPendingCount is false', () => {
      mockUseOnlineStatus.mockReturnValue({
        isOnline: false,
        wasOffline: false,
        lastOnlineAt: new Date(),
        offlineSince: new Date(),
        checkConnection: jest.fn(),
      });

      mockUseBackgroundSync.mockReturnValue({
        pendingCommands: [
          {
            id: 1,
            label: 'Accensione stufa',
            icon: '🔥',
            formattedTime: '10:30',
            endpoint: 'stove/ignite',
          },
        ],
        failedCommands: [],
        pendingCount: 1,
        isProcessing: false,
        lastSyncedCommand: null,
        hasPendingCommands: true,
        hasFailedCommands: false,
        queueStoveCommand: jest.fn(),
        refreshCommands: jest.fn(),
        retryCommand: jest.fn(),
        cancelCommand: jest.fn(),
        clearFailedCommands: jest.fn(),
        triggerSync: jest.fn(),
      });

      render(<OfflineBanner showPendingCount={false} />);

      expect(screen.queryByText(/Comandi in coda/)).not.toBeInTheDocument();
    });

    it('expands command list when queue header is clicked', () => {
      mockUseOnlineStatus.mockReturnValue({
        isOnline: false,
        wasOffline: false,
        lastOnlineAt: new Date(),
        offlineSince: new Date(),
        checkConnection: jest.fn(),
      });

      mockUseBackgroundSync.mockReturnValue({
        pendingCommands: [
          {
            id: 1,
            label: 'Accensione stufa',
            icon: '🔥',
            formattedTime: '10:30',
            endpoint: 'stove/ignite',
          },
        ],
        failedCommands: [],
        pendingCount: 1,
        isProcessing: false,
        lastSyncedCommand: null,
        hasPendingCommands: true,
        hasFailedCommands: false,
        queueStoveCommand: jest.fn(),
        refreshCommands: jest.fn(),
        retryCommand: jest.fn(),
        cancelCommand: jest.fn(),
        clearFailedCommands: jest.fn(),
        triggerSync: jest.fn(),
      });

      render(<OfflineBanner showPendingCount />);

      // Initially, commands are not visible (collapsed)
      expect(screen.queryByText('Accensione stufa')).not.toBeInTheDocument();

      // Click to expand
      const expandButton = screen.getByText('Comandi in coda (1)');
      fireEvent.click(expandButton);

      // Now commands should be visible
      expect(screen.getByText('Accensione stufa')).toBeInTheDocument();
      expect(screen.getByText('10:30')).toBeInTheDocument();
    });

    it('shows label, time, and cancel button for each command', () => {
      mockUseOnlineStatus.mockReturnValue({
        isOnline: false,
        wasOffline: false,
        lastOnlineAt: new Date(),
        offlineSince: new Date(),
        checkConnection: jest.fn(),
      });

      mockUseBackgroundSync.mockReturnValue({
        pendingCommands: [
          {
            id: 1,
            label: 'Accensione stufa',
            icon: '🔥',
            formattedTime: '10:30',
            endpoint: 'stove/ignite',
          },
          {
            id: 2,
            label: 'Imposta potenza',
            icon: '⚡',
            formattedTime: '10:35',
            endpoint: 'stove/set-power',
          },
        ],
        failedCommands: [],
        pendingCount: 2,
        isProcessing: false,
        lastSyncedCommand: null,
        hasPendingCommands: true,
        hasFailedCommands: false,
        queueStoveCommand: jest.fn(),
        refreshCommands: jest.fn(),
        retryCommand: jest.fn(),
        cancelCommand: jest.fn(),
        clearFailedCommands: jest.fn(),
        triggerSync: jest.fn(),
      });

      render(<OfflineBanner showPendingCount />);

      // Expand the list
      const expandButton = screen.getByText('Comandi in coda (2)');
      fireEvent.click(expandButton);

      // Check first command
      expect(screen.getByText('Accensione stufa')).toBeInTheDocument();
      expect(screen.getByText('10:30')).toBeInTheDocument();

      // Check second command
      expect(screen.getByText('Imposta potenza')).toBeInTheDocument();
      expect(screen.getByText('10:35')).toBeInTheDocument();

      // Check cancel buttons (2 buttons with "Annulla" text)
      const cancelButtons = screen.getAllByText('Annulla');
      expect(cancelButtons).toHaveLength(2);
    });
  });

  describe('Cancel command interaction', () => {
    it('calls cancelCommand with correct id when cancel button is clicked', () => {
      const mockCancelCommand = jest.fn();

      mockUseOnlineStatus.mockReturnValue({
        isOnline: false,
        wasOffline: false,
        lastOnlineAt: new Date(),
        offlineSince: new Date(),
        checkConnection: jest.fn(),
      });

      mockUseBackgroundSync.mockReturnValue({
        pendingCommands: [
          {
            id: 42,
            label: 'Accensione stufa',
            icon: '🔥',
            formattedTime: '10:30',
            endpoint: 'stove/ignite',
          },
        ],
        failedCommands: [],
        pendingCount: 1,
        isProcessing: false,
        lastSyncedCommand: null,
        hasPendingCommands: true,
        hasFailedCommands: false,
        queueStoveCommand: jest.fn(),
        refreshCommands: jest.fn(),
        retryCommand: jest.fn(),
        cancelCommand: mockCancelCommand,
        clearFailedCommands: jest.fn(),
        triggerSync: jest.fn(),
      });

      render(<OfflineBanner showPendingCount />);

      // Expand the list
      const expandButton = screen.getByText('Comandi in coda (1)');
      fireEvent.click(expandButton);

      // Click cancel button
      const cancelButton = screen.getByText('Annulla');
      fireEvent.click(cancelButton);

      expect(mockCancelCommand).toHaveBeenCalledWith(42);
    });
  });

  describe('Reconnect banner', () => {
    it('shows "Connessione ripristinata" when wasOffline is true', () => {
      mockUseOnlineStatus.mockReturnValue({
        isOnline: true,
        wasOffline: true,
        lastOnlineAt: new Date(),
        offlineSince: null,
        checkConnection: jest.fn(),
      });

      render(<OfflineBanner />);

      expect(screen.getByText('Connessione ripristinata')).toBeInTheDocument();
    });

    it('shows sync message when reconnected with pending commands', () => {
      mockUseOnlineStatus.mockReturnValue({
        isOnline: true,
        wasOffline: true,
        lastOnlineAt: new Date(),
        offlineSince: null,
        checkConnection: jest.fn(),
      });

      mockUseBackgroundSync.mockReturnValue({
        pendingCommands: [
          {
            id: 1,
            label: 'Accensione stufa',
            icon: '🔥',
            formattedTime: '10:30',
            endpoint: 'stove/ignite',
          },
        ],
        failedCommands: [],
        pendingCount: 1,
        isProcessing: false,
        lastSyncedCommand: null,
        hasPendingCommands: true,
        hasFailedCommands: false,
        queueStoveCommand: jest.fn(),
        refreshCommands: jest.fn(),
        retryCommand: jest.fn(),
        cancelCommand: jest.fn(),
        clearFailedCommands: jest.fn(),
        triggerSync: jest.fn(),
      });

      render(<OfflineBanner />);

      expect(screen.getByText('Connessione ripristinata')).toBeInTheDocument();
      expect(screen.getByText('• Sincronizzazione in corso...')).toBeInTheDocument();
    });
  });

  describe('Synced command notification', () => {
    it('shows correct action label for stove ignite', () => {
      mockUseOnlineStatus.mockReturnValue({
        isOnline: true,
        wasOffline: false,
        lastOnlineAt: new Date(),
        offlineSince: null,
        checkConnection: jest.fn(),
      });

      mockUseBackgroundSync.mockReturnValue({
        pendingCommands: [],
        failedCommands: [],
        pendingCount: 0,
        isProcessing: false,
        lastSyncedCommand: {
          commandId: 1,
          endpoint: 'stove/ignite',
          timestamp: Date.now(),
        },
        hasPendingCommands: false,
        hasFailedCommands: false,
        queueStoveCommand: jest.fn(),
        refreshCommands: jest.fn(),
        retryCommand: jest.fn(),
        cancelCommand: jest.fn(),
        clearFailedCommands: jest.fn(),
        triggerSync: jest.fn(),
      });

      render(<OfflineBanner />);

      expect(screen.getByText('✓ 🔥 Stufa accesa')).toBeInTheDocument();
    });

    it('shows correct action label for stove shutdown', () => {
      mockUseOnlineStatus.mockReturnValue({
        isOnline: true,
        wasOffline: false,
        lastOnlineAt: new Date(),
        offlineSince: null,
        checkConnection: jest.fn(),
      });

      mockUseBackgroundSync.mockReturnValue({
        pendingCommands: [],
        failedCommands: [],
        pendingCount: 0,
        isProcessing: false,
        lastSyncedCommand: {
          commandId: 2,
          endpoint: 'stove/shutdown',
          timestamp: Date.now(),
        },
        hasPendingCommands: false,
        hasFailedCommands: false,
        queueStoveCommand: jest.fn(),
        refreshCommands: jest.fn(),
        retryCommand: jest.fn(),
        cancelCommand: jest.fn(),
        clearFailedCommands: jest.fn(),
        triggerSync: jest.fn(),
      });

      render(<OfflineBanner />);

      expect(screen.getByText('✓ 🌙 Stufa spenta')).toBeInTheDocument();
    });

    it('shows correct action label for set power', () => {
      mockUseOnlineStatus.mockReturnValue({
        isOnline: true,
        wasOffline: false,
        lastOnlineAt: new Date(),
        offlineSince: null,
        checkConnection: jest.fn(),
      });

      mockUseBackgroundSync.mockReturnValue({
        pendingCommands: [],
        failedCommands: [],
        pendingCount: 0,
        isProcessing: false,
        lastSyncedCommand: {
          commandId: 3,
          endpoint: 'stove/set-power',
          timestamp: Date.now(),
        },
        hasPendingCommands: false,
        hasFailedCommands: false,
        queueStoveCommand: jest.fn(),
        refreshCommands: jest.fn(),
        retryCommand: jest.fn(),
        cancelCommand: jest.fn(),
        clearFailedCommands: jest.fn(),
        triggerSync: jest.fn(),
      });

      render(<OfflineBanner />);

      expect(screen.getByText('✓ ⚡ Potenza impostata')).toBeInTheDocument();
    });

    it('shows generic label for unknown command', () => {
      mockUseOnlineStatus.mockReturnValue({
        isOnline: true,
        wasOffline: false,
        lastOnlineAt: new Date(),
        offlineSince: null,
        checkConnection: jest.fn(),
      });

      mockUseBackgroundSync.mockReturnValue({
        pendingCommands: [],
        failedCommands: [],
        pendingCount: 0,
        isProcessing: false,
        lastSyncedCommand: {
          commandId: 4,
          endpoint: 'unknown/action',
          timestamp: Date.now(),
        },
        hasPendingCommands: false,
        hasFailedCommands: false,
        queueStoveCommand: jest.fn(),
        refreshCommands: jest.fn(),
        retryCommand: jest.fn(),
        cancelCommand: jest.fn(),
        clearFailedCommands: jest.fn(),
        triggerSync: jest.fn(),
      });

      render(<OfflineBanner />);

      expect(screen.getByText('✓ Comando eseguito')).toBeInTheDocument();
    });
  });

  describe('Fixed positioning', () => {
    it('applies fixed positioning when fixed prop is true', () => {
      mockUseOnlineStatus.mockReturnValue({
        isOnline: false,
        wasOffline: false,
        lastOnlineAt: new Date(),
        offlineSince: new Date(),
        checkConnection: jest.fn(),
      });

      const { container } = render(<OfflineBanner fixed />);

      const banner = container.firstChild as HTMLElement;
      expect(banner?.className).toMatch(/fixed/);
    });

    it('does not apply fixed positioning when fixed prop is false', () => {
      mockUseOnlineStatus.mockReturnValue({
        isOnline: false,
        wasOffline: false,
        lastOnlineAt: new Date(),
        offlineSince: new Date(),
        checkConnection: jest.fn(),
      });

      const { container } = render(<OfflineBanner fixed={false} />);

      const banner = container.firstChild as HTMLElement;
      expect(banner?.className).toMatch(/relative/);
    });
  });
});
