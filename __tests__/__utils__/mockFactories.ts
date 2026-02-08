/**
 * Mock Factories
 *
 * Domain-specific mock factories for Firebase, Firestore, and fetch.
 * Provides typed mock objects for common test scenarios.
 */

import type { DatabaseReference, DataSnapshot } from 'firebase/database';
import type { QuerySnapshot, Timestamp } from 'firebase/firestore';

/**
 * Creates a typed Firebase database reference mock
 * All methods return jest.fn() for flexible test setup
 *
 * @example
 * const mockRef = createMockDbRef();
 * mockRef.set.mockResolvedValue();
 * await set(mockRef, { value: 123 });
 */
export function createMockDbRef(): DatabaseReference {
  return {
    key: 'mock-key',
    parent: null,
    root: {} as DatabaseReference,
    toString: jest.fn(() => 'mock-ref'),
    toJSON: jest.fn(() => 'mock-ref'),
    child: jest.fn((path: string) => createMockDbRef()),
  } as unknown as DatabaseReference;
}

/**
 * Creates a typed Firebase DataSnapshot mock
 *
 * @example
 * const snapshot = createMockDataSnapshot({ userId: '123', name: 'Test' });
 * expect(snapshot.val()).toEqual({ userId: '123', name: 'Test' });
 */
export function createMockDataSnapshot(val: unknown): DataSnapshot {
  return {
    key: 'mock-key',
    ref: createMockDbRef(),
    val: jest.fn(() => val),
    exists: jest.fn(() => val !== null && val !== undefined),
    child: jest.fn((path: string) => createMockDataSnapshot(null)),
    forEach: jest.fn(),
    hasChild: jest.fn(() => false),
    hasChildren: jest.fn(() => false),
    numChildren: jest.fn(() => 0),
    exportVal: jest.fn(() => val),
    toJSON: jest.fn(() => val),
    getPriority: jest.fn(() => null),
  } as unknown as DataSnapshot;
}

/**
 * Creates a typed Firestore Timestamp mock
 *
 * @example
 * const timestamp = createMockTimestamp(1609459200); // 2021-01-01
 * expect(timestamp.toDate()).toEqual(new Date(1609459200 * 1000));
 */
export function createMockTimestamp(seconds: number = Date.now() / 1000): Timestamp {
  const nanoseconds = Math.floor((seconds % 1) * 1e9);
  const wholeSeconds = Math.floor(seconds);

  return {
    seconds: wholeSeconds,
    nanoseconds,
    toDate: jest.fn(() => new Date(wholeSeconds * 1000)),
    toMillis: jest.fn(() => wholeSeconds * 1000),
    isEqual: jest.fn((other: Timestamp) => wholeSeconds === other.seconds),
    valueOf: jest.fn(() => `Timestamp(seconds=${wholeSeconds}, nanoseconds=${nanoseconds})`),
  } as unknown as Timestamp;
}

/**
 * Creates a typed Firestore QuerySnapshot mock
 *
 * @example
 * const snapshot = createMockQuerySnapshot([
 *   { id: '1', data: () => ({ name: 'Test 1' }) },
 *   { id: '2', data: () => ({ name: 'Test 2' }) }
 * ]);
 * expect(snapshot.docs).toHaveLength(2);
 */
export function createMockQuerySnapshot(
  docs: Array<{ id: string; data: () => unknown }>
): QuerySnapshot {
  const mockDocs = docs.map((doc) => ({
    id: doc.id,
    ref: {} as any,
    data: jest.fn(doc.data),
    exists: jest.fn(() => true),
    get: jest.fn(),
    metadata: { hasPendingWrites: false, fromCache: false, isEqual: jest.fn() },
  }));

  return {
    docs: mockDocs,
    size: docs.length,
    empty: docs.length === 0,
    forEach: jest.fn((callback) => {
      mockDocs.forEach((doc, index) => callback(doc));
    }),
    query: {} as any,
    metadata: { hasPendingWrites: false, fromCache: false, isEqual: jest.fn() },
  } as unknown as QuerySnapshot;
}

/**
 * Creates a typed fetch Response mock with JSON body
 *
 * @example
 * const response = createMockFetchResponse({ success: true }, { status: 200 });
 * global.fetch = jest.fn().mockResolvedValue(response);
 */
export function createMockFetchResponse(
  body: unknown,
  options?: {
    ok?: boolean;
    status?: number;
    statusText?: string;
    headers?: Record<string, string>;
  }
): Response {
  const headers = new Headers(options?.headers || {});
  headers.set('content-type', 'application/json');

  return {
    ok: options?.ok ?? true,
    status: options?.status ?? 200,
    statusText: options?.statusText ?? 'OK',
    headers,
    redirected: false,
    type: 'basic' as ResponseType,
    url: '',
    body: null,
    bodyUsed: false,
    clone: jest.fn() as any,
    arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(0)),
    blob: jest.fn().mockResolvedValue(new Blob()),
    formData: jest.fn().mockResolvedValue(new FormData()),
    json: jest.fn().mockResolvedValue(body),
    text: jest.fn().mockResolvedValue(JSON.stringify(body)),
    bytes: jest.fn().mockResolvedValue(new Uint8Array()),
  } as unknown as Response;
}
