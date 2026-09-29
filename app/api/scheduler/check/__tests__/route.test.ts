/**
 * GET /api/scheduler/check — legacy housekeeping cron, a no-op since workspace
 * ROADMAP V11 (token cleanup moved to maybeCleanupStaleTokens); removed with V12.
 */
jest.mock('@/lib/auth/session', () => ({ authSession: { getSession: jest.fn() } }));
jest.mock('@/lib/firebaseAdmin', () => ({ adminDbGet: jest.fn(), adminDbSet: jest.fn() }));
jest.mock('@/lib/services/tokenCleanupService', () => ({
  cleanupStaleTokens: jest.fn(),
  maybeCleanupStaleTokens: jest.fn(),
}));
jest.mock('@/lib/stove/thermorossiProxy');

import { GET } from '../route';
import { adminDbGet, adminDbSet } from '@/lib/firebaseAdmin';
import * as cleanup from '@/lib/services/tokenCleanupService';
import * as stove from '@/lib/stove/thermorossiProxy';

const SECRET = 'cron-secret';

function call(secret: string | null = SECRET) {
  const url = new URL(`http://localhost/api/scheduler/check${secret ? `?secret=${secret}` : ''}`);
  return GET({ nextUrl: url, headers: { get: () => null } } as never, {} as never);
}

beforeEach(() => {
  jest.clearAllMocks();
  process.env.CRON_SECRET = SECRET;
});

it('401 without the cron secret', async () => {
  expect((await call(null)).status).toBe(401);
  expect((await call('wrong')).status).toBe(401);
});

it('answers 200 with no tasks and touches nothing', async () => {
  const res = await call();
  const body = await res.json();

  expect(res.status).toBe(200);
  expect(body).toMatchObject({ status: 'OK', tasks: [] });
  expect(adminDbGet).not.toHaveBeenCalled();
  expect(adminDbSet).not.toHaveBeenCalled();
  expect(cleanup.cleanupStaleTokens).not.toHaveBeenCalled();
  expect(cleanup.maybeCleanupStaleTokens).not.toHaveBeenCalled();
});

it('never commands the stove (the schedule runs on the Pi)', async () => {
  await call();

  for (const fn of Object.values(jest.mocked(stove))) {
    if (typeof fn === 'function' && 'mock' in fn) expect(fn).not.toHaveBeenCalled();
  }
});
