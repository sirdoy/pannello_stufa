/**
 * Next proxy routes for the Pi scheduler + maintenance (workspace ROADMAP D2.5).
 * Proxy (haClient) mocked; checks validation, path parsing and forwarding.
 */
jest.mock('@/lib/auth/session', () => ({
  authSession: { getSession: jest.fn() },
}));
jest.mock('@/lib/stove/schedulerProxy');
jest.mock('@/lib/firebaseAdmin', () => ({ adminDbPush: jest.fn() }));

import { authSession } from '@/lib/auth/session';
import * as proxy from '@/lib/stove/schedulerProxy';
import { adminDbPush } from '@/lib/firebaseAdmin';
import * as list from '../schedules/route';
import * as one from '../schedules/[id]/route';
import * as active from '../schedules/[id]/active/route';
import * as daySlots from '../schedules/[id]/days/[day]/slots/route';
import * as week from '../schedules/[id]/week/route';
import * as mode from '../scheduler/mode/route';
import * as engine from '../scheduler/engine/route';
import * as override from '../scheduler/override/route';
import * as log from '../scheduler/log/route';
import * as climate from '../scheduler/climate/route';
import * as climateLog from '../scheduler/climate/log/route';
import * as maintenance from '../maintenance/route';
import * as confirmCleaning from '../../../maintenance/confirm-cleaning/route';

const mocked = jest.mocked(proxy);
const SLOT = { start_minutes: 360, end_minutes: 390, power_level: 2, fan_level: 3 };

function req(body?: unknown, search = '') {
  const headers = new Map([['content-type', 'application/json']]);
  return {
    headers: { get: (n: string) => headers.get(n.toLowerCase()) ?? null },
    text: async () => (body === undefined ? '' : JSON.stringify(body)),
    json: async () => body,
    nextUrl: new URL(`http://localhost/x${search}`),
  } as never;
}

const ctx = (params: Record<string, string> = {}) => ({ params: Promise.resolve(params) }) as never;

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.mocked(authSession.getSession).mockResolvedValue({
    user: { sub: 'user:1', email: 'a@b.c', name: 'A' },
  } as never);
  for (const fn of Object.values(mocked)) {
    if (typeof fn === 'function' && 'mockResolvedValue' in fn) {
      (fn as jest.Mock).mockResolvedValue({ ok: true });
    }
  }
});

describe('auth', () => {
  it('401 without a session', async () => {
    jest.mocked(authSession.getSession).mockResolvedValue(null as never);
    expect((await list.GET(req(), ctx())).status).toBe(401);
    expect(mocked.listSchedules).not.toHaveBeenCalled();
  });
});

describe('schedules', () => {
  it('create forwards a valid body, rejects unknown keys', async () => {
    expect((await list.POST(req({ name: 'Ferie', copy_from_id: 1 }), ctx())).status).toBe(201);
    expect(mocked.createSchedule).toHaveBeenCalledWith({ name: 'Ferie', copy_from_id: 1 });

    expect((await list.POST(req({ name: 'x', slots: {} }), ctx())).status).toBe(400);
  });

  it.each(['abc', '0', '-1', '1.5'])('invalid id %s → 400', async (id) => {
    expect((await one.GET(req(), ctx({ id }))).status).toBe(400);
    expect(mocked.getSchedule).not.toHaveBeenCalled();
  });

  it('patch / delete / activate use the numeric id', async () => {
    await one.PATCH(req({ name: 'Scuola 2' }), ctx({ id: '2' }));
    const del = await one.DELETE(req(), ctx({ id: '2' }));
    await active.PUT(req(), ctx({ id: '3' }));

    expect(mocked.patchSchedule).toHaveBeenCalledWith(2, { name: 'Scuola 2' });
    expect(del.status).toBe(204);
    expect(mocked.deleteSchedule).toHaveBeenCalledWith(2);
    expect(mocked.activateSchedule).toHaveBeenCalledWith(3);
  });
});

describe('slots', () => {
  it('day slots: valid body forwarded with day number', async () => {
    const res = await daySlots.PUT(req({ slots: [SLOT] }), ctx({ id: '2', day: '6' }));
    expect(res.status).toBe(200);
    expect(mocked.replaceDaySlots).toHaveBeenCalledWith(2, 6, [SLOT]);
  });

  it.each([
    ['day out of range', { slots: [SLOT] }, { id: '2', day: '7' }],
    ['not 15-min aligned', { slots: [{ ...SLOT, start_minutes: 361 }] }, { id: '2', day: '0' }],
    ['start after end', { slots: [{ ...SLOT, start_minutes: 400 }] }, { id: '2', day: '0' }],
    ['power out of range', { slots: [{ ...SLOT, power_level: 6 }] }, { id: '2', day: '0' }],
    ['pre-T6 power/fan names', { slots: [{ start_minutes: 360, end_minutes: 390, power: 2, fan: 3 }] }, { id: '2', day: '0' }],
  ])('400 on %s', async (_label, body, params) => {
    expect((await daySlots.PUT(req(body), ctx(params))).status).toBe(400);
    expect(mocked.replaceDaySlots).not.toHaveBeenCalled();
  });

  it('week: forwards days, rejects bad day keys', async () => {
    await week.PUT(req({ days: { '0': [SLOT] } }), ctx({ id: '2' }));
    expect(mocked.replaceWeek).toHaveBeenCalledWith(2, { '0': [SLOT] });

    expect((await week.PUT(req({ days: { '7': [SLOT] } }), ctx({ id: '2' }))).status).toBe(400);
  });
});

describe('mode, override, log', () => {
  it('mode requires a boolean', async () => {
    await mode.POST(req({ enabled: false }), ctx());
    expect(mocked.setMode).toHaveBeenCalledWith(false);
    expect((await mode.POST(req({ enabled: 'no' }), ctx())).status).toBe(400);
  });

  it('override set/clear', async () => {
    await override.POST(req({ return_to_auto_at: 1_790_000_000 }), ctx());
    await override.DELETE(req(), ctx());
    expect(mocked.setOverride).toHaveBeenCalledWith(1_790_000_000);
    expect(mocked.clearOverride).toHaveBeenCalled();
    expect((await override.POST(req({ return_to_auto_at: 'soon' }), ctx())).status).toBe(400);
  });

  it('log forwards only numeric known params', async () => {
    await log.GET(req(undefined, '?limit=20&offset=40&page=2&from=abc&evil=1'), ctx());
    expect(mocked.getExecutionLog).toHaveBeenCalledWith('limit=20&offset=40');
  });
});

describe('maintenance', () => {
  it('patch validation', async () => {
    await maintenance.PATCH(req({ target_hours: 100 }), ctx());
    expect(mocked.patchMaintenance).toHaveBeenCalledWith({ target_hours: 100 });
    expect((await maintenance.PATCH(req({}), ctx())).status).toBe(400);
    expect((await maintenance.PATCH(req({ target_hours: -1 }), ctx())).status).toBe(400);
  });

  it('confirm-cleaning resets on the Pi and logs the activity', async () => {
    mocked.confirmMaintenanceCleaning.mockResolvedValue({
      previous_hours: 45.5, target_hours: 50, last_cleaned_at: 1_790_000_000,
    } as never);

    const res = await confirmCleaning.POST(req(), ctx());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.previousHours).toBe(45.5);
    expect(adminDbPush).toHaveBeenCalledWith('log', expect.objectContaining({
      action: 'Pulizia stufa',
      details: '45.50h',
    }));
  });
});

describe('scheduler engine heartbeat (ROADMAP V8)', () => {
  it('forwards GET /scheduler/engine', async () => {
    const health = { initialized: true, last_tick_at: 1790673240, healthy: true };
    mocked.getEngineHealth.mockResolvedValue(health as never);
    const res = await engine.GET(req(), ctx());
    expect(res.status).toBe(200);
    expect(mocked.getEngineHealth).toHaveBeenCalledTimes(1);
    expect(await res.json()).toMatchObject(health);
  });
});

describe('climate control (ROADMAP D16)', () => {
  it('forwards GET and a valid PATCH', async () => {
    const state = { enabled: true, room_id: '2313748176', live: { setpoint: 20 } };
    mocked.getClimate.mockResolvedValue(state as never);
    expect(await (await climate.GET(req(), ctx())).json()).toMatchObject(state);

    const body = { enabled: true, room_id: '2313748176', max_power: 4, fan_by_power: [1, 3, 4, 5, 6] };
    expect((await climate.PATCH(req(body), ctx())).status).toBe(200);
    expect(mocked.patchClimate).toHaveBeenCalledWith(body);
  });

  it('rejects invalid PATCH bodies before the Pi', async () => {
    for (const body of [{}, { max_power: 6 }, { fan_by_power: [1, 2] }, { kp: 0 }, { evil: 1 }]) {
      expect((await climate.PATCH(req(body), ctx())).status).toBe(400);
    }
    expect(mocked.patchClimate).not.toHaveBeenCalled();
  });

  it('log forwards only a numeric limit', async () => {
    await climateLog.GET(req(undefined, '?limit=50&offset=3'), ctx());
    expect(mocked.getClimateLog).toHaveBeenCalledWith('limit=50');
    await climateLog.GET(req(undefined, '?limit=abc'), ctx());
    expect(mocked.getClimateLog).toHaveBeenLastCalledWith('');
  });
});
