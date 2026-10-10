/**
 * StoveBody — power and fan readings with "Meno", "Accendi" / "Spegni", "Più" (ROADMAP M84 + M81).
 *
 * One power step per tap. The button that started a command shows a spinner and the others are
 * locked until it settles; a command that throws is reported to the card through onError.
 * Ignition is blocked while cleaning is required; a stove that does not answer keeps only "Spegni".
 */

import { act, fireEvent, render, screen, within } from '@testing-library/react';
import type { RoomDevice } from '../../types';

const mockHandlePowerChange = jest.fn<Promise<void>, [{ target: { value: string } }]>();
const mockHandleIgnite = jest.fn<Promise<void>, []>();
const mockHandleShutdown = jest.fn<Promise<void>, []>();
const mockHandleFanChange = jest.fn<Promise<void>, [unknown]>();

jest.mock('@/app/components/devices/stove/hooks/useStoveCommands', () => ({
  useStoveCommands: () => ({
    handlePowerChange: mockHandlePowerChange,
    handleIgnite: mockHandleIgnite,
    handleShutdown: mockHandleShutdown,
    handleFanChange: mockHandleFanChange,
  }),
}));

interface StoveDataMock {
  powerLevel: number | null;
  fanLevel: number | null;
  needsMaintenance: boolean;
  semiManualMode: boolean;
}

const baseStoveData: StoveDataMock = {
  powerLevel: 3,
  fanLevel: 2,
  needsMaintenance: false,
  semiManualMode: false,
};

let stoveDataOverride: Partial<StoveDataMock> = {};

jest.mock('@/app/components/devices/stove/hooks/useStoveData', () => ({
  useStoveData: () => ({
    ...baseStoveData,
    ...stoveDataOverride,
    setLoading: jest.fn(),
    setLoadingMessage: jest.fn(),
    fetchStatusAndUpdate: jest.fn(),
    setSchedulerEnabled: jest.fn(),
    setSemiManualMode: jest.fn(),
    setReturnToAutoAt: jest.fn(),
    setNextScheduledAction: jest.fn(),
    setCleaningInProgress: jest.fn(),
    fetchMaintenanceStatus: jest.fn(),
  }),
}));

jest.mock('@/lib/auth/useUser', () => ({
  useUser: () => ({ user: { sub: 'user-123' } }),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

import { StoveBody } from '../../bodies/StoveBody';

function makeDevice(overrides: Partial<RoomDevice> = {}): RoomDevice {
  return {
    id: 11,
    kind: 'stove',
    name: 'Stufa',
    on: true,
    statusLabel: 'Accesa',
    value: 'Potenza 3',
    tone: 'var(--accent)',
    extra: { powerLevel: 3, fanLevel: 2 },
    ...overrides,
  };
}

const offDevice = () => makeDevice({ on: false, statusLabel: 'Spenta', value: '' });
const silentDevice = () =>
  makeDevice({ on: false, statusLabel: 'Non risponde', value: '', unreachable: true, extra: {} });

function deferred() {
  let resolve!: () => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const button = (name: string) => screen.getByRole('button', { name });

/** Taps a button and lets the command it started settle (or stay pending) */
async function tap(name: string) {
  await act(async () => {
    fireEvent.click(button(name));
  });
}

function chipValue(label: string): string | null {
  const chip = screen.getByText(label).parentElement!;
  return within(chip).getByTestId('stat-chip-value').textContent;
}

function expectSpinner(name: string) {
  expect(button(name)).toHaveAttribute('aria-busy', 'true');
  expect(within(button(name)).getByTestId('mini-button-spinner')).toBeInTheDocument();
}

function expectNoSpinner(name: string) {
  expect(button(name)).not.toHaveAttribute('aria-busy');
  expect(within(button(name)).queryByTestId('mini-button-spinner')).not.toBeInTheDocument();
}

beforeEach(() => {
  jest.clearAllMocks();
  stoveDataOverride = {};
  mockHandlePowerChange.mockResolvedValue(undefined);
  mockHandleIgnite.mockResolvedValue(undefined);
  mockHandleShutdown.mockResolvedValue(undefined);
});

describe('StoveBody', () => {
  describe('readings', () => {
    it('shows power out of 5 and fan out of 6', () => {
      render(<StoveBody device={makeDevice()} />);

      expect(screen.getAllByTestId('stat-chip')).toHaveLength(2);
      expect(chipValue('Potenza')).toBe('3/5');
      expect(chipValue('Ventola')).toBe('2/6');
    });

    it('shows a dash for a level that was never read', () => {
      stoveDataOverride = { powerLevel: null, fanLevel: null };
      render(<StoveBody device={makeDevice()} />);

      expect(chipValue('Potenza')).toBe('—');
      expect(chipValue('Ventola')).toBe('—');
    });

    it('reads the levels from the stove hook, not from the device payload', () => {
      stoveDataOverride = { powerLevel: 5, fanLevel: 6 };
      render(<StoveBody device={makeDevice({ extra: { powerLevel: 1, fanLevel: 1 } })} />);

      expect(chipValue('Potenza')).toBe('5/5');
      expect(chipValue('Ventola')).toBe('6/6');
    });
  });

  describe('buttons', () => {
    it('are "Meno", "Spegni", "Più" while the stove is on', () => {
      render(<StoveBody device={makeDevice()} />);

      expect(screen.getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual([
        'Meno',
        'Spegni',
        'Più',
      ]);
      expect(button('Meno')).toBeEnabled();
      expect(button('Spegni')).toBeEnabled();
      expect(button('Più')).toBeEnabled();
    });

    it('are "Meno", "Accendi", "Più" while the stove is off', () => {
      render(<StoveBody device={offDevice()} />);

      expect(screen.getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual([
        'Meno',
        'Accendi',
        'Più',
      ]);
      expect(screen.queryByRole('button', { name: 'Power' })).not.toBeInTheDocument();
    });
  });

  describe('power steps', () => {
    it('"Meno" sends one step down', async () => {
      render(<StoveBody device={makeDevice()} />);

      await tap('Meno');

      expect(mockHandlePowerChange).toHaveBeenCalledTimes(1);
      expect(mockHandlePowerChange).toHaveBeenCalledWith({ target: { value: '2' } });
    });

    it('"Più" sends one step up', async () => {
      render(<StoveBody device={makeDevice()} />);

      await tap('Più');

      expect(mockHandlePowerChange).toHaveBeenCalledTimes(1);
      expect(mockHandlePowerChange).toHaveBeenCalledWith({ target: { value: '4' } });
    });

    it('reaches the limits: 2 goes down to 1, 4 goes up to 5', async () => {
      stoveDataOverride = { powerLevel: 2 };
      const { unmount } = render(<StoveBody device={makeDevice()} />);
      await tap('Meno');
      expect(mockHandlePowerChange).toHaveBeenLastCalledWith({ target: { value: '1' } });
      unmount();

      stoveDataOverride = { powerLevel: 4 };
      render(<StoveBody device={makeDevice()} />);
      await tap('Più');
      expect(mockHandlePowerChange).toHaveBeenLastCalledWith({ target: { value: '5' } });
    });

    it('"Meno" is disabled at power 1, "Più" still works', async () => {
      stoveDataOverride = { powerLevel: 1 };
      render(<StoveBody device={makeDevice()} />);

      expect(button('Meno')).toBeDisabled();
      expect(button('Più')).toBeEnabled();

      await tap('Meno');
      expect(mockHandlePowerChange).not.toHaveBeenCalled();
    });

    it('"Più" is disabled at power 5, "Meno" still works', async () => {
      stoveDataOverride = { powerLevel: 5 };
      render(<StoveBody device={makeDevice()} />);

      expect(button('Più')).toBeDisabled();
      expect(button('Meno')).toBeEnabled();

      await tap('Più');
      expect(mockHandlePowerChange).not.toHaveBeenCalled();
    });

    it('both steps are disabled while the stove is off', async () => {
      render(<StoveBody device={offDevice()} />);

      expect(button('Meno')).toBeDisabled();
      expect(button('Più')).toBeDisabled();
      expect(button('Accendi')).toBeEnabled();

      await tap('Meno');
      await tap('Più');
      expect(mockHandlePowerChange).not.toHaveBeenCalled();
    });

    it('both steps are disabled when the power level is unknown', async () => {
      stoveDataOverride = { powerLevel: null };
      render(<StoveBody device={makeDevice()} />);

      expect(button('Meno')).toBeDisabled();
      expect(button('Più')).toBeDisabled();
      expect(button('Spegni')).toBeEnabled();

      await tap('Meno');
      await tap('Più');
      expect(mockHandlePowerChange).not.toHaveBeenCalled();
    });
  });

  describe('on / off', () => {
    it('"Accendi" ignites a stove that is off', async () => {
      render(<StoveBody device={offDevice()} />);

      await tap('Accendi');

      expect(mockHandleIgnite).toHaveBeenCalledTimes(1);
      expect(mockHandleShutdown).not.toHaveBeenCalled();
    });

    it('"Spegni" shuts down a stove that is on', async () => {
      render(<StoveBody device={makeDevice()} />);

      await tap('Spegni');

      expect(mockHandleShutdown).toHaveBeenCalledTimes(1);
      expect(mockHandleIgnite).not.toHaveBeenCalled();
    });

    it('ignition is blocked while cleaning is required, with the reason', async () => {
      stoveDataOverride = { needsMaintenance: true };
      render(<StoveBody device={offDevice()} />);

      expect(button('Accendi')).toBeDisabled();
      const alert = screen.getByTestId('stove-body-maintenance-alert');
      expect(alert).toHaveAttribute('role', 'status');
      expect(alert).toHaveTextContent('Pulizia richiesta: accensione bloccata finché non la confermi');

      await tap('Accendi');
      expect(mockHandleIgnite).not.toHaveBeenCalled();
    });

    it('a stove that is on can still be shut down while cleaning is required', async () => {
      stoveDataOverride = { needsMaintenance: true };
      render(<StoveBody device={makeDevice()} />);

      expect(button('Spegni')).toBeEnabled();
      await tap('Spegni');

      expect(mockHandleShutdown).toHaveBeenCalledTimes(1);
    });

    it('shows no cleaning notice when cleaning is not required', () => {
      render(<StoveBody device={offDevice()} />);
      expect(screen.queryByTestId('stove-body-maintenance-alert')).not.toBeInTheDocument();
    });
  });

  describe('command in progress', () => {
    it('"Spegni": spinner, one command per tap, steps locked until it settles', async () => {
      const command = deferred();
      mockHandleShutdown.mockReturnValueOnce(command.promise);
      render(<StoveBody device={makeDevice()} />);

      await tap('Spegni');

      expectSpinner('Spegni');
      expect(button('Spegni')).toBeEnabled();
      expect(button('Meno')).toBeDisabled();
      expect(button('Più')).toBeDisabled();
      expectNoSpinner('Meno');
      expectNoSpinner('Più');

      await tap('Spegni');
      await tap('Meno');
      await tap('Più');
      expect(mockHandleShutdown).toHaveBeenCalledTimes(1);
      expect(mockHandlePowerChange).not.toHaveBeenCalled();

      await act(async () => {
        command.resolve();
      });

      expectNoSpinner('Spegni');
      expect(button('Meno')).toBeEnabled();
      expect(button('Più')).toBeEnabled();

      // Back to normal: the next tap sends again
      await tap('Spegni');
      expect(mockHandleShutdown).toHaveBeenCalledTimes(2);
    });

    it('"Meno": spinner on it, "Spegni" and "Più" locked until it settles', async () => {
      const command = deferred();
      mockHandlePowerChange.mockReturnValueOnce(command.promise);
      render(<StoveBody device={makeDevice()} />);

      await tap('Meno');

      expectSpinner('Meno');
      expect(button('Meno')).toBeEnabled();
      expect(button('Spegni')).toBeDisabled();
      expect(button('Più')).toBeDisabled();

      await tap('Meno');
      await tap('Spegni');
      await tap('Più');
      expect(mockHandlePowerChange).toHaveBeenCalledTimes(1);
      expect(mockHandleShutdown).not.toHaveBeenCalled();

      await act(async () => {
        command.resolve();
      });

      expectNoSpinner('Meno');
      expect(button('Spegni')).toBeEnabled();
      expect(button('Più')).toBeEnabled();
    });

    it('"Più": spinner on it, "Meno" and "Spegni" locked until it settles', async () => {
      const command = deferred();
      mockHandlePowerChange.mockReturnValueOnce(command.promise);
      render(<StoveBody device={makeDevice()} />);

      await tap('Più');

      expectSpinner('Più');
      expect(button('Meno')).toBeDisabled();
      expect(button('Spegni')).toBeDisabled();

      await tap('Più');
      expect(mockHandlePowerChange).toHaveBeenCalledTimes(1);

      await act(async () => {
        command.resolve();
      });

      expectNoSpinner('Più');
      expect(button('Meno')).toBeEnabled();
      expect(button('Spegni')).toBeEnabled();
    });

    it('"Accendi": spinner while the ignition runs', async () => {
      const command = deferred();
      mockHandleIgnite.mockReturnValueOnce(command.promise);
      render(<StoveBody device={offDevice()} />);

      await tap('Accendi');
      expectSpinner('Accendi');

      await tap('Accendi');
      expect(mockHandleIgnite).toHaveBeenCalledTimes(1);

      await act(async () => {
        command.resolve();
      });
      expectNoSpinner('Accendi');
    });
  });

  describe('errors', () => {
    it('clears the previous error, then reports the message of a command that throws', async () => {
      const onError = jest.fn();
      mockHandleShutdown.mockRejectedValueOnce(new Error('Command not allowed in current state'));
      render(<StoveBody device={makeDevice()} onError={onError} />);

      await tap('Spegni');

      expect(onError.mock.calls).toEqual([[null], ['Command not allowed in current state']]);
      // The failed command is over: the buttons are free again
      expectNoSpinner('Spegni');
      expect(button('Meno')).toBeEnabled();
      expect(button('Più')).toBeEnabled();
    });

    it('reports a failed power step', async () => {
      const onError = jest.fn();
      mockHandlePowerChange.mockRejectedValueOnce(new Error('Command failed: 500'));
      render(<StoveBody device={makeDevice()} onError={onError} />);

      await tap('Più');

      expect(onError).toHaveBeenLastCalledWith('Command failed: 500');
    });

    it('reports a failed ignition', async () => {
      const onError = jest.fn();
      mockHandleIgnite.mockRejectedValueOnce(new Error('Command failed: 503'));
      render(<StoveBody device={offDevice()} onError={onError} />);

      await tap('Accendi');

      expect(onError).toHaveBeenLastCalledWith('Command failed: 503');
    });

    it('uses a generic message when what was thrown is not an Error', async () => {
      const onError = jest.fn();
      mockHandleShutdown.mockRejectedValueOnce('boom');
      render(<StoveBody device={makeDevice()} onError={onError} />);

      await tap('Spegni');

      expect(onError).toHaveBeenLastCalledWith('Comando non riuscito');
    });

    it('reports only the cleared error when the command succeeds', async () => {
      const onError = jest.fn();
      render(<StoveBody device={makeDevice()} onError={onError} />);

      await tap('Meno');

      expect(onError.mock.calls).toEqual([[null]]);
    });

    it('swallows a failure when the card gives no onError', async () => {
      mockHandleShutdown.mockRejectedValueOnce(new Error('Command failed: 500'));
      render(<StoveBody device={makeDevice()} />);

      await tap('Spegni');

      expect(mockHandleShutdown).toHaveBeenCalledTimes(1);
      expectNoSpinner('Spegni');
    });
  });

  describe('stove that does not answer', () => {
    it('renders only "Spegni": no readings, no steps, no ignition', () => {
      render(<StoveBody device={silentDevice()} />);

      expect(screen.getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual(['Spegni']);
      expect(button('Spegni')).toBeEnabled();
      expect(screen.queryByTestId('stat-chip')).not.toBeInTheDocument();
      expect(screen.queryByText('Potenza')).not.toBeInTheDocument();
      expect(screen.queryByText('Ventola')).not.toBeInTheDocument();
    });

    it('keeps only "Spegni" also when the last state read was "on" or cleaning is required', () => {
      stoveDataOverride = { needsMaintenance: true };
      render(<StoveBody device={{ ...silentDevice(), on: true }} />);

      expect(screen.getAllByRole('button')).toHaveLength(1);
      expect(button('Spegni')).toBeEnabled();
      expect(screen.queryByTestId('stove-body-maintenance-alert')).not.toBeInTheDocument();
    });

    it('"Spegni" shuts the stove down', async () => {
      const onError = jest.fn();
      render(<StoveBody device={silentDevice()} onError={onError} />);

      await tap('Spegni');

      expect(mockHandleShutdown).toHaveBeenCalledTimes(1);
      expect(mockHandleIgnite).not.toHaveBeenCalled();
      expect(mockHandlePowerChange).not.toHaveBeenCalled();
      expect(onError.mock.calls).toEqual([[null]]);
    });

    it('shows the spinner and sends once until the command settles', async () => {
      const command = deferred();
      mockHandleShutdown.mockReturnValueOnce(command.promise);
      render(<StoveBody device={silentDevice()} />);

      await tap('Spegni');
      expectSpinner('Spegni');

      await tap('Spegni');
      expect(mockHandleShutdown).toHaveBeenCalledTimes(1);

      await act(async () => {
        command.resolve();
      });
      expectNoSpinner('Spegni');

      await tap('Spegni');
      expect(mockHandleShutdown).toHaveBeenCalledTimes(2);
    });

    it('reports a shutdown that throws and frees the button', async () => {
      const onError = jest.fn();
      const command = deferred();
      mockHandleShutdown.mockReturnValueOnce(command.promise);
      render(<StoveBody device={silentDevice()} onError={onError} />);

      await tap('Spegni');
      expectSpinner('Spegni');

      await act(async () => {
        command.reject(new Error('Command failed: 503'));
      });

      expect(onError.mock.calls).toEqual([[null], ['Command failed: 503']]);
      expectNoSpinner('Spegni');
    });
  });
});
