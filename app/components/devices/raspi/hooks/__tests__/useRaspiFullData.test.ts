/**
 * Tests for useRaspiFullData Hook
 *
 * Validates loading state, data fetching from all 4 endpoints,
 * error handling, stale state, and the full RaspiFullData shape
 * including bytes, uptime, load averages, network I/O.
 */

import { renderHook, waitFor } from '@testing-library/react';
import type { CpuResponse, MemoryResponse, DiskResponse, SystemResponse } from '@/types/raspi';

// Mock dependencies
jest.mock('@/lib/hooks/useAdaptivePolling');
jest.mock('@/lib/hooks/useVisibility');

// Import mocked modules
import { useAdaptivePolling } from '@/lib/hooks/useAdaptivePolling';
import { useVisibility } from '@/lib/hooks/useVisibility';

const mockUseVisibility = useVisibility as jest.MockedFunction<typeof useVisibility>;
const mockUseAdaptivePolling = useAdaptivePolling as jest.MockedFunction<typeof useAdaptivePolling>;

// Fixture data
const mockCpu: CpuResponse = { cpu_percent: 25.3, data_freshness: 'LIVE' };
const mockMemory: MemoryResponse = {
  used_bytes: 500_000_000,
  total_bytes: 1_000_000_000,
  percent: 50.0,
  data_freshness: 'LIVE',
};
const mockDisk: DiskResponse = {
  used_bytes: 8_000_000_000,
  total_bytes: 32_000_000_000,
  percent: 25.0,
  mount_point: '/',
  data_freshness: 'LIVE',
};
const mockSystem: SystemResponse = {
  cpu_temperature: 45.2,
  uptime_seconds: 86400,
  load_avg_1: 0.5,
  load_avg_5: 0.4,
  load_avg_15: 0.3,
  process_count: 120,
  network: { bytes_sent: 1_000_000, bytes_recv: 2_000_000, interface: 'eth0' },
  data_freshness: 'LIVE',
};

function makeFetchMock(overrides?: Partial<{
  cpuOk: boolean;
  memOk: boolean;
  diskOk: boolean;
  sysOk: boolean;
  cpu: CpuResponse;
  memory: MemoryResponse;
  disk: DiskResponse;
  system: SystemResponse;
}>) {
  const opts = {
    cpuOk: true,
    memOk: true,
    diskOk: true,
    sysOk: true,
    cpu: mockCpu,
    memory: mockMemory,
    disk: mockDisk,
    system: mockSystem,
    ...overrides,
  };

  return (url: string) => {
    if (url === '/api/raspi/cpu') {
      return Promise.resolve({ ok: opts.cpuOk, json: () => Promise.resolve(opts.cpu) });
    }
    if (url === '/api/raspi/memory') {
      return Promise.resolve({ ok: opts.memOk, json: () => Promise.resolve(opts.memory) });
    }
    if (url === '/api/raspi/disk') {
      return Promise.resolve({ ok: opts.diskOk, json: () => Promise.resolve(opts.disk) });
    }
    if (url === '/api/raspi/system') {
      return Promise.resolve({ ok: opts.sysOk, json: () => Promise.resolve(opts.system) });
    }
    return Promise.reject(new Error(`Unexpected URL: ${url as string}`));
  };
}

describe('useRaspiFullData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();

    mockUseVisibility.mockReturnValue(true);

    mockUseAdaptivePolling.mockImplementation(({ callback, immediate }) => {
      if (immediate) {
        setTimeout(() => void callback(), 0);
      }
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Import hook lazily after mocks are set up
  let useRaspiFullData: typeof import('../useRaspiFullData').useRaspiFullData;

  beforeAll(async () => {
    const mod = await import('../useRaspiFullData');
    useRaspiFullData = mod.useRaspiFullData;
  });

  it('Test 1: returns null data and loading=true initially', async () => {
    // Use a fetch that never resolves to keep loading=true
    (global.fetch as jest.Mock).mockImplementation(
      () => new Promise(() => { /* never resolves */ })
    );

    // Use a polling mock that does NOT call callback immediately
    mockUseAdaptivePolling.mockImplementation(() => {
      // No immediate call — loading stays true
    });

    const { result } = renderHook(() => useRaspiFullData());

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
  });

  it('Test 2: after successful fetch of all 4 endpoints, data contains all RaspiFullData fields', async () => {
    (global.fetch as jest.Mock).mockImplementation(makeFetchMock());

    const { result } = renderHook(() => useRaspiFullData());

    await waitFor(() => expect(result.current.loading).toBe(false));

    const data = result.current.data;
    expect(data).not.toBeNull();

    // CPU & temperature
    expect(data?.cpuPercent).toBe(25.3);
    expect(data?.cpuTemperature).toBe(45.2);

    // Memory
    expect(data?.memoryPercent).toBe(50.0);
    expect(data?.memoryUsedBytes).toBe(500_000_000);
    expect(data?.memoryTotalBytes).toBe(1_000_000_000);

    // Disk
    expect(data?.diskPercent).toBe(25.0);
    expect(data?.diskUsedBytes).toBe(8_000_000_000);
    expect(data?.diskTotalBytes).toBe(32_000_000_000);

    // System info
    expect(data?.uptimeSeconds).toBe(86400);
    expect(data?.loadAvg1).toBe(0.5);
    expect(data?.loadAvg5).toBe(0.4);
    expect(data?.loadAvg15).toBe(0.3);
    expect(data?.processCount).toBe(120);

    // Network I/O
    expect(data?.networkBytesSent).toBe(1_000_000);
    expect(data?.networkBytesRecv).toBe(2_000_000);
    expect(data?.networkInterface).toBe('eth0');

    expect(result.current.error).toBeNull();
    expect(result.current.stale).toBe(false);
  });

  it('Test 3: when one endpoint fails, sets stale=true and error message if no cached data', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useRaspiFullData());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Raspberry Pi non raggiungibile');
    expect(result.current.data).toBeNull();
    expect(result.current.stale).toBe(true);
  });

  it('Test 4: calls useAdaptivePolling with interval based on visibility (30s visible, 300s hidden)', () => {
    (global.fetch as jest.Mock).mockImplementation(makeFetchMock());

    // Visible
    mockUseVisibility.mockReturnValue(true);
    renderHook(() => useRaspiFullData());

    const callArgsVisible = mockUseAdaptivePolling.mock.calls[0]?.[0];
    expect(callArgsVisible?.interval).toBe(30000);
    expect(callArgsVisible?.alwaysActive).toBe(false);
    expect(callArgsVisible?.immediate).toBe(true);
    expect(callArgsVisible?.initialDelay).toBe(600);

    jest.clearAllMocks();
    mockUseAdaptivePolling.mockImplementation(() => { /* no-op */ });

    // Hidden
    mockUseVisibility.mockReturnValue(false);
    renderHook(() => useRaspiFullData());

    const callArgsHidden = mockUseAdaptivePolling.mock.calls[0]?.[0];
    expect(callArgsHidden?.interval).toBe(300000);
  });

  it('Test 5: cpuTemperature is number | null (preserves null from SystemResponse)', async () => {
    (global.fetch as jest.Mock).mockImplementation(
      makeFetchMock({
        system: { ...mockSystem, cpu_temperature: null },
      })
    );

    const { result } = renderHook(() => useRaspiFullData());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data?.cpuTemperature).toBeNull();
  });
});
