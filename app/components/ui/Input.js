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
        className={`input-modern ${className}`}
        {...props}
      />
    </div>
  );
}