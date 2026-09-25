/**
 * First-party session cookie (roadmap Fase 8 — replaces the Auth0 session).
 *
 * The cookie holds the backend token pair plus the user, sealed with AES-GCM
 * (confidentiality + integrity) using only Web Crypto, so it works both in the
 * Edge middleware and in Node route handlers.
 *
 * Key: SHA-256 of SESSION_SECRET (falls back to AUTH0_SECRET, already set on
 * Vercel, until Auth0 is removed in 8.9).
 */

export const SESSION_COOKIE = 'ps_session';

/** Refresh the access token this many seconds before it expires. */
export const ACCESS_REFRESH_LEEWAY_S = 60;

export interface SessionUser {
  id: number;
  email: string;
  name: string | null;
  role: 'admin' | 'user' | 'test';
  /** Stable key for per-user data (Firebase): legacy Auth0 sub, else `user:<id>`. */
  sub: string;
}

export interface StoredSession {
  accessToken: string;
  refreshToken: string;
  /** Access token expiry, epoch seconds. */
  accessExpiresAt: number;
  /** Refresh token expiry, epoch seconds (= session end). */
  refreshExpiresAt: number;
  user: SessionUser;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET || process.env.AUTH0_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('Session not configured: set SESSION_SECRET (>= 32 chars)');
  }
  return secret;
}

async function deriveKey(secret: string): Promise<CryptoKey> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(secret));
  return crypto.subtle.importKey('raw', digest, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value: string): Uint8Array {
  const b64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

export async function sealSession(session: StoredSession, secret = getSessionSecret()): Promise<string> {
  const key = await deriveKey(secret);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(JSON.stringify(session)))
  );
  const out = new Uint8Array(iv.length + ciphertext.length);
  out.set(iv);
  out.set(ciphertext, iv.length);
  return toBase64Url(out);
}

/** Returns the session, or null if the cookie is missing, tampered with or unreadable. */
export async function unsealSession(
  value: string | undefined | null,
  secret = getSessionSecret()
): Promise<StoredSession | null> {
  if (!value) return null;
  try {
    const bytes = fromBase64Url(value);
    if (bytes.length < 13) return null;
    const key = await deriveKey(secret);
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: bytes.slice(0, 12) },
      key,
      bytes.slice(12)
    );
    return JSON.parse(decoder.decode(plain)) as StoredSession;
  } catch {
    return null;
  }
}

export function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

/** The session is usable until the refresh token expires. */
export function isSessionAlive(session: StoredSession, now = nowSeconds()): boolean {
  return session.refreshExpiresAt > now;
}

export function needsAccessRefresh(session: StoredSession, now = nowSeconds()): boolean {
  return session.accessExpiresAt - ACCESS_REFRESH_LEEWAY_S <= now;
}

export function sessionCookieOptions(session: StoredSession) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: Math.max(0, session.refreshExpiresAt - nowSeconds()),
  };
}
