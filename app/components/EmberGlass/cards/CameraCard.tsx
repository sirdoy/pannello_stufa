'use client';

/**
 * CameraCard — Phase 177 (DASH-07).
 *
 * Bundle source (PRIMARY visual contract):
 *   .planning/inbox/ember-glass-design/project/components/cards.jsx:308-340
 *
 * Header right slot is a LIVE pill (red 6×6 dot pulsing 1.6s + 10px caps text)
 * and the body fills the remaining space with a 14px-radius preview area
 * showing a snapshot from `/api/camera/snapshot/{id}?t={lastUpdatedAt}` with a
 * mono `{name} · {resolution}` label overlay.
 *
 * Per A-06 the snapshot uses a bare `<img>` element (NOT the framework image
 * primitive) — the snapshot endpoint returns a 302 redirect to a transient
 * WiNet URL incompatible with the framework `remotePatterns` allowlist.
 *
 * Tone is the device-class forest green `#6aa86a` (D-09).
 * RC-clean — no manual memoization hooks (D-28 / React Compiler discipline).
 */

import { useState } from 'react';
import { Video } from 'lucide-react';
import { GlassCard } from '../GlassCard';
import { CardHead } from '../CardHead';
import { Sheet } from '../Sheet';
import { SheetPlaceholderBody } from './SheetPlaceholderBody';
import { useCameraData } from '@/app/components/devices/camera/hooks/useCameraData';

const TONE = '#6aa86a';

export default function CameraCard() {
  const [open, setOpen] = useState(false);
  const { cameras, lastUpdatedAt } = useCameraData();
  const cam = cameras[0] ?? null;
  // Real hook shape: camera_id (not id) — RESEARCH/A-06 gap (the planned
  // "id"/"resolution" fields were bundle-mock only). camera_id keys the
  // existing /api/camera/snapshot/{id} 302-redirect endpoint.
  const src = cam ? `/api/camera/snapshot/${cam.camera_id}?t=${lastUpdatedAt ?? 0}` : null;
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
          {src && (
            // eslint-disable-next-line @next/next/no-img-element -- A-06: 302-redirect snapshot endpoint incompatible with framework image primitive
            <img
              src={src}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
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
