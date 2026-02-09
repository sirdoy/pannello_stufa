/**
 * StatusBadge Component Props
 */
export interface StatusBadgeProps {
  status?: string;
  icon?: string;
  variant?: 'display' | 'badge' | 'dot' | 'floating';
  size?: 'sm' | 'md' | 'lg';
  color?: 'ember' | 'sage' | 'ocean' | 'warning' | 'danger' | 'neutral';
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  pulse?: boolean;
  className?: string;
  // Legacy props
  text?: string;
  gradient?: string;
}

/**
 * StatusBadge Component - Ember Noir Design System
 *
 * Versatile status indicator with multiple display variants.
 * Features warm ember accents and sophisticated styling.
 *
 * @param {Object} props - Component props
 * @param {string} props.status - Status text to display
 * @param {string} props.icon - Icon emoji (auto-detected if not provided)
 * @param {'display'|'badge'|'dot'|'floating'} props.variant - Badge variant
 * @param {'sm'|'md'|'lg'} props.size - Badge size
 * @param {'ember'|'sage'|'ocean'|'warning'|'danger'|'neutral'} props.color - Color preset
 * @param {'top-right'|'top-left'|'bottom-right'|'bottom-left'} props.position - For floating variant
 * @param {boolean} props.pulse - Enable pulse animation for active states
 * @param {string} props.className - Additional classes
 */
export default function StatusBadge({
  status,
  icon,
  variant = 'badge',
  size = 'md',
  color,
  position = 'top-right',
  pulse = false,
  className = '',
  // Legacy props
  text,
  gradient,
}: StatusBadgeProps) {
  // Auto-detect status color based on status text
  const getAutoColor = (status: string | undefined) => {
    if (!status) return 'neutral';
    const s = status.toUpperCase();
    if (s.includes('WORK') || s.includes('ON') || s.includes('ACTIVE')) return 'ember';
    if (s.includes('OFF') || s.includes('SPENT')) return 'neutral';
    if (s.includes('STANDBY') || s.includes('WAIT') || s.includes('ATTESA')) return 'warning';
    if (s.includes('ERROR') || s.includes('ERRORE') || s.includes('FAIL')) return 'danger';
    if (s.includes('START') || s.includes('AVVIO')) return 'ocean';
    if (s.includes('SUCCESS') || s.includes('OK')) return 'sage';
    return 'neutral';
  };

  // Auto-detect icon based on status
  const getAutoIcon = (status: string | undefined) => {
    if (!status) return '❔';
    const s = status.toUpperCase();
    if (s.includes('WORK') || s.includes('FUNZIONE')) return '🔥';
    if (s.includes('OFF') || s.includes('SPENT')) return '❄️';
    if (s.includes('ERROR') || s.includes('ERRORE')) return '⚠️';
    if (s.includes('START') || s.includes('AVVIO')) return '🚀';
    if (s.includes('WAIT') || s.includes('ATTESA') || s.includes('STANDBY')) return '💤';
    if (s.includes('CLEANING') || s.includes('PULIZIA')) return '🔄';
    if (s.includes('MODULATION') || s.includes('MODULAZIONE')) return '🌡️';
    return '❔';
  };

  const resolvedColor = color || getAutoColor(status);
  const resolvedIcon = icon || getAutoIcon(status);

  // Color presets - Ember Noir palette
  const colorStyles = {
    ember: {
      bg: 'bg-ember-500/15 dark:bg-ember-500/20',
      border: 'border-ember-400/25 dark:border-ember-500/30',
      text: 'text-ember-300 dark:text-ember-300 [html:not(.dark)_&]:text-ember-700',
      dot: 'bg-ember-500',
      glow: 'shadow-ember-glow-sm',
    },
    sage: {
      bg: 'bg-sage-500/15 dark:bg-sage-500/20',
      border: 'border-sage-400/25 dark:border-sage-500/30',
      text: 'text-sage-300 dark:text-sage-300 [html:not(.dark)_&]:text-sage-700',
      dot: 'bg-sage-500',
      glow: 'shadow-[0_0_10px_rgba(96,115,96,0.3)]',
    },
    ocean: {
      bg: 'bg-ocean-500/15 dark:bg-ocean-500/20',
      border: 'border-ocean-400/25 dark:border-ocean-500/30',
      text: 'text-ocean-300 dark:text-ocean-300 [html:not(.dark)_&]:text-ocean-700',
      dot: 'bg-ocean-500',
      glow: 'shadow-[0_0_10px_rgba(67,125,174,0.3)]',
    },
    warning: {
      bg: 'bg-warning-500/15 dark:bg-warning-500/20',
      border: 'border-warning-400/25 dark:border-warning-500/30',
      text: 'text-warning-300 dark:text-warning-300 [html:not(.dark)_&]:text-warning-700',
      dot: 'bg-warning-500',
      glow: 'shadow-[0_0_10px_rgba(234,179,8,0.3)]',
    },
    danger: {
      bg: 'bg-danger-500/15 dark:bg-danger-500/20',
      border: 'border-danger-400/25 dark:border-danger-500/30',
      text: 'text-danger-300 dark:text-danger-300 [html:not(.dark)_&]:text-danger-700',
      dot: 'bg-danger-500',
      glow: 'shadow-[0_0_10px_rgba(239,68,68,0.3)]',
    },
    neutral: {
      bg: 'bg-slate-500/10 dark:bg-slate-500/15',
      border: 'border-slate-400/20 dark:border-slate-500/25',
      text: 'text-slate-400 dark:text-slate-400 [html:not(.dark)_&]:text-slate-600',
      dot: 'bg-slate-500',
      glow: '',
    },
  };

  const colors = colorStyles[resolvedColor] || colorStyles.neutral;

  // Size configurations
  const sizeConfig = {
    sm: {
      display: { icon: 'text-3xl', text: 'text-lg', padding: 'py-3 px-4' },
      badge: { text: 'text-xs', padding: 'px-2.5 py-1' },
      dot: 'w-2 h-2',
    },
    md: {
      display: { icon: 'text-5xl', text: 'text-2xl', padding: 'py-5 px-6' },
      badge: { text: 'text-sm', padding: 'px-3 py-1.5' },
      dot: 'w-2.5 h-2.5',
    },
    lg: {
      display: { icon: 'text-7xl', text: 'text-3xl', padding: 'py-6 px-8' },
      badge: { text: 'text-base', padding: 'px-4 py-2' },
      dot: 'w-3 h-3',
    },
  };

  const sizes = sizeConfig[size] || sizeConfig.md;

  // Position styles for floating variant
  const positionStyles = {
    'top-right': '-top-1.5 -right-1.5',
    'top-left': '-top-1.5 -left-1.5',
    'bottom-right': '-bottom-1.5 -right-1.5',
    'bottom-left': '-bottom-1.5 -left-1.5',
  };

  // VARIANT: Display - Large centered status display
  if (variant === 'display') {
    return (
      <div
        className={`
          flex flex-col items-center justify-center gap-3
          ${sizes.display.padding}
          rounded-2xl
          ${colors.bg}
          border ${colors.border}
          ${pulse ? `animate-pulse-ember ${colors.glow}` : ''}
          ${className}
        `.trim().replace(/\s+/g, ' ')}
      >
        <span className={sizes.display.icon}>{resolvedIcon}</span>
        <span className={`
          font-display font-bold
          ${sizes.display.text}
          ${colors.text}
        `.trim().replace(/\s+/g, ' ')}>
          {status}
        </span>
      </div>
    );
  }

  // VARIANT: Dot - Simple status dot
  if (variant === 'dot') {
    return (
      <span
        className={`
          inline-block
          ${sizes.dot}
          ${colors.dot}
          rounded-full
          ${pulse ? 'animate-pulse' : ''}
          ${className}
        `.trim().replace(/\s+/g, ' ')}
        aria-label={status}
      />
    );
  }

  // VARIANT: Floating - Absolute positioned badge
  if (variant === 'floating') {
    return (
      <div className={`absolute ${positionStyles[position]} z-20 ${className}`}>
        <div className="relative">
          {/* Glow background */}
          {pulse && (
            <div className={`
              absolute inset-0
              ${colors.dot}
              opacity-30
              rounded-full
              blur-md
              animate-pulse
            `.trim().replace(/\s+/g, ' ')} />
          )}
          {/* Badge */}
          <div className={`
            relative
            bg-gradient-to-br from-ember-500 to-flame-600
            text-white
            px-2.5 py-1
            rounded-full
            shadow-lg
            ring-2 ring-slate-900/50
            [html:not(.dark)_&]:ring-white/50
          `.trim().replace(/\s+/g, ' ')}>
            <span className="text-xs font-bold font-display">
              {resolvedIcon && <span className="mr-1">{resolvedIcon}</span>}
              {text || status}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // VARIANT: Badge (default) - Inline badge
  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        ${sizes.badge.padding}
        ${sizes.badge.text}
        font-display font-semibold
        rounded-full
        ${colors.bg}
        border ${colors.border}
        ${colors.text}
        ${pulse ? `animate-glow-pulse ${colors.glow}` : ''}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
    >
      {resolvedIcon && <span className="text-sm">{resolvedIcon}</span>}
      {status}
    </span>
  );
}
