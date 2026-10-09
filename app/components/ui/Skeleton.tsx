import type { ReactNode, HTMLAttributes } from 'react';

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
 * <Skeleton className="h-6 w-1/2 mb-4" />
 * <Skeleton className="h-4 w-full mb-2" />
 * <Skeleton className="h-4 w-3/4" />
 * </Skeleton.Card>
 */
export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export default function Skeleton({ className = '', ...props }: SkeletonProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-white/5 ${className}`}
      {...props}
    >
      {/* Shimmer overlay effect */}
      <div className="animate-shimmer absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/8 to-transparent" />
    </div>
  );
}

/**
 * Skeleton.Card - Skeleton wrapper that mimics Card component
 */
interface SkeletonCardProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

Skeleton.Card = function SkeletonCard({ children, className = '', ...props }: SkeletonCardProps) {
  return (
    <div
      className={`rounded-(--r-card) border-[0.5px] border-white/8 bg-white/4 ${className}`}
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
    <div className="animate-spring-in space-y-4 sm:space-y-6">
      <Skeleton.Card className="overflow-visible transition-all duration-500">
        <div className="relative">
          <div className="p-6 sm:p-8">
            {/* Header */}
            <div className="mb-6 flex items-center gap-3">
              <Skeleton className="size-8 rounded-full" />
              <Skeleton className="h-8 w-24" />
            </div>

            {/* Status Display */}
            <div className="mb-6">
              <div className="relative overflow-visible rounded-2xl border border-slate-700/50 bg-slate-800/60 p-8 sm:p-10 ">
                <div className="mb-8 text-center sm:mb-10">
                  <Skeleton className="mx-auto h-8 w-48" />
                </div>
                <div className="relative flex flex-col items-center">
                  <div className="relative -mb-10 sm:mb-[-50px]">
                    <Skeleton className="size-[120px] rounded-full sm:size-[140px]" />
                  </div>
                  <div className="relative z-10 mt-4 grid w-full grid-cols-2 gap-3 sm:gap-4">
                    <div className="relative overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-800/60 ">
                      <div className="flex min-h-25 flex-col items-center justify-center p-4 sm:min-h-30 sm:p-6">
                        <Skeleton className="mb-2 size-6 rounded-full" />
                        <Skeleton className="mb-1 h-3 w-16" />
                        <Skeleton className="h-8 w-12" />
                      </div>
                    </div>
                    <div className="relative overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-800/60 ">
                      <div className="flex min-h-25 flex-col items-center justify-center p-4 sm:min-h-30 sm:p-6">
                        <Skeleton className="mb-2 size-6 rounded-full" />
                        <Skeleton className="mb-1 h-3 w-16" />
                        <Skeleton className="h-8 w-12" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ON/OFF buttons */}
            <div className="mb-6 grid grid-cols-2 gap-4">
              <Skeleton className="h-20 rounded-xl sm:h-24" />
              <Skeleton className="h-20 rounded-xl sm:h-24" />
            </div>

            {/* Divider */}
            <div className="relative my-6 sm:my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="h-px w-full bg-linear-to-r from-transparent via-slate-600/50 to-transparent"></div>
              </div>
              <div className="relative flex justify-center">
                <Skeleton className="h-8 w-28 rounded-full" />
              </div>
            </div>

            {/* Mode Indicator */}
            <div className="relative mb-6 overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-800/50 p-5 sm:p-6 ">
              <div className="mb-4 flex items-center gap-4">
                <Skeleton className="size-12 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <Skeleton className="mb-2 h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>

            {/* Controls */}
            <div className="space-y-4">
              <div className="relative overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-800/50 p-5 sm:p-6 ">
                <div className="mb-4 flex items-center gap-3">
                  <Skeleton className="size-10 rounded-xl" />
                  <Skeleton className="h-5 w-24" />
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-16 flex-1 rounded-xl sm:h-20" />
                  <div className="flex flex-col items-center justify-center px-4">
                    <Skeleton className="mb-1 h-3 w-12" />
                    <Skeleton className="h-10 w-12" />
                  </div>
                  <Skeleton className="h-16 flex-1 rounded-xl sm:h-20" />
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
    <div className="animate-spring-in space-y-4 sm:space-y-6">
      <Skeleton.Card className="overflow-visible transition-all duration-500">
        <div className="relative">
          <div className="p-6 sm:p-8">
            {/* Header */}
            <div className="mb-6 flex items-center gap-3">
              <Skeleton className="size-8 rounded-full" />
              <Skeleton className="h-8 w-32" />
            </div>

            {/* Room Selection */}
            <div className="mb-4 sm:mb-6">
              <Skeleton className="h-14 w-full rounded-xl sm:h-16" />
            </div>

            {/* Temperature Display */}
            <div className="mb-4 space-y-4 sm:mb-6">
              <div className="relative rounded-2xl border border-slate-700/50 bg-slate-800/60 p-6 sm:p-8 ">
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="relative overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-800/60 ">
                    <div className="flex min-h-30 flex-col items-center justify-center p-4 sm:p-6">
                      <Skeleton className="mb-2 h-3 w-16" />
                      <Skeleton className="h-12 w-16 sm:h-14 sm:w-20" />
                    </div>
                  </div>
                  <div className="relative overflow-hidden rounded-2xl border border-ocean-500/30 bg-ocean-900/40 ">
                    <div className="flex min-h-30 flex-col items-center justify-center p-4 sm:p-6">
                      <Skeleton className="mb-2 h-3 w-16" />
                      <Skeleton className="h-12 w-16 sm:h-14 sm:w-20" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Temperature controls */}
              <div className="relative overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-800/50 p-4 sm:p-5 ">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-16 flex-1 rounded-xl sm:h-18" />
                  <div className="flex flex-col items-center justify-center px-4">
                    <Skeleton className="mb-1 h-3 w-12" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                  <Skeleton className="h-16 flex-1 rounded-xl sm:h-18" />
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="relative my-6 sm:my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="h-px w-full bg-linear-to-r from-transparent via-slate-600/50 to-transparent"></div>
              </div>
              <div className="relative flex justify-center">
                <Skeleton className="h-8 w-28 rounded-full" />
              </div>
            </div>

            {/* Mode Control */}
            <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
              <Skeleton className="h-20 rounded-xl sm:h-24" />
              <Skeleton className="h-20 rounded-xl sm:h-24" />
              <Skeleton className="h-20 rounded-xl sm:h-24" />
              <Skeleton className="h-20 rounded-xl sm:h-24" />
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
    <div className="animate-spring-in space-y-4 sm:space-y-6">
      <Skeleton.Card className="overflow-visible transition-all duration-500">
        <div className="relative">
          <div className="p-6 sm:p-8">
            {/* Header */}
            <div className="mb-6 flex items-center gap-3">
              <Skeleton className="size-8 rounded-full" />
              <Skeleton className="h-8 w-20" />
            </div>

            {/* Room Selection */}
            <div className="mb-4 sm:mb-6">
              <Skeleton className="h-14 w-full rounded-xl sm:h-16" />
            </div>

            {/* Main Control Area */}
            <div className="mb-6">
              <div className="relative rounded-2xl border border-slate-700/50 bg-slate-800/60 p-6 sm:p-8 ">
                {/* ON/OFF buttons */}
                <div className="mb-6 grid grid-cols-2 gap-4">
                  <Skeleton className="h-16 rounded-xl sm:h-20" />
                  <Skeleton className="h-16 rounded-xl sm:h-20" />
                </div>

                {/* Brightness Control */}
                <div className="relative overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-800/50 p-4 sm:p-5 ">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Skeleton className="size-6 rounded-full" />
                        <Skeleton className="h-5 w-24" />
                      </div>
                      <Skeleton className="h-8 w-12" />
                    </div>
                    <Skeleton className="h-3 w-full rounded-full" />
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-10 flex-1 rounded-xl" />
                      <Skeleton className="h-10 flex-1 rounded-xl" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="relative my-6 sm:my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="h-px w-full bg-linear-to-r from-transparent via-slate-600/50 to-transparent"></div>
              </div>
              <div className="relative flex justify-center">
                <Skeleton className="h-8 w-20 rounded-full" />
              </div>
            </div>

            {/* Scenes */}
            <div className="mb-6">
              <div className="scrollbar-hide flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
                <div className="w-32 shrink-0 snap-start rounded-xl border border-slate-700/50 bg-slate-800/50 p-4 sm:w-36 ">
                  <Skeleton className="mx-auto mb-2 size-8 rounded-full" />
                  <Skeleton className="mx-auto h-3 w-20" />
                </div>
                <div className="w-32 shrink-0 snap-start rounded-xl border border-slate-700/50 bg-slate-800/50 p-4 sm:w-36 ">
                  <Skeleton className="mx-auto mb-2 size-8 rounded-full" />
                  <Skeleton className="mx-auto h-3 w-20" />
                </div>
                <div className="w-32 shrink-0 snap-start rounded-xl border border-slate-700/50 bg-slate-800/50 p-4 sm:w-36 ">
                  <Skeleton className="mx-auto mb-2 size-8 rounded-full" />
                  <Skeleton className="mx-auto h-3 w-20" />
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
 * Skeleton.WeatherCard - Skeleton for WeatherCard component - Ember Noir
 */
Skeleton.WeatherCard = function SkeletonWeatherCard() {
  return (
    <div className="animate-spring-in space-y-4 sm:space-y-6">
      <Skeleton.Card className="overflow-visible transition-all duration-500">
        <div className="relative">
          <div className="p-6 sm:p-8">
            {/* Header */}
            <div className="mb-6 flex items-center gap-3">
              <Skeleton className="size-8 rounded-full" />
              <Skeleton className="h-8 w-20" />
            </div>

            {/* Status badge */}
            <div className="mb-4">
              <Skeleton className="h-6 w-40 rounded-full" />
            </div>

            {/* Current conditions - main display */}
            <div className="mb-6">
              <div className="mb-4 flex items-start gap-4">
                {/* Weather icon */}
                <Skeleton className="size-16 shrink-0 rounded-full" />
                {/* Temperature + condition */}
                <div className="flex-1">
                  <Skeleton className="mb-2 h-12 w-24" />
                  <Skeleton className="mb-1 h-5 w-40" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>

              {/* Weather details grid */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex flex-col items-center rounded-xl bg-slate-800/40 p-3 ">
                    <Skeleton className="mb-2 size-5 rounded-full" />
                    <Skeleton className="mb-1 h-3 w-12" />
                    <Skeleton className="h-4 w-10" />
                  </div>
                ))}
              </div>
            </div>

            {/* Forecast row */}
            <div className="flex gap-3 overflow-x-hidden pb-2">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-20 shrink-0 rounded-xl bg-slate-800/40 p-3 "
                >
                  <Skeleton className="mx-auto mb-2 h-3 w-10" />
                  <Skeleton className="mx-auto mb-2 size-8 rounded-full" />
                  <Skeleton className="mx-auto mb-1 h-4 w-12" />
                  <Skeleton className="mx-auto h-3 w-8" />
                </div>
              ))}
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
    <div className="animate-spring-in mx-auto max-w-5xl space-y-8">
      {/* Header Card */}
      <Skeleton.Card className="p-8">
        {/* Status e toggle */}
        <div className="mb-4 flex flex-col gap-4 rounded-xl bg-slate-100/80 bg-slate-800/60 p-4 sm:flex-row sm:items-center sm:justify-between">
          {/* ModeIndicator */}
          <div className="flex items-center gap-2">
            <Skeleton className="size-6 rounded-lg" />
            <div>
              <Skeleton className="mb-1 h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>

          {/* Toggle button */}
          <Skeleton className="h-10 w-full rounded-xl sm:h-11 sm:w-40" />
        </div>

        {/* Pulsanti Espandi/Comprimi */}
        <div className="flex justify-end gap-3">
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
              <div className="flex flex-1 items-center gap-4">
                <Skeleton className="size-8 rounded-lg" />
                <div>
                  <Skeleton className="mb-2 h-6 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>

              {/* Expand icon */}
              <Skeleton className="size-6 rounded-lg" />
            </div>

            {/* TimeBar compatta */}
            <div className="mt-4">
              <div className="relative h-4 w-full overflow-hidden rounded-lg bg-slate-200 bg-slate-700/50 shadow-inner">
                <div className="absolute inset-y-0 bg-linear-to-r from-ember-400 to-flame-500" style={{ left: '20%', width: '30%' }} />
                <div className="absolute inset-y-0 bg-linear-to-r from-ember-400 to-flame-500" style={{ left: '60%', width: '25%' }} />
              </div>
            </div>
          </div>
        </Skeleton.Card>
      ))}
    </div>
  );
};

/**
 * Skeleton.CameraCard - Skeleton for CameraCard component
 */
Skeleton.CameraCard = function SkeletonCameraCard() {
  return (
    <Skeleton.Card className="overflow-hidden">
      <div className="p-6">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="size-8 rounded-full" />
            <Skeleton className="h-7 w-28" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>

        {/* Toggle buttons */}
        <div className="mb-3 flex gap-2">
          <Skeleton className="h-8 w-20 rounded-lg" />
          <Skeleton className="h-8 w-16 rounded-lg" />
        </div>

        {/* Video preview area */}
        <div className="relative mb-4 aspect-video overflow-hidden rounded-xl bg-slate-800">
          <div className="absolute inset-0 flex items-center justify-center">
            <Skeleton className="size-12 rounded-full" />
          </div>
          {/* Status badge */}
          <Skeleton className="absolute top-2 right-2 h-6 w-14 rounded-full" />
          {/* Fullscreen/Refresh button */}
          <Skeleton className="absolute right-2 bottom-2 size-9 rounded-full" />
        </div>

        {/* Camera info */}
        <div className="mb-4 flex items-center gap-2">
          <Skeleton className="h-4 w-32" />
        </div>

        {/* Footer action */}
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
    </Skeleton.Card>
  );
};

/**
 * Skeleton.LogEntry - Skeleton for single log entry
 */
Skeleton.LogEntry = function SkeletonLogEntry() {
  return (
    <li className="mb-4 flex items-start gap-3 border-b border-slate-200 border-slate-700/50 pb-4 last:border-b-0">
      {/* Icon */}
      <Skeleton className="mt-1 size-8 shrink-0 rounded-full" />

      <div className="min-w-0 flex-1">
        {/* User & Device Badge Row */}
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Skeleton className="size-6 rounded-full" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-5 w-20 rounded-md" />
        </div>

        {/* Timestamp */}
        <Skeleton className="mb-2 h-3 w-40" />

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
    <div className="animate-spring-in mx-auto max-w-5xl space-y-8">

      {/* Filters Card */}
      <Skeleton.Card className="p-6 sm:p-8">
        <Skeleton className="mb-4 h-4 w-40" />
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
 * Skeleton.Changelog - Skeleton for Changelog page with timeline
 */
Skeleton.Changelog = function SkeletonChangelog() {
  return (
    <div className="animate-spring-in space-y-8">
      {/* Header Card */}
      <Skeleton.Card className="overflow-hidden">
        {/* Accent bar */}
        <div className="h-1 bg-linear-to-r from-ember-500/50 via-flame-500/50 to-ember-600/50" />

        <div className="p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1">
              <div className="mb-3 flex items-center gap-3">
                <Skeleton className="size-12 rounded-2xl" />
                <div>
                  <Skeleton className="mb-2 h-7 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <Skeleton className="h-4 w-64" />
            </div>

            {/* Version Badge */}
            <div className="flex flex-col items-start gap-2 sm:items-end">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-12 w-28 rounded-xl" />
              <div className="mt-1 flex items-center gap-2">
                <Skeleton className="size-2 rounded-full" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </div>
        </div>
      </Skeleton.Card>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute inset-y-8 left-[23px] w-px bg-slate-700/30 sm:left-[27px] " />

        <div className="space-y-6">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="relative pl-14 sm:pl-16">
              {/* Timeline dot */}
              <Skeleton className="absolute top-6 left-0 size-12 rounded-2xl sm:size-14" />

              <Skeleton.Card className="overflow-hidden">
                {/* Header */}
                <div className="border-b border-slate-700/30 bg-slate-800/30 p-5 sm:p-6 ">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-6 w-24" />
                      <Skeleton className="h-6 w-20 rounded-full" />
                      {index === 0 && <Skeleton className="h-6 w-16 rounded-full" />}
                    </div>
                    <Skeleton className="h-4 w-28" />
                  </div>
                </div>

                {/* Changes List */}
                <div className="space-y-3 p-5 sm:p-6">
                  {[...Array(3)].map((_, changeIndex) => (
                    <div key={changeIndex} className="flex items-start gap-3">
                      <Skeleton className="mt-0.5 size-5 shrink-0 rounded-full" />
                      <Skeleton className={`h-4 flex-1 ${changeIndex === 2 ? 'w-3/4' : 'w-full'}`} />
                    </div>
                  ))}
                </div>
              </Skeleton.Card>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Legend */}
      <Skeleton.Card className="p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <Skeleton className="size-3 rounded-full" />
            <Skeleton className="h-3 w-20" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="size-3 rounded-full" />
            <Skeleton className="h-3 w-20" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="size-3 rounded-full" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
        <div className="mb-4 h-px w-full bg-linear-to-r from-transparent via-slate-600/30 to-transparent" />
        <div className="flex justify-center">
          <Skeleton className="h-3 w-56" />
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
    <div className="animate-spring-in mx-auto max-w-7xl">

      {/* Mode Control Card */}
      <Skeleton.Card className="mb-8 p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Skeleton className="mb-2 h-6 w-48" />
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
      <Skeleton.Card className="mb-8 p-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <Skeleton className="mb-2 h-4 w-16" />
            <Skeleton className="h-6 w-32" />
          </div>
          <div>
            <Skeleton className="mb-2 h-4 w-16" />
            <Skeleton className="h-6 w-12" />
          </div>
          <div>
            <Skeleton className="mb-2 h-4 w-20" />
            <Skeleton className="h-6 w-12" />
          </div>
        </div>
        <div className="mt-4 border-t border-slate-200 border-slate-700/50 pt-4">
          <Skeleton className="h-9 w-56 rounded-xl" />
        </div>
      </Skeleton.Card>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Skeleton.Card key={i} className="p-8">
            {/* Header */}
            <div className="mb-4 flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <Skeleton className="mb-2 h-6 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-20 rounded-lg" />
            </div>
            {/* Temperature */}
            <div className="mb-4">
              <Skeleton className="mb-2 h-12 w-40" />
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

/**
 * Skeleton.SchedulePage - Skeleton for Schedule management page
 */
Skeleton.SchedulePage = function SkeletonSchedulePage() {
  return (
    <div className="mx-auto max-w-4xl">

      {/* Selector card */}
      <div className="mb-6 rounded-2xl bg-slate-800/50 p-6">
        <div className="mb-2 h-5 w-32 animate-pulse rounded bg-slate-700/50" />
        <div className="h-12 w-full animate-pulse rounded-xl bg-slate-700/50" />
      </div>

      {/* Timeline card */}
      <div className="rounded-2xl bg-slate-800/50 p-6">
        <div className="mb-4 h-6 w-48 animate-pulse rounded bg-slate-700/50" />
        <div className="space-y-2">
          {Array(7).fill(null).map((_, i) => (
            <div key={i} className="flex gap-2">
              <div className="size-12 animate-pulse rounded bg-slate-700/50" />
              <div className="h-12 flex-1 animate-pulse rounded bg-slate-700/50" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton.RaspiCard - Skeleton for RaspiCard component - Success/green theme
 */
Skeleton.RaspiCard = function SkeletonRaspiCard() {
  const SkeletonPulse = ({ className = '' }: { className?: string }) => (
    <div
      className={`relative overflow-hidden rounded-xl bg-white/5 ${className}`}
    >
      <div className="animate-shimmer absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/8 to-transparent" />
    </div>
  );

  const Card = Skeleton.Card;

  return (
    <Card className="overflow-visible transition-all duration-500">
      {/* Success green accent bar */}
      <div className="h-1 bg-linear-to-r from-success-500/50 via-success-400/50 to-success-600/50" />
      <div className="p-5 sm:p-6">
        {/* Header skeleton */}
        <div className="mb-4 flex items-center gap-3">
          <SkeletonPulse className="size-8 rounded-lg" />
          <SkeletonPulse className="h-6 w-32 rounded" />
        </div>
        {/* 4 metric boxes (CPU, RAM, Disk, Temp) in 2x2 grid */}
        <div className="grid grid-cols-2 gap-3">
          <SkeletonPulse className="h-20 rounded-lg" />
          <SkeletonPulse className="h-20 rounded-lg" />
          <SkeletonPulse className="h-20 rounded-lg" />
          <SkeletonPulse className="h-20 rounded-lg" />
        </div>
      </div>
    </Card>
  );
};

/**
 * Skeleton.NetworkCard - Skeleton for NetworkCard component - Sage theme
 */
Skeleton.NetworkCard = function SkeletonNetworkCard() {
  // Internal SkeletonPulse component
  const SkeletonPulse = ({ className = '' }: { className?: string }) => (
    <div
      className={`relative overflow-hidden rounded-xl bg-white/5 ${className}`}
    >
      <div className="animate-shimmer absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/8 to-transparent" />
    </div>
  );

  // Import Card and CardAccentBar from local scope
  const Card = Skeleton.Card;

  return (
    <Card className="overflow-visible transition-all duration-500">
      {/* Sage accent bar */}
      <div className="h-1 bg-linear-to-r from-emerald-500/50 via-teal-500/50 to-emerald-600/50" />

      <div className="p-5 sm:p-6">
        {/* Header skeleton */}
        <div className="mb-4 flex items-center gap-3">
          <SkeletonPulse className="size-8 rounded-lg" />
          <SkeletonPulse className="h-6 w-24 rounded" />
        </div>

        {/* Status bar skeleton */}
        <SkeletonPulse className="mb-4 h-10 w-full rounded-lg" />

        {/* Bandwidth hero skeleton */}
        <div className="mb-4 grid grid-cols-2 gap-4">
          <div>
            <SkeletonPulse className="mb-2 h-8 w-20 rounded" />
            <SkeletonPulse className="h-10 w-full rounded" />
          </div>
          <div>
            <SkeletonPulse className="mb-2 h-8 w-20 rounded" />
            <SkeletonPulse className="h-10 w-full rounded" />
          </div>
        </div>

        {/* Info boxes skeleton */}
        <div className="grid grid-cols-3 gap-2.5">
          <SkeletonPulse className="h-16 rounded-lg" />
          <SkeletonPulse className="h-16 rounded-lg" />
          <SkeletonPulse className="h-16 rounded-lg" />
        </div>
      </div>
    </Card>
  );
};

/**
 * Skeleton.DirigeraCard - Skeleton for DirigeraCard component - Ocean/info theme
 */
Skeleton.DirigeraCard = function SkeletonDirigeraCard() {
  const SkeletonPulse = ({ className = '' }: { className?: string }) => (
    <div
      className={`relative overflow-hidden rounded-xl bg-white/5 ${className}`}
    >
      <div className="animate-shimmer absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/8 to-transparent" />
    </div>
  );

  const Card = Skeleton.Card;

  return (
    <Card className="overflow-visible transition-all duration-500">
      {/* Ocean accent bar */}
      <div className="h-1 bg-linear-to-r from-ocean-500/50 via-ocean-400/50 to-ocean-600/50" />
      <div className="p-5 sm:p-6">
        {/* Header skeleton */}
        <div className="mb-4 flex items-center gap-3">
          <SkeletonPulse className="size-8 rounded-lg" />
          <SkeletonPulse className="h-6 w-28 rounded" />
        </div>
        {/* 4 sensor stat boxes in 2x2 grid */}
        <div className="grid grid-cols-2 gap-3">
          <SkeletonPulse className="h-20 rounded-lg" />
          <SkeletonPulse className="h-20 rounded-lg" />
          <SkeletonPulse className="h-20 rounded-lg" />
          <SkeletonPulse className="h-20 rounded-lg" />
        </div>
      </div>
    </Card>
  );
};

/**
 * Skeleton.TuyaCard - Skeleton for TuyaCard component - Warning/amber theme
 */
Skeleton.TuyaCard = function SkeletonTuyaCard() {
  const SkeletonPulse = ({ className = '' }: { className?: string }) => (
    <div
      className={`relative overflow-hidden rounded-xl bg-white/5 ${className}`}
    >
      <div className="animate-shimmer absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/8 to-transparent" />
    </div>
  );

  const Card = Skeleton.Card;

  return (
    <Card className="overflow-visible transition-all duration-500">
      {/* Warning/amber accent bar */}
      <div className="h-1 bg-linear-to-r from-warning-500/50 via-warning-400/50 to-warning-600/50" />
      <div className="p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-3">
          <SkeletonPulse className="size-8 rounded-lg" />
          <SkeletonPulse className="h-6 w-24 rounded" />
        </div>
        {/* 3 metric boxes (total plugs, total W, on/off) */}
        <div className="grid grid-cols-3 gap-3">
          <SkeletonPulse className="h-16 rounded-lg" />
          <SkeletonPulse className="h-16 rounded-lg" />
          <SkeletonPulse className="h-16 rounded-lg" />
        </div>
      </div>
    </Card>
  );
};

/**
 * Skeleton.SonosCard - Skeleton for SonosCard component - Success/sage theme
 */
Skeleton.SonosCard = function SkeletonSonosCard() {
  const SkeletonPulse = ({ className = '' }: { className?: string }) => (
    <div
      className={`relative overflow-hidden rounded-xl bg-white/5 ${className}`}
    >
      <div className="animate-shimmer absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/8 to-transparent" />
    </div>
  );

  const Card = Skeleton.Card;

  return (
    <Card className="overflow-visible transition-all duration-500">
      {/* Sage accent bar */}
      <div className="h-1 bg-linear-to-r from-success-500/50 via-success-400/50 to-success-600/50" />
      <div className="p-5 sm:p-6">
        {/* Header skeleton */}
        <div className="mb-4 flex items-center gap-3">
          <SkeletonPulse className="size-8 rounded-lg" />
          <SkeletonPulse className="h-6 w-20 rounded" />
        </div>
        {/* Now-playing line */}
        <div className="mb-2">
          <SkeletonPulse className="mb-2 h-5 w-3/4 rounded" />
          <SkeletonPulse className="h-4 w-1/2 rounded" />
        </div>
        {/* Stats row: zone count + speaker count */}
        <div className="mt-4 flex gap-3">
          <SkeletonPulse className="h-14 flex-1 rounded-lg" />
          <SkeletonPulse className="h-14 flex-1 rounded-lg" />
        </div>
      </div>
    </Card>
  );
};