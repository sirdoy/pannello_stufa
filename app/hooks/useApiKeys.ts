'use client';

import { useState, useCallback, useEffect } from 'react';
import type {
  APIKeyInfo,
  APIKeyResponse,
  APIKeyListResponse,
} from '@/types/authProxy';

/**
 * Errors surfaced by useApiKeys.
 *
 * - `SESSION_EXPIRED`: HTTP 401 from any api-keys call — caller should prompt
 *   re-login (Wave 3 page shows a re-auth banner).
 * - Italian literal: load-error fallback; matches UI-SPEC §Error states copy.
 */
export type ApiKeysError =
  | 'SESSION_EXPIRED'
  | 'Errore nel caricamento delle API key';

export interface UseApiKeysReturn {
  keys: APIKeyInfo[];
  loading: boolean;
  error: ApiKeysError | null;
  refetch: () => Promise<void>;
  /**
   * Creates a new API key on the backend. Returns the plaintext value
   * (`api_key` field) so the caller can show it once in the reveal modal.
   *
   * The hook does NOT retain the plaintext and does NOT auto-refetch after
   * create — the caller owns the reveal-modal lifecycle and calls `refetch()`
   * after the modal closes (T-170-14 mitigation; Wave 3 depends on this).
   */
  create: (name: string) => Promise<APIKeyResponse>;
  /**
   * Revokes an API key by id. Treats HTTP 404 as already-revoked (silent
   * success). Auto-refetches the list on completion.
   */
  revoke: (id: number) => Promise<void>;
}

/**
 * CRUD hook for the authenticated user's API keys.
 *
 * Auto-fetches on mount. Consumes the Plan 01 proxy routes:
 * - GET  /api/auth/api-keys        → `{keys, count}` (NextResponse.json)
 * - POST /api/auth/api-keys        → `{data: APIKeyResponse}` (created() wrapper)
 * - DELETE /api/auth/api-keys/{id} → 204 (or 404 if already revoked)
 */
export function useApiKeys(): UseApiKeysReturn {
  const [keys, setKeys] = useState<APIKeyInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiKeysError | null>(null);

  const refetch = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/api-keys', { method: 'GET' });
      if (res.status === 401) {
        setError('SESSION_EXPIRED');
        setKeys([]);
        return;
      }
      if (!res.ok) {
        setError('Errore nel caricamento delle API key');
        return;
      }
      const data = (await res.json()) as APIKeyListResponse;
      setKeys(data.keys);
    } catch {
      setError('Errore nel caricamento delle API key');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const create = useCallback(
    async (name: string): Promise<APIKeyResponse> => {
      const res = await fetch('/api/auth/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        throw new Error('Errore durante la creazione della chiave');
      }
      const wrapped = (await res.json()) as { data: APIKeyResponse };
      return wrapped.data;
    },
    [],
  );

  const revoke = useCallback(
    async (id: number): Promise<void> => {
      const res = await fetch(`/api/auth/api-keys/${id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 404) {
        throw new Error('Errore durante la revoca');
      }
      // 204 or 404 (already-revoked) — refetch list to reflect server state.
      await refetch();
    },
    [refetch],
  );

  return { keys, loading, error, refetch, create, revoke };
}
