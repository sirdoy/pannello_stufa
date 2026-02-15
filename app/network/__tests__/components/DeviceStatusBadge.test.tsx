/**
 * DeviceStatusBadge Tests
 *
 * Tests the DeviceStatusBadge component including:
 * - Online badge display
 * - Offline badge display
 * - Last seen timestamp formatting (Italian locale)
 * - "Never connected" message
 * - Correct badge variants
 */

import { render, screen } from '@testing-library/react';
import DeviceStatusBadge from '../../components/DeviceStatusBadge';

// Mock date-fns to avoid time-dependent tests
jest.mock('date-fns', () => ({
  formatDistanceToNow: jest.fn((date, options) => {
    // Return a predictable format for testing
    return '2 ore fa';
  }),
}));

describe('DeviceStatusBadge', () => {
  describe('Online state', () => {
    it('shows "Online" badge with sage variant when active=true', () => {
      render(<DeviceStatusBadge active={true} />);

      const badge = screen.getByText('Online');
      expect(badge).toBeInTheDocument();
      // Check for sage variant classes
      expect(badge).toHaveClass('bg-sage-500/15', 'border-sage-400/25', 'text-sage-300');
    });

    it('does NOT show last seen text when active=true (even if lastSeen provided)', () => {
      render(<DeviceStatusBadge active={true} lastSeen={Date.now() - 3600000} />);

      expect(screen.getByText('Online')).toBeInTheDocument();
      expect(screen.queryByText(/Visto/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Mai connesso/)).not.toBeInTheDocument();
    });
  });

  describe('Offline state', () => {
    it('shows "Offline" badge with danger variant when active=false', () => {
      render(<DeviceStatusBadge active={false} />);

      const badge = screen.getByText('Offline');
      expect(badge).toBeInTheDocument();
      // Check for danger variant classes
      expect(badge).toHaveClass('bg-danger-500/15', 'border-danger-400/25', 'text-danger-300');
    });

    it('shows relative "last seen" text when active=false and lastSeen provided', () => {
      const lastSeenTime = Date.now() - 7200000; // 2 hours ago
      render(<DeviceStatusBadge active={false} lastSeen={lastSeenTime} />);

      expect(screen.getByText('Offline')).toBeInTheDocument();
      expect(screen.getByText(/Visto 2 ore fa/)).toBeInTheDocument();
    });

    it('shows "Mai connesso" when active=false and no lastSeen', () => {
      render(<DeviceStatusBadge active={false} />);

      expect(screen.getByText('Offline')).toBeInTheDocument();
      expect(screen.getByText('Mai connesso')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('uses text-xs and text-slate-400 for last seen timestamp', () => {
      render(<DeviceStatusBadge active={false} lastSeen={Date.now() - 1000} />);

      const lastSeenText = screen.getByText(/Visto/);
      expect(lastSeenText).toHaveClass('text-xs', 'text-slate-400');
    });

    it('uses text-xs and text-slate-500 for "Mai connesso"', () => {
      render(<DeviceStatusBadge active={false} />);

      const neverConnectedText = screen.getByText('Mai connesso');
      expect(neverConnectedText).toHaveClass('text-xs', 'text-slate-500');
    });
  });
});
