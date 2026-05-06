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
jest.mock('@auth0/nextjs-auth0/client', () => ({
  useUser: () => ({ user: { sub: 'test-user' } }),
}));
jest.mock('@/app/context/VersionContext', () => ({
  useVersion: () => ({ checkVersion: jest.fn() }),
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
});
