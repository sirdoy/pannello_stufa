/**
 * Tests for Netatmo Set Therm Mode Route
 * POST /api/netatmo/setthermmode
 *
 * NOTE: This file is superseded by __tests__/api/netatmo/setthermmode.test.ts
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

jest.mock('@/lib/netatmoProxy', () => ({
  proxySetThermMode: jest.fn(),
}));

jest.mock('@/lib/devices/deviceTypes', () => ({
  DEVICE_TYPES: {
    THERMOSTAT: 'thermostat',
  },
}));

// Import after mocks are set up
import { POST } from '../route';
import { adminDbPush } from '@/lib/firebaseAdmin';
import { proxySetThermMode } from '@/lib/netatmoProxy';

describe('POST /api/netatmo/setthermmode (co-located)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (proxySetThermMode as jest.Mock).mockResolvedValue({ status: 'ok', confirmed_mode: 'schedule', netatmo_response: {} });
    (adminDbPush as jest.Mock).mockResolvedValue(undefined);
  });

  const createRequest = (body: any): any => ({
    json: async () => body,
  });

  it('should return 400 when mode is missing', async () => {
    const response = await POST(createRequest({ home_id: 'home-1' }), {} as any);
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toContain('mode');
  });

  it('should return 400 when home_id is missing', async () => {
    const response = await POST(createRequest({ mode: 'schedule' }), {} as any);
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toContain('home_id');
  });

  it('should return 400 when mode is invalid (off not allowed)', async () => {
    const response = await POST(createRequest({ home_id: 'home-1', mode: 'off' }), {} as any);
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toContain('mode');
  });

  it('should return 200 success with schedule mode', async () => {
    const response = await POST(createRequest({ home_id: 'home-1', mode: 'schedule' }), {} as any);
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(proxySetThermMode).toHaveBeenCalledWith(
      expect.objectContaining({ home_id: 'home-1', mode: 'schedule' })
    );
  });

  it('should include endtime for away mode when provided', async () => {
    const endtime = Math.floor(Date.now() / 1000) + 7200;
    await POST(createRequest({ home_id: 'home-1', mode: 'away', endtime }), {} as any);
    expect(proxySetThermMode).toHaveBeenCalledWith(
      expect.objectContaining({ home_id: 'home-1', mode: 'away', endtime })
    );
  });

  it('should NOT include endtime for schedule mode', async () => {
    const endtime = Math.floor(Date.now() / 1000) + 3600;
    await POST(createRequest({ home_id: 'home-1', mode: 'schedule', endtime }), {} as any);
    const callArg = (proxySetThermMode as jest.Mock).mock.calls[0]?.[0];
    expect(callArg).not.toHaveProperty('endtime');
  });

  it('should NOT call adminDbPush on success', async () => {
    await POST(createRequest({ home_id: 'home-1', mode: 'hg' }), {} as any);
    expect(adminDbPush).not.toHaveBeenCalled();
  });
});
