/**
 * @jest-environment node
 *
 * Tests for DELETE /api/auth/api-keys/[keyId]
 */

import { DELETE } from '@/app/api/auth/api-keys/[keyId]/route';
import { login, deleteApiKey } from '@/lib/auth/authProxy';
import { ApiError, ERROR_CODES, HTTP_STATUS } from '@/lib/core/apiErrors';

// Mock dependencies
jest.mock('@/lib/auth/authProxy');
jest.mock('@/lib/core', () => ({
  withAuthAndErrorHandler: (fn: Function) => fn,
  noContent: () => ({ ok: true, status: 204 }),
}));

const mockLogin = login as jest.MockedFunction<typeof login>;
const mockDeleteApiKey = deleteApiKey as jest.MockedFunction<typeof deleteApiKey>;

const mockToken = { access_token: 'test-token', token_type: 'bearer' as const };

function makeContext(keyId: string) {
  return {
    params: Promise.resolve({ keyId }),
  };
}

describe('DELETE /api/auth/api-keys/[keyId]', () => {
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

  it('Test 7: extracts keyId, calls login() then deleteApiKey(), returns noContent()', async () => {
    mockLogin.mockResolvedValueOnce(mockToken);
    mockDeleteApiKey.mockResolvedValueOnce(undefined);

    const result = await (DELETE as unknown as (_req: unknown, ctx: unknown) => Promise<unknown>)(
      {},
      makeContext('1')
    );

    expect(mockLogin).toHaveBeenCalledTimes(1);
    expect(mockLogin).toHaveBeenCalledWith('admin', 'secret');
    expect(mockDeleteApiKey).toHaveBeenCalledTimes(1);
    expect(mockDeleteApiKey).toHaveBeenCalledWith('test-token', 1);
    expect(result).toEqual({ ok: true, status: 204 });
  });

  it('Test 8: throws ApiError(VALIDATION_ERROR) when keyId is not a valid number', async () => {
    await expect(
      (DELETE as unknown as (_req: unknown, ctx: unknown) => Promise<unknown>)(
        {},
        makeContext('not-a-number')
      )
    ).rejects.toThrow(ApiError);

    await expect(
      (DELETE as unknown as (_req: unknown, ctx: unknown) => Promise<unknown>)(
        {},
        makeContext('abc')
      )
    ).rejects.toMatchObject({ code: ERROR_CODES.VALIDATION_ERROR });

    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('Test 9: propagates ApiError(NOT_FOUND) when deleteApiKey() throws 404', async () => {
    mockLogin.mockResolvedValue(mockToken);
    mockDeleteApiKey.mockRejectedValue(
      new ApiError(ERROR_CODES.NOT_FOUND, 'API key not found', HTTP_STATUS.NOT_FOUND)
    );

    await expect(
      (DELETE as unknown as (_req: unknown, ctx: unknown) => Promise<unknown>)(
        {},
        makeContext('999')
      )
    ).rejects.toThrow(ApiError);

    await expect(
      (DELETE as unknown as (_req: unknown, ctx: unknown) => Promise<unknown>)(
        {},
        makeContext('999')
      )
    ).rejects.toMatchObject({ code: ERROR_CODES.NOT_FOUND });
  });
});
