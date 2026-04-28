/**
 * DirigeraCard — Phase 177 (DASH-10 sibling) — Jest unit tests
 *
 * Per A-02 / RESEARCH LANDMINE #2: useDirigeraData() exposes sensors only, NOT plugs.
 * The card renders an empty-list mode (0W, "0 di 0 accese", no rows). The hook is
 * still consumed so that a future phase can replace the empty array without re-wiring.
 */
import { fireEvent, render } from '@testing-library/react';

import DirigeraCard from '../DirigeraCard';

const useDirigeraDataMock = jest.fn();
jest.mock('@/app/components/devices/dirigera/hooks/useDirigeraData', () => ({
  useDirigeraData: () => useDirigeraDataMock(),
}));

describe('DirigeraCard (Phase 177 — DASH-10 / A-02)', () => {
  beforeEach(() => {
    useDirigeraDataMock.mockReset();
    useDirigeraDataMock.mockReturnValue({
      data: {
        health: { firmware_version: '', connected_sensors: 0, is_reachable: true },
        summary: { total_sensors: 0, offline_count: 0, low_battery_count: 0, open_count: 0, is_stale: false },
      },
      loading: false,
      error: null,
      stale: false,
      health: 'ok',
      lastUpdatedAt: 1,
    });
  });

  test('right slot shows "0W" (empty plug list per A-02)', () => {
    const { getByText } = render(<DirigeraCard />);
    expect(getByText('0W')).toBeInTheDocument();
  });

  test('footer shows "0 di 0 accese"', () => {
    const { getByText } = render(<DirigeraCard />);
    expect(getByText('0 di 0 accese')).toBeInTheDocument();
  });

  test('clicking the card opens a sheet titled "IKEA"', () => {
    const { getByTestId, queryByText, queryByRole } = render(<DirigeraCard />);
    fireEvent.click(getByTestId('dirigera-card'));
    const dialog = queryByRole('dialog');
    expect(dialog).not.toBeNull();
    expect(dialog!.getAttribute('style') ?? '').toContain('translateY(0)');
    expect(queryByText('IKEA')).toBeInTheDocument();
  });

  test('NO inline toggle in card body (DASH-10)', () => {
    const { getByTestId } = render(<DirigeraCard />);
    const card = getByTestId('dirigera-card');
    expect(card.querySelectorAll('[role="switch"]').length).toBe(0);
  });

  test('card root has data-testid="dirigera-card"', () => {
    const { getByTestId } = render(<DirigeraCard />);
    expect(getByTestId('dirigera-card')).toBeInTheDocument();
  });
});
