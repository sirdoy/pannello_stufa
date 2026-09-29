/**
 * GET /api/scheduler/check — housekeeping cron (workspace ROADMAP D2.6).
 * The stove schedule runs on the Pi: this route must never command the stove.
 */
jest.mock('@/lib/auth/session', () => ({ authSession: { getSession: jest.fn() } }));
jest.mock('@/lib/firebaseAdmin', () => ({ adminDbGet: jest.fn(), adminDbSet: jest.fn() }));
jest.mock('@/lib/environmentHelper', () => ({ getEnvironmentPath: (p: string) => p }));
jest.mock('@/lib/services/tokenCleanupService', () => ({ cleanupStaleTokens: jest.fn() }));
jest.mock('@/lib/stove/thermorossiProxy');

import { GET } from '../route';
import { adminDbGet, adminDbSet } from '@/lib/firebaseAdmin';
import { cleanupStaleTokens } from '@/lib/services/tokenCleanupService';
import * as stove from '@/lib/stove/thermorossiProxy';

const SECRET = 'cron-secret';
const NOW = Date.UTC(2026, 8, 28, 12, 0);
const store: Record<string, unknown> = {};

function call(secret: string | null = SECRET) {
  const url = new URL(`http://localhost/api/scheduler/check${secret ? `?secret=${secret}` : ''}`);
  return GET({ nextUrl: url, headers: { get: () => null } } as never, {} as never);
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Date, 'now').mockReturnValue(NOW);
  jest.spyOn(console, 'error').mockImplementation(() => {});
  process.env.CRON_SECRET = SECRET;
  for (const k of Object.keys(store)) delete store[k];
  jest.mocked(adminDbGet).mockImplementation(async (path: string) => store[path] as never);
  jest.mocked(adminDbSet).mockImplementation(async (path: string, value: unknown) => {
    store[path] = value;
  });
  jest.mocked(cleanupStaleTokens).mockResolvedValue({ cleaned: true, tokensRemoved: 2 } as never);
});

afterEach(() => jest.restoreAllMocks());

it('401 without the cron secret', async () => {
  expect((await call(null)).status).toBe(401);
  expect((await call('wrong')).status).toBe(401);
  expect(adminDbSet).not.toHaveBeenCalled();
});

it('first run: only the token cleanup (heartbeat V8, calibration V9, weather V10 gone)', async () => {
  const res = await call();
  const body = await res.json();

  expect(res.status).toBe(200);
  expect(body.tokenCleanup).toMatchObject({ ran: true, cleaned: true });
  expect(body.calibration).toBeUndefined();
  expect(body.weather).toBeUndefined();
  expect(store['cronHealth/lastCall']).toBeUndefined();
  expect(store['netatmo/lastAutoCalibration']).toBeUndefined();
  expect(store['cron/lastWeatherRefresh']).toBeUndefined();
  expect(store['cron/lastTokenCleanup']).toBe(NOW);
});

it('token cleanup respects its 7-day interval', async () => {
  store['cron/lastTokenCleanup'] = NOW - 24 * 60 * 60 * 1000; // 1 day ago (< 7 d)

  const body = await (await call()).json();

  expect(body.tokenCleanup).toMatchObject({ ran: false, reason: 'too_soon' });
  expect(cleanupStaleTokens).not.toHaveBeenCalled();
});

it('a failing cleanup is reported and retried next run', async () => {
  jest.mocked(cleanupStaleTokens).mockRejectedValue(new Error('firebase down'));

  const res = await call();
  const body = await res.json();

  expect(res.status).toBe(200);
  expect(body.tokenCleanup).toMatchObject({ ran: false, reason: 'exception', error: 'firebase down' });
  expect(store['cron/lastTokenCleanup']).toBeUndefined();
});

it('never commands the stove (the schedule runs on the Pi)', async () => {
  await call();

  for (const fn of Object.values(jest.mocked(stove))) {
    if (typeof fn === 'function' && 'mock' in fn) expect(fn).not.toHaveBeenCalled();
  }
});
