/**
 * Tests for Netatmo Set Room Thermpoint Route
 * POST /api/netatmo/setroomthermpoint
 *
 * NOTE: This file is superseded by __tests__/api/netatmo/setroomthermpoint.test.ts
 * which covers the migrated proxy-based implementation.
 * This file is kept for co-location but tests are minimal to avoid duplication.
 */

// Mock ALL imports before any requires
jest.mock('@/lib/core', () => {
  const badRequestMock = jest.fn((message: string) => ({
    status: 400,
    json: async () => ({ success: false, error: message }),
  }));

  return {
    withAuthAndErrorHandler: jest.fn((handler: Function) => async (request: any, context: any) => {
      const mockSession = { user: { email: 'test@test.com', name: 'Test User', sub: 'auth0|123' } };
      try {
        return await handler(request, context, mockSession);
      } catch (error: any) {
        return badRequestMock(error.message);
      }
    }),
    success: jest.fn((data: Record<string, unknown>) => ({
      status: 200,
      json: async () => ({ success: true, ...data }),
    })),
    badRequest: badRequestMock,
    serverError: jest.fn((message: string) => ({
      status: 500,
      json: async () => ({ success: false, error: message }),
    })),
    parseJsonOrThrow: jest.fn(async (req: any) => req.json()),
    validateRequired: jest.fn((value: unknown, name: string) => {
      if (value === undefined || value === null) {
        throw new Error(`${name} is required`);
      }
    }),
    validateEnum: jest.fn((value: unknown, validValues: string[], name: string) => {
      if (!validValues.includes(value as string)) {
        throw new Error(`${name} must be one of: ${validValues.join(', ')}`);
      }
    }),
  };
});

jest.mock('@/lib/firebaseAdmin', () => ({
  adminDbPush: jest.fn(),
}));

jest.mock('@/lib/netatmo/netatmoProxy', () => ({
  proxySetRoomThermpoint: jest.fn(),
}));

jest.mock('@/lib/devices/deviceTypes', () => ({
  DEVICE_TYPES: {
    THERMOSTAT: 'thermostat',
  },
}));

// Import after mocks are set up
import { POST } from '../route';
import { adminDbPush } from '@/lib/firebaseAdmin';
import { proxySetRoomThermpoint } from '@/lib/netatmo/netatmoProxy';

describe('POST /api/netatmo/setroomthermpoint (co-located)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (proxySetRoomThermpoint as jest.Mock).mockResolvedValue({ status: 'ok', time_exec: 0.05, time_server: 1700000000 });
    (adminDbPush as jest.Mock).mockResolvedValue(undefined);
  });

  const createRequest = (body: any): any => ({
    json: async () => body,
  });

  it('should return 400 when room_id is missing', async () => {
    const response = await POST(createRequest({ home_id: 'home-1', mode: 'manual', temp: 21 }), {} as any);
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toContain('room_id');
  });

  it('should return 400 when home_id is missing', async () => {
    const response = await POST(createRequest({ room_id: 'room-1', mode: 'manual', temp: 21 }), {} as any);
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toContain('home_id');
  });

  it('should return 400 when mode is missing', async () => {
    const response = await POST(createRequest({ home_id: 'home-1', room_id: 'room-1', temp: 21 }), {} as any);
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toContain('mode');
  });

  it('should return 400 when mode is invalid (off not allowed)', async () => {
    const response = await POST(createRequest({ home_id: 'home-1', room_id: 'room-1', mode: 'off', temp: 21 }), {} as any);
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toContain('mode');
  });

  it('should return 400 when mode=manual but temp is missing', async () => {
    const response = await POST(createRequest({ home_id: 'home-1', room_id: 'room-1', mode: 'manual' }), {} as any);
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toContain('temp');
  });

  it('should return 200 and call proxy for valid manual mode', async () => {
    const response = await POST(createRequest({ home_id: 'home-1', room_id: 'room-1', mode: 'manual', temp: 21 }), {} as any);
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(proxySetRoomThermpoint).toHaveBeenCalledWith(
      expect.objectContaining({ home_id: 'home-1', room_id: 'room-1', mode: 'manual', temp: 21 })
    );
  });

  it('should NOT call adminDbPush on success', async () => {
    await POST(createRequest({ home_id: 'home-1', room_id: 'room-1', mode: 'manual', temp: 21 }), {} as any);
    expect(adminDbPush).not.toHaveBeenCalled();
  });
});
