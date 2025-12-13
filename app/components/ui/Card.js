export default function Card({
  children,
  className = '',
  glass = false,
  liquid = false,
  elevation = 'base', // 'flat' | 'base' | 'elevated' | 'floating'
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

  // Liquid glass style (iOS glassmorphism - migliorato con opacità maggiore)
  // Note: overflow-hidden rimosso per permettere ai dropdown interni di fuoriuscire correttamente
  const liquidClasses = `
    bg-white/[0.12] dark:bg-white/[0.08]
    backdrop-blur-2xl sm:backdrop-blur-3xl
    backdrop-saturate-150 backdrop-contrast-105
    ${elevationClasses[elevation]}
    ring-1 ring-white/25 dark:ring-white/15 ring-inset
    relative
    will-change-[backdrop-filter]
    transform-gpu
    before:absolute before:inset-0
    before:bg-gradient-to-br
    before:from-white/[0.15] dark:before:from-white/[0.10]
    before:via-white/[0.08] dark:before:via-white/[0.05]
    before:to-transparent
    before:pointer-events-none
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

  const finalClasses = liquid
    ? liquidClasses
    : glass
    ? glassClasses
    : solidClasses;

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
