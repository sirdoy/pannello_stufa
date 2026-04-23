'use client';

import { useState, useCallback } from 'react';

/**
 * Sentinel error codes surfaced to the login UI.
 *
 * The component maps each code to user-facing Italian copy (see UI-SPEC
 * §Copywriting Contract). The hook itself never stores translated strings.
 */
export type LoginError =
  | 'RATE_LIMITED'
  | 'INVALID_CREDENTIALS'
  | 'SESSION_EXPIRED'
  | 'NETWORK_ERROR'
  | 'SERVER_ERROR';

export interface LoginPayload {
  username: string;
  password: string;
}

export interface UseLoginReturn {
  authenticated: boolean;
  loading: boolean;
  error: LoginError | null;
  /**
   * Date.now() sentinel — milliseconds since epoch after which further login
   * attempts are allowed again. `0` means "not rate-limited".
   */
  rateLimitedUntil: number;
  /**
   * POST /api/auth/login. When called with no argument, sends an empty JSON
   * object body so the server-side env-var fallback (D-15) triggers.
   */
  login: (payload?: LoginPayload) => Promise<boolean>;
  /** POST /api/auth/logout with empty body. */
  logout: () => Promise<void>;
}

/** 30s client-side lockout window after a 429 from /api/auth/login (D-18). */
const RATE_LIMIT_WINDOW_MS = 30_000;

export function useLogin(): UseLoginReturn {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<LoginError | null>(null);
  const [rateLimitedUntil, setRateLimitedUntil] = useState(0);

  const login = useCallback(
    async (payload?: LoginPayload): Promise<boolean> => {
      // Client-side lockout: short-circuit without hitting the network.
      if (rateLimitedUntil > Date.now()) {
        setError('RATE_LIMITED');
        return false;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload ?? {}),
        });

        if (res.ok) {
          setAuthenticated(true);
          return true;
        }

        if (res.status === 429) {
          setError('RATE_LIMITED');
          setRateLimitedUntil(Date.now() + RATE_LIMIT_WINDOW_MS);
          return false;
        }

        if (res.status === 401) {
          setError('INVALID_CREDENTIALS');
          return false;
        }

        setError('SERVER_ERROR');
        return false;
      } catch {
        setError('NETWORK_ERROR');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [rateLimitedUntil],
  );

  const logout = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      setAuthenticated(false);
      setError(null);
    } catch {
      setError('NETWORK_ERROR');
    } finally {
      setLoading(false);
    }
  }, []);

  return { authenticated, loading, error, rateLimitedUntil, login, logout };
}
