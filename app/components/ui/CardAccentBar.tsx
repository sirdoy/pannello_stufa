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
 * Flat accent bar on the top edge of a card.
 * Positioned at the very top edge of cards with proper corner integration.
 *
 * @param {'ember'|'ocean'|'warning'|'sage'|'danger'} props.colorTheme - Color theme
 * @param {boolean} props.animated - Enable shimmer animation (default: true)
 * @param {boolean} props.pulse - Enable pulse animation for active states
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
  // Flat accent colour per theme
  const themes = {
    ember: 'bg-(--accent)',
    ocean: 'bg-ocean-400',
    warning: 'bg-warning-400',
    sage: 'bg-sage-400',
    danger: 'bg-danger-400',
    // Legacy mappings
    primary: 'bg-(--accent)',
    info: 'bg-ocean-400',
    success: 'bg-sage-400',
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
    <div className={`absolute inset-x-0 top-0 z-10 ${className}`}>
      {/* Flat bar - flush with top edge */}
      <div
        className={`
          relative ${barHeight} w-full overflow-hidden
          ${theme}
          rounded-t-2xl
          ${animated && pulse ? 'animate-pulse' : ''}
        `}
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
  // Kept for API compatibility: the corner accent is static
  animated: _animated = true,
  corner = 'top-left',
  className = '',
}) {
  const themes = {
    ember: 'bg-(--accent)',
    ocean: 'bg-ocean-400',
    warning: 'bg-warning-400',
    sage: 'bg-sage-400',
    danger: 'bg-danger-400',
  };

  const positions = {
    'top-left': 'top-0 left-0 rounded-tl-2xl',
    'top-right': 'top-0 right-0 rounded-tr-2xl',
    'bottom-left': 'bottom-0 left-0 rounded-bl-2xl',
    'bottom-right': 'bottom-0 right-0 rounded-br-2xl',
  };

  const fill = themes[colorTheme as keyof typeof themes] || themes.ember;
  const position = positions[corner as keyof typeof positions] || positions['top-left'];

  return (
    <div className={`absolute ${position} z-10 ${className}`}>
      {/* Horizontal segment */}
      <div
        className={`
          absolute top-0 left-0 h-1 w-12
          ${fill}
          ${corner.includes('right') ? 'rounded-tr' : 'rounded-tl'}
        `}
      />
      {/* Vertical segment */}
      <div
        className={`
          absolute top-0 left-0 h-12 w-1
          ${fill}
          ${corner.includes('bottom') ? 'rounded-bl' : 'rounded-tl'}
        `}
      />
    </div>
  );
}
