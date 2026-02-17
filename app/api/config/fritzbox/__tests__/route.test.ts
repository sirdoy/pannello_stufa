/**
 * Tests for Fritz!Box Configuration API
 * GET    /api/config/fritzbox
 * POST   /api/config/fritzbox
 * DELETE /api/config/fritzbox
 */

// Mock dependencies before imports
jest.mock('@/lib/firebaseAdmin', () => ({
  adminDbGet: jest.fn(),
  adminDbSet: jest.fn(),
  adminDbRemove: jest.fn(),
}));

jest.mock('@/lib/environmentHelper', () => ({
  getEnvironmentPath: jest.fn((path: string) => `dev/${path}`),
}));

jest.mock('@/lib/auth0', () => ({
  auth0: {
    getSession: jest.fn(),
  },
}));

jest.mock('@/lib/fritzbox/fritzboxClient', () => ({
  invalidateFritzBoxCredentialCache: jest.fn(),
  fritzboxClient: {},
}));

import { GET, POST, DELETE } from '../route';
import { adminDbGet, adminDbSet, adminDbRemove } from '@/lib/firebaseAdmin';
import { auth0 } from '@/lib/auth0';
import { invalidateFritzBoxCredentialCache } from '@/lib/fritzbox/fritzboxClient';

const mockAdminDbGet = jest.mocked(adminDbGet);
const mockAdminDbSet = jest.mocked(adminDbSet);
const mockAdminDbRemove = jest.mocked(adminDbRemove);
const mockGetSession = jest.mocked(auth0.getSession);
const mockInvalidateCache = jest.mocked(invalidateFritzBoxCredentialCache);

/**
 * Helper: create a mock request object compatible with Next.js API routes
 */
function makeRequest(body?: Record<string, unknown>): any {
  return {
    url: 'http://localhost/api/config/fritzbox',
    json: jest.fn().mockResolvedValue(body ?? {}),
    headers: {},
  };
}

describe('/api/config/fritzbox', () => {
  const mockSession = { user: { sub: 'auth0|123', email: 'test@test.com' } };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession as any);
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  // ============================================================
  // GET
  // ============================================================
  describe('GET', () => {
    it('returns 401 when not authenticated', async () => {
      mockGetSession.mockResolvedValue(null);
      const req = makeRequest();

      const response = await GET(req, {} as any);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.code).toBe('UNAUTHORIZED');
    });

    it('returns configured: false when no credentials stored', async () => {
      mockAdminDbGet.mockResolvedValue(null);
      const req = makeRequest();

      const response = await GET(req, {} as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.configured).toBe(false);
    });

    it('returns configured: false when stored credentials have no apiUrl', async () => {
      mockAdminDbGet.mockResolvedValue({ apiUrl: '', username: 'admin', password: 'pass' });
      const req = makeRequest();

      const response = await GET(req, {} as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.configured).toBe(false);
    });

    it('returns credentials without exposing password', async () => {
      mockAdminDbGet.mockResolvedValue({
        apiUrl: 'http://192.168.1.1:8000',
        username: 'admin',
        password: 'secret123',
        updatedAt: 1700000000000,
      });
      const req = makeRequest();

      const response = await GET(req, {} as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.configured).toBe(true);
      expect(data.apiUrl).toBe('http://192.168.1.1:8000');
      expect(data.username).toBe('admin');
      expect(data.passwordSet).toBe(true);
      // Password must NOT be returned
      expect(data.password).toBeUndefined();
      expect(data.updatedAt).toBe(1700000000000);
    });

    it('uses correct Firebase path', async () => {
      mockAdminDbGet.mockResolvedValue(null);
      const req = makeRequest();

      await GET(req, {} as any);

      expect(mockAdminDbGet).toHaveBeenCalledWith('dev/config/fritzbox');
    });
  });

  // ============================================================
  // POST
  // ============================================================
  describe('POST', () => {
    it('returns 401 when not authenticated', async () => {
      mockGetSession.mockResolvedValue(null);
      const req = makeRequest({ apiUrl: 'http://192.168.1.1:8000', username: 'admin', password: 'pass' });

      const response = await POST(req, {} as any);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.code).toBe('UNAUTHORIZED');
    });

    it('saves credentials to Firebase', async () => {
      mockAdminDbSet.mockResolvedValue(undefined);
      const req = makeRequest({
        apiUrl: 'http://192.168.1.1:8000',
        username: 'admin',
        password: 'secret123',
      });

      const response = await POST(req, {} as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Credentials saved');
      expect(mockAdminDbSet).toHaveBeenCalledWith(
        'dev/config/fritzbox',
        expect.objectContaining({
          apiUrl: 'http://192.168.1.1:8000',
          username: 'admin',
          password: 'secret123',
          updatedAt: expect.any(Number),
        })
      );
    });

    it('invalidates credential cache after saving', async () => {
      mockAdminDbSet.mockResolvedValue(undefined);
      const req = makeRequest({
        apiUrl: 'http://192.168.1.1:8000',
        username: 'admin',
        password: 'secret123',
      });

      await POST(req, {} as any);

      expect(mockInvalidateCache).toHaveBeenCalled();
    });

    it('returns 400 when apiUrl is missing', async () => {
      const req = makeRequest({ username: 'admin', password: 'pass' });

      const response = await POST(req, {} as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toMatch(/apiUrl/i);
    });

    it('returns 400 when username is missing', async () => {
      const req = makeRequest({ apiUrl: 'http://192.168.1.1:8000', password: 'pass' });

      const response = await POST(req, {} as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toMatch(/username/i);
    });

    it('returns 400 when apiUrl is not a valid URL', async () => {
      const req = makeRequest({ apiUrl: 'not-a-url', username: 'admin', password: 'pass' });

      const response = await POST(req, {} as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toMatch(/valid URL/i);
    });

    it('returns 400 when apiUrl uses ftp protocol', async () => {
      const req = makeRequest({ apiUrl: 'ftp://192.168.1.1', username: 'admin', password: 'pass' });

      const response = await POST(req, {} as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toMatch(/http/i);
    });

    it('keeps existing password when password is blank and credentials exist', async () => {
      mockAdminDbGet.mockResolvedValue({
        apiUrl: 'http://192.168.1.1:8000',
        username: 'old-user',
        password: 'existing-password',
        updatedAt: 1000000,
      });
      mockAdminDbSet.mockResolvedValue(undefined);

      const req = makeRequest({
        apiUrl: 'http://192.168.1.1:8000',
        username: 'new-user',
        password: '', // blank = keep existing
      });

      const response = await POST(req, {} as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockAdminDbSet).toHaveBeenCalledWith(
        'dev/config/fritzbox',
        expect.objectContaining({
          username: 'new-user',
          password: 'existing-password', // keeps existing password
        })
      );
    });

    it('returns 400 when password is blank and no existing credentials', async () => {
      mockAdminDbGet.mockResolvedValue(null);

      const req = makeRequest({
        apiUrl: 'http://192.168.1.1:8000',
        username: 'admin',
        password: '',
      });

      const response = await POST(req, {} as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toMatch(/password/i);
    });

    it('trims whitespace from all fields', async () => {
      mockAdminDbSet.mockResolvedValue(undefined);
      const req = makeRequest({
        apiUrl: '  http://192.168.1.1:8000  ',
        username: '  admin  ',
        password: '  secret123  ',
      });

      await POST(req, {} as any);

      expect(mockAdminDbSet).toHaveBeenCalledWith(
        'dev/config/fritzbox',
        expect.objectContaining({
          apiUrl: 'http://192.168.1.1:8000',
          username: 'admin',
          password: 'secret123',
        })
      );
    });

    it('accepts https protocol', async () => {
      mockAdminDbSet.mockResolvedValue(undefined);
      const req = makeRequest({
        apiUrl: 'https://myfritz.net:8000',
        username: 'admin',
        password: 'pass',
      });

      const response = await POST(req, {} as any);

      expect(response.status).toBe(200);
    });
  });

  // ============================================================
  // DELETE
  // ============================================================
  describe('DELETE', () => {
    it('returns 401 when not authenticated', async () => {
      mockGetSession.mockResolvedValue(null);
      const req = makeRequest();

      const response = await DELETE(req, {} as any);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.code).toBe('UNAUTHORIZED');
    });

    it('removes credentials from Firebase', async () => {
      mockAdminDbRemove.mockResolvedValue(undefined);
      const req = makeRequest();

      const response = await DELETE(req, {} as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Credentials removed');
      expect(mockAdminDbRemove).toHaveBeenCalledWith('dev/config/fritzbox');
    });

    it('invalidates credential cache after removing', async () => {
      mockAdminDbRemove.mockResolvedValue(undefined);
      const req = makeRequest();

      await DELETE(req, {} as any);

      expect(mockInvalidateCache).toHaveBeenCalled();
    });
  });
});
