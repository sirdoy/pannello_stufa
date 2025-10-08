'use client';

import Link from 'next/link';
import styles from './MaintenanceBar.module.css';

export default function MaintenanceBar({ maintenanceStatus }) {
  if (!maintenanceStatus) return null;

  const { currentHours, targetHours, percentage, remainingHours, isNearLimit } = maintenanceStatus;

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

  return (
    <Link href="/maintenance" className="block">
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-4 border border-white/40 hover:bg-white/80 transition-colors cursor-pointer">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔧</span>
            <span className="font-medium text-gray-800">Manutenzione</span>
          </div>
          <div className={`text-sm font-semibold ${getTextColor()}`}>
            {currentHours.toFixed(1)}h / {targetHours}h
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
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
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-600">
            {percentage >= 100
              ? 'Pulizia richiesta!'
              : `${remainingHours.toFixed(1)}h rimanenti`}
          </span>
          <span className="text-xs text-gray-500">
            {percentage.toFixed(0)}%
          </span>
        </div>
      </div>
    </Link>
  );
}
