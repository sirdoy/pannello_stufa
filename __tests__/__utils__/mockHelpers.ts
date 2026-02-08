/**
 * Mock Type Helpers
 *
 * Reusable mock typing helpers for Jest tests.
 * Provides type-safe wrappers for common mocking patterns.
 */

/**
 * Type-safe wrapper for manual jest.fn() mocks
 * Preserves function signature while enabling mock methods
 *
 * @example
 * const myFn = mockFunction<(id: string) => Promise<User>>(jest.fn());
 * myFn.mockResolvedValue(mockUser);
 */
export function mockFunction<T extends (...args: any[]) => any>(
  fn: jest.Mock
): jest.MockedFunction<T> {
  return fn as unknown as jest.MockedFunction<T>;
}

/**
 * Creates a typed mock Response for fetch tests
 *
 * @example
 * const response = createMockResponse({ ok: false, status: 404 });
 * global.fetch = jest.fn().mockResolvedValue(response);
 */
export function createMockResponse(overrides?: Partial<Response>): Response {
  const defaults: Partial<Response> = {
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: new Headers(),
    redirected: false,
    type: 'basic' as ResponseType,
    url: '',
    clone: jest.fn() as any,
    body: null,
    bodyUsed: false,
    arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(0)),
    blob: jest.fn().mockResolvedValue(new Blob()),
    formData: jest.fn().mockResolvedValue(new FormData()),
    json: jest.fn().mockResolvedValue({}),
    text: jest.fn().mockResolvedValue(''),
    bytes: jest.fn().mockResolvedValue(new Uint8Array()),
  };

  return { ...defaults, ...overrides } as unknown as Response;
}

/**
 * Creates a typed mock Request for API route tests
 *
 * @example
 * const request = createMockNextRequest('/api/test', { method: 'POST' });
 */
export function createMockNextRequest(
  url: string,
  options?: RequestInit
): Request {
  const defaults: Partial<Request> = {
    url,
    method: options?.method || 'GET',
    headers: new Headers(options?.headers),
    body: null,
    cache: 'default' as RequestCache,
    credentials: 'same-origin' as RequestCredentials,
    destination: '' as RequestDestination,
    integrity: '',
    keepalive: false,
    mode: 'cors' as RequestMode,
    redirect: 'follow' as RequestRedirect,
    referrer: '',
    referrerPolicy: '' as ReferrerPolicy,
    signal: new AbortController().signal,
    clone: jest.fn() as any,
    bodyUsed: false,
    arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(0)),
    blob: jest.fn().mockResolvedValue(new Blob()),
    formData: jest.fn().mockResolvedValue(new FormData()),
    json: jest.fn().mockResolvedValue({}),
    text: jest.fn().mockResolvedValue(''),
    bytes: jest.fn().mockResolvedValue(new Uint8Array()),
  };

  return { ...defaults, ...options } as unknown as Request;
}

/**
 * Type-safe mockResolvedValue wrapper
 * Provides IDE autocomplete for return value
 *
 * @example
 * const mockFn = jest.fn();
 * typedMockResolvedValue(mockFn, { id: '123', name: 'Test' });
 */
export function typedMockResolvedValue<T>(
  mock: jest.MockedFunction<any>,
  value: T
): void {
  mock.mockResolvedValue(value);
}

/**
 * Type-safe mockRejectedValue wrapper
 *
 * @example
 * const mockFn = jest.fn();
 * typedMockRejectedValue(mockFn, new Error('Test error'));
 */
export function typedMockRejectedValue(
  mock: jest.MockedFunction<any>,
  error: Error
): void {
  mock.mockRejectedValue(error);
}
