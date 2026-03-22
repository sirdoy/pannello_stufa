/**
 * @jest-environment node
 *
 * Tests for POST /api/netatmo/setroomthermpoint
 * Migrated to use Netatmo proxy instead of Netatmo Cloud API directly.
 */

import { POST } from '@/app/api/netatmo/setroomthermpoint/route';
import { proxySetRoomThermpoint } from '@/lib/netatmo/netatmoProxy';
import { adminDbPush } from '@/lib/firebaseAdmin';
import type { ProxyControlResponse } from '@/types/netatmoProxy';

// Mock dependencies
jest.mock('@/lib/netatmo/netatmoProxy');
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

const mockProxySetRoomThermpoint = proxySetRoomThermpoint as jest.MockedFunction<typeof proxySetRoomThermpoint>;
const mockAdminDbPush = adminDbPush as jest.MockedFunction<typeof adminDbPush>;

const mockProxyResponse: ProxyControlResponse = {
  status: 'ok',
  time_exec: 0.05,
  time_server: 1700000000,
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

describe('POST /api/netatmo/setroomthermpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAdminDbPush.mockResolvedValue(undefined as any);
  });

  it('should call proxySetRoomThermpoint with valid manual mode body and return success', async () => {
    mockProxySetRoomThermpoint.mockResolvedValue(mockProxyResponse);

    const result = await callPOST(
      { home_id: 'home-1', room_id: 'room-1', mode: 'manual', temp: 21, endtime: 1700001000 },
      mockSession
    );

    expect(mockProxySetRoomThermpoint).toHaveBeenCalledWith({
      home_id: 'home-1',
      room_id: 'room-1',
      mode: 'manual',
      temp: 21,
      endtime: 1700001000,
    });
    expect((result as any).ok).toBe(true);
    expect((result as any).data).toEqual({});
  });

  it('should call proxy with home mode (no temp) and return success', async () => {
    mockProxySetRoomThermpoint.mockResolvedValue(mockProxyResponse);

    const result = await callPOST(
      { home_id: 'home-1', room_id: 'room-2', mode: 'home' },
      mockSession
    );

    expect(mockProxySetRoomThermpoint).toHaveBeenCalledWith({
      home_id: 'home-1',
      room_id: 'room-2',
      mode: 'home',
    });
    expect((result as any).ok).toBe(true);
  });

  it('should return badRequest when home_id is missing', async () => {
    const result = await callPOST(
      { room_id: 'room-1', mode: 'manual', temp: 21 },
      mockSession
    );

    expect((result as any).ok).toBe(false);
    expect((result as any).status).toBe(400);
    expect(mockProxySetRoomThermpoint).not.toHaveBeenCalled();
  });

  it('should return badRequest when room_id is missing', async () => {
    const result = await callPOST(
      { home_id: 'home-1', mode: 'manual', temp: 21 },
      mockSession
    );

    expect((result as any).ok).toBe(false);
    expect((result as any).status).toBe(400);
    expect(mockProxySetRoomThermpoint).not.toHaveBeenCalled();
  });

  it('should return badRequest for invalid mode (off not in [manual, home])', async () => {
    const result = await callPOST(
      { home_id: 'home-1', room_id: 'room-1', mode: 'off', temp: 21 },
      mockSession
    );

    expect((result as any).ok).toBe(false);
    expect((result as any).status).toBe(400);
    expect(mockProxySetRoomThermpoint).not.toHaveBeenCalled();
  });

  it('should return badRequest when mode=manual but temp is missing', async () => {
    const result = await callPOST(
      { home_id: 'home-1', room_id: 'room-1', mode: 'manual' },
      mockSession
    );

    expect((result as any).ok).toBe(false);
    expect((result as any).status).toBe(400);
    expect(mockProxySetRoomThermpoint).not.toHaveBeenCalled();
  });

  it('should call adminDbPush with error field when proxy throws', async () => {
    const proxyError = new Error('Proxy connection failed');
    mockProxySetRoomThermpoint.mockRejectedValue(proxyError);

    const result = await callPOST(
      { home_id: 'home-1', room_id: 'room-1', mode: 'manual', temp: 20 },
      mockSession
    );

    // Error is logged then rethrown; withAuthAndErrorHandler catches it
    expect((result as any).ok).toBe(false);
    expect(mockAdminDbPush).toHaveBeenCalledWith(
      'log',
      expect.objectContaining({
        error: 'Proxy connection failed',
        device: 'thermostat',
        room_id: 'room-1',
        mode: 'manual',
      })
    );
  });

  it('should NOT call adminDbPush on successful proxy call', async () => {
    mockProxySetRoomThermpoint.mockResolvedValue(mockProxyResponse);

    await callPOST(
      { home_id: 'home-1', room_id: 'room-1', mode: 'manual', temp: 21 },
      mockSession
    );

    expect(mockAdminDbPush).not.toHaveBeenCalled();
  });

  it('should not include endtime in proxy call when endtime is falsy', async () => {
    mockProxySetRoomThermpoint.mockResolvedValue(mockProxyResponse);

    await callPOST(
      { home_id: 'home-1', room_id: 'room-1', mode: 'manual', temp: 21 },
      mockSession
    );

    const callArg = mockProxySetRoomThermpoint.mock.calls[0]?.[0];
    expect(callArg).not.toHaveProperty('endtime');
  });
});
