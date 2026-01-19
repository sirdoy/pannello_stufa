/**
 * Skeleton Component - Ember Noir Design System
 *
 * Creates animated skeleton loaders that match the structure of content being loaded.
 * Dark-first design with subtle shimmer animation.
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
      className={`relative overflow-hidden rounded-xl bg-slate-700/50 [html:not(.dark)_&]:bg-slate-200 ${className}`}
      {...props}
    >
      {/* Shimmer overlay effect */}
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-slate-600/30 to-transparent [html:not(.dark)_&]:via-slate-400/40" />
    </div>
  );
}

/**
 * Skeleton.Card - Skeleton wrapper that mimics Card component
 */
Skeleton.Card = function SkeletonCard({ children, className = '', ...props }) {
  return (
    <div
      className={`bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-[0_4px_20px_rgba(0,0,0,0.3)] [html:not(.dark)_&]:bg-white/90 [html:not(.dark)_&]:border-slate-200 [html:not(.dark)_&]:shadow-[0_4px_20px_rgba(0,0,0,0.1)] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Skeleton.StovePanel - Skeleton for StoveCard component - Ember Noir
 */
Skeleton.StovePanel = function SkeletonStovePanel() {
  return (
    <div className="space-y-4 sm:space-y-6 animate-spring-in">
      <Skeleton.Card className="overflow-visible transition-all duration-500">
        <div className="relative">
          <div className="p-6 sm:p-8">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-24" />
            </div>

            {/* Status Display */}
            <div className="mb-6">
              <div className="relative bg-slate-800/60 rounded-2xl p-8 sm:p-10 border border-slate-700/50 overflow-visible [html:not(.dark)_&]:bg-slate-100/80 [html:not(.dark)_&]:border-slate-200">
                <div className="text-center mb-8 sm:mb-10">
                  <Skeleton className="h-8 w-48 mx-auto" />
                </div>
                <div className="relative flex flex-col items-center">
                  <div className="relative mb-[-40px] sm:mb-[-50px]">
                    <Skeleton className="h-[120px] w-[120px] sm:h-[140px] sm:w-[140px] rounded-full" />
                  </div>
                  <div className="relative z-10 w-full grid grid-cols-2 gap-3 sm:gap-4 mt-4">
                    <div className="relative overflow-hidden rounded-2xl bg-slate-800/60 border border-slate-700/50 [html:not(.dark)_&]:bg-white/80 [html:not(.dark)_&]:border-slate-200">
                      <div className="flex flex-col items-center justify-center p-4 sm:p-6 min-h-[100px] sm:min-h-[120px]">
                        <Skeleton className="h-6 w-6 rounded-full mb-2" />
                        <Skeleton className="h-3 w-16 mb-1" />
                        <Skeleton className="h-8 w-12" />
                      </div>
                    </div>
                    <div className="relative overflow-hidden rounded-2xl bg-slate-800/60 border border-slate-700/50 [html:not(.dark)_&]:bg-white/80 [html:not(.dark)_&]:border-slate-200">
                      <div className="flex flex-col items-center justify-center p-4 sm:p-6 min-h-[100px] sm:min-h-[120px]">
                        <Skeleton className="h-6 w-6 rounded-full mb-2" />
                        <Skeleton className="h-3 w-16 mb-1" />
                        <Skeleton className="h-8 w-12" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ON/OFF buttons */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Skeleton className="h-20 sm:h-24 rounded-xl" />
              <Skeleton className="h-20 sm:h-24 rounded-xl" />
            </div>

            {/* Divider */}
            <div className="relative my-6 sm:my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-600/50 to-transparent"></div>
              </div>
              <div className="relative flex justify-center">
                <Skeleton className="h-8 w-28 rounded-full" />
              </div>
            </div>

            {/* Mode Indicator */}
            <div className="relative overflow-hidden rounded-2xl bg-slate-800/50 border border-slate-700/50 p-5 sm:p-6 mb-6 [html:not(.dark)_&]:bg-slate-100/80 [html:not(.dark)_&]:border-slate-200">
              <div className="flex items-center gap-4 mb-4">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <div className="flex-1 min-w-0">
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>

            {/* Controls */}
            <div className="space-y-4">
              <div className="relative overflow-hidden rounded-2xl bg-slate-800/50 border border-slate-700/50 p-5 sm:p-6 [html:not(.dark)_&]:bg-slate-100/80 [html:not(.dark)_&]:border-slate-200">
                <div className="flex items-center gap-3 mb-4">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <Skeleton className="h-5 w-24" />
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton className="flex-1 h-16 sm:h-20 rounded-xl" />
                  <div className="flex flex-col items-center justify-center px-4">
                    <Skeleton className="h-3 w-12 mb-1" />
                    <Skeleton className="h-10 w-12" />
                  </div>
                  <Skeleton className="flex-1 h-16 sm:h-20 rounded-xl" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Skeleton.Card>
    </div>
  );
};

/**
 * Skeleton.ThermostatCard - Skeleton for ThermostatCard component - Ember Noir
 */
Skeleton.ThermostatCard = function SkeletonThermostatCard() {
  return (
    <div className="space-y-4 sm:space-y-6 animate-spring-in">
      <Skeleton.Card className="overflow-visible transition-all duration-500">
        <div className="relative">
          <div className="p-6 sm:p-8">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-32" />
            </div>

            {/* Room Selection */}
            <div className="mb-4 sm:mb-6">
              <Skeleton className="h-14 sm:h-16 w-full rounded-xl" />
            </div>

            {/* Temperature Display */}
            <div className="space-y-4 mb-4 sm:mb-6">
              <div className="relative rounded-2xl p-6 sm:p-8 bg-slate-800/60 border border-slate-700/50 [html:not(.dark)_&]:bg-slate-100/80 [html:not(.dark)_&]:border-slate-200">
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="relative overflow-hidden rounded-2xl bg-slate-800/60 border border-slate-700/50 [html:not(.dark)_&]:bg-white/80 [html:not(.dark)_&]:border-slate-200">
                    <div className="flex flex-col items-center justify-center p-4 sm:p-6 min-h-[120px]">
                      <Skeleton className="h-3 w-16 mb-2" />
                      <Skeleton className="h-12 sm:h-14 w-16 sm:w-20" />
                    </div>
                  </div>
                  <div className="relative overflow-hidden rounded-2xl bg-ocean-900/40 border border-ocean-500/30 [html:not(.dark)_&]:bg-ocean-50/80 [html:not(.dark)_&]:border-ocean-200">
                    <div className="flex flex-col items-center justify-center p-4 sm:p-6 min-h-[120px]">
                      <Skeleton className="h-3 w-16 mb-2" />
                      <Skeleton className="h-12 sm:h-14 w-16 sm:w-20" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Temperature controls */}
              <div className="relative overflow-hidden rounded-2xl bg-slate-800/50 border border-slate-700/50 p-4 sm:p-5 [html:not(.dark)_&]:bg-slate-100/80 [html:not(.dark)_&]:border-slate-200">
                <div className="flex items-center gap-3">
                  <Skeleton className="flex-1 h-16 sm:h-18 rounded-xl" />
                  <div className="flex flex-col items-center justify-center px-4">
                    <Skeleton className="h-3 w-12 mb-1" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                  <Skeleton className="flex-1 h-16 sm:h-18 rounded-xl" />
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="relative my-6 sm:my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-600/50 to-transparent"></div>
              </div>
              <div className="relative flex justify-center">
                <Skeleton className="h-8 w-28 rounded-full" />
              </div>
            </div>

            {/* Mode Control */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-6">
              <Skeleton className="h-20 sm:h-24 rounded-xl" />
              <Skeleton className="h-20 sm:h-24 rounded-xl" />
              <Skeleton className="h-20 sm:h-24 rounded-xl" />
              <Skeleton className="h-20 sm:h-24 rounded-xl" />
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Skeleton className="h-11 w-full rounded-xl" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </Skeleton.Card>
    </div>
  );
};

/**
 * Skeleton.LightsCard - Skeleton for LightsCard component - Ember Noir
 */
Skeleton.LightsCard = function SkeletonLightsCard() {
  return (
    <div className="space-y-4 sm:space-y-6 animate-spring-in">
      <Skeleton.Card className="overflow-visible transition-all duration-500">
        <div className="relative">
          <div className="p-6 sm:p-8">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-20" />
            </div>

            {/* Room Selection */}
            <div className="mb-4 sm:mb-6">
              <Skeleton className="h-14 sm:h-16 w-full rounded-xl" />
            </div>

            {/* Main Control Area */}
            <div className="mb-6">
              <div className="relative rounded-2xl p-6 sm:p-8 bg-slate-800/60 border border-slate-700/50 [html:not(.dark)_&]:bg-slate-100/80 [html:not(.dark)_&]:border-slate-200">
                {/* ON/OFF buttons */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <Skeleton className="h-16 sm:h-20 rounded-xl" />
                  <Skeleton className="h-16 sm:h-20 rounded-xl" />
                </div>

                {/* Brightness Control */}
                <div className="relative overflow-hidden rounded-2xl bg-slate-800/50 border border-slate-700/50 p-4 sm:p-5 [html:not(.dark)_&]:bg-white/80 [html:not(.dark)_&]:border-slate-200">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-6 w-6 rounded-full" />
                        <Skeleton className="h-5 w-24" />
                      </div>
                      <Skeleton className="h-8 w-12" />
                    </div>
                    <Skeleton className="h-3 w-full rounded-full" />
                    <div className="flex items-center gap-2">
                      <Skeleton className="flex-1 h-10 rounded-xl" />
                      <Skeleton className="flex-1 h-10 rounded-xl" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="relative my-6 sm:my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-600/50 to-transparent"></div>
              </div>
              <div className="relative flex justify-center">
                <Skeleton className="h-8 w-20 rounded-full" />
              </div>
            </div>

            {/* Scenes */}
            <div className="mb-6">
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
                <div className="flex-shrink-0 w-32 sm:w-36 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 snap-start [html:not(.dark)_&]:bg-white/80 [html:not(.dark)_&]:border-slate-200">
                  <Skeleton className="h-8 w-8 rounded-full mb-2 mx-auto" />
                  <Skeleton className="h-3 w-20 mx-auto" />
                </div>
                <div className="flex-shrink-0 w-32 sm:w-36 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 snap-start [html:not(.dark)_&]:bg-white/80 [html:not(.dark)_&]:border-slate-200">
                  <Skeleton className="h-8 w-8 rounded-full mb-2 mx-auto" />
                  <Skeleton className="h-3 w-20 mx-auto" />
                </div>
                <div className="flex-shrink-0 w-32 sm:w-36 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 snap-start [html:not(.dark)_&]:bg-white/80 [html:not(.dark)_&]:border-slate-200">
                  <Skeleton className="h-8 w-8 rounded-full mb-2 mx-auto" />
                  <Skeleton className="h-3 w-20 mx-auto" />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
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
    <div className="max-w-5xl mx-auto space-y-8 animate-spring-in">
      {/* Header Card */}
      <Skeleton.Card className="p-8">
        {/* Title */}
        <Skeleton className="h-8 sm:h-9 w-64 sm:w-80 mb-8" />

        {/* Status e toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl bg-slate-100/80 [html:not(.dark)_&]:bg-slate-100/80 bg-slate-800/60 mb-4">
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
              <div className="relative h-4 w-full bg-slate-200 [html:not(.dark)_&]:bg-slate-200 bg-slate-700/50 rounded-lg overflow-hidden shadow-inner">
                <div className="absolute top-0 bottom-0 bg-gradient-to-r from-ember-400 to-flame-500" style={{ left: '20%', width: '30%' }} />
                <div className="absolute top-0 bottom-0 bg-gradient-to-r from-ember-400 to-flame-500" style={{ left: '60%', width: '25%' }} />
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
    <li className="border-b border-slate-200 [html:not(.dark)_&]:border-slate-200 border-slate-700/50 pb-4 mb-4 last:border-b-0 flex items-start gap-3">
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
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 animate-spring-in">
      {/* Header */}
      <div className="text-center mb-8">
        <Skeleton className="h-9 w-64 mx-auto mb-2" />
        <Skeleton className="h-5 w-80 mx-auto" />
      </div>

      {/* Filters Card */}
      <Skeleton.Card className="p-6 sm:p-8">
        <Skeleton className="h-4 w-40 mb-4" />
        <div className="flex flex-wrap gap-3">
          <Skeleton className="h-9 w-24 rounded-xl" />
          <Skeleton className="h-9 w-32 rounded-xl" />
          <Skeleton className="h-9 w-36 rounded-xl" />
        </div>
      </Skeleton.Card>

      {/* Log Entries Card */}
      <Skeleton.Card className="p-6 sm:p-8">
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-spring-in">
      {/* Header */}
      <div className="mb-8">
        <Skeleton className="h-9 w-64 sm:w-80 mb-2" />
        <Skeleton className="h-5 w-80 sm:w-96" />
      </div>

      {/* Mode Control Card */}
      <Skeleton.Card className="p-8 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-36" />
          </div>
          <div className="flex flex-wrap gap-3">
            <Skeleton className="h-9 w-32 rounded-xl" />
            <Skeleton className="h-9 w-28 rounded-xl" />
            <Skeleton className="h-9 w-28 rounded-xl" />
            <Skeleton className="h-9 w-20 rounded-xl" />
          </div>
        </div>
      </Skeleton.Card>

      {/* Topology Info Card */}
      <Skeleton.Card className="p-8 mb-8">
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
        <div className="mt-4 pt-4 border-t border-slate-200 [html:not(.dark)_&]:border-slate-200 border-slate-700/50">
          <Skeleton className="h-9 w-56 rounded-xl" />
        </div>
      </Skeleton.Card>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[...Array(6)].map((_, i) => (
          <Skeleton.Card key={i} className="p-8">
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