'use client';

/**
 * CameraSheet — body for the Netatmo camera sheet (replaces the Phase 177
 * placeholder that CameraCard shipped with).
 *
 * Presentational — receives cameras from the parent CameraCard (the card
 * mounts useCameraData; the sheet must not re-mount it).
 *
 * Sections:
 *   - Camera picker (only when more than one camera)
 *   - Preview: snapshot / HLS live when the camera is "on"; explicit offline
 *     state for "off" (monitoring disabled) and "disconnected"
 *   - Info rows: tipo, stato, alimentazione, SD, firmware
 *   - Monitoring toggle (disabled while the camera is disconnected)
 *   - Actions: Aggiorna, Eventi, Apri pagina
 *
 * `active` gates every network side effect (snapshot <img>, stream fetch):
 * the Sheet primitive force-mounts its children, so without it the sheet
 * would download a snapshot even while closed. The card remounts the sheet
 * on open/close (`key`), which resets the live stream.
 */

import { useState } from 'react';
import { VideoOff, Play, Square, RefreshCw, History, ExternalLink, TriangleAlert } from 'lucide-react';
import type { CameraStatus } from '@/types/netatmoProxy';
import { CAMERA_ROUTES } from '@/lib/routes';
import { getCameraTypeName } from '@/lib/netatmo/netatmoCameraApi';
import { pickStreamUrl } from '@/lib/netatmo/cameraStreamUrl';
import HlsPlayer from '@/app/components/devices/camera/HlsPlayer';
import { useCameraData } from '@/app/components/devices/camera/hooks/useCameraData';
import { SheetRow } from './primitives/SheetRow';
import { SheetBtn } from './primitives/SheetBtn';
import { InlineToggle } from '../InlineToggle';
import { usePendingActions } from '../usePendingActions';

export interface CameraSheetProps {
  cameras: CameraStatus[];
  loading: boolean;
  error: string | null;
  stale: boolean;
  lastUpdatedAt: number | null;
  /** True while the sheet is open — gates snapshot/stream requests. */
  active: boolean;
  onRefresh: () => Promise<void> | void;
  onNavigate: (path: string) => void;
}

const TONE = '#6aa86a';

type StreamState = 'idle' | 'loading' | 'playing' | 'error';

function statusLabel(status: string | null): string {
  if (status === 'on') return 'Attiva';
  if (status === 'off') return 'Monitoraggio disattivato';
  if (status === 'disconnected') return 'Disconnessa';
  return 'Stato sconosciuto';
}

function onOffLabel(value: string | null, on: string, off: string): string {
  if (value === 'on') return on;
  if (value === 'off') return off;
  return '—';
}

export function CameraSheet({
  cameras,
  loading,
  error,
  stale,
  lastUpdatedAt,
  active,
  onRefresh,
  onNavigate,
}: CameraSheetProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // State below is keyed by camera (and poll cycle) so switching camera or
  // receiving fresh data resets it by derivation, without effects.
  const [failedSnapshot, setFailedSnapshot] = useState<string | null>(null);
  const [stream, setStream] = useState<{ cameraId: string; state: StreamState; url: string | null } | null>(null);
  const [monitoringPending, setMonitoringPending] = useState(false);
  const [monitoringOverride, setMonitoringOverride] = useState<{ key: string; value: boolean } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const actions = usePendingActions();
  const refresh = () => void actions.run('refresh', onRefresh);

  const cam = cameras.find((c) => c.camera_id === selectedId) ?? cameras[0] ?? null;
  const online = cam?.status === 'on';
  const disconnected = cam?.status === 'disconnected';
  const dataKey = `${cam?.camera_id ?? ''}:${lastUpdatedAt ?? 0}`;
  const liveStream = active && online && stream?.cameraId === cam?.camera_id ? stream : null;
  const streamState: StreamState = liveStream?.state ?? 'idle';
  const streamUrl = liveStream?.url ?? null;

  if (loading && cameras.length === 0) {
    return (
      <div
        data-testid="camera-sheet-skeleton"
        className="animate-pulse"
        style={{
          height: 320,
          borderRadius: 'var(--r-card)',
          background: 'rgba(255,255,255,0.05)',
          opacity: 0.6,
        }}
      />
    );
  }

  if (!cam) {
    return (
      <div
        data-testid={error ? 'camera-sheet-error' : 'camera-sheet-empty'}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
          padding: '24px 0',
          textAlign: 'center',
        }}
      >
        <TriangleAlert size={32} color="var(--text-2)" />
        <div style={{ fontSize: 14, color: 'var(--text-1)' }}>
          {error ? 'Impossibile caricare le videocamere.' : 'Nessuna videocamera Netatmo trovata.'}
        </div>
        {error && <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{error}</div>}
        <SheetBtn Icon={RefreshCw} label="Riprova" pending={actions.isPending('refresh')} onClick={refresh} />
      </div>
    );
  }

  const monitoringOn = monitoringOverride?.key === dataKey ? monitoringOverride.value : online;
  const snapshotSrc = active && online
    ? `${CAMERA_ROUTES.snapshot(cam.camera_id)}?t=${lastUpdatedAt ?? 0}`
    : null;
  const snapshotError = snapshotSrc !== null && failedSnapshot === snapshotSrc;

  async function startLive(cameraId: string) {
    setStream({ cameraId, state: 'loading', url: null });
    try {
      const res = await fetch(CAMERA_ROUTES.stream(cameraId));
      if (!res.ok) {
        setStream({ cameraId, state: 'error', url: null });
        return;
      }
      const data = await res.json() as Parameters<typeof pickStreamUrl>[0];
      const url = pickStreamUrl(data);
      setStream({ cameraId, state: url ? 'playing' : 'error', url });
    } catch {
      setStream({ cameraId, state: 'error', url: null });
    }
  }

  function stopLive() {
    setStream(null);
  }

  async function toggleMonitoring(cameraId: string, next: boolean) {
    if (monitoringPending) return;
    setMonitoringPending(true);
    setActionError(null);
    setMonitoringOverride({ key: dataKey, value: next }); // optimistic
    try {
      const res = await fetch(CAMERA_ROUTES.monitoring(cameraId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monitoring: next ? 'on' : 'off' }),
      });
      if (!res.ok) {
        setMonitoringOverride(null);
        setActionError('Impossibile cambiare il monitoraggio.');
        return;
      }
      stopLive();
      await onRefresh();
    } catch {
      setMonitoringOverride(null);
      setActionError('Impossibile cambiare il monitoraggio.');
    } finally {
      setMonitoringPending(false);
    }
  }

  const offlineCopy = disconnected
    ? { title: 'Camera disconnessa', hint: 'La videocamera non è raggiungibile da Netatmo.' }
    : cam.status === 'off'
      ? { title: 'Monitoraggio disattivato', hint: 'Attiva il monitoraggio per vedere snapshot e live.' }
      : { title: 'Camera non disponibile', hint: 'Stato della videocamera sconosciuto.' };

  return (
    <div data-testid="camera-sheet">
      {cameras.length > 1 && (
        <div
          role="tablist"
          aria-label="Videocamere"
          style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 14 }}
        >
          {cameras.map((c) => {
            const selected = c.camera_id === cam.camera_id;
            return (
              <button
                key={c.camera_id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setSelectedId(c.camera_id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  color: selected ? TONE : 'var(--text-2)',
                  background: selected
                    ? `color-mix(in oklab, ${TONE} 20%, transparent)`
                    : 'rgba(255,255,255,0.05)',
                  border: selected
                    ? `0.5px solid color-mix(in oklab, ${TONE} 35%, transparent)`
                    : '0.5px solid rgba(255,255,255,0.06)',
                }}
              >
                {c.name ?? c.camera_id}
              </button>
            );
          })}
        </div>
      )}

      {/* Preview */}
      <div
        data-testid="camera-sheet-preview"
        style={{
          position: 'relative',
          aspectRatio: '16 / 9',
          borderRadius: 18,
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #0a1a0a 0%, #0a0908 100%)',
          border: '0.5px solid rgba(255,255,255,0.06)',
        }}
      >
        {!online ? (
          <div
            data-testid="camera-sheet-offline"
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: 16,
              textAlign: 'center',
              color: 'var(--text-2)',
            }}
          >
            <VideoOff size={36} strokeWidth={1.5} color={disconnected ? '#ff4d5c' : 'var(--text-2)'} />
            <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>{offlineCopy.title}</div>
            <div style={{ fontSize: 12 }}>{offlineCopy.hint}</div>
          </div>
        ) : streamState === 'playing' && streamUrl ? (
          <HlsPlayer
            src={streamUrl}
            poster={snapshotSrc ?? undefined}
            className="size-full"
            onError={() => setStream({ cameraId: cam.camera_id, state: 'error', url: null })}
          />
        ) : streamState === 'loading' ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              color: 'var(--text-2)',
            }}
          >
            Connessione al live…
          </div>
        ) : snapshotSrc && !snapshotError ? (
          // eslint-disable-next-line @next/next/no-img-element -- proxy endpoint not on next/image remotePatterns
          <img
            src={snapshotSrc}
            alt={cam.name ?? 'Snapshot camera'}
            onError={() => setFailedSnapshot(snapshotSrc)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div
            data-testid="camera-sheet-snapshot-fallback"
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              color: 'var(--text-2)',
              fontSize: 12,
            }}
          >
            <VideoOff size={28} strokeWidth={1.6} />
            Snapshot non disponibile
          </div>
        )}

        {streamState === 'error' && online && (
          <div
            data-testid="camera-sheet-stream-error"
            style={{
              position: 'absolute',
              top: 8,
              left: 8,
              right: 8,
              padding: '6px 10px',
              borderRadius: 10,
              fontSize: 12,
              color: '#fff',
              background: 'rgba(255,77,92,0.45)',
            }}
          >
            Live non disponibile
          </div>
        )}
      </div>

      {online && (
        <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
          {streamState === 'playing' || streamState === 'loading' ? (
            <SheetBtn Icon={Square} label="Ferma live" onClick={stopLive} />
          ) : (
            <SheetBtn Icon={Play} label="Guarda live" onClick={() => void startLive(cam.camera_id)} />
          )}
        </div>
      )}

      {stale && (
        <div
          data-testid="camera-sheet-stale"
          style={{
            marginTop: 14,
            padding: 10,
            borderRadius: 12,
            fontSize: 12,
            color: '#ffb84a',
            background: 'rgba(255,184,74,0.08)',
            border: '0.5px solid rgba(255,184,74,0.3)',
          }}
        >
          Dati non aggiornati: Netatmo potrebbe non essere raggiungibile.
        </div>
      )}

      {/* Info */}
      <SheetRow label="Stato" value={getCameraTypeName(cam.device_type ?? '')}>
        <span
          data-testid="camera-sheet-status"
          style={{
            fontSize: 11,
            fontWeight: 600,
            padding: '4px 10px',
            borderRadius: 999,
            whiteSpace: 'nowrap',
            color: online ? TONE : disconnected ? '#ff4d5c' : 'var(--text-2)',
            background: online
              ? `color-mix(in oklab, ${TONE} 20%, transparent)`
              : disconnected
                ? 'rgba(255,77,92,0.12)'
                : 'rgba(255,255,255,0.05)',
          }}
        >
          {statusLabel(cam.status)}
        </span>
      </SheetRow>

      <SheetRow
        label="Monitoraggio"
        value={disconnected ? 'Non disponibile: camera disconnessa' : monitoringOn ? 'Attivo' : 'Disattivo'}
      >
        <InlineToggle
          on={monitoringOn}
          color={TONE}
          aria-label="Monitoraggio camera"
          data-testid="camera-sheet-monitoring"
          pending={monitoringPending}
          disabled={disconnected || cam.status === null}
          onChange={() => void toggleMonitoring(cam.camera_id, !monitoringOn)}
        />
      </SheetRow>

      {actionError && (
        <div data-testid="camera-sheet-action-error" style={{ marginTop: 8, fontSize: 12, color: '#ff4d5c' }}>
          {actionError}
        </div>
      )}

      <SheetRow label="Alimentazione" value={onOffLabel(cam.alim_status, 'Corretta', 'Problema alimentazione')} />
      <SheetRow label="Scheda SD" value={onOffLabel(cam.sd_status, 'Presente', 'Assente o guasta')} />
      <SheetRow
        label="Firmware"
        value={`${cam.firmware ?? '—'}${cam.is_local ? ' · rete locale' : ''}`}
      />

      <div
        style={{
          marginTop: 22,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: 10,
        }}
      >
        <SheetBtn Icon={RefreshCw} label="Aggiorna" pending={actions.isPending('refresh')} onClick={refresh} />
        <SheetBtn Icon={History} label="Eventi" onClick={() => onNavigate('/camera/events')} />
        <SheetBtn Icon={ExternalLink} label="Apri pagina" onClick={() => onNavigate('/camera')} />
      </div>
    </div>
  );
}

/**
 * Self-fetching wrapper for the design-system gallery — production card uses
 * the prop-based CameraSheet directly.
 */
export function CameraSheetSelfFetch() {
  const { cameras, loading, error, stale, lastUpdatedAt, refresh } = useCameraData();
  return (
    <CameraSheet
      cameras={cameras}
      loading={loading}
      error={error}
      stale={stale}
      lastUpdatedAt={lastUpdatedAt}
      active
      onRefresh={refresh}
      onNavigate={() => {}}
    />
  );
}
