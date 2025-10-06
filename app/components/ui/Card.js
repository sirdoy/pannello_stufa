export default function Card({ children, className = '', glass = false, ...props }) {
  const baseClasses = 'rounded-2xl transition-all duration-300';

  const glassClasses = glass
    ? 'bg-white/70 backdrop-blur-xl shadow-glass-lg border border-white/40'
    : 'bg-white shadow-soft border border-neutral-200/50';

  return (
    <div
      className={`${baseClasses} ${glassClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}