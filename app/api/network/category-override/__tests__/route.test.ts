/**
 * Tests for Network Category Override Route
 * POST /api/network/category-override
 */

// Mock dependencies before imports
jest.mock('@/lib/network/deviceCategories');
jest.mock('@/lib/auth0', () => ({
  auth0: {
    getSession: jest.fn(),
  },
}));

import { POST } from '../route';
import { saveCategoryOverride } from '@/lib/network/deviceCategories';
import { auth0 } from '@/lib/auth0';

const mockGetSession = jest.mocked(auth0.getSession);
const mockSaveCategoryOverride = jest.mocked(saveCategoryOverride);

describe('POST /api/network/category-override', () => {
  const mockSession = { user: { sub: 'auth0|123', email: 'test@test.com' } };
  const testMac = 'AA:BB:CC:DD:EE:FF';

  beforeEach(() => {
    jest.clearAllMocks();
    // Default: authenticated user
    mockGetSession.mockResolvedValue(mockSession as any);
    // Mock console methods to suppress output
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const mockRequest = {
      json: jest.fn().mockResolvedValue({ mac: testMac, category: 'mobile' }),
    };

    const response = await POST(mockRequest as any, {} as any);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.code).toBe('UNAUTHORIZED');
  });

  it('should return 400 when MAC missing from body', async () => {
    const mockRequest = {
      json: jest.fn().mockResolvedValue({ category: 'mobile' }),
    };

    const response = await POST(mockRequest as any, {} as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.code).toBe('VALIDATION_ERROR');
    expect(data.error).toBe('Indirizzo MAC richiesto');
  });

  it('should return 400 when category is invalid', async () => {
    const mockRequest = {
      json: jest.fn().mockResolvedValue({ mac: testMac, category: 'laptop' }),
    };

    const response = await POST(mockRequest as any, {} as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.code).toBe('VALIDATION_ERROR');
    expect(data.error).toContain('Categoria non valida');
    expect(data.error).toContain('iot, mobile, pc, smart-home, unknown');
  });

  it('should return 200 and call saveCategoryOverride with correct args on valid request', async () => {
    mockSaveCategoryOverride.mockResolvedValue();
    const mockRequest = {
      json: jest.fn().mockResolvedValue({ mac: testMac, category: 'mobile' }),
    };

    const response = await POST(mockRequest as any, {} as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockSaveCategoryOverride).toHaveBeenCalledWith(testMac, 'mobile');
  });

  it('should return saved:true confirmation in response', async () => {
    mockSaveCategoryOverride.mockResolvedValue();
    const mockRequest = {
      json: jest.fn().mockResolvedValue({ mac: testMac, category: 'pc' }),
    };

    const response = await POST(mockRequest as any, {} as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      success: true,
      mac: testMac,
      category: 'pc',
      saved: true,
    });
  });
});
