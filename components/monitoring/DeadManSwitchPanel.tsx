'use client';

import { CheckCircle, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import Card, { CardHeader } from '@/app/components/ui/Card';
import Heading from '@/app/components/ui/Heading';
import Text from '@/app/components/ui/Text';
import StatusBadge from '@/app/components/ui/StatusBadge';
import Button from '@/app/components/ui/Button';

interface HealthyStatus {
  stale: false;
  elapsed: number;
  lastCheck: string;
}

interface StaleStatus {
  stale: true;
  reason: 'never_run' | 'timeout' | 'error';
  elapsed?: number;
  lastCheck?: string;
  error?: string;
}

type DeadManSwitchStatus = HealthyStatus | StaleStatus;

interface DeadManSwitchPanelProps {
  status: DeadManSwitchStatus | null;
  error: string | null;
  onRetry?: () => void;
}

export default function DeadManSwitchPanel({ status, error, onRetry }: DeadManSwitchPanelProps) {
  // Error state (API fetch failed)
  if (error) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <Heading level={2} variant="subtle">
              Cron Health
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
  if (!status) {
    return (
      <Card>
        <CardHeader>
          <Heading level={2} variant="subtle">
            Cron Health
          </Heading>
        </CardHeader>
        <div className="space-y-4">
          <div className="h-20 bg-slate-800/50 rounded-lg animate-pulse" />
        </div>
      </Card>
    );
  }

  // Healthy state (stale = false)
  if (!status.stale) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <Heading level={2} variant="subtle">
              Cron Health
            </Heading>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-sage-400" />
              <StatusBadge status="healthy" variant="badge" color="sage" />
            </div>
          </div>
        </CardHeader>

        <div className="flex items-start gap-3 p-4 bg-sage-500/10 border border-sage-500/20 rounded-lg">
          <CheckCircle className="w-5 h-5 text-sage-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <Text variant="body" weight="medium">
              Sistema attivo
            </Text>
            <Text variant="secondary" size="sm" className="mt-1">
              Ultimo controllo:{' '}
              {formatDistanceToNow(new Date(status.lastCheck), {
                addSuffix: true,
                locale: it,
              })}
            </Text>
          </div>
        </div>
      </Card>
    );
  }

  // Stale - never run
  if (status.reason === 'never_run') {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <Heading level={2} variant="subtle">
              Cron Health
            </Heading>
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-danger-400" />
              <StatusBadge
                status="stale"
                variant="badge"
                color="danger"
                pulse
              />
            </div>
          </div>
        </CardHeader>

        <div className="flex items-start gap-3 p-4 bg-danger-500/10 border border-danger-500/20 rounded-lg">
          <XCircle className="w-5 h-5 text-danger-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <Text variant="danger" weight="medium">
              Cron mai eseguito
            </Text>
            <Text variant="secondary" size="sm" className="mt-1">
              Il sistema di monitoraggio non ha ancora registrato nessuna esecuzione.
              Verificare la configurazione del cron job.
            </Text>
          </div>
        </div>
      </Card>
    );
  }

  // Stale - timeout (> 10 minutes)
  if (status.reason === 'timeout') {
    const minutesElapsed = Math.floor((status.elapsed || 0) / 60000);

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <Heading level={2} variant="subtle">
              Cron Health
            </Heading>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-danger-400" />
              <StatusBadge
                status="stale"
                variant="badge"
                color="danger"
                pulse
              />
            </div>
          </div>
        </CardHeader>

        <div className="flex items-start gap-3 p-4 bg-danger-500/10 border border-danger-500/20 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-danger-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <Text variant="danger" weight="medium">
              Cron non risponde
            </Text>
            <div className="mt-2 space-y-1">
              <Text variant="secondary" size="sm">
                Tempo trascorso: <span className="font-semibold text-danger-400">{minutesElapsed} minuti</span>
              </Text>
              {status.lastCheck && (
                <Text variant="secondary" size="sm">
                  Ultimo controllo:{' '}
                  {formatDistanceToNow(new Date(status.lastCheck), {
                    addSuffix: true,
                    locale: it,
                  })}
                </Text>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Stale - error
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between w-full">
          <Heading level={2} variant="subtle">
            Cron Health
          </Heading>
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-danger-400" />
            <StatusBadge
              status="error"
              variant="badge"
              color="danger"
              pulse
            />
          </div>
        </div>
      </CardHeader>

      <div className="flex items-start gap-3 p-4 bg-danger-500/10 border border-danger-500/20 rounded-lg">
        <XCircle className="w-5 h-5 text-danger-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <Text variant="danger" weight="medium">
            Errore di sistema
          </Text>
          {status.error && (
            <Text variant="secondary" size="sm" className="mt-1" as="div">
              <code className="text-xs bg-slate-800/50 px-2 py-1 rounded">
                {status.error}
              </code>
            </Text>
          )}
        </div>
      </div>
    </Card>
  );
}
