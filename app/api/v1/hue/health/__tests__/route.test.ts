/**
 * Tests for GET /api/v1/hue/health
 */

jest.mock('@/lib/hue/hueProxy');
jest.mock('@/lib/auth/session', () => ({
  authSession: { getSession: jest.fn() },
}));

import { GET } from '../route';
import * as hueProxy from '@/lib/hue/hueProxy';
import { authSession } from '@/lib/auth/session';
import { asNextRequest, mockAppSession, routeContext } from '@/__tests__/__utils__/routeHelpers';
import type { HueBridgeHealth } from '@/types/hueProxy';

const mockGetSession = jest.mocked(authSession.getSession);
const mockGetHealth = jest.mocked(hueProxy.getHealth);

describe('GET /api/v1/hue/health', () => {
  let mockRequest: Request;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = new Request('http://localhost:3000/api/v1/hue/health');
    mockGetSession.mockResolvedValue(mockAppSession());
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);

    const response = await GET(asNextRequest(mockRequest), routeContext());
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.code).toBe('UNAUTHORIZED');
  });

  it('should return 200 with bridge health data', async () => {
    const mockHealthData: HueBridgeHealth = {
      connected: true,
      firmware_version: '1.60.0',
      api_version: '1.60.0',
      light_count: 5,
      data_freshness: 'LIVE',
      last_poll_at: '2026-03-19T08:51:32Z',
      last_success_at: '2026-03-19T08:51:32Z',
    };
    mockGetHealth.mockResolvedValue(mockHealthData);

    const response = await GET(asNextRequest(mockRequest), routeContext());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockGetHealth).toHaveBeenCalled();
  });
});
