/**
 * StatusBadge Component
 *
 * Versatile badge component with multiple variants for different use cases.
 *
 * @param {Object} props
 * @param {string} props.status - Status text to display
 * @param {string} props.icon - Icon emoji (optional, auto-detected from status)
 * @param {'default'|'floating'|'inline'} props.variant - Badge variant
 * @param {'sm'|'md'|'lg'} props.size - Badge size
 * @param {string} props.text - Custom text (for floating/inline variants)
 * @param {string} props.gradient - Custom gradient (e.g., 'from-purple-500 to-pink-600')
 * @param {'primary'|'success'|'warning'|'danger'|'info'} props.color - Color preset (for floating/inline)
 * @param {'top-right'|'top-left'|'bottom-right'|'bottom-left'} props.position - Floating position
 * @param {string} props.className - Additional classes
 */
export default function StatusBadge({
  status,
  icon,
  variant = 'default',
  size = 'md',
  text,
  gradient,
  color = 'primary',
  position = 'top-right',
  className = '',
}) {
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

  // Color presets for floating/inline variants
  const colorGradients = {
    primary: 'from-primary-500 to-accent-600',
    success: 'from-success-500 to-success-600',
    warning: 'from-warning-500 to-warning-600',
    danger: 'from-primary-500 to-primary-600',
    info: 'from-info-500 to-info-600',
    purple: 'from-purple-500 to-pink-600',
  };

  const colorBlurs = {
    primary: 'bg-primary-500/20',
    success: 'bg-success-500/20',
    warning: 'bg-warning-500/20',
    danger: 'bg-primary-500/20',
    info: 'bg-info-500/20',
    purple: 'bg-purple-500/20',
  };

  const positions = {
    'top-right': '-top-2 -right-2',
    'top-left': '-top-2 -left-2',
    'bottom-right': '-bottom-2 -right-2',
    'bottom-left': '-bottom-2 -left-2',
  };

  // VARIANT: Floating Badge (absolute positioned with gradient + blur)
  if (variant === 'floating') {
    const gradientClass = gradient || `bg-gradient-to-br ${colorGradients[color]}`;
    const blurClass = colorBlurs[color] || colorBlurs.primary;

    return (
      <div className={`absolute ${positions[position]} z-20 ${className}`}>
        <div className="relative">
          {/* Blur effect */}
          <div className={`absolute inset-0 ${blurClass} rounded-full blur-lg animate-pulse`} />
          {/* Badge */}
          <div className={`relative ${gradientClass} text-white px-3 py-1.5 rounded-full shadow-elevated-lg ring-2 ring-white/40`}>
            <span className="text-xs font-bold">
              {icon && <span>{icon} </span>}
              {text || status}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // VARIANT: Inline Badge (simple inline badge with color)
  if (variant === 'inline') {
    const inlineColors = {
      primary: 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400',
      success: 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400',
      warning: 'bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-400',
      danger: 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400',
      info: 'bg-info-100 dark:bg-info-900/30 text-info-700 dark:text-info-400',
    };

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${inlineColors[color]} ${className}`}>
        {icon && <span className="mr-1">{icon}</span>}
        {text || status}
      </span>
    );
  }

  // VARIANT: Default (original large status display)
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
    <div className={`flex items-center justify-center gap-4 py-6 ${className}`}>
      <span className={sizeClasses[size]}>{icon || getStatusIcon(status)}</span>
      <div className="text-center">
        <p className={`${textSizeClasses[size]} font-bold ${getStatusColor(status)}`}>
          {status}
        </p>
      </div>
    </div>
  );
}