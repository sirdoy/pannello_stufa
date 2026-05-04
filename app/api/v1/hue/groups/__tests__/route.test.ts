/**
 * Tests for GET /api/v1/hue/groups
 */

jest.mock('@/lib/hue/hueProxy');
jest.mock('@/lib/auth0', () => ({
  auth0: { getSession: jest.fn() },
}));

import { GET } from '../route';
import * as hueProxy from '@/lib/hue/hueProxy';
import { auth0 } from '@/lib/auth0';

const mockGetSession = jest.mocked(auth0.getSession);
const mockGetGroups = jest.mocked(hueProxy.getGroups);
const mockSession = { user: { sub: 'auth0|123', email: 'test@test.com' } };

describe('GET /api/v1/hue/groups', () => {
  const mockGroupsData = [
    {
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
    },
    {
      group_id: '2',
      name: 'Kitchen',
      type: 'Room',
      group_class: 'Kitchen',
      lights: ['4', '5'],
      any_on: false,
      all_on: false,
      brightness: 0,
      color_temp: null,
      colormode: 'ct',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession as any);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const req = new Request('http://localhost:3000/api/v1/hue/groups');

    const response = await GET(req as any, {} as any);

    expect(response.status).toBe(401);
  });

  it('should return 200 with groups array', async () => {
    // HA proxy wraps the array as `{ groups, count, is_stale, fetched_at }`;
    // route spreads the wrapper so the response is `{ success, groups, count, … }`.
    mockGetGroups.mockResolvedValue({
      groups: mockGroupsData,
      count: mockGroupsData.length,
      is_stale: false,
      fetched_at: 0,
    } as any);
    const req = new Request('http://localhost:3000/api/v1/hue/groups');

    const response = await GET(req as any, {} as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.groups).toBeInstanceOf(Array);
    expect(data.groups).toHaveLength(2);
    expect(data.count).toBe(2);
    expect(mockGetGroups).toHaveBeenCalled();
  });
});
