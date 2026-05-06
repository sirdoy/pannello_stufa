/**
 * StoveSheet jest spec — Plan 178-04 (SHEET-02 / CONTEXT D-05).
 *
 * Mocks every collaborating hook (useStoveData, useStoveCommands, useRouter,
 * useUser, useVersion) so the sheet can be rendered in isolation. The
 * stoveDataOverride object lets each test reshape the hook return to drive
 * the on/off/needsMaintenance/loading/error branches.
 *
 * FlameViz is replaced with a tiny stub to avoid pulling in the full SVG
 * primitive (and its `data-flame-viz="true"` global animation hooks).
 */

import { fireEvent, render, screen } from '@testing-library/react';
// 260506-d45: render the SelfFetch zero-prop variant so the existing hook-mock
// blocks below keep intercepting the inner useStoveData/useStoveCommands
// calls. The presentational `StoveSheet` (now prop-based) is exercised in a
// dedicated test at the bottom of the file with explicit fixture props.
import { StoveSheet, StoveSheetSelfFetch } from '../StoveSheet';

// --- Router / Auth0 / Version mocks -------------------------------------
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@auth0/nextjs-auth0/client', () => ({
  useUser: () => ({ user: { sub: 'auth0|test' } }),
}));

jest.mock('@/app/context/VersionContext', () => ({
  useVersion: () => ({ checkVersion: jest.fn() }),
}));

// --- Stove command mocks ------------------------------------------------
const mockHandleIgnite = jest.fn().mockResolvedValue(undefined);
const mockHandleShutdown = jest.fn().mockResolvedValue(undefined);
const mockHandlePowerChange = jest.fn().mockResolvedValue(undefined);
const mockHandleFanChange = jest.fn().mockResolvedValue(undefined);

jest.mock('@/app/components/devices/stove/hooks/useStoveCommands', () => ({
  useStoveCommands: () => ({
    handleIgnite: mockHandleIgnite,
    handleShutdown: mockHandleShutdown,
    handlePowerChange: mockHandlePowerChange,
    handleFanChange: mockHandleFanChange,
  }),
}));

// --- Stove data mock with mutable override ------------------------------
const baseStoveData = {
  isAccesa: false,
  powerLevel: 3 as number | null,
  fanLevel: 2 as number | null,
  needsMaintenance: false,
  initialLoading: false,
  errorDescription: '' as string,
  errorCode: 0,
  setLoading: jest.fn(),
  setLoadingMessage: jest.fn(),
  fetchStatusAndUpdate: jest.fn(),
  setSchedulerEnabled: jest.fn(),
  setSemiManualMode: jest.fn(),
  setReturnToAutoAt: jest.fn(),
  setNextScheduledAction: jest.fn(),
  setCleaningInProgress: jest.fn(),
  fetchMaintenanceStatus: jest.fn(),
  semiManualMode: false,
};

let stoveDataOverride: Partial<typeof baseStoveData> = {};

jest.mock('@/app/components/devices/stove/hooks/useStoveData', () => ({
  useStoveData: () => ({ ...baseStoveData, ...stoveDataOverride }),
}));

// --- FlameViz stub (avoid pulling in full primitive) --------------------
jest.mock('../../FlameViz', () => ({
  FlameViz: (props: { on: boolean; intensity: number }) => (
    <div
      data-testid="flame-viz-mock"
      data-on={String(props.on)}
      data-intensity={String(props.intensity)}
    />
  ),
}));

beforeEach(() => {
  jest.clearAllMocks();
  stoveDataOverride = {};
});

describe('StoveSheet (SHEET-02 / CONTEXT D-05)', () => {
  test('renders OFF state hero + power/fan rows + Orari/Manutenzione + Accendi primary', () => {
    stoveDataOverride = { isAccesa: false, powerLevel: 3, fanLevel: 2 };
    render(<StoveSheetSelfFetch />);
    expect(screen.getByTestId('stove-sheet')).toBeInTheDocument();
    expect(screen.getByTestId('stove-sheet-state')).toHaveTextContent('Spenta');
    expect(screen.getByTestId('stove-sheet-temp')).toHaveTextContent('3');
    expect(screen.getByTestId('stove-sheet-temp')).toHaveTextContent('/5');
    expect(screen.getByText('Livello fiamma')).toBeInTheDocument();
    expect(screen.getByText('Ventola')).toBeInTheDocument();
    expect(screen.getByTestId('sheet-btn-orari')).toBeInTheDocument();
    expect(screen.getByTestId('sheet-btn-manutenzione')).toBeInTheDocument();
    expect(screen.getByTestId('stove-sheet-primary-action')).toHaveTextContent(
      'Accendi stufa',
    );
  });

  test('renders ON state hero + Spegni primary', () => {
    stoveDataOverride = { isAccesa: true, powerLevel: 4, fanLevel: 3 };
    render(<StoveSheetSelfFetch />);
    expect(screen.getByTestId('stove-sheet-state')).toHaveTextContent('In funzione');
    expect(screen.getByTestId('stove-sheet-primary-action')).toHaveTextContent(
      'Spegni stufa',
    );
  });

  test('disables primary action with Manutenzione richiesta when needsMaintenance', () => {
    stoveDataOverride = { isAccesa: false, needsMaintenance: true };
    render(<StoveSheetSelfFetch />);
    const btn = screen.getByTestId('stove-sheet-primary-action');
    expect(btn).toHaveTextContent('Manutenzione richiesta');
    expect(btn).toBeDisabled();
  });

  test('clicking power stepper plus invokes handlePowerChange with String(value+1)', () => {
    stoveDataOverride = { powerLevel: 3 };
    render(<StoveSheetSelfFetch />);
    const powerWrap = screen.getByTestId('stove-sheet-power-stepper');
    const plus = powerWrap.querySelector(
      '[data-testid="stepper-plus"]',
    ) as HTMLElement;
    fireEvent.click(plus);
    expect(mockHandlePowerChange).toHaveBeenCalledWith({
      target: { value: '4' },
    });
  });

  test('clicking fan stepper minus invokes handleFanChange with String(value-1)', () => {
    stoveDataOverride = { fanLevel: 2 };
    render(<StoveSheetSelfFetch />);
    const fanWrap = screen.getByTestId('stove-sheet-fan-stepper');
    const minus = fanWrap.querySelector(
      '[data-testid="stepper-minus"]',
    ) as HTMLElement;
    fireEvent.click(minus);
    expect(mockHandleFanChange).toHaveBeenCalledWith({
      target: { value: '1' },
    });
  });

  test('clicking primary action when off invokes handleIgnite', () => {
    stoveDataOverride = { isAccesa: false };
    render(<StoveSheetSelfFetch />);
    fireEvent.click(screen.getByTestId('stove-sheet-primary-action'));
    expect(mockHandleIgnite).toHaveBeenCalledTimes(1);
    expect(mockHandleShutdown).not.toHaveBeenCalled();
  });

  test('clicking primary action when on invokes handleShutdown', () => {
    stoveDataOverride = { isAccesa: true };
    render(<StoveSheetSelfFetch />);
    fireEvent.click(screen.getByTestId('stove-sheet-primary-action'));
    expect(mockHandleShutdown).toHaveBeenCalledTimes(1);
    expect(mockHandleIgnite).not.toHaveBeenCalled();
  });

  test('disabled primary action does not fire ignite or shutdown', () => {
    stoveDataOverride = { needsMaintenance: true };
    render(<StoveSheetSelfFetch />);
    fireEvent.click(screen.getByTestId('stove-sheet-primary-action'));
    expect(mockHandleIgnite).not.toHaveBeenCalled();
    expect(mockHandleShutdown).not.toHaveBeenCalled();
  });

  test('Orari button navigates to /stove/scheduler', () => {
    render(<StoveSheetSelfFetch />);
    fireEvent.click(screen.getByTestId('sheet-btn-orari'));
    expect(mockPush).toHaveBeenCalledWith('/stove/scheduler');
  });

  test('Manutenzione button navigates to /stove/maintenance', () => {
    render(<StoveSheetSelfFetch />);
    fireEvent.click(screen.getByTestId('sheet-btn-manutenzione'));
    expect(mockPush).toHaveBeenCalledWith('/stove/maintenance');
  });

  test('renders single skeleton block when initialLoading and no cached data', () => {
    stoveDataOverride = {
      initialLoading: true,
      powerLevel: null,
      fanLevel: null,
    };
    render(<StoveSheetSelfFetch />);
    expect(screen.getByTestId('stove-sheet-skeleton')).toBeInTheDocument();
    expect(screen.queryByTestId('stove-sheet')).not.toBeInTheDocument();
  });

  test('renders error state when errorDescription is set and no cached data', () => {
    stoveDataOverride = {
      errorDescription: 'boom',
      powerLevel: null,
      fanLevel: null,
    };
    render(<StoveSheetSelfFetch />);
    expect(screen.getByTestId('stove-sheet-error')).toBeInTheDocument();
    expect(
      screen.getByText('Non raggiungibile. Riprova più tardi.'),
    ).toBeInTheDocument();
    expect(screen.getByText('boom')).toBeInTheDocument();
  });

  // 260506-d45 — locks in the prop-based contract: the presentational
  // StoveSheet must render with explicit data + cmds props and no internal
  // hook calls. If a future regression re-introduces use*Data/use*Commands
  // into the body, this test stays green only because the mocks would still
  // intercept — but the body grep regression in done-criteria would fail.
  test('260506-d45: presentational StoveSheet renders with explicit prop fixtures', () => {
    const propStoveData = { ...baseStoveData, isAccesa: true, powerLevel: 4, fanLevel: 3 } as unknown as Parameters<typeof StoveSheet>[0]['stoveData'];
    const propCmds = {
      handleIgnite: mockHandleIgnite,
      handleShutdown: mockHandleShutdown,
      handlePowerChange: mockHandlePowerChange,
      handleFanChange: mockHandleFanChange,
    } as unknown as Parameters<typeof StoveSheet>[0]['cmds'];
    const onNavigate = jest.fn();
    render(
      <StoveSheet
        stoveData={propStoveData}
        cmds={propCmds}
        onNavigate={onNavigate}
      />,
    );
    expect(screen.getByTestId('stove-sheet')).toBeInTheDocument();
    expect(screen.getByTestId('stove-sheet-state')).toHaveTextContent('In funzione');
    expect(screen.getByTestId('stove-sheet-temp')).toHaveTextContent('4');
    // onNavigate is invoked instead of router.push — proves the card-owned
    // navigation callback is honored by the presentational sheet.
    fireEvent.click(screen.getByTestId('sheet-btn-orari'));
    expect(onNavigate).toHaveBeenCalledWith('/stove/scheduler');
  });
});
