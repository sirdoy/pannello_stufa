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

// Phase 170: mock next/headers cookies() — returns async store (Next.js 16)
const mockSet = jest.fn();
const mockDelete = jest.fn();
jest.mock('next/headers', () => ({
  cookies: () => Promise.resolve({ set: mockSet, delete: mockDelete }),
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

// Phase-170 helpers: body parsing + ha_auth cookie set + 429 propagation.

function makeRequest(body: unknown | undefined): Request {
  return {
    text: () => Promise.resolve(body === undefined ? '' : JSON.stringify(body)),
    json: () => Promise.resolve(body),
  } as unknown as Request;
}

function makeRawRequest(raw: string): Request {
  return {
    text: () => Promise.resolve(raw),
    json: () => Promise.reject(new Error('unused')),
  } as unknown as Request;
}

describe('POST /api/auth/login — Phase 170 extensions', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    mockSet.mockClear();
    mockDelete.mockClear();
    mockLogin.mockClear();
    process.env = {
      ...originalEnv,
      HA_ADMIN_USER: 'admin',
      HA_ADMIN_PASSWORD: 'secret',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('Test 4: accepts body { username, password } and uses them instead of env vars', async () => {
    mockLogin.mockResolvedValueOnce({ access_token: 'eyJ-body-creds', token_type: 'bearer' });

    await (POST as unknown as (req: Request) => Promise<unknown>)(
      makeRequest({ username: 'bob', password: 'pw' })
    );

    expect(mockLogin).toHaveBeenCalledTimes(1);
    expect(mockLogin).toHaveBeenCalledWith('bob', 'pw');
  });

  it('Test 5: falls back to env vars when body is empty object', async () => {
    mockLogin.mockResolvedValueOnce({ access_token: 'eyJ-env-fallback', token_type: 'bearer' });

    await (POST as unknown as (req: Request) => Promise<unknown>)(makeRequest({}));

    expect(mockLogin).toHaveBeenCalledTimes(1);
    expect(mockLogin).toHaveBeenCalledWith('admin', 'secret');
  });

  it('Test 6: sets ha_auth httpOnly cookie with correct attributes on success', async () => {
    mockLogin.mockResolvedValueOnce({ access_token: 'eyJ-cookie', token_type: 'bearer' });

    await (POST as unknown as (req: Request) => Promise<unknown>)(
      makeRequest({ username: 'bob', password: 'pw' })
    );

    expect(mockSet).toHaveBeenCalledTimes(1);
    expect(mockSet).toHaveBeenCalledWith('ha_auth', '1', {
      httpOnly: true,
      sameSite: 'lax',
      secure: false, // NODE_ENV === 'test', not 'production'
      path: '/',
      maxAge: 3600,
    });
  });

  it('Test 7: T-157-01 preserved — response body never contains access_token', async () => {
    mockLogin.mockResolvedValueOnce({ access_token: 'eyJ-SECRET', token_type: 'bearer' });

    const result = await (POST as unknown as (req: Request) => Promise<unknown>)(
      makeRequest({ username: 'bob', password: 'pw' })
    );

    expect(result).toEqual({ ok: true, data: { authenticated: true } });
    expect(JSON.stringify(result)).not.toContain('access_token');
    expect(JSON.stringify(result)).not.toContain('eyJ-SECRET');
  });

  it('Test 8: propagates 429 RATE_LIMITED from HA proxy; no cookie set', async () => {
    const err = new ApiError(
      ERROR_CODES.RATE_LIMITED,
      'Too many requests',
      HTTP_STATUS.TOO_MANY_REQUESTS
    );
    mockLogin.mockRejectedValueOnce(err);

    await expect(
      (POST as unknown as (req: Request) => Promise<unknown>)(
        makeRequest({ username: 'bob', password: 'pw' })
      )
    ).rejects.toMatchObject({
      code: ERROR_CODES.RATE_LIMITED,
      status: HTTP_STATUS.TOO_MANY_REQUESTS,
    });

    expect(mockSet).not.toHaveBeenCalled();
  });

  it('Test 9: throws ApiError.badRequest on invalid JSON body', async () => {
    await expect(
      (POST as unknown as (req: Request) => Promise<unknown>)(makeRawRequest('{bad json'))
    ).rejects.toMatchObject({
      code: ERROR_CODES.VALIDATION_ERROR,
      status: HTTP_STATUS.BAD_REQUEST,
    });

    expect(mockLogin).not.toHaveBeenCalled();
    expect(mockSet).not.toHaveBeenCalled();
  });
});
