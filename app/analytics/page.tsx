'use client';

import { useState, useEffect, useCallback } from 'react';
import { Settings } from 'lucide-react';
import StatsCards from '@/app/components/analytics/StatsCards';
import UsageChart from '@/app/components/analytics/UsageChart';
import ConsumptionChart from '@/app/components/analytics/ConsumptionChart';
import WeatherCorrelation from '@/app/components/analytics/WeatherCorrelation';
import PeriodSelector from '@/app/components/analytics/PeriodSelector';
import CalibrationModal from '@/app/components/analytics/CalibrationModal';
import ConsentBanner from '@/app/components/analytics/ConsentBanner';
import Card from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import Heading from '@/app/components/ui/Heading';
import Text from '@/app/components/ui/Text';
import { canTrackAnalytics, getConsentState } from '@/lib/analyticsConsentService';
import type { DailyStats, AnalyticsPeriod } from '@/types/analytics';

/**
 * Analytics Dashboard Page
 *
 * Main dashboard showing stove usage statistics, pellet consumption estimates,
 * and weather correlations. Requires user consent per GDPR.
 *
 * Features:
 * - Period selection: 7/30/90 days
 * - Stats cards: total hours, pellet kg, cost, automation %
 * - Usage chart: stacked bar chart by power level
 * - Consumption chart: pellet kg and cost over time
 * - Weather correlation: consumption vs temperature
 * - Calibration modal: user input for pellet refill accuracy
 *
 * Consent states:
 * - unknown: Shows consent banner and informative message
 * - denied: Shows message about analytics being disabled
 * - granted: Shows full dashboard with live data
 */
export default function AnalyticsPage() {
  const [period, setPeriod] = useState<AnalyticsPeriod>(30);
  const [days, setDays] = useState<DailyStats[]>([]);
  const [totals, setTotals] = useState({ totalHours: 0, totalKg: 0, totalCost: 0, automationPercentage: 0 });
  const [calibration, setCalibration] = useState<{ factor: number; lastDate: string; costPerKg: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCalibration, setShowCalibration] = useState(false);
  const [hasConsent, setHasConsent] = useState(false);

  // Check consent on mount
  useEffect(() => {
    setHasConsent(canTrackAnalytics());
  }, []);

  // Fetch stats from API
  const fetchStats = useCallback(async () => {
    if (!hasConsent) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/analytics/stats?period=${period}`);
      if (!res.ok) throw new Error('Failed to fetch analytics');
      const data = await res.json();
      setDays(data.days);
      setTotals(data.totals);
      setCalibration(data.calibration);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [period, hasConsent]);

  // Fetch on period change
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Calibrate handler
  const handleCalibrate = async (actualKg: number, costPerKg?: number) => {
    await fetch('/api/analytics/calibrate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actualKg, estimatedKg: totals.totalKg, pelletCostPerKg: costPerKg }),
    });
    await fetchStats(); // Refresh with new calibration
  };

  return (
    <div className="min-h-screen p-4 md:p-6 max-w-6xl mx-auto">
      {/* Always show consent banner */}
      <ConsentBanner />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Heading level={1} variant="ember">Analytics</Heading>
        {hasConsent && (
          <div className="flex items-center gap-3">
            <PeriodSelector selected={period} onChange={setPeriod} />
            <Button
              variant="subtle"
              size="sm"
              onClick={() => setShowCalibration(true)}
              aria-label="Calibrate pellet estimates"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Consent denied state */}
      {!hasConsent && getConsentState() === 'denied' && (
        <Card variant="glass" padding={true} className="text-center">
          <Heading level={3} variant="default" className="mb-2">Analytics Disabled</Heading>
          <Text variant="secondary">
            You have declined analytics tracking. Stove controls continue to work normally.
            To enable analytics, update your consent in settings.
          </Text>
        </Card>
      )}

      {/* Consent unknown state */}
      {!hasConsent && getConsentState() === 'unknown' && (
        <Card variant="glass" padding={true} className="text-center">
          <Heading level={3} variant="default" className="mb-2">Enable Analytics</Heading>
          <Text variant="secondary">
            Accept analytics tracking to see stove usage statistics, pellet consumption estimates, and weather correlations.
          </Text>
        </Card>
      )}

      {/* Dashboard content (only when consent granted) */}
      {hasConsent && (
        <div className="space-y-6">
          {/* Error state */}
          {error && (
            <Card variant="glass" padding>
              <Text variant="danger">{error}</Text>
              <Button variant="subtle" size="sm" onClick={fetchStats} className="mt-2">Retry</Button>
            </Card>
          )}

          {/* Stats cards */}
          <StatsCards
            totalHours={totals.totalHours}
            totalKg={totals.totalKg}
            totalCost={totals.totalCost}
            automationPercentage={totals.automationPercentage}
            loading={loading}
          />

          {/* Usage hours chart */}
          <Card variant="glass" padding={true}>
            <Heading level={3} variant="default" className="mb-4">Stove Usage</Heading>
            <UsageChart data={days} loading={loading} />
          </Card>

          {/* Pellet consumption chart */}
          <Card variant="glass" padding={true}>
            <Heading level={3} variant="default" className="mb-4">Pellet Consumption</Heading>
            <ConsumptionChart data={days} loading={loading} />
          </Card>

          {/* Weather correlation chart */}
          <Card variant="glass" padding={true}>
            <Heading level={3} variant="default" className="mb-4">Weather Correlation</Heading>
            <WeatherCorrelation data={days} loading={loading} />
          </Card>
        </div>
      )}

      {/* Calibration modal */}
      <CalibrationModal
        isOpen={showCalibration}
        onClose={() => setShowCalibration(false)}
        currentEstimate={totals.totalKg}
        currentCalibration={calibration}
        onCalibrate={handleCalibrate}
      />
    </div>
  );
}
