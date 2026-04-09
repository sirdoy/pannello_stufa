/**
 * Tests for POST /api/v1/netatmo/valves/[moduleId]/calibrate
 */

jest.mock('@/lib/netatmo/netatmoProxy');
jest.mock('@/lib/auth0', () => ({
  auth0: { getSession: jest.fn() },
}));

import { POST } from '../route';
import * as netatmoProxy from '@/lib/netatmo/netatmoProxy';
import { auth0 } from '@/lib/auth0';

const mockGetSession = jest.mocked(auth0.getSession);
const mockProxyCalibrateValve = jest.mocked(netatmoProxy.proxyCalibrateValve);
const mockSession = { user: { sub: 'auth0|123', email: 'test@test.com' } };

describe('POST /api/v1/netatmo/valves/[moduleId]/calibrate', () => {
  const mockContext = { params: Promise.resolve({ moduleId: '04:00:00:aa:bb:cc' }) };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession as any);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const request = new Request('http://localhost:3000/api/v1/netatmo/valves/04:00:00:aa:bb:cc/calibrate', { method: 'POST', body: JSON.stringify({}), headers: { 'Content-Type': 'application/json' } });
    const response = await POST(request as any, mockContext as any);
    const data = await response.json();
    expect(response.status).toBe(401);
    expect(data.code).toBe('UNAUTHORIZED');
  });

  it('should return 202 with suggested_poll_delay_s', async () => {
    mockProxyCalibrateValve.mockResolvedValue({ status: 'accepted', module_id: '04:00:00:aa:bb:cc', poll_endpoint: '/status' } as any);
    const request = new Request('http://localhost:3000/api/v1/netatmo/valves/04:00:00:aa:bb:cc/calibrate', { method: 'POST', body: JSON.stringify({}), headers: { 'Content-Type': 'application/json' } });
    const response = await POST(request as any, mockContext as any);
    const data = await response.json();
    expect(response.status).toBe(202);
    expect(data.success).toBe(true);
    expect(data.suggested_poll_delay_s).toBe(1);
    expect(mockProxyCalibrateValve).toHaveBeenCalledWith('04:00:00:aa:bb:cc');
  });
});
