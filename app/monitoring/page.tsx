'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Heading, Button, Section, Grid } from '@/app/components/ui';
import ConnectionStatusCard from '@/components/monitoring/ConnectionStatusCard';
import DeadManSwitchPanel from '@/components/monitoring/DeadManSwitchPanel';
import MonitoringTimeline from '@/components/monitoring/MonitoringTimeline';
import { ArrowLeft, Activity } from 'lucide-react';

interface StatsData {
  [key: string]: any;
}

interface DMSStatus {
  [key: string]: any;
}

export default function MonitoringPage() {
  const router = useRouter();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [dmsStatus, setDmsStatus] = useState<DMSStatus | null>(null);
  const [dmsError, setDmsError] = useState<string | null>(null);

  // Refs for retry functions (avoids re-creating on each render)
  const fetchStatsRef = useRef<(() => Promise<void>) | null>(null);
  const fetchDMSRef = useRef<(() => Promise<void>) | null>(null);

  // Fetch stats on mount
  useEffect(() => {
    async function fetchStats(): Promise<void> {
      try {
        setStatsError(null);
        const res = await fetch('/api/health-monitoring/stats?days=7');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        } else {
          // Handle non-200 responses
          const errorData = await res.json().catch(() => ({}));
          setStatsError(errorData.error || `Errore ${res.status}`);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
        setStatsError('Errore di connessione');
      }
    }

    // Store ref for retry
    fetchStatsRef.current = fetchStats;
    fetchStats();
  }, []);

  // Fetch DMS status with 30-second interval
  useEffect(() => {
    async function fetchDMS(): Promise<void> {
      try {
        setDmsError(null);
        const res = await fetch('/api/health-monitoring/dead-man-switch');
        if (res.ok) {
          const data = await res.json();
          setDmsStatus(data);
        } else {
          // Handle non-200 responses
          const errorData = await res.json().catch(() => ({}));
          setDmsError(errorData.error || `Errore ${res.status}`);
        }
      } catch (error) {
        console.error('Error fetching DMS status:', error);
        setDmsError('Errore di connessione');
      }
    }

    // Store ref for retry
    fetchDMSRef.current = fetchDMS;

    // Initial fetch
    fetchDMS();

    // Refresh every 30 seconds
    const interval = setInterval(fetchDMS, 30000);

    return () => clearInterval(interval);
  }, []);

  // Retry handlers
  const handleStatsRetry = (): void => {
    fetchStatsRef.current?.();
  };
  const handleDMSRetry = (): void => {
    fetchDMSRef.current?.();
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header with back button and page title */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/')}
          icon={<ArrowLeft size={16} />}
        >
          Home
        </Button>
        <div className="flex items-center gap-3">
          <Activity className="text-ember-400" size={32} aria-hidden="true" />
          <Heading level={1} variant="ember">
            Health Monitoring
          </Heading>
        </div>
      </div>

      {/* Status cards section */}
      <Section spacing="none" as="div">
        <Grid cols={2} gap="md" className="md:grid-cols-2">
          <ConnectionStatusCard stats={stats} error={statsError} onRetry={handleStatsRetry} />
          <DeadManSwitchPanel status={dmsStatus} error={dmsError} onRetry={handleDMSRetry} />
        </Grid>
      </Section>

      {/* Event timeline section */}
      <Section
        title="Cronologia Eventi (7 giorni)"
        level={2}
        spacing="none"
      >
        <div
          id="monitoring-scroll-container"
          className="max-h-[600px] overflow-y-auto"
          role="region"
          aria-label="Cronologia eventi"
          tabIndex={0}
        >
          <MonitoringTimeline />
        </div>
      </Section>
    </div>
  );
}
