/**
 * StoveCard — Phase 177 (DASH-02), reworked in ROADMAP M77 — Jest unit tests
 *
 * The tile shows a state word, the two levels while the stove burns, and one
 * detail line: what is wrong (alarm, old data, pellet reserve) or what the
 * schedule does next. No temperature: the proxy exposes levels only.
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

  test('(a) on: state word and both levels, no temperature unit', () => {
    useStoveDataMock.mockReturnValue({
      status: 'working',
      isAccesa: true,
      powerLevel: 3,
      fanLevel: 2,
      staleness: { isStale: false, cachedAt: new Date(), ageSeconds: 1 },
    });
    const { getByTestId } = render(<StoveCard />);
    expect(getByTestId('stove-state')).toHaveTextContent('Accesa');
    expect(getByTestId('stove-levels')).toHaveTextContent('Potenza 3 · Ventola 2');
    expect(getByTestId('stove-card').textContent).not.toContain('°');
    // No schedule loaded → the detail line falls back to the mode.
    expect(getByTestId('stove-detail')).toHaveTextContent('Manuale');
  });

  test('(b) off: "Spenta", no levels, next scheduled ignition', () => {
    const at = new Date();
    at.setHours(18, 15, 0, 0);
    useStoveDataMock.mockReturnValue({
      status: 'off',
      isAccesa: false,
      powerLevel: 1,
      fanLevel: 1,
      staleness: null,
      schedulerEnabled: true,
      semiManualMode: false,
      returnToAutoAt: null,
      nextScheduledAction: { timestamp: at.toISOString(), action: 'ignite' },
    });
    const { getByTestId, queryByTestId } = render(<StoveCard />);
    expect(getByTestId('stove-state')).toHaveTextContent('Spenta');
    expect(queryByTestId('stove-levels')).toBeNull();
    expect(getByTestId('stove-detail')).toHaveTextContent('Accende alle 18:15');
  });

  test('(b2) alarm: red state word, error code, lit status dot', () => {
    useStoveDataMock.mockReturnValue({
      status: 'alarm',
      isAccesa: false,
      powerLevel: 1,
      fanLevel: 1,
      staleness: null,
      errorCode: 12,
    });
    const { getByTestId } = render(<StoveCard />);
    expect(getByTestId('stove-state')).toHaveTextContent('Allarme');
    expect(getByTestId('stove-detail')).toHaveTextContent('Errore 12');
    expect(getByTestId('status-dot')).toHaveAttribute('data-on', 'true');
    expect(getByTestId('status-dot').getAttribute('style') ?? '').toContain('#ff6676');
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

  test('(d) missing levels render as a dash', () => {
    useStoveDataMock.mockReturnValue({
      status: 'igniting',
      isAccesa: true,
      powerLevel: null,
      fanLevel: null,
      staleness: null,
    });
    const { getByTestId } = render(<StoveCard />);
    expect(getByTestId('stove-state')).toHaveTextContent('Avvio');
    expect(getByTestId('stove-levels')).toHaveTextContent('Potenza — · Ventola —');
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
    // The age of the reading replaces the schedule on the detail line.
    expect(getByTestId('stove-detail')).toHaveTextContent('Dati di 10 min fa');
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
    const { getByTestId, queryByTestId } = render(<StoveCard />);

    expect(getByTestId('stove-cleaning-badge')).toHaveAttribute('aria-label', 'Pulizia richiesta');
    const alert = getByTestId('stove-maintenance-alert');
    expect(alert).toHaveAttribute('role', 'status');
    expect(alert.textContent).toContain('Pulizia richiesta');
    expect(alert.textContent).toContain('4577 h di lavoro');
    expect(getByTestId('stove-state')).toHaveTextContent('Spenta');
    expect(queryByTestId('stove-detail')).toBeNull();
  });

  // ROADMAP D11: reserve sensor of the stove, read by the Pi from the local WiNet module.
  test('(f2) low pellet reserve shows the badge', () => {
    useStoveDataMock.mockReturnValue({
      isAccesa: true,
      powerLevel: 1,
      fanLevel: 1,
      staleness: null,
      needsMaintenance: false,
      pelletLow: true,
    });
    const { getByTestId, queryByTestId } = render(<StoveCard />);

    expect(getByTestId('stove-pellet-low-badge')).toHaveAttribute('aria-label', 'Pellet in riserva');
    expect(getByTestId('stove-detail')).toHaveTextContent('Pellet in riserva');
    expect(queryByTestId('stove-cleaning-badge')).toBeNull();
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
    expect(queryByTestId('stove-pellet-low-badge')).toBeNull();
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
