/**
 * @jest-environment node
 *
 * Tests for POST /api/auth/logout
 *
 * Shape mirrors __tests__/api/auth/login/route.test.ts so both auth routes
 * share the same jest.mock wiring for next/headers.
 *
 * Defensive-propagation (cookies() throws) is implicitly covered by
 * withAuthAndErrorHandler test suites; not duplicated here.
 */

import { POST } from '@/app/api/auth/logout/route';

// Spies for the mocked cookie store.
const mockDelete = jest.fn();
const mockSet = jest.fn();

jest.mock('next/headers', () => ({
  cookies: () => Promise.resolve({ set: mockSet, delete: mockDelete }),
}));

jest.mock('@/lib/core', () => ({
  withAuthAndErrorHandler: (fn: Function) => fn,
  success: (data: unknown) => ({ ok: true, data }),
}));

describe('POST /api/auth/logout', () => {
  beforeEach(() => {
    mockDelete.mockClear();
    mockSet.mockClear();
  });

  it('Test 1: deletes ha_auth cookie and returns { authenticated: false }', async () => {
    const result = await (POST as unknown as () => Promise<unknown>)();

    expect(mockDelete).toHaveBeenCalledTimes(1);
    expect(mockDelete).toHaveBeenCalledWith('ha_auth');
    expect(result).toEqual({ ok: true, data: { authenticated: false } });
  });

  it('Test 2: does not set any cookie', async () => {
    await (POST as unknown as () => Promise<unknown>)();

    expect(mockSet).not.toHaveBeenCalled();
  });
});
