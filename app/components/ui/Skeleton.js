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
      className={`bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] rounded animate-shimmer ${className}`}
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
      className={`bg-white rounded-2xl shadow-soft border border-neutral-200/50 backdrop-blur-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Skeleton.StovePanel - Skeleton for StovePanel component (new dashboard layout)
 */
Skeleton.StovePanel = function SkeletonStovePanel() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Hero Section - Stato */}
      <Skeleton.Card className="p-8">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
        <Skeleton className="h-16 w-full mb-6" />
        <div className="pt-4 border-t border-neutral-200">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="flex-1">
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        </div>
      </Skeleton.Card>

      {/* Controlli - Grid 2 colonne */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Azioni Rapide */}
        <Skeleton.Card className="p-8">
          <Skeleton className="h-7 w-40 mb-6" />
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-12 w-full" />
        </Skeleton.Card>

        {/* Regolazioni */}
        <Skeleton.Card className="p-8">
          <Skeleton className="h-7 w-40 mb-6" />
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <div className="mt-6 pt-4 border-t border-neutral-200 grid grid-cols-2 gap-4">
              <div className="text-center">
                <Skeleton className="h-4 w-16 mx-auto mb-1" />
                <Skeleton className="h-8 w-12 mx-auto" />
              </div>
              <div className="text-center">
                <Skeleton className="h-4 w-16 mx-auto mb-1" />
                <Skeleton className="h-8 w-12 mx-auto" />
              </div>
            </div>
          </div>
        </Skeleton.Card>
      </div>

      {/* Netatmo */}
      <Skeleton.Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div>
              <Skeleton className="h-5 w-24 mb-1" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
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
    <div className="space-y-6">
      {/* Mode Toggle */}
      <Skeleton.Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div>
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <Skeleton className="h-12 w-24 rounded-full" />
        </div>
      </Skeleton.Card>

      {/* Day Schedule Cards */}
      {[...Array(7)].map((_, i) => (
        <Skeleton.Card key={i}>
          <Skeleton className="h-6 w-24 mb-4" />
          <Skeleton className="h-16 w-full mb-4" />
          <div className="space-y-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-12 w-32" />
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
    <div className="flex gap-4 p-4 border-b border-gray-100 last:border-0">
      <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-5 w-3/4" />
      </div>
    </div>
  );
};

/**
 * Skeleton.LogPage - Skeleton for Log page
 */
Skeleton.LogPage = function SkeletonLogPage() {
  return (
    <div className="space-y-6">
      <Skeleton.Card>
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="space-y-0">
          {[...Array(10)].map((_, i) => (
            <Skeleton.LogEntry key={i} />
          ))}
        </div>
      </Skeleton.Card>

      {/* Pagination */}
      <div className="flex justify-center gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-24" />
      </div>
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
        <Skeleton className="h-9 w-64 mb-2" />
        <Skeleton className="h-5 w-96" />
      </div>

      {/* Mode Control Card */}
      <Skeleton.Card className="p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-20" />
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
            <Skeleton className="h-4 w-16 mb-2" />
            <Skeleton className="h-6 w-12" />
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-neutral-200">
          <Skeleton className="h-8 w-48" />
        </div>
      </Skeleton.Card>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Skeleton.Card key={i} className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-3 w-20" />
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
              <Skeleton className="h-9" />
              <Skeleton className="h-9" />
              <Skeleton className="h-9" />
            </div>
          </Skeleton.Card>
        ))}
      </div>
    </div>
  );
};