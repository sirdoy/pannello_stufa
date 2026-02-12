/**
 * Tests for middleware.ts
 *
 * Tests middleware wrappers for API routes, focusing on withIdempotency.
 */

import { NextResponse } from 'next/server';
import { ref, get, set } from 'firebase/database';
import { db } from '@/lib/firebase';

// Mock Auth0 before importing middleware
jest.mock('@/lib/auth0', () => ({
  auth0: {
    getSession: jest.fn(),
  },
}));

// Mock Firebase database functions
jest.mock('firebase/database', () => ({
  ref: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
}));

// Mock Firebase client
jest.mock('@/lib/firebase', () => ({
  db: {},
}));

// Import after mocks are set up
import { withIdempotency } from '../middleware';

// Type for the mocked functions
const mockRef = jest.mocked(ref);
const mockGet = jest.mocked(get);
const mockSet = jest.mocked(set);

// Helper to create a mock session
const createMockSession = () => ({
  user: {
    sub: 'test-user-123',
    email: 'test@example.com',
  },
});

// Helper to create a mock route context
const createMockContext = () => ({
  params: Promise.resolve({}),
});

// Helper to create a mock request with headers
const createMockRequest = (headers: Record<string, string> = {}) => {
  const headersMap = new Map(Object.entries(headers));
  return {
    headers: {
      get: (key: string) => headersMap.get(key) || null,
    },
    method: 'POST',
    url: 'http://localhost/api/test',
  };
};

describe('withIdempotency', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock ref to return a reference object
    mockRef.mockReturnValue({} as any);
  });

  it('executes handler normally when no Idempotency-Key header is present', async () => {
    const mockHandler = jest.fn().mockResolvedValue(
      NextResponse.json({ success: true, data: 'result' })
    );

    const wrappedHandler = withIdempotency(mockHandler);

    const request = createMockRequest();

    const context = createMockContext();
    const session = createMockSession();

    await wrappedHandler(request as any, context, session);

    // Handler should be called
    expect(mockHandler).toHaveBeenCalledTimes(1);
    expect(mockHandler).toHaveBeenCalledWith(expect.any(Object), context, session);

    // Firebase should not be accessed
    expect(mockGet).not.toHaveBeenCalled();
    expect(mockSet).not.toHaveBeenCalled();
  });

  it('executes handler and caches result for first request with idempotency key', async () => {
    const mockHandler = jest.fn().mockResolvedValue(
      NextResponse.json({ success: true, data: 'result' }, { status: 200 })
    );

    const wrappedHandler = withIdempotency(mockHandler);

    const request = createMockRequest({ 'Idempotency-Key': 'test-key-123' });

    const context = createMockContext();
    const session = createMockSession();

    // Mock Firebase - no existing result
    mockGet.mockResolvedValue({
      exists: () => false,
      val: () => null,
    } as any);

    const response = await wrappedHandler(request as any, context, session);

    // Handler should be called
    expect(mockHandler).toHaveBeenCalledTimes(1);

    // Firebase should check for existing result
    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockRef).toHaveBeenCalledWith(db, 'idempotency/results/test-key-123');

    // Result should be cached
    expect(mockSet).toHaveBeenCalledTimes(1);
    expect(mockSet).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        data: { success: true, data: 'result' },
        status: 200,
        timestamp: expect.any(Number),
        expiresAt: expect.any(Number),
      })
    );

    // Response should be returned
    const responseData = await response.json();
    expect(responseData).toEqual({ success: true, data: 'result' });
    expect(response.status).toBe(200);
  });

  it('returns cached result for duplicate request with same idempotency key', async () => {
    const mockHandler = jest.fn().mockResolvedValue(
      NextResponse.json({ success: true, data: 'new-result' })
    );

    const wrappedHandler = withIdempotency(mockHandler);

    const request = createMockRequest({ 'Idempotency-Key': 'test-key-123' });

    const context = createMockContext();
    const session = createMockSession();

    // Mock Firebase - existing result found
    const cachedResult = {
      data: { success: true, data: 'cached-result' },
      status: 200,
      timestamp: Date.now() - 1000,
      expiresAt: Date.now() + 3600000,
    };

    mockGet.mockResolvedValue({
      exists: () => true,
      val: () => cachedResult,
    } as any);

    const response = await wrappedHandler(request as any, context, session);

    // Handler should NOT be called
    expect(mockHandler).not.toHaveBeenCalled();

    // Firebase should check for existing result
    expect(mockGet).toHaveBeenCalledTimes(1);

    // Result should NOT be re-cached
    expect(mockSet).not.toHaveBeenCalled();

    // Cached response should be returned
    const responseData = await response.json();
    expect(responseData).toEqual({ success: true, data: 'cached-result' });
    expect(response.status).toBe(200);
  });

  it('still returns response even if cache write fails', async () => {
    const mockHandler = jest.fn().mockResolvedValue(
      NextResponse.json({ success: true, data: 'result' }, { status: 200 })
    );

    const wrappedHandler = withIdempotency(mockHandler);

    const request = createMockRequest({ 'Idempotency-Key': 'test-key-123' });

    const context = createMockContext();
    const session = createMockSession();

    // Mock Firebase - no existing result
    mockGet.mockResolvedValue({
      exists: () => false,
      val: () => null,
    } as any);

    // Mock cache write failure
    mockSet.mockRejectedValue(new Error('Firebase write failed'));

    // Spy on console.warn
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

    const response = await wrappedHandler(request as any, context, session);

    // Handler should be called
    expect(mockHandler).toHaveBeenCalledTimes(1);

    // Warning should be logged
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[Idempotency] Failed to cache result for key test-key-123',
      undefined
    );

    // Response should still be returned
    const responseData = await response.json();
    expect(responseData).toEqual({ success: true, data: 'result' });
    expect(response.status).toBe(200);

    consoleWarnSpy.mockRestore();
  });

  it('does NOT cache error responses', async () => {
    const mockHandler = jest.fn().mockResolvedValue(
      NextResponse.json({ success: false, error: 'Something failed' }, { status: 500 })
    );

    const wrappedHandler = withIdempotency(mockHandler);

    const request = createMockRequest({ 'Idempotency-Key': 'test-key-123' });

    const context = createMockContext();
    const session = createMockSession();

    // Mock Firebase - no existing result
    mockGet.mockResolvedValue({
      exists: () => false,
      val: () => null,
    } as any);

    const response = await wrappedHandler(request as any, context, session);

    // Handler should be called
    expect(mockHandler).toHaveBeenCalledTimes(1);

    // Firebase should check for existing result
    expect(mockGet).toHaveBeenCalledTimes(1);

    // Result should NOT be cached (error response)
    expect(mockSet).not.toHaveBeenCalled();

    // Error response should be returned
    const responseData = await response.json();
    expect(responseData).toEqual({ success: false, error: 'Something failed' });
    expect(response.status).toBe(500);
  });

  it('handles different idempotency keys independently', async () => {
    const mockHandler = jest.fn().mockResolvedValue(
      NextResponse.json({ success: true, data: 'result' }, { status: 200 })
    );

    const wrappedHandler = withIdempotency(mockHandler);

    const context = createMockContext();
    const session = createMockSession();

    // First request with key-1
    const request1 = createMockRequest({ 'Idempotency-Key': 'key-1' });

    mockGet.mockResolvedValueOnce({
      exists: () => false,
      val: () => null,
    } as any);

    await wrappedHandler(request1 as any, context, session);

    expect(mockHandler).toHaveBeenCalledTimes(1);
    expect(mockRef).toHaveBeenCalledWith(db, 'idempotency/results/key-1');

    // Second request with key-2 (different key)
    const request2 = createMockRequest({ 'Idempotency-Key': 'key-2' });

    mockGet.mockResolvedValueOnce({
      exists: () => false,
      val: () => null,
    } as any);

    await wrappedHandler(request2 as any, context, session);

    // Handler should be called again (different key)
    expect(mockHandler).toHaveBeenCalledTimes(2);
    expect(mockRef).toHaveBeenCalledWith(db, 'idempotency/results/key-2');
  });

  it('uses 1-hour TTL for cached results', async () => {
    const mockHandler = jest.fn().mockResolvedValue(
      NextResponse.json({ success: true, data: 'result' }, { status: 200 })
    );

    const wrappedHandler = withIdempotency(mockHandler);

    const request = createMockRequest({ 'Idempotency-Key': 'test-key-123' });

    const context = createMockContext();
    const session = createMockSession();

    // Mock Firebase - no existing result
    mockGet.mockResolvedValue({
      exists: () => false,
      val: () => null,
    } as any);

    const beforeTime = Date.now();
    await wrappedHandler(request as any, context, session);
    const afterTime = Date.now();

    // Check that TTL is 1 hour (3600000ms)
    expect(mockSet).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        timestamp: expect.any(Number),
        expiresAt: expect.any(Number),
      })
    );

    const cachedData = mockSet.mock.calls[0]?.[1] as any;
    const ttl = cachedData.expiresAt - cachedData.timestamp;

    // TTL should be 1 hour (allow small variance due to execution time)
    expect(ttl).toBeGreaterThanOrEqual(3600000 - 100);
    expect(ttl).toBeLessThanOrEqual(3600000 + 100);

    // Timestamp should be recent
    expect(cachedData.timestamp).toBeGreaterThanOrEqual(beforeTime);
    expect(cachedData.timestamp).toBeLessThanOrEqual(afterTime);
  });
});
