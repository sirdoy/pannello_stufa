'use client';

import Button from '@/app/components/ui/Button';
import type { AnalyticsPeriod } from '@/types/analytics';

interface PeriodSelectorProps {
  selected: AnalyticsPeriod;
  onChange: (period: AnalyticsPeriod) => void;
}

export default function PeriodSelector({ selected, onChange }: PeriodSelectorProps) {
  return (
    <div className="flex gap-2">
      {([7, 30, 90] as const).map((period) => (
        <Button
          key={period}
          variant={selected === period ? 'ember' : 'subtle'}
          size="sm"
          onClick={() => onChange(period)}
          aria-pressed={selected === period}
        >
          {period}d
        </Button>
      ))}
    </div>
  );
}
