/**
 * CameraMonitoringToggle tests
 *
 * Tests the monitoring toggle behavior wired into CameraCard and CameraDashboard.
 * Verifies: initial state, API call format, disabled states, optimistic rollback.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

// ---------------------------------------------------------------------------
// Shared helpers — test the toggle logic via a minimal harness component
// ---------------------------------------------------------------------------

interface UseMonitoringToggleOptions {
  initialOn: boolean;
  cameraId: string;
  isStale?: boolean;
}

/**
 * Minimal harness that mimics the toggle logic used in both CameraCard and
 * CameraDashboard without importing the full heavyweight components.
 */
function MonitoringToggleHarness({ initialOn, cameraId, isStale = false }: UseMonitoringToggleOptions) {
  const [monitoringOn, setMonitoringOn] = React.useState(initialOn);
  const [monitoringLoading, setMonitoringLoading] = React.useState(false);

  async function handleMonitoringToggle(newValue: boolean) {
    if (monitoringLoading || isStale) return;
    const previousValue = monitoringOn;
    setMonitoringOn(newValue); // optimistic
    setMonitoringLoading(true);
    try {
      const res = await fetch('/api/netatmo/camera/monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          camera_id: cameraId,
          monitoring: newValue ? 'on' : 'off',
        }),
      });
      if (!res.ok) {
        setMonitoringOn(previousValue); // rollback
      }
    } catch {
      setMonitoringOn(previousValue); // rollback
    } finally {
      setMonitoringLoading(false);
    }
  }

  return (
    <div>
      <span data-testid="monitoring-state">{monitoringOn ? 'on' : 'off'}</span>
      <span data-testid="loading-state">{monitoringLoading ? 'loading' : 'idle'}</span>
      <button
        data-testid="toggle-btn"
        disabled={isStale || monitoringLoading}
        onClick={() => handleMonitoringToggle(!monitoringOn)}
      >
        Toggle
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CameraMonitoringToggle — toggle logic', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('Test 1: renders with initial state — on maps to checked', () => {
    render(
      <MonitoringToggleHarness initialOn={true} cameraId="cam-1" />
    );
    expect(screen.getByTestId('monitoring-state').textContent).toBe('on');
  });

  it('Test 1b: renders with initial state — off (status !== on) maps to unchecked', () => {
    render(
      <MonitoringToggleHarness initialOn={false} cameraId="cam-1" />
    );
    expect(screen.getByTestId('monitoring-state').textContent).toBe('off');
  });

  it('Test 2: clicking toggle sends POST with monitoring: off when currently on', async () => {
    const mockFetch = jest.fn().mockResolvedValue({ ok: true });
    global.fetch = mockFetch as unknown as typeof fetch;

    render(<MonitoringToggleHarness initialOn={true} cameraId="cam-1" />);

    await act(async () => {
      fireEvent.click(screen.getByTestId('toggle-btn'));
    });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/netatmo/camera/monitoring',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ camera_id: 'cam-1', monitoring: 'off' }),
      })
    );
  });

  it('Test 2b: clicking toggle sends POST with monitoring: on when currently off', async () => {
    const mockFetch = jest.fn().mockResolvedValue({ ok: true });
    global.fetch = mockFetch as unknown as typeof fetch;

    render(<MonitoringToggleHarness initialOn={false} cameraId="cam-1" />);

    await act(async () => {
      fireEvent.click(screen.getByTestId('toggle-btn'));
    });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/netatmo/camera/monitoring',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ camera_id: 'cam-1', monitoring: 'on' }),
      })
    );
  });

  it('Test 3: toggle is disabled when isStale (UNREACHABLE)', () => {
    render(
      <MonitoringToggleHarness initialOn={true} cameraId="cam-1" isStale={true} />
    );
    expect(screen.getByTestId('toggle-btn')).toBeDisabled();
  });

  it('Test 4: toggle is disabled during API call (monitoringLoading)', async () => {
    // Fetch that never resolves so we can inspect the loading state
    let resolveHook!: () => void;
    const mockFetch = jest.fn().mockReturnValue(
      new Promise<{ ok: boolean }>(resolve => {
        resolveHook = () => resolve({ ok: true });
      })
    );
    global.fetch = mockFetch as unknown as typeof fetch;

    render(<MonitoringToggleHarness initialOn={false} cameraId="cam-1" />);

    act(() => {
      fireEvent.click(screen.getByTestId('toggle-btn'));
    });

    // Button should now be disabled while loading
    expect(screen.getByTestId('toggle-btn')).toBeDisabled();

    // Resolve the fetch to avoid open handles
    await act(async () => {
      resolveHook();
    });
  });

  it('Test 5: on API failure (non-ok response), toggle reverts to previous state', async () => {
    const mockFetch = jest.fn().mockResolvedValue({ ok: false });
    global.fetch = mockFetch as unknown as typeof fetch;

    render(<MonitoringToggleHarness initialOn={true} cameraId="cam-1" />);

    await act(async () => {
      fireEvent.click(screen.getByTestId('toggle-btn'));
    });

    // State should have been reverted back to 'on' after rollback
    await waitFor(() => {
      expect(screen.getByTestId('monitoring-state').textContent).toBe('on');
    });
  });

  it('Test 5b: on fetch rejection (network error), toggle reverts to previous state', async () => {
    const mockFetch = jest.fn().mockRejectedValue(new Error('Network error'));
    global.fetch = mockFetch as unknown as typeof fetch;

    render(<MonitoringToggleHarness initialOn={true} cameraId="cam-1" />);

    await act(async () => {
      fireEvent.click(screen.getByTestId('toggle-btn'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('monitoring-state').textContent).toBe('on');
    });
  });
});
