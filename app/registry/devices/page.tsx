'use client';

import { useState, useEffect, useCallback } from 'react';
import { z } from 'zod';
import { Controller, useWatch } from 'react-hook-form';
import type { ColumnDef } from '@tanstack/react-table';
import type { RegistryDevice, RegistryHealthResponse, DeviceCreate, DeviceUpdate, DeviceType } from '@/types/registry';
import type { PaginatedResponse } from '@/types/common';
import SettingsLayout from '@/app/components/SettingsLayout';
import DataTable from '@/app/components/ui/DataTable';
import Button from '@/app/components/ui/Button';
import Badge from '@/app/components/ui/Badge';
import Banner from '@/app/components/ui/Banner';
import Skeleton from '@/app/components/ui/Skeleton';
import Card from '@/app/components/ui/Card';
import Select from '@/app/components/ui/Select';
import Input from '@/app/components/ui/Input';
import FormModal from '@/app/components/ui/FormModal';
import ConfirmationDialog from '@/app/components/ui/ConfirmationDialog';
import { Text } from '@/app/components/ui';
import { useToast } from '@/app/hooks/useToast';

// --- Constants ---
const PAGE_SIZE = 20;
const PROVIDERS = ['hue', 'netatmo', 'thermorossi', 'dirigera', 'raspi', 'fritzbox'];
const PROVIDER_ALL = 'all';
const providerOptions = [
  { value: PROVIDER_ALL, label: 'Tutti' },
  ...PROVIDERS.map((p) => ({ value: p, label: p })),
];

// --- Zod schemas (per D-16) ---
const registerSchema = z.object({
  provider_name: z.string().min(1, 'Provider obbligatorio').max(64),
  device_id: z.string().min(1, 'ID dispositivo obbligatorio').max(256),
  custom_name: z.string().min(1, 'Nome obbligatorio').max(128),
  device_type_slug: z.string().min(1, 'Tipo obbligatorio').max(64),
});

const updateSchema = z.object({
  custom_name: z.string().min(1, 'Nome obbligatorio').max(128),
  device_type_slug: z.string().min(1, 'Tipo obbligatorio').max(64),
});

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
  const [provider, setProvider] = useState(PROVIDER_ALL);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('limit', String(PAGE_SIZE));
      params.set('offset', String(page * PAGE_SIZE));
      if (provider !== PROVIDER_ALL) {
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

// --- Provider device ID → name mapping per endpoint ---
interface ProviderDevice {
  device_id: string;
  name: string;
}

async function fetchProviderDevices(provider: string): Promise<ProviderDevice[]> {
  try {
    switch (provider) {
      case 'hue': {
        const res = await fetch('/api/v1/hue/lights');
        if (!res.ok) return [];
        const json = (await res.json()) as { lights: { light_id: string; name: string }[] };
        return (json.lights ?? []).map(l => ({ device_id: l.light_id, name: l.name }));
      }
      case 'netatmo': {
        const res = await fetch('/api/netatmo/homesdata');
        if (!res.ok) return [];
        const json = (await res.json()) as { success: boolean; modules: { id: string; name: string }[] };
        return (json.modules ?? []).map(m => ({ device_id: m.id, name: m.name }));
      }
      case 'fritzbox': {
        const res = await fetch('/api/fritzbox/devices');
        if (!res.ok) return [];
        const json = (await res.json()) as { success: boolean; devices: { mac: string; name: string; ip: string }[] };
        return (json.devices ?? [])
          .map(d => ({ device_id: d.mac || d.ip, name: d.name || d.mac || d.ip }))
          .filter(d => d.device_id);
      }
      case 'thermorossi':
        return [{ device_id: 'stove-1', name: 'Stufa Thermorossi' }];
      case 'raspi':
        return [{ device_id: 'raspi-1', name: 'Raspberry Pi' }];
      default:
        return [];
    }
  } catch {
    return [];
  }
}

/** Fetches available device IDs from the selected provider */
function useProviderDevices(provider: string) {
  const [devices, setDevices] = useState<ProviderDevice[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!provider || provider === PROVIDER_ALL) {
      setDevices([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void fetchProviderDevices(provider).then(result => {
      if (!cancelled) {
        setDevices(result);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [provider]);

  return { devices, loading };
}

// --- useRegisteredDeviceIds: fetches all registered device_ids grouped by provider ---
function useRegisteredDeviceIds() {
  const [byProvider, setByProvider] = useState<Record<string, Set<string>>>({});
  const [loaded, setLoaded] = useState(false);

  const refetch = useCallback(async () => {
    try {
      // Fetch all registered devices (no pagination limit)
      const res = await fetch('/api/registry/devices?limit=1000');
      if (!res.ok) return;
      const data = (await res.json()) as PaginatedResponse<RegistryDevice>;
      const map: Record<string, Set<string>> = {};
      for (const d of data.items) {
        if (!map[d.provider_name]) map[d.provider_name] = new Set();
        map[d.provider_name]!.add(d.device_id);
      }
      setByProvider(map);
    } catch { /* non-critical */ }
    setLoaded(true);
  }, []);

  useEffect(() => { void refetch(); }, [refetch]);

  return { byProvider, loaded, refetch };
}

// --- Preload all provider devices to determine which providers still have unregistered devices ---
function useAvailableProviders(registeredByProvider: Record<string, Set<string>>, registeredLoaded: boolean) {
  const [availableProviders, setAvailableProviders] = useState<string[]>(PROVIDERS);
  const [allRegistered, setAllRegistered] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!registeredLoaded) return;
    let cancelled = false;
    setLoading(true);

    void (async () => {
      const available: string[] = [];
      for (const provider of PROVIDERS) {
        const allDevices = await fetchProviderDevices(provider);
        const registered = registeredByProvider[provider] ?? new Set();
        const unregistered = allDevices.filter(d => !registered.has(d.device_id));
        if (unregistered.length > 0) {
          available.push(provider);
        }
      }
      if (!cancelled) {
        setAvailableProviders(available);
        setAllRegistered(available.length === 0);
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [registeredByProvider, registeredLoaded]);

  return { availableProviders, allRegistered, loading };
}

// --- useDeviceTypesForSelect hook (per D-32) ---
function useDeviceTypesForSelect() {
  const [types, setTypes] = useState<DeviceType[]>([]);
  const refetch = useCallback(async () => {
    try {
      const res = await fetch('/api/registry/types');
      if (!res.ok) return;
      setTypes((await res.json()) as DeviceType[]);
    } catch { /* non-critical */ }
  }, []);
  useEffect(() => { void refetch(); }, [refetch]);
  return { types };
}

// --- RegisterFormFields: watches provider, fetches available devices ---
function RegisterFormFields({ control, setValue, deviceTypes, availableProviders, registeredByProvider }: {
  control: any;
  setValue: any;
  deviceTypes: DeviceType[];
  availableProviders: string[];
  registeredByProvider: Record<string, Set<string>>;
}) {
  const selectedProvider = useWatch({ control, name: 'provider_name' }) as string;
  const { devices: providerDevices, loading: devicesLoading } = useProviderDevices(selectedProvider);

  // Filter out already-registered devices
  const registered = registeredByProvider[selectedProvider] ?? new Set();
  const unregisteredDevices = providerDevices.filter(d => !registered.has(d.device_id));

  // Build options for device_id Select
  const deviceIdOptions = unregisteredDevices.map(d => ({
    value: d.device_id,
    label: `${d.name} (${d.device_id})`,
  }));

  // Show Select only when devices are loaded and available
  const showDeviceSelect = deviceIdOptions.length > 0 && !devicesLoading;

  return (
    <>
      <Controller name="provider_name" control={control} render={({ field }) => (
        <Select
          label="Provider"
          options={availableProviders.map(p => ({ value: p, label: p }))}
          value={field.value}
          onChange={(e) => {
            const newProvider = String(e.target.value);
            field.onChange(newProvider);
            // Reset dependent fields when provider changes
            setValue('device_id', '', { shouldValidate: false });
            setValue('custom_name', '', { shouldValidate: false });
          }}
        />
      )} />

      {showDeviceSelect ? (
        <Controller name="device_id" control={control} render={({ field }) => (
          <Select
            label="Dispositivo"
            placeholder="Seleziona dispositivo..."
            options={deviceIdOptions}
            value={field.value}
            onChange={(e) => {
              const id = String(e.target.value);
              field.onChange(id);
              // Auto-fill custom_name from provider device name
              const match = providerDevices.find(d => d.device_id === id);
              if (match) {
                setValue('custom_name', match.name);
              }
            }}
          />
        )} />
      ) : (
        <Controller name="device_id" control={control} render={({ field, fieldState }) => (
          <Input
            label={devicesLoading ? 'ID dispositivo (caricamento...)' : 'ID dispositivo'}
            {...field}
            error={fieldState.error?.message}
            placeholder={selectedProvider ? 'es. 5' : 'Seleziona prima un provider'}
            disabled={!selectedProvider || devicesLoading}
          />
        )} />
      )}

      <Controller name="custom_name" control={control} render={({ field, fieldState }) => (
        <Input label="Nome" {...field} error={fieldState.error?.message} placeholder="es. Lampada Soggiorno" />
      )} />

      <Controller name="device_type_slug" control={control} render={({ field }) => (
        <Select label="Tipo" options={deviceTypes.map(t => ({ value: t.slug, label: t.label }))} value={field.value} onChange={(e) => field.onChange(String(e.target.value))} />
      )} />
    </>
  );
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
    refetch,
    page,
    setPage,
    provider,
    setProvider,
  } = useRegistryDevices();
  const { health, refetch: healthRefetch } = useRegistryHealth();
  const { types: deviceTypes } = useDeviceTypesForSelect();
  const { byProvider: registeredByProvider, loaded: registeredLoaded, refetch: registeredRefetch } = useRegisteredDeviceIds();
  const { availableProviders, allRegistered } = useAvailableProviders(registeredByProvider, registeredLoaded);
  const { success: toastSuccess, error: toastError } = useToast();

  // --- Mutation handlers ---

  // handleRegister (per D-17, D-18, D-19)
  const handleRegister = useCallback(async (data: DeviceCreate) => {
    const res = await fetch('/api/registry/devices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.status === 409) throw new Error('Dispositivo già registrato per questo provider');
    if (res.status === 422) throw new Error('Tipo dispositivo sconosciuto');
    if (!res.ok) throw new Error('Errore durante la registrazione');
    toastSuccess('Dispositivo registrato');
    await refetch();
    await healthRefetch();
    await registeredRefetch();
  }, [refetch, healthRefetch, registeredRefetch, toastSuccess]);

  // handleUpdate (per D-23, D-24)
  const handleUpdate = useCallback(async (data: DeviceUpdate) => {
    if (!deviceToEdit) return;
    const res = await fetch(`/api/registry/devices/${deviceToEdit.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.status === 404) {
      toastError('Dispositivo non trovato');
      setDeviceToEdit(null);
      await refetch();
      return;
    }
    if (!res.ok) throw new Error('Errore durante la modifica');
    toastSuccess('Dispositivo aggiornato');
    await refetch();
  }, [deviceToEdit, refetch, toastSuccess, toastError]);

  // handleUnregister (per D-27, D-28)
  const handleUnregister = useCallback(async () => {
    if (!deviceToDelete) return;
    const res = await fetch(`/api/registry/devices/${deviceToDelete.id}`, {
      method: 'DELETE',
    });
    if (res.status === 404) {
      toastError('Dispositivo già rimosso');
      setDeviceToDelete(null);
      await refetch();
      await healthRefetch();
      return;
    }
    if (!res.ok) {
      toastError('Errore durante la rimozione');
      setDeviceToDelete(null);
      return;
    }
    toastSuccess('Dispositivo rimosso');
    setDeviceToDelete(null);
    await refetch();
    await healthRefetch();
    await registeredRefetch();
  }, [deviceToDelete, refetch, healthRefetch, registeredRefetch, toastSuccess, toastError]);

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
            {!allRegistered && (
              <Button variant="ember" size="sm" onClick={() => setShowRegister(true)}>
                Registra dispositivo
              </Button>
            )}
          </div>

          {/* Empty state (per D-35) */}
          {devices.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <p>Nessun dispositivo registrato</p>
              {!allRegistered && (
                <Button
                  variant="ember"
                  size="sm"
                  className="mt-4"
                  onClick={() => setShowRegister(true)}
                >
                  Registra dispositivo
                </Button>
              )}
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

          {/* Register FormModal (per D-14, D-15) */}
          <FormModal
            isOpen={showRegister}
            onClose={() => setShowRegister(false)}
            onSubmit={handleRegister}
            title="Registra dispositivo"
            defaultValues={{ provider_name: '', device_id: '', custom_name: '', device_type_slug: '' }}
            validationSchema={registerSchema}
            submitLabel="Registra"
            cancelLabel="Annulla"
          >
            {({ control, setValue }: any) => (
              <RegisterFormFields
                control={control}
                setValue={setValue}
                deviceTypes={deviceTypes}
                availableProviders={availableProviders}
                registeredByProvider={registeredByProvider}
              />
            )}
          </FormModal>

          {/* Update FormModal (per D-20, D-21, D-22) */}
          <FormModal
            isOpen={deviceToEdit !== null}
            onClose={() => setDeviceToEdit(null)}
            onSubmit={handleUpdate}
            title="Modifica dispositivo"
            defaultValues={deviceToEdit ? { custom_name: deviceToEdit.custom_name, device_type_slug: deviceToEdit.device_type_slug } : { custom_name: '', device_type_slug: '' }}
            validationSchema={updateSchema}
            submitLabel="Salva"
            cancelLabel="Annulla"
          >
            {({ control }: any) => (
              <>
                {/* Read-only context (per D-22) */}
                <div className="text-sm text-slate-400 mb-2">
                  <p>Provider: <strong className="text-slate-200">{deviceToEdit?.provider_name}</strong></p>
                  <p>ID: <strong className="text-slate-200">{deviceToEdit?.device_id}</strong></p>
                </div>
                <Controller name="custom_name" control={control} render={({ field, fieldState }) => (
                  <Input label="Nome" {...field} error={fieldState.error?.message} />
                )} />
                <Controller name="device_type_slug" control={control} render={({ field, fieldState }) => (
                  <Select label="Tipo" options={deviceTypes.map(t => ({ value: t.slug, label: t.label }))} value={field.value} onChange={(e) => field.onChange(String(e.target.value))} />
                )} />
              </>
            )}
          </FormModal>
        </Card>
      )}

      {/* Unregister ConfirmationDialog (per D-25, D-26) */}
      <ConfirmationDialog
        isOpen={deviceToDelete !== null}
        onClose={() => setDeviceToDelete(null)}
        onConfirm={handleUnregister}
        title="Rimuovi dispositivo"
        description={`Rimuovere "${deviceToDelete?.custom_name}" (${deviceToDelete?.provider_name})?`}
        confirmLabel="Rimuovi"
        cancelLabel="Annulla"
        variant="danger"
      />
    </SettingsLayout>
  );
}
