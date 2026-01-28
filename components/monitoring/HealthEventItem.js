'use client';

import { useState } from 'react';
import { CheckCircle, AlertTriangle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import { Text } from '@/app/components/ui';

export default function HealthEventItem({ event }) {
  const [expanded, setExpanded] = useState(false);

  // Determine status indicator
  const getStatusIcon = () => {
    if (event.hasStateMismatch) {
      return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    }
    if (event.failureCount > 0) {
      return <XCircle className="w-5 h-5 text-red-500" />;
    }
    return <CheckCircle className="w-5 h-5 text-green-500" />;
  };

  // Determine summary text
  const getSummary = () => {
    if (event.hasStateMismatch) {
      return 'State mismatch rilevato';
    }
    if (event.failureCount > 0) {
      return 'Controllo fallito';
    }
    return 'Controllo completato';
  };

  // Format timestamp
  const relativeTime = formatDistanceToNow(new Date(event.timestamp), {
    addSuffix: true,
    locale: it,
  });

  return (
    <div
      className="p-4 hover:bg-slate-800/30 [html:not(.dark)_&]:hover:bg-slate-50 cursor-pointer transition-colors"
      onClick={() => setExpanded(!expanded)}
    >
      {/* Compact view (always visible) */}
      <div className="flex items-start gap-3">
        {/* Status icon */}
        <div className="flex-shrink-0 mt-0.5">
          {getStatusIcon()}
        </div>

        {/* Summary and timestamp */}
        <div className="flex-1 min-w-0">
          <Text className="font-medium">
            {getSummary()}
          </Text>
          <Text variant="tertiary" size="sm" className="mt-1">
            {relativeTime}
          </Text>
        </div>

        {/* Chevron indicator */}
        <div className="flex-shrink-0">
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </div>
      </div>

      {/* Expanded view */}
      {expanded && (
        <div className="mt-4 pl-8 border-l-2 border-ember-500 space-y-2">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Text variant="tertiary" size="sm">
                Controllati
              </Text>
              <Text className="font-mono text-lg">
                {event.checkedCount}
              </Text>
            </div>
            <div>
              <Text variant="tertiary" size="sm">
                Successi
              </Text>
              <Text className="font-mono text-lg text-green-500">
                {event.successCount}
              </Text>
            </div>
            <div>
              <Text variant="tertiary" size="sm">
                Falliti
              </Text>
              <Text className="font-mono text-lg text-red-500">
                {event.failureCount}
              </Text>
            </div>
          </div>

          {/* Duration */}
          <div>
            <Text variant="tertiary" size="sm">
              Durata
            </Text>
            <Text className="font-mono">
              {event.duration}ms
            </Text>
          </div>

          {/* Mismatch details if present */}
          {event.hasStateMismatch && event.mismatchDetails && (
            <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded">
              <Text variant="secondary" size="sm" className="font-medium mb-2">
                Dettagli State Mismatch:
              </Text>
              <div className="space-y-1">
                {event.mismatchDetails.map((detail, idx) => (
                  <Text key={idx} size="sm" className="font-mono text-yellow-500">
                    {detail}
                  </Text>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
