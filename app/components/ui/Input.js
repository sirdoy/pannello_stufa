export default function Input({
  type = 'text',
  label,
  icon,
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
        className={`w-full px-4 py-3 bg-white border border-neutral-300 rounded-xl text-neutral-900 placeholder:text-neutral-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 ${className}`}
        {...props}
      />
    </div>
  );
}