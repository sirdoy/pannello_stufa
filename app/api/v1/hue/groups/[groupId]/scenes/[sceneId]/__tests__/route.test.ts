/**
 * Tests for POST /api/v1/hue/groups/[groupId]/scenes/[sceneId]
 */

jest.mock('@/lib/hue/hueProxy');
jest.mock('@/lib/firebaseAdmin', () => ({ adminDbPush: jest.fn() }));
jest.mock('@/lib/auth0', () => ({
  auth0: { getSession: jest.fn() },
}));

import { POST } from '../route';
import * as hueProxy from '@/lib/hue/hueProxy';
import { auth0 } from '@/lib/auth0';

const mockGetSession = jest.mocked(auth0.getSession);
const mockActivateScene = jest.mocked(hueProxy.activateScene);
const mockSession = { user: { sub: 'auth0|123', email: 'test@test.com' } };

describe('POST /api/v1/hue/groups/[groupId]/scenes/[sceneId]', () => {
  const mockProxyResponse = {
    command: 'activate_scene' as const,
    status: 'accepted' as const,
    group_id: '1',
    scene_id: 'Ab1Cd2Ef3G',
    suggested_poll_delay_s: 2,
    poll_endpoint: '/api/v1/hue/groups/1',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession as any);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const req = new Request('http://localhost:3000/api/v1/hue/groups/1/scenes/Ab1Cd2Ef3G', {
      method: 'POST',
    });

    const response = await POST(req as any, {
      params: Promise.resolve({ groupId: '1', sceneId: 'Ab1Cd2Ef3G' }),
    } as any);

    expect(response.status).toBe(401);
  });

  it('should return 202 with proxy response body', async () => {
    mockActivateScene.mockResolvedValue(mockProxyResponse);
    const req = new Request('http://localhost:3000/api/v1/hue/groups/1/scenes/Ab1Cd2Ef3G', {
      method: 'POST',
    });

    const response = await POST(req as any, {
      params: Promise.resolve({ groupId: '1', sceneId: 'Ab1Cd2Ef3G' }),
    } as any);
    const data = await response.json();

    expect(response.status).toBe(202);
    expect(data.command).toBe('activate_scene');
    expect(data.suggested_poll_delay_s).toBe(2);
    expect(mockActivateScene).toHaveBeenCalledWith('1', 'Ab1Cd2Ef3G');
  });
});
