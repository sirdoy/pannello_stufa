/**
 * Unit tests for Netatmo API Wrapper Control Functions
 * Tests setRoomThermpoint, setThermMode, and switchHomeSchedule
 */

// Mock fetch globally before imports
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock credentials module
jest.mock('../netatmoCredentials', () => ({
  getNetatmoCredentials: jest.fn(() => ({
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    redirectUri: 'http://localhost:3000/api/netatmo/callback',
  })),
}));

import NETATMO_API, {
  setRoomThermpoint,
  setThermMode,
  switchHomeSchedule,
} from '../netatmoApi';

describe('netatmoApi control functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('setRoomThermpoint', () => {
    const accessToken = 'test-access-token';
    const baseParams = {
      home_id: 'home123',
      room_id: 'room456',
      mode: 'manual',
    };

    it('should convert integer temperature to float', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ status: 'ok' }),
      });

      await setRoomThermpoint(accessToken, { ...baseParams, temp: 21 });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.netatmo.com/api/setroomthermpoint',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-access-token',
            'Content-Type': 'application/x-www-form-urlencoded',
          }),
        })
      );

      // Check URLSearchParams body
      const callArgs = mockFetch.mock.calls[0][1];
      const bodyParams = new URLSearchParams(callArgs.body);
      expect(bodyParams.get('temp')).toBe('21');
      expect(parseFloat(bodyParams.get('temp'))).toBe(21.0);
    });

    it('should keep decimal temperature as float', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ status: 'ok' }),
      });

      await setRoomThermpoint(accessToken, { ...baseParams, temp: 21.5 });

      const callArgs = mockFetch.mock.calls[0][1];
      const bodyParams = new URLSearchParams(callArgs.body);
      expect(bodyParams.get('temp')).toBe('21.5');
      expect(parseFloat(bodyParams.get('temp'))).toBe(21.5);
    });

    it('should convert string temperature to float', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ status: 'ok' }),
      });

      await setRoomThermpoint(accessToken, { ...baseParams, temp: '21' });

      const callArgs = mockFetch.mock.calls[0][1];
      const bodyParams = new URLSearchParams(callArgs.body);
      expect(bodyParams.get('temp')).toBe('21');
      expect(parseFloat(bodyParams.get('temp'))).toBe(21.0);
    });

    it('should use correct endpoint URL', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ status: 'ok' }),
      });

      await setRoomThermpoint(accessToken, { ...baseParams, temp: 21 });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.netatmo.com/api/setroomthermpoint',
        expect.any(Object)
      );
    });

    it('should send params via URLSearchParams (x-www-form-urlencoded)', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ status: 'ok' }),
      });

      await setRoomThermpoint(accessToken, { ...baseParams, temp: 21 });

      const callArgs = mockFetch.mock.calls[0][1];
      expect(callArgs.headers['Content-Type']).toBe('application/x-www-form-urlencoded');
      expect(callArgs.body).toBeInstanceOf(URLSearchParams);
    });

    it('should return true on success', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ status: 'ok' }),
      });

      const result = await setRoomThermpoint(accessToken, { ...baseParams, temp: 21 });

      expect(result).toBe(true);
    });

    it('should throw error on API error', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ status: 'error', error: { message: 'Invalid room_id' } }),
      });

      await expect(setRoomThermpoint(accessToken, { ...baseParams, temp: 21 }))
        .rejects.toThrow('Netatmo API Error: Invalid room_id');
    });

    it('should handle mode without temp (home mode)', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ status: 'ok' }),
      });

      await setRoomThermpoint(accessToken, {
        home_id: 'home123',
        room_id: 'room456',
        mode: 'home',
      });

      const callArgs = mockFetch.mock.calls[0][1];
      const bodyParams = new URLSearchParams(callArgs.body);
      // URLSearchParams includes undefined as string 'undefined', so check the value
      const tempValue = bodyParams.get('temp');
      expect(tempValue === null || tempValue === 'undefined').toBe(true);
      expect(bodyParams.get('mode')).toBe('home');
    });

    it('should include endtime parameter when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ status: 'ok' }),
      });

      const endtime = Math.floor(Date.now() / 1000) + 3600;
      await setRoomThermpoint(accessToken, { ...baseParams, temp: 21, endtime });

      const callArgs = mockFetch.mock.calls[0][1];
      const bodyParams = new URLSearchParams(callArgs.body);
      expect(bodyParams.get('endtime')).toBe(String(endtime));
    });
  });

  describe('setThermMode', () => {
    const accessToken = 'test-access-token';
    const baseParams = {
      home_id: 'home123',
      mode: 'schedule',
    };

    it('should handle schedule mode', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ status: 'ok' }),
      });

      const result = await setThermMode(accessToken, baseParams);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.netatmo.com/api/setthermmode',
        expect.any(Object)
      );
      expect(result).toBe(true);

      const callArgs = mockFetch.mock.calls[0][1];
      const bodyParams = new URLSearchParams(callArgs.body);
      expect(bodyParams.get('mode')).toBe('schedule');
      expect(bodyParams.get('home_id')).toBe('home123');
    });

    it('should handle away mode', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ status: 'ok' }),
      });

      await setThermMode(accessToken, { ...baseParams, mode: 'away' });

      const callArgs = mockFetch.mock.calls[0][1];
      const bodyParams = new URLSearchParams(callArgs.body);
      expect(bodyParams.get('mode')).toBe('away');
    });

    it('should handle hg (frost guard) mode', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ status: 'ok' }),
      });

      await setThermMode(accessToken, { ...baseParams, mode: 'hg' });

      const callArgs = mockFetch.mock.calls[0][1];
      const bodyParams = new URLSearchParams(callArgs.body);
      expect(bodyParams.get('mode')).toBe('hg');
    });

    it('should handle off mode', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ status: 'ok' }),
      });

      await setThermMode(accessToken, { ...baseParams, mode: 'off' });

      const callArgs = mockFetch.mock.calls[0][1];
      const bodyParams = new URLSearchParams(callArgs.body);
      expect(bodyParams.get('mode')).toBe('off');
    });

    it('should include endtime for away mode', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ status: 'ok' }),
      });

      const endtime = Math.floor(Date.now() / 1000) + 7200;
      await setThermMode(accessToken, { ...baseParams, mode: 'away', endtime });

      const callArgs = mockFetch.mock.calls[0][1];
      const bodyParams = new URLSearchParams(callArgs.body);
      expect(bodyParams.get('endtime')).toBe(String(endtime));
    });

    it('should include endtime for hg mode', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ status: 'ok' }),
      });

      const endtime = Math.floor(Date.now() / 1000) + 7200;
      await setThermMode(accessToken, { ...baseParams, mode: 'hg', endtime });

      const callArgs = mockFetch.mock.calls[0][1];
      const bodyParams = new URLSearchParams(callArgs.body);
      expect(bodyParams.get('endtime')).toBe(String(endtime));
    });

    it('should use correct endpoint URL', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ status: 'ok' }),
      });

      await setThermMode(accessToken, baseParams);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.netatmo.com/api/setthermmode',
        expect.any(Object)
      );
    });

    it('should send params via URLSearchParams', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ status: 'ok' }),
      });

      await setThermMode(accessToken, baseParams);

      const callArgs = mockFetch.mock.calls[0][1];
      expect(callArgs.headers['Content-Type']).toBe('application/x-www-form-urlencoded');
      expect(callArgs.body).toBeInstanceOf(URLSearchParams);
    });

    it('should return true on success', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ status: 'ok' }),
      });

      const result = await setThermMode(accessToken, baseParams);
      expect(result).toBe(true);
    });

    it('should throw error on API error', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ status: 'error', error: { message: 'Invalid mode' } }),
      });

      await expect(setThermMode(accessToken, baseParams))
        .rejects.toThrow('Netatmo API Error: Invalid mode');
    });
  });

  describe('switchHomeSchedule', () => {
    const accessToken = 'test-access-token';
    const homeId = 'home123';
    const scheduleId = 'schedule456';

    it('should switch home schedule successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ status: 'ok' }),
      });

      const result = await switchHomeSchedule(accessToken, homeId, scheduleId);

      expect(result).toBe(true);
    });

    it('should use correct endpoint URL', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ status: 'ok' }),
      });

      await switchHomeSchedule(accessToken, homeId, scheduleId);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.netatmo.com/api/switchhomeschedule',
        expect.any(Object)
      );
    });

    it('should include home_id and schedule_id params', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ status: 'ok' }),
      });

      await switchHomeSchedule(accessToken, homeId, scheduleId);

      const callArgs = mockFetch.mock.calls[0][1];
      const bodyParams = new URLSearchParams(callArgs.body);
      expect(bodyParams.get('home_id')).toBe('home123');
      expect(bodyParams.get('schedule_id')).toBe('schedule456');
    });

    it('should throw error on API error', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ status: 'error', error: { message: 'Invalid schedule' } }),
      });

      await expect(switchHomeSchedule(accessToken, homeId, scheduleId))
        .rejects.toThrow('Netatmo API Error: Invalid schedule');
    });
  });

  describe('default export', () => {
    it('should export control functions', () => {
      expect(NETATMO_API.setRoomThermpoint).toBe(setRoomThermpoint);
      expect(NETATMO_API.setThermMode).toBe(setThermMode);
      expect(NETATMO_API.switchHomeSchedule).toBe(switchHomeSchedule);
    });
  });
});
