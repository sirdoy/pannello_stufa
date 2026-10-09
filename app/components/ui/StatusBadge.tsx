import { createElement, type ReactNode } from 'react';
import { AlertTriangle, CircleHelp, Flame, Hourglass, RefreshCw, Rocket, Snowflake, Thermometer, type LucideIcon } from 'lucide-react';

/**
 * StatusBadge Component Props
 */
export interface StatusBadgeProps {
  status?: string;
  icon?: ReactNode;
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
 * @param {string} props.icon - Icon element (auto-detected from the status in the display variant)
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
  gradient: _gradient,
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
  const getAutoIcon = (status: string | undefined): LucideIcon | null => {
    if (!status) return null;
    const s = status.toUpperCase();
    if (s.includes('WORK') || s.includes('FUNZIONE')) return Flame;
    if (s.includes('OFF') || s.includes('SPENT')) return Snowflake;
    if (s.includes('ERROR') || s.includes('ERRORE')) return AlertTriangle;
    if (s.includes('START') || s.includes('AVVIO')) return Rocket;
    if (s.includes('WAIT') || s.includes('ATTESA') || s.includes('STANDBY')) return Hourglass;
    if (s.includes('CLEANING') || s.includes('PULIZIA')) return RefreshCw;
    if (s.includes('MODULATION') || s.includes('MODULAZIONE')) return Thermometer;
    return null;
  };

  const resolvedColor = color || getAutoColor(status);
  // Icon given by the caller, else the one recognised from the status (none for an unknown status)
  const autoIcon = getAutoIcon(status);
  const iconPx = { sm: 32, md: 48, lg: 64 }[size] ?? 48;
  const renderIcon = (px: number): ReactNode =>
    icon ?? (autoIcon ? createElement(autoIcon, { size: px, 'aria-hidden': true }) : null);

  // Color presets - Ember Noir palette
  const colorStyles = {
    ember: {
      bg: 'bg-ember-500/20',
      border: 'border-ember-500/30',
      text: 'text-ember-300',
      dot: 'bg-ember-500',
    },
    sage: {
      bg: 'bg-sage-500/20',
      border: 'border-sage-500/30',
      text: 'text-sage-300',
      dot: 'bg-sage-500',
    },
    ocean: {
      bg: 'bg-ocean-500/20',
      border: 'border-ocean-500/30',
      text: 'text-ocean-300',
      dot: 'bg-ocean-500',
    },
    warning: {
      bg: 'bg-warning-500/20',
      border: 'border-warning-500/30',
      text: 'text-warning-300',
      dot: 'bg-warning-500',
    },
    danger: {
      bg: 'bg-danger-500/20',
      border: 'border-danger-500/30',
      text: 'text-danger-300',
      dot: 'bg-danger-500',
    },
    neutral: {
      bg: 'bg-white/6',
      border: 'border-white/12',
      text: 'text-(--text-2)',
      dot: 'bg-white/40',
    },
  };

  const colors = colorStyles[resolvedColor] || colorStyles.neutral;

  // Size configurations
  const sizeConfig = {
    sm: {
      display: { text: 'text-lg', padding: 'py-3 px-4' },
      badge: { text: 'text-xs', padding: 'px-2.5 py-1' },
      dot: 'w-2 h-2',
    },
    md: {
      display: { text: 'text-2xl', padding: 'py-5 px-6' },
      badge: { text: 'text-sm', padding: 'px-3 py-1.5' },
      dot: 'w-2.5 h-2.5',
    },
    lg: {
      display: { text: 'text-3xl', padding: 'py-6 px-8' },
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
          border-[0.5px] ${colors.border}
          ${pulse ? 'animate-pulse' : ''}
          ${className}
        `.trim().replace(/\s+/g, ' ')}
      >
        <span className={colors.text}>{renderIcon(iconPx) ?? <CircleHelp size={iconPx} aria-hidden="true" />}</span>
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
        role="img"
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
          {/* Badge */}
          <div className={`
            relative
            bg-(--accent)
            text-[#1a0d06]
            px-2.5 py-1
            rounded-full
            ${pulse ? 'animate-pulse' : ''}
          `.trim().replace(/\s+/g, ' ')}>
            <span className="font-display text-xs font-bold">
              {renderIcon(12) && <span className="mr-1 inline-flex align-middle">{renderIcon(12)}</span>}
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
        border-[0.5px] ${colors.border}
        ${colors.text}
        ${pulse ? 'animate-pulse' : ''}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
    >
      {renderIcon(14) && <span className="inline-flex">{renderIcon(14)}</span>}
      {status}
    </span>
  );
}
