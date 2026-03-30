/**
 * Tests for GET /api/tuya/plugs/[device_id]/history
 */

// Mock dependencies before imports
jest.mock('@/lib/tuya/tuyaProxy');
jest.mock('@/lib/auth0', () => ({
  auth0: { getSession: jest.fn() },
}));

import { GET } from '../route';
import { getHistory } from '@/lib/tuya/tuyaProxy';
import { auth0 } from '@/lib/auth0';
import { ApiError, ERROR_CODES, HTTP_STATUS } from '@/lib/core/apiErrors';

const mockGetSession = jest.mocked(auth0.getSession);
const mockGetHistory = jest.mocked(getHistory);
const mockSession = { user: { sub: 'auth0|123', email: 'test@test.com' } };

const mockHistory = {
  device_id: 'bf123',
  granularity: 'raw' as const,
  period: { from: 1742987790, to: 1743074190 },
  page: 1,
  page_size: 100,
  total: 10,
  items: [],
};

/** Helper to create a mock GET request with optional query params */
function createGetRequest(queryString?: string): any {
  const searchParams = new URLSearchParams(queryString ?? '');
  return {
    nextUrl: { searchParams },
  };
}

describe('GET /api/tuya/plugs/[device_id]/history', () => {
  let mockContext: { params: Promise<{ device_id: string }> };

  beforeEach(() => {
    jest.clearAllMocks();
    mockContext = { params: Promise.resolve({ device_id: 'bf123' }) };
    mockGetSession.mockResolvedValue(mockSession as any);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);

    const response = await GET(createGetRequest(), mockContext as any);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.code).toBe('UNAUTHORIZED');
  });

  it('should return 200 with history response and call getHistory with device_id', async () => {
    mockGetHistory.mockResolvedValue(mockHistory);

    const response = await GET(createGetRequest(), mockContext as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockGetHistory).toHaveBeenCalledWith('bf123', expect.any(Object));
  });

  it('should forward query params period, page, page_size and omit missing as undefined', async () => {
    mockGetHistory.mockResolvedValue(mockHistory);

    await GET(createGetRequest('period=7d&page=2&page_size=50'), mockContext as any);

    expect(mockGetHistory).toHaveBeenCalledWith('bf123', {
      period: '7d',
      from: undefined,
      to: undefined,
      page: '2',
      page_size: '50',
    });
  });

  it('should pass all params as undefined when no query string provided', async () => {
    mockGetHistory.mockResolvedValue(mockHistory);

    await GET(createGetRequest(), mockContext as any);

    expect(mockGetHistory).toHaveBeenCalledWith('bf123', {
      period: undefined,
      from: undefined,
      to: undefined,
      page: undefined,
      page_size: undefined,
    });
  });

  it('should forward all 5 query params when all provided', async () => {
    mockGetHistory.mockResolvedValue(mockHistory);

    await GET(
      createGetRequest('period=24h&from=1742987790&to=1743074190&page=1&page_size=100'),
      mockContext as any
    );

    expect(mockGetHistory).toHaveBeenCalledWith('bf123', {
      period: '24h',
      from: '1742987790',
      to: '1743074190',
      page: '1',
      page_size: '100',
    });
  });

  it('should propagate ApiError on proxy failure', async () => {
    mockGetHistory.mockRejectedValue(
      new ApiError(
        ERROR_CODES.SERVICE_UNAVAILABLE,
        'Tuya proxy unavailable',
        HTTP_STATUS.SERVICE_UNAVAILABLE
      )
    );

    const response = await GET(createGetRequest(), mockContext as any);

    expect(response.status).toBe(503);
  });
});
