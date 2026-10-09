/**
 * /settings/thermostat — stove climate control (workspace ROADMAP D16, D18).
 */
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import ThermostatSettingsPage from '@/app/settings/thermostat/page';
import type { ClimateState } from '@/types/thermorossiScheduler';

const API = '/api/v1/thermorossi/scheduler/climate';

function climate(overrides: Partial<ClimateState> = {}): ClimateState {
  return {
    enabled: true,
    room_id: 'sala',
    min_power: 1,
    max_power: 5,
    kp: 1.5,
    ti_minutes: 60,
    fan_by_power: [1, 3, 4, 5, 6],
    updated_at: 1791540000,
    live: { setpoint: 20, temperature: 19.5, error: 0.5, power_level: 2, fan_level: 3, integral: 0.1 },
    ...overrides,
  };
}

const ROOMS = {
  rooms: [
    { room_id: 'sala', room_name: 'Salotto' },
    { room_id: 'cucina', room_name: 'Cucina' },
  ],
};
const LOG = {
  items: [
    { timestamp: 1791540000, setpoint: 20, temperature: 19.5, integral: 0, output: 1.75, power: 2, fan: 3, frozen: false },
    { timestamp: 1791539000, setpoint: 20, temperature: 21, integral: 0, output: 1, power: 1, fan: 1, frozen: true },
  ],
};

/** Serves GET state / rooms / log and records PATCH bodies; PATCH answers with the merged state. */
function mockApi(initial: ClimateState, options: { failGet?: boolean; failPatch?: boolean } = {}) {
  let state = initial;
  const patches: unknown[] = [];
  global.fetch = jest.fn(async (url: string, init?: RequestInit) => {
    if (init?.method === 'PATCH') {
      if (options.failPatch) return { ok: false, json: async () => ({}) };
      const body = JSON.parse(String(init.body));
      patches.push(body);
      state = { ...state, ...body };
      return { ok: true, json: async () => state };
    }
    if (url === API) return { ok: !options.failGet, json: async () => state };
    if (url.startsWith(`${API}/log`)) return { ok: true, json: async () => LOG };
    return { ok: true, json: async () => ROOMS };
  }) as unknown as typeof fetch;
  return patches;
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('ThermostatSettingsPage — climate control', () => {
  it('shows the state, the live readings, the room and the latest decisions', async () => {
    mockApi(climate());
    render(<ThermostatSettingsPage />);

    expect(await screen.findByTestId('climate-state')).toHaveTextContent('Attivo');
    const live = within(screen.getByTestId('climate-live'));
    expect(live.getByText('20 °C')).toBeInTheDocument();
    expect(live.getByText('19,5 °C')).toBeInTheDocument();
    expect(live.getByText('P2 · V3')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText('Stanza')).toHaveDisplayValue('Salotto'));
    const rows = await screen.findAllByTestId('climate-log-row');
    expect(rows).toHaveLength(2);
    expect(rows[1]).toHaveTextContent('P1 · V1 (tenuta)');
  });

  it('turns the control off with one PATCH', async () => {
    const patches = mockApi(climate());
    render(<ThermostatSettingsPage />);

    fireEvent.click(await screen.findByRole('switch', { name: 'Spegni il controllo climatico' }));

    await waitFor(() => expect(screen.getByTestId('climate-state')).toHaveTextContent('Spento'));
    expect(patches).toEqual([{ enabled: false }]);
  });

  it('cannot be turned on before a room is chosen; choosing one saves it', async () => {
    const patches = mockApi(
      climate({ enabled: false, room_id: null, live: { ...climate().live, setpoint: null, temperature: null } })
    );
    render(<ThermostatSettingsPage />);

    expect(await screen.findByRole('switch', { name: 'Attiva il controllo climatico' })).toBeDisabled();
    await screen.findByRole('option', { name: 'Cucina' });
    fireEvent.change(screen.getByLabelText('Stanza'), { target: { value: 'cucina' } });

    await waitFor(() => expect(patches).toEqual([{ room_id: 'cucina' }]));
    await waitFor(() =>
      expect(screen.getByRole('switch', { name: 'Attiva il controllo climatico' })).not.toBeDisabled()
    );
  });

  it('saves the tuning only when it changed and is valid', async () => {
    const patches = mockApi(climate());
    render(<ThermostatSettingsPage />);
    const save = await screen.findByRole('button', { name: 'Salva regolazione' });
    expect(save).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Potenza minima'), { target: { value: '4' } });
    fireEvent.change(screen.getByLabelText('Potenza massima'), { target: { value: '3' } });
    expect(screen.getByRole('alert')).toHaveTextContent('minima non può superare');
    expect(save).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Potenza minima'), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText('P5'), { target: { value: '5' } });
    fireEvent.click(save);

    await waitFor(() => expect(patches).toHaveLength(1));
    expect(patches[0]).toEqual({
      min_power: 2,
      max_power: 3,
      kp: 1.5,
      ti_minutes: 60,
      fan_by_power: [1, 3, 4, 5, 5],
    });
    expect(await screen.findByRole('status')).toHaveTextContent('Regolazione salvata');
  });

  it('explains missing inputs and reports failures', async () => {
    mockApi(climate({ live: { ...climate().live, setpoint: null, power_level: null, fan_level: null } }), {
      failPatch: true,
    });
    render(<ThermostatSettingsPage />);

    expect(await screen.findByText(/Dati mancanti/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('switch', { name: 'Spegni il controllo climatico' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Salvataggio non riuscito');
    expect(screen.getByTestId('climate-state')).toHaveTextContent('Attivo');
  });

  it('shows an error when the state cannot be loaded', async () => {
    mockApi(climate(), { failGet: true });
    render(<ThermostatSettingsPage />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Impossibile caricare');
  });
});
