/**
 * Stove scheduler client on the Pi backend (workspace ROADMAP D2.5).
 * fetch is mocked; responses mimic the Next proxy routes (envelope + backend shapes).
 */
import {
  getFullSchedulerMode,
  getNextScheduledAction,
  getNextScheduledChange,
  getSchedule,
  getWeeklySchedule,
} from '../schedulerService';
import {
  clearSemiManualMode,
  saveSchedule,
  setSchedulerMode,
  setSemiManualMode,
} from '../schedulerApiClient';
import {
  createSchedule,
  deleteSchedule,
  getAllSchedules,
  setActiveSchedule,
  updateSchedule,
} from '../schedulesApiClient';
import { hhmmToMinutes, minutesToHHMM, toWeekly } from '../backendScheduler';

type Route = { method?: string; status?: number; body?: unknown };

const DETAIL = {
  id: 2,
  name: 'Scuola',
  enabled: true,
  created_at: 1_790_000_000,
  updated_at: 1_790_000_600,
  interval_count: 3,
  is_active: true,
  slots_by_day: {
    '0': [
      { id: 2, day: 0, start_minutes: 390, end_minutes: 525, power_level: 1, fan_level: 1 },
      { id: 1, day: 0, start_minutes: 360, end_minutes: 390, power_level: 2, fan_level: 3 },
    ],
    '6': [{ id: 3, day: 6, start_minutes: 480, end_minutes: 1380, power_level: 1, fan_level: 1 }],
  },
};

let routes: Record<string, Route>;
const fetchMock = jest.fn();

beforeEach(() => {
  routes = {
    'GET /api/v1/thermorossi/schedules': {
      body: {
        success: true,
        active_schedule_id: 2,
        schedules: [
          { ...DETAIL, slots_by_day: undefined },
          { id: 1, name: 'Ferie', enabled: true, created_at: 1_780_000_000, updated_at: 1_780_000_000,
            interval_count: 14, is_active: false },
        ],
      },
    },
    'GET /api/v1/thermorossi/schedules/2': { body: { success: true, ...DETAIL } },
  };
  fetchMock.mockReset().mockImplementation(async (url: string, init: RequestInit = {}) => {
    const key = `${init.method ?? 'GET'} ${url}`;
    const route = routes[key] ?? { status: 200, body: { success: true } };
    const status = route.status ?? 200;
    return {
      ok: status < 400,
      status,
      json: async () => route.body ?? { success: true },
    };
  });
  global.fetch = fetchMock as unknown as typeof fetch;
});

const calls = () =>
  fetchMock.mock.calls.map(([url, init]: [string, RequestInit | undefined]) => ({
    key: `${init?.method ?? 'GET'} ${url}`,
    body: init?.body ? JSON.parse(String(init.body)) : undefined,
  }));

describe('conversions', () => {
  it('minutes <-> HH:MM', () => {
    expect(minutesToHHMM(390)).toBe('06:30');
    expect(minutesToHHMM(1440)).toBe('24:00');
    expect(hhmmToMinutes('17:45')).toBe(1065);
  });

  it('toWeekly fills all 7 Italian days, sorted by start', () => {
    const week = toWeekly(DETAIL);
    expect(Object.keys(week)).toEqual([
      'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica',
    ]);
    expect(week['Lunedì']).toEqual([
      { start: '06:00', end: '06:30', power: 2, fan: 3 },
      { start: '06:30', end: '08:45', power: 1, fan: 1 },
    ]);
    expect(week['Martedì']).toEqual([]);
    expect(week['Domenica']).toEqual([{ start: '08:00', end: '23:00', power: 1, fan: 1 }]);
  });
});

describe('read side', () => {
  it('getWeeklySchedule reads the active schedule', async () => {
    const week = await getWeeklySchedule();
    expect(week['Lunedì']).toHaveLength(2);
    expect(calls().map((c) => c.key)).toEqual([
      'GET /api/v1/thermorossi/schedules',
      'GET /api/v1/thermorossi/schedules/2',
    ]);
    expect(await getSchedule('Domenica')).toHaveLength(1);
  });

  it('getWeeklySchedule throws without an active schedule', async () => {
    routes['GET /api/v1/thermorossi/schedules'] = {
      body: { success: true, schedules: [], active_schedule_id: null },
    };
    await expect(getWeeklySchedule()).rejects.toThrow('Nessuno schedule attivo');
  });

  it('getFullSchedulerMode maps snake_case seconds to ISO', async () => {
    routes['GET /api/v1/thermorossi/scheduler/mode'] = {
      body: { success: true, enabled: true, semi_manual: true,
        semi_manual_activated_at: 1_790_000_000, return_to_auto_at: 1_790_003_600 },
    };
    expect(await getFullSchedulerMode()).toEqual({
      enabled: true,
      semiManual: true,
      semiManualActivatedAt: new Date(1_790_000_000_000).toISOString(),
      returnToAutoAt: new Date(1_790_003_600_000).toISOString(),
    });
  });

  it('next action and next change come from the backend', async () => {
    routes['GET /api/v1/thermorossi/scheduler/next-action'] = {
      body: { success: true, next_action: { action: 'adjust', at: 1_790_001_800, power_level: 1, fan_level: 1 } },
    };
    expect(await getNextScheduledAction()).toEqual({
      timestamp: new Date(1_790_001_800_000).toISOString(), action: 'adjust', power: 1, fan: 1,
    });
    expect(await getNextScheduledChange()).toBe(new Date(1_790_001_800_000).toISOString());
  });

  it('null next action (manual / semi-manual) and errors give null', async () => {
    routes['GET /api/v1/thermorossi/scheduler/next-action'] = {
      body: { success: true, next_action: null, reason: 'scheduler_disabled' },
    };
    expect(await getNextScheduledAction()).toBeNull();
    routes['GET /api/v1/thermorossi/scheduler/next-action'] = { status: 503, body: { error: 'down' } };
    jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(await getNextScheduledChange()).toBeNull();
  });
});

describe('write side', () => {
  it('saveSchedule replaces one day of the active schedule', async () => {
    await saveSchedule('Giovedì', [{ start: '17:45', end: '18:15', power: 2, fan: 3 }]);
    expect(calls()[calls().length - 1]).toEqual({
      key: 'PUT /api/v1/thermorossi/schedules/2/days/3/slots',
      body: { slots: [{ start_minutes: 1065, end_minutes: 1095, power_level: 2, fan_level: 3 }] },
    });
  });

  it('saveSchedule rejects an unknown day before calling the backend', async () => {
    await expect(saveSchedule('Monday', [])).rejects.toThrow('Giorno non valido');
    expect(calls().some((c) => c.key.startsWith('PUT'))).toBe(false);
  });

  it('mode, override and clear', async () => {
    await setSchedulerMode(false);
    await setSemiManualMode('2026-09-28T10:30:00.000Z');
    await clearSemiManualMode();
    expect(calls()).toEqual([
      { key: 'POST /api/v1/thermorossi/scheduler/mode', body: { enabled: false } },
      {
        key: 'POST /api/v1/thermorossi/scheduler/override',
        body: { return_to_auto_at: Date.UTC(2026, 8, 28, 10, 30) / 1000 },
      },
      { key: 'DELETE /api/v1/thermorossi/scheduler/override', body: undefined },
    ]);
  });

  it('backend errors surface as Error(message)', async () => {
    routes['POST /api/v1/thermorossi/scheduler/mode'] = {
      status: 400, body: { success: false, error: 'enabled: Required' },
    };
    await expect(setSchedulerMode(true)).rejects.toThrow('enabled: Required');
  });
});

describe('schedules', () => {
  it('getAllSchedules: string ids, ISO dates, oldest first', async () => {
    const { schedules, activeScheduleId } = await getAllSchedules();
    expect(activeScheduleId).toBe('2');
    expect(schedules.map((s) => [s.id, s.name, s.intervalCount])).toEqual([
      ['1', 'Ferie', 14],
      ['2', 'Scuola', 3],
    ]);
    expect(schedules[1]!.createdAt).toBe(new Date(1_790_000_000_000).toISOString());
  });

  it('create (copy), rename, activate, delete', async () => {
    routes['POST /api/v1/thermorossi/schedules'] = { status: 201, body: { success: true, id: 2 } };

    const created = await createSchedule('Scuola', '1');
    await updateSchedule('2', { name: 'Scuola 2', slots: {} });
    await setActiveSchedule('1');
    await deleteSchedule('2');

    expect(created.slots['Lunedì']).toHaveLength(2);
    const writes = calls().filter((c) => !c.key.startsWith('GET'));
    expect(writes).toEqual([
      { key: 'POST /api/v1/thermorossi/schedules', body: { name: 'Scuola', copy_from_id: 1 } },
      { key: 'PATCH /api/v1/thermorossi/schedules/2', body: { name: 'Scuola 2' } },
      { key: 'PUT /api/v1/thermorossi/schedules/1/active', body: undefined },
      { key: 'DELETE /api/v1/thermorossi/schedules/2', body: undefined },
    ]);
  });
});
