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

import { auth0 } from '@/lib/auth0';
import { unauthorized, handleError } from './apiResponse';

// =============================================================================
// AUTH MIDDLEWARE
// =============================================================================

/**
 * Wraps a route handler with Auth0 authentication
 * Automatically returns 401 if user is not authenticated
 *
 * @param {(request: any, context: any, session: any) => Promise<any>} handler - Route handler function
 *   Handler signature: (request, context, session) => Promise<NextResponse>
 * @returns {(handler: any) => any} Wrapped handler
 *
 * @example
 * export const GET = withAuth(async (request, context, session) => {
 *   console.log('User:', session.user.email);
 *   return success({ user: session.user });
 * });
 */
export function withAuth(handler) {
  return async (request, context) => {
    const session = await auth0.getSession(request);

    if (!session?.user) {
      return unauthorized();
    }

    return handler(request, context, session);
  };
}

/**
 * Wraps a route handler with optional Auth0 authentication
 * Session is passed to handler but not required
 *
 * @param {(request: any, context: any, session: any) => Promise<any>} handler - Route handler function
 *   Handler signature: (request, context, session | null) => Promise<NextResponse>
 * @returns {(handler: any) => any} Wrapped handler
 *
 * @example
 * export const GET = withOptionalAuth(async (request, context, session) => {
 *   if (session?.user) {
 *     return success({ user: session.user });
 *   }
 *   return success({ user: null });
 * });
 */
export function withOptionalAuth(handler) {
  return async (request, context) => {
    const session = await auth0.getSession(request);
    return handler(request, context, session);
  };
}

// =============================================================================
// ERROR HANDLING MIDDLEWARE
// =============================================================================

/**
 * Wraps a route handler with try-catch error handling
 * Automatically converts errors to appropriate API responses
 *
 * @param {(request: any, context: any, session: any) => Promise<any>} handler - Route handler function
 * @param {string} logContext - Context for error logging (optional)
 * @returns {(handler: any) => any} Wrapped handler
 *
 * @example
 * export const GET = withErrorHandler(async (request, context) => {
 *   const data = await riskyOperation();
 *   return success({ data });
 * }, 'GetData');
 */
export function withErrorHandler(handler, logContext = null) {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      return handleError(error, logContext);
    }
  };
}

// =============================================================================
// COMBINED MIDDLEWARE
// =============================================================================

/**
 * Combines auth and error handling middleware
 * Most common pattern for protected API routes
 *
 * @param {(request: any, context: any, session: any) => Promise<any>} handler - Route handler function
 *   Handler signature: (request, context, session) => Promise<NextResponse>
 * @param {string} logContext - Context for error logging (optional)
 * @returns {(handler: any) => any} Wrapped handler
 *
 * @example
 * export const GET = withAuthAndErrorHandler(async (request, context, session) => {
 *   const data = await getDataForUser(session.user.sub);
 *   return success({ data });
 * }, 'UserData');
 */
export function withAuthAndErrorHandler(handler, logContext = null) {
  return withErrorHandler(withAuth(handler), logContext);
}

/**
 * Alias for withAuthAndErrorHandler
 * Shorter name for common use case
 */
export const protect = withAuthAndErrorHandler;

// =============================================================================
// ADMIN MIDDLEWARE
// =============================================================================

/**
 * Wraps a route handler with admin authorization
 * Checks if user is the admin user defined in ADMIN_USER_ID env var
 *
 * @param {(request: any, context: any, session: any) => Promise<any>} handler - Route handler function
 * @param {string} logContext - Context for error logging (optional)
 * @returns {(handler: any) => any} Wrapped handler
 *
 * @example
 * export const POST = withAdmin(async (request, context, session) => {
 *   await adminOnlyOperation();
 *   return success({ done: true });
 * }, 'AdminAction');
 */
export function withAdmin(handler, logContext = null) {
  return withErrorHandler(async (request, context) => {
    const session = await auth0.getSession(request);

    if (!session?.user) {
      return unauthorized();
    }

    const adminUserId = process.env.ADMIN_USER_ID;
    if (!adminUserId || session.user.sub !== adminUserId) {
      return unauthorized('Accesso admin richiesto');
    }

    return handler(request, context, session);
  }, logContext);
}

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
 * @param {(request: any, context: any, session: any) => Promise<any>} handler - Route handler function
 * @param {string} logContext - Context for error logging (optional)
 * @returns {(handler: any) => any} Wrapped handler
 *
 * @example
 * export const GET = withCronSecret(async (request, context) => {
 *   await schedulerCheck();
 *   return success({ checked: true });
 * }, 'SchedulerCheck');
 */
export function withCronSecret(handler, logContext = null) {
  return withErrorHandler(async (request, context) => {
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
 * @param {(request: any, context: any, session: any) => Promise<any>} handler - Route handler function
 * @param {string} logContext - Context for error logging (optional)
 * @returns {(handler: any) => any} Wrapped handler
 *
 * @example
 * export const GET = withHueHandler(async (request, context, session) => {
 *   const provider = await HueConnectionStrategy.getProvider();
 *   const lights = await provider.getLights();
 *   return success({ lights: lights.data });
 * }, 'Hue/Lights');
 */
export function withHueHandler(handler, logContext = null) {
  return withAuthAndErrorHandler(async (request, context, session) => {
    try {
      return await handler(request, context, session);
    } catch (err) {
      // Handle not connected errors
      if (err.message?.includes('HUE_NOT_CONNECTED')) {
        const { hueNotConnected } = await import('./apiResponse');
        return hueNotConnected();
      }

      // Handle network timeout (local API)
      if (err.message === 'NETWORK_TIMEOUT') {
        const { hueNotOnLocalNetwork } = await import('./apiResponse');
        return hueNotOnLocalNetwork();
      }

      // Re-throw for generic error handling
      throw err;
    }
  }, logContext);
}

// =============================================================================
// HELPER: COMBINE MULTIPLE MIDDLEWARE
// =============================================================================

/**
 * Combines multiple middleware functions
 * Executes from left to right (first middleware wraps outermost)
 *
 * @param  {...((...args: any[]) => any)} middlewares - Middleware functions
 * @returns {(handler: any) => any} Combined middleware
 *
 * @example
 * const customMiddleware = compose(withErrorHandler, withAuth, withRateLimit);
 * export const GET = customMiddleware(async (request, context, session) => {
 *   return success({ data });
 * });
 */
export function compose(...middlewares) {
  return (handler) => {
    return middlewares.reduceRight(
      (acc, middleware) => middleware(acc),
      handler
    );
  };
}

// =============================================================================
// EXPORT DEFAULT OBJECT
// =============================================================================

const middleware = {
  // Auth
  withAuth,
  withOptionalAuth,

  // Error handling
  withErrorHandler,

  // Combined
  withAuthAndErrorHandler,
  protect,

  // Special
  withAdmin,
  withCronSecret,
  withHueHandler,

  // Utility
  compose,
};

export default middleware;
