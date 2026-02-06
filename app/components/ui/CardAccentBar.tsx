'use client';

/**
 * CardAccentBar Component Props
 */
export interface CardAccentBarProps {
  colorTheme?: 'ember' | 'ocean' | 'warning' | 'sage' | 'danger';
  animated?: boolean;
  pulse?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * CardAccentBar Component - Ember Noir Design System
 *
 * Modern accent bar with glow effects and shimmer animation.
 * Positioned at the very top edge of cards with proper corner integration.
 *
 * @param {'ember'|'ocean'|'warning'|'sage'|'danger'} props.colorTheme - Color theme
 * @param {boolean} props.animated - Enable shimmer animation (default: true)
 * @param {boolean} props.pulse - Enable glow pulse animation for active states
 * @param {'sm'|'md'|'lg'} props.size - Bar thickness (default: 'md')
 * @param {string} props.className - Additional classes
 */
export default function CardAccentBar({
  colorTheme = 'ember',
  animated = true,
  pulse = false,
  size = 'md',
  className = '',
}: CardAccentBarProps) {
  // Color theme configurations - Ember Noir palette
  const themes = {
    ember: {
      gradient: 'from-ember-600 via-flame-500 to-ember-600',
      glow: 'rgba(237, 111, 16, 0.5)',
      glowLight: 'rgba(237, 111, 16, 0.35)',
    },
    ocean: {
      gradient: 'from-ocean-500 via-ocean-400 to-ocean-500',
      glow: 'rgba(67, 125, 174, 0.5)',
      glowLight: 'rgba(67, 125, 174, 0.35)',
    },
    warning: {
      gradient: 'from-warning-500 via-warning-400 to-warning-500',
      glow: 'rgba(234, 179, 8, 0.5)',
      glowLight: 'rgba(234, 179, 8, 0.35)',
    },
    sage: {
      gradient: 'from-sage-500 via-sage-400 to-sage-500',
      glow: 'rgba(96, 115, 96, 0.5)',
      glowLight: 'rgba(96, 115, 96, 0.35)',
    },
    danger: {
      gradient: 'from-danger-500 via-danger-400 to-danger-500',
      glow: 'rgba(239, 68, 68, 0.5)',
      glowLight: 'rgba(239, 68, 68, 0.35)',
    },
    // Legacy mappings
    primary: {
      gradient: 'from-ember-600 via-flame-500 to-ember-600',
      glow: 'rgba(237, 111, 16, 0.5)',
      glowLight: 'rgba(237, 111, 16, 0.35)',
    },
    info: {
      gradient: 'from-ocean-500 via-ocean-400 to-ocean-500',
      glow: 'rgba(67, 125, 174, 0.5)',
      glowLight: 'rgba(67, 125, 174, 0.35)',
    },
    success: {
      gradient: 'from-sage-500 via-sage-400 to-sage-500',
      glow: 'rgba(96, 115, 96, 0.5)',
      glowLight: 'rgba(96, 115, 96, 0.35)',
    },
  };

  // Size configurations
  const sizes = {
    sm: 'h-1',
    md: 'h-1.5',
    lg: 'h-2',
  };

  const theme = themes[colorTheme] || themes.ember;
  const barHeight = sizes[size] || sizes.md;

  return (
    <div className={`absolute top-0 left-0 right-0 z-10 ${className}`}>
      {/* Main gradient bar - flush with top edge */}
      <div
        className={`
          relative ${barHeight} w-full overflow-hidden
          bg-gradient-to-r ${theme.gradient}
          rounded-t-2xl
        `}
        style={{
          boxShadow: `0 4px 20px ${theme.glow}, 0 2px 8px ${theme.glow}`,
        }}
      >
        {/* Shimmer animation overlay */}
        {animated && (
          <div
            className="absolute inset-0 w-[200%] bg-gradient-to-r from-transparent via-white/25 to-transparent animate-shimmer"
          />
        )}
      </div>

      {/* Glow diffusion below the bar */}
      <div
        className={`
          absolute top-full left-0 right-0 h-4
          pointer-events-none
          ${pulse ? 'animate-pulse' : ''}
        `}
        style={{
          background: `linear-gradient(to bottom, ${theme.glow} 0%, transparent 100%)`,
        }}
      />
    </div>
  );
}

/**
 * CardAccentCorner - Corner accent variant
 * Creates a subtle L-shaped accent for a more refined look
 */
export function CardAccentCorner({
  colorTheme = 'ember',
  animated = true,
  corner = 'top-left',
  className = '',
}) {
  const themes = {
    ember: 'from-ember-600 via-flame-500 to-ember-600',
    ocean: 'from-ocean-500 via-ocean-400 to-ocean-500',
    warning: 'from-warning-500 via-warning-400 to-warning-500',
    sage: 'from-sage-500 via-sage-400 to-sage-500',
    danger: 'from-danger-500 via-danger-400 to-danger-500',
  };

  const positions = {
    'top-left': 'top-0 left-0 rounded-tl-2xl',
    'top-right': 'top-0 right-0 rounded-tr-2xl',
    'bottom-left': 'bottom-0 left-0 rounded-bl-2xl',
    'bottom-right': 'bottom-0 right-0 rounded-br-2xl',
  };

  const gradient = themes[colorTheme] || themes.ember;
  const position = positions[corner] || positions['top-left'];

  return (
    <div className={`absolute ${position} z-10 ${className}`}>
      {/* Horizontal segment */}
      <div
        className={`
          absolute top-0 left-0 h-1 w-12
          bg-gradient-to-r ${gradient}
          ${corner.includes('right') ? 'rounded-tr' : 'rounded-tl'}
        `}
      />
      {/* Vertical segment */}
      <div
        className={`
          absolute top-0 left-0 w-1 h-12
          bg-gradient-to-b ${gradient}
          ${corner.includes('bottom') ? 'rounded-bl' : 'rounded-tl'}
        `}
      />
      {/* Corner glow */}
      <div
        className={`
          absolute -top-1 -left-1 w-8 h-8
          bg-gradient-to-br ${gradient}
          blur-xl opacity-40
          ${animated ? 'animate-pulse' : ''}
        `}
      />
    </div>
  );
}
