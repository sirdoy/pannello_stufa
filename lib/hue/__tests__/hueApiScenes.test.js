/**
 * @jest-environment jsdom
 */

import HueApi from '../hueApi';

// Mock httpsRequest for testing
jest.mock('../hueApi', () => {
  const actual = jest.requireActual('../hueApi');
  return {
    __esModule: true,
    ...actual,
    default: jest.fn().mockImplementation((bridgeIp, applicationKey) => {
      const instance = new actual.default(bridgeIp, applicationKey);
      // Mock request method
      instance.request = jest.fn();
      return instance;
    }),
  };
});

describe('HueApi - Scene Management', () => {
  let hueApi;

  beforeEach(() => {
    hueApi = new HueApi('192.168.1.100', 'test-app-key');
    hueApi.request.mockClear();
  });

  describe('createScene', () => {
    it('should send correct POST request with all parameters', async () => {
      const mockResponse = {
        data: [{
          rid: 'scene-123',
          type: 'scene'
        }]
      };
      hueApi.request.mockResolvedValue(mockResponse);

      const name = 'Evening Ambiance';
      const groupRid = 'room-abc';
      const actions = [
        {
          target: { rid: 'light-1', rtype: 'light' },
          action: { on: { on: true }, dimming: { brightness: 75 } }
        }
      ];

      await hueApi.createScene(name, groupRid, actions);

      expect(hueApi.request).toHaveBeenCalledWith('/clip/v2/resource/scene', {
        method: 'POST',
        body: JSON.stringify({
          name,
          group: { rid: groupRid, rtype: 'room' },
          actions
        })
      });
    });

    it('should return scene data from API response', async () => {
      const mockResponse = {
        data: [{
          rid: 'scene-456',
          type: 'scene',
          name: 'Morning Light'
        }]
      };
      hueApi.request.mockResolvedValue(mockResponse);

      const result = await hueApi.createScene('Morning Light', 'room-xyz', []);

      expect(result).toEqual(mockResponse);
    });
  });

  describe('updateScene', () => {
    it('should send PUT request with only name when provided', async () => {
      const mockResponse = { data: [{ rid: 'scene-123' }] };
      hueApi.request.mockResolvedValue(mockResponse);

      await hueApi.updateScene('scene-123', { name: 'Updated Name' });

      expect(hueApi.request).toHaveBeenCalledWith('/clip/v2/resource/scene/scene-123', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated Name' })
      });
    });

    it('should send PUT request with only actions when provided', async () => {
      const mockResponse = { data: [{ rid: 'scene-123' }] };
      hueApi.request.mockResolvedValue(mockResponse);

      const actions = [
        {
          target: { rid: 'light-2', rtype: 'light' },
          action: { on: { on: false } }
        }
      ];

      await hueApi.updateScene('scene-123', { actions });

      expect(hueApi.request).toHaveBeenCalledWith('/clip/v2/resource/scene/scene-123', {
        method: 'PUT',
        body: JSON.stringify({ actions })
      });
    });

    it('should send PUT request with both name and actions', async () => {
      const mockResponse = { data: [{ rid: 'scene-123' }] };
      hueApi.request.mockResolvedValue(mockResponse);

      const updates = {
        name: 'Complete Update',
        actions: [
          {
            target: { rid: 'light-3', rtype: 'light' },
            action: { on: { on: true }, dimming: { brightness: 50 } }
          }
        ]
      };

      await hueApi.updateScene('scene-123', updates);

      expect(hueApi.request).toHaveBeenCalledWith('/clip/v2/resource/scene/scene-123', {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
    });

    it('should not include undefined fields in payload', async () => {
      const mockResponse = { data: [{ rid: 'scene-123' }] };
      hueApi.request.mockResolvedValue(mockResponse);

      await hueApi.updateScene('scene-123', { name: 'Test' });

      const callArgs = hueApi.request.mock.calls[0][1];
      const payload = JSON.parse(callArgs.body);

      expect(payload).toEqual({ name: 'Test' });
      expect(payload).not.toHaveProperty('actions');
    });
  });

  describe('deleteScene', () => {
    it('should send DELETE request with correct scene ID', async () => {
      const mockResponse = { data: [{ rid: 'scene-123' }] };
      hueApi.request.mockResolvedValue(mockResponse);

      await hueApi.deleteScene('scene-789');

      expect(hueApi.request).toHaveBeenCalledWith('/clip/v2/resource/scene/scene-789', {
        method: 'DELETE'
      });
    });

    it('should return delete response from API', async () => {
      const mockResponse = { data: [{ rid: 'scene-789' }] };
      hueApi.request.mockResolvedValue(mockResponse);

      const result = await hueApi.deleteScene('scene-789');

      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors correctly', async () => {
      const errorResponse = {
        errors: [{
          description: 'Scene not found',
          type: 3
        }]
      };
      hueApi.request.mockResolvedValue(errorResponse);

      const result = await hueApi.deleteScene('scene-nonexistent');

      expect(result).toEqual(errorResponse);
    });
  });

  describe('Error Handling', () => {
    it('should propagate request errors', async () => {
      const error = new Error('Network error');
      hueApi.request.mockRejectedValue(error);

      await expect(hueApi.createScene('Test', 'room-1', [])).rejects.toThrow('Network error');
    });

    it('should handle Hue API error responses', async () => {
      const errorResponse = {
        errors: [{
          description: 'Invalid action format',
          type: 2
        }]
      };
      hueApi.request.mockResolvedValue(errorResponse);

      const result = await hueApi.createScene('Test', 'room-1', [
        { invalid: 'action' }
      ]);

      expect(result).toEqual(errorResponse);
    });
  });
});
