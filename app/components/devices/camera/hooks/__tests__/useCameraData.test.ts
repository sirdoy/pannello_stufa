/**
 * Tests for useCameraData Hook
 *
 * Validates loading state, data fetching, error handling,
 * stale state, and useAdaptivePolling configuration.
 */

import { renderHook, waitFor } from '@testing-library/react';
import type { CameraStatus, DataFreshness } from '@/types/netatmoProxy';

// Mock dependencies
jest.mock('@/lib/hooks/useAdaptivePolling');
jest.mock('@/lib/hooks/useVisibility');

// Import mocked modules
import { useAdaptivePolling } from '@/lib/hooks/useAdaptivePolling';
import { useVisibility } from '@/lib/hooks/useVisibility';

const mockUseVisibility = useVisibility as jest.MockedFunction<typeof useVisibility>;
const mockUseAdaptivePolling = useAdaptivePolling as jest.MockedFunction<typeof useAdaptivePolling>;

// Fixture data
const mockCameras: CameraStatus[] = [
  {
    camera_id: 'cam-1',
    name: 'Ingresso',
    device_type: 'NACamera',
    status: 'on',
    sd_status: 'on',
    alim_status: 'on',
    firmware: '1.0.0',
    is_local: true,
  },
];

const mockFreshness: DataFreshness = 'LIVE';

function makeSuccessResponse(cameras: CameraStatus[] = mockCameras, freshness: DataFreshness = mockFreshness) {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ cameras, data_freshness: freshness }),
  });
}

function makeErrorResponse(status: number = 500, error?: string) {
  return Promise.resolve({
    ok: false,
    status,
    json: () => Promise.resolve({ error: error ?? `Errore ${status}` }),
  });
}

describe('useCameraData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();

    mockUseVisibility.mockReturnValue(true);

    let pollingStarted = false;
    mockUseAdaptivePolling.mockImplementation(({ callback, immediate }) => {
      if (immediate && !pollingStarted) {
        pollingStarted = true;
        setTimeout(() => void callback(), 0);
      }
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Import hook lazily after mocks are set up
  let useCameraData: typeof import('../useCameraData').useCameraData;

  beforeAll(async () => {
    const mod = await import('../useCameraData');
    useCameraData = mod.useCameraData;
  });

  it('Test 1: returns loading=true and data=null initially', async () => {
    (global.fetch as jest.Mock).mockImplementation(() => makeSuccessResponse());

    const { result } = renderHook(() => useCameraData());

    expect(result.current.loading).toBe(true);
    expect(result.current.cameras).toEqual([]);

    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it('Test 2: after successful fetch, returns cameras array + dataFreshness + connected=true + loading=false', async () => {
    (global.fetch as jest.Mock).mockImplementation(() => makeSuccessResponse());

    const { result } = renderHook(() => useCameraData());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.cameras).toEqual(mockCameras);
    expect(result.current.dataFreshness).toBe('LIVE');
    expect(result.current.connected).toBe(true);
    expect(result.current.error).toBeNull();
    expect(result.current.lastUpdatedAt).toBeGreaterThan(0);
  });

  it('Test 3: on fetch error with no prior data, returns error string + connected=false', async () => {
    // Network-level error (all attempts fail)
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useCameraData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Network error');
    }, { timeout: 5000 });

    expect(result.current.connected).toBe(false);
    expect(result.current.cameras).toEqual([]);
  });

  it('Test 4: on fetch error with prior data, returns stale=true + keeps prior data', async () => {
    // First fetch succeeds
    (global.fetch as jest.Mock).mockImplementation(() => makeSuccessResponse());

    const { result } = renderHook(() => useCameraData());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.cameras).toEqual(mockCameras);

    // Second fetch fails
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    // Manually invoke the callback again
    const callbackArg = mockUseAdaptivePolling.mock.calls[0]?.[0];
    if (callbackArg) {
      await callbackArg.callback();
    }

    await waitFor(() => expect(result.current.stale).toBe(true));

    // Data should still be present (not cleared)
    expect(result.current.cameras).toEqual(mockCameras);
  });

  it('Test 5: calls useAdaptivePolling with interval=60000, immediate=true, initialDelay=400', () => {
    (global.fetch as jest.Mock).mockImplementation(() => makeSuccessResponse());

    renderHook(() => useCameraData());

    expect(mockUseAdaptivePolling).toHaveBeenCalledWith(
      expect.objectContaining({
        interval: 60000,
        immediate: true,
        alwaysActive: false,
        initialDelay: 400,
      }),
    );
  });
});
