export default function Select({
  label,
  icon,
  options = [],
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
      <select
        className={`select-modern ${className}`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}