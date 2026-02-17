import { Auth0Client } from '@auth0/nextjs-auth0/server';
import { NextRequest, NextResponse } from 'next/server';

// =============================================================================
// DEV BYPASS
// =============================================================================

const BYPASS_AUTH = process.env.BYPASS_AUTH === 'true';
const DEV_USER_ID = 'local-dev-user';

const MOCK_SESSION = {
  user: {
    sub: DEV_USER_ID,
    email: 'dev@localhost',
    name: 'Local Dev User',
    nickname: 'dev',
    picture: '',
  },
  accessToken: 'mock-access-token',
  tokenType: 'Bearer',
};

// =============================================================================
// AUTH0 CLIENT
// =============================================================================

// Auth0 v4 configuration
// Map existing env vars to v4 expected names
const issuerBaseUrl = process.env.AUTH0_ISSUER_BASE_URL;
const domain = issuerBaseUrl?.replace(/^https?:\/\//, '') || process.env.AUTH0_DOMAIN;

// Guard config construction so it doesn't throw when env vars are missing in bypass mode
const auth0Config = BYPASS_AUTH ? {} : {
  domain,
  clientId: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  appBaseUrl: process.env.AUTH0_BASE_URL || process.env.APP_BASE_URL,
  secret: process.env.AUTH0_SECRET,

  // Session configuration (REQUIRED for persistent cookies)
  session: {
    name: 'appSession',
    rolling: true,
    rollingDuration: 24 * 60 * 60,  // 1 day (seconds)
    absoluteDuration: 7 * 24 * 60 * 60,  // 7 days (seconds)
    cookie: {
      httpOnly: true,
      // secure: false for localhost, true for production
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
    }
  },

  // Routes configuration
  routes: {
    login: '/auth/login',
    logout: '/auth/logout',
    callback: '/auth/callback',
    postLogoutRedirect: '/auth/login',
  },

  // Explicit OIDC discovery configuration to avoid fetch failures in middleware
  // This prevents automatic discovery requests that can fail in Edge runtime
  discovery: {
    authorization_endpoint: `${issuerBaseUrl}/authorize`,
    token_endpoint: `${issuerBaseUrl}/oauth/token`,
    userinfo_endpoint: `${issuerBaseUrl}/userinfo`,
    jwks_uri: `${issuerBaseUrl}/.well-known/jwks.json`,
    issuer: issuerBaseUrl,
  }
};

// When BYPASS_AUTH=true, export a stub that returns MOCK_SESSION without calling real Auth0.
// This ensures auth0.getSession() in server pages returns the mock session without any
// changes to those pages.
export const auth0 = BYPASS_AUTH
  ? ({ getSession: async () => MOCK_SESSION } as unknown as Auth0Client)
  : new Auth0Client(auth0Config);

/** Route context interface */
interface RouteContext {
  params: Promise<Record<string, string>>;
}

/**
 * Wrapper for App Router API routes that require authentication.
 * Fixes TypeScript compatibility issue with auth0.withApiAuthRequired.
 *
 * Usage:
 *   export const GET = withAuth(async (request) => { ... });
 *   export const POST = withAuth(async (request) => { ... });
 *
 * @param handler - Async function that receives NextRequest
 * @returns Wrapped handler compatible with App Router
 */
function withAuth(
  handler: (request: NextRequest, context: RouteContext) => Promise<NextResponse>
): (request: NextRequest, context: RouteContext) => Promise<NextResponse> {
  return async function wrappedHandler(request: NextRequest, context: RouteContext): Promise<NextResponse> {
    try {
      const session = await auth0.getSession(request);
      if (!session?.user) {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'Authentication required' },
          { status: 401 }
        );
      }
      // Attach session to request for convenience
      (request as NextRequest & { auth?: unknown }).auth = session;
      return handler(request, context);
    } catch (error) {
      return NextResponse.json(
        { error: 'Authentication error', message: (error as Error).message },
        { status: 401 }
      );
    }
  };
}
