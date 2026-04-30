'use client';

/**
 * useAutomationsList — Phase 180 Plan 08 Task 1
 *
 * Paginated CRUD hook for AutomationRule resources.
 *
 * Responsibilities:
 *  - Paginated GET via automationsProxy.getAutomations
 *  - create/update/remove: proxy call → refetch → Italian success toast (throws on error)
 *  - toggle: optimistic setRules flip; PATCH; rollback on error + error toast (no success toast)
 *
 * No polling (D-25): data is fetched once on mount + on explicit page change.
 */

import { useState, useEffect, useCallback } from 'react';
import type {
  AutomationRule,
  AutomationRuleCreate,
  AutomationRulePatch,
} from '@/types/automations';
import { automationsProxy } from '@/lib/automations/automationsProxy';
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
      const data = await automationsProxy.getAutomations({
        limit: pageSize,
        offset: page * pageSize,
      });
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
        await automationsProxy.createAutomation(body);
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
        await automationsProxy.updateAutomation(String(id), patch);
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
        await automationsProxy.deleteAutomation(String(id));
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
        await automationsProxy.updateAutomation(String(id), {
          enabled: !currentEnabled,
        });
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
