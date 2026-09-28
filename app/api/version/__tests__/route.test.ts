/**
 * Tests for GET /api/version (M17)
 */

jest.mock('@/lib/haClient', () => ({ haGet: jest.fn() }));
jest.mock('@/lib/auth/session', () => ({
  authSession: { getSession: jest.fn() },
}));

import { GET } from '../route';
import { haGet } from '@/lib/haClient';
import { authSession } from '@/lib/auth/session';
import { FRONTEND_BUILD_ID } from '@/lib/buildVersion';

const mockHaGet = jest.mocked(haGet);
const mockGetSession = jest.mocked(authSession.getSession);

describe('GET /api/version', () => {
  const request = new Request('http://localhost:3000/api/version');

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue({ user: { sub: 'u1' } } as never);
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('returns 401 without a session', async () => {
    mockGetSession.mockResolvedValue(null);
    const response = await GET(request as never, {} as never);
    expect(response.status).toBe(401);
  });

  it('returns frontend and backend commits, not cached', async () => {
    mockHaGet.mockResolvedValue({ status: 'ok', version: '392ac0e05df0' });
    const response = await GET(request as never, {} as never);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(data).toMatchObject({ frontend: FRONTEND_BUILD_ID, backend: '392ac0e05df0' });
    expect(mockHaGet).toHaveBeenCalledWith('/health', { timeout: 5000 });
  });

  it('reports backend null when the Pi is unreachable', async () => {
    mockHaGet.mockRejectedValue(new Error('down'));
    const response = await GET(request as never, {} as never);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.backend).toBeNull();
  });
});
