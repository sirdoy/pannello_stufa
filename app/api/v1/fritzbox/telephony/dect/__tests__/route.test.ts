/**
 * Tests for Fritz!Box Telephony DECT Route
 * GET /api/v1/fritzbox/telephony/dect
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

describe('GET /api/v1/fritzbox/telephony/dect', () => {
  let mockRequest: Request;
  const mockSession = mockAppSession({ sub: 'auth0|123', email: 'test@test.com' });
  // Real backend shape (DectListResponse, backend/api/models.py) — not paginated.
  const mockData = {
    handsets: [
      {
        dect_id: 1,
        name: 'Wohnzimmer',
        phonebook_id: 0,
        model: null,
        registration_status: 'registered',
      },
    ],
    handset_count: 1,
    is_stale: false,
    fetched_at: '2026-02-17T13:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = new Request('http://localhost:3000/api/v1/fritzbox/telephony/dect');
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

  it('should return 200 with dect data', async () => {
    mockFritzboxClient.getDectHandsets.mockResolvedValue(mockData);

    const response = await GET(asNextRequest(mockRequest), routeContext());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true, dect: mockData });
    expect(data.dect.handsets[0].dect_id).toBe(1);
    expect(data.dect.handset_count).toBe(1);
  });

  it('should call fritzboxClient.getDectHandsets', async () => {
    mockFritzboxClient.getDectHandsets.mockResolvedValue(mockData);

    await GET(asNextRequest(mockRequest), routeContext());

    expect(mockFritzboxClient.getDectHandsets).toHaveBeenCalled();
  });

  it('should propagate errors', async () => {
    const error = new Error('DECT handsets query failed');
    mockFritzboxClient.getDectHandsets.mockRejectedValue(error);

    const response = await GET(asNextRequest(mockRequest), routeContext());
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('DECT handsets query failed');
  });
});
