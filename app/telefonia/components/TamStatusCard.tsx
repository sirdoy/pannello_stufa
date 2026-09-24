'use client';

import { Voicemail } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import {
  Card,
  Heading,
  Text,
  Banner,
  HealthIndicator,
  Skeleton,
} from '@/app/components/ui';
import type { TamStatus } from '../hooks/useFritzTamStatus';

/**
 * Parse backend fetched_at defensively. Accepts "…Z", "…+00:00" and the
 * legacy malformed "…+00:00Z". Returns null (never throws) on bad input.
 */
function parseFetchedAt(value: string | null | undefined): Date | null {
  if (!value || typeof value !== 'string') return null;
  const normalized = value.replace(/([+-]\d{2}:\d{2})Z$/, '$1');
  const date = new Date(normalized);
  return isNaN(date.getTime()) ? null : date;
}

interface TamStatusCardProps {
  status: TamStatus | null;
  loading: boolean;
  stale: boolean;
  error?: Error | null;
}

/**
 * TamStatusCard — FRITZ-03 presentational card for answering machine (Segreteria) status.
 *
 * Composes ONLY existing primitives from @/app/components/ui. Uses
 * Banner variant="error" for error states per Pitfall 4 (not the legacy
 * alert primitive). Never renders untrusted HTML — JSX default escaping
 * covers threat T-171-01 (XSS on Fritz!Box-supplied strings).
 */
export default function TamStatusCard({
  status,
  loading,
  stale,
  error = null,
}: TamStatusCardProps) {
  // Loading (first load, no data yet)
  if (loading && !status) {
    return <Skeleton className="h-[160px] rounded-2xl" />;
  }

  // Error state — heading stays visible, body replaced by Banner.
  if (error) {
    return (
      <Card variant="elevated" className="p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Voicemail size={24} aria-hidden="true" className="text-slate-400" />
            <Heading level={2} size="lg">Segreteria</Heading>
          </div>
          <HealthIndicator status="error" label="Errore" size="md" />
        </div>
        <Banner
          variant="error"
          title="Impossibile caricare la segreteria"
          description="Riprova più tardi o controlla la connessione al Fritz!Box."
          compact={false}
        />
      </Card>
    );
  }

  // If we have no status (edge case — treat as error per UI-SPEC "TAM is never empty")
  if (!status || !status.tam) {
    return (
      <Card variant="elevated" className="p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Voicemail size={24} aria-hidden="true" className="text-slate-400" />
            <Heading level={2} size="lg">Segreteria</Heading>
          </div>
          <HealthIndicator status="error" label="Errore" size="md" />
        </div>
        <Banner
          variant="error"
          title="Impossibile caricare la segreteria"
          description="Riprova più tardi o controlla la connessione al Fritz!Box."
          compact={false}
        />
      </Card>
    );
  }

  const tam = status.tam;
  const enabled = tam.tam_enabled === true;
  const iconColor = enabled ? 'text-ember-400' : 'text-slate-400';
  const healthStatus = enabled ? 'ok' : 'warning';
  const healthLabel = enabled ? 'Attiva' : 'Disattiva';
  const newMessages = tam.new_messages ?? 0;
  const totalMessages = tam.total_messages ?? 0;
  const fetchedAt = parseFetchedAt(status.fetched_at);

  return (
    <Card variant="elevated" className="p-4 sm:p-6 space-y-4">
      {/* Row 1: heading + HealthIndicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Voicemail size={24} aria-hidden="true" className={iconColor} />
          <div>
            <Heading level={2} size="lg">Segreteria</Heading>
            {tam.tam_name && (
              <Text variant="tertiary" size="xs">{tam.tam_name}</Text>
            )}
          </div>
        </div>
        <HealthIndicator status={healthStatus} label={healthLabel} size="md" />
      </div>

      {/* Row 2 (stale banner, only when is_stale) */}
      {(status.is_stale || stale) && (
        <Banner variant="warning" title="Dati non aggiornati" compact={true} />
      )}

      {/* Row 3: big new-messages count + total */}
      <div className="flex items-baseline gap-4">
        <div>
          <Text variant="label" size="xs">Nuovi messaggi</Text>
          <Heading
            level={3}
            size="3xl"
            variant={newMessages > 0 ? 'ember' : 'default'}
          >
            {newMessages}
          </Heading>
        </div>
        <div>
          <Text variant="label" size="xs">Totale</Text>
          <Heading level={3} size="lg">{totalMessages}</Heading>
        </div>
      </div>

      {/* Row 4: relative fetched_at */}
      {fetchedAt && (
        <div className="flex justify-end">
          <Text variant="tertiary" size="xs">
            Aggiornato: {formatDistanceToNow(fetchedAt, {
              addSuffix: true,
              locale: it,
            })}
          </Text>
        </div>
      )}
    </Card>
  );
}

export { TamStatusCard };
