/**
 * API Route Middleware
 *
 * Provides reusable middleware wrappers for API routes.
 * Eliminates repetitive auth checks and error handling.
 *
 * Usage:
 *   import { withAuth, withErrorHandler, withAuthAndErrorHandler } from '@/lib/core/middleware';
 *
 *   // Protected route with automatic error handling
 *   export const GET = withAuthAndErrorHandler(async (request, context, session) => {
 *     const data = await getData();
 *     return success({ data });
 *   });
 *
 *   // Unprotected route with error handling only
 *   export const GET = withErrorHandler(async (request, context) => {
 *     const data = await getData();
 *     return success({ data });
 *   });
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { unauthorized, handleError } from './apiResponse';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/** Auth0 session type */
interface Session {
  user: {
    sub: string;
    email?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/** Route context with params */
interface RouteContext {
  params: Promise<Record<string, string>>;
}

/** Route handler with authentication */
type AuthedHandler = (
  request: NextRequest,
  context: RouteContext,
  session: Session
) => Promise<NextResponse<unknown>>;

/** Route handler with optional authentication */
type OptionalAuthHandler = (
  request: NextRequest,
  context: RouteContext,
  session: Session | null
) => Promise<NextResponse<unknown>>;

/** Route handler without authentication */
type UnauthHandler = (
  request: NextRequest,
  context: RouteContext
) => Promise<NextResponse<unknown>>;

// =============================================================================
// DEV BYPASS
// =============================================================================

const BYPASS_AUTH = process.env.BYPASS_AUTH === 'true';

const DEV_SESSION: Session = {
  user: { sub: 'local-dev-user', email: 'dev@localhost' },
};

// =============================================================================
// AUTH MIDDLEWARE
// =============================================================================



// =============================================================================
// ERROR HANDLING MIDDLEWARE
// =============================================================================

/**
 * Wraps a route handler with try-catch error handling
 * Automatically converts errors to appropriate API responses
 *
 * @param handler - Route handler function
 * @param logContext - Context for error logging (optional)
 * @returns Wrapped handler
 *
 * @example
 * export const GET = withErrorHandler(async (request, context) => {
 *   const data = await riskyOperation();
 *   return success({ data });
 * }, 'GetData');
 */
export function withErrorHandler(handler: UnauthHandler, logContext: string | null = null): UnauthHandler {
  return async (request: NextRequest, context: RouteContext) => {
    try {
      return await handler(request, context);
    } catch (error) {
      return handleError(error as Error, logContext);
    }
  };
}

// =============================================================================
// COMBINED MIDDLEWARE
// =============================================================================

/**
 * Internal: Wraps a route handler with Auth0 authentication
 * Automatically returns 401 if user is not authenticated.
 * When BYPASS_AUTH=true, provides a mock session (dev only).
 */
function withAuth(handler: AuthedHandler): UnauthHandler {
  return async (request: NextRequest, context: RouteContext) => {
    if (BYPASS_AUTH) {
      return handler(request, context, DEV_SESSION);
    }

    const session = await auth0.getSession(request);

    if (!session?.user) {
      return unauthorized();
    }

    return handler(request, context, session);
  };
}

/**
 * Combines auth and error handling middleware
 * Most common pattern for protected API routes
 *
 * @param handler - Route handler function
 *   Handler signature: (request, context, session) => Promise<NextResponse>
 * @param logContext - Context for error logging (optional)
 * @returns Wrapped handler
 *
 * @example
 * export const GET = withAuthAndErrorHandler(async (request, context, session) => {
 *   const data = await getDataForUser(session.user.sub);
 *   return success({ data });
 * }, 'UserData');
 */
export function withAuthAndErrorHandler(handler: AuthedHandler, logContext: string | null = null): UnauthHandler {
  return withErrorHandler(withAuth(handler), logContext);
}

// =============================================================================
// ADMIN MIDDLEWARE
// =============================================================================


// =============================================================================
// CRON/SECRET MIDDLEWARE
// =============================================================================

/**
 * Wraps a route handler with cron secret validation
 * For routes called by cron jobs (e.g., /api/scheduler/check)
 *
 * Supports both:
 * - Query param: ?secret=xxx
 * - Header: Authorization: Bearer xxx
 *
 * @param handler - Route handler function
 * @param logContext - Context for error logging (optional)
 * @returns Wrapped handler
 *
 * @example
 * export const GET = withCronSecret(async (request, context) => {
 *   await schedulerCheck();
 *   return success({ checked: true });
 * }, 'SchedulerCheck');
 */
export function withCronSecret(handler: UnauthHandler, logContext: string | null = null): UnauthHandler {
  return withErrorHandler(async (request: NextRequest, context: RouteContext) => {
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      return unauthorized('CRON_SECRET non configurato');
    }

    // Support both query param and header
    const querySecret = request.nextUrl?.searchParams?.get('secret');
    const authHeader = request.headers.get('authorization');
    const headerSecret = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    const isValid = querySecret === cronSecret || headerSecret === cronSecret;

    if (!isValid) {
      return unauthorized('Token cron non valido');
    }

    return handler(request, context);
  }, logContext);
}

// =============================================================================
// HUE-SPECIFIC MIDDLEWARE
// =============================================================================

/**
 * Wraps a route handler with Hue-specific error handling
 * Automatically handles HUE_NOT_CONNECTED and NETWORK_TIMEOUT errors
 *
 * @param handler - Route handler function
 * @param logContext - Context for error logging (optional)
 * @returns Wrapped handler
 *
 * @example
 * export const GET = withHueHandler(async (request, context, session) => {
 *   const provider = await HueConnectionStrategy.getProvider();
 *   const lights = await provider.getLights();
 *   return success({ lights: lights.data });
 * }, 'Hue/Lights');
 */
export function withHueHandler(handler: AuthedHandler, logContext: string | null = null): UnauthHandler {
  return withAuthAndErrorHandler(async (request: NextRequest, context: RouteContext, session: Session) => {
    try {
      return await handler(request, context, session);
    } catch (err) {
      const error = err as Error;
      // Handle not connected errors
      if (error.message?.includes('HUE_NOT_CONNECTED')) {
        const { hueNotConnected } = await import('./apiResponse');
        return hueNotConnected();
      }

      // Handle network timeout (local API)
      if (error.message === 'NETWORK_TIMEOUT') {
        const { hueNotOnLocalNetwork } = await import('./apiResponse');
        return hueNotOnLocalNetwork();
      }

      // Re-throw for generic error handling
      throw err;
    }
  }, logContext);
}

// =============================================================================
// IDEMPOTENCY MIDDLEWARE
// =============================================================================

/**
 * Wraps a route handler with idempotency key checking.
 * If Idempotency-Key header is present:
 *   - Checks Firebase RTDB for cached result at `idempotency/results/{key}`
 *   - If found, returns cached result (200) without executing handler
 *   - If not found, executes handler, caches result, returns response
 * If no Idempotency-Key header, executes handler normally (backwards compatible).
 *
 * @param handler - Route handler function
 * @param logContext - Context for error logging (optional)
 * @returns Wrapped handler
 *
 * @example
 * export const POST = withIdempotency(
 *   withAuthAndErrorHandler(async (request, context, session) => {
 *     await executeCommand();
 *     return success({ executed: true });
 *   }, 'StoveIgnite'),
 *   'StoveIgnite'
 * );
 */
export function withIdempotency(handler: AuthedHandler, logContext?: string): AuthedHandler {
  return async (request, context, session) => {
    const idempotencyKey = request.headers.get('Idempotency-Key');

    if (!idempotencyKey) {
      // No key — process normally (backwards compatible)
      return handler(request, context, session);
    }

    // Check for cached result
    const { ref, get, set } = await import('firebase/database');
    const { db } = await import('@/lib/firebase');
    const resultRef = ref(db, `idempotency/results/${idempotencyKey}`);

    try {
      const existing = await get(resultRef);

      if (existing.exists()) {
        const cached = existing.val();
        // Return cached result
        return NextResponse.json(cached.data, { status: cached.status });
      }
    } catch {
      // Firebase access denied or unavailable — skip cache check, execute handler normally
      console.warn(`[Idempotency] Cache check failed for key ${idempotencyKey}`, logContext);
    }

    // Execute handler
    const response = await handler(request, context, session);

    // Cache result (only for successful responses)
    if (response.ok) {
      try {
        const cloned = response.clone();
        const data = await cloned.json();
        await set(resultRef, {
          data,
          status: response.status,
          timestamp: Date.now(),
          expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour TTL (matches client)
        });
      } catch {
        // Cache failure should not break the response
        console.warn(`[Idempotency] Failed to cache result for key ${idempotencyKey}`, logContext);
      }
    }

    return response;
  };
}

// =============================================================================
// HELPER: COMBINE MULTIPLE MIDDLEWARE
// =============================================================================


