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
        <label className="block text-sm font-semibold text-neutral-700 mb-2">
          {icon && <span className="mr-1">{icon}</span>}
          {label}
        </label>
      )}
      <input
        type={type}
        className={`w-full px-4 py-3 rounded-xl text-neutral-900 placeholder:text-neutral-400
          focus:outline-none transition-all duration-200
          ${liquid
            ? 'bg-white/[0.08] backdrop-blur-2xl shadow-liquid-sm ring-1 ring-white/20 ring-inset focus:bg-white/[0.12] focus:shadow-liquid focus:ring-2 focus:ring-primary-500/30'
            : 'bg-white border border-neutral-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent'
          }
          ${className}`}
        {...props}
      />
    </div>
  );
}