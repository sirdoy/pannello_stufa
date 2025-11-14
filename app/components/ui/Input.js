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
        className={`w-full px-4 py-3 rounded-xl text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500
          focus:outline-none transition-all duration-200
          ${liquid
            ? 'bg-white/[0.08] dark:bg-white/[0.05] backdrop-blur-2xl shadow-liquid-sm ring-1 ring-white/20 dark:ring-white/10 ring-inset focus:bg-white/[0.12] dark:focus:bg-white/[0.08] focus:shadow-liquid focus:ring-2 focus:ring-primary-500/30'
            : 'bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent'
          }
          ${className}`}
        {...props}
      />
    </div>
  );
}