'use client';

import { useEffect, useState } from 'react';
import { ref, get } from 'firebase/database';
import { db } from '@/lib/firebase';
import Banner from './ui/Banner';
import Button from './ui/Button';

export default function CronHealthBanner({ variant = 'banner' }) {
  const [showBanner, setShowBanner] = useState(false);
  const [lastCallTime, setLastCallTime] = useState(null);
  const [minutesSinceLastCall, setMinutesSinceLastCall] = useState(0);

  useEffect(() => {
    // Manual polling instead of listener (workaround for stale data)
    const fetchCronHealth = async () => {
      try {
        const snapshot = await get(ref(db, 'cronHealth/lastCall'));
        if (snapshot.exists()) {
          const lastCall = snapshot.val();
          console.log('🔍 Firebase cronHealth/lastCall (manual fetch):', lastCall);
          setLastCallTime(lastCall);
        }
      } catch (error) {
        console.error('❌ Error fetching cronHealth:', error);
      }
    };

    fetchCronHealth(); // Initial fetch
    const interval = setInterval(fetchCronHealth, 30000); // Poll every 30s

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Check every 30 seconds if cron is healthy
    const checkCronHealth = () => {
      if (!lastCallTime) {
        console.log('🔍 lastCallTime è null, skip check');
        return;
      }

      const lastCallDate = new Date(lastCallTime);
      const now = new Date();
      const diffMs = now - lastCallDate;
      const diffMinutes = Math.floor(diffMs / 1000 / 60);

      console.log('🔍 Cron Health Check:', {
        lastCallTime,
        lastCallDate: lastCallDate.toISOString(),
        now: now.toISOString(),
        diffMs,
        diffMinutes,
        showBanner: diffMinutes > 5
      });

      setMinutesSinceLastCall(diffMinutes);
      setShowBanner(diffMinutes > 5);
    };

    checkCronHealth();
    const interval = setInterval(checkCronHealth, 30000); // Check every 30s

    return () => clearInterval(interval);
  }, [lastCallTime]);

  if (!showBanner) return null;

  // Inline variant - compact design for integration inside cards
  if (variant === 'inline') {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 bg-warning-50/80 backdrop-blur-sm rounded-xl border-2 border-warning-300">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-warning-100 border-2 border-warning-400">
            <span className="text-2xl">⚠️</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-base font-bold text-warning-800">
              Cronjob Non Attivo
            </p>
            <p className="text-sm text-warning-700 mt-0.5">
              Ultima esecuzione: <strong>{minutesSinceLastCall} minuti fa</strong> • Scheduler potrebbe non funzionare
            </p>
          </div>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <a
            href="https://console.cron-job.org/jobs/6061667"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-initial"
          >
            <button className="w-full px-5 py-2.5 rounded-xl text-sm font-semibold text-warning-800 bg-warning-100 hover:bg-warning-200 border-2 border-warning-400 hover:border-warning-500 transition-all duration-200 active:scale-95 whitespace-nowrap">
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
          <Button variant="accent" size="md">
            🔧 Riavvia Cronjob ↗
          </Button>
        </a>
      }
    />
  );
}
