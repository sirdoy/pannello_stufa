export default function StatusBadge({ status, icon, size = 'md' }) {
  const getStatusColor = (status) => {
    if (!status) return 'text-neutral-500 dark:text-neutral-400';
    if (status.includes('WORK')) return 'text-success-700 dark:text-success-400';
    if (status.includes('OFF')) return 'text-neutral-600 dark:text-neutral-400';
    if (status.includes('STANDBY')) return 'text-warning-600 dark:text-warning-400';
    if (status.includes('ERROR')) return 'text-primary-700 dark:text-primary-400 font-bold';
    return 'text-neutral-600 dark:text-neutral-400';
  };

  const getStatusIcon = (status) => {
    if (!status) return '❔';
    if (status.includes('WORK')) return '🔥';
    if (status.includes('OFF')) return '❄️';
    if (status.includes('ERROR')) return '⚠️';
    if (status.includes('START')) return '⏱️';
    if (status.includes('WAIT')) return '💤';
    return '❔';
  };

  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-5xl',
    lg: 'text-6xl',
  };

  const textSizeClasses = {
    sm: 'text-base',
    md: 'text-3xl',
    lg: 'text-4xl',
  };

  return (
    <div className="flex items-center justify-center gap-4 py-6">
      <span className={sizeClasses[size]}>{icon || getStatusIcon(status)}</span>
      <div className="text-center">
        <p className={`${textSizeClasses[size]} font-bold ${getStatusColor(status)}`}>
          {status}
        </p>
      </div>
    </div>
  );
}