'use client';

import Card from '@/app/components/ui/Card';
import Text from '@/app/components/ui/Text';
import Heading from '@/app/components/ui/Heading';
import { Clock, Flame, Euro, Zap } from 'lucide-react';

interface StatsCardsProps {
  totalHours: number;
  totalKg: number;
  totalCost: number;
  automationPercentage: number;
  loading?: boolean;
}

export default function StatsCards({
  totalHours,
  totalKg,
  totalCost,
  automationPercentage,
  loading = false,
}: StatsCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} variant="glass" padding={true}>
            <div className="animate-pulse">
              <div className="h-4 bg-slate-700 rounded mb-2 w-16" />
              <div className="h-8 bg-slate-700 rounded w-20" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: 'Total Hours',
      value: totalHours.toFixed(1),
      unit: 'h',
      icon: Clock,
    },
    {
      label: 'Pellet Used',
      value: totalKg.toFixed(1),
      unit: 'kg',
      icon: Flame,
    },
    {
      label: 'Estimated Cost',
      value: totalCost.toFixed(2),
      prefix: 'EUR',
      icon: Euro,
    },
    {
      label: 'Automation',
      value: automationPercentage.toFixed(0),
      unit: '%',
      icon: Zap,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const IconComponent = card.icon;
        return (
          <Card key={card.label} variant="glass" padding={true}>
            <div className="flex items-center gap-2 mb-2">
              <IconComponent className="w-4 h-4 text-ember-400" />
              <Text variant="secondary" size="xs">{card.label}</Text>
            </div>
            <div className="flex items-baseline gap-1">
              <Heading level={3} variant="ember">{card.value}</Heading>
              {card.unit && <Text variant="tertiary" size="sm">{card.unit}</Text>}
              {card.prefix && <Text variant="tertiary" size="sm">{card.prefix}</Text>}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
