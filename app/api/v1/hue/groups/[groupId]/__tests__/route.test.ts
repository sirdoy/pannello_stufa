/**
 * Tests for GET /api/v1/hue/groups/[groupId]
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
const mockGetGroup = jest.mocked(hueProxy.getGroup);

describe('GET /api/v1/hue/groups/[groupId]', () => {
  const mockGroupData: HueGroup = {
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
    mockGetSession.mockResolvedValue(mockAppSession());
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const req = new Request('http://localhost:3000/api/v1/hue/groups/1');

    const response = await GET(asNextRequest(req), routeContext({ groupId: '1' }));

    expect(response.status).toBe(401);
  });

  it('should return 200 with single group data', async () => {
    mockGetGroup.mockResolvedValue(mockGroupData);
    const req = new Request('http://localhost:3000/api/v1/hue/groups/1');

    const response = await GET(asNextRequest(req), routeContext({ groupId: '1' }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockGetGroup).toHaveBeenCalledWith('1');
  });
});
