/**
 * Tests for POST /api/v1/hue/groups/[groupId]/scenes/[sceneId]
 */

jest.mock('@/lib/hue/hueProxy');
jest.mock('@/lib/firebaseAdmin', () => ({ adminDbPush: jest.fn() }));
jest.mock('@/lib/auth/session', () => ({
  authSession: { getSession: jest.fn() },
}));

import { POST } from '../route';
import * as hueProxy from '@/lib/hue/hueProxy';
import { authSession } from '@/lib/auth/session';
import { asNextRequest, mockAppSession, routeContext } from '@/__tests__/__utils__/routeHelpers';
import type { HueCommandResponse } from '@/types/hueProxy';

const mockGetSession = jest.mocked(authSession.getSession);
const mockActivateScene = jest.mocked(hueProxy.activateScene);

describe('POST /api/v1/hue/groups/[groupId]/scenes/[sceneId]', () => {
  const mockProxyResponse: HueCommandResponse = {
    group_id: '1',
    name: 'Living Room',
    type: 'Room',
    group_class: 'Living room',
    lights: ['1', '2'],
    any_on: true,
    all_on: true,
    brightness: 254,
    color_temp: null,
    colormode: null,
    data_confirmed: true,
    suggested_poll_delay_s: 2,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockAppSession());
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const req = new Request('http://localhost:3000/api/v1/hue/groups/1/scenes/Ab1Cd2Ef3G', {
      method: 'POST',
    });

    const response = await POST(asNextRequest(req), routeContext({ groupId: '1', sceneId: 'Ab1Cd2Ef3G' }));

    expect(response.status).toBe(401);
  });

  it('should return 202 with proxy response body', async () => {
    mockActivateScene.mockResolvedValue(mockProxyResponse);
    const req = new Request('http://localhost:3000/api/v1/hue/groups/1/scenes/Ab1Cd2Ef3G', {
      method: 'POST',
    });

    const response = await POST(asNextRequest(req), routeContext({ groupId: '1', sceneId: 'Ab1Cd2Ef3G' }));
    const data = await response.json();

    expect(response.status).toBe(202);
    expect(data.group_id).toBe('1');
    expect(data.data_confirmed).toBe(true);
    expect(data.suggested_poll_delay_s).toBe(2);
    expect(mockActivateScene).toHaveBeenCalledWith('1', 'Ab1Cd2Ef3G');
  });
});
