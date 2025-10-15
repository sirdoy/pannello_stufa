import {
  ERROR_SEVERITY,
  ERROR_CODES,
  getErrorInfo,
  isCriticalError,
  logError,
  getRecentErrors,
  getActiveErrors,
  resolveError,
  shouldNotify,
  sendErrorNotification,
} from '../errorMonitor';
import { ref, push, set, get, query, orderByChild, limitToLast } from 'firebase/database';

// Mock Firebase
jest.mock('firebase/database');
jest.mock('../firebase', () => ({
  database: {},
}));

describe('errorMonitor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Mock window.Notification for browser notification tests
    global.Notification = jest.fn();
    global.Notification.permission = 'default';
    global.Notification.requestPermission = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete global.Notification;
  });

  describe('ERROR_SEVERITY and ERROR_CODES constants', () => {
    test('ERROR_SEVERITY has all severity levels', () => {
      expect(ERROR_SEVERITY).toHaveProperty('INFO', 'info');
      expect(ERROR_SEVERITY).toHaveProperty('WARNING', 'warning');
      expect(ERROR_SEVERITY).toHaveProperty('ERROR', 'error');
      expect(ERROR_SEVERITY).toHaveProperty('CRITICAL', 'critical');
    });

    test('ERROR_CODES has code 0 (no error)', () => {
      expect(ERROR_CODES).toHaveProperty('0');
      expect(ERROR_CODES[0]).toHaveProperty('description', 'Nessun errore');
      expect(ERROR_CODES[0]).toHaveProperty('severity', ERROR_SEVERITY.INFO);
    });
  });

  describe('getErrorInfo', () => {
    test('returns info for error code 0 (no error)', () => {
      // ACT
      const result = getErrorInfo(0);

      // ASSERT
      expect(result).toHaveProperty('description', 'Nessun errore');
      expect(result).toHaveProperty('severity', ERROR_SEVERITY.INFO);
    });

    test('returns generic error for unknown error code', () => {
      // ACT
      const result = getErrorInfo(99);

      // ASSERT
      expect(result).toHaveProperty('description', 'Errore sconosciuto (codice 99)');
      expect(result).toHaveProperty('severity', ERROR_SEVERITY.ERROR);
    });

    test('returns known error code info when code is defined', () => {
      // ARRANGE: Temporarily add a known error
      ERROR_CODES[5] = {
        description: 'Test Error',
        severity: ERROR_SEVERITY.CRITICAL,
      };

      // ACT
      const result = getErrorInfo(5);

      // ASSERT
      expect(result).toHaveProperty('description', 'Test Error');
      expect(result).toHaveProperty('severity', ERROR_SEVERITY.CRITICAL);

      // CLEANUP
      delete ERROR_CODES[5];
    });
  });

  describe('isCriticalError', () => {
    test('returns false for error code 0 (no error)', () => {
      // ACT
      const result = isCriticalError(0);

      // ASSERT
      expect(result).toBe(false);
    });

    test('returns false for unknown error codes (default to ERROR severity)', () => {
      // ACT
      const result = isCriticalError(99);

      // ASSERT
      expect(result).toBe(false);
    });

    test('returns true for critical error codes', () => {
      // ARRANGE: Add critical error temporarily
      ERROR_CODES[10] = {
        description: 'Critical Test',
        severity: ERROR_SEVERITY.CRITICAL,
      };

      // ACT
      const result = isCriticalError(10);

      // ASSERT
      expect(result).toBe(true);

      // CLEANUP
      delete ERROR_CODES[10];
    });
  });

  describe('logError', () => {
    test('logs error to Firebase with correct structure', async () => {
      // ARRANGE
      const errorCode = 5;
      const errorDescription = 'Test error occurred';
      const additionalData = { stoveId: '123' };
      ref.mockReturnValue('mock-ref');
      push.mockResolvedValue({ key: 'error-id-123' });
      const mockTimestamp = 1697400000000;
      jest.spyOn(Date, 'now').mockReturnValue(mockTimestamp);

      // ACT
      const result = await logError(errorCode, errorDescription, additionalData);

      // ASSERT
      expect(result).toHaveProperty('errorCode', 5);
      expect(result).toHaveProperty('errorDescription', 'Test error occurred');
      expect(result).toHaveProperty('severity', ERROR_SEVERITY.ERROR);
      expect(result).toHaveProperty('timestamp', mockTimestamp);
      expect(result).toHaveProperty('resolved', false);
      expect(result).toHaveProperty('stoveId', '123');
      expect(ref).toHaveBeenCalledWith({}, 'errors');
      expect(push).toHaveBeenCalled();
    });

    test('logs error code 0 with INFO severity', async () => {
      // ARRANGE
      ref.mockReturnValue('mock-ref');
      push.mockResolvedValue({});

      // ACT
      const result = await logError(0, 'No error');

      // ASSERT
      expect(result).toHaveProperty('severity', ERROR_SEVERITY.INFO);
    });

    test('returns null on Firebase error', async () => {
      // ARRANGE
      ref.mockReturnValue('mock-ref');
      push.mockRejectedValue(new Error('Firebase error'));

      // ACT
      const result = await logError(5, 'Test');

      // ASSERT
      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        'Failed to log error to Firebase:',
        expect.any(Error)
      );
    });

    test('logs error without additional data', async () => {
      // ARRANGE
      ref.mockReturnValue('mock-ref');
      push.mockResolvedValue({});

      // ACT
      const result = await logError(5, 'Test error');

      // ASSERT
      expect(result).toHaveProperty('errorCode', 5);
      expect(result).toHaveProperty('errorDescription', 'Test error');
      expect(result).not.toHaveProperty('stoveId'); // No additional data
    });
  });

  describe('getRecentErrors', () => {
    test('returns recent errors sorted newest first', async () => {
      // ARRANGE
      const mockSnapshot = {
        exists: () => true,
        forEach: (callback) => {
          callback({ key: 'error1', val: () => ({ errorCode: 1, timestamp: 1000 }) });
          callback({ key: 'error2', val: () => ({ errorCode: 2, timestamp: 2000 }) });
          callback({ key: 'error3', val: () => ({ errorCode: 3, timestamp: 3000 }) });
        },
      };
      ref.mockReturnValue('mock-ref');
      query.mockReturnValue('mock-query');
      get.mockResolvedValue(mockSnapshot);

      // ACT
      const result = await getRecentErrors(50);

      // ASSERT
      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('error3'); // Newest first (reversed)
      expect(result[1].id).toBe('error2');
      expect(result[2].id).toBe('error1');
      expect(query).toHaveBeenCalledWith('mock-ref', orderByChild('timestamp'), limitToLast(50));
    });

    test('returns empty array when no errors exist', async () => {
      // ARRANGE
      const mockSnapshot = {
        exists: () => false,
      };
      ref.mockReturnValue('mock-ref');
      query.mockReturnValue('mock-query');
      get.mockResolvedValue(mockSnapshot);

      // ACT
      const result = await getRecentErrors();

      // ASSERT
      expect(result).toEqual([]);
    });

    test('uses default limit of 50 when not specified', async () => {
      // ARRANGE
      const mockSnapshot = {
        exists: () => false,
      };
      ref.mockReturnValue('mock-ref');
      query.mockReturnValue('mock-query');
      get.mockResolvedValue(mockSnapshot);

      // ACT
      await getRecentErrors();

      // ASSERT
      expect(limitToLast).toHaveBeenCalledWith(50);
    });

    test('returns empty array on Firebase error', async () => {
      // ARRANGE
      ref.mockReturnValue('mock-ref');
      query.mockReturnValue('mock-query');
      get.mockRejectedValue(new Error('Firebase error'));

      // ACT
      const result = await getRecentErrors();

      // ASSERT
      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith(
        'Failed to fetch recent errors:',
        expect.any(Error)
      );
    });
  });

  describe('getActiveErrors', () => {
    test('returns only unresolved errors', async () => {
      // ARRANGE
      const mockSnapshot = {
        exists: () => true,
        forEach: (callback) => {
          callback({ key: 'error1', val: () => ({ errorCode: 1, resolved: false }) });
          callback({ key: 'error2', val: () => ({ errorCode: 2, resolved: true }) });
          callback({ key: 'error3', val: () => ({ errorCode: 3, resolved: false }) });
        },
      };
      ref.mockReturnValue('mock-ref');
      query.mockReturnValue('mock-query');
      get.mockResolvedValue(mockSnapshot);

      // ACT
      const result = await getActiveErrors();

      // ASSERT
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('error3');
      expect(result[1].id).toBe('error1');
    });

    test('returns empty array when all errors are resolved', async () => {
      // ARRANGE
      const mockSnapshot = {
        exists: () => true,
        forEach: (callback) => {
          callback({ key: 'error1', val: () => ({ errorCode: 1, resolved: true }) });
          callback({ key: 'error2', val: () => ({ errorCode: 2, resolved: true }) });
        },
      };
      ref.mockReturnValue('mock-ref');
      query.mockReturnValue('mock-query');
      get.mockResolvedValue(mockSnapshot);

      // ACT
      const result = await getActiveErrors();

      // ASSERT
      expect(result).toEqual([]);
    });

    test('returns empty array on Firebase error', async () => {
      // ARRANGE
      ref.mockReturnValue('mock-ref');
      query.mockReturnValue('mock-query');
      get.mockRejectedValue(new Error('Firebase error'));

      // ACT
      const result = await getActiveErrors();

      // ASSERT
      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('resolveError', () => {
    test('marks error as resolved with timestamp', async () => {
      // ARRANGE
      const errorId = 'error-123';
      const existingError = {
        errorCode: 5,
        errorDescription: 'Test error',
        resolved: false,
      };
      const mockSnapshot = {
        val: () => existingError,
      };
      ref.mockReturnValue('mock-ref');
      get.mockResolvedValue(mockSnapshot);
      set.mockResolvedValue();
      const mockTimestamp = 1697400000000;
      jest.spyOn(Date, 'now').mockReturnValue(mockTimestamp);

      // ACT
      const result = await resolveError(errorId);

      // ASSERT
      expect(result).toBe(true);
      expect(ref).toHaveBeenCalledWith({}, `errors/${errorId}`);
      expect(set).toHaveBeenCalledWith('mock-ref', {
        ...existingError,
        resolved: true,
        resolvedAt: mockTimestamp,
      });
    });

    test('returns false on Firebase error', async () => {
      // ARRANGE
      const errorId = 'error-123';
      ref.mockReturnValue('mock-ref');
      get.mockRejectedValue(new Error('Firebase error'));

      // ACT
      const result = await resolveError(errorId);

      // ASSERT
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        'Failed to resolve error:',
        expect.any(Error)
      );
    });
  });

  describe('shouldNotify', () => {
    test('returns false when error code has not changed', () => {
      // ACT
      const result = shouldNotify(5, 5);

      // ASSERT
      expect(result).toBe(false);
    });

    test('returns false when error is cleared (code 0)', () => {
      // ACT
      const result = shouldNotify(0, 5);

      // ASSERT
      expect(result).toBe(false);
    });

    test('returns true when error code changes to non-zero', () => {
      // ACT
      const result = shouldNotify(5, 0);

      // ASSERT
      expect(result).toBe(true);
    });

    test('returns true when error code changes from one error to another', () => {
      // ACT
      const result = shouldNotify(10, 5);

      // ASSERT
      expect(result).toBe(true);
    });

    test('returns true when previousErrorCode is undefined', () => {
      // ACT
      const result = shouldNotify(5, undefined);

      // ASSERT
      expect(result).toBe(true);
    });
  });

  describe('sendErrorNotification', () => {
    test('returns false when Notification API not supported', async () => {
      // ARRANGE
      delete global.Notification;

      // ACT
      const result = await sendErrorNotification(5, 'Test error');

      // ASSERT
      expect(result).toBe(false);
    });

    test('requests permission when permission is default', async () => {
      // ARRANGE
      global.Notification.permission = 'default';
      global.Notification.requestPermission.mockResolvedValue('granted');
      global.Notification.mockImplementation(() => {});

      // ACT
      const result = await sendErrorNotification(5, 'Test error');

      // ASSERT
      expect(global.Notification.requestPermission).toHaveBeenCalled();
    });

    test('sends notification when permission is granted', async () => {
      // ARRANGE
      global.Notification.permission = 'granted';
      global.Notification.mockImplementation(() => {});

      // ACT
      const result = await sendErrorNotification(5, 'Test error');

      // ASSERT
      expect(result).toBe(true);
      expect(global.Notification).toHaveBeenCalledWith(
        expect.stringContaining('Allarme Stufa'),
        expect.objectContaining({
          body: 'Test error',
          icon: '/icon-192x192.png',
          tag: 'stove-error-5',
        })
      );
    });

    test('returns false when permission is denied', async () => {
      // ARRANGE
      global.Notification.permission = 'denied';

      // ACT
      const result = await sendErrorNotification(5, 'Test error');

      // ASSERT
      expect(result).toBe(false);
      expect(global.Notification).not.toHaveBeenCalled();
    });

    test('uses critical icon for critical errors', async () => {
      // ARRANGE
      ERROR_CODES[99] = {
        description: 'Critical error',
        severity: ERROR_SEVERITY.CRITICAL,
      };
      global.Notification.permission = 'granted';
      global.Notification.mockImplementation(() => {});

      // ACT
      await sendErrorNotification(99, 'Critical error');

      // ASSERT
      expect(global.Notification).toHaveBeenCalledWith(
        expect.stringContaining('🚨'),
        expect.objectContaining({
          requireInteraction: true,
        })
      );

      // CLEANUP
      delete ERROR_CODES[99];
    });

    test('uses default error message when description not provided', async () => {
      // ARRANGE
      global.Notification.permission = 'granted';
      global.Notification.mockImplementation(() => {});

      // ACT
      await sendErrorNotification(5);

      // ASSERT
      expect(global.Notification).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          body: 'Errore 5 rilevato',
        })
      );
    });
  });
});
