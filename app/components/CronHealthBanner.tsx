'use client';

import { useCallback, useState } from 'react';
import { ref, get } from 'firebase/database';
import { db } from '@/lib/firebase';
import Banner from './ui/Banner';
import Button from './ui/Button';
import { useAdaptivePolling } from '@/lib/hooks/useAdaptivePolling';
import { useNetworkQuality } from '@/lib/hooks/useNetworkQuality';

interface CronHealthBannerProps {
  variant?: 'banner' | 'inline';
}

export default function CronHealthBanner({ variant = 'banner' }: CronHealthBannerProps) {
  const [showBanner, setShowBanner] = useState(false);
  const [lastCallTime, setLastCallTime] = useState<string | null>(null);
  const [minutesSinceLastCall, setMinutesSinceLastCall] = useState(0);
  const networkQuality = useNetworkQuality();

  // Fetch cron health data
  const fetchCronHealth = useCallback(async () => {
    try {
      const snapshot = await get(ref(db, 'cronHealth/lastCall'));
      if (snapshot.exists()) {
        const lastCall = snapshot.val();
        setLastCallTime(lastCall);
      }
    } catch (error) {
      console.error('[CronHealthBanner] Error fetching cronHealth:', error);
    }
  }, []);

  // Network-aware polling: 30s on fast/unknown, 60s on slow
  const cronInterval = networkQuality === 'slow' ? 60000 : 30000;

  useAdaptivePolling({
    callback: fetchCronHealth,
    interval: cronInterval,
    alwaysActive: false, // Non-critical: pause when hidden
    immediate: true,
  });

  // Check staleness of cron data
  const checkCronHealth = useCallback(() => {
    if (!lastCallTime) return;
    const lastCallDate = new Date(lastCallTime);
    const now = new Date();
    const diffMs = now.getTime() - lastCallDate.getTime();
    const diffMinutes = Math.floor(diffMs / 1000 / 60);
    setMinutesSinceLastCall(diffMinutes);
    setShowBanner(diffMinutes > 5);
  }, [lastCallTime]);

  useAdaptivePolling({
    callback: checkCronHealth,
    interval: 30000,
    alwaysActive: false,
    immediate: true,
  });

  if (!showBanner) return null;

  // Inline variant - compact design for integration inside cards - Ember Noir with light mode
  if (variant === 'inline') {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 bg-warning-900/30 backdrop-blur-xl border border-warning-500/40 rounded-xl [html:not(.dark)_&]:bg-warning-100/80 [html:not(.dark)_&]:border-warning-300">
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-warning-900/40 border-2 border-warning-500/50 [html:not(.dark)_&]:bg-warning-100/80 [html:not(.dark)_&]:border-warning-300">
            <span className="text-2xl">⚠️</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-base font-bold font-display text-warning-300 [html:not(.dark)_&]:text-warning-800">
              Cronjob Non Attivo
            </p>
            <p className="text-sm text-warning-400 mt-0.5 [html:not(.dark)_&]:text-warning-700">
              Ultima esecuzione: <strong>{minutesSinceLastCall} minuti fa</strong> • Scheduler potrebbe non funzionare
            </p>
          </div>
        </div>
        <div className="flex gap-3 w-full sm:w-auto relative z-10">
          <a
            href="https://console.cron-job.org/jobs/6061667"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-initial"
          >
            <button className="w-full px-5 py-2.5 rounded-xl text-sm font-semibold font-display text-warning-300 bg-warning-900/30 hover:bg-warning-900/50 border border-warning-500/40 hover:border-warning-500/60 transition-all duration-200 active:scale-95 whitespace-nowrap [html:not(.dark)_&]:text-warning-700 [html:not(.dark)_&]:bg-warning-100/80 [html:not(.dark)_&]:hover:bg-warning-200/80 [html:not(.dark)_&]:border-warning-300 [html:not(.dark)_&]:hover:border-warning-400">
              🔧 Riavvia Cronjob ↗
            </button>
          </a>
        </div>
      </div>
    );
  }

  // Banner variant - full banner for standalone usage
  return (
    <Banner
      variant="warning"
      icon="⚠️"
      title="Cronjob Non Attivo"
      description={
        <>
          Il cronjob non viene eseguito da <strong>{minutesSinceLastCall} minuti</strong>.
          Lo scheduler automatico potrebbe non funzionare correttamente.
        </>
      }
      actions={
        <a
          href="https://console.cron-job.org/jobs/6061667"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="ember" size="md">
            🔧 Riavvia Cronjob ↗
          </Button>
        </a>
      }
    />
  );
}
