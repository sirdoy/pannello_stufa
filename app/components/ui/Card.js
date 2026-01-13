/**
 * Card Component
 *
 * Versatile container with liquid glass, glassmorphism, and solid variants.
 * Supports elevation system and multiple visual styles.
 *
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - Card content
 * @param {boolean} props.liquid - Apply liquid glass style (iOS glassmorphism)
 * @param {boolean} props.glass - Apply legacy glassmorphism style
 * @param {'flat'|'base'|'elevated'|'floating'} props.elevation - Shadow elevation level
 * @param {'default'|'outlined'|'flat'} props.variant - Card visual variant
 * @param {string} props.className - Additional Tailwind classes
 */
export default function Card({
  children,
  className = '',
  glass = false,
  liquid = false,
  elevation = 'base', // 'flat' | 'base' | 'elevated' | 'floating'
  variant = 'default', // 'default' | 'outlined' | 'flat' (new)
  ...props
}) {
  const baseClasses = 'rounded-3xl transition-all duration-500';

  // Elevation system for shadows
  const elevationClasses = {
    flat: 'shadow-none',
    base: 'shadow-liquid',
    elevated: 'shadow-liquid-lg hover:shadow-liquid-xl transition-shadow duration-500',
    floating: 'shadow-liquid-xl hover:shadow-[0_32px_80px_rgba(0,0,0,0.12)] transition-shadow duration-500',
  };

  // Enhanced iOS 18 Liquid Glass - Crystal Clear with Perfect Readability
  // Multi-layer depth: base glass + vibrancy + gradient shine + inner glow
  const liquidClasses = `
    bg-white/[0.15] dark:bg-white/[0.10]
    backdrop-blur-3xl
    backdrop-saturate-[1.8] backdrop-contrast-[1.1] backdrop-brightness-[1.05]
    ${elevationClasses[elevation]}
    relative
    will-change-[backdrop-filter]
    transform-gpu
    isolation-isolate
    before:absolute before:inset-0 before:rounded-[inherit]
    before:bg-gradient-to-br
    before:from-white/[0.18] dark:before:from-white/[0.12]
    before:via-white/[0.06] dark:before:via-white/[0.04]
    before:to-transparent
    before:pointer-events-none
    before:z-[-1]
    after:absolute after:inset-0 after:rounded-[inherit]
    after:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2),inset_0_-1px_0_0_rgba(0,0,0,0.05)]
    dark:after:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),inset_0_-1px_0_0_rgba(0,0,0,0.2)]
    after:pointer-events-none
    after:z-[-1]
  `;

  // Glass style (glassmorphism classico)
  const glassClasses = `
    bg-white/70 dark:bg-white/[0.10]
    backdrop-blur-xl
    shadow-glass-lg
    ring-1 ring-white/40 dark:ring-white/20 ring-inset
  `;

  // Solid style (card solida tradizionale)
  const solidClasses = `
    bg-white dark:bg-neutral-800
    shadow-soft
    ring-1 ring-neutral-200/50 dark:ring-neutral-700/50
  `;

  // Variant styles (new)
  const variantStyles = {
    default: liquid ? liquidClasses : glass ? glassClasses : solidClasses,
    outlined: `
      bg-transparent
      border-2 border-neutral-200 dark:border-neutral-700
      shadow-none
      hover:border-neutral-300 dark:hover:border-neutral-600
      transition-colors duration-300
    `,
    flat: `
      bg-neutral-50 dark:bg-neutral-900
      shadow-none
      ring-1 ring-neutral-100 dark:ring-neutral-800
    `,
  };

  const finalClasses = variantStyles[variant];

  const dataAttributes = {};
  if (liquid) {
    dataAttributes['data-liquid-glass'] = 'true';
  }

  return (
    <div
      className={`${baseClasses} ${finalClasses} ${className}`}
      {...dataAttributes}
      {...props}
    >
      {children}
    </div>
  );
}
