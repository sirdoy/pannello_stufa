'use client';

import { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Copy, Check, RefreshCw, Network } from 'lucide-react';
import Card from '@/app/components/ui/Card';
import Heading from '@/app/components/ui/Heading';
import Text from '@/app/components/ui/Text';
import Button from '@/app/components/ui/Button';
import DataTable from '@/app/components/ui/DataTable';
import EmptyState from '@/app/components/ui/EmptyState';
import Banner from '@/app/components/ui/Banner';
import Skeleton from '@/app/components/ui/Skeleton';
import { useFritzServiceDiscovery, type ServiceEntry } from '@/app/debug/hooks/useFritzServiceDiscovery';

/**
 * Copyable URL cell renderer (pattern derived from CopyableIp.tsx).
 * Kept inline because service URLs are semantically distinct from IPs.
 */
function CopyUrl({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Silent fail — clipboard access may be blocked in some browsers.
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-xs text-slate-300 truncate max-w-[280px]" title={url}>
        {url}
      </span>
      <Button
        variant="ghost"
        size="sm"
        iconOnly
        onClick={handleCopy}
        aria-label={copied ? 'URL copiato' : 'Copia URL'}
      >
        {copied ? <Check size={14} className="text-sage-400" /> : <Copy size={14} />}
      </Button>
    </div>
  );
}

/**
 * FritzboxServiceDiscoveryTab (FRITZ-07)
 *
 * Read-only admin surface for the TR-064 service descriptor. Renders a table of
 * { name, type, url } entries with a copy-to-clipboard action on each URL.
 *
 * Threat T-171-01 mitigation: Fritz!Box-supplied strings (name / type / url) are
 * rendered via JSX text interpolation only (React auto-escapes).
 */
export default function FritzboxServiceDiscoveryTab() {
  const { services, loading, error, refresh } = useFritzServiceDiscovery();

  const columns: ColumnDef<ServiceEntry>[] = [
    {
      accessorKey: 'name',
      header: 'Servizio',
      enableSorting: true,
      cell: ({ row }) => <span className="font-medium text-slate-200">{row.original.name}</span>,
    },
    {
      accessorKey: 'type',
      header: 'Tipo (URN)',
      enableSorting: true,
      cell: ({ row }) => <span className="font-mono text-xs text-slate-400">{row.original.type}</span>,
    },
    {
      accessorKey: 'url',
      header: 'URL',
      enableSorting: false,
      cell: ({ row }) => <CopyUrl url={row.original.url} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Network size={20} className="text-ember-400" aria-hidden="true" />
            <Heading level={2} size="lg">
              Service Discovery
            </Heading>
          </div>
          <Text variant="tertiary" size="sm" className="mt-1">
            Descrittore TR-064 esposto dal Fritz!Box. Non effettua chiamate TR-064; elenca solo i servizi disponibili.
          </Text>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void refresh()}
          disabled={loading}
          aria-label="Aggiorna elenco servizi"
          aria-busy={loading}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin mr-2' : 'mr-2'} aria-hidden="true" />
          Aggiorna
        </Button>
      </div>

      {error && (
        <Banner
          variant="error"
          title="Impossibile caricare i servizi"
          description={error.message}
          compact={false}
        />
      )}

      <Card variant="elevated" className="p-4 sm:p-6">
        {loading && services.length === 0 ? (
          <Skeleton className="h-[400px] rounded-2xl" />
        ) : services.length === 0 && !error ? (
          <EmptyState
            icon={<Network size={48} className="text-slate-500" />}
            title="Nessun servizio rilevato"
            description="Il Fritz!Box non ha restituito servizi TR-064. Verifica che TR-064 sia abilitato nelle impostazioni del router."
            size="md"
          />
        ) : (
          <DataTable
            columns={columns}
            data={services}
            density="default"
            striped={true}
            enableFiltering={false}
            enablePagination={services.length > 25}
            pageSize={25}
          />
        )}
      </Card>
    </div>
  );
}
