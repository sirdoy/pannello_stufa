'use client';

/**
 * useAutomationsList — Phase 180 Plan 08 Task 1
 *
 * Paginated CRUD hook for AutomationRule resources.
 *
 * Responsibilities:
 *  - Paginated GET via /api/v1/automations
 *  - create/update/remove: HTTP call → refetch → Italian success toast (throws on error)
 *  - toggle: optimistic setRules flip; PATCH; rollback on error + error toast (no success toast)
 *
 * No polling (D-25): data is fetched once on mount + on explicit page change.
 *
 * BL-01 (REVIEW iteration 2): All HTTP calls go through Next.js API routes
 * (`/api/v1/automations*`). The previous implementation imported `automationsProxy`
 * directly and crashed in the browser because `haClient` reads `process.env.HA_API_URL`
 * which is `undefined` in the client bundle. Every other client hook in the
 * codebase uses `fetch('/api/v1/...')`; this hook now matches that pattern.
 */

import { useState, useEffect, useCallback } from 'react';
import type {
  AutomationRule,
  AutomationRuleCreate,
  AutomationRulePatch,
} from '@/types/automations';
import type { PaginatedResponse } from '@/types/common';
import { useToast } from '@/app/hooks/useToast';

export interface UseAutomationsListOptions {
  pageSize?: number;
}

export interface UseAutomationsListResult {
  rules: AutomationRule[];
  totalCount: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  page: number;
  setPage: (p: number) => void;
  create: (body: AutomationRuleCreate) => Promise<void>;
  update: (id: number, patch: AutomationRulePatch) => Promise<void>;
  remove: (id: number) => Promise<void>;
  toggle: (id: number, currentEnabled: boolean) => Promise<void>;
}

const DEFAULT_PAGE_SIZE = 20;

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const data = (await res.json()) as { message?: string; error?: string };
    return data.message ?? data.error ?? fallback;
  } catch {
    return fallback;
  }
}

export function useAutomationsList(
  options: UseAutomationsListOptions = {}
): UseAutomationsListResult {
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE;
  const { success: toastSuccess, error: toastError } = useToast();

  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/v1/automations?limit=${pageSize}&offset=${page * pageSize}`
      );
      if (!res.ok) {
        throw new Error(await readErrorMessage(res, 'Errore nel caricamento'));
      }
      const data = (await res.json()) as PaginatedResponse<AutomationRule>;
      setRules(data.items);
      setTotalCount(data.total_count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const create = useCallback(
    async (body: AutomationRuleCreate) => {
      try {
        const res = await fetch('/api/v1/automations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          throw new Error(await readErrorMessage(res, 'Errore durante il salvataggio'));
        }
        toastSuccess('Automazione creata');
        await refetch();
      } catch (err) {
        toastError(
          err instanceof Error ? err.message : 'Errore durante il salvataggio'
        );
        throw err;
      }
    },
    [refetch, toastSuccess, toastError]
  );

  const update = useCallback(
    async (id: number, patch: AutomationRulePatch) => {
      try {
        const res = await fetch(`/api/v1/automations/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        });
        if (!res.ok) {
          throw new Error(await readErrorMessage(res, 'Errore durante il salvataggio'));
        }
        toastSuccess('Automazione aggiornata');
        await refetch();
      } catch (err) {
        toastError(
          err instanceof Error ? err.message : 'Errore durante il salvataggio'
        );
        throw err;
      }
    },
    [refetch, toastSuccess, toastError]
  );

  const remove = useCallback(
    async (id: number) => {
      try {
        const res = await fetch(`/api/v1/automations/${id}`, {
          method: 'DELETE',
        });
        if (!res.ok) {
          throw new Error(await readErrorMessage(res, "Errore durante l'eliminazione"));
        }
        toastSuccess('Automazione eliminata');
        await refetch();
      } catch (err) {
        toastError(
          err instanceof Error ? err.message : "Errore durante l'eliminazione"
        );
        throw err;
      }
    },
    [refetch, toastSuccess, toastError]
  );

  const toggle = useCallback(
    async (id: number, currentEnabled: boolean) => {
      // Optimistic update
      setRules((prev) =>
        prev.map((r) => (r.id === id ? { ...r, enabled: !currentEnabled } : r))
      );
      try {
        const res = await fetch(`/api/v1/automations/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled: !currentEnabled }),
        });
        if (!res.ok) {
          throw new Error(await readErrorMessage(res, 'Errore durante il salvataggio'));
        }
        // No success toast — InlineToggle is its own visual feedback
      } catch (err) {
        // Rollback
        setRules((prev) =>
          prev.map((r) => (r.id === id ? { ...r, enabled: currentEnabled } : r))
        );
        toastError(
          err instanceof Error ? err.message : 'Errore durante il salvataggio'
        );
      }
    },
    [toastError]
  );

  return {
    rules,
    totalCount,
    loading,
    error,
    refetch,
    page,
    setPage,
    create,
    update,
    remove,
    toggle,
  };
}
