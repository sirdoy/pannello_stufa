'use client';

/**
 * NetworkSheet — body for the Phase 175 Sheet primitive opened from NetworkCard.
 *
 * Presentational — receives networkData from parent (260506-d45 perf pattern;
 * the card already mounts useNetworkData, the sheet must not re-mount it).
 * The SelfFetch wrapper preserves the zero-prop contract for the design-system
 * gallery.
 *
 * Sections:
 *   - Hero: state line + 54px download value + "{up} Mbps ↑" footnote
 *   - Rows: Upload, Dispositivi (active/total), External IP, Uptime, Link max
 *   - Button: "Apri rete" → /network
 *
 * Unreachable state (proxy 503 / WAN down): single TriangleAlert block in place
 * of the metric rows, so the sheet still opens and the user sees what's wrong.
 */

import { useRouter } from 'next/navigation';
import { Activity, TriangleAlert } from 'lucide-react';
import { useNetworkData } from '@/app/components/devices/network/hooks/useNetworkData';
import type { UseNetworkDataReturn } from '@/app/components/devices/network/types';
import { SheetRow } from './primitives/SheetRow';
import { SheetBtn } from './primitives/SheetBtn';

export interface NetworkSheetProps {
  networkData: UseNetworkDataReturn;
  onNavigate: (path: string) => void;
}

function fmtMbps(v: number | undefined): string {
  if (v === undefined || !Number.isFinite(v)) return '—';
  return v < 10 ? v.toFixed(1) : Math.round(v).toString();
}

function fmtUptime(seconds: number | undefined): string {
  if (!seconds || seconds <= 0) return '—';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}g ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function NetworkSheet({ networkData, onNavigate }: NetworkSheetProps) {
  const { bandwidth, devices, wan, activeDeviceCount, error } = networkData;

  const hasBandwidth = bandwidth !== null;
  const hasWan = wan !== null;
  const hasDevices = devices.length > 0;
  const isUnreachable = !hasBandwidth && !hasWan && !hasDevices;

  const stateLabel = isUnreachable
    ? 'Non raggiungibile'
    : wan?.connected
      ? 'Connessa'
      : 'WAN disconnessa';

  return (
    <div data-testid="network-sheet">
      {/* Hero */}
      <div
        style={{
          borderRadius: 24,
          padding: '24px 20px',
          background: isUnreachable
            ? 'rgba(255,255,255,0.03)'
            : 'linear-gradient(160deg, color-mix(in oklab, #5eafff 22%, transparent) 0%, transparent 70%)',
          border: '0.5px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: 20,
        }}
      >
        <Activity size={48} color={isUnreachable ? 'var(--text-2)' : '#5eafff'} />
        <div style={{ flex: 1 }}>
          <div
            data-testid="network-sheet-state"
            style={{
              fontSize: 12,
              color: 'var(--text-2)',
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            {stateLabel}
          </div>
          <div
            data-testid="network-sheet-down"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 54,
              fontWeight: 600,
              color: '#fff',
              lineHeight: 1,
              letterSpacing: -2,
            }}
          >
            {fmtMbps(bandwidth?.download)}
            <span style={{ fontSize: 22, opacity: 0.5 }}> Mbps ↓</span>
          </div>
          <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-2)' }}>
            {isUnreachable
              ? 'Proxy o Fritz!Box non raggiungibile'
              : `${fmtMbps(bandwidth?.upload)} Mbps ↑ · ${devices.length} dispositivi`}
          </div>
        </div>
      </div>

      {/* Error block when nothing reachable */}
      {isUnreachable && (
        <div
          data-testid="network-sheet-error"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            padding: '24px 0',
          }}
        >
          <TriangleAlert size={32} color="var(--text-2)" />
          <div style={{ fontSize: 14, color: 'var(--text-1)' }}>
            Nessun dato disponibile.
          </div>
          {error?.message && (
            <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{error.message}</div>
          )}
        </div>
      )}

      {/* Metric rows — only when at least one signal is live */}
      {!isUnreachable && (
        <>
          <SheetRow
            label="Velocità"
            value={`${fmtMbps(bandwidth?.download)} ↓ · ${fmtMbps(bandwidth?.upload)} ↑ Mbps`}
          />
          <SheetRow
            label="Dispositivi"
            value={`${activeDeviceCount} attivi · ${devices.length} totali`}
          />
          {wan?.externalIp && (
            <SheetRow label="IP esterno" value={wan.externalIp} />
          )}
          {wan?.uptime !== undefined && wan.uptime > 0 && (
            <SheetRow label="Uptime WAN" value={fmtUptime(wan.uptime)} />
          )}
          {wan?.linkSpeed !== undefined && (
            <SheetRow label="Link massimo" value={`${fmtMbps(wan.linkSpeed)} Mbps`} />
          )}
        </>
      )}

      {/* Action */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: 10,
          marginTop: 22,
        }}
      >
        <SheetBtn
          Icon={Activity}
          label="Apri rete"
          onClick={() => onNavigate('/network')}
        />
      </div>
    </div>
  );
}

/**
 * Zero-prop wrapper for design-system gallery (Section10SheetGallery).
 * Production NetworkCard uses the prop-based NetworkSheet directly.
 */
export function NetworkSheetSelfFetch() {
  const router = useRouter();
  const networkData = useNetworkData();
  return (
    <NetworkSheet
      networkData={networkData}
      onNavigate={(p) => router.push(p)}
    />
  );
}
