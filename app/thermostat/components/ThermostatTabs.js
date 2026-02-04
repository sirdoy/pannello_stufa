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
 * - Tabs positioned at top on both mobile and desktop
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
      {/* Tab list - at top for both mobile and desktop */}
      <Tabs.List className="justify-start mb-4">
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

      {/* Content panels */}
      <div>
        <Tabs.Content value="schedule">
          {scheduleContent}
        </Tabs.Content>
        <Tabs.Content value="manual">
          {manualContent}
        </Tabs.Content>
        <Tabs.Content value="history">
          {historyContent}
        </Tabs.Content>
      </div>
    </Tabs>
  );
}

export default ThermostatTabs;
