'use client';

import { Tabs } from '@/app/components/ui';
import { Calendar, SlidersHorizontal, Clock } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/**
 * ThermostatTabs - Tabbed interface for thermostat page
 *
 * Features:
 * - Three tabs: Schedule, Manual, History
 * - Icons for each tab (Calendar, Sliders, Clock)
 * - Responsive positioning:
 *   - Mobile: fixed to bottom of screen (thumb-friendly)
 *   - Desktop: static position below header
 * - Default tab: Schedule
 *
 * @param {Object} props
 * @param {string} props.defaultValue - Initial selected tab (default: 'schedule')
 * @param {Function} props.onTabChange - Callback when tab changes
 * @param {ReactNode} props.scheduleContent - Content for Schedule tab
 * @param {ReactNode} props.manualContent - Content for Manual tab
 * @param {ReactNode} props.historyContent - Content for History tab
 * @param {string} props.className - Additional classes for root
 */
export function ThermostatTabs({
  defaultValue = 'schedule',
  onTabChange,
  scheduleContent,
  manualContent,
  historyContent,
  className,
}) {
  return (
    <Tabs
      defaultValue={defaultValue}
      onValueChange={onTabChange}
      className={cn('flex flex-col', className)}
    >
      {/* Tab list - responsive positioning */}
      <div
        className={cn(
          // Mobile: fixed bottom (thumb zone)
          'max-md:fixed max-md:bottom-0 max-md:left-0 max-md:right-0 max-md:z-40',
          'max-md:bg-slate-900/95 [html:not(.dark)_&]:max-md:bg-white/95',
          'max-md:backdrop-blur-xl',
          'max-md:border-t max-md:border-white/[0.06]',
          '[html:not(.dark)_&]:max-md:border-black/[0.06]',
          'max-md:pb-[env(safe-area-inset-bottom)]',
          // Desktop: normal flow
          'md:static md:bg-transparent md:border-0 md:pb-0',
        )}
      >
        <Tabs.List className="max-md:justify-around md:justify-start">
          <Tabs.Trigger
            value="schedule"
            icon={<Calendar className="w-5 h-5" />}
          >
            Schedule
          </Tabs.Trigger>
          <Tabs.Trigger
            value="manual"
            icon={<SlidersHorizontal className="w-5 h-5" />}
          >
            Manual
          </Tabs.Trigger>
          <Tabs.Trigger
            value="history"
            icon={<Clock className="w-5 h-5" />}
          >
            History
          </Tabs.Trigger>
        </Tabs.List>
      </div>

      {/* Content panels - add bottom padding on mobile for fixed tabs */}
      <div className="max-md:pb-20 md:pb-0">
        <Tabs.Content value="schedule" className="pt-4">
          {scheduleContent}
        </Tabs.Content>
        <Tabs.Content value="manual" className="pt-4">
          {manualContent}
        </Tabs.Content>
        <Tabs.Content value="history" className="pt-4">
          {historyContent}
        </Tabs.Content>
      </div>
    </Tabs>
  );
}

export default ThermostatTabs;
