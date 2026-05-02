'use client';

/**
 * Phase 181 — NavbarConnectionStatusChip (CONTEXT D-13).
 *
 * Thin floating-position wrapper around the existing Phase 144
 * <NavbarConnectionStatus /> component (46 LOC, zero-arg, decorative).
 *
 * The legacy <Navbar /> previously mounted the WS chip inside the header.
 * Phase 181 unmounts the legacy header (Plan 05); this wrapper gives the
 * chip a top-right floating home with safe-area-inset-top awareness.
 *
 * Z-INDEX: 150, matched to <BottomTabBar /> — both stay BELOW Phase 175
 * Sheet's 200/201 ceiling so any open sheet visually covers them, AND both
 * carry data-* selector hooks consumed by globals.css (Plan 01) to slide
 * off-screen under body[data-sheet-open="true"].
 *
 * NO pointer-events: 'auto' — that's the default; CONTEXT D-13 erroneously
 * included it (RESEARCH Pattern 13 correction). The chip exposes no
 * interactive surface (decorative); not click-blocking.
 */

import type React from 'react';
import { NavbarConnectionStatus } from './NavbarConnectionStatus';

export function NavbarConnectionStatusChip(): React.ReactElement {
  return (
    <div
      data-ws-chip="true"
      style={{
        position: 'fixed',
        top: 'calc(env(safe-area-inset-top) + 12px)',
        right: 12,
        zIndex: 150,
      }}
    >
      <NavbarConnectionStatus />
    </div>
  );
}
