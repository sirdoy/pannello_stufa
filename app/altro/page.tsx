'use client';
/**
 * /altro route — Phase 181 (CONTEXT D-12 / D-17).
 *
 * Mounts <AltroPage /> as a client route. Auth0 wrap is automatic via
 * app/layout.tsx ClientProviders (no explicit withPageAuthRequired needed).
 * Pattern mirrors app/automazioni/page.tsx (Phase 180 D-06) and
 * app/stanze/page.tsx (Phase 179 D-04).
 */

import { AltroPage } from '@/app/components/EmberGlass/altro/AltroPage';

export const dynamic = 'force-dynamic';

export default function AltroRoute() {
  return (
    <section className="py-8 sm:py-12 lg:py-16">
      <h1 className="sr-only">Altro</h1>
      <AltroPage />
    </section>
  );
}
