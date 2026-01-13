export default function Input({
  type = 'text',
  label,
  icon,
  liquid = false,
  className = '',
  containerClassName = '',
  ...props
}) {
  return (
    <div className={containerClassName}>
      {label && (
        <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
          {icon && <span className="mr-1">{icon}</span>}
          {label}
        </label>
      )}
      <input
        type={type}
        className={`w-full px-4 py-3 rounded-2xl text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500
          font-medium
          focus:outline-none transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
          ${liquid
            ? `bg-white/[0.12] dark:bg-white/[0.08]
               backdrop-blur-3xl backdrop-saturate-[1.6] backdrop-brightness-[1.05]
               shadow-liquid-sm
               relative isolation-isolate
               focus:bg-white/[0.18] dark:focus:bg-white/[0.12]
               focus:backdrop-blur-4xl focus:backdrop-saturate-[2]
               focus:shadow-liquid
               focus:scale-[1.01]
               after:absolute after:inset-0 after:rounded-[inherit]
               after:shadow-[inset_0_1px_0_rgba(255,255,255,0.2),inset_0_-1px_0_rgba(0,0,0,0.05)]
               dark:after:shadow-[inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-1px_0_rgba(0,0,0,0.15)]
               after:pointer-events-none after:z-[-1]`
            : 'bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent'
          }
          ${className}`}
        {...props}
      />
    </div>
  );
}