'use client';
/**
 * /stanze route — Phase 179 (Plan 179-08 / ROOMS-01 / CONTEXT D-04).
 *
 * Mounts <RoomsTab /> as a client route.
 * Auth0 wrap is automatic via app/layout.tsx ClientProviders.
 * Pattern mirrors app/page.tsx (Phase 177 dashboard root).
 *
 * Tailwind layout class on <section> is the explicit carve-out per
 * PATTERNS §Inline-style + var(--token) (Phase 177 precedent).
 */

import { RoomsTab } from '@/app/components/EmberGlass/rooms';

export const dynamic = 'force-dynamic';

export default function StanzePage() {
  return (
    <section className="py-8 sm:py-12 lg:py-16">
      <h1 className="sr-only">Stanze</h1>
      <RoomsTab />
    </section>
  );
}
