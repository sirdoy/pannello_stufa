'use client';

import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/app/components/ui';
import DeviceStatusBadge from './DeviceStatusBadge';
import DeviceCategoryBadge from './DeviceCategoryBadge';
import type { DeviceData } from '@/app/components/devices/network/types';
import type { DeviceCategory } from '@/types/firebase/network';
import { Card, Heading, Badge } from '@/app/components/ui';

interface DeviceListTableProps {
  devices: DeviceData[];
  isStale: boolean;
  onCategoryChange?: (mac: string, category: DeviceCategory) => void;
}

type StatusFilter = 'all' | 'online' | 'offline';

/**
 * DeviceListTable Component
 *
 * Displays a searchable, sortable, paginated table of network devices.
 * Features status filter tabs, device count badge, and pre-sorting (online devices first).
 *
 * @param {Object} props - Component props
 * @param {DeviceData[]} props.devices - Array of network devices to display
 * @param {boolean} props.isStale - Whether the data is stale (currently unused)
 * @param {(mac: string, category: DeviceCategory) => void} [props.onCategoryChange] - Optional callback for category changes
 *
 * @example
 * <DeviceListTable devices={devices} isStale={false} />
 */
export function DeviceListTable({ devices, isStale, onCategoryChange }: DeviceListTableProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [editingMac, setEditingMac] = useState<string | null>(null);

  // Column definitions
  const columns = useMemo<ColumnDef<DeviceData>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Nome',
      enableSorting: true,
      enableGlobalFilter: true,
      cell: ({ row }) => {
        const name = row.original.name;
        const ip = row.original.ip;
        // Show name if different from IP, otherwise just IP
        const displayName = name && name !== ip ? name : ip;
        return <span className="font-medium">{displayName}</span>;
      },
    },
    {
      accessorKey: 'ip',
      header: 'Indirizzo IP',
      enableSorting: true,
      enableGlobalFilter: true,
      cell: ({ row }) => (
        <span className="font-mono text-sm text-slate-400">{row.original.ip}</span>
      ),
    },
    {
      accessorKey: 'mac',
      header: 'MAC',
      enableSorting: true,
      enableGlobalFilter: true,
      cell: ({ row }) => (
        <span className="font-mono text-xs text-slate-500">{row.original.mac}</span>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Categoria',
      enableSorting: true,
      enableGlobalFilter: false,
      cell: ({ row }) => {
        const mac = row.original.mac;
        const category = row.original.category ?? 'unknown';

        if (editingMac === mac) {
          return (
            <select
              value={category}
              onChange={(e) => {
                const newCategory = e.target.value as DeviceCategory;
                onCategoryChange?.(mac, newCategory);
                setEditingMac(null);
              }}
              onBlur={() => setEditingMac(null)}
              autoFocus
              className="bg-slate-800 text-slate-200 text-xs rounded px-2 py-1 border border-white/10 focus:border-ember-400 focus:outline-none"
            >
              <option value="iot">IoT</option>
              <option value="mobile">Mobile</option>
              <option value="pc">PC</option>
              <option value="smart-home">Smart Home</option>
              <option value="unknown">Sconosciuto</option>
            </select>
          );
        }

        return (
          <DeviceCategoryBadge
            category={category}
            onClick={onCategoryChange ? () => setEditingMac(mac) : undefined}
          />
        );
      },
    },
    {
      accessorKey: 'active',
      header: 'Stato',
      enableSorting: true,
      enableGlobalFilter: false,
      sortingFn: (rowA, rowB) => {
        // Online devices (active=true) sort before offline (active=false)
        const aActive = rowA.original.active;
        const bActive = rowB.original.active;
        if (aActive === bActive) return 0;
        return aActive ? -1 : 1;
      },
      cell: ({ row }) => (
        <DeviceStatusBadge
          active={row.original.active}
          lastSeen={row.original.lastSeen}
        />
      ),
    },
    {
      accessorKey: 'bandwidth',
      header: 'Banda',
      enableSorting: true,
      enableGlobalFilter: false,
      cell: ({ row }) => {
        const bandwidth = row.original.bandwidth;
        if (!bandwidth || bandwidth === 0) {
          return <span className="text-slate-500">-</span>;
        }
        return <span className="text-slate-300">{bandwidth.toFixed(1)} Mbps</span>;
      },
    },
  ], [editingMac, onCategoryChange]);

  // Sort devices: online first, then by name
  const sortedDevices = useMemo(() => {
    return [...devices].sort((a, b) => {
      // Primary sort: online devices first
      if (a.active !== b.active) {
        return a.active ? -1 : 1;
      }
      // Secondary sort: alphabetical by name
      return a.name.localeCompare(b.name, 'it');
    });
  }, [devices]);

  // Filter devices by status
  const filteredDevices = useMemo(() => {
    if (statusFilter === 'all') return sortedDevices;
    if (statusFilter === 'online') return sortedDevices.filter(d => d.active);
    if (statusFilter === 'offline') return sortedDevices.filter(d => !d.active);
    return sortedDevices;
  }, [sortedDevices, statusFilter]);

  // Count devices by status
  const onlineCount = useMemo(() => devices.filter(d => d.active).length, [devices]);
  const offlineCount = useMemo(() => devices.filter(d => !d.active).length, [devices]);

  return (
    <Card variant="elevated" className="p-4 sm:p-6 space-y-4">
      {/* Header with device count */}
      <div className="flex items-center gap-3">
        <Heading level={2} size="lg">Dispositivi</Heading>
        <Badge variant="neutral" size="sm">{devices.length}</Badge>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-4 border-b border-white/[0.06] pb-2">
        <button
          onClick={() => setStatusFilter('all')}
          className={`text-sm font-medium transition-colors pb-2 ${
            statusFilter === 'all'
              ? 'text-ember-400 border-b-2 border-ember-400'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          Tutti ({devices.length})
        </button>
        <button
          onClick={() => setStatusFilter('online')}
          className={`text-sm font-medium transition-colors pb-2 ${
            statusFilter === 'online'
              ? 'text-ember-400 border-b-2 border-ember-400'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          Online ({onlineCount})
        </button>
        <button
          onClick={() => setStatusFilter('offline')}
          className={`text-sm font-medium transition-colors pb-2 ${
            statusFilter === 'offline'
              ? 'text-ember-400 border-b-2 border-ember-400'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          Offline ({offlineCount})
        </button>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={filteredDevices}
        enableFiltering={true}
        enablePagination={true}
        pageSize={25}
        density="default"
        striped={true}
        variant="default"
      />
    </Card>
  );
}

export default DeviceListTable;
