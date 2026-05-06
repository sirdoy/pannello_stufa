/**
 * TuyaCard — Phase 177 (DASH-10) — Jest unit tests
 *
 * Mirrors `app/components/EmberGlass/__tests__/Sheet.test.tsx` mock + state-assertion
 * structure. Per DASH-10, the dashboard surface has NO inline toggles — toggles live
 * in the PlugsSheet (Phase 178). The tests assert that absence.
 *
 * Real `TuyaPlug` shape (types/tuyaProxy.ts:33-46):
 *   { device_id, switch_on: boolean | null, power_w: number | null, custom_name: string | null, ... }
 * The card maps these to the visual contract from the plan (id/name/on/power).
 */
import { fireEvent, render } from '@testing-library/react';

import TuyaCard from '../TuyaCard';

// Hook mock — overridable per test via `mockReturnValue`.
const useTuyaDataMock = jest.fn();
jest.mock('@/app/components/devices/tuya/hooks/useTuyaData', () => ({
  useTuyaData: () => useTuyaDataMock(),
}));
// 260506-d45: useTuyaCommands is now called from TuyaCard (hook lifted from
// PlugsSheet body); stub it to avoid pulling in retryable command machinery.
jest.mock('@/app/components/devices/tuya/hooks/useTuyaCommands', () => ({
  useTuyaCommands: () => ({
    togglePlug: jest.fn(),
    setTimer: jest.fn(),
    cancelTimer: jest.fn(),
  }),
}));
// Mock the real PlugsSheet body (Phase 178-09 swap; 260506-d45 props lifted)
// so the card-level test does not run PlugsSheet's hooks (useTuyaCommands,
// optimistic toggles). The stub ignores all props.
jest.mock('../../sheets/PlugsSheet', () => ({
  PlugsSheet: () => <div data-testid="plugs-sheet" />,
}));

function makePlug(overrides: Partial<{
  device_id: string;
  switch_on: boolean | null;
  power_w: number | null;
  custom_name: string | null;
}> = {}) {
  return {
    device_id: 'p',
    switch_on: false,
    power_w: 0,
    voltage_v: null,
    current_ma: null,
    energy_kwh: null,
    countdown_s: null,
    data_freshness: 'LIVE' as const,
    last_polled_at: null,
    custom_name: null,
    device_type: null,
    ...overrides,
  };
}

describe('TuyaCard (Phase 177 — DASH-10)', () => {
  beforeEach(() => {
    useTuyaDataMock.mockReset();
  });

  test('right slot shows total power in W when total < 1000', () => {
    useTuyaDataMock.mockReturnValue({
      plugs: [
        makePlug({ device_id: 'p1', custom_name: 'TV', switch_on: true, power_w: 120 }),
        makePlug({ device_id: 'p2', custom_name: 'Frigo', switch_on: true, power_w: 800 }),
        makePlug({ device_id: 'p3', custom_name: 'Lampada', switch_on: false, power_w: 0 }),
      ],
      loading: false,
      error: null,
      stale: false,
      lastUpdatedAt: 1,
    });
    const { getByText } = render(<TuyaCard />);
    expect(getByText('920W')).toBeInTheDocument();
  });

  test('right slot shows kW with 1 decimal when total >= 1000', () => {
    useTuyaDataMock.mockReturnValue({
      plugs: [
        makePlug({ device_id: 'a', custom_name: 'A', switch_on: true, power_w: 1500 }),
      ],
      loading: false, error: null, stale: false, lastUpdatedAt: 1,
    });
    const { getByText } = render(<TuyaCard />);
    expect(getByText('1.5kW')).toBeInTheDocument();
  });

  test('renders one row per plug name (up to 4)', () => {
    useTuyaDataMock.mockReturnValue({
      plugs: [
        makePlug({ device_id: 'p1', custom_name: 'TV', switch_on: true, power_w: 120 }),
        makePlug({ device_id: 'p2', custom_name: 'Frigo', switch_on: true, power_w: 800 }),
        makePlug({ device_id: 'p3', custom_name: 'Lampada', switch_on: false, power_w: 0 }),
      ],
      loading: false, error: null, stale: false, lastUpdatedAt: 1,
    });
    const { getByText } = render(<TuyaCard />);
    expect(getByText('TV')).toBeInTheDocument();
    expect(getByText('Frigo')).toBeInTheDocument();
    expect(getByText('Lampada')).toBeInTheDocument();
  });

  test('footer shows "{onCount} di {total} accese"', () => {
    useTuyaDataMock.mockReturnValue({
      plugs: [
        makePlug({ device_id: 'p1', custom_name: 'TV', switch_on: true, power_w: 120 }),
        makePlug({ device_id: 'p2', custom_name: 'Frigo', switch_on: true, power_w: 800 }),
        makePlug({ device_id: 'p3', custom_name: 'Lampada', switch_on: false, power_w: 0 }),
      ],
      loading: false, error: null, stale: false, lastUpdatedAt: 1,
    });
    const { getByText } = render(<TuyaCard />);
    expect(getByText('2 di 3 accese')).toBeInTheDocument();
  });

  test('NO inline toggle in card body (DASH-10 — no role="switch")', () => {
    useTuyaDataMock.mockReturnValue({
      plugs: [
        makePlug({ device_id: 'p1', custom_name: 'TV', switch_on: true, power_w: 120 }),
      ],
      loading: false, error: null, stale: false, lastUpdatedAt: 1,
    });
    const { getByTestId } = render(<TuyaCard />);
    const card = getByTestId('tuya-card');
    expect(card.querySelectorAll('[role="switch"]').length).toBe(0);
  });

  test('clicking the card opens the real PlugsSheet body (Phase 178-09)', () => {
    useTuyaDataMock.mockReturnValue({
      plugs: [],
      loading: false, error: null, stale: false, lastUpdatedAt: 1,
    });
    const { getByTestId, queryByRole } = render(<TuyaCard />);
    // Sheet uses forceMount → body is in DOM but dialog content has translateY(110%)
    // when closed. We assert the dialog visibility transition via the inline transform.
    const dialogBefore = document.querySelector('[role="dialog"]') as HTMLElement | null;
    if (dialogBefore) {
      expect(dialogBefore.getAttribute('style') ?? '').toContain('translateY(110%)');
    } else {
      expect(dialogBefore).toBeNull();
    }
    fireEvent.click(getByTestId('tuya-card'));
    // After click → dialog should be present and translated to 0
    const dialogAfter = queryByRole('dialog');
    expect(dialogAfter).not.toBeNull();
    expect(dialogAfter!.getAttribute('style') ?? '').toContain('translateY(0)');
    // Real PlugsSheet body is mounted (mocked here) on open.
    expect(getByTestId('plugs-sheet')).toBeInTheDocument();
  });

  test('empty plug list renders 0W + "0 di 0 accese"', () => {
    useTuyaDataMock.mockReturnValue({
      plugs: [],
      loading: false, error: null, stale: false, lastUpdatedAt: 1,
    });
    const { getByText } = render(<TuyaCard />);
    expect(getByText('0W')).toBeInTheDocument();
    expect(getByText('0 di 0 accese')).toBeInTheDocument();
  });
});
