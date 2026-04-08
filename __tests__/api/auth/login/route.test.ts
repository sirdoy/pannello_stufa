/**
 * @jest-environment node
 *
 * Tests for POST /api/auth/login
 */

import { POST } from '@/app/api/auth/login/route';
import { login } from '@/lib/auth/authProxy';
import { ApiError, ERROR_CODES, HTTP_STATUS } from '@/lib/core/apiErrors';

// Mock dependencies
jest.mock('@/lib/auth/authProxy');
jest.mock('@/lib/core', () => ({
  withAuthAndErrorHandler: (fn: Function) => fn,
  success: (data: unknown) => ({ ok: true, data }),
}));

const mockLogin = login as jest.MockedFunction<typeof login>;

describe('POST /api/auth/login', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      HA_ADMIN_USER: 'admin',
      HA_ADMIN_PASSWORD: 'secret',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('Test 1: calls login() with HA_ADMIN_USER and HA_ADMIN_PASSWORD, returns success({ authenticated: true })', async () => {
    mockLogin.mockResolvedValueOnce({ access_token: 'eyJhbGci...', token_type: 'bearer' });

    const result = await (POST as unknown as () => Promise<unknown>)();

    expect(mockLogin).toHaveBeenCalledTimes(1);
    expect(mockLogin).toHaveBeenCalledWith('admin', 'secret');
    expect(result).toEqual({ ok: true, data: { authenticated: true } });
  });

  it('Test 2: propagates ApiError when login() fails', async () => {
    const apiError = new ApiError(
      ERROR_CODES.UNAUTHORIZED,
      'Invalid credentials',
      HTTP_STATUS.UNAUTHORIZED
    );
    mockLogin.mockRejectedValue(apiError);

    await expect((POST as unknown as () => Promise<unknown>)()).rejects.toThrow(ApiError);
    await expect((POST as unknown as () => Promise<unknown>)()).rejects.toMatchObject({
      code: ERROR_CODES.UNAUTHORIZED,
    });
  });

  it('Test 3: throws ApiError(EXTERNAL_API_ERROR) when HA_ADMIN_USER env var is missing', async () => {
    delete process.env.HA_ADMIN_USER;

    await expect((POST as unknown as () => Promise<unknown>)()).rejects.toThrow(ApiError);
    await expect((POST as unknown as () => Promise<unknown>)()).rejects.toMatchObject({
      code: ERROR_CODES.EXTERNAL_API_ERROR,
    });
    expect(mockLogin).not.toHaveBeenCalled();
  });
});
