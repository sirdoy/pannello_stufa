import Card from './Card';

/**
 * Banner component for alerts, warnings, and informational messages
 *
 * @param {string} variant - 'info' | 'warning' | 'error' | 'success'
 * @param {string} icon - Emoji or icon to display
 * @param {string} title - Banner title
 * @param {string|React.ReactNode} description - Banner description/content
 * @param {React.ReactNode} actions - Action buttons or links
 * @param {boolean} dismissible - Show dismiss button
 * @param {function} onDismiss - Dismiss handler
 * @param {string} className - Additional CSS classes
 */
export default function Banner({
  variant = 'info',
  icon,
  title,
  description,
  actions,
  dismissible = false,
  onDismiss,
  className = '',
  children,
}) {
  const variants = {
    info: {
      bg: 'bg-info-50 dark:bg-info-900/20',
      border: 'border-info-200 dark:border-info-800/40',
      titleColor: 'text-info-900 dark:text-info-100',
      descColor: 'text-info-700 dark:text-info-200',
      defaultIcon: 'ℹ️',
    },
    warning: {
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      border: 'border-orange-300 dark:border-orange-800/40',
      titleColor: 'text-orange-900 dark:text-orange-100',
      descColor: 'text-orange-700 dark:text-orange-200',
      defaultIcon: '⚠️',
    },
    error: {
      bg: 'bg-danger-50 dark:bg-danger-900/20',
      border: 'border-danger-300 dark:border-danger-800/40',
      titleColor: 'text-danger-900 dark:text-danger-100',
      descColor: 'text-danger-700 dark:text-danger-200',
      defaultIcon: '❌',
    },
    success: {
      bg: 'bg-success-50 dark:bg-success-900/20',
      border: 'border-success-300 dark:border-success-800/40',
      titleColor: 'text-success-900 dark:text-success-100',
      descColor: 'text-success-700 dark:text-success-200',
      defaultIcon: '✅',
    },
  };

  const styles = variants[variant] || variants.info;
  const displayIcon = icon || styles.defaultIcon;

  return (
    <Card className={`${styles.bg} border-2 ${styles.border} ${className}`}>
      <div className="p-4 sm:p-6">
        <div className="flex items-start gap-3 sm:gap-4">
          {/* Icon */}
          {displayIcon && (
            <div className="flex-shrink-0">
              <span className="text-2xl sm:text-3xl">{displayIcon}</span>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title */}
            {title && (
              <h3 className={`text-base sm:text-lg font-bold ${styles.titleColor} mb-1 sm:mb-2`}>
                {title}
              </h3>
            )}

            {/* Description */}
            {description && (
              <div className={`text-sm ${styles.descColor} mb-3 sm:mb-4`}>
                {description}
              </div>
            )}

            {/* Children (custom content) */}
            {children}

            {/* Actions */}
            {actions && (
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                {actions}
              </div>
            )}
          </div>

          {/* Dismiss button */}
          {dismissible && onDismiss && (
            <button
              onClick={onDismiss}
              className="flex-shrink-0 p-1 hover:bg-black/5 rounded-lg transition-colors"
              aria-label="Dismiss"
            >
              <span className="text-lg opacity-50 hover:opacity-100">✕</span>
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}
