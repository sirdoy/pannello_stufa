/**
 * Tests for GET /api/v1/hue/groups/[groupId]
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

describe('GET /api/v1/hue/groups/[groupId]', () => {
  const mockGroupData = {
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

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession as any);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const req = new Request('http://localhost:3000/api/v1/hue/groups/1');

    const response = await GET(req as any, {
      params: Promise.resolve({ groupId: '1' }),
    } as any);

    expect(response.status).toBe(401);
  });

  it('should return 200 with single group data', async () => {
    mockGetGroup.mockResolvedValue(mockGroupData as any);
    const req = new Request('http://localhost:3000/api/v1/hue/groups/1');

    const response = await GET(req as any, {
      params: Promise.resolve({ groupId: '1' }),
    } as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockGetGroup).toHaveBeenCalledWith('1');
  });
});
