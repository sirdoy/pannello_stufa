/**
 * StoveSheet jest spec — Plan 178-04 (SHEET-02 / CONTEXT D-05), reworked in ROADMAP M77.
 *
 * Mocks every collaborating hook (useStoveData, useStoveCommands, useRouter,
 * useUser) so the sheet renders in isolation. The stoveDataOverride object
 * lets each test reshape the hook return to drive the on/off/alarm/stale/
 * cleaning/loading branches.
 *
 * FlameViz is replaced with a tiny stub.
 */

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
// 260506-d45: render the SelfFetch zero-prop variant so the existing hook-mock
// blocks below keep intercepting the inner useStoveData/useStoveCommands
// calls. The presentational `StoveSheet` (now prop-based) is exercised in a
// dedicated test at the bottom of the file with explicit fixture props.
import { StoveSheet, StoveSheetSelfFetch } from '../StoveSheet';

// --- Router / useUser / Version mocks -------------------------------------
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/lib/auth/useUser', () => ({
  useUser: () => ({ user: { sub: 'auth0|test' } }),
}));

// Button's haptic feedback warns in jsdom (no Vibration API).
jest.mock('@/app/hooks/useHaptic', () => ({
  useHaptic: () => ({ trigger: jest.fn() }),
}));

// --- Stove command mocks ------------------------------------------------
const mockHandleIgnite = jest.fn().mockResolvedValue(undefined);
const mockHandleShutdown = jest.fn().mockResolvedValue(undefined);
const mockHandlePowerChange = jest.fn().mockResolvedValue(undefined);
const mockHandleFanChange = jest.fn().mockResolvedValue(undefined);
const mockHandleClearSemiManual = jest.fn().mockResolvedValue(undefined);
const mockHandleConfirmCleaning = jest.fn().mockResolvedValue(undefined);

jest.mock('@/app/components/devices/stove/hooks/useStoveCommands', () => ({
  useStoveCommands: () => ({
    handleIgnite: mockHandleIgnite,
    handleShutdown: mockHandleShutdown,
    handlePowerChange: mockHandlePowerChange,
    handleFanChange: mockHandleFanChange,
    handleClearSemiManual: mockHandleClearSemiManual,
    handleConfirmCleaning: mockHandleConfirmCleaning,
  }),
}));

// --- Stove data mock with mutable override ------------------------------
const baseStoveData = {
  status: undefined as string | undefined,
  loading: false,
  unreachable: false,
  pelletLow: false,
  staleness: null as { isStale: boolean; cachedAt: Date | null; ageSeconds: number } | null,
  lastUpdatedAt: null as number | null,
  maintenanceStatus: null as { currentHours: number } | null,
  schedulerEnabled: false,
  returnToAutoAt: null as number | null,
  nextScheduledAction: null as { timestamp: string; action: 'ignite' | 'shutdown' | 'adjust' } | null,
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

const todayAt = (h: number, m: number) => {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
};

const option = (wrapId: string, level: number) =>
  screen.getByTestId(wrapId).querySelector(`[data-testid="level-picker-option-${level}"]`) as HTMLButtonElement;

describe('StoveSheet (SHEET-02 / CONTEXT D-05, M77)', () => {
  test('OFF: state, mode, four links, Accendi primary, no level pickers', () => {
    stoveDataOverride = { isAccesa: false, powerLevel: 3, fanLevel: 2 };
    render(<StoveSheetSelfFetch />);
    expect(screen.getByTestId('stove-sheet')).toBeInTheDocument();
    expect(screen.getByTestId('stove-sheet-state')).toHaveTextContent('Spenta');
    expect(screen.getByTestId('stove-sheet-schedule')).toHaveTextContent('Modalità manuale');
    // Levels are hidden while the stove is off (68319047).
    expect(screen.queryByTestId('stove-sheet-power')).toBeNull();
    expect(screen.queryByTestId('stove-sheet-fan')).toBeNull();
    for (const id of ['orari', 'clima', 'manutenzione', 'dettagli']) {
      expect(screen.getByTestId(`sheet-btn-${id}`)).toBeInTheDocument();
    }
    expect(screen.getByTestId('stove-sheet-primary-action')).toHaveTextContent('Accendi stufa');
    expect(screen.queryByTestId('stove-sheet-alarm')).toBeNull();
    expect(screen.queryByTestId('stove-sheet-command-error')).toBeNull();
  });

  test('ON: state, both pickers with the real ranges, Spegni primary', () => {
    stoveDataOverride = { status: 'working', isAccesa: true, powerLevel: 4, fanLevel: 6 };
    render(<StoveSheetSelfFetch />);
    expect(screen.getByTestId('stove-sheet-state')).toHaveTextContent('In funzione');
    expect(screen.getByTestId('stove-sheet-power')).toHaveTextContent('4 di 5');
    // The fan goes up to 6 (docs/api/thermorossi.md); the old stepper stopped at 5.
    expect(screen.getByTestId('stove-sheet-fan')).toHaveTextContent('6 di 6');
    expect(option('stove-sheet-fan', 6)).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByTestId('stove-sheet-primary-action')).toHaveTextContent('Spegni stufa');
  });

  test('hero shows mode and next scheduled action, and when the data was read', () => {
    stoveDataOverride = {
      status: 'working',
      isAccesa: true,
      schedulerEnabled: true,
      nextScheduledAction: { timestamp: todayAt(23, 0).toISOString(), action: 'shutdown' },
      lastUpdatedAt: todayAt(21, 4).getTime(),
    };
    render(<StoveSheetSelfFetch />);
    expect(screen.getByTestId('stove-sheet-schedule')).toHaveTextContent('Automatica · si spegne alle 23:00');
    expect(screen.getByTestId('stove-sheet-updated')).toHaveTextContent('Aggiornata alle 21:04');
  });

  test('semi-manual: "Torna in automatico" clears the override', async () => {
    stoveDataOverride = {
      status: 'working',
      isAccesa: true,
      schedulerEnabled: true,
      semiManualMode: true,
      returnToAutoAt: todayAt(23, 0).getTime(),
    };
    render(<StoveSheetSelfFetch />);
    expect(screen.getByTestId('stove-sheet-schedule')).toHaveTextContent('Semi-manuale · torna automatica alle 23:00');
    await act(async () => {
      fireEvent.click(screen.getByTestId('stove-sheet-back-to-auto'));
    });
    expect(mockHandleClearSemiManual).toHaveBeenCalledTimes(1);
  });

  test('no "Torna in automatico" outside semi-manual', () => {
    stoveDataOverride = { schedulerEnabled: true };
    render(<StoveSheetSelfFetch />);
    expect(screen.queryByTestId('stove-sheet-back-to-auto')).toBeNull();
  });

  test('alarm: banner with code and description, link to the alarm history', () => {
    stoveDataOverride = { status: 'alarm', errorCode: 12, errorDescription: 'Mancata accensione' };
    render(<StoveSheetSelfFetch />);
    expect(screen.getByTestId('stove-sheet-state')).toHaveTextContent('In allarme');
    const alarm = screen.getByTestId('stove-sheet-alarm');
    expect(alarm).toHaveTextContent('Allarme 12');
    expect(alarm).toHaveTextContent('Mancata accensione');
    fireEvent.click(screen.getByRole('button', { name: 'Storico allarmi' }));
    expect(mockPush).toHaveBeenCalledWith('/stove/errors');
  });

  test('stale data: warning with the age, no "Aggiornata" line', () => {
    stoveDataOverride = {
      status: 'working',
      isAccesa: true,
      staleness: { isStale: true, cachedAt: new Date(), ageSeconds: 47 * 60 },
      lastUpdatedAt: Date.now(),
    };
    render(<StoveSheetSelfFetch />);
    expect(screen.getByTestId('stove-sheet-stale')).toHaveTextContent('Ultima lettura 47 min fa');
    expect(screen.queryByTestId('stove-sheet-updated')).toBeNull();
  });

  // ROADMAP M78
  test('unreachable with a last reading: banner with its time, state kept', () => {
    stoveDataOverride = {
      status: 'working',
      isAccesa: true,
      unreachable: true,
      lastUpdatedAt: todayAt(21, 4).getTime(),
    };
    render(<StoveSheetSelfFetch />);
    expect(screen.getByTestId('stove-sheet-state')).toHaveTextContent('In funzione');
    const banner = screen.getByTestId('stove-sheet-unreachable');
    expect(banner).toHaveTextContent('Stufa non raggiungibile');
    expect(banner).toHaveTextContent('Ultima lettura alle 21:04');
    expect(screen.queryByTestId('stove-sheet-updated')).toBeNull();
    expect(screen.queryByTestId('stove-sheet-stale')).toBeNull();
  });

  test('unreachable with no reading: state not known, the primary action shuts down', async () => {
    stoveDataOverride = { status: 'unknown', isAccesa: false, unreachable: true, powerLevel: null, fanLevel: null };
    render(<StoveSheetSelfFetch />);
    expect(screen.getByTestId('stove-sheet-state')).toHaveTextContent('Stato non noto');
    expect(screen.getByTestId('stove-sheet-unreachable')).toHaveTextContent('Nessuna lettura disponibile');
    const btn = screen.getByTestId('stove-sheet-primary-action');
    expect(btn).toHaveTextContent('Spegni stufa');
    await act(async () => {
      fireEvent.click(btn);
    });
    expect(mockHandleShutdown).toHaveBeenCalledTimes(1);
    expect(mockHandleIgnite).not.toHaveBeenCalled();
  });

  test('pellet reserve shows its banner', () => {
    stoveDataOverride = { pelletLow: true };
    render(<StoveSheetSelfFetch />);
    expect(screen.getByTestId('stove-sheet-pellet-low')).toHaveTextContent('Pellet in riserva');
  });

  test('cleaning due blocks the ignition and offers "Ho pulito"', async () => {
    stoveDataOverride = { isAccesa: false, needsMaintenance: true, maintenanceStatus: { currentHours: 51.6 } };
    render(<StoveSheetSelfFetch />);
    const btn = screen.getByTestId('stove-sheet-primary-action');
    expect(btn).toHaveTextContent('Pulizia richiesta');
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(mockHandleIgnite).not.toHaveBeenCalled();
    expect(screen.getByTestId('stove-sheet-cleaning')).toHaveTextContent('52 h di lavoro');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Ho pulito' }));
    });
    expect(mockHandleConfirmCleaning).toHaveBeenCalledTimes(1);
  });

  test('cleaning due never blocks the shutdown of a burning stove', async () => {
    stoveDataOverride = { status: 'working', isAccesa: true, needsMaintenance: true };
    render(<StoveSheetSelfFetch />);
    const btn = screen.getByTestId('stove-sheet-primary-action');
    expect(btn).toHaveTextContent('Spegni stufa');
    expect(btn).toBeEnabled();
    await act(async () => {
      fireEvent.click(btn);
    });
    expect(mockHandleShutdown).toHaveBeenCalledTimes(1);
  });

  test('tapping a power level sends that level in one command', async () => {
    stoveDataOverride = { isAccesa: true, powerLevel: 2 };
    render(<StoveSheetSelfFetch />);
    await act(async () => {
      fireEvent.click(option('stove-sheet-power', 5));
    });
    expect(mockHandlePowerChange).toHaveBeenCalledTimes(1);
    expect(mockHandlePowerChange).toHaveBeenCalledWith({ target: { value: '5' } });
  });

  test('tapping a fan level sends that level', async () => {
    stoveDataOverride = { isAccesa: true, fanLevel: 2 };
    render(<StoveSheetSelfFetch />);
    await act(async () => {
      fireEvent.click(option('stove-sheet-fan', 6));
    });
    expect(mockHandleFanChange).toHaveBeenCalledWith({ target: { value: '6' } });
  });

  test('a command in flight shows the requested level and locks every control', async () => {
    let finish: () => void = () => undefined;
    mockHandlePowerChange.mockImplementationOnce(() => new Promise<void>((resolve) => { finish = resolve; }));
    stoveDataOverride = { isAccesa: true, powerLevel: 2, fanLevel: 3 };
    render(<StoveSheetSelfFetch />);
    fireEvent.click(option('stove-sheet-power', 4));

    expect(screen.getByTestId('stove-sheet-power')).toHaveTextContent('4 di 5');
    expect(option('stove-sheet-power', 4)).toHaveAttribute('aria-checked', 'true');
    expect(option('stove-sheet-fan', 5)).toBeDisabled();
    expect(screen.getByTestId('stove-sheet-primary-action')).toBeDisabled();

    await act(async () => {
      finish();
    });
    // The stove confirmed nothing new in this mock: the picker shows the reported level again.
    expect(screen.getByTestId('stove-sheet-power')).toHaveTextContent('2 di 5');
    expect(screen.getByTestId('stove-sheet-primary-action')).toBeEnabled();
  });

  test('a refused command is reported in the sheet and the controls come back', async () => {
    mockHandlePowerChange.mockRejectedValueOnce(new Error('Command failed: 500'));
    stoveDataOverride = { isAccesa: true, powerLevel: 2 };
    render(<StoveSheetSelfFetch />);
    fireEvent.click(option('stove-sheet-power', 3));
    await waitFor(() => expect(screen.getByTestId('stove-sheet-command-error')).toBeInTheDocument());
    expect(screen.getByTestId('stove-sheet-command-error')).toHaveTextContent('Comando non riuscito');
    expect(option('stove-sheet-power', 3)).toBeEnabled();
  });

  test('controls are locked while the hook reports a command in progress', () => {
    stoveDataOverride = { isAccesa: true, loading: true };
    render(<StoveSheetSelfFetch />);
    expect(screen.getByTestId('stove-sheet-primary-action')).toBeDisabled();
    expect(option('stove-sheet-power', 1)).toBeDisabled();
  });

  test('primary action when off ignites and says so while it runs', async () => {
    let finish: () => void = () => undefined;
    mockHandleIgnite.mockImplementationOnce(() => new Promise<void>((resolve) => { finish = resolve; }));
    stoveDataOverride = { isAccesa: false };
    render(<StoveSheetSelfFetch />);
    fireEvent.click(screen.getByTestId('stove-sheet-primary-action'));
    expect(mockHandleIgnite).toHaveBeenCalledTimes(1);
    expect(mockHandleShutdown).not.toHaveBeenCalled();
    expect(screen.getByTestId('stove-sheet-progress')).toHaveTextContent('Accensione in corso');
    await act(async () => {
      finish();
    });
    expect(screen.queryByTestId('stove-sheet-progress')).toBeNull();
  });

  test('primary action when on shuts down', async () => {
    stoveDataOverride = { isAccesa: true };
    render(<StoveSheetSelfFetch />);
    await act(async () => {
      fireEvent.click(screen.getByTestId('stove-sheet-primary-action'));
    });
    expect(mockHandleShutdown).toHaveBeenCalledTimes(1);
    expect(mockHandleIgnite).not.toHaveBeenCalled();
  });

  test.each([
    ['orari', '/stove/scheduler'],
    ['clima', '/settings/thermostat'],
    ['manutenzione', '/stove/maintenance'],
    ['dettagli', '/stove'],
  ])('%s button navigates to %s', (id, path) => {
    render(<StoveSheetSelfFetch />);
    fireEvent.click(screen.getByTestId(`sheet-btn-${id}`));
    expect(mockPush).toHaveBeenCalledWith(path);
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

  // 260506-d45 — locks in the prop-based contract: the presentational
  // StoveSheet renders with explicit data + cmds props and navigates through
  // the card-owned callback, not a router of its own.
  test('260506-d45: presentational StoveSheet renders with explicit prop fixtures', () => {
    const propStoveData = { ...baseStoveData, status: 'working', isAccesa: true, powerLevel: 4, fanLevel: 3 } as unknown as Parameters<typeof StoveSheet>[0]['stoveData'];
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
    expect(screen.getByTestId('stove-sheet-power')).toHaveTextContent('4 di 5');
    fireEvent.click(screen.getByTestId('sheet-btn-orari'));
    expect(onNavigate).toHaveBeenCalledWith('/stove/scheduler');
    expect(mockPush).not.toHaveBeenCalled();
  });
});
