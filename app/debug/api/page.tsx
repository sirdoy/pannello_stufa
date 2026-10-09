'use client';

import { useState, useEffect, useSyncExternalStore } from 'react';
import Text from '@/app/components/ui/Text';
import Button from '@/app/components/ui/Button';
import Tabs from '@/app/components/ui/Tabs';
import Badge from '@/app/components/ui/Badge';
import { PageHeader } from '@/app/components/EmberGlass/PageHeader';
import StoveTab from '@/app/debug/components/tabs/StoveTab';
import NetatmoTab from '@/app/debug/components/tabs/NetatmoTab';
import HueTab from '@/app/debug/components/tabs/HueTab';
import WeatherTab from '@/app/debug/components/tabs/WeatherTab';
import FirebaseTab from '@/app/debug/components/tabs/FirebaseTab';
import SchedulerTab from '@/app/debug/components/tabs/SchedulerTab';

type TabValue = 'stove' | 'netatmo' | 'hue' | 'weather' | 'firebase' | 'scheduler';

const subscribeNoop = () => () => {};

function readHashTab(): TabValue | null {
  const hash = window.location.hash.replace('#', '') as TabValue;
  return ['stove', 'netatmo', 'hue', 'weather', 'firebase', 'scheduler'].includes(hash) ? hash : null;
}

export default function ApiDebugPage() {
  // Tab from the URL hash (null on the server and during hydration), overridden by user choice
  const hashTab = useSyncExternalStore(subscribeNoop, readHashTab, () => null);
  const [pickedTab, setActiveTab] = useState<TabValue | null>(null);
  const activeTab: TabValue = pickedTab ?? hashTab ?? 'stove';
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
  const [lastRefresh, setLastRefresh] = useState<number | null>(null);

  // Detect environment
  const isDev = typeof window !== 'undefined' && window.location.hostname === 'localhost';

  // Update URL hash when tab changes
  useEffect(() => {
    window.location.hash = activeTab;
  }, [activeTab]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + R: Refresh current tab (prevent default browser refresh)
      if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
        e.preventDefault();
        setLastRefresh(Date.now());
      }
      // Number keys 1-6: Switch tabs
      if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        const tabs: TabValue[] = ['stove', 'netatmo', 'hue', 'weather', 'firebase', 'scheduler'];
        const index = parseInt(e.key) - 1;
        const selectedTab = tabs[index];
        if (selectedTab) {
          setActiveTab(selectedTab);
        }
      }
      // A: Toggle auto-refresh
      if (e.key === 'a' && !e.metaKey && !e.ctrlKey) {
        setAutoRefresh((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleRefreshAll = (): void => {
    setLastRefresh(Date.now());
  };

  return (
    <div className="text-slate-100">
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          title="API Debug Console"
          description="Test all system components and monitor live API responses"
          backHref="/debug"
          actions={
            <Badge variant={isDev ? 'ocean' : 'ember'} size="sm">
              {isDev ? 'DEV' : 'PROD'}
            </Badge>
          }
        />

        {/* Toolbar */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Text size="sm" variant="secondary">
              Keyboard: <kbd className="rounded bg-slate-800 px-1.5 py-0.5 text-xs">1-6</kbd> = Switch tabs,{''}
              <kbd className="rounded bg-slate-800 px-1.5 py-0.5 text-xs">⌘R</kbd> = Refresh,{''}
              <kbd className="rounded bg-slate-800 px-1.5 py-0.5 text-xs">A</kbd> = Auto-refresh
            </Text>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              <Text size="sm" variant="secondary">
                Auto-refresh (5s)
              </Text>
            </label>
            <Button onClick={handleRefreshAll}>🔄 Refresh All</Button>
            {lastRefresh && (
              <Text size="sm" variant="secondary">
                {new Date(lastRefresh).toLocaleTimeString()}
              </Text>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabValue)}>
          <Tabs.List>
            <Tabs.Trigger value="stove">🔥 Stove</Tabs.Trigger>
            <Tabs.Trigger value="netatmo">🌡️ Netatmo</Tabs.Trigger>
            <Tabs.Trigger value="hue">💡 Hue</Tabs.Trigger>
            <Tabs.Trigger value="weather">🌤️ Weather</Tabs.Trigger>
            <Tabs.Trigger value="firebase">🔥 Firebase</Tabs.Trigger>
            <Tabs.Trigger value="scheduler">⏰ Scheduler</Tabs.Trigger>
          </Tabs.List>

          <div className="mt-6">
            <Tabs.Content value="stove">
              <StoveTab autoRefresh={autoRefresh} refreshTrigger={lastRefresh ?? 0} />
            </Tabs.Content>

            <Tabs.Content value="netatmo">
              <NetatmoTab autoRefresh={autoRefresh} refreshTrigger={lastRefresh ?? 0} />
            </Tabs.Content>

            <Tabs.Content value="hue">
              <HueTab autoRefresh={autoRefresh} refreshTrigger={lastRefresh ?? 0} />
            </Tabs.Content>

            <Tabs.Content value="weather">
              <WeatherTab autoRefresh={autoRefresh} refreshTrigger={lastRefresh ?? 0} />
            </Tabs.Content>

            <Tabs.Content value="firebase">
              <FirebaseTab autoRefresh={autoRefresh} refreshTrigger={lastRefresh ?? 0} />
            </Tabs.Content>

            <Tabs.Content value="scheduler">
              <SchedulerTab autoRefresh={autoRefresh} refreshTrigger={lastRefresh ?? 0} />
            </Tabs.Content>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
