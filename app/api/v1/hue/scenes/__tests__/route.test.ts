/**
 * Tests for GET /api/v1/hue/scenes
 */

jest.mock('@/lib/hue/hueProxy');
jest.mock('@/lib/auth0', () => ({
  auth0: { getSession: jest.fn() },
}));

import { GET } from '../route';
import * as hueProxy from '@/lib/hue/hueProxy';
import { auth0 } from '@/lib/auth0';

const mockGetSession = jest.mocked(auth0.getSession);
const mockGetScenes = jest.mocked(hueProxy.getScenes);
const mockSession = { user: { sub: 'auth0|123', email: 'test@test.com' } };

describe('GET /api/v1/hue/scenes', () => {
  const mockScenesData = [
    {
      scene_id: 's1',
      name: 'Relax',
      group_id: '1',
      type: 'GroupScene',
    },
    {
      scene_id: 's2',
      name: 'Energize',
      group_id: '1',
      type: 'GroupScene',
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
    const req = { nextUrl: { searchParams: new URLSearchParams() } } as any;

    const response = await GET(req, {} as any);

    expect(response.status).toBe(401);
  });

  it('should return 200 with scenes array', async () => {
    mockGetScenes.mockResolvedValue(mockScenesData as any);
    const req = { nextUrl: { searchParams: new URLSearchParams() } } as any;

    const response = await GET(req, {} as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.scenes).toBeInstanceOf(Array);
    expect(data.scenes).toHaveLength(2);
    expect(mockGetScenes).toHaveBeenCalled();
  });

  it('should pass group_id query param to getScenes', async () => {
    mockGetScenes.mockResolvedValue(mockScenesData as any);
    const req = { nextUrl: { searchParams: new URLSearchParams('group_id=1') } } as any;

    const response = await GET(req, {} as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockGetScenes).toHaveBeenCalledWith('1');
  });
});
