'use client';

import Card from '@/app/components/ui/Card';
import Badge from '@/app/components/ui/Badge';
import Text from '@/app/components/ui/Text';
import Skeleton from '@/app/components/ui/Skeleton';
import type { BudgetStats } from '../hooks/useFritzBudgetStats';

interface BudgetStatsCardProps {
  data: BudgetStats | null;
  loading: boolean;
  error: boolean;
}

const STATUS_COLORS: Record<BudgetStats['status'], string> = {
  ok: 'bg-sage-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
};

const STATUS_LABELS: Record<BudgetStats['status'], string> = {
  ok: 'OK',
  warning: 'Attenzione',
  danger: 'Critico',
};

const BADGE_VARIANTS: Record<BudgetStats['status'], 'sage' | 'ember' | 'danger'> = {
  ok: 'sage',
  warning: 'ember',
  danger: 'danger',
};

/**
 * BudgetStatsCard
 *
 * Displays Fritz!Box API budget statistics with:
 * - Status badge (OK / Attenzione / Critico)
 * - Utilization progress bar with color coding
 * - Metrics grid (window, requests, limits)
 * - Status message
 *
 * Returns null if no data and not loading.
 */
export default function BudgetStatsCard({ data, loading, error }: BudgetStatsCardProps) {
  if (loading) {
    return (
      <Card variant="elevated" className="p-4 sm:p-6 space-y-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-2 w-full rounded-full" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-12 rounded-xl" />
        </div>
      </Card>
    );
  }

  if (!data || error) {
    return null;
  }

  const windowMinutes = Math.floor(data.window_seconds / 60);

  return (
    <Card variant="elevated" className="p-4 sm:p-6 space-y-4">
      {/* Header row: label + status badge */}
      <div className="flex items-center justify-between">
        <Text variant="label" size="sm" className="text-slate-400 uppercase tracking-wide">
          Budget API
        </Text>
        <Badge variant={BADGE_VARIANTS[data.status]} size="sm">
          {STATUS_LABELS[data.status]}
        </Badge>
      </div>

      {/* Progress bar */}
      <div>
        <div className="w-full bg-slate-700/50 rounded-full h-2">
          <div
            className={`${STATUS_COLORS[data.status]} h-2 rounded-full transition-all`}
            style={{ width: `${Math.min(data.utilization_percent, 100)}%` }}
          />
        </div>
        <Text size="sm" className="mt-1 text-slate-400">
          {data.utilization_percent.toFixed(1)}%
        </Text>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Text variant="label" size="xs" className="text-slate-500 uppercase">
            Finestra
          </Text>
          <Text size="sm">{windowMinutes} min</Text>
        </div>
        <div>
          <Text variant="label" size="xs" className="text-slate-500 uppercase">
            Richieste
          </Text>
          <Text size="sm">{data.current_window_requests}</Text>
        </div>
        <div>
          <Text variant="label" size="xs" className="text-slate-500 uppercase">
            Limite soft
          </Text>
          <Text size="sm">{data.soft_limit}</Text>
        </div>
        <div>
          <Text variant="label" size="xs" className="text-slate-500 uppercase">
            Limite hard
          </Text>
          <Text size="sm">{data.hard_limit}</Text>
        </div>
      </div>

      {/* Status message */}
      <Text variant="secondary" size="xs">
        {data.message}
      </Text>
    </Card>
  );
}
