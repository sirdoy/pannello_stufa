/**
 * Unit tests for netatmoCalibrationService
 *
 * Tests the simplified proxy-based calibration flow:
 * - Success returns { calibrated: true, timestamp }
 * - Proxy errors return { calibrated: false, reason: 'proxy_error' } + logs
 * - 401 errors return { calibrated: false, reason: 'auth_error' }
 */

import { calibrateValvesServer } from '@/lib/netatmoCalibrationService';
import { ApiError, ERROR_CODES, HTTP_STATUS } from '@/lib/core/apiErrors';

// Mock the proxy module
jest.mock('@/lib/netatmoProxy', () => ({
  proxyCalibrateValves: jest.fn(),
}));

// Mock firebaseAdmin
jest.mock('@/lib/firebaseAdmin', () => ({
  adminDbPush: jest.fn().mockResolvedValue(undefined),
}));

import { proxyCalibrateValves } from '@/lib/netatmoProxy';
import { adminDbPush } from '@/lib/firebaseAdmin';

const mockProxyCalibrateValves = proxyCalibrateValves as jest.MockedFunction<typeof proxyCalibrateValves>;
const mockAdminDbPush = adminDbPush as jest.MockedFunction<typeof adminDbPush>;

describe('calibrateValvesServer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns calibrated:true with timestamp on success and does NOT call adminDbPush', async () => {
    const beforeTime = Date.now();
    mockProxyCalibrateValves.mockResolvedValueOnce({
      status: 'accepted',
      results: [{ module_id: 'mod-1', status: 'accepted' }],
      poll_endpoint: '/valves/calibrate/status/abc123',
    });

    const result = await calibrateValvesServer();

    expect(result.calibrated).toBe(true);
    if (result.calibrated) {
      expect(result.timestamp).toBeGreaterThanOrEqual(beforeTime);
    }
    expect(mockAdminDbPush).not.toHaveBeenCalled();
  });

  it('returns calibrated:false with reason proxy_error and calls adminDbPush on proxy error', async () => {
    const proxyError = new Error('Connection refused');
    mockProxyCalibrateValves.mockRejectedValueOnce(proxyError);

    const result = await calibrateValvesServer();

    expect(result.calibrated).toBe(false);
    if (!result.calibrated) {
      expect(result.reason).toBe('proxy_error');
      expect(result.error).toBe('Connection refused');
    }
    expect(mockAdminDbPush).toHaveBeenCalledWith(
      'netatmo/calibrations/failures',
      expect.objectContaining({
        status: 'error',
        error: 'Connection refused',
        triggered_by: 'cron',
      })
    );
  });

  it('returns calibrated:false with reason auth_error when proxy returns 401', async () => {
    const authError = new ApiError(
      ERROR_CODES.UNAUTHORIZED,
      'Invalid API key',
      HTTP_STATUS.UNAUTHORIZED
    );
    mockProxyCalibrateValves.mockRejectedValueOnce(authError);

    const result = await calibrateValvesServer();

    expect(result.calibrated).toBe(false);
    if (!result.calibrated) {
      expect(result.reason).toBe('auth_error');
      expect(result.error).toBe('Invalid API key');
    }
    // Still logs the failure
    expect(mockAdminDbPush).toHaveBeenCalledWith(
      'netatmo/calibrations/failures',
      expect.objectContaining({
        status: 'error',
        triggered_by: 'cron',
      })
    );
  });
});
