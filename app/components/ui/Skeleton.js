/**
 * Skeleton - Loading placeholder component
 *
 * Creates animated skeleton loaders that match the structure of content being loaded.
 * Follows the application's warm color palette with subtle animations.
 *
 * @component
 * @example
 * // Basic skeleton
 * <Skeleton className="h-8 w-32" />
 *
 * // Card skeleton
 * <Skeleton.Card>
 *   <Skeleton className="h-6 w-1/2 mb-4" />
 *   <Skeleton className="h-4 w-full mb-2" />
 *   <Skeleton className="h-4 w-3/4" />
 * </Skeleton.Card>
 *
 * @param {string} [className] - Additional Tailwind classes for sizing/spacing
 * @param {object} [props] - Additional HTML attributes
 */
export default function Skeleton({ className = '', ...props }) {
  return (
    <div
      className={`bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-neutral-700 dark:via-neutral-600 dark:to-neutral-700 bg-[length:200%_100%] rounded animate-shimmer ${className}`}
      {...props}
    />
  );
}

/**
 * Skeleton.Card - Skeleton wrapper that mimics Card component
 */
Skeleton.Card = function SkeletonCard({ children, className = '', ...props }) {
  return (
    <div
      className={`bg-white dark:bg-neutral-800 rounded-2xl shadow-soft border border-neutral-200/50 dark:border-neutral-700/50 backdrop-blur-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Skeleton.StovePanel - Skeleton for StoveCard component (homepage stove control)
 */
Skeleton.StovePanel = function SkeletonStovePanel() {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Main Status Card */}
      <Skeleton.Card className="overflow-hidden bg-gradient-to-br from-neutral-50/80 via-neutral-100/60 to-neutral-50/80 shadow-glass-lg ring-1 ring-white/20">
        <div className="relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 via-accent-500 to-primary-500 opacity-80"></div>

          <div className="p-6 sm:p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-12 w-12 rounded-xl" />
            </div>

            {/* Main Status Display - Frame 3 Style */}
            <div className="mb-6">
              {/* Riquadro COLORATO con stato/icona/valori */}
              <div className="relative bg-gradient-to-b from-neutral-50 to-neutral-100 rounded-2xl p-6 sm:p-8 shadow-glass-lg overflow-visible">
                {/* Layout Frame 3: Testo + Icona + Box glassmorphism sovrapposti */}
                <div className="relative">
                      {/* Testo stato in alto */}
                      <div className="text-center mb-8 sm:mb-10">
                        <Skeleton className="h-8 w-48 mx-auto" />
                      </div>

                      {/* Container per icona e box glassmorphism sovrapposti */}
                      <div className="relative flex flex-col items-center">
                        {/* Icona grande (z-0, dietro) */}
                        <div className="relative mb-[-40px] sm:mb-[-50px]">
                          <Skeleton className="h-[120px] w-[120px] sm:h-[140px] sm:w-[140px] rounded-full" />
                        </div>

                        {/* Due box glassmorphism (z-10, davanti all'icona) */}
                        <div className="relative z-10 w-full grid grid-cols-2 gap-3 sm:gap-4 mt-4">
                          {/* Box Ventola */}
                          <div className="relative overflow-hidden rounded-2xl bg-white/60 backdrop-blur-xl shadow-glass-sm ring-1 ring-white/40 ring-inset">
                            <div className="relative flex flex-col items-center justify-center p-4 sm:p-6 min-h-[100px] sm:min-h-[120px]">
                              <Skeleton className="h-6 w-6 sm:h-8 sm:w-8 rounded-full mb-2" />
                              <Skeleton className="h-3 w-12 mb-1" />
                              <Skeleton className="h-8 w-16" />
                            </div>
                          </div>

                          {/* Box Potenza */}
                          <div className="relative overflow-hidden rounded-2xl bg-white/60 backdrop-blur-xl shadow-glass-sm ring-1 ring-white/40 ring-inset">
                            <div className="relative flex flex-col items-center justify-center p-4 sm:p-6 min-h-[100px] sm:min-h-[120px]">
                              <Skeleton className="h-6 w-6 sm:h-8 sm:w-8 rounded-full mb-2" />
                              <Skeleton className="h-3 w-12 mb-1" />
                              <Skeleton className="h-8 w-16" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
              </div>
            </div>

            {/* Separator */}
            <div className="relative my-6 sm:my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full h-px bg-gradient-to-r from-transparent via-neutral-300/50 to-transparent"></div>
              </div>
              <div className="relative flex justify-center">
                <Skeleton className="h-7 w-36 rounded-full" />
              </div>
            </div>

            {/* Mode Indicator */}
            <div className="flex flex-col gap-4 p-5 sm:p-6 bg-white/60 backdrop-blur-md rounded-2xl shadow-glass-sm ring-1 ring-white/40 ring-inset mb-6">
              <div className="flex items-center gap-4">
                <Skeleton className="h-14 w-14 rounded-xl" />
                <div className="flex-1 min-w-0">
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-full max-w-xs" />
                </div>
              </div>
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>

            {/* Cron Health Banner placeholder */}
            <div className="mb-6">
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>

            {/* Separator */}
            <div className="relative my-6 sm:my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full h-px bg-gradient-to-r from-transparent via-neutral-300/50 to-transparent"></div>
              </div>
              <div className="relative flex justify-center">
                <Skeleton className="h-7 w-32 rounded-full" />
              </div>
            </div>

            {/* Maintenance Bar placeholder */}
            <div className="mb-6">
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>

            {/* Separator Controllo */}
            <div className="relative my-6 sm:my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full h-px bg-gradient-to-r from-transparent via-neutral-300/50 to-transparent"></div>
              </div>
              <div className="relative flex justify-center">
                <Skeleton className="h-7 w-28 rounded-full" />
              </div>
            </div>

            {/* Azioni On/Off */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Skeleton className="h-20 sm:h-24 rounded-xl" />
              <Skeleton className="h-20 sm:h-24 rounded-xl" />
            </div>

            {/* Status indicator */}
            <div className="mb-6">
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>

            {/* Regolazioni - Select */}
            <div className="space-y-4">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </Skeleton.Card>
    </div>
  );
};

/**
 * Skeleton.ThermostatCard - Skeleton for ThermostatCard component (homepage thermostat control)
 */
Skeleton.ThermostatCard = function SkeletonThermostatCard() {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Main Status Card */}
      <Skeleton.Card className="overflow-hidden border-2 border-neutral-200 bg-neutral-50">
        <div className="relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-info-500 via-info-400 to-info-500"></div>

          <div className="p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl" />
            </div>

            {/* Room Selection (opzionale, se più stanze) */}
            <div className="mb-4 sm:mb-6">
              <Skeleton className="h-14 sm:h-16 w-full rounded-xl" />
            </div>

            {/* Temperature Display */}
            <div className="space-y-4 mb-4 sm:mb-6">
              <div className="flex flex-col items-center justify-center p-4 sm:p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/80 shadow-sm">
                <div className="flex items-center gap-6">
                  {/* Current temp */}
                  <div className="text-center">
                    <Skeleton className="h-3 w-16 mb-2 mx-auto" />
                    <Skeleton className="h-12 sm:h-14 w-20 sm:w-24" />
                  </div>

                  {/* Arrow */}
                  <Skeleton className="h-6 w-6" />

                  {/* Target temp */}
                  <div className="text-center">
                    <Skeleton className="h-3 w-16 mb-2 mx-auto" />
                    <Skeleton className="h-12 sm:h-14 w-20 sm:w-24" />
                  </div>
                </div>
              </div>

              {/* Quick temperature controls */}
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-full rounded-xl" />
                <div className="text-center px-4">
                  <Skeleton className="h-3 w-12 mb-1 mx-auto" />
                  <Skeleton className="h-6 w-16 mx-auto" />
                </div>
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            </div>

            {/* Separator */}
            <div className="relative my-4 sm:my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200"></div>
              </div>
              <div className="relative flex justify-center text-xs sm:text-sm">
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
            </div>

            {/* Mode Control - 4 buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
              <Skeleton className="h-20 sm:h-24 rounded-xl" />
              <Skeleton className="h-20 sm:h-24 rounded-xl" />
              <Skeleton className="h-20 sm:h-24 rounded-xl" />
              <Skeleton className="h-20 sm:h-24 rounded-xl" />
            </div>

            {/* Separator */}
            <div className="relative my-4 sm:my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200"></div>
              </div>
              <div className="relative flex justify-center text-xs sm:text-sm">
                <Skeleton className="h-5 w-28 rounded-full" />
              </div>
            </div>

            {/* Summary Info - 3 cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="flex flex-col items-center p-3 sm:p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/80">
                <Skeleton className="h-8 w-8 sm:h-10 sm:w-10 rounded-full mb-2" />
                <Skeleton className="h-3 w-12 mb-1" />
                <Skeleton className="h-4 w-20" />
              </div>

              <div className="flex flex-col items-center p-3 sm:p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/80">
                <Skeleton className="h-8 w-8 sm:h-10 sm:w-10 rounded-full mb-2" />
                <Skeleton className="h-3 w-12 mb-1" />
                <Skeleton className="h-4 w-16" />
              </div>

              <div className="flex flex-col items-center p-3 sm:p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/80 col-span-2 sm:col-span-1">
                <Skeleton className="h-8 w-8 sm:h-10 sm:w-10 rounded-full mb-2" />
                <Skeleton className="h-3 w-16 mb-1" />
                <Skeleton className="h-4 w-12" />
              </div>
            </div>

            {/* Link to full page */}
            <Skeleton className="h-10 sm:h-11 w-full rounded-xl" />
          </div>
        </div>
      </Skeleton.Card>
    </div>
  );
};

/**
 * Skeleton.Scheduler - Skeleton for Scheduler page
 */
Skeleton.Scheduler = function SkeletonScheduler() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Card */}
      <Skeleton.Card className="p-6">
        {/* Title */}
        <Skeleton className="h-8 sm:h-9 w-64 sm:w-80 mb-6" />

        {/* Status e toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl bg-neutral-50 mb-4">
          {/* ModeIndicator */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-6 rounded-lg" />
            <div>
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>

          {/* Toggle button */}
          <Skeleton className="h-10 sm:h-11 w-full sm:w-40 rounded-xl" />
        </div>

        {/* Pulsanti Espandi/Comprimi */}
        <div className="flex gap-3 justify-end">
          <Skeleton className="h-9 w-32 rounded-xl" />
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>
      </Skeleton.Card>

      {/* Day Schedule Cards */}
      {[...Array(7)].map((_, i) => (
        <Skeleton.Card key={i} className="overflow-hidden">
          {/* Header - sempre visibile */}
          <div className="p-6">
            <div className="flex items-center justify-between">
              {/* Day info */}
              <div className="flex items-center gap-4 flex-1">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div>
                  <Skeleton className="h-6 w-24 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>

              {/* Expand icon */}
              <Skeleton className="h-6 w-6 rounded-lg" />
            </div>

            {/* TimeBar compatta */}
            <div className="mt-4">
              <div className="relative h-4 w-full bg-neutral-200 rounded-lg overflow-hidden shadow-inner">
                <div className="absolute top-0 bottom-0 bg-gradient-to-r from-primary-400 to-accent-500" style={{ left: '20%', width: '30%' }} />
                <div className="absolute top-0 bottom-0 bg-gradient-to-r from-primary-400 to-accent-500" style={{ left: '60%', width: '25%' }} />
              </div>
            </div>
          </div>
        </Skeleton.Card>
      ))}
    </div>
  );
};

/**
 * Skeleton.LogEntry - Skeleton for single log entry
 */
Skeleton.LogEntry = function SkeletonLogEntry() {
  return (
    <li className="border-b border-neutral-200 pb-4 mb-4 last:border-b-0 flex items-start gap-3">
      {/* Icon */}
      <Skeleton className="h-8 w-8 rounded-full flex-shrink-0 mt-1" />

      <div className="flex-1 min-w-0">
        {/* User & Device Badge Row */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-5 w-20 rounded-md" />
        </div>

        {/* Timestamp */}
        <Skeleton className="h-3 w-40 mb-2" />

        {/* Action */}
        <Skeleton className="h-5 w-3/4" />
      </div>
    </li>
  );
};

/**
 * Skeleton.LogPage - Skeleton for Log page
 */
Skeleton.LogPage = function SkeletonLogPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <Skeleton className="h-9 w-64 mx-auto mb-2" />
        <Skeleton className="h-5 w-80 mx-auto" />
      </div>

      {/* Filters Card */}
      <Skeleton.Card className="p-4 sm:p-6">
        <Skeleton className="h-4 w-40 mb-3" />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-9 w-24 rounded-xl" />
          <Skeleton className="h-9 w-32 rounded-xl" />
          <Skeleton className="h-9 w-36 rounded-xl" />
        </div>
      </Skeleton.Card>

      {/* Log Entries Card */}
      <Skeleton.Card className="p-4 sm:p-6">
        <ul className="space-y-3">
          {[...Array(10)].map((_, i) => (
            <Skeleton.LogEntry key={i} />
          ))}
        </ul>

        {/* Pagination */}
        <div className="mt-6 flex justify-center gap-2">
          <Skeleton className="h-10 w-24 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
          <Skeleton className="h-10 w-24 rounded-xl" />
        </div>
      </Skeleton.Card>
    </div>
  );
};

/**
 * Skeleton.NetatmoPage - Skeleton for Netatmo dashboard page
 */
Skeleton.NetatmoPage = function SkeletonNetatmoPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Skeleton className="h-9 w-64 sm:w-80 mb-2" />
        <Skeleton className="h-5 w-80 sm:w-96" />
      </div>

      {/* Mode Control Card */}
      <Skeleton.Card className="p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-36" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-9 w-32 rounded-xl" />
            <Skeleton className="h-9 w-28 rounded-xl" />
            <Skeleton className="h-9 w-28 rounded-xl" />
            <Skeleton className="h-9 w-20 rounded-xl" />
          </div>
        </div>
      </Skeleton.Card>

      {/* Topology Info Card */}
      <Skeleton.Card className="p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Skeleton className="h-4 w-16 mb-2" />
            <Skeleton className="h-6 w-32" />
          </div>
          <div>
            <Skeleton className="h-4 w-16 mb-2" />
            <Skeleton className="h-6 w-12" />
          </div>
          <div>
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-6 w-12" />
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-neutral-200">
          <Skeleton className="h-9 w-56 rounded-xl" />
        </div>
      </Skeleton.Card>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Skeleton.Card key={i} className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 min-w-0">
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-20 rounded-lg" />
            </div>
            {/* Temperature */}
            <div className="mb-4">
              <Skeleton className="h-12 w-40 mb-2" />
              <Skeleton className="h-3 w-28" />
            </div>
            {/* Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <Skeleton className="h-9 rounded-xl" />
              <Skeleton className="h-9 rounded-xl" />
              <Skeleton className="h-9 rounded-xl" />
            </div>
          </Skeleton.Card>
        ))}
      </div>
    </div>
  );
};