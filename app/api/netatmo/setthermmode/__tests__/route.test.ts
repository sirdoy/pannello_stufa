/**
 * Tests for Netatmo Set Therm Mode Route
 * POST /api/netatmo/setthermmode
 */

// Mock ALL imports before any requires
jest.mock('@/lib/core', () => {
  const badRequestMock = jest.fn((message) => ({
    status: 400,
    json: async () => ({ success: false, error: message }),
  }));

  return {
    withAuthAndErrorHandler: jest.fn((handler) => async (request: any, context: any) => {
      const mockSession = { user: { email: 'test@test.com', name: 'Test User', sub: 'auth0|123' } };
      try {
        return await handler(request, context, mockSession);
      } catch (error: any) {
        return badRequestMock(error.message);
      }
    }),
    success: jest.fn((data) => ({
      status: 200,
      json: async () => ({ success: true, ...data }),
    })),
    badRequest: badRequestMock,
    serverError: jest.fn((message) => ({
      status: 500,
      json: async () => ({ success: false, error: message }),
    })),
    parseJsonOrThrow: jest.fn(async (req) => req.json()),
    validateRequired: jest.fn((value, name) => {
      if (value === undefined || value === null) {
        throw new Error(`${name} is required`);
      }
    }),
    validateEnum: jest.fn((value, validValues, name) => {
      if (!validValues.includes(value)) {
        throw new Error(`${name} must be one of: ${validValues.join(', ')}`);
      }
    }),
    requireNetatmoToken: jest.fn(async () => 'test-access-token'),
  };
});

jest.mock('@/lib/firebaseAdmin', () => ({
  adminDbGet: jest.fn(),
  adminDbPush: jest.fn(),
}));

jest.mock('@/lib/netatmoApi', () => ({
  __esModule: true,
  default: {
    setThermMode: jest.fn(),
  },
}));

jest.mock('@/lib/environmentHelper', () => ({
  getEnvironmentPath: jest.fn(() => 'netatmo/home_id'),
}));

jest.mock('@/lib/devices/deviceTypes', () => ({
  DEVICE_TYPES: {
    THERMOSTAT: 'thermostat',
  },
}));

// Import after mocks are set up
import { POST } from '../route';
import * as core from '@/lib/core';
import { adminDbGet, adminDbPush } from '@/lib/firebaseAdmin';
import NETATMO_API from '@/lib/netatmoApi';
import { getEnvironmentPath } from '@/lib/environmentHelper';

describe('POST /api/netatmo/setthermmode', () => {
  const mockSession = {
    user: {
      sub: 'auth0|123',
      email: 'test@test.com',
      name: 'Test User',
      picture: 'https://example.com/pic.jpg',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset default mock implementations
    (adminDbGet as jest.Mock).mockResolvedValue('home123');
    (adminDbPush as jest.Mock).mockResolvedValue({ key: 'log-key-123' });
    (NETATMO_API.setThermMode as jest.Mock).mockResolvedValue(true);
  });

  const createRequest = (body: any): any => {
    return {
      json: async () => body,
    };
  };

  it('should return 400 when mode is missing', async () => {
    const request = createRequest({});

    const response = await POST(request, {} as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('mode');
  });

  it('should return 400 when mode is invalid', async () => {
    const request = createRequest({ mode: 'invalid' });

    const response = await POST(request, {} as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('mode');
  });

  it('should return 400 when home_id not found in Firebase', async () => {
    (adminDbGet as jest.Mock).mockResolvedValueOnce(null);

    const request = createRequest({ mode: 'schedule' });

    const response = await POST(request, {} as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('home_id');
  });

  it('should return 200 success with schedule mode', async () => {
    const request = createRequest({ mode: 'schedule' });

    const response = await POST(request, {} as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(NETATMO_API.setThermMode).toHaveBeenCalledWith(
      'test-access-token',
      expect.objectContaining({
        home_id: 'home123',
        mode: 'schedule',
      })
    );
  });

  it('should return 200 success with away mode', async () => {
    const request = createRequest({ mode: 'away' });

    const response = await POST(request, {} as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(NETATMO_API.setThermMode).toHaveBeenCalledWith(
      'test-access-token',
      expect.objectContaining({
        home_id: 'home123',
        mode: 'away',
      })
    );
  });

  it('should return 200 success with away mode and endtime', async () => {
    const endtime = Math.floor(Date.now() / 1000) + 7200;
    const request = createRequest({ mode: 'away', endtime });

    const response = await POST(request, {} as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(NETATMO_API.setThermMode).toHaveBeenCalledWith(
      'test-access-token',
      expect.objectContaining({
        home_id: 'home123',
        mode: 'away',
        endtime,
      })
    );
  });

  it('should return 200 success with hg (frost guard) mode', async () => {
    const request = createRequest({ mode: 'hg' });

    const response = await POST(request, {} as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(NETATMO_API.setThermMode).toHaveBeenCalledWith(
      'test-access-token',
      expect.objectContaining({
        home_id: 'home123',
        mode: 'hg',
      })
    );
  });

  it('should return 200 success with off mode', async () => {
    const request = createRequest({ mode: 'off' });

    const response = await POST(request, {} as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(NETATMO_API.setThermMode).toHaveBeenCalledWith(
      'test-access-token',
      expect.objectContaining({
        home_id: 'home123',
        mode: 'off',
      })
    );
  });

  it('should push log entry to Firebase on success', async () => {
    const request = createRequest({ mode: 'away' });

    await POST(request, {} as any);

    expect(adminDbPush).toHaveBeenCalledWith(
      'log',
      expect.objectContaining({
        action: 'Cambio modalita termostato',
        device: 'thermostat',
        value: 'away',
        mode: 'away',
        source: 'manual',
        user: expect.objectContaining({
          email: 'test@test.com',
          name: 'Test User',
        }),
      })
    );
  });

  it('should include endtime in log when provided', async () => {
    const endtime = Math.floor(Date.now() / 1000) + 7200;
    const request = createRequest({ mode: 'hg', endtime });

    await POST(request, {} as any);

    expect(adminDbPush).toHaveBeenCalledWith(
      'log',
      expect.objectContaining({
        mode: 'hg',
        endtime,
      })
    );
  });

  it('should set endtime to null in log when not provided', async () => {
    const request = createRequest({ mode: 'schedule' });

    await POST(request, {} as any);

    expect(adminDbPush).toHaveBeenCalledWith(
      'log',
      expect.objectContaining({
        endtime: null,
      })
    );
  });

  it('should return 500 when Netatmo API command fails', async () => {
    (NETATMO_API.setThermMode as jest.Mock).mockResolvedValueOnce(false);

    const request = createRequest({ mode: 'schedule' });

    const response = await POST(request, {} as any);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain('non riuscito');
  });

  it('should use environment-aware path for home_id', async () => {
    const request = createRequest({ mode: 'schedule' });

    await POST(request, {} as any);

    expect(getEnvironmentPath).toHaveBeenCalledWith('netatmo/home_id');
    expect(adminDbGet).toHaveBeenCalledWith('netatmo/home_id');
  });

  it('should validate mode against correct enum values', async () => {
    // Valid modes: schedule, away, hg, off
    const validModes = ['schedule', 'away', 'hg', 'off'];

    for (const mode of validModes) {
      jest.clearAllMocks();
      const request = createRequest({ mode });
      const response = await POST(request, {} as any);

      expect(response.status).toBe(200);
    }
  });

  it('should only include endtime for away and hg modes', async () => {
    const endtime = Math.floor(Date.now() / 1000) + 3600;

    // Test schedule mode - endtime should not be included
    jest.clearAllMocks();
    let request = createRequest({ mode: 'schedule', endtime });
    await POST(request, {} as any);

    let callParams = ((NETATMO_API as any).setThermMode as jest.Mock).mock.calls[0][1];
    expect(callParams.endtime).toBeUndefined();

    // Test away mode - endtime should be included
    jest.clearAllMocks();
    request = createRequest({ mode: 'away', endtime });
    await POST(request, {} as any);

    callParams = ((NETATMO_API as any).setThermMode as jest.Mock).mock.calls[0][1];
    expect(callParams.endtime).toBe(endtime);

    // Test hg mode - endtime should be included
    jest.clearAllMocks();
    request = createRequest({ mode: 'hg', endtime });
    await POST(request, {} as any);

    callParams = ((NETATMO_API as any).setThermMode as jest.Mock).mock.calls[0][1];
    expect(callParams.endtime).toBe(endtime);
  });
});
