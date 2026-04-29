'use client';
/**
 * CameraBody — Phase 179 Plan 05
 * Bundle source: rooms.jsx:467-487 + CONTEXT D-34 + D-59
 *
 * No-op interactive: 16:9 preview box + LIVE caption + motion footnote + play overlay.
 * No camera-stream proxy exists — play button is a no-op (CONTEXT D-34).
 *
 * D-59 copy (frozen):
 * - Caption: "LIVE · {fps}fps" (caps, 9px)
 * - Footer: "Movimento {motion}"
 *
 * D-02: inline-style + var(--token) only. D-37: no useMemo/useCallback.
 */

import { Play } from 'lucide-react';
import type { RoomDevice } from '../types';

export function CameraBody({ device }: { device: RoomDevice }){
  const fps = (device.extra.fps as number | undefined) ?? 24;
  const motion = (device.extra.motion as string | undefined) ?? '—';
  // No-op: no camera-stream proxy (CONTEXT D-34 Out of Scope)
  const noop = () => undefined;

  return (
    <div
      data-testid="stanze-camera-preview"
      style={{
        position: 'relative',
        aspectRatio: '16 / 9',
        borderRadius: 12,
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #0a1a0a 0%, #0a0908 100%)', // AUDIT-EXCEPTION (rooms.jsx:469)
      }}
    >
      {/* LIVE caption — top-left (D-59) */}
      <div
        style={{
          position: 'absolute',
          top: 8,
          left: 8,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 8px',
          borderRadius: 99,
          background: 'rgba(0,0,0,0.4)', // AUDIT-EXCEPTION (rooms.jsx:471)
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 6,
            height: 6,
            borderRadius: 99,
            background: '#ff5d4a', // AUDIT-EXCEPTION (rooms.jsx:473)
            boxShadow: '0 0 6px #ff5d4a', // AUDIT-EXCEPTION
          }}
        />
        <span
          style={{
            fontSize: 9,
            color: '#fff', // AUDIT-EXCEPTION (rooms.jsx:474)
            textTransform: 'uppercase',
            letterSpacing: 0.6,
          }}
        >
          LIVE · {fps}fps
        </span>
      </div>

      {/* Motion footnote — bottom-left (D-59) */}
      <div
        style={{
          position: 'absolute',
          bottom: 8,
          left: 8,
          fontSize: 10,
          color: 'rgba(255,255,255,0.7)', // AUDIT-EXCEPTION (rooms.jsx:477)
        }}
      >
        Movimento {motion}
      </div>

      {/* Play overlay — centered (D-34) */}
      <button
        type="button"
        aria-label="Play camera stream"
        onClick={noop}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 46,
          height: 46,
          borderRadius: 99,
          border: 'none',
          background: 'rgba(255,255,255,0.18)', // AUDIT-EXCEPTION (rooms.jsx:481)
          backdropFilter: 'blur(8px)',
          color: '#fff', // AUDIT-EXCEPTION
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <Play size={18} />
      </button>
    </div>
  );
}
