/**
 * RaspiCard — Phase 177 (DASH-09) — Jest unit tests
 *
 * Mirrors `app/components/EmberGlass/__tests__/Sheet.test.tsx` mock + state-assertion
 * structure. Per D-11 / SC-#3, this card renders STATIC (no Pressable, no Sheet, no onOpen)
 * — the tests assert the absence of the interactive plumbing.
 */
import { fireEvent, render } from '@testing-library/react';

import RaspiCard from '../RaspiCard';

// Hook mock — overridable per test via `mockReturnValue`.
const useRaspiDataMock = jest.fn();
jest.mock('@/app/components/devices/raspi/hooks/useRaspiData', () => ({
  useRaspiData: () => useRaspiDataMock(),
}));

describe('RaspiCard (Phase 177 — DASH-09)', () => {
  beforeEach(() => {
    useRaspiDataMock.mockReset();
    useRaspiDataMock.mockReturnValue({
      data: { cpuPercent: 45, memoryPercent: 67, diskPercent: 30, cpuTemperature: 52 },
      loading: false,
      error: null,
      stale: false,
      health: 'ok',
      lastUpdatedAt: 1,
    });
  });

  test('renders the CPU and RAM MiniStat values from the hook', () => {
    const { getByText } = render(<RaspiCard />);
    expect(getByText('45%')).toBeInTheDocument();
    expect(getByText('67%')).toBeInTheDocument();
  });

  test('renders the CPU temperature footer', () => {
    const { getByText } = render(<RaspiCard />);
    // Footer text is split across nodes; use a flexible matcher.
    expect(getByText(/CPU temp/i).textContent).toContain('52');
    expect(getByText(/CPU temp/i).textContent).toContain('°C');
  });

  test('clicking the card does NOT open any sheet (D-11 / SC-#3)', () => {
    const { getByTestId, queryByText, queryByRole } = render(<RaspiCard />);
    const card = getByTestId('raspi-card');
    fireEvent.click(card);
    expect(queryByText(/Controlli in arrivo/i)).toBeNull();
    expect(queryByRole('dialog')).toBeNull();
  });

  test('renders "—" when cpuTemperature is null', () => {
    useRaspiDataMock.mockReturnValue({
      data: { cpuPercent: 10, memoryPercent: 20, diskPercent: 5, cpuTemperature: null },
      loading: false,
      error: null,
      stale: false,
      health: 'ok',
      lastUpdatedAt: 1,
    });
    const { getByText } = render(<RaspiCard />);
    expect(getByText(/CPU temp/i).textContent).toContain('—');
    expect(getByText(/CPU temp/i).textContent).toContain('°C');
  });

  test('card root has no cursor: pointer (read-only — D-11)', () => {
    const { getByTestId } = render(<RaspiCard />);
    const card = getByTestId('raspi-card');
    expect(card.style.cursor).not.toBe('pointer');
  });
});
