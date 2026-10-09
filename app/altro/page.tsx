'use client';
/**
 * /altro route — Phase 181 (CONTEXT D-12 / D-17).
 *
 * Mounts <AltroPage /> as a client route. Session gate is automatic via
 * app/layout.tsx ClientProviders (no explicit withPageAuthRequired needed).
 * Pattern mirrors app/automazioni/page.tsx (Phase 180 D-06) and
 * app/stanze/page.tsx (Phase 179 D-04).
 */

import { AltroPage } from '@/app/components/EmberGlass/altro/AltroPage';

export const dynamic = 'force-dynamic';

export default function AltroRoute() {
  return <AltroPage />;
}
