/**
 * StoveCard — Phase 177 (DASH-02) — Jest unit tests
 *
 * Coverage:
 *   (a) renders 36px power_level readout with NO °C unit when on (A-01 deviation)
 *   (b) renders Spenta subtitle when off
 *   (c) clicking card opens sheet with placeholder body
 *
 * A-01 deviation rationale:
 *   Thermorossi proxy exposes only `power_level` (1..5 dimensionless integer).
 *   Rendering a `°C` superscript would be a semantic lie. The 36px display
 *   shows the digit alone. Test (a) asserts NO `°C` substring in the DOM
 *   near the value.
 */
import { fireEvent, render } from '@testing-library/react';

// Mock useStoveData BEFORE importing the component. Mock returns a partial
// UseStoveDataReturn — fields not used by StoveCard are omitted.
jest.mock('@/app/components/devices/stove/hooks/useStoveData', () => ({
  useStoveData: jest.fn(),
}));
// 260506-d45: useStoveCommands is now called from StoveCard (hook lifted from
// StoveSheet body); stub it to avoid pulling in ToastProvider / retryable
// command machinery.
jest.mock('@/app/components/devices/stove/hooks/useStoveCommands', () => ({
  useStoveCommands: () => ({
    handleIgnite: jest.fn(),
    handleShutdown: jest.fn(),
    handlePowerChange: jest.fn(),
    handleFanChange: jest.fn(),
  }),
}));
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));
jest.mock('@/lib/auth/useUser', () => ({
  useUser: () => ({ user: { sub: 'test-user' } }),
}));
// Mock the real StoveSheet body (Phase 178-09 swap; 260506-d45 props lifted)
// so the card-level test does not exercise StoveSheet's render branch. The
// stub ignores all props (it now receives stoveData/cmds/onNavigate from the
// card).
jest.mock('../../sheets/StoveSheet', () => ({
  StoveSheet: () => <div data-testid="stove-sheet" />,
}));

import StoveCard from '../StoveCard';
import { useStoveData } from '@/app/components/devices/stove/hooks/useStoveData';

const useStoveDataMock = useStoveData as jest.Mock;
const originalScrollTo = window.scrollTo;

describe('StoveCard (Phase 177 — DASH-02)', () => {
  beforeEach(() => {
    useStoveDataMock.mockReset();
    // jsdom scrollTo is a noop that may throw — Sheet uses it on close
    window.scrollTo = jest.fn() as unknown as typeof window.scrollTo;
  });

  afterEach(() => {
    document.body.removeAttribute('style');
    window.scrollTo = originalScrollTo;
  });

  test('(a) renders 36px power_level readout with NO °C unit when on (A-01)', () => {
    useStoveDataMock.mockReturnValue({
      isAccesa: true,
      powerLevel: 3,
      fanLevel: 2,
      staleness: { isStale: false, cachedAt: new Date(), ageSeconds: 1 },
    });
    const { getByTestId, getByText } = render(<StoveCard />);
    const tempEl = getByTestId('stove-temp');
    expect(tempEl.textContent).toContain('3');
    // A-01: NO temperature unit — power_level is dimensionless 1..5.
    expect(tempEl.textContent).not.toContain('°C');
    expect(tempEl.textContent).not.toContain('°');
    expect(getByText('Fiamma 3 · Ventola 2')).toBeInTheDocument();
  });

  test('(b) renders Spenta subtitle when off', () => {
    useStoveDataMock.mockReturnValue({
      isAccesa: false,
      powerLevel: 0,
      fanLevel: 0,
      staleness: null,
    });
    const { getByText } = render(<StoveCard />);
    expect(getByText('Spenta')).toBeInTheDocument();
  });

  test('(c) clicking card opens sheet (translateY(0) and stove-sheet body mounted)', () => {
    useStoveDataMock.mockReturnValue({
      isAccesa: true,
      powerLevel: 1,
      fanLevel: 1,
      staleness: null,
    });
    const { getByTestId, container, queryByTestId } = render(<StoveCard />);
    // Sheet no longer uses forceMount (260506-d45 follow-up — see Sheet.tsx:108-112,
    // 131-137); when closed the dialog and StoveSheet body are unmounted entirely.
    expect(container.ownerDocument.querySelector('[role="dialog"]')).toBeNull();
    expect(queryByTestId('stove-sheet')).toBeNull();
    fireEvent.click(getByTestId('stove-card'));
    const dialogOpen = container.ownerDocument.querySelector('[role="dialog"]') as HTMLElement | null;
    expect(dialogOpen?.getAttribute('style') ?? '').toContain('translateY(0)');
    expect(getByTestId('stove-sheet')).toBeInTheDocument();
  });

  test('(d) renders dash placeholder when powerLevel is null', () => {
    useStoveDataMock.mockReturnValue({
      isAccesa: false,
      powerLevel: null,
      fanLevel: null,
      staleness: null,
    });
    const { getByTestId } = render(<StoveCard />);
    const tempEl = getByTestId('stove-temp');
    expect(tempEl.textContent).toContain('—');
  });

  test('(e) StatusDot uses amber stale color when staleness.isStale is true (D-25)', () => {
    useStoveDataMock.mockReturnValue({
      isAccesa: true,
      powerLevel: 4,
      fanLevel: 3,
      staleness: { isStale: true, cachedAt: new Date(), ageSeconds: 600 },
    });
    const { getByTestId } = render(<StoveCard />);
    const dot = getByTestId('status-dot');
    expect(dot.getAttribute('style') ?? '').toContain('#ffb84a');
  });

  // ROADMAP M9: cleaning due must be visible on the card, not only in the sheet.
  test('(f) cleaning due: badge, amber alert with hours, instead of "Spenta"', () => {
    useStoveDataMock.mockReturnValue({
      isAccesa: false,
      powerLevel: 0,
      fanLevel: 1,
      staleness: null,
      needsMaintenance: true,
      maintenanceStatus: { currentHours: 4577.28, targetHours: 100, needsCleaning: true },
    });
    const { getByTestId, queryByText } = render(<StoveCard />);

    expect(getByTestId('stove-cleaning-badge')).toHaveAttribute('aria-label', 'Pulizia richiesta');
    const alert = getByTestId('stove-maintenance-alert');
    expect(alert).toHaveAttribute('role', 'status');
    expect(alert.textContent).toContain('Pulizia richiesta');
    expect(alert.textContent).toContain('4577 h di lavoro');
    expect(queryByText('Spenta')).toBeNull();
  });

  test('(g) no cleaning alert when maintenance is not due', () => {
    useStoveDataMock.mockReturnValue({
      isAccesa: false,
      powerLevel: 0,
      fanLevel: 1,
      staleness: null,
      needsMaintenance: false,
      maintenanceStatus: { currentHours: 12, targetHours: 50, needsCleaning: false },
    });
    const { queryByTestId, getByText } = render(<StoveCard />);

    expect(queryByTestId('stove-cleaning-badge')).toBeNull();
    expect(queryByTestId('stove-maintenance-alert')).toBeNull();
    expect(getByText('Spenta')).toBeInTheDocument();
  });

  test('(h) cleaning due without loaded hours still shows the alert', () => {
    useStoveDataMock.mockReturnValue({
      isAccesa: false,
      powerLevel: 0,
      fanLevel: 1,
      staleness: null,
      needsMaintenance: true,
      maintenanceStatus: null,
    });
    const { getByTestId } = render(<StoveCard />);

    expect(getByTestId('stove-maintenance-alert').textContent).toBe('Pulizia richiesta');
  });

  test('(M15) renders the skeleton until the first status arrives', () => {
    useStoveDataMock.mockReturnValue({
      initialLoading: true,
      isAccesa: false,
      powerLevel: null,
      fanLevel: null,
      staleness: null,
    });
    const { getByTestId, queryByTestId, queryByText } = render(<StoveCard />);
    expect(getByTestId('glass-card-skeleton')).toHaveAttribute('aria-label', 'Stufa: caricamento');
    expect(queryByTestId('stove-card')).toBeNull();
    expect(queryByText('Spenta')).toBeNull();
  });
});
