'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import type { RegistryDevice, RegistryHealthResponse } from '@/types/registry';
import type { PaginatedResponse } from '@/types/common';
import SettingsLayout from '@/app/components/SettingsLayout';
import DataTable from '@/app/components/ui/DataTable';
import Button from '@/app/components/ui/Button';
import Badge from '@/app/components/ui/Badge';
import Banner from '@/app/components/ui/Banner';
import Skeleton from '@/app/components/ui/Skeleton';
import Card from '@/app/components/ui/Card';
import Select from '@/app/components/ui/Select';
import { Text } from '@/app/components/ui';
import { useToast } from '@/app/hooks/useToast';

// --- Constants ---
const PAGE_SIZE = 20;
const PROVIDERS = ['hue', 'netatmo', 'thermorossi', 'dirigera', 'raspi', 'fritzbox'];
const providerOptions = [
  { value: '', label: 'Tutti' },
  ...PROVIDERS.map((p) => ({ value: p, label: p })),
];

// --- Provider badge variant helper (per D-05) ---
function getProviderBadgeVariant(provider: string): 'ocean' | 'ember' | 'neutral' {
  if (provider === 'hue') return 'ocean';
  if (provider === 'netatmo' || provider === 'thermorossi') return 'ember';
  return 'neutral';
}

// --- useRegistryDevices hook (per D-29, D-30) ---
function useRegistryDevices() {
  const [devices, setDevices] = useState<RegistryDevice[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [provider, setProvider] = useState('');

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('limit', String(PAGE_SIZE));
      params.set('offset', String(page * PAGE_SIZE));
      if (provider !== '') {
        params.set('provider_name', provider);
      }
      const res = await fetch(`/api/registry/devices?${params.toString()}`);
      if (!res.ok) throw new Error('Errore nel caricamento dei dispositivi');
      const data = (await res.json()) as PaginatedResponse<RegistryDevice>;
      // Sort client-side by custom_name using Italian locale (per D-07)
      const sorted = [...data.items].sort((a, b) =>
        a.custom_name.localeCompare(b.custom_name, 'it')
      );
      setDevices(sorted);
      setTotalCount(data.total_count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setLoading(false);
    }
  }, [page, provider]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  // Reset page to 0 before changing provider (per D-09, Research Pattern 5)
  const handleProviderChange = useCallback(
    (newProvider: string) => {
      setPage(0);
      setProvider(newProvider);
    },
    []
  );

  return {
    devices,
    totalCount,
    loading,
    error,
    refetch,
    page,
    setPage,
    provider,
    setProvider: handleProviderChange,
  };
}

// --- useRegistryHealth hook (per D-31) ---
function useRegistryHealth() {
  const [health, setHealth] = useState<RegistryHealthResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/registry/health');
      if (!res.ok) return; // silently ignore (health is non-critical)
      const data = (await res.json()) as RegistryHealthResponse;
      setHealth(data);
    } catch {
      // Silently ignore health errors — non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { health, loading, refetch };
}

// --- DeviceRegistryPage component ---
export default function DeviceRegistryPage() {
  const [showRegister, setShowRegister] = useState(false);
  const [deviceToEdit, setDeviceToEdit] = useState<RegistryDevice | null>(null);
  const [deviceToDelete, setDeviceToDelete] = useState<RegistryDevice | null>(null);
  const {
    devices,
    totalCount,
    loading,
    error,
    page,
    setPage,
    provider,
    setProvider,
  } = useRegistryDevices();
  const { health } = useRegistryHealth();
  const { error: toastError } = useToast();

  // Suppress unused variable warnings — these will be wired in plan 02
  void showRegister;
  void deviceToEdit;
  void deviceToDelete;
  void toastError;

  // DataTable column definitions (per D-04)
  const columns: ColumnDef<RegistryDevice>[] = [
    {
      accessorKey: 'custom_name',
      header: 'Nome',
      enableSorting: true,
    },
    {
      accessorKey: 'provider_name',
      header: 'Provider',
      cell: ({ row }) => (
        <Badge variant={getProviderBadgeVariant(row.original.provider_name)} size="sm">
          {row.original.provider_name}
        </Badge>
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'device_type_slug',
      header: 'Tipo',
      cell: ({ row }) => (
        <code className="text-sm font-mono text-slate-400">{row.original.device_type_slug}</code>
      ),
    },
    {
      accessorKey: 'device_id',
      header: 'ID dispositivo',
      cell: ({ row }) => (
        <code className="text-sm font-mono text-slate-400">{row.original.device_id}</code>
      ),
    },
    {
      accessorKey: 'updated_at',
      header: 'Aggiornato',
      cell: ({ row }) =>
        new Date(row.original.updated_at * 1000).toLocaleDateString('it-IT'),
      enableSorting: true,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeviceToEdit(row.original)}
          >
            Modifica
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setDeviceToDelete(row.original)}
          >
            Rimuovi
          </Button>
        </div>
      ),
      enableSorting: false,
    },
  ];

  return (
    <SettingsLayout title="Registro dispositivi" icon="📋" backHref="/registry/types">
      <Text variant="secondary">Gestisci i dispositivi registrati nel sistema</Text>

      {error && <Banner variant="error">{error}</Banner>}

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <Card variant="glass" className="p-4 sm:p-6">
          {/* Health stats inline (per D-11) */}
          {health && (
            <div className="flex items-center gap-6 text-sm text-slate-400 mb-4">
              <span>
                Tipi dispositivo:{' '}
                <strong className="text-slate-200">{health.device_types_count}</strong>
              </span>
              <span>
                Dispositivi registrati:{' '}
                <strong className="text-slate-200">{health.device_registry_count}</strong>
              </span>
            </div>
          )}

          {/* Toolbar: provider filter + register button (per D-08, D-14) */}
          <div className="flex items-center justify-between mb-4">
            <Select
              label="Provider"
              options={providerOptions}
              value={provider}
              onChange={(e) => setProvider(String(e.target.value))}
            />
            <Button variant="ember" size="sm" onClick={() => setShowRegister(true)}>
              Registra dispositivo
            </Button>
          </div>

          {/* Empty state (per D-35) */}
          {devices.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <p>Nessun dispositivo registrato</p>
              <Button
                variant="ember"
                size="sm"
                className="mt-4"
                onClick={() => setShowRegister(true)}
              >
                Registra dispositivo
              </Button>
            </div>
          ) : (
            <DataTable columns={columns} data={devices} variant="compact" />
          )}

          {/* Server-side pagination controls (per D-06, Research Pattern 6) */}
          {totalCount > PAGE_SIZE && (
            <div className="flex items-center justify-between mt-4 text-sm text-slate-400">
              <span>
                Pagina {page + 1} di {Math.ceil(totalCount / PAGE_SIZE)}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 0}
                >
                  Precedente
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={(page + 1) * PAGE_SIZE >= totalCount}
                >
                  Successiva
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </SettingsLayout>
  );
}
