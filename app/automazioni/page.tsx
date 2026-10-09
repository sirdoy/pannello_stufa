'use client';
/**
 * /automazioni route — Phase 180 (Plan 180-08 / AUTO-01 / CONTEXT D-06).
 *
 * Mounts <AutomationsTab /> as a client route.
 * Session gate is automatic via app/layout.tsx ClientProviders.
 * Pattern mirrors app/stanze/page.tsx (Phase 179 RoomsTab analog).
 *
 * Tailwind layout class on <section> is the explicit carve-out per
 * PATTERNS §Inline-style + var(--token) (Phase 177 precedent).
 */

import { AutomationsTab } from '@/app/components/EmberGlass/automations';

export const dynamic = 'force-dynamic';

export default function AutomazioniPage() {
  return <AutomationsTab />;
}
