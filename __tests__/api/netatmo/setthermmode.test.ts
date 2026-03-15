/**
 * @jest-environment node
 *
 * Tests for POST /api/netatmo/setthermmode
 * Migrated to use Netatmo proxy instead of Netatmo Cloud API directly.
 */

import { POST } from '@/app/api/netatmo/setthermmode/route';
import { proxySetThermMode } from '@/lib/netatmoProxy';
import { adminDbPush } from '@/lib/firebaseAdmin';
import type { SetThermmodeResponse } from '@/types/netatmoProxy';

// Mock dependencies
jest.mock('@/lib/netatmoProxy');
jest.mock('@/lib/firebaseAdmin');
jest.mock('@/lib/devices/deviceTypes', () => ({
  DEVICE_TYPES: { THERMOSTAT: 'thermostat' },
}));
jest.mock('@/lib/core', () => {
  const badRequest = (msg: string) => ({ ok: false, error: msg, status: 400 });
  return {
    withAuthAndErrorHandler: (fn: Function) => async (...args: unknown[]) => {
      try {
        return await fn(...args);
      } catch (error: any) {
        return badRequest(error.message);
      }
    },
    success: (data: unknown) => ({ ok: true, data }),
    badRequest,
    parseJsonOrThrow: async (req: { json: () => Promise<unknown> }) => req.json(),
    validateRequired: (value: unknown, name: string) => {
      if (value === undefined || value === null || value === '') {
        throw new Error(`${name} is required`);
      }
    },
    validateEnum: (value: unknown, allowed: string[], name: string) => {
      if (!allowed.includes(value as string)) {
        throw new Error(`${name} must be one of: ${allowed.join(', ')}`);
      }
    },
  };
});

const mockProxySetThermMode = proxySetThermMode as jest.MockedFunction<typeof proxySetThermMode>;
const mockAdminDbPush = adminDbPush as jest.MockedFunction<typeof adminDbPush>;

const mockProxyResponse: SetThermmodeResponse = {
  status: 'ok',
  confirmed_mode: 'schedule',
  netatmo_response: {},
};

const mockSession = {
  user: { email: 'test@example.com', name: 'Test User', picture: null, sub: 'auth0|123' },
};

// POST is the wrapped handler (withAuthAndErrorHandler injects session via mock)
const callPOST = (body: unknown, session?: unknown) =>
  (POST as unknown as (req: unknown, ctx: unknown, sess: unknown) => Promise<unknown>)(
    { json: async () => body },
    undefined,
    session
  );

describe('POST /api/netatmo/setthermmode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAdminDbPush.mockResolvedValue(undefined as any);
  });

  it('should call proxySetThermMode with valid schedule mode and return success', async () => {
    mockProxySetThermMode.mockResolvedValue(mockProxyResponse);

    const result = await callPOST(
      { home_id: 'home-1', mode: 'schedule' },
      mockSession
    );

    expect(mockProxySetThermMode).toHaveBeenCalledWith({
      home_id: 'home-1',
      mode: 'schedule',
    });
    expect((result as any).ok).toBe(true);
    expect((result as any).data).toEqual({});
  });

  it('should call proxy with away mode and endtime', async () => {
    mockProxySetThermMode.mockResolvedValue({ ...mockProxyResponse, confirmed_mode: 'away' });

    const result = await callPOST(
      { home_id: 'home-1', mode: 'away', endtime: 1700001000 },
      mockSession
    );

    expect(mockProxySetThermMode).toHaveBeenCalledWith({
      home_id: 'home-1',
      mode: 'away',
      endtime: 1700001000,
    });
    expect((result as any).ok).toBe(true);
  });

  it('should call proxy with hg (frost guard) mode and return success', async () => {
    mockProxySetThermMode.mockResolvedValue({ ...mockProxyResponse, confirmed_mode: 'hg' });

    const result = await callPOST(
      { home_id: 'home-1', mode: 'hg' },
      mockSession
    );

    expect(mockProxySetThermMode).toHaveBeenCalledWith({
      home_id: 'home-1',
      mode: 'hg',
    });
    expect((result as any).ok).toBe(true);
  });

  it('should return badRequest when home_id is missing', async () => {
    const result = await callPOST(
      { mode: 'schedule' },
      mockSession
    );

    expect((result as any).ok).toBe(false);
    expect((result as any).status).toBe(400);
    expect(mockProxySetThermMode).not.toHaveBeenCalled();
  });

  it('should return badRequest when mode is missing', async () => {
    const result = await callPOST(
      { home_id: 'home-1' },
      mockSession
    );

    expect((result as any).ok).toBe(false);
    expect((result as any).status).toBe(400);
    expect(mockProxySetThermMode).not.toHaveBeenCalled();
  });

  it('should return badRequest for invalid mode (off not in [schedule, away, hg])', async () => {
    const result = await callPOST(
      { home_id: 'home-1', mode: 'off' },
      mockSession
    );

    expect((result as any).ok).toBe(false);
    expect((result as any).status).toBe(400);
    expect(mockProxySetThermMode).not.toHaveBeenCalled();
  });

  it('should call adminDbPush with error field when proxy throws', async () => {
    const proxyError = new Error('Proxy connection failed');
    mockProxySetThermMode.mockRejectedValue(proxyError);

    const result = await callPOST(
      { home_id: 'home-1', mode: 'schedule' },
      mockSession
    );

    // Error is logged then rethrown; withAuthAndErrorHandler catches it
    expect((result as any).ok).toBe(false);
    expect(mockAdminDbPush).toHaveBeenCalledWith(
      'log',
      expect.objectContaining({
        error: 'Proxy connection failed',
        device: 'thermostat',
        mode: 'schedule',
      })
    );
  });

  it('should NOT call adminDbPush on successful proxy call', async () => {
    mockProxySetThermMode.mockResolvedValue(mockProxyResponse);

    await callPOST(
      { home_id: 'home-1', mode: 'schedule' },
      mockSession
    );

    expect(mockAdminDbPush).not.toHaveBeenCalled();
  });
});
