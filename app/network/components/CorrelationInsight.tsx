'use client';

import Text from '@/app/components/ui/Text';
import type {
  CorrelationInsight,
  CorrelationStatus,
} from '@/app/components/devices/network/types';

interface CorrelationInsightProps {
  insight: CorrelationInsight | null;
  status: CorrelationStatus;
}

/**
 * CorrelationInsight Component
 *
 * Displays human-readable correlation insight with:
 * - Italian description text
 * - Pearson coefficient value
 * - Data point count and active hours context
 *
 * Color-coded by correlation level:
 * - strong-positive/moderate-positive: emerald
 * - none: slate
 * - moderate-negative/strong-negative: ember
 *
 * Only renders when status='ready' and insight exists.
 */
export default function CorrelationInsight({
  insight,
  status,
}: CorrelationInsightProps) {
  // Don't render if no insight or status not ready
  if (!insight || status !== 'ready') {
    return null;
  }

  // Determine color based on correlation level
  let textColorClass = 'text-slate-400';
  if (insight.level === 'strong-positive' || insight.level === 'moderate-positive') {
    textColorClass = 'text-emerald-400';
  } else if (insight.level === 'moderate-negative' || insight.level === 'strong-negative') {
    textColorClass = 'text-ember-500';
  }

  return (
    <div className="bg-slate-800/30 [html:not(.dark)_&]:bg-white rounded-2xl p-4">
      {/* Insight Description */}
      <div className="mb-2">
        <Text className={textColorClass}>
          {insight.description}
        </Text>
      </div>

      {/* Coefficient */}
      <div className="mb-1">
        <Text variant="tertiary" size="sm">
          Coefficiente di Pearson: {insight.coefficient.toFixed(2)}
        </Text>
      </div>

      {/* Data Context */}
      <div>
        <Text variant="tertiary" size="sm">
          Calcolato su {insight.dataPointCount} misurazioni ({insight.activeHours.toFixed(1)}h di stufa attiva)
        </Text>
      </div>
    </div>
  );
}
