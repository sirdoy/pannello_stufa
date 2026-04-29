/**
 * StoveBody tests — Phase 179 Plan 05
 *
 * Mocks: useUser, useVersion, useStoveData, useStoveCommands, useRouter
 * Covers TDD behaviors 1-6 from plan.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockHandlePowerChange = jest.fn().mockResolvedValue(undefined);
const mockHandleIgnite = jest.fn().mockResolvedValue(undefined);
const mockHandleShutdown = jest.fn().mockResolvedValue(undefined);

jest.mock('@/app/components/devices/stove/hooks/useStoveCommands', () => ({
  useStoveCommands: () => ({
    handlePowerChange: mockHandlePowerChange,
    handleIgnite: mockHandleIgnite,
    handleShutdown: mockHandleShutdown,
    handleFanChange: jest.fn(),
    handleClearSemiManual: jest.fn(),
    handleSetManualMode: jest.fn(),
    handleSetAutomaticMode: jest.fn(),
    handleConfirmCleaning: jest.fn(),
    handleManualRefresh: jest.fn(),
    igniteCmd: {},
    shutdownCmd: {},
    setFanCmd: {},
    setPowerCmd: {},
  }),
}));

const baseStoveData = {
  status: 'off',
  powerLevel: 3,
  fanLevel: 2,
  loading: false,
  refreshing: false,
  initialLoading: false,
  schedulerEnabled: false,
  semiManualMode: false,
  returnToAutoAt: null,
  nextScheduledAction: null,
  errorCode: 0,
  errorDescription: '',
  maintenanceStatus: null,
  cleaningInProgress: false,
  loadingMessage: '',
  isOnline: true,
  hasPendingCommands: false,
  pendingCommands: [],
  staleness: null,
  lastUpdatedAt: null,
  isAccesa: false,
  isSpenta: true,
  needsMaintenance: false,
  fetchStatusAndUpdate: jest.fn(),
  setLoading: jest.fn(),
  setLoadingMessage: jest.fn(),
  setCleaningInProgress: jest.fn(),
  setSchedulerEnabled: jest.fn(),
  setSemiManualMode: jest.fn(),
  setReturnToAutoAt: jest.fn(),
  setNextScheduledAction: jest.fn(),
  fetchMaintenanceStatus: jest.fn(),
  fetchSchedulerMode: jest.fn(),
};

let stoveDataOverride: Partial<typeof baseStoveData> = {};

jest.mock('@/app/components/devices/stove/hooks/useStoveData', () => ({
  useStoveData: () => ({ ...baseStoveData, ...stoveDataOverride }),
}));

jest.mock('@auth0/nextjs-auth0/client', () => ({
  useUser: () => ({ user: { sub: 'user-123' } }),
}));

jest.mock('@/app/context/VersionContext', () => ({
  useVersion: () => ({ checkVersion: jest.fn() }),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

// ── Import component after mocks ────────────────────────────────────────────

import { StoveBody } from '@/app/components/EmberGlass/rooms/bodies/StoveBody';
import type { RoomDevice } from '@/app/components/EmberGlass/rooms/types';

// ── Fixtures ────────────────────────────────────────────────────────────────

function makeDevice(overrides: Partial<RoomDevice> = {}): RoomDevice {
  return {
    kind: 'stove',
    name: 'Stufa',
    on: false,
    value: 'Spenta',
    tone: 'var(--accent)',
    extra: { powerLevel: 3, fanLevel: 2 },
    ...overrides,
  };
}

// ── Tests ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  stoveDataOverride = {};
});

describe('StoveBody', () => {
  test('Test 1: renders 3 StatChips with labels Target / Fiamma / Ventola', () => {
    render(<StoveBody device={makeDevice()} />);
    expect(screen.getByText('Target')).toBeInTheDocument();
    expect(screen.getByText('Fiamma')).toBeInTheDocument();
    expect(screen.getByText('Ventola')).toBeInTheDocument();
  });

  test('Test 1b: StatChip values are powerLevel/5, powerLevel, fanLevel from hook data', () => {
    // Hook returns powerLevel=3, fanLevel=2
    render(<StoveBody device={makeDevice()} />);
    expect(screen.getByText('3/5')).toBeInTheDocument();
    expect(screen.getAllByText('3').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  test('Test 2: renders ControlRow with 3 MiniButtons Meno, Power, Più', () => {
    render(<StoveBody device={makeDevice()} />);
    expect(screen.getByTestId('mini-button-meno')).toBeInTheDocument();
    expect(screen.getByTestId('mini-button-power')).toBeInTheDocument();
    expect(screen.getByTestId('mini-button-pi')).toBeInTheDocument();
  });

  test('Test 3: clicking Meno calls handlePowerChange with powerLevel - 1', () => {
    render(<StoveBody device={makeDevice()} />);
    fireEvent.click(screen.getByTestId('mini-button-meno'));
    expect(mockHandlePowerChange).toHaveBeenCalledWith(
      expect.objectContaining({ target: { value: '2' } })
    );
  });

  test('Test 3 clamp: clicking Meno when powerLevel=1 does not go below 1', () => {
    stoveDataOverride = { powerLevel: 1 };
    render(<StoveBody device={makeDevice({ extra: { powerLevel: 1, fanLevel: 1 } })} />);
    fireEvent.click(screen.getByTestId('mini-button-meno'));
    expect(mockHandlePowerChange).toHaveBeenCalledWith(
      expect.objectContaining({ target: { value: '1' } })
    );
  });

  test('Test 4: clicking Più calls handlePowerChange with powerLevel + 1', () => {
    render(<StoveBody device={makeDevice()} />);
    fireEvent.click(screen.getByTestId('mini-button-pi'));
    expect(mockHandlePowerChange).toHaveBeenCalledWith(
      expect.objectContaining({ target: { value: '4' } })
    );
  });

  test('Test 4 clamp: clicking Più when powerLevel=5 does not exceed 5', () => {
    stoveDataOverride = { powerLevel: 5 };
    render(<StoveBody device={makeDevice({ extra: { powerLevel: 5, fanLevel: 2 } })} />);
    fireEvent.click(screen.getByTestId('mini-button-pi'));
    expect(mockHandlePowerChange).toHaveBeenCalledWith(
      expect.objectContaining({ target: { value: '5' } })
    );
  });

  test('Test 5: clicking Power when device is OFF and no cleaning needed calls handleIgnite', () => {
    stoveDataOverride = { needsMaintenance: false };
    render(<StoveBody device={makeDevice({ on: false })} />);
    fireEvent.click(screen.getByTestId('mini-button-power'));
    expect(mockHandleIgnite).toHaveBeenCalled();
    expect(mockHandleShutdown).not.toHaveBeenCalled();
  });

  test('Test 5b: clicking Power when device is ON calls handleShutdown', () => {
    stoveDataOverride = { isAccesa: true };
    render(<StoveBody device={makeDevice({ on: true })} />);
    fireEvent.click(screen.getByTestId('mini-button-power'));
    expect(mockHandleShutdown).toHaveBeenCalled();
    expect(mockHandleIgnite).not.toHaveBeenCalled();
  });

  test('Test 6: MiniButton labels are exactly Meno, Power, Più (D-52)', () => {
    render(<StoveBody device={makeDevice()} />);
    expect(screen.getByText('Meno')).toBeInTheDocument();
    expect(screen.getByText('Power')).toBeInTheDocument();
    expect(screen.getByText('Più')).toBeInTheDocument();
  });
});
