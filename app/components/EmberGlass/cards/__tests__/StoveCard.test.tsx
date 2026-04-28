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
jest.mock('@auth0/nextjs-auth0/client', () => ({
  useUser: () => ({ user: { sub: 'test-user' } }),
}));
jest.mock('@/app/context/VersionContext', () => ({
  useVersion: () => ({ checkVersion: jest.fn() }),
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

  test('(c) clicking card opens sheet (transform changes from translateY(110%) to translateY(0))', () => {
    useStoveDataMock.mockReturnValue({
      isAccesa: true,
      powerLevel: 1,
      fanLevel: 1,
      staleness: null,
    });
    const { getByTestId, container } = render(<StoveCard />);
    // Sheet uses forceMount so the dialog stays in the DOM with translateY(110%) when closed.
    const dialogClosed = container.ownerDocument.querySelector('[role="dialog"]') as HTMLElement | null;
    expect(dialogClosed?.getAttribute('style') ?? '').toContain('translateY(110%)');
    // The placeholder body is mounted, so we assert via the data-testid sheet element transform.
    fireEvent.click(getByTestId('stove-card'));
    const dialogOpen = container.ownerDocument.querySelector('[role="dialog"]') as HTMLElement | null;
    expect(dialogOpen?.getAttribute('style') ?? '').toContain('translateY(0)');
    // Sheet placeholder body is the visible (non-translated) content.
    expect(getByTestId('sheet-placeholder-body')).toBeInTheDocument();
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
