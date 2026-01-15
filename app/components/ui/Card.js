/**
 * Card Component - Ember Noir Design System
 *
 * Sophisticated container with warm dark aesthetic and subtle depth.
 * Features multiple variants for different use cases.
 *
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - Card content
 * @param {'default'|'elevated'|'subtle'|'outlined'|'glass'} props.variant - Visual style
 * @param {boolean} props.hover - Enable hover effects
 * @param {boolean} props.glow - Add ember glow effect (for active states)
 * @param {boolean} props.padding - Include default padding (default: true)
 * @param {string} props.className - Additional Tailwind classes
 *
 * @deprecated props.liquid - Use variant="glass" instead
 * @deprecated props.glass - Use variant="glass" instead
 * @deprecated props.elevation - Use variant="elevated" instead
 */
export default function Card({
  children,
  className = '',
  variant = 'default',
  hover = false,
  glow = false,
  padding = true,
  // Legacy props for backwards compatibility
  liquid = false,
  glass = false,
  elevation = 'base',
  ...props
}) {
  // Handle legacy props
  let resolvedVariant = variant;
  if (liquid || glass) {
    resolvedVariant = 'glass';
  }
  if (elevation === 'elevated' || elevation === 'floating') {
    resolvedVariant = 'elevated';
  }

  // Base classes - shared across all variants
  const baseClasses = `
    rounded-2xl
    transition-all duration-300 ease-out
    relative
    overflow-hidden
  `;

  // Variant-specific styles - Ember Noir aesthetic
  const variantStyles = {
    // Default card - subtle dark container
    default: `
      bg-slate-900/80 dark:bg-slate-900/80
      border border-white/[0.06] dark:border-white/[0.06]
      shadow-card
      backdrop-blur-xl
    `,

    // Elevated card - more prominent with stronger shadow
    elevated: `
      bg-slate-850/90 dark:bg-slate-850/90
      border border-white/[0.08] dark:border-white/[0.08]
      shadow-card-elevated
      backdrop-blur-xl
    `,

    // Subtle card - for nested/secondary content
    subtle: `
      bg-white/[0.03] dark:bg-white/[0.03]
      border border-white/[0.04] dark:border-white/[0.04]
    `,

    // Outlined card - transparent with visible border
    outlined: `
      bg-transparent
      border border-white/[0.12] dark:border-white/[0.12]
      hover:border-white/[0.18] dark:hover:border-white/[0.18]
    `,

    // Glass card - stronger glass effect
    glass: `
      bg-slate-900/70 dark:bg-slate-900/70
      border border-white/[0.08] dark:border-white/[0.08]
      shadow-card
      backdrop-blur-2xl backdrop-saturate-150
    `,
  };

  // Light mode overrides
  const lightModeStyles = {
    default: `
      [html:not(.dark)_&]:bg-white/90
      [html:not(.dark)_&]:border-black/[0.06]
      [html:not(.dark)_&]:shadow-[0_2px_8px_rgba(0,0,0,0.08)]
    `,
    elevated: `
      [html:not(.dark)_&]:bg-white/95
      [html:not(.dark)_&]:border-black/[0.08]
      [html:not(.dark)_&]:shadow-[0_8px_24px_rgba(0,0,0,0.12)]
    `,
    subtle: `
      [html:not(.dark)_&]:bg-black/[0.02]
      [html:not(.dark)_&]:border-black/[0.04]
    `,
    outlined: `
      [html:not(.dark)_&]:border-black/[0.12]
      [html:not(.dark)_&]:hover:border-black/[0.2]
    `,
    glass: `
      [html:not(.dark)_&]:bg-white/80
      [html:not(.dark)_&]:border-black/[0.06]
    `,
  };

  // Hover effects
  const hoverStyles = hover ? `
    hover:shadow-card-hover
    hover:border-white/[0.1] dark:hover:border-white/[0.1]
    hover:-translate-y-0.5
    cursor-pointer
    [html:not(.dark)_&]:hover:shadow-[0_12px_32px_rgba(0,0,0,0.15)]
    [html:not(.dark)_&]:hover:border-black/[0.1]
  ` : '';

  // Ember glow effect for active/highlighted cards
  const glowStyles = glow ? `
    shadow-ember-glow
    border-ember-500/20 dark:border-ember-500/20
    [html:not(.dark)_&]:shadow-[0_0_20px_rgba(237,111,16,0.12)]
    [html:not(.dark)_&]:border-ember-500/25
  ` : '';

  // Padding
  const paddingClasses = padding ? 'p-5 sm:p-6' : '';

  // Data attributes for JS hooks
  const dataAttributes = {};
  if (liquid || glass || resolvedVariant === 'glass') {
    dataAttributes['data-liquid-glass'] = 'true';
  }

  return (
    <div
      className={`
        ${baseClasses}
        ${variantStyles[resolvedVariant]}
        ${lightModeStyles[resolvedVariant]}
        ${hoverStyles}
        ${glowStyles}
        ${paddingClasses}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      {...dataAttributes}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * CardHeader - Header section for cards
 */
export function CardHeader({ children, className = '', ...props }) {
  return (
    <div
      className={`flex items-center justify-between mb-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * CardTitle - Title element for cards
 */
export function CardTitle({ children, icon, className = '', ...props }) {
  return (
    <div className={`flex items-center gap-3 ${className}`} {...props}>
      {icon && (
        <span className="text-2xl sm:text-3xl">{icon}</span>
      )}
      <h2 className="font-display font-bold text-lg sm:text-xl text-slate-100 dark:text-slate-100 [html:not(.dark)_&]:text-slate-900">
        {children}
      </h2>
    </div>
  );
}

/**
 * CardContent - Main content area
 */
export function CardContent({ children, className = '', ...props }) {
  return (
    <div className={`space-y-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

/**
 * CardFooter - Footer section for actions
 */
export function CardFooter({ children, className = '', ...props }) {
  return (
    <div
      className={`
        mt-5 pt-4
        border-t border-white/[0.06] dark:border-white/[0.06]
        [html:not(.dark)_&]:border-black/[0.06]
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * CardDivider - Visual separator within cards
 */
export function CardDivider({ className = '' }) {
  return (
    <div
      className={`
        h-px my-4
        bg-gradient-to-r from-transparent via-white/[0.08] to-transparent
        dark:via-white/[0.08]
        [html:not(.dark)_&]:via-black/[0.08]
        ${className}
      `.trim().replace(/\s+/g, ' ')}
    />
  );
}
