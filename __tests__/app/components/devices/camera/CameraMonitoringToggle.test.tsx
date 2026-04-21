/**
 * CameraMonitoringToggle tests
 *
 * Tests the monitoring toggle behavior via the shared `useCameraMonitoringToggle`
 * hook that powers CameraCard and (an analogous inlined version in)
 * CameraDashboard. Verifies: initial state, API call format, disabled states,
 * optimistic rollback.
 *
 * Note: after Phase 168 review (WR-02), the inline harness was replaced with a
 * direct `renderHook` invocation of the production hook so drift between
 * production and test code becomes a compile error or a real test failure
 * rather than a silent pass.
 */

import { act, renderHook, waitFor } from '@testing-library/react';

import { useCameraMonitoringToggle } from '@/app/components/devices/camera/hooks/useCameraMonitoringToggle';

describe('useCameraMonitoringToggle — shared toggle logic', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('Test 1: initial state — initialOn: true maps to on', () => {
    const { result } = renderHook(() =>
      useCameraMonitoringToggle({ initialOn: true }),
    );
    expect(result.current.monitoringOn).toBe(true);
    expect(result.current.monitoringLoading).toBe(false);
  });

  it('Test 1b: initial state — initialOn: false (default) maps to off', () => {
    const { result } = renderHook(() => useCameraMonitoringToggle());
    expect(result.current.monitoringOn).toBe(false);
  });

  it('Test 2: toggling from on sends POST with monitoring: off and correct URL', async () => {
    const mockFetch = jest.fn().mockResolvedValue({ ok: true });
    global.fetch = mockFetch as unknown as typeof fetch;

    const { result } = renderHook(() =>
      useCameraMonitoringToggle({ initialOn: true }),
    );

    await act(async () => {
      await result.current.handleToggle('cam-1', false);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/v1/netatmo/camera/cam-1/monitoring',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monitoring: 'off' }),
      }),
    );
    expect(result.current.monitoringOn).toBe(false);
  });

  it('Test 2b: toggling from off sends POST with monitoring: on', async () => {
    const mockFetch = jest.fn().mockResolvedValue({ ok: true });
    global.fetch = mockFetch as unknown as typeof fetch;

    const { result } = renderHook(() =>
      useCameraMonitoringToggle({ initialOn: false }),
    );

    await act(async () => {
      await result.current.handleToggle('cam-1', true);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/v1/netatmo/camera/cam-1/monitoring',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ monitoring: 'on' }),
      }),
    );
    expect(result.current.monitoringOn).toBe(true);
  });

  it('Test 3: toggle is a no-op when disabled=true (UNREACHABLE)', async () => {
    const mockFetch = jest.fn().mockResolvedValue({ ok: true });
    global.fetch = mockFetch as unknown as typeof fetch;

    const { result } = renderHook(() =>
      useCameraMonitoringToggle({ initialOn: true, disabled: true }),
    );

    await act(async () => {
      await result.current.handleToggle('cam-1', false);
    });

    // fetch should not have been called
    expect(mockFetch).not.toHaveBeenCalled();
    // state stays unchanged
    expect(result.current.monitoringOn).toBe(true);
  });

  it('Test 3b: toggle is a no-op when cameraId is null', async () => {
    const mockFetch = jest.fn().mockResolvedValue({ ok: true });
    global.fetch = mockFetch as unknown as typeof fetch;

    const { result } = renderHook(() =>
      useCameraMonitoringToggle({ initialOn: false }),
    );

    await act(async () => {
      await result.current.handleToggle(null, true);
    });

    expect(mockFetch).not.toHaveBeenCalled();
    expect(result.current.monitoringOn).toBe(false);
  });

  it('Test 4: monitoringLoading is true during in-flight request', async () => {
    // Fetch that never resolves so we can inspect the loading state
    let resolveHook!: () => void;
    const mockFetch = jest.fn().mockReturnValue(
      new Promise<{ ok: boolean }>(resolve => {
        resolveHook = () => resolve({ ok: true });
      }),
    );
    global.fetch = mockFetch as unknown as typeof fetch;

    const { result } = renderHook(() =>
      useCameraMonitoringToggle({ initialOn: false }),
    );

    let togglePromise!: Promise<void>;
    act(() => {
      togglePromise = result.current.handleToggle('cam-1', true);
    });

    // Loading should be true while request is in flight
    await waitFor(() => {
      expect(result.current.monitoringLoading).toBe(true);
    });
    // Optimistic update applied immediately
    expect(result.current.monitoringOn).toBe(true);

    // Resolve the fetch to avoid open handles
    await act(async () => {
      resolveHook();
      await togglePromise;
    });

    expect(result.current.monitoringLoading).toBe(false);
  });

  it('Test 5: on API failure (non-ok response), toggle reverts to previous state', async () => {
    const mockFetch = jest.fn().mockResolvedValue({ ok: false });
    global.fetch = mockFetch as unknown as typeof fetch;

    const { result } = renderHook(() =>
      useCameraMonitoringToggle({ initialOn: true }),
    );

    await act(async () => {
      await result.current.handleToggle('cam-1', false);
    });

    // State should have been rolled back to 'on' after non-ok response
    await waitFor(() => {
      expect(result.current.monitoringOn).toBe(true);
    });
  });

  it('Test 5b: on fetch rejection (network error), toggle reverts to previous state', async () => {
    const mockFetch = jest.fn().mockRejectedValue(new Error('Network error'));
    global.fetch = mockFetch as unknown as typeof fetch;

    const { result } = renderHook(() =>
      useCameraMonitoringToggle({ initialOn: true }),
    );

    await act(async () => {
      await result.current.handleToggle('cam-1', false);
    });

    await waitFor(() => {
      expect(result.current.monitoringOn).toBe(true);
    });
  });

  it('Test 6: URL-encodes cameraId in the POST URL path', async () => {
    const mockFetch = jest.fn().mockResolvedValue({ ok: true });
    global.fetch = mockFetch as unknown as typeof fetch;

    const { result } = renderHook(() => useCameraMonitoringToggle());

    await act(async () => {
      await result.current.handleToggle('cam with spaces', true);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/v1/netatmo/camera/cam%20with%20spaces/monitoring',
      expect.objectContaining({ method: 'POST' }),
    );
  });
});
