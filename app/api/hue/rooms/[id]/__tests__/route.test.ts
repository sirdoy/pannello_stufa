/**
 * Tests for GET /api/hue/rooms/[id]
 * Only the GET handler is tested here; PUT is legacy (Phase 107 concern).
 */

jest.mock('@/lib/hue/hueProxy');
jest.mock('@/lib/auth0', () => ({
  auth0: { getSession: jest.fn() },
}));

import { GET } from '../route';
import * as hueProxy from '@/lib/hue/hueProxy';
import { auth0 } from '@/lib/auth0';

const mockGetSession = jest.mocked(auth0.getSession);
const mockGetGroup = jest.mocked(hueProxy.getGroup);
const mockSession = { user: { sub: 'auth0|123', email: 'test@test.com' } };

describe('GET /api/hue/rooms/[id]', () => {
  let mockRequest: Request;
  let mockContext: { params: Promise<{ id: string }> };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = new Request('http://localhost:3000/api/hue/rooms/1');
    mockContext = { params: Promise.resolve({ id: '1' }) };
    mockGetSession.mockResolvedValue(mockSession as any);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);

    const response = await GET(mockRequest as any, mockContext as any);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.code).toBe('UNAUTHORIZED');
  });

  it('should return 200 with single group data', async () => {
    const mockData = {
      group_id: '1',
      name: 'Living Room',
      type: 'Room',
      group_class: 'Living room',
      lights: ['1', '2', '3'],
      any_on: true,
      all_on: false,
      brightness: 180,
      color_temp: 370,
      colormode: 'ct',
    };
    mockGetGroup.mockResolvedValue(mockData);

    const response = await GET(mockRequest as any, mockContext as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockGetGroup).toHaveBeenCalledWith('1');
  });
});
