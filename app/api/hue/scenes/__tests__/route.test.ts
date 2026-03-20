/**
 * Tests for GET /api/hue/scenes
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

const mockScenes = [
  {
    scene_id: 'abc123',
    name: 'Relax',
    group_id: '1',
    group_name: 'Living Room',
    lights: ['1', '2'],
    type: 'GroupScene',
  },
];

describe('GET /api/hue/scenes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession as any);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const mockRequest = { nextUrl: { searchParams: new URLSearchParams() } } as any;

    const response = await GET(mockRequest, {} as any);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.code).toBe('UNAUTHORIZED');
  });

  it('should return 200 with all scenes when no group_id filter', async () => {
    mockGetScenes.mockResolvedValue(mockScenes);
    const mockRequest = { nextUrl: { searchParams: new URLSearchParams() } } as any;

    const response = await GET(mockRequest, {} as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockGetScenes).toHaveBeenCalledWith(undefined);
  });

  it('should return 200 with filtered scenes when group_id provided', async () => {
    mockGetScenes.mockResolvedValue(mockScenes);
    const mockRequest = { nextUrl: { searchParams: new URLSearchParams('group_id=1') } } as any;

    const response = await GET(mockRequest, {} as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockGetScenes).toHaveBeenCalledWith('1');
  });
});
