export default function Card({ children, className = '', glass = false, liquid = false, ...props }) {
  const baseClasses = 'rounded-2xl transition-all duration-500';

  // Liquid glass style (iOS 26 style - ultra trasparente con blur intenso)
  const liquidClasses = 'bg-white/[0.08] backdrop-blur-3xl shadow-liquid ring-1 ring-white/[0.15] ring-inset relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/[0.12] before:to-transparent before:pointer-events-none';

  // Glass style (glassmorphism classico)
  const glassClasses = 'bg-white/70 backdrop-blur-xl shadow-glass-lg ring-1 ring-white/40 ring-inset';

  // Solid style (card solida tradizionale)
  const solidClasses = 'bg-white shadow-soft ring-1 ring-neutral-200/50';

  const finalClasses = liquid
    ? liquidClasses
    : glass
    ? glassClasses
    : solidClasses;

  return (
    <div
      className={`${baseClasses} ${finalClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}