import { NextResponse } from 'next/server';
import { adminDbGet } from '@/lib/firebaseAdmin';
import { getEnvironmentPath } from '@/lib/environmentHelper';
import type { WebVitalName, WebVitalRating, WebVitalEvent } from '@/types/analytics';

export const dynamic = 'force-dynamic';

interface VitalSummary {
  latest: number;
  median: number;
  rating: WebVitalRating;
}

type MetricsSummary = Partial<Record<WebVitalName, VitalSummary>>;

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? (sorted[mid] ?? 0)
    : ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
}

export async function GET(): Promise<NextResponse> {
  try {
    const path = getEnvironmentPath('vitalsEvents');
    const rawData = (await adminDbGet(path)) as Record<string, WebVitalEvent> | null;

    if (!rawData) {
      return NextResponse.json({ metrics: {} });
    }

    // Group events by metric name
    const grouped: Partial<Record<WebVitalName, WebVitalEvent[]>> = {};
    const validNames: WebVitalName[] = ['LCP', 'INP', 'CLS', 'FCP', 'TTFB'];

    for (const event of Object.values(rawData)) {
      if (!validNames.includes(event.name)) continue;
      if (!grouped[event.name]) grouped[event.name] = [];
      grouped[event.name]!.push(event);
    }

    // Aggregate: latest value + median of last 50 per metric
    const metrics: MetricsSummary = {};

    for (const name of validNames) {
      const events = grouped[name];
      if (!events || events.length === 0) continue;

      // Sort by timestamp descending to get latest
      const sorted = [...events].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      const latest = sorted[0]!;
      const last50 = sorted.slice(0, 50);
      const values = last50.map((e) => e.value);

      metrics[name] = {
        latest: latest.value,
        median: median(values),
        rating: latest.rating,
      };
    }

    return NextResponse.json({ metrics });
  } catch {
    return NextResponse.json({ metrics: {} });
  }
}
