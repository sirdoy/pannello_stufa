'use client';

/**
 * CameraCard — Phase 177 (DASH-07).
 *
 * Bundle source (PRIMARY visual contract):
 *   .planning/inbox/ember-glass-design/project/components/cards.jsx:308-340
 *
 * Header right slot is a LIVE pill (red 6×6 dot pulsing 1.6s + 10px caps text)
 * and the body fills the remaining space with a 14px-radius preview area
 * showing a snapshot from `/api/v1/netatmo/camera/{id}/snapshot?t={lastUpdatedAt}`
 * with a mono `{name} · {meta}` label overlay.
 *
 * The snapshot endpoint now proxies the JPEG bytes through (no longer 302) so a
 * bare `<img>` element renders directly. The framework image primitive is still
 * skipped because the proxy path is dynamic and not on `remotePatterns`.
 *
 * Tone is the device-class forest green `#6aa86a` (D-09).
 * RC-clean — no manual memoization hooks (D-28 / React Compiler discipline).
 */

import { useState, useEffect } from 'react';
import { Video, VideoOff } from 'lucide-react';
import { GlassCard } from '../GlassCard';
import { CardHead } from '../CardHead';
import { Sheet } from '../Sheet';
import { SheetPlaceholderBody } from './SheetPlaceholderBody';
import { useCameraData } from '@/app/components/devices/camera/hooks/useCameraData';

const TONE = '#6aa86a';

export default function CameraCard() {
  const [open, setOpen] = useState(false);
  const [snapshotError, setSnapshotError] = useState(false);
  const { cameras, lastUpdatedAt } = useCameraData();
  const cam = cameras[0] ?? null;
  // Reset error state when the snapshot src changes (new poll cycle)
  useEffect(() => {
    setSnapshotError(false);
  }, [lastUpdatedAt, cam?.camera_id]);
  // Hits the browser-safe snapshot proxy (server-streams JPEG bytes from the
  // HA proxy's /live/snapshot.jpg endpoint). The ?t= query busts the cache on
  // every poll cycle so the preview refreshes.
  const src = cam
    ? `/api/v1/netatmo/camera/${cam.camera_id}/snapshot?t=${lastUpdatedAt ?? 0}`
    : null;
  // CameraStatus does not expose a resolution field; use device_type as the
  // human-readable meta segment (e.g. "NACamera", "NOC").
  const meta = cam?.device_type ?? '';

  const livePill = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <div
        data-testid="live-dot"
        style={{
          width: 6,
          height: 6,
          borderRadius: 999,
          background: '#ff4d5c',
          animation: 'pulse 1.6s infinite',
        }}
      />
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: '#ff4d5c',
          letterSpacing: 0.5,
        }}
      >
        LIVE
      </span>
    </div>
  );

  return (
    <>
      <GlassCard tone={TONE} onOpen={() => setOpen(true)} data-testid="camera-card">
        <CardHead Icon={Video} label="Camera" tone={TONE} right={livePill} />
        <div
          style={{
            flex: 1,
            marginTop: 4,
            borderRadius: 14,
            position: 'relative',
            overflow: 'hidden',
            border: '0.5px solid rgba(255,255,255,0.06)',
            minHeight: 90,
          }}
        >
          {src && !snapshotError && (
            // eslint-disable-next-line @next/next/no-img-element -- proxy endpoint not on next/image remotePatterns
            <img
              src={src}
              alt=""
              onError={() => setSnapshotError(true)}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )}
          {(snapshotError || !src) && (
            <div
              data-testid="camera-snapshot-fallback"
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                background:
                  'linear-gradient(160deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
                color: 'var(--text-2)',
              }}
            >
              <VideoOff size={28} strokeWidth={1.6} />
              <div style={{ fontSize: 11 }}>
                {!cam ? 'Nessuna camera' : 'Snapshot non disponibile'}
              </div>
            </div>
          )}
          <div
            style={{
              position: 'absolute',
              bottom: 8,
              left: 10,
              fontSize: 10,
              color: 'rgba(255,255,255,0.7)',
              fontFamily: 'ui-monospace, SF Mono, monospace',
            }}
          >
            {cam?.name ?? '—'} · {meta}
          </div>
        </div>
      </GlassCard>
      <Sheet open={open} onClose={() => setOpen(false)} title="Camera">
        <SheetPlaceholderBody phase="178" device="camera" />
      </Sheet>
    </>
  );
}
