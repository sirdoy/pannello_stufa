import { Auth0Client } from '@auth0/nextjs-auth0/server';

// Auth0 v4 configuration
// Map existing env vars to v4 expected names
const issuerBaseUrl = process.env.AUTH0_ISSUER_BASE_URL;
const domain = issuerBaseUrl?.replace(/^https?:\/\//, '') || process.env.AUTH0_DOMAIN;

const auth0Config = {
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
      sameSite: 'lax',
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

export const auth0 = new Auth0Client(auth0Config);
