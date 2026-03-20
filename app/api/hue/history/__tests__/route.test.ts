/**
 * Tests for GET /api/hue/history
 */

jest.mock('@/lib/hue/hueProxy');
jest.mock('@/lib/auth0', () => ({
  auth0: { getSession: jest.fn() },
}));

import { GET } from '../route';
import * as hueProxy from '@/lib/hue/hueProxy';
import { auth0 } from '@/lib/auth0';

const mockGetSession = jest.mocked(auth0.getSession);
const mockGetHistory = jest.mocked(hueProxy.getHistory);
const mockSession = { user: { sub: 'auth0|123', email: 'test@test.com' } };

const mockHistoryResponse = {
  items: [],
  total: 0,
  page: 1,
  page_size: 100,
  granularity: 'raw' as const,
  from: null,
  to: null,
};

describe('GET /api/hue/history', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession as any);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const mockRequest = { nextUrl: { searchParams: new URLSearchParams() } } as any;

    const response = await GET(mockRequest, {} as any);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.code).toBe('UNAUTHORIZED');
  });

  it('should return 200 with history when no searchParams', async () => {
    mockGetHistory.mockResolvedValue(mockHistoryResponse);
    const mockRequest = { nextUrl: { searchParams: new URLSearchParams() } } as any;

    const response = await GET(mockRequest, {} as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockGetHistory).toHaveBeenCalledWith(undefined);
  });

  it('should forward query params to getHistory when searchParams present', async () => {
    mockGetHistory.mockResolvedValue(mockHistoryResponse);
    const searchParams = new URLSearchParams('from=1700000000&to=1700086400');
    const mockRequest = { nextUrl: { searchParams } } as any;

    const response = await GET(mockRequest, {} as any);

    expect(response.status).toBe(200);
    expect(mockGetHistory).toHaveBeenCalledWith(
      expect.any(URLSearchParams)
    );
    const calledWith = mockGetHistory.mock.calls[0]?.[0] as URLSearchParams;
    expect(calledWith?.get('from')).toBe('1700000000');
    expect(calledWith?.get('to')).toBe('1700086400');
  });
});
