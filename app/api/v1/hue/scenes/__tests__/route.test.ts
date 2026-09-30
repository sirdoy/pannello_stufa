/**
 * Tests for GET /api/v1/hue/scenes
 */

jest.mock('@/lib/hue/hueProxy');
jest.mock('@/lib/auth/session', () => ({
  authSession: { getSession: jest.fn() },
}));

import { GET } from '../route';
import * as hueProxy from '@/lib/hue/hueProxy';
import { authSession } from '@/lib/auth/session';
import { asNextRequest, mockAppSession, routeContext } from '@/__tests__/__utils__/routeHelpers';
import type { HueScene } from '@/types/hueProxy';

const mockGetSession = jest.mocked(authSession.getSession);
const mockGetScenes = jest.mocked(hueProxy.getScenes);

describe('GET /api/v1/hue/scenes', () => {
  const mockScenesData: HueScene[] = [
    {
      scene_id: 's1',
      name: 'Relax',
      group_id: '1',
      group_name: 'Living Room',
      lights: ['1', '2'],
      type: 'GroupScene',
    },
    {
      scene_id: 's2',
      name: 'Energize',
      group_id: '1',
      group_name: 'Living Room',
      lights: ['1', '2'],
      type: 'GroupScene',
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
    const req = asNextRequest({ nextUrl: { searchParams: new URLSearchParams() } });

    const response = await GET(req, routeContext());

    expect(response.status).toBe(401);
  });

  it('should return 200 with scenes array', async () => {
    mockGetScenes.mockResolvedValue(mockScenesData);
    const req = asNextRequest({ nextUrl: { searchParams: new URLSearchParams() } });

    const response = await GET(req, routeContext());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.scenes).toBeInstanceOf(Array);
    expect(data.scenes).toHaveLength(2);
    expect(mockGetScenes).toHaveBeenCalled();
  });

  it('should pass group_id query param to getScenes', async () => {
    mockGetScenes.mockResolvedValue(mockScenesData);
    const req = asNextRequest({ nextUrl: { searchParams: new URLSearchParams('group_id=1') } });

    const response = await GET(req, routeContext());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockGetScenes).toHaveBeenCalledWith('1');
  });
});
