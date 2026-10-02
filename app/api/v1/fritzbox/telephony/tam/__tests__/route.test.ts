/**
 * Tests for Fritz!Box Telephony TAM Route
 * GET /api/v1/fritzbox/telephony/tam
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

describe('GET /api/v1/fritzbox/telephony/tam', () => {
  let mockRequest: Request;
  const mockSession = mockAppSession({ sub: 'auth0|123', email: 'test@test.com' });
  // Real backend shape (TamStatusResponse, backend/api/models.py).
  const mockData = {
    tam: {
      total_messages: 5,
      new_messages: 2,
      tam_enabled: true,
      tam_name: 'Anrufbeantworter',
    },
    is_stale: false,
    fetched_at: '2026-04-09T10:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = new Request('http://localhost:3000/api/v1/fritzbox/telephony/tam');
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

  it('should return 200 with tam data', async () => {
    mockFritzboxClient.getTamStatus.mockResolvedValue(mockData);

    const response = await GET(asNextRequest(mockRequest), routeContext());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true, tam: mockData });
    expect(data.tam.tam.tam_enabled).toBe(true);
  });

  it('should call fritzboxClient.getTamStatus', async () => {
    mockFritzboxClient.getTamStatus.mockResolvedValue(mockData);

    await GET(asNextRequest(mockRequest), routeContext());

    expect(mockFritzboxClient.getTamStatus).toHaveBeenCalled();
  });

  it('should propagate errors', async () => {
    const error = new Error('TAM status query failed');
    mockFritzboxClient.getTamStatus.mockRejectedValue(error);

    const response = await GET(asNextRequest(mockRequest), routeContext());
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('TAM status query failed');
  });
});
