import { Auth0Client } from '@auth0/nextjs-auth0/server';

// Auth0 v4 configuration
// Map existing env vars to v4 expected names
const auth0Config = {
  // Extract domain from issuer URL (e.g., "https://pannellostufa.eu.auth0.com" -> "pannellostufa.eu.auth0.com")
  domain: process.env.AUTH0_ISSUER_BASE_URL?.replace(/^https?:\/\//, '') || process.env.AUTH0_DOMAIN,
  clientId: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  appBaseUrl: process.env.AUTH0_BASE_URL || process.env.APP_BASE_URL,
  secret: process.env.AUTH0_SECRET,
};

export const auth0 = new Auth0Client(auth0Config);
