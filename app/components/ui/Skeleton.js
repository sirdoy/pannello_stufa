/**
 * Skeleton - Loading placeholder component
 *
 * Creates animated skeleton loaders that match the structure of content being loaded.
 * Enhanced with liquid glass design and improved shimmer animation for better UX.
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
      className={`relative overflow-hidden rounded-xl bg-neutral-200/80 dark:bg-neutral-700/50 ${className}`}
      {...props}
    >
      {/* Shimmer overlay effect */}
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent" />
    </div>
  );
}

/**
 * Skeleton.Card - Skeleton wrapper that mimics Card component
 */
Skeleton.Card = function SkeletonCard({ children, className = '', ...props }) {
  return (
    <div
      className={`bg-white/[0.12] dark:bg-white/[0.08] backdrop-blur-3xl rounded-3xl shadow-liquid ring-1 ring-white/25 dark:ring-white/15 ring-inset ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Skeleton.StovePanel - Skeleton for StoveCard component (homepage stove control)
 * Updated to match new design with +/- controls, no refresh button
 */
Skeleton.StovePanel = function SkeletonStovePanel() {
  return (
    <div className="space-y-4 sm:space-y-6 animate-spring-in">
      {/* Main Status Card */}
      <Skeleton.Card className="overflow-visible transition-all duration-500">
        <div className="relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 via-accent-500 to-primary-500 opacity-80"></div>

          <div className="p-6 sm:p-8">
            {/* Header - Simplified (no refresh button) */}
            <div className="flex items-center gap-2 mb-6">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-24" />
            </div>

            {/* Hero Section - Giant Icon */}
            <div className="mb-6">
              <div className="relative bg-gradient-to-b from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800 rounded-3xl p-8 sm:p-10 shadow-liquid-lg overflow-visible">
                <div className="relative">
                  {/* Status text */}
                  <div className="text-center mb-8 sm:mb-10">
                    <Skeleton className="h-8 w-48 mx-auto" />
                  </div>

                  {/* Giant icon + glassmorphism boxes */}
                  <div className="relative flex flex-col items-center">
                    {/* Giant icon */}
                    <div className="relative mb-[-40px] sm:mb-[-50px]">
                      <Skeleton className="h-[120px] w-[120px] sm:h-[140px] sm:w-[140px] rounded-full" />
                    </div>

                    {/* Info boxes (Ventilation + Power) */}
                    <div className="relative z-10 w-full grid grid-cols-2 gap-3 sm:gap-4 mt-4">
                      {/* Ventilation box */}
                      <div className="relative overflow-hidden rounded-2xl shadow-liquid backdrop-blur-3xl bg-white/[0.08] dark:bg-white/[0.05]">
                        <div className="relative z-10 flex flex-col items-center justify-center p-4 sm:p-6 min-h-[100px] sm:min-h-[120px]">
                          <Skeleton className="h-6 w-6 rounded-full mb-2" />
                          <Skeleton className="h-3 w-16 mb-1" />
                          <Skeleton className="h-8 w-12" />
                        </div>
                      </div>

                      {/* Power box */}
                      <div className="relative overflow-hidden rounded-2xl shadow-liquid backdrop-blur-3xl bg-white/[0.08] dark:bg-white/[0.05]">
                        <div className="relative z-10 flex flex-col items-center justify-center p-4 sm:p-6 min-h-[100px] sm:min-h-[120px]">
                          <Skeleton className="h-6 w-6 rounded-full mb-2" />
                          <Skeleton className="h-3 w-16 mb-1" />
                          <Skeleton className="h-8 w-12" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* PRIMARY ACTIONS - ON/OFF buttons */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Skeleton className="h-20 sm:h-24 rounded-xl" />
              <Skeleton className="h-20 sm:h-24 rounded-xl" />
            </div>

            {/* Divider */}
            <div className="relative my-6 sm:my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full h-px bg-gradient-to-r from-transparent via-neutral-300/50 dark:via-neutral-600/50 to-transparent"></div>
              </div>
              <div className="relative flex justify-center">
                <Skeleton className="h-8 w-28 rounded-full" />
              </div>
            </div>

            {/* Mode Indicator */}
            <div className="relative overflow-hidden rounded-2xl shadow-liquid backdrop-blur-3xl bg-white/[0.08] dark:bg-white/[0.05] border border-white/20 dark:border-white/10 p-5 sm:p-6 mb-6">
              <div className="flex items-center gap-4 mb-4">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <div className="flex-1 min-w-0">
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>

            {/* Maintenance Bar */}
            <div className="mb-6">
              <Skeleton className="h-20 w-full rounded-2xl" />
            </div>

            {/* Divider */}
            <div className="relative my-6 sm:my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full h-px bg-gradient-to-r from-transparent via-neutral-300/50 dark:via-neutral-600/50 to-transparent"></div>
              </div>
              <div className="relative flex justify-center">
                <Skeleton className="h-8 w-32 rounded-full" />
              </div>
            </div>

            {/* Ventilation Control - +/- buttons */}
            <div className="relative overflow-hidden rounded-2xl shadow-liquid backdrop-blur-3xl bg-white/[0.08] dark:bg-white/[0.05] border border-white/20 dark:border-white/10 p-5 sm:p-6 mb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-5 w-24" />
                </div>
                <Skeleton className="h-10 w-10" />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="flex-1 h-16 sm:h-18 rounded-xl" />
                <div className="flex flex-col items-center justify-center px-4">
                  <Skeleton className="h-3 w-12 mb-1" />
                  <Skeleton className="h-6 w-8" />
                </div>
                <Skeleton className="flex-1 h-16 sm:h-18 rounded-xl" />
              </div>
            </div>

            {/* Power Control - +/- buttons */}
            <div className="relative overflow-hidden rounded-2xl shadow-liquid backdrop-blur-3xl bg-white/[0.08] dark:bg-white/[0.05] border border-white/20 dark:border-white/10 p-5 sm:p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <Skeleton className="h-10 w-10" />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="flex-1 h-16 sm:h-18 rounded-xl" />
                <div className="flex flex-col items-center justify-center px-4">
                  <Skeleton className="h-3 w-12 mb-1" />
                  <Skeleton className="h-6 w-8" />
                </div>
                <Skeleton className="flex-1 h-16 sm:h-18 rounded-xl" />
              </div>
            </div>

            {/* Divider */}
            <div className="relative my-6 sm:my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full h-px bg-gradient-to-r from-transparent via-neutral-300/50 dark:via-neutral-600/50 to-transparent"></div>
              </div>
              <div className="relative flex justify-center">
                <Skeleton className="h-8 w-36 rounded-full" />
              </div>
            </div>

            {/* Summary Info - 3 boxes */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
              <div className="relative overflow-hidden rounded-2xl shadow-liquid backdrop-blur-3xl bg-white/[0.08] dark:bg-white/[0.05] border border-white/20 dark:border-white/10">
                <div className="relative z-10 flex flex-col items-center justify-center p-4 sm:p-5 min-h-[100px]">
                  <Skeleton className="h-8 w-8 rounded-full mb-2" />
                  <Skeleton className="h-3 w-16 mb-1" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>
              <div className="relative overflow-hidden rounded-2xl shadow-liquid backdrop-blur-3xl bg-white/[0.08] dark:bg-white/[0.05] border border-white/20 dark:border-white/10">
                <div className="relative z-10 flex flex-col items-center justify-center p-4 sm:p-5 min-h-[100px]">
                  <Skeleton className="h-8 w-8 rounded-full mb-2" />
                  <Skeleton className="h-3 w-16 mb-1" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
              <div className="relative overflow-hidden rounded-2xl shadow-liquid backdrop-blur-3xl bg-white/[0.08] dark:bg-white/[0.05] border border-white/20 dark:border-white/10 col-span-2 sm:col-span-1">
                <div className="relative z-10 flex flex-col items-center justify-center p-4 sm:p-5 min-h-[100px]">
                  <Skeleton className="h-8 w-8 rounded-full mb-2" />
                  <Skeleton className="h-3 w-16 mb-1" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>
            </div>

            {/* Action buttons */}
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
 * Skeleton.ThermostatCard - Skeleton for ThermostatCard component (homepage thermostat control)
 * Updated to match new design with enhanced controls, no refresh button
 */
Skeleton.ThermostatCard = function SkeletonThermostatCard() {
  return (
    <div className="space-y-4 sm:space-y-6 animate-spring-in">
      {/* Main Status Card */}
      <Skeleton.Card className="overflow-visible transition-all duration-500">
        <div className="relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-info-500 via-info-400 to-info-500 opacity-80"></div>

          <div className="p-6 sm:p-8">
            {/* Header - Simplified (no refresh button) */}
            <div className="flex items-center gap-2 mb-6">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-32" />
            </div>

            {/* Room Selection (if multiple rooms) */}
            <div className="mb-4 sm:mb-6">
              <Skeleton className="h-14 sm:h-16 w-full rounded-xl" />
            </div>

            {/* Temperature Display */}
            <div className="space-y-4 mb-4 sm:mb-6">
              {/* Main Temperature Display - Enhanced with gradient background */}
              <div className="relative rounded-2xl p-6 sm:p-8 shadow-liquid bg-gradient-to-br from-info-50 to-info-100 dark:from-info-900/20 dark:to-info-800/20">
                {/* Temperature Display Grid */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {/* Current Temperature Box */}
                  <div className="relative overflow-hidden rounded-2xl shadow-liquid backdrop-blur-3xl bg-white/[0.15] dark:bg-white/[0.08]">
                    <div className="relative z-10 flex flex-col items-center justify-center p-4 sm:p-6 min-h-[120px]">
                      <Skeleton className="h-3 w-16 mb-2" />
                      <Skeleton className="h-12 sm:h-14 w-16 sm:w-20" />
                    </div>
                  </div>

                  {/* Target Temperature Box */}
                  <div className="relative overflow-hidden rounded-2xl shadow-liquid backdrop-blur-3xl bg-white/[0.15] dark:bg-white/[0.08]">
                    <div className="relative z-10 flex flex-col items-center justify-center p-4 sm:p-6 min-h-[120px]">
                      <Skeleton className="h-3 w-16 mb-2" />
                      <Skeleton className="h-12 sm:h-14 w-16 sm:w-20" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick temperature controls - Enhanced */}
              <div className="relative overflow-hidden rounded-2xl shadow-liquid backdrop-blur-3xl bg-white/[0.08] dark:bg-white/[0.05] border border-white/20 dark:border-white/10 p-4 sm:p-5">
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

            {/* Separator */}
            <div className="relative my-6 sm:my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full h-px bg-gradient-to-r from-transparent via-neutral-300/50 dark:via-neutral-600/50 to-transparent"></div>
              </div>
              <div className="relative flex justify-center">
                <Skeleton className="h-8 w-28 rounded-full" />
              </div>
            </div>

            {/* Mode Control - 4 buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-6">
              <Skeleton className="h-20 sm:h-24 rounded-xl" />
              <Skeleton className="h-20 sm:h-24 rounded-xl" />
              <Skeleton className="h-20 sm:h-24 rounded-xl" />
              <Skeleton className="h-20 sm:h-24 rounded-xl" />
            </div>

            {/* Separator */}
            <div className="relative my-6 sm:my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full h-px bg-gradient-to-r from-transparent via-neutral-300/50 dark:via-neutral-600/50 to-transparent"></div>
              </div>
              <div className="relative flex justify-center">
                <Skeleton className="h-8 w-32 rounded-full" />
              </div>
            </div>

            {/* Summary Info - 3 boxes */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
              <div className="relative overflow-hidden rounded-2xl shadow-liquid backdrop-blur-3xl bg-white/[0.08] dark:bg-white/[0.05] border border-white/20 dark:border-white/10">
                <div className="relative z-10 flex flex-col items-center justify-center p-4 sm:p-5 min-h-[100px]">
                  <Skeleton className="h-8 w-8 rounded-full mb-2" />
                  <Skeleton className="h-3 w-12 mb-1" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl shadow-liquid backdrop-blur-3xl bg-white/[0.08] dark:bg-white/[0.05] border border-white/20 dark:border-white/10">
                <div className="relative z-10 flex flex-col items-center justify-center p-4 sm:p-5 min-h-[100px]">
                  <Skeleton className="h-8 w-8 rounded-full mb-2" />
                  <Skeleton className="h-3 w-12 mb-1" />
                  <Skeleton className="h-6 w-12" />
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl shadow-liquid backdrop-blur-3xl bg-white/[0.08] dark:bg-white/[0.05] border border-white/20 dark:border-white/10 col-span-2 sm:col-span-1">
                <div className="relative z-10 flex flex-col items-center justify-center p-4 sm:p-5 min-h-[100px]">
                  <Skeleton className="h-8 w-8 rounded-full mb-2" />
                  <Skeleton className="h-3 w-16 mb-1" />
                  <Skeleton className="h-6 w-12" />
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
 * Skeleton.LightsCard - Skeleton for LightsCard component (homepage lights control)
 * Updated to match new design with brightness controls and scrollable scenes
 */
Skeleton.LightsCard = function SkeletonLightsCard() {
  return (
    <div className="space-y-4 sm:space-y-6 animate-spring-in">
      {/* Main Status Card */}
      <Skeleton.Card className="overflow-visible transition-all duration-500">
        <div className="relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-warning-500 via-warning-400 to-warning-500 opacity-80"></div>

          <div className="p-6 sm:p-8">
            {/* Header - Simplified (no refresh button) */}
            <div className="flex items-center gap-2 mb-6">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-20" />
            </div>

            {/* Room Selection (if multiple rooms) */}
            <div className="mb-4 sm:mb-6">
              <Skeleton className="h-14 sm:h-16 w-full rounded-xl" />
            </div>

            {/* Lights Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
              {/* Light 1 */}
              <div className="relative overflow-hidden rounded-2xl shadow-liquid backdrop-blur-3xl bg-white/[0.15] dark:bg-white/[0.08] border border-white/20 dark:border-white/10">
                <div className="relative z-10 flex flex-col items-center justify-center p-4 sm:p-5 min-h-[100px]">
                  <Skeleton className="h-8 w-8 rounded-full mb-2" />
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-6 w-6 rounded-full" />
                </div>
              </div>

              {/* Light 2 */}
              <div className="relative overflow-hidden rounded-2xl shadow-liquid backdrop-blur-3xl bg-white/[0.15] dark:bg-white/[0.08] border border-white/20 dark:border-white/10">
                <div className="relative z-10 flex flex-col items-center justify-center p-4 sm:p-5 min-h-[100px]">
                  <Skeleton className="h-8 w-8 rounded-full mb-2" />
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-6 w-6 rounded-full" />
                </div>
              </div>

              {/* Light 3 */}
              <div className="relative overflow-hidden rounded-2xl shadow-liquid backdrop-blur-3xl bg-white/[0.15] dark:bg-white/[0.08] border border-white/20 dark:border-white/10 col-span-2 sm:col-span-1">
                <div className="relative z-10 flex flex-col items-center justify-center p-4 sm:p-5 min-h-[100px]">
                  <Skeleton className="h-8 w-8 rounded-full mb-2" />
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-6 w-6 rounded-full" />
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="relative my-6 sm:my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full h-px bg-gradient-to-r from-transparent via-neutral-300/50 dark:via-neutral-600/50 to-transparent"></div>
              </div>
              <div className="relative flex justify-center">
                <Skeleton className="h-8 w-28 rounded-full" />
              </div>
            </div>

            {/* Brightness Control */}
            <div className="relative overflow-hidden rounded-2xl shadow-liquid backdrop-blur-3xl bg-white/[0.15] dark:bg-white/[0.08] p-4 sm:p-5 mb-6">
              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                  <Skeleton className="h-8 w-12" />
                </div>
                {/* Slider */}
                <Skeleton className="h-3 w-full rounded-full" />
                {/* Buttons */}
                <div className="flex items-center gap-2">
                  <Skeleton className="flex-1 h-10 rounded-xl" />
                  <Skeleton className="flex-1 h-10 rounded-xl" />
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="relative my-6 sm:my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full h-px bg-gradient-to-r from-transparent via-neutral-300/50 dark:via-neutral-600/50 to-transparent"></div>
              </div>
              <div className="relative flex justify-center">
                <Skeleton className="h-8 w-20 rounded-full" />
              </div>
            </div>

            {/* Scenes - Horizontal Scroll */}
            <div className="mb-6">
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
                {/* Scene 1 */}
                <div className="flex-shrink-0 w-32 sm:w-36 p-4 rounded-xl border-2 bg-white/60 dark:bg-white/[0.03] border-neutral-200 dark:border-neutral-700 snap-start">
                  <Skeleton className="h-12 w-12 rounded-full mb-2 mx-auto" />
                  <Skeleton className="h-3 w-20 mx-auto" />
                </div>
                {/* Scene 2 */}
                <div className="flex-shrink-0 w-32 sm:w-36 p-4 rounded-xl border-2 bg-white/60 dark:bg-white/[0.03] border-neutral-200 dark:border-neutral-700 snap-start">
                  <Skeleton className="h-12 w-12 rounded-full mb-2 mx-auto" />
                  <Skeleton className="h-3 w-20 mx-auto" />
                </div>
                {/* Scene 3 */}
                <div className="flex-shrink-0 w-32 sm:w-36 p-4 rounded-xl border-2 bg-white/60 dark:bg-white/[0.03] border-neutral-200 dark:border-neutral-700 snap-start">
                  <Skeleton className="h-12 w-12 rounded-full mb-2 mx-auto" />
                  <Skeleton className="h-3 w-20 mx-auto" />
                </div>
                {/* Scene 4 */}
                <div className="flex-shrink-0 w-32 sm:w-36 p-4 rounded-xl border-2 bg-white/60 dark:bg-white/[0.03] border-neutral-200 dark:border-neutral-700 snap-start">
                  <Skeleton className="h-12 w-12 rounded-full mb-2 mx-auto" />
                  <Skeleton className="h-3 w-20 mx-auto" />
                </div>
              </div>
              <div className="text-center mt-2">
                <Skeleton className="h-3 w-48 mx-auto" />
              </div>
            </div>

            {/* Divider */}
            <div className="relative my-6 sm:my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full h-px bg-gradient-to-r from-transparent via-neutral-300/50 dark:via-neutral-600/50 to-transparent"></div>
              </div>
              <div className="relative flex justify-center">
                <Skeleton className="h-8 w-32 rounded-full" />
              </div>
            </div>

            {/* Summary Info - 3 boxes */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
              <div className="relative overflow-hidden rounded-2xl shadow-liquid backdrop-blur-3xl bg-white/[0.08] dark:bg-white/[0.05] border border-white/20 dark:border-white/10">
                <div className="relative z-10 flex flex-col items-center justify-center p-4 sm:p-5 min-h-[100px]">
                  <Skeleton className="h-8 w-8 rounded-full mb-2" />
                  <Skeleton className="h-3 w-12 mb-1" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl shadow-liquid backdrop-blur-3xl bg-white/[0.08] dark:bg-white/[0.05] border border-white/20 dark:border-white/10">
                <div className="relative z-10 flex flex-col items-center justify-center p-4 sm:p-5 min-h-[100px]">
                  <Skeleton className="h-8 w-8 rounded-full mb-2" />
                  <Skeleton className="h-3 w-12 mb-1" />
                  <Skeleton className="h-6 w-12" />
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl shadow-liquid backdrop-blur-3xl bg-white/[0.08] dark:bg-white/[0.05] border border-white/20 dark:border-white/10 col-span-2 sm:col-span-1">
                <div className="relative z-10 flex flex-col items-center justify-center p-4 sm:p-5 min-h-[100px]">
                  <Skeleton className="h-8 w-8 rounded-full mb-2" />
                  <Skeleton className="h-3 w-16 mb-1" />
                  <Skeleton className="h-6 w-12" />
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
        <div className="mt-4 pt-4 border-t border-neutral-200">
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