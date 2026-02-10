'use client';

import { CheckCircle, AlertTriangle, XCircle, RefreshCw, LucideIcon } from 'lucide-react';
import Card, { CardHeader } from '@/app/components/ui/Card';
import Heading from '@/app/components/ui/Heading';
import Text from '@/app/components/ui/Text';
import StatusBadge from '@/app/components/ui/StatusBadge';
import Button from '@/app/components/ui/Button';

interface ConnectionStats {
  totalRuns: number;
  totalChecks: number;
  successfulChecks: number;
  failedChecks: number;
  mismatchCount: number;
  successRate: string;
}

interface ConnectionStatusCardProps {
  stats: ConnectionStats | null;
  error: string | null;
  onRetry?: () => void;
}

interface StatusConfig {
  status: 'online' | 'degraded' | 'offline';
  variant: 'badge';
  color: 'sage' | 'warning' | 'danger';
  icon: LucideIcon;
}

export default function ConnectionStatusCard({ stats, error, onRetry }: ConnectionStatusCardProps) {
  // Error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <Heading level={2} variant="subtle">
              Stove Connection
            </Heading>
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-danger-400" />
              <StatusBadge status="error" variant="badge" color="danger" />
            </div>
          </div>
        </CardHeader>
        <div className="flex items-start gap-3 p-4 bg-danger-500/10 border border-danger-500/20 rounded-lg">
          <XCircle className="w-5 h-5 text-danger-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <Text variant="danger" weight="medium">
              Errore nel caricamento
            </Text>
            <Text variant="secondary" size="sm" className="mt-1">
              {error}
            </Text>
            {onRetry && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRetry}
                className="mt-3 flex items-center gap-2"
              >
                <RefreshCw size={14} />
                Riprova
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  }

  // Loading state
  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <Heading level={2} variant="subtle">
            Stove Connection
          </Heading>
        </CardHeader>
        <div className="space-y-4">
          <div className="h-16 bg-slate-800/50 rounded-lg animate-pulse" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-12 bg-slate-800/50 rounded-lg animate-pulse" />
            <div className="h-12 bg-slate-800/50 rounded-lg animate-pulse" />
          </div>
        </div>
      </Card>
    );
  }

  // Determine status based on success rate
  const successRate = parseFloat(stats.successRate);
  let statusConfig: StatusConfig;

  if (successRate >= 95) {
    statusConfig = {
      status: 'online',
      variant: 'badge',
      color: 'sage',
      icon: CheckCircle,
    };
  } else if (successRate >= 80) {
    statusConfig = {
      status: 'degraded',
      variant: 'badge',
      color: 'warning',
      icon: AlertTriangle,
    };
  } else {
    statusConfig = {
      status: 'offline',
      variant: 'badge',
      color: 'danger',
      icon: XCircle,
    };
  }

  const StatusIcon = statusConfig.icon;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between w-full">
          <Heading level={2} variant="subtle">
            Stove Connection
          </Heading>
          <div className="flex items-center gap-2">
            <StatusIcon className="w-4 h-4" />
            <StatusBadge
              status={statusConfig.status}
              variant={statusConfig.variant}
              color={statusConfig.color}
            />
          </div>
        </div>
      </CardHeader>

      <div className="space-y-6">
        {/* Uptime percentage - prominent display */}
        <div className="text-center">
          <div className="text-5xl font-bold font-display text-slate-100 [html:not(.dark)_&]:text-slate-900">
            {stats.successRate}%
          </div>
          <Text variant="secondary" size="sm" className="mt-1">
            Uptime
          </Text>
        </div>

        {/* Check counts grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-800/30 dark:bg-slate-800/30 [html:not(.dark)_&]:bg-slate-100/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-sage-400" />
              <Text variant="tertiary" size="xs" uppercase>
                Success
              </Text>
            </div>
            <Text variant="body" size="lg" weight="semibold">
              {stats.successfulChecks.toLocaleString()}
            </Text>
          </div>

          <div className="bg-slate-800/30 dark:bg-slate-800/30 [html:not(.dark)_&]:bg-slate-100/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <XCircle className="w-4 h-4 text-danger-400" />
              <Text variant="tertiary" size="xs" uppercase>
                Failed
              </Text>
            </div>
            <Text variant="body" size="lg" weight="semibold">
              {stats.failedChecks.toLocaleString()}
            </Text>
          </div>
        </div>

        {/* Warning for mismatches */}
        {stats.mismatchCount > 0 && (
          <div className="flex items-start gap-2 p-3 bg-warning-500/10 border border-warning-500/20 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-warning-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <Text variant="warning" size="sm" weight="medium">
                {stats.mismatchCount} state {stats.mismatchCount === 1 ? 'mismatch' : 'mismatches'} detected
              </Text>
              <Text variant="tertiary" size="xs" className="mt-1">
                Stove state did not match expected scheduler state
              </Text>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
