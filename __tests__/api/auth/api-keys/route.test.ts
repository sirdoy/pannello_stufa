/**
 * @jest-environment node
 *
 * Tests for GET and POST /api/auth/api-keys
 */

import { GET, POST } from '@/app/api/auth/api-keys/route';
import { login, listApiKeys, createApiKey } from '@/lib/auth/authProxy';
import { ApiError, ERROR_CODES, HTTP_STATUS } from '@/lib/core/apiErrors';
import type { APIKeyListResponse, APIKeyResponse } from '@/types/authProxy';

// Mock dependencies
jest.mock('@/lib/auth/authProxy');
jest.mock('@/lib/core', () => ({
  withAuthAndErrorHandler: (fn: Function) => fn,
  success: (data: unknown) => ({ ok: true, data }),
  created: (data: unknown) => ({ ok: true, created: true, data }),
}));

const mockLogin = login as jest.MockedFunction<typeof login>;
const mockListApiKeys = listApiKeys as jest.MockedFunction<typeof listApiKeys>;
const mockCreateApiKey = createApiKey as jest.MockedFunction<typeof createApiKey>;

const mockToken = { access_token: 'test-token', token_type: 'bearer' as const };

const mockListResponse: APIKeyListResponse = {
  keys: [
    {
      id: 1,
      name: 'Test Key',
      created_at: '2026-04-08T00:00:00Z',
      last_used_at: null,
      is_active: true,
    },
  ],
  count: 1,
};

const mockCreateResponse: APIKeyResponse = {
  id: 2,
  name: 'New Key',
  api_key: 'ha_live_abc123',
  created_at: '2026-04-08T00:00:00Z',
};

describe('GET /api/auth/api-keys', () => {
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

  it('Test 4: calls login() then listApiKeys() and returns the list data', async () => {
    mockLogin.mockResolvedValueOnce(mockToken);
    mockListApiKeys.mockResolvedValueOnce(mockListResponse);

    const result = await (GET as unknown as () => Promise<unknown>)() as { keys: unknown[]; count: number };

    expect(mockLogin).toHaveBeenCalledTimes(1);
    expect(mockLogin).toHaveBeenCalledWith('admin', 'secret');
    expect(mockListApiKeys).toHaveBeenCalledTimes(1);
    expect(mockListApiKeys).toHaveBeenCalledWith('test-token');
    // GET returns NextResponse.json(data) directly
    expect(result).toBeDefined();
  });
});

describe('POST /api/auth/api-keys', () => {
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

  function makeRequest(body: unknown): Request {
    return {
      json: () => Promise.resolve(body),
    } as unknown as Request;
  }

  it('Test 5: reads { name } from body, calls login() then createApiKey(), returns created data', async () => {
    mockLogin.mockResolvedValueOnce(mockToken);
    mockCreateApiKey.mockResolvedValueOnce(mockCreateResponse);

    const result = await (POST as unknown as (req: Request) => Promise<unknown>)(
      makeRequest({ name: 'New Key' })
    ) as { ok: boolean; created: boolean; data: unknown };

    expect(mockLogin).toHaveBeenCalledTimes(1);
    expect(mockLogin).toHaveBeenCalledWith('admin', 'secret');
    expect(mockCreateApiKey).toHaveBeenCalledTimes(1);
    expect(mockCreateApiKey).toHaveBeenCalledWith('test-token', 'New Key');
    expect(result.created).toBe(true);
  });

  it('Test 6: throws ApiError(VALIDATION_ERROR) when name is missing from body', async () => {
    const request = makeRequest({});

    await expect(
      (POST as unknown as (req: Request) => Promise<unknown>)(request)
    ).rejects.toThrow(ApiError);

    await expect(
      (POST as unknown as (req: Request) => Promise<unknown>)(makeRequest({}))
    ).rejects.toMatchObject({ code: ERROR_CODES.VALIDATION_ERROR });

    expect(mockLogin).not.toHaveBeenCalled();
  });
});
