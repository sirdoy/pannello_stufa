'use client';

import { useState, useSyncExternalStore, MouseEvent } from 'react';
import styles from './MaintenanceBar.module.css';
import { AlertTriangle, Check, ChevronDown, Clock, Siren, Wrench } from 'lucide-react';
import { formatHoursToHHMM } from '@/lib/formatUtils';
import { Badge, Button, Card, Text } from './ui';

interface MaintenanceStatus {
  currentHours: number;
  targetHours: number;
  percentage: number;
  remainingHours: number;
  isNearLimit: boolean;
}

interface MaintenanceBarProps {
  maintenanceStatus: MaintenanceStatus | null;
}

const subscribeNoop = () => () => {};
const readSavedState = () => localStorage.getItem('maintenanceBarExpanded');

export default function MaintenanceBar({ maintenanceStatus }: MaintenanceBarProps) {
  // Preferenza utente da localStorage (null sul server e durante l'hydration)
  const savedState = useSyncExternalStore(subscribeNoop, readSavedState, () => null);
  // Scelta fatta in questa sessione con il toggle
  const [userExpanded, setUserExpanded] = useState<boolean | null>(null);

  if (!maintenanceStatus) return null;

  const { currentHours, targetHours, percentage, remainingHours, isNearLimit } = maintenanceStatus;

  // Rispetta SEMPRE la scelta dell'utente (sessione o salvata); senza scelta auto-expand se ≥80%
  const isExpanded =
    userExpanded ?? (savedState === 'true' ? true : savedState === 'false' ? false : percentage >= 80);

  // Salva preferenza in localStorage quando user toglie manualmente
  const toggleExpanded = (e: MouseEvent) => {
    e.preventDefault(); // Previeni navigazione su click toggle
    e.stopPropagation();
    const newState = !isExpanded;
    setUserExpanded(newState);
    // Salva SOLO se user collassa manualmente (non salva auto-expand)
    if (!newState) {
      localStorage.setItem('maintenanceBarExpanded', 'false');
    } else {
      localStorage.setItem('maintenanceBarExpanded', 'true');
    }
  };

  // Color logic based on percentage
  const getBarColor = () => {
    if (percentage >= 100) return 'bg-danger-600';
    if (percentage >= 80) return 'bg-orange-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-success-600';
  };

  // Status colour shared by the badge and the hours text
  const getStatusVariant = (): 'danger' | 'warning' | 'sage' => {
    if (percentage >= 100) return 'danger';
    if (percentage >= 60) return 'warning';
    return 'sage';
  };

  const getBadgeIcon = () => {
    if (percentage >= 100) return <Siren size={12} />;
    if (percentage >= 80) return <AlertTriangle size={12} />;
    if (percentage >= 60) return <Clock size={12} />;
    return <Check size={12} />;
  };

  return (
    <Card variant="subtle" padding={false} className="hover:bg-white/6">
      {/* Mini Bar - Always visible */}
      <div className="relative z-10 flex cursor-pointer items-center justify-between p-4" onClick={toggleExpanded}>
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Wrench size={18} className="shrink-0 text-(--text-2)" aria-hidden="true" />
          <Text variant="body" className="shrink-0">Manutenzione</Text>

          {/* Badge percentuale - nascosto quando espanso */}
          {!isExpanded && (
            <Badge variant={getStatusVariant()} icon={getBadgeIcon()} className="shrink-0">
              {`${percentage.toFixed(0)}%`}
            </Badge>
          )}

          {/* Info ore compatta - nascosta su mobile e quando espanso */}
          {!isExpanded && (
            <Text variant="tertiary" className="hidden truncate sm:inline">
              {formatHoursToHHMM(currentHours)} / {formatHoursToHHMM(targetHours)}
            </Text>
          )}
        </div>

        {/* Toggle button */}
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0"
          icon={
            <ChevronDown
              size={16}
              className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
            />
          }
          iconPosition="right"
          onClick={toggleExpanded}
        >
          <span className="hidden sm:inline">
            {isExpanded ? 'Nascondi' : 'Dettagli'}
          </span>
        </Button>
      </div>

      {/* Expanded Details - Conditional */}
      <div className={`${styles.collapseContent} ${isExpanded ? styles.expanded : ''}`}>
        <div className="space-y-3 px-4 pb-4">
          {/* Progress Bar */}
          <div className="relative h-3 w-full overflow-hidden rounded-full bg-white/10">
            {/* The bar pulses when near the limit */}
            <div
              className={`h-full ${getBarColor()} transition-all duration-500 ease-out ${isNearLimit ? 'animate-pulse' : ''}`}
              style={{ width: `${Math.min(100, percentage)}%` }}
            />
          </div>

          {/* Info Text */}
          <div className="flex items-center justify-between">
            <Text variant="tertiary">
              {percentage >= 100
                ? 'Pulizia richiesta!'
                : `${formatHoursToHHMM(remainingHours)} rimanenti`}
            </Text>
            <Text as="span" variant={getStatusVariant()} size="xs" weight="semibold">
              {formatHoursToHHMM(currentHours)} / {formatHoursToHHMM(targetHours)}
            </Text>
          </div>
        </div>
      </div>
    </Card>
  );
}
