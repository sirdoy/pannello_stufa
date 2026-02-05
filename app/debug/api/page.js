'use client';

import { useState, useEffect } from 'react';
import Heading from '@/app/components/ui/Heading';
import Text from '@/app/components/ui/Text';
import Button from '@/app/components/ui/Button';
import Tabs from '@/app/components/ui/Tabs';
import StoveTab from './components/tabs/StoveTab';
import NetatmoTab from './components/tabs/NetatmoTab';
import HueTab from './components/tabs/HueTab';
import WeatherTab from './components/tabs/WeatherTab';
import FirebaseTab from './components/tabs/FirebaseTab';
import SchedulerTab from './components/tabs/SchedulerTab';

export default function ApiDebugPage() {
  const [activeTab, setActiveTab] = useState('stove');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);

  // Read tab from URL hash on mount
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash && ['stove', 'netatmo', 'hue', 'weather', 'firebase', 'scheduler'].includes(hash)) {
      setActiveTab(hash);
    }
  }, []);

  // Update URL hash when tab changes
  useEffect(() => {
    window.location.hash = activeTab;
  }, [activeTab]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd/Ctrl + R: Refresh current tab (prevent default browser refresh)
      if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
        e.preventDefault();
        handleRefreshAll();
      }
      // Number keys 1-6: Switch tabs
      if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        const tabs = ['stove', 'netatmo', 'hue', 'weather', 'firebase', 'scheduler'];
        const index = parseInt(e.key) - 1;
        if (index >= 0 && index < tabs.length) {
          setActiveTab(tabs[index]);
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

  const handleRefreshAll = () => {
    setLastRefresh(Date.now());
  };

  return (
    <div className="min-h-screen bg-slate-950 [html:not(.dark)_&]:bg-white text-slate-100 [html:not(.dark)_&]:text-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <Heading level={1} variant="ember">
              🔌 API Debug Console
            </Heading>
            <Text variant="secondary" className="mt-1">
              Test all system components and monitor live API responses
            </Text>
            <Text size="sm" variant="secondary" className="mt-2">
              Keyboard: <kbd className="px-1.5 py-0.5 bg-slate-800 [html:not(.dark)_&]:bg-slate-200 rounded text-xs">1-6</kbd> = Switch tabs,{' '}
              <kbd className="px-1.5 py-0.5 bg-slate-800 [html:not(.dark)_&]:bg-slate-200 rounded text-xs">⌘R</kbd> = Refresh,{' '}
              <kbd className="px-1.5 py-0.5 bg-slate-800 [html:not(.dark)_&]:bg-slate-200 rounded text-xs">A</kbd> = Auto-refresh
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
        <Tabs value={activeTab} onValueChange={setActiveTab}>
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
              <StoveTab autoRefresh={autoRefresh} refreshTrigger={lastRefresh} />
            </Tabs.Content>

            <Tabs.Content value="netatmo">
              <NetatmoTab autoRefresh={autoRefresh} refreshTrigger={lastRefresh} />
            </Tabs.Content>

            <Tabs.Content value="hue">
              <HueTab autoRefresh={autoRefresh} refreshTrigger={lastRefresh} />
            </Tabs.Content>

            <Tabs.Content value="weather">
              <WeatherTab autoRefresh={autoRefresh} refreshTrigger={lastRefresh} />
            </Tabs.Content>

            <Tabs.Content value="firebase">
              <FirebaseTab autoRefresh={autoRefresh} refreshTrigger={lastRefresh} />
            </Tabs.Content>

            <Tabs.Content value="scheduler">
              <SchedulerTab autoRefresh={autoRefresh} refreshTrigger={lastRefresh} />
            </Tabs.Content>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
