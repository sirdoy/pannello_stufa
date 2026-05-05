import { GlassCardSkeleton } from '@/app/components/EmberGlass/GlassCardSkeleton';

/**
 * Dashboard Loading Skeleton
 *
 * Route-level fallback for `/`. Next.js auto-detects this file and wraps the
 * page in a Suspense boundary, showing this skeleton immediately on navigation
 * before any server data resolves. The same default export is also reused as
 * the explicit `<Suspense fallback={...}>` for `<DashboardCards />` inside
 * `app/page.tsx`, so this layout MUST mirror the hydrated grid 1:1 to avoid
 * any visible layout shift on first paint.
 *
 * Mirrors Phase 177 (DASH-01) layout from `app/components/DashboardCards.tsx`:
 *   - Single grid wrapper at all breakpoints (`grid-cols-2` mobile, `lg:grid-cols-4` desktop).
 *   - Identical max-width / gap / padding tokens.
 *   - 1:1 aspect-ratio Ember Glass squares (rendered by the imported skeleton component).
 *
 * The placeholder count (10) covers the maximum size of the `CARD_COMPONENTS`
 * registry in `DashboardCards.tsx` (stove, thermostat, weather, lights, camera,
 * network, raspi, sonos, dirigera, tuya). `deviceConfig` is unavailable at the
 * route-level skeleton so the count is intentionally hardcoded.
 *
 * v9.0 stagger animation (`animate-spring-in` + `animationDelay: i * 100ms`)
 * is preserved per the existing dashboard hydration animation.
 */
export default function DashboardSkeleton() {
  return (
    <section className="py-8 sm:py-12 lg:py-16">
      <h1 className="sr-only">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 max-w-md sm:max-w-2xl lg:max-w-7xl mx-auto px-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="animate-spring-in transition-all duration-300 ease-out"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <GlassCardSkeleton />
          </div>
        ))}
      </div>
    </section>
  );
}
