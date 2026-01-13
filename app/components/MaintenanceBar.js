'use client';

import { useState, useEffect } from 'react';
import styles from './MaintenanceBar.module.css';
import { formatHoursToHHMM } from '@/lib/formatUtils';
import { Text, StatusBadge } from './ui';

export default function MaintenanceBar({ maintenanceStatus }) {
  // Auto-expand quando ≥80% o user preference da localStorage
  const [isExpanded, setIsExpanded] = useState(false);

  // Carica preferenza da localStorage e auto-expand se warning
  useEffect(() => {
    if (!maintenanceStatus) return;

    const { percentage } = maintenanceStatus;
    const savedState = localStorage.getItem('maintenanceBarExpanded');

    // Rispetta SEMPRE la scelta dell'utente se ha chiuso manualmente
    if (savedState === 'false') {
      setIsExpanded(false);
      return;
    }

    // Se user ha aperto manualmente, mantieni aperto
    if (savedState === 'true') {
      setIsExpanded(true);
      return;
    }

    // Auto-expand SOLO prima volta quando ≥80% (no savedState)
    if (percentage >= 80 && savedState === null) {
      setIsExpanded(true);
    }
  }, [maintenanceStatus]);

  if (!maintenanceStatus) return null;

  const { currentHours, targetHours, percentage, remainingHours, isNearLimit } = maintenanceStatus;

  // Salva preferenza in localStorage quando user toglie manualmente
  const toggleExpanded = (e) => {
    e.preventDefault(); // Previeni navigazione su click toggle
    e.stopPropagation();
    const newState = !isExpanded;
    setIsExpanded(newState);
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

  const getTextColor = () => {
    if (percentage >= 100) return 'text-danger-700';
    if (percentage >= 80) return 'text-orange-700';
    if (percentage >= 60) return 'text-yellow-700';
    return 'text-success-700';
  };

  const getBadgeColor = () => {
    if (percentage >= 100) return 'danger';
    if (percentage >= 80) return 'warning';
    if (percentage >= 60) return 'warning';
    return 'success';
  };

  const getBadgeIcon = () => {
    if (percentage >= 100) return '🚨';
    if (percentage >= 80) return '⚠️';
    if (percentage >= 60) return '⏰';
    return '✓';
  };

  return (
    <div className="bg-white/[0.08] backdrop-blur-3xl shadow-liquid ring-1 ring-white/[0.15] ring-inset rounded-xl hover:bg-white/[0.12] transition-all duration-300 overflow-hidden relative before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/[0.12] before:to-transparent before:pointer-events-none">
      {/* Mini Bar - Always visible */}
      <div className="flex items-center justify-between p-4 cursor-pointer relative z-10" onClick={toggleExpanded}>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="text-lg flex-shrink-0">🔧</span>
          <Text variant="body" className="font-medium flex-shrink-0">Manutenzione</Text>

          {/* Badge percentuale - nascosto quando espanso */}
          {!isExpanded && (
            <StatusBadge
              variant="inline"
              color={getBadgeColor()}
              icon={getBadgeIcon()}
              text={`${percentage.toFixed(0)}%`}
              className="flex-shrink-0"
            />
          )}

          {/* Info ore compatta - nascosta su mobile e quando espanso */}
          {!isExpanded && (
            <Text variant="tertiary" className="truncate hidden sm:inline">
              {formatHoursToHHMM(currentHours)} / {formatHoursToHHMM(targetHours)}
            </Text>
          )}
        </div>

        {/* Toggle button */}
        <button
          className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors flex-shrink-0"
          onClick={toggleExpanded}
        >
          <span className="hidden sm:inline">
            {isExpanded ? 'Nascondi' : 'Dettagli'}
          </span>
          <span className={`transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>
      </div>

      {/* Expanded Details - Conditional */}
      <div className={`${styles.collapseContent} ${isExpanded ? styles.expanded : ''}`}>
        <div className="px-4 pb-4 space-y-3">
          {/* Progress Bar */}
          <div className="relative w-full h-3 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${getBarColor()} transition-all duration-500 ease-out`}
              style={{ width: `${Math.min(100, percentage)}%` }}
            >
              {/* Animated shimmer effect when near limit */}
              {isNearLimit && (
                <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent ${styles.shimmer}`} />
              )}
            </div>
          </div>

          {/* Info Text */}
          <div className="flex items-center justify-between">
            <Text variant="tertiary">
              {percentage >= 100
                ? 'Pulizia richiesta!'
                : `${formatHoursToHHMM(remainingHours)} rimanenti`}
            </Text>
            <span className={`text-xs font-semibold ${getTextColor()}`}>
              {formatHoursToHHMM(currentHours)} / {formatHoursToHHMM(targetHours)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
