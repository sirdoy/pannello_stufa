/**
 * Tests for GET /api/v1/netatmo/valves/calibration-status (ROADMAP V9).
 */

jest.mock('@/lib/netatmo/netatmoProxy');
jest.mock('@/lib/auth/session', () => ({
  authSession: { getSession: jest.fn() },
}));

import { GET } from '../route';
import * as netatmoProxy from '@/lib/netatmo/netatmoProxy';
import { authSession } from '@/lib/auth/session';

const mockGetSession = jest.mocked(authSession.getSession);
const mockStatus = jest.mocked(netatmoProxy.getProxyValveCalibrationStatus);
const url = 'http://localhost:3000/api/v1/netatmo/valves/calibration-status';

describe('GET /api/v1/netatmo/valves/calibration-status', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue({ user: { sub: 'user:1', email: 'a@b.c' } } as never);
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('returns 401 without a session', async () => {
    mockGetSession.mockResolvedValue(null);
    const response = await GET(new Request(url) as never, {} as never);
    expect(response.status).toBe(401);
    expect(mockStatus).not.toHaveBeenCalled();
  });

  it('forwards the backend calibration status', async () => {
    const status = {
      last_run_at: 1790673300,
      last_trigger: 'auto',
      last_ok: true,
      last_results: [],
      last_error: null,
      auto_interval_s: 43200,
      next_auto_at: 1790716500,
    };
    mockStatus.mockResolvedValue(status as never);
    const response = await GET(new Request(url) as never, {} as never);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true, ...status });
  });
});
