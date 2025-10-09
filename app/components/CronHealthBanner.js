'use client';

import { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';
import Banner from './ui/Banner';
import Button from './ui/Button';

export default function CronHealthBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [lastCallTime, setLastCallTime] = useState(null);
  const [minutesSinceLastCall, setMinutesSinceLastCall] = useState(0);

  useEffect(() => {
    // Listen to Firebase for cron health updates
    const cronHealthRef = ref(db, 'cronHealth/lastCall');

    const unsubscribe = onValue(cronHealthRef, (snapshot) => {
      if (snapshot.exists()) {
        const lastCall = snapshot.val();
        setLastCallTime(lastCall);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Check every 30 seconds if cron is healthy
    const checkCronHealth = () => {
      if (!lastCallTime) return;

      const lastCallDate = new Date(lastCallTime);
      const now = new Date();
      const diffMinutes = Math.floor((now - lastCallDate) / 1000 / 60);

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
