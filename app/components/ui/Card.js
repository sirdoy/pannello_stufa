export default function Card({ children, className = '', glass = false, liquid = false, ...props }) {
  const baseClasses = 'rounded-2xl transition-all duration-500';

  // Liquid glass style (iOS glassmorphism - con saturazione e contrasto migliorati)
  // Note: overflow-hidden rimosso per permettere ai dropdown interni di fuoriuscire correttamente
  const liquidClasses = 'bg-white/[0.08] dark:bg-white/[0.05] backdrop-blur-3xl backdrop-saturate-150 backdrop-contrast-105 shadow-liquid ring-1 ring-white/20 dark:ring-white/10 ring-inset relative before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/[0.12] dark:before:from-white/[0.08] before:to-transparent before:pointer-events-none';

  // Glass style (glassmorphism classico)
  const glassClasses = 'bg-white/70 dark:bg-white/[0.10] backdrop-blur-xl shadow-glass-lg ring-1 ring-white/40 dark:ring-white/20 ring-inset';

  // Solid style (card solida tradizionale)
  const solidClasses = 'bg-white dark:bg-neutral-800 shadow-soft ring-1 ring-neutral-200/50 dark:ring-neutral-700/50';

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
