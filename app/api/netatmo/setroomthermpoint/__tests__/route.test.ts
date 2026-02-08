/**
 * Tests for Netatmo Set Room Thermpoint Route
 * POST /api/netatmo/setroomthermpoint
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
    setRoomThermpoint: jest.fn(),
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

describe('POST /api/netatmo/setroomthermpoint', () => {
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
    (NETATMO_API.setRoomThermpoint as jest.Mock).mockResolvedValue(true);
  });

  const createRequest = (body): any => {
    return {
      json: async () => body,
    };
  };

  it('should return 400 when room_id is missing', async () => {
    const request = createRequest({ mode: 'manual', temp: 21 });

    const response = await POST(request, {} as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('room_id');
  });

  it('should return 400 when mode is missing', async () => {
    const request = createRequest({ room_id: 'room456', temp: 21 });

    const response = await POST(request, {} as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('mode');
  });

  it('should return 400 when mode is invalid', async () => {
    const request = createRequest({ room_id: 'room456', mode: 'invalid', temp: 21 });

    const response = await POST(request, {} as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('mode');
  });

  it('should return 400 when mode is manual but temp is missing', async () => {
    const request = createRequest({ room_id: 'room456', mode: 'manual' });

    const response = await POST(request, {} as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('temp');
  });

  it('should return 400 when home_id not found in Firebase', async () => {
    (adminDbGet as jest.Mock).mockResolvedValueOnce(null);

    const request = createRequest({ room_id: 'room456', mode: 'manual', temp: 21 });

    const response = await POST(request, {} as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('home_id');
  });

  it('should return 200 success with valid manual mode and temp', async () => {
    const request = createRequest({ room_id: 'room456', mode: 'manual', temp: 21 });

    const response = await POST(request, {} as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(NETATMO_API.setRoomThermpoint).toHaveBeenCalledWith(
      'test-access-token',
      expect.objectContaining({
        home_id: 'home123',
        room_id: 'room456',
        mode: 'manual',
        temp: 21,
      })
    );
  });

  it('should return 200 success with home mode (no temp required)', async () => {
    const request = createRequest({ room_id: 'room456', mode: 'home' });

    const response = await POST(request, {} as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(NETATMO_API.setRoomThermpoint).toHaveBeenCalledWith(
      'test-access-token',
      expect.objectContaining({
        home_id: 'home123',
        room_id: 'room456',
        mode: 'home',
      })
    );
  });

  it('should push log entry to Firebase on success', async () => {
    const request = createRequest({ room_id: 'room456', mode: 'manual', temp: 21.5 });

    await POST(request, {} as any);

    expect(adminDbPush).toHaveBeenCalledWith(
      'log',
      expect.objectContaining({
        action: 'Modifica temperatura stanza',
        device: 'thermostat',
        value: '21.5°C',
        room_id: 'room456',
        mode: 'manual',
        temp: 21.5,
        source: 'manual',
        user: expect.objectContaining({
          email: 'test@test.com',
          name: 'Test User',
        }),
      })
    );
  });

  it('should include endtime in params when provided', async () => {
    const endtime = Math.floor(Date.now() / 1000) + 3600;
    const request = createRequest({ room_id: 'room456', mode: 'manual', temp: 21, endtime });

    await POST(request, {} as any);

    expect(NETATMO_API.setRoomThermpoint).toHaveBeenCalledWith(
      'test-access-token',
      expect.objectContaining({
        home_id: 'home123',
        room_id: 'room456',
        mode: 'manual',
        temp: 21,
        endtime,
      })
    );
  });

  it('should return 500 when Netatmo API command fails', async () => {
    (NETATMO_API.setRoomThermpoint as jest.Mock).mockResolvedValueOnce(false);

    const request = createRequest({ room_id: 'room456', mode: 'manual', temp: 21 });

    const response = await POST(request, {} as any);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain('non riuscito');
  });

  it('should handle max mode correctly', async () => {
    const request = createRequest({ room_id: 'room456', mode: 'max' });

    const response = await POST(request, {} as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(NETATMO_API.setRoomThermpoint).toHaveBeenCalledWith(
      'test-access-token',
      expect.objectContaining({
        mode: 'max',
      })
    );
  });

  it('should handle off mode correctly', async () => {
    const request = createRequest({ room_id: 'room456', mode: 'off' });

    const response = await POST(request, {} as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(NETATMO_API.setRoomThermpoint).toHaveBeenCalledWith(
      'test-access-token',
      expect.objectContaining({
        mode: 'off',
      })
    );
  });

  it('should use environment-aware path for home_id', async () => {
    const request = createRequest({ room_id: 'room456', mode: 'home' });

    await POST(request, {} as any);

    expect(getEnvironmentPath).toHaveBeenCalledWith('netatmo/home_id');
    expect(adminDbGet).toHaveBeenCalledWith('netatmo/home_id');
  });
});
