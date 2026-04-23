'use client';

/**
 * API Keys management page (Phase 170 Plan 03).
 *
 * List / create (with one-shot plaintext reveal) / revoke workflows, all
 * backed by `useApiKeys` (Plan 02). The plaintext value of a newly-created
 * key lives in a single `useState` cell and is wiped on every close path
 * (T-170-14 mitigation — see UI-SPEC §"Plaintext key reveal view" rules 1–8).
 *
 * Pattern replay of `app/registry/types/page.tsx` with three local extensions:
 *   1. `is_active` Badge + disabled Revoca on revoked rows.
 *   2. Dedicated reveal `<Modal>` rendered alongside (not nested in) the
 *      create FormModal — avoids FormModal's 800ms success-overlay racing the
 *      reveal swap.
 *   3. SESSION_EXPIRED banner linking back to the login form.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { z } from 'zod';
import { Controller } from 'react-hook-form';
import { Copy, Check } from 'lucide-react';
import type { APIKeyInfo } from '@/types/authProxy';
import SettingsLayout from '@/app/components/SettingsLayout';
import DataTable from '@/app/components/ui/DataTable';
import FormModal from '@/app/components/ui/FormModal';
import ConfirmationDialog from '@/app/components/ui/ConfirmationDialog';
import Modal from '@/app/components/ui/Modal';
import Button from '@/app/components/ui/Button';
import Banner from '@/app/components/ui/Banner';
import Skeleton from '@/app/components/ui/Skeleton';
import Card from '@/app/components/ui/Card';
import Input from '@/app/components/ui/Input';
import Badge from '@/app/components/ui/Badge';
import { Heading, Text } from '@/app/components/ui';
import { useApiKeys } from '@/app/hooks/useApiKeys';
import { useToast } from '@/app/hooks/useToast';
import { formatRelativeTime } from '@/lib/hooks/useRelativeTime';

// --- Zod schema (D-10: name 1-100 chars) -------------------------------------
const createKeySchema = z.object({
  name: z
    .string()
    .min(1, 'Nome obbligatorio')
    .max(100, 'Max 100 caratteri'),
});

type CreateKeyValues = z.infer<typeof createKeySchema>;

export default function ApiKeysPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [keyToRevoke, setKeyToRevoke] = useState<APIKeyInfo | null>(null);
  // Plaintext key reveal state — single instance guarantee (UI-SPEC rule 1).
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [revealedKeyName, setRevealedKeyName] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { keys, loading, error, refetch, create, revoke } = useApiKeys();
  const {
    success: toastSuccess,
    error: toastError,
    warning: toastWarning,
  } = useToast();

  const copyButtonRef = useRef<HTMLButtonElement>(null);

  // UI-SPEC Accessibility: Reveal modal's Copia button receives initial focus.
  useEffect(() => {
    if (revealedKey !== null) {
      const id = window.setTimeout(() => {
        copyButtonRef.current?.focus();
      }, 0);
      return () => window.clearTimeout(id);
    }
  }, [revealedKey]);

  // Single-close-path for plaintext reveal (UI-SPEC rule 2):
  // ALL exit routes (Chiudi / X / Escape / backdrop) funnel through this,
  // and the plaintext is wiped before any other side-effect fires.
  const handleRevealClose = useCallback(() => {
    setRevealedKey(null);
    setRevealedKeyName(null);
    setCopied(false);
    void refetch();
  }, [refetch]);

  // Copy-to-clipboard state machine mirrors app/network/components/CopyableIp.tsx.
  // UI-SPEC rule 4: 2000ms icon swap. Rule 5: no toast on copy.
  const handleCopy = useCallback(async () => {
    if (!revealedKey) return;
    try {
      await navigator.clipboard.writeText(revealedKey);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toastWarning('Impossibile copiare. Seleziona e copia manualmente.');
    }
  }, [revealedKey, toastWarning]);

  // Create-submit handler. The plaintext comes back from useApiKeys.create()
  // as a function return value — the hook itself does NOT retain it (Plan 02
  // design contract). On success we stash it in local state and close the
  // FormModal; the reveal Modal is rendered separately and reads from the
  // same state cell.
  const handleCreate = async (values: CreateKeyValues) => {
    const res = await create(values.name);
    setRevealedKey(res.api_key);
    setRevealedKeyName(res.name);
    setShowCreate(false);
  };

  // Revoke-confirm handler. Toast + refetch are hook-driven (useApiKeys.revoke
  // already refetches on success). `finally` clears the dialog even on failure.
  const handleRevoke = async () => {
    if (!keyToRevoke) return;
    try {
      await revoke(keyToRevoke.id);
      toastSuccess('API key revocata');
    } catch {
      toastError('Errore durante la revoca');
    } finally {
      setKeyToRevoke(null);
    }
  };

  // DataTable columns per UI-SPEC §"DataTable columns" table.
  const columns: ColumnDef<APIKeyInfo>[] = [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }) => (
        <code className="font-mono text-sm text-slate-400">
          {row.original.id}
        </code>
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'name',
      header: 'Nome',
      enableSorting: true,
    },
    {
      accessorKey: 'created_at',
      header: 'Creato',
      cell: ({ row }) => formatRelativeTime(Date.parse(row.original.created_at)),
      enableSorting: true,
    },
    {
      accessorKey: 'last_used_at',
      header: 'Ultimo utilizzo',
      cell: ({ row }) =>
        row.original.last_used_at ? (
          formatRelativeTime(Date.parse(row.original.last_used_at))
        ) : (
          <span className="text-slate-500">Mai usata</span>
        ),
      enableSorting: true,
    },
    {
      accessorKey: 'is_active',
      header: 'Stato',
      cell: ({ row }) => (
        <Badge
          variant={row.original.is_active ? 'ocean' : 'neutral'}
          size="sm"
        >
          {row.original.is_active ? 'Attiva' : 'Revocata'}
        </Badge>
      ),
      enableSorting: false,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button
          variant="danger"
          size="sm"
          disabled={!row.original.is_active}
          onClick={() => setKeyToRevoke(row.original)}
        >
          Revoca
        </Button>
      ),
      enableSorting: false,
    },
  ];

  const isEmpty = !loading && keys.length === 0 && !error;

  return (
    <SettingsLayout title="API Keys" icon="🔑" backHref="/">
      <Text variant="secondary">
        Gestisci le chiavi per accedere alle API.
      </Text>

      {/* Generic load error (non-auth) */}
      {error && error !== 'SESSION_EXPIRED' && (
        <Banner variant="error">{error}</Banner>
      )}

      {/* Session-expired banner — link back to /login?next= (D-04). */}
      {error === 'SESSION_EXPIRED' && (
        <Banner variant="warning">
          Sessione scaduta.{' '}
          <a
            href="/login?next=/settings/api-keys"
            className="underline font-semibold text-warning-100 hover:text-white"
          >
            Accedi
          </a>{' '}
          di nuovo.
        </Banner>
      )}

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <Card variant="glass" className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <Heading level={2} size="lg">
              Chiavi attive
            </Heading>
            <Button
              variant="ember"
              size="sm"
              onClick={() => setShowCreate(true)}
            >
              Crea nuova API key
            </Button>
          </div>

          {isEmpty ? (
            // Custom empty state (DataTable's default is English "No data").
            <div className="py-12 text-center">
              <Heading level={3} size="md" className="mb-2">
                Nessuna API key
              </Heading>
              <Text variant="secondary" size="sm">
                Crea la tua prima chiave per iniziare a usare l&apos;API.
              </Text>
            </div>
          ) : (
            <DataTable columns={columns} data={keys} variant="compact" />
          )}
        </Card>
      )}

      {/* Create modal (only rendered while NO plaintext is being revealed). */}
      <FormModal
        isOpen={showCreate && revealedKey === null}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreate}
        title="Crea nuova API key"
        defaultValues={{ name: '' }}
        validationSchema={createKeySchema}
        submitLabel="Crea"
        cancelLabel="Annulla"
      >
        {({ control }: any) => (
          <Controller
            name="name"
            control={control}
            render={({ field, fieldState }) => (
              <Input
                label="Nome"
                data-field="name"
                autoComplete="off"
                {...field}
                error={fieldState.error?.message}
                placeholder="es. Prod, CI, scripts-home"
              />
            )}
          />
        )}
      </FormModal>

      {/* Plaintext-key reveal modal (UI-SPEC §"Plaintext key reveal view") */}
      <Modal
        isOpen={revealedKey !== null}
        onClose={handleRevealClose}
        size="md"
      >
        <Modal.Header>
          <Modal.Title>API key creata</Modal.Title>
          <Modal.Close />
        </Modal.Header>

        <Banner variant="error" compact>
          Questa chiave è visibile solo ora. Copiala e conservala in un posto
          sicuro — non potrai rivederla.
        </Banner>

        <div className="mt-4 space-y-3">
          <Text size="sm" variant="secondary">
            Nome: <span className="text-slate-200">{revealedKeyName}</span>
          </Text>

          {/*
            The <code> element intentionally has NO aria-live (UI-SPEC rule 7)
            — screen readers must not announce the plaintext automatically.
            `select-all` lets the user click-once to select the whole secret as
            a manual-copy fallback (rule 6).
          */}
          <code
            className="block p-3 rounded-lg bg-slate-800 text-slate-100 font-mono text-sm break-all"
            style={{ userSelect: 'all' }}
          >
            {revealedKey}
          </code>
        </div>

        <Modal.Footer>
          <Button variant="subtle" onClick={handleRevealClose}>
            Chiudi
          </Button>
          <Button ref={copyButtonRef} variant="ember" onClick={handleCopy}>
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copiato
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copia chiave
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Revoke confirmation (UI-SPEC §"Destructive confirmations") */}
      <ConfirmationDialog
        isOpen={keyToRevoke !== null}
        onClose={() => setKeyToRevoke(null)}
        onConfirm={handleRevoke}
        title="Revoca API key"
        description={`Revocare "${keyToRevoke?.name ?? ''}"? L'azione è irreversibile e le applicazioni che usano questa chiave smetteranno di funzionare.`}
        confirmLabel="Revoca"
        cancelLabel="Annulla"
        variant="danger"
      />
    </SettingsLayout>
  );
}
