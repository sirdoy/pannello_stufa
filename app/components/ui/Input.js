'use client';

/**
 * Input Component - Ember Noir Design System
 *
 * Form input with dark-first design and warm accent focus states.
 * Supports both light and dark themes.
 *
 * @param {Object} props
 * @param {string} props.type - Input type
 * @param {string} props.label - Label text
 * @param {string} props.icon - Optional emoji icon
 * @param {'default'|'ember'|'ocean'} props.variant - Color variant for focus
 * @param {string} props.className - Additional classes
 * @param {string} props.containerClassName - Container classes
 */
export default function Input({
  type = 'text',
  label,
  icon,
  variant = 'default',
  className = '',
  containerClassName = '',
  ...props
}) {
  // Focus ring colors - Ember Noir palette
  const focusColors = {
    default: 'focus:ring-ember-500/50 focus:border-ember-500/60',
    ember: 'focus:ring-ember-500/50 focus:border-ember-500/60',
    ocean: 'focus:ring-ocean-500/50 focus:border-ocean-500/60',
  };

  return (
    <div className={containerClassName}>
      {label && (
        <label className="
          block text-sm font-semibold mb-2 font-display
          text-slate-300
          [html:not(.dark)_&]:text-slate-700
        ">
          {icon && <span className="mr-1.5">{icon}</span>}
          {label}
        </label>
      )}
      <input
        type={type}
        className={`
          w-full px-4 py-3 rounded-xl
          bg-slate-800/60 backdrop-blur-xl
          border border-slate-700/50
          text-slate-100 placeholder:text-slate-500
          font-medium font-display
          focus:outline-none focus:ring-2 ${focusColors[variant]}
          transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          [html:not(.dark)_&]:bg-white/80
          [html:not(.dark)_&]:border-slate-300/60
          [html:not(.dark)_&]:text-slate-900
          [html:not(.dark)_&]:placeholder:text-slate-400
          ${className}
        `.trim().replace(/\s+/g, ' ')}
        {...props}
      />
    </div>
  );
}
