'use client';

import { useState, useEffect } from 'react';
import Card from '@/app/components/ui/Card';
import Text from '@/app/components/ui/Text';
import Heading from '@/app/components/ui/Heading';
import { Activity, Clock, LayoutDashboard, MousePointer, Gauge } from 'lucide-react';
import type { WebVitalName, WebVitalRating } from '@/types/analytics';

interface VitalSummary {
  latest: number;
  median: number;
  rating: WebVitalRating;
}

type MetricsSummary = Partial<Record<WebVitalName, VitalSummary>>;

const METRIC_CONFIG: Record<
  WebVitalName,
  {
    label: string;
    icon: React.ElementType;
    format: (v: number) => string;
    unit: string;
  }
> = {
  LCP: { label: 'LCP', icon: LayoutDashboard, format: (v) => v.toFixed(0), unit: 'ms' },
  INP: { label: 'INP', icon: MousePointer, format: (v) => v.toFixed(0), unit: 'ms' },
  CLS: { label: 'CLS', icon: Activity, format: (v) => v.toFixed(3), unit: '' },
  FCP: { label: 'FCP', icon: Clock, format: (v) => v.toFixed(0), unit: 'ms' },
  TTFB: { label: 'TTFB', icon: Gauge, format: (v) => v.toFixed(0), unit: 'ms' },
};

const METRIC_ORDER: WebVitalName[] = ['LCP', 'INP', 'CLS', 'FCP', 'TTFB'];

function ratingClass(rating: WebVitalRating): string {
  if (rating === 'good') return 'text-sage-500';
  if (rating === 'needs-improvement') return 'text-warning-500';
  return 'text-danger-500';
}

export default function WebVitalsCard() {
  const [metrics, setMetrics] = useState<MetricsSummary>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/vitals/summary')
      .then((res) => res.json())
      .then((data: { metrics: MetricsSummary }) => {
        setMetrics(data.metrics ?? {});
      })
      .catch(() => {
        setMetrics({});
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {METRIC_ORDER.map((name) => (
          <Card key={name} variant="glass" padding={true}>
            <div className="animate-pulse">
              <div className="h-4 bg-slate-700 rounded mb-2 w-16" />
              <div className="h-8 bg-slate-700 rounded w-20" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  const hasData = METRIC_ORDER.some((name) => metrics[name] !== undefined);

  if (!hasData) {
    return (
      <Card variant="glass" padding={true} className="text-center">
        <Text variant="secondary">No data yet — Web Vitals will appear after a few page loads.</Text>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {METRIC_ORDER.map((name) => {
        const config = METRIC_CONFIG[name];
        const data = metrics[name];
        const IconComponent = config.icon;

        if (!data) {
          return (
            <Card key={name} variant="glass" padding={true}>
              <div className="flex items-center gap-2 mb-2">
                <IconComponent className="w-4 h-4 text-ember-400" />
                <Text variant="secondary" size="xs">{config.label}</Text>
              </div>
              <Text variant="tertiary" size="sm">No data</Text>
            </Card>
          );
        }

        return (
          <Card key={name} variant="glass" padding={true}>
            <div className="flex items-center gap-2 mb-2">
              <IconComponent className="w-4 h-4 text-ember-400" />
              <Text variant="secondary" size="xs">{config.label}</Text>
            </div>
            <div className="flex items-baseline gap-1">
              <Heading level={3} variant="ember">
                {config.format(data.latest)}
              </Heading>
              {config.unit && (
                <Text variant="tertiary" size="sm">{config.unit}</Text>
              )}
            </div>
            <Text size="xs" className={ratingClass(data.rating)}>
              {data.rating}
            </Text>
          </Card>
        );
      })}
    </div>
  );
}
