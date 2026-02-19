import Skeleton from '@/app/components/ui/Skeleton';

/**
 * Dashboard Loading Skeleton
 *
 * Next.js auto-detects this file and wraps the page in a Suspense boundary,
 * showing this skeleton immediately on navigation before any server data resolves.
 *
 * Layout matches the masonry layout in DashboardCards:
 * - Mobile (sm:hidden): single column, flat order
 * - Desktop (hidden sm:flex): two-column masonry, even->left, odd->right
 *
 * flatIndex assignment (6 cards):
 *   0: StovePanel    → left
 *   1: ThermostatCard → right
 *   2: WeatherCard   → left
 *   3: LightsCard    → right
 *   4: NetworkCard   → left
 *   5: CameraCard    → right
 */
export default function DashboardSkeleton() {
  return (
    <section className="py-8 sm:py-12 lg:py-16">
      <h1 className="sr-only">Dashboard</h1>

      {/* Mobile: single column, flat order (sm:hidden) */}
      <div className="flex flex-col gap-6 sm:hidden">
        <Skeleton.StovePanel />
        <Skeleton.ThermostatCard />
        <Skeleton.WeatherCard />
        <Skeleton.LightsCard />
        <Skeleton.CameraCard />
        <Skeleton.NetworkCard />
      </div>

      {/* Desktop: two-column masonry (hidden sm:flex), even→left, odd→right */}
      <div className="hidden sm:flex sm:flex-row gap-8 lg:gap-10">
        {/* Left column: flatIndex 0 (StovePanel), 2 (WeatherCard), 4 (NetworkCard) */}
        <div className="flex flex-col gap-8 lg:gap-10 flex-1 min-w-0">
          <Skeleton.StovePanel />
          <Skeleton.WeatherCard />
          <Skeleton.NetworkCard />
        </div>

        {/* Right column: flatIndex 1 (ThermostatCard), 3 (LightsCard), 5 (CameraCard) */}
        <div className="flex flex-col gap-8 lg:gap-10 flex-1 min-w-0">
          <Skeleton.ThermostatCard />
          <Skeleton.LightsCard />
          <Skeleton.CameraCard />
        </div>
      </div>
    </section>
  );
}
