/**
 * Unit Tests: Monitoring Status Cards
 *
 * Tests for ConnectionStatusCard and DeadManSwitchPanel components.
 */

import { render, screen } from '@testing-library/react';
import ConnectionStatusCard from '@/components/monitoring/ConnectionStatusCard';
import DeadManSwitchPanel from '@/components/monitoring/DeadManSwitchPanel';

// Mock date-fns to avoid timezone issues in tests
jest.mock('date-fns', () => ({
  formatDistanceToNow: jest.fn(() => '5 minuti fa'),
}));

describe('ConnectionStatusCard', () => {
  it('renders loading state when stats is null', () => {
    render(<ConnectionStatusCard stats={null} error={null} />);

    // Should show heading
    expect(screen.getByText('Stove Connection')).toBeInTheDocument();

    // Should show loading skeletons (animated elements)
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('displays uptime percentage from stats.successRate', () => {
    const stats = {
      totalRuns: 100,
      totalChecks: 200,
      successfulChecks: 190,
      failedChecks: 10,
      mismatchCount: 0,
      successRate: '95.0',
    };

    render(<ConnectionStatusCard stats={stats} error={null} />);

    // Should display uptime percentage prominently
    expect(screen.getByText('95.0%')).toBeInTheDocument();
    expect(screen.getByText('Uptime')).toBeInTheDocument();
  });

  it('shows "online" badge when successRate >= 95', () => {
    const stats = {
      totalRuns: 100,
      totalChecks: 200,
      successfulChecks: 195,
      failedChecks: 5,
      mismatchCount: 0,
      successRate: '97.5',
    };

    render(<ConnectionStatusCard stats={stats} error={null} />);

    expect(screen.getByText('online')).toBeInTheDocument();
  });

  it('shows "degraded" badge when successRate >= 80 but < 95', () => {
    const stats = {
      totalRuns: 100,
      totalChecks: 200,
      successfulChecks: 170,
      failedChecks: 30,
      mismatchCount: 0,
      successRate: '85.0',
    };

    render(<ConnectionStatusCard stats={stats} error={null} />);

    expect(screen.getByText('degraded')).toBeInTheDocument();
  });

  it('shows "offline" badge when successRate < 80', () => {
    const stats = {
      totalRuns: 100,
      totalChecks: 200,
      successfulChecks: 100,
      failedChecks: 100,
      mismatchCount: 0,
      successRate: '50.0',
    };

    render(<ConnectionStatusCard stats={stats} error={null} />);

    expect(screen.getByText('offline')).toBeInTheDocument();
  });

  it('displays successful and failed check counts', () => {
    const stats = {
      totalRuns: 100,
      totalChecks: 200,
      successfulChecks: 180,
      failedChecks: 20,
      mismatchCount: 0,
      successRate: '90.0',
    };

    render(<ConnectionStatusCard stats={stats} error={null} />);

    // Should display counts (with locale formatting)
    expect(screen.getByText('180')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();

    // Should show labels
    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  it('displays warning text when mismatchCount > 0', () => {
    const stats = {
      totalRuns: 100,
      totalChecks: 200,
      successfulChecks: 190,
      failedChecks: 10,
      mismatchCount: 5,
      successRate: '95.0',
    };

    render(<ConnectionStatusCard stats={stats} error={null} />);

    expect(screen.getByText(/5 state mismatches detected/i)).toBeInTheDocument();
    expect(screen.getByText(/Stove state did not match expected scheduler state/i)).toBeInTheDocument();
  });

  it('does not show warning when mismatchCount is 0', () => {
    const stats = {
      totalRuns: 100,
      totalChecks: 200,
      successfulChecks: 190,
      failedChecks: 10,
      mismatchCount: 0,
      successRate: '95.0',
    };

    render(<ConnectionStatusCard stats={stats} error={null} />);

    expect(screen.queryByText(/mismatch/i)).not.toBeInTheDocument();
  });
});

describe('DeadManSwitchPanel', () => {
  it('renders loading state when status is null', () => {
    render(<DeadManSwitchPanel status={null} error={null} />);

    // Should show heading
    expect(screen.getByText('Cron Health')).toBeInTheDocument();

    // Should show loading skeleton
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows "healthy" badge when stale is false', () => {
    const status = {
      stale: false as const,
      elapsed: 30000, // 30 seconds
      lastCheck: new Date().toISOString(),
    };

    render(<DeadManSwitchPanel status={status} error={null} />);

    expect(screen.getByText('healthy')).toBeInTheDocument();
    expect(screen.getByText('Sistema attivo')).toBeInTheDocument();
  });

  it('shows "stale" badge when stale is true', () => {
    const status = {
      stale: true as const,
      reason: 'timeout' as const,
      elapsed: 700000, // > 10 minutes
      lastCheck: new Date(Date.now() - 700000).toISOString(),
    };

    render(<DeadManSwitchPanel status={status} error={null} />);

    // Should show "stale" badge
    const badges = screen.getAllByText('stale');
    expect(badges.length).toBeGreaterThan(0);
  });

  it('displays correct message for "never_run" reason', () => {
    const status = {
      stale: true as const,
      reason: 'never_run' as const,
    };

    render(<DeadManSwitchPanel status={status} error={null} />);

    expect(screen.getByText('Cron mai eseguito')).toBeInTheDocument();
    expect(screen.getByText(/Il sistema di monitoraggio non ha ancora registrato/i)).toBeInTheDocument();
  });

  it('displays elapsed time for "timeout" reason', () => {
    const status = {
      stale: true as const,
      reason: 'timeout' as const,
      elapsed: 720000, // 12 minutes
      lastCheck: new Date(Date.now() - 720000).toISOString(),
    };

    render(<DeadManSwitchPanel status={status} error={null} />);

    expect(screen.getByText('Cron non risponde')).toBeInTheDocument();

    // Should show elapsed time (12 minutes)
    expect(screen.getByText(/12 minuti/i)).toBeInTheDocument();

    // Should show last check time
    expect(screen.getByText(/Ultimo controllo:/i)).toBeInTheDocument();
  });

  it('displays error message for "error" reason', () => {
    const status = {
      stale: true as const,
      reason: 'error' as const,
      error: 'Database connection failed',
    };

    render(<DeadManSwitchPanel status={status} error={null} />);

    expect(screen.getByText('Errore di sistema')).toBeInTheDocument();
    expect(screen.getByText('Database connection failed')).toBeInTheDocument();
  });

  it('displays last check time for healthy status', () => {
    const status = {
      stale: false as const,
      elapsed: 30000,
      lastCheck: new Date().toISOString(),
    };

    render(<DeadManSwitchPanel status={status} error={null} />);

    // Mock returns "5 minuti fa"
    expect(screen.getByText(/Ultimo controllo:/i)).toBeInTheDocument();
    expect(screen.getByText(/5 minuti fa/i)).toBeInTheDocument();
  });
});
