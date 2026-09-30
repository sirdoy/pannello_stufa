/**
 * Tests for GET /api/v1/hue/groups
 */

jest.mock('@/lib/hue/hueProxy');
jest.mock('@/lib/auth/session', () => ({
  authSession: { getSession: jest.fn() },
}));

import { GET } from '../route';
import * as hueProxy from '@/lib/hue/hueProxy';
import { authSession } from '@/lib/auth/session';
import { asNextRequest, mockAppSession, routeContext } from '@/__tests__/__utils__/routeHelpers';
import type { HueGroup } from '@/types/hueProxy';

const mockGetSession = jest.mocked(authSession.getSession);
const mockGetGroups = jest.mocked(hueProxy.getGroups);

/** GET /groups wrapper as documented in docs/api/hue.md. */
interface HueGroupsPayload {
  groups: HueGroup[];
  count: number;
  is_stale: boolean;
  fetched_at: string | null;
}

describe('GET /api/v1/hue/groups', () => {
  const mockGroupsData: HueGroup[] = [
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
    mockGetSession.mockResolvedValue(mockAppSession());
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const req = new Request('http://localhost:3000/api/v1/hue/groups');

    const response = await GET(asNextRequest(req), routeContext());

    expect(response.status).toBe(401);
  });

  it('should return 200 with groups array', async () => {
    // HA proxy wraps the array as `{ groups, count, is_stale, fetched_at }`;
    // route spreads the wrapper so the response is `{ success, groups, count, … }`.
    const payload: HueGroupsPayload = {
      groups: mockGroupsData,
      count: mockGroupsData.length,
      is_stale: false,
      fetched_at: '2026-03-19T08:51:32.123456Z',
    };
    // getGroups() is typed HueGroup[] but returns this wrapper (docs/api/hue.md GET /groups).
    mockGetGroups.mockResolvedValue(payload as unknown as HueGroup[]);
    const req = new Request('http://localhost:3000/api/v1/hue/groups');

    const response = await GET(asNextRequest(req), routeContext());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.groups).toBeInstanceOf(Array);
    expect(data.groups).toHaveLength(2);
    expect(data.count).toBe(2);
    expect(mockGetGroups).toHaveBeenCalled();
  });
});
