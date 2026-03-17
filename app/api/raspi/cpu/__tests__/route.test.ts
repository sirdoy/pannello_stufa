/**
 * Tests for GET /api/raspi/cpu
 */

// Mock dependencies before imports
jest.mock('@/lib/raspi');
jest.mock('@/lib/auth0', () => ({
  auth0: { getSession: jest.fn() },
}));

import { GET } from '../route';
import { raspiClient } from '@/lib/raspi';
import { auth0 } from '@/lib/auth0';
import { ApiError, ERROR_CODES, HTTP_STATUS } from '@/lib/core/apiErrors';

const mockGetSession = jest.mocked(auth0.getSession);
const mockRaspiClient = jest.mocked(raspiClient);
const mockSession = { user: { sub: 'auth0|123', email: 'test@test.com' } };

describe('GET /api/raspi/cpu', () => {
  let mockRequest: Request;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = new Request('http://localhost:3000/api/raspi/cpu');
    mockGetSession.mockResolvedValue(mockSession as any);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);

    const response = await GET(mockRequest as any, {} as any);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.code).toBe('UNAUTHORIZED');
  });

  it('should return 200 with cpu data', async () => {
    const mockData = { cpu_percent: 42.1, data_freshness: 'LIVE' as const };
    mockRaspiClient.getCpu.mockResolvedValue(mockData);

    const response = await GET(mockRequest as any, {} as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.cpu_percent).toBe(42.1);
    expect(mockRaspiClient.getCpu).toHaveBeenCalled();
  });

  it('should propagate ApiError from raspiClient', async () => {
    mockRaspiClient.getCpu.mockRejectedValue(
      new ApiError(ERROR_CODES.SERVICE_UNAVAILABLE, 'HA proxy unavailable', HTTP_STATUS.SERVICE_UNAVAILABLE)
    );

    const response = await GET(mockRequest as any, {} as any);

    expect(response.status).toBe(503);
  });
});
