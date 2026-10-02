/**
 * Tests for Fritz!Box Telephony Calls Route
 * GET /api/v1/fritzbox/telephony/calls
 */

// Mock dependencies before imports
jest.mock('@/lib/fritzbox');
jest.mock('@/lib/auth/session', () => ({
  authSession: {
    getSession: jest.fn(),
  },
}));

import { GET } from '../route';
import { fritzboxClient } from '@/lib/fritzbox';
import { authSession } from '@/lib/auth/session';
import { asNextRequest, mockAppSession, routeContext } from '@/__tests__/__utils__/routeHelpers';

const mockGetSession = jest.mocked(authSession.getSession);
const mockFritzboxClient = jest.mocked(fritzboxClient);

describe('GET /api/v1/fritzbox/telephony/calls', () => {
  let mockRequest: Request;
  const mockSession = mockAppSession({ sub: 'auth0|123', email: 'test@test.com' });
  // Real backend shape (PaginatedResponse[CallRecordModel], backend/api/models.py).
  const mockData = {
    items: [
      {
        call_type: 'received',
        call_type_code: 1,
        name: 'Test Caller',
        caller: '+39123456789',
        called: '030987654',
        caller_number: '+39123456789',
        called_number: '030987654',
        date: '2026-02-17T10:30:00',
        duration_seconds: 120,
        device: 'Wohnzimmer',
        port: 'FON1',
      },
    ],
    total_count: 1,
    limit: 20,
    offset: 0,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = new Request('http://localhost:3000/api/v1/fritzbox/telephony/calls');
    // Default: authenticated user
    mockGetSession.mockResolvedValue(mockSession);
    // Mock console methods to suppress output
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);

    const response = await GET(asNextRequest(mockRequest), routeContext());
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.code).toBe('UNAUTHORIZED');
  });

  it('should return 200 with calls data', async () => {
    mockFritzboxClient.getCallHistory.mockResolvedValue(mockData);

    const response = await GET(asNextRequest(mockRequest), routeContext());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true, calls: mockData });
  });

  it('should forward no params when none are given', async () => {
    mockFritzboxClient.getCallHistory.mockResolvedValue(mockData);

    await GET(asNextRequest(mockRequest), routeContext());

    expect(mockFritzboxClient.getCallHistory).toHaveBeenCalled();
    const params = mockFritzboxClient.getCallHistory.mock.calls[0]?.[0] as URLSearchParams;
    expect(params.toString()).toBe('');
  });

  it('should forward call_type, limit and offset', async () => {
    mockFritzboxClient.getCallHistory.mockResolvedValue(mockData);
    const req = new Request(
      'http://localhost:3000/api/v1/fritzbox/telephony/calls?call_type=missed&limit=50&offset=100'
    );

    await GET(asNextRequest(req), routeContext());

    const params = mockFritzboxClient.getCallHistory.mock.calls[0]?.[0] as URLSearchParams;
    expect(params.get('call_type')).toBe('missed');
    expect(params.get('limit')).toBe('50');
    expect(params.get('offset')).toBe('100');
  });

  it('should fetch each page from the backend (no response cache)', async () => {
    mockFritzboxClient.getCallHistory.mockResolvedValue(mockData);

    await GET(asNextRequest(new Request('http://localhost:3000/x?limit=50&offset=0')), routeContext());
    await GET(asNextRequest(new Request('http://localhost:3000/x?limit=50&offset=50')), routeContext());

    const offsets = mockFritzboxClient.getCallHistory.mock.calls.map(
      (c) => (c[0] as URLSearchParams).get('offset')
    );
    expect(offsets).toEqual(['0', '50']);
  });

  it('should drop malformed query params', async () => {
    mockFritzboxClient.getCallHistory.mockResolvedValue(mockData);
    const req = new Request(
      'http://localhost:3000/x?call_type=../evil&limit=abc&offset=-1'
    );

    await GET(asNextRequest(req), routeContext());

    const params = mockFritzboxClient.getCallHistory.mock.calls[0]?.[0] as URLSearchParams;
    expect(params.toString()).toBe('');
  });

  it('should propagate errors', async () => {
    const error = new Error('Call history query failed');
    mockFritzboxClient.getCallHistory.mockRejectedValue(error);

    const response = await GET(asNextRequest(mockRequest), routeContext());
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Call history query failed');
  });
});
