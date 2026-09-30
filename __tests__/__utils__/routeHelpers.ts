/**
 * Route handler test helpers
 *
 * Typed replacements for `request as any` / `{} as any` when calling App Router
 * handlers (`GET(request, context)`) directly from tests.
 */

import type { NextRequest } from 'next/server';
import type { AppSession } from '@/lib/auth/session';

/**
 * Route context as Next passes it to App Router handlers.
 *
 * @example
 * await GET(request, routeContext({ deviceId: 'abc' }));
 */
export function routeContext<P extends Record<string, string> = Record<string, string>>(
  params: P = {} as P
): { params: Promise<P> } {
  return { params: Promise.resolve(params) };
}

/**
 * Types a Request, or a partial request mock, as the NextRequest a route handler expects.
 * Only the members the handler reads need to exist on the mock.
 *
 * @example
 * await POST(asNextRequest(new Request(url, { method: 'POST', body })), routeContext());
 * await GET(asNextRequest({ nextUrl: new URL(url) }), routeContext());
 */
export function asNextRequest(request: Request | object): NextRequest {
  return request as NextRequest;
}

/**
 * Complete AppSession for `authSession.getSession` mocks; override only what the test checks.
 *
 * @example
 * mockGetSession.mockResolvedValue(mockAppSession({ sub: 'auth0|123' }));
 */
export function mockAppSession(user: Partial<AppSession['user']> = {}): AppSession {
  return {
    user: {
      sub: 'auth0|123',
      email: 'test@test.com',
      name: 'Test User',
      nickname: 'test',
      picture: '',
      role: 'user',
      ...user,
    },
  };
}
