/**
 * Tests for apiErrors.js
 */

import {
  HTTP_STATUS,
  ERROR_CODES,
  ERROR_MESSAGES,
  ApiError,
  mapLegacyError,
} from '../apiErrors';

describe('HTTP_STATUS', () => {
  it('should have correct success codes', () => {
    expect(HTTP_STATUS.OK).toBe(200);
    expect(HTTP_STATUS.CREATED).toBe(201);
    expect(HTTP_STATUS.NO_CONTENT).toBe(204);
  });

  it('should have correct client error codes', () => {
    expect(HTTP_STATUS.BAD_REQUEST).toBe(400);
    expect(HTTP_STATUS.UNAUTHORIZED).toBe(401);
    expect(HTTP_STATUS.FORBIDDEN).toBe(403);
    expect(HTTP_STATUS.NOT_FOUND).toBe(404);
  });

  it('should have correct server error codes', () => {
    expect(HTTP_STATUS.INTERNAL_SERVER_ERROR).toBe(500);
    expect(HTTP_STATUS.GATEWAY_TIMEOUT).toBe(504);
  });
});

describe('ERROR_CODES', () => {
  it('should have auth error codes', () => {
    expect(ERROR_CODES.UNAUTHORIZED).toBe('UNAUTHORIZED');
    expect(ERROR_CODES.FORBIDDEN).toBe('FORBIDDEN');
  });

  it('should have device-specific error codes', () => {
    expect(ERROR_CODES.STOVE_OFFLINE).toBe('STOVE_OFFLINE');
    expect(ERROR_CODES.NETATMO_NOT_CONNECTED).toBe('NETATMO_NOT_CONNECTED');
    expect(ERROR_CODES.HUE_NOT_CONNECTED).toBe('HUE_NOT_CONNECTED');
  });
});

describe('ERROR_MESSAGES', () => {
  it('should have Italian messages for common errors', () => {
    expect(ERROR_MESSAGES[ERROR_CODES.UNAUTHORIZED]).toBe('Non autenticato');
    expect(ERROR_MESSAGES[ERROR_CODES.NOT_FOUND]).toBe('Risorsa non trovata');
  });
});

describe('ApiError', () => {
  describe('constructor', () => {
    it('should create error with all properties', () => {
      const error = new ApiError(
        ERROR_CODES.NOT_FOUND,
        'User not found',
        HTTP_STATUS.NOT_FOUND,
        { userId: '123' }
      );

      expect(error.code).toBe(ERROR_CODES.NOT_FOUND);
      expect(error.message).toBe('User not found');
      expect(error.status).toBe(404);
      expect(error.details).toEqual({ userId: '123' });
      expect(error.name).toBe('ApiError');
    });

    it('should use default message from ERROR_MESSAGES', () => {
      const error = new ApiError(ERROR_CODES.UNAUTHORIZED);

      expect(error.message).toBe('Non autenticato');
      expect(error.status).toBe(500); // default status
    });

    it('should inherit from Error', () => {
      const error = new ApiError(ERROR_CODES.INTERNAL_ERROR);

      expect(error instanceof Error).toBe(true);
      expect(error instanceof ApiError).toBe(true);
    });
  });

  describe('toJSON', () => {
    it('should serialize error without details', () => {
      const error = new ApiError(ERROR_CODES.NOT_FOUND, 'Not found', 404);
      const json = error.toJSON();

      expect(json).toEqual({
        error: 'Not found',
        code: ERROR_CODES.NOT_FOUND,
      });
    });

    it('should serialize error with details', () => {
      const error = new ApiError(
        ERROR_CODES.VALIDATION_ERROR,
        'Invalid input',
        400,
        { field: 'email' }
      );
      const json = error.toJSON();

      expect(json).toEqual({
        error: 'Invalid input',
        code: ERROR_CODES.VALIDATION_ERROR,
        details: { field: 'email' },
      });
    });
  });

  describe('static factory methods', () => {
    it('should create unauthorized error', () => {
      const error = ApiError.unauthorized();

      expect(error.code).toBe(ERROR_CODES.UNAUTHORIZED);
      expect(error.status).toBe(401);
    });

    it('should create forbidden error', () => {
      const error = ApiError.forbidden();

      expect(error.code).toBe(ERROR_CODES.FORBIDDEN);
      expect(error.status).toBe(403);
    });

    it('should create notFound error', () => {
      const error = ApiError.notFound('Schedule not found');

      expect(error.code).toBe(ERROR_CODES.NOT_FOUND);
      expect(error.status).toBe(404);
      expect(error.message).toBe('Schedule not found');
    });

    it('should create badRequest error', () => {
      const error = ApiError.badRequest('Invalid data', { field: 'name' });

      expect(error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(error.status).toBe(400);
      expect(error.details).toEqual({ field: 'name' });
    });

    it('should create timeout error', () => {
      const error = ApiError.timeout();

      expect(error.code).toBe(ERROR_CODES.TIMEOUT);
      expect(error.status).toBe(504);
    });

    it('should create stoveOffline error', () => {
      const error = ApiError.stoveOffline();

      expect(error.code).toBe(ERROR_CODES.STOVE_OFFLINE);
      expect(error.status).toBe(504);
    });

    it('should create maintenanceRequired error', () => {
      const error = ApiError.maintenanceRequired();

      expect(error.code).toBe(ERROR_CODES.MAINTENANCE_REQUIRED);
      expect(error.status).toBe(403);
    });

    it('should create netatmoReconnect error', () => {
      const error = ApiError.netatmoReconnect();

      expect(error.code).toBe(ERROR_CODES.NETATMO_RECONNECT_REQUIRED);
      expect(error.status).toBe(401);
      expect(error.details).toEqual({ reconnect: true });
    });

    it('should create hueNotConnected error', () => {
      const error = ApiError.hueNotConnected();

      expect(error.code).toBe(ERROR_CODES.HUE_NOT_CONNECTED);
      expect(error.status).toBe(401);
      expect(error.details).toEqual({ reconnect: true });
    });
  });
});

describe('mapLegacyError', () => {
  it('should map STOVE_TIMEOUT error', () => {
    const legacyError = new Error('STOVE_TIMEOUT');
    const apiError = mapLegacyError(legacyError);

    expect(apiError.code).toBe(ERROR_CODES.STOVE_TIMEOUT);
    expect(apiError.status).toBe(504);
  });

  it('should map HUE_NOT_CONNECTED error', () => {
    const legacyError = new Error('HUE_NOT_CONNECTED: Bridge not configured');
    const apiError = mapLegacyError(legacyError);

    expect(apiError.code).toBe(ERROR_CODES.HUE_NOT_CONNECTED);
  });

  it('should map NETWORK_TIMEOUT error', () => {
    const legacyError = new Error('NETWORK_TIMEOUT');
    const apiError = mapLegacyError(legacyError);

    expect(apiError.code).toBe(ERROR_CODES.HUE_NOT_ON_LOCAL_NETWORK);
  });

  it('should map LINK_BUTTON_NOT_PRESSED error', () => {
    const legacyError = new Error('LINK_BUTTON_NOT_PRESSED');
    const apiError = mapLegacyError(legacyError);

    expect(apiError.code).toBe(ERROR_CODES.HUE_LINK_BUTTON_NOT_PRESSED);
  });

  it('should map token expired errors', () => {
    const legacyError = new Error('token expired');
    const apiError = mapLegacyError(legacyError);

    expect(apiError.code).toBe(ERROR_CODES.NETATMO_RECONNECT_REQUIRED);
  });

  it('should map generic timeout errors', () => {
    const legacyError = new Error('Request timeout ETIMEDOUT');
    const apiError = mapLegacyError(legacyError);

    expect(apiError.code).toBe(ERROR_CODES.TIMEOUT);
  });

  it('should map unknown errors to internal error', () => {
    const legacyError = new Error('Something went wrong');
    const apiError = mapLegacyError(legacyError);

    expect(apiError.code).toBe(ERROR_CODES.INTERNAL_ERROR);
    expect(apiError.message).toBe('Something went wrong');
  });
});
