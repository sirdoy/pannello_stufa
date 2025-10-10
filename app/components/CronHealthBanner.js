'use client';

import { useEffect, useState } from 'react';
import { ref, get } from 'firebase/database';
import { db } from '@/lib/firebase';
import Banner from './ui/Banner';
import Button from './ui/Button';

export default function CronHealthBanner() {
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
