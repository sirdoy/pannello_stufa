/**
 * NetworkCard — Phase 177 (DASH-08) — Jest unit tests
 *
 * Coverage:
 *   - Large download Mbps + Italian subtitle ("{up} Mbps ↑ · {N} dispositivi").
 *   - StatusDot color flips from green (#6aa86a) → amber (#ffb84a) when WAN
 *     reports !connected (D-25 stale signal).
 *   - Tap opens placeholder Sheet with title "Rete".
 *   - Missing bandwidth/devices fall back to 0 (no crash).
 */
import { fireEvent, render } from '@testing-library/react';

import NetworkCard from '../NetworkCard';

jest.mock('@/app/components/devices/network/hooks/useNetworkData', () => ({
  useNetworkData: jest.fn(),
}));

import { useNetworkData } from '@/app/components/devices/network/hooks/useNetworkData';

const mockedUseNetworkData = useNetworkData as jest.MockedFunction<typeof useNetworkData>;

function buildReturn(overrides: Partial<ReturnType<typeof useNetworkData>> = {}) {
  return {
    bandwidth: null,
    devices: [],
    wan: null,
    downloadHistory: [],
    uploadHistory: [],
    loading: false,
    connected: true,
    stale: false,
    lastUpdated: null,
    lastUpdatedAt: null,
    health: 'good',
    healthMapped: 'good',
    error: null,
    activeDeviceCount: 0,
    updateDeviceCategory: jest.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof useNetworkData>;
}

describe('NetworkCard (Phase 177 — DASH-08)', () => {
  const originalScrollTo = window.scrollTo;

  beforeEach(() => {
    mockedUseNetworkData.mockReset();
    window.scrollTo = jest.fn() as unknown as typeof window.scrollTo;
  });

  afterEach(() => {
    document.body.removeAttribute('style');
    window.scrollTo = originalScrollTo;
  });

  test('(a) renders large {down} numeric in network-down testid', () => {
    mockedUseNetworkData.mockReturnValue(
      buildReturn({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        bandwidth: { download: 350, upload: 120, timestamp: Date.now() } as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        devices: [{}, {}, {}, {}, {}] as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        wan: { connected: true } as any,
      })
    );

    const { getByTestId } = render(<NetworkCard />);
    expect(getByTestId('network-down')).toHaveTextContent('350');
  });

  test('(b) subtitle reads "{up} Mbps ↑ · {N} dispositivi"', () => {
    mockedUseNetworkData.mockReturnValue(
      buildReturn({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        bandwidth: { download: 350, upload: 120, timestamp: Date.now() } as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        devices: [{}, {}, {}, {}, {}] as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        wan: { connected: true } as any,
      })
    );

    const { getByText } = render(<NetworkCard />);
    expect(getByText(/120 Mbps ↑ · 5 dispositivi/)).toBeInTheDocument();
  });

  test('(c) when wan.connected === false, StatusDot renders amber (#ffb84a)', () => {
    mockedUseNetworkData.mockReturnValue(
      buildReturn({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        bandwidth: { download: 0, upload: 0, timestamp: Date.now() } as any,
        devices: [],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        wan: { connected: false } as any,
      })
    );

    const { getByTestId } = render(<NetworkCard />);
    const dot = getByTestId('status-dot');
    // StatusDot writes the color into background + boxShadow inline style.
    // jsdom normalizes hex `#ffb84a` to `rgb(255, 184, 74)`; assert either form.
    const bg = dot.style.background;
    expect(
      bg.includes('#ffb84a') || bg.includes('rgb(255, 184, 74)')
    ).toBe(true);
  });

  test('(d) clicking card opens the placeholder sheet (data-state flips)', () => {
    mockedUseNetworkData.mockReturnValue(
      buildReturn({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        bandwidth: { download: 350, upload: 120, timestamp: Date.now() } as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        wan: { connected: true } as any,
      })
    );

    const { getByTestId, container } = render(<NetworkCard />);
    const dialogBefore = container.ownerDocument.querySelector('[role="dialog"]') as HTMLElement | null;
    expect(dialogBefore?.getAttribute('data-state')).not.toBe('open');

    fireEvent.click(getByTestId('network-card'));

    const dialogAfter = container.ownerDocument.querySelector('[role="dialog"]') as HTMLElement | null;
    expect(dialogAfter?.getAttribute('data-state')).toBe('open');
    expect(dialogAfter?.textContent).toMatch(/Controlli in arrivo/i);
  });

  test('(e) bandwidth=null + devices=[] fall back to 0 / "0 Mbps ↑ · 0 dispositivi"', () => {
    mockedUseNetworkData.mockReturnValue(
      buildReturn({ bandwidth: null, devices: [], wan: null })
    );

    const { getByTestId, getByText } = render(<NetworkCard />);
    expect(getByTestId('network-down')).toHaveTextContent('0');
    expect(getByText(/0 Mbps ↑ · 0 dispositivi/)).toBeInTheDocument();
  });
});
