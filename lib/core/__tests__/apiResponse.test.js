/**
 * Tests for apiResponse.js
 *
 * Tests the actual response objects without mocking NextResponse.
 */

import {
  success,
  created,
  noContent,
  error,
  handleError,
  unauthorized,
  forbidden,
  notFound,
  badRequest,
  timeout,
  stoveOffline,
  maintenanceRequired,
  netatmoReconnect,
  hueNotConnected,
} from '../apiResponse';
import { ApiError, ERROR_CODES } from '../apiErrors';

// Helper to extract data from NextResponse
async function getResponseData(response) {
  const data = await response.json();
  return { data, status: response.status };
}

describe('Success Responses', () => {
  describe('success', () => {
    it('should create success response with data', async () => {
      const response = success({ user: { id: 1, name: 'Test' } });
      const { data, status } = await getResponseData(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user).toEqual({ id: 1, name: 'Test' });
    });

    it('should include message when provided', async () => {
      const response = success({ result: 'ok' }, 'Operation completed');
      const { data } = await getResponseData(response);

      expect(data.success).toBe(true);
      expect(data.result).toBe('ok');
      expect(data.message).toBe('Operation completed');
    });

    it('should use custom status code', async () => {
      const response = success({ created: true }, null, 201);
      const { status } = await getResponseData(response);

      expect(status).toBe(201);
    });
  });

  describe('created', () => {
    it('should create 201 response', async () => {
      const response = created({ id: 'new-id' });
      const { data, status } = await getResponseData(response);

      expect(status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.id).toBe('new-id');
    });
  });

  describe('noContent', () => {
    it('should create 204 response', () => {
      const response = noContent();

      expect(response.status).toBe(204);
    });
  });
});

describe('Error Responses', () => {
  describe('error', () => {
    it('should create error response', async () => {
      const response = error('Something went wrong', ERROR_CODES.INTERNAL_ERROR, 500);
      const { data, status } = await getResponseData(response);

      expect(status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Something went wrong');
      expect(data.code).toBe(ERROR_CODES.INTERNAL_ERROR);
    });

    it('should include details when provided', async () => {
      const response = error('Validation failed', ERROR_CODES.VALIDATION_ERROR, 400, { field: 'email' });
      const { data } = await getResponseData(response);

      expect(data.field).toBe('email');
    });
  });

  describe('unauthorized', () => {
    it('should create 401 response', async () => {
      const response = unauthorized();
      const { data, status } = await getResponseData(response);

      expect(status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.code).toBe(ERROR_CODES.UNAUTHORIZED);
    });

    it('should use custom message', async () => {
      const response = unauthorized('Token scaduto');
      const { data } = await getResponseData(response);

      expect(data.error).toBe('Token scaduto');
    });
  });

  describe('forbidden', () => {
    it('should create 403 response', async () => {
      const response = forbidden();
      const { data, status } = await getResponseData(response);

      expect(status).toBe(403);
      expect(data.code).toBe(ERROR_CODES.FORBIDDEN);
    });
  });

  describe('notFound', () => {
    it('should create 404 response', async () => {
      const response = notFound('Schedule non trovata');
      const { data, status } = await getResponseData(response);

      expect(status).toBe(404);
      expect(data.error).toBe('Schedule non trovata');
      expect(data.code).toBe(ERROR_CODES.NOT_FOUND);
    });
  });

  describe('badRequest', () => {
    it('should create 400 response', async () => {
      const response = badRequest('Input non valido');
      const { data, status } = await getResponseData(response);

      expect(status).toBe(400);
      expect(data.error).toBe('Input non valido');
      expect(data.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });
  });

  describe('timeout', () => {
    it('should create 504 response', async () => {
      const response = timeout();
      const { data, status } = await getResponseData(response);

      expect(status).toBe(504);
      expect(data.code).toBe(ERROR_CODES.TIMEOUT);
    });
  });
});

describe('Device-Specific Errors', () => {
  describe('stoveOffline', () => {
    it('should create stove offline response', async () => {
      const response = stoveOffline();
      const { data, status } = await getResponseData(response);

      expect(status).toBe(504);
      expect(data.code).toBe(ERROR_CODES.STOVE_OFFLINE);
      expect(data.details).toBeDefined();
    });
  });

  describe('maintenanceRequired', () => {
    it('should create maintenance required response', async () => {
      const response = maintenanceRequired();
      const { data, status } = await getResponseData(response);

      expect(status).toBe(403);
      expect(data.code).toBe(ERROR_CODES.MAINTENANCE_REQUIRED);
    });
  });

  describe('netatmoReconnect', () => {
    it('should create netatmo reconnect response', async () => {
      const response = netatmoReconnect();
      const { data, status } = await getResponseData(response);

      expect(status).toBe(401);
      expect(data.code).toBe(ERROR_CODES.NETATMO_RECONNECT_REQUIRED);
      expect(data.reconnect).toBe(true);
    });
  });

  describe('hueNotConnected', () => {
    it('should create hue not connected response', async () => {
      const response = hueNotConnected();
      const { data, status } = await getResponseData(response);

      expect(status).toBe(401);
      expect(data.code).toBe(ERROR_CODES.HUE_NOT_CONNECTED);
      expect(data.reconnect).toBe(true);
    });
  });
});

describe('handleError', () => {
  beforeEach(() => {
    console.error = jest.fn();
  });

  it('should handle ApiError instances', async () => {
    const apiError = ApiError.notFound('Item not found');
    const response = handleError(apiError);
    const { data, status } = await getResponseData(response);

    expect(status).toBe(404);
    expect(data.error).toBe('Item not found');
    expect(data.code).toBe(ERROR_CODES.NOT_FOUND);
  });

  it('should map STOVE_TIMEOUT error', async () => {
    const err = new Error('STOVE_TIMEOUT');
    const response = handleError(err);
    const { data, status } = await getResponseData(response);

    expect(status).toBe(504);
    expect(data.code).toBe(ERROR_CODES.STOVE_TIMEOUT);
  });

  it('should map NETWORK_TIMEOUT error', async () => {
    const err = new Error('NETWORK_TIMEOUT');
    const response = handleError(err);
    const { data, status } = await getResponseData(response);

    expect(status).toBe(503);
    expect(data.code).toBe(ERROR_CODES.HUE_NOT_ON_LOCAL_NETWORK);
  });

  it('should map HUE_NOT_CONNECTED error', async () => {
    const err = new Error('HUE_NOT_CONNECTED: not configured');
    const response = handleError(err);
    const { data, status } = await getResponseData(response);

    expect(status).toBe(401);
    expect(data.code).toBe(ERROR_CODES.HUE_NOT_CONNECTED);
  });

  it('should handle generic errors', async () => {
    const err = new Error('Unknown error');
    const response = handleError(err);
    const { data, status } = await getResponseData(response);

    expect(status).toBe(500);
    expect(data.code).toBe(ERROR_CODES.INTERNAL_ERROR);
  });

  it('should log error with context', async () => {
    const err = new Error('Test error');
    handleError(err, 'TestContext');

    expect(console.error).toHaveBeenCalledWith('[TestContext]', 'Test error');
  });
});
