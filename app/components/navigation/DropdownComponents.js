'use client';

import Link from 'next/link';

/**
 * Container per dropdown menu desktop
 */
export function DropdownContainer({ children, className = '', align = 'left' }) {
  const alignmentClass = align === 'right' ? 'right-0' : 'left-0';

  return (
    <div className={`absolute ${alignmentClass} mt-3 bg-white/[0.92] dark:bg-neutral-900/[0.95] backdrop-blur-[80px] border border-white/30 dark:border-white/15 rounded-2xl shadow-liquid-xl overflow-hidden z-[9000] ring-1 ring-white/20 dark:ring-white/10 ring-inset animate-dropdown ${className}`}>
      <div className="p-1.5">
        {children}
      </div>
    </div>
  );
}

/**
 * Item standard del dropdown con hover effects
 */
export function DropdownItem({
  href,
  icon,
  label,
  description,
  isActive = false,
  onClick,
  animationDelay = 0,
  className = ''
}) {
  const activeClasses = 'bg-primary-500/20 dark:bg-primary-500/30 text-primary-700 dark:text-primary-300 shadow-liquid-sm';
  const inactiveClasses = 'text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100/80 dark:hover:bg-neutral-800/80 hover:shadow-liquid-sm hover:scale-[1.02]';

  return (
    <Link
      href={href}
      onClick={onClick}
      style={{ animationDelay: `${animationDelay}ms` }}
      className={`group block px-4 ${description ? 'py-3.5' : 'py-3'} rounded-xl text-sm transition-all duration-300 relative overflow-hidden ${
        isActive ? activeClasses : inactiveClasses
      } ${className}`}
    >
      <div className="relative z-10 flex items-center gap-3">
        {icon && <span className={description ? 'text-xl' : 'text-base opacity-80'}>{icon}</span>}
        <div className="flex-1 min-w-0">
          <div className={description ? 'font-semibold' : 'font-medium'}>{label}</div>
          {description && (
            <div className="text-xs opacity-70 mt-0.5 leading-snug">{description}</div>
          )}
        </div>
      </div>
      {/* Hover shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
    </Link>
  );
}

/**
 * Card info per user dropdown
 */
export function DropdownInfoCard({ title, subtitle, details, className = '' }) {
  return (
    <div className={`px-4 py-3.5 mb-1 rounded-xl bg-neutral-100/60 dark:bg-neutral-800/60 ${className}`}>
      <p className="text-[10px] uppercase tracking-wider font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5">
        {title}
      </p>
      <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
        {subtitle}
      </p>
      {details && (
        <p className="text-xs text-neutral-600 dark:text-neutral-400 truncate mt-1 opacity-80">
          {details}
        </p>
      )}
    </div>
  );
}

/**
 * Sezione menu mobile con header
 */
export function MenuSection({ icon, title, children, hasBorder = false, className = '' }) {
  return (
    <div className={`space-y-2 ${hasBorder ? 'pt-4 mt-4 border-t border-white/30 dark:border-white/15' : ''} ${className}`}>
      {title && (
        <div className="flex items-center gap-2 px-3 py-2">
          {icon && <span className="text-xl">{icon}</span>}
          <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-600 dark:text-neutral-400">
            {title}
          </span>
        </div>
      )}
      <div className="space-y-1.5">
        {children}
      </div>
    </div>
  );
}

/**
 * Item menu mobile con effetti
 */
export function MenuItem({
  href,
  icon,
  label,
  isActive = false,
  onClick,
  animationDelay = 0,
  variant = 'default', // 'default' | 'prominent'
  className = ''
}) {
  const activeClasses = 'bg-primary-500/20 dark:bg-primary-500/30 text-primary-700 dark:text-primary-300 shadow-liquid-md ring-1 ring-primary-500/30 dark:ring-primary-500/40 ring-inset';
  const inactiveClasses = variant === 'prominent'
    ? 'text-white bg-gradient-to-br from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 hover:from-primary-600 hover:to-primary-700 dark:hover:from-primary-700 dark:hover:to-primary-800 shadow-liquid-lg hover:shadow-liquid-xl ring-1 ring-primary-500/50 dark:ring-primary-600/50 ring-inset'
    : 'text-neutral-800 dark:text-neutral-200 bg-neutral-100/60 dark:bg-neutral-800/60 hover:bg-neutral-100/90 dark:hover:bg-neutral-800/90 shadow-liquid-sm ring-1 ring-white/25 dark:ring-white/15 ring-inset';

  const fontClass = variant === 'prominent' ? 'font-bold' : (isActive ? 'font-semibold' : 'font-medium');
  const paddingClass = variant === 'prominent' ? 'py-4' : 'py-3.5';
  const roundingClass = variant === 'prominent' ? 'rounded-2xl' : 'rounded-xl';

  return (
    <Link
      href={href}
      onClick={onClick}
      style={{ animationDelay: `${animationDelay}ms` }}
      className={`group flex items-center gap-3 px-4 ${paddingClass} ${roundingClass} text-sm ${fontClass} transition-all duration-300 relative overflow-hidden hover:scale-[1.02] ${
        isActive ? activeClasses : inactiveClasses
      } ${className}`}
    >
      <div className="relative z-10 flex items-center gap-3">
        {icon && <span className={variant === 'prominent' ? 'text-2xl' : 'text-base opacity-80'}>{icon}</span>}
        <span>{label}</span>
      </div>
      {/* Hover shine effect */}
      <div className={`absolute inset-0 bg-gradient-to-r from-transparent ${variant === 'prominent' ? 'via-white/20' : 'via-white/10'} to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none`} />
    </Link>
  );
}

/**
 * Card utente per mobile menu
 */
export function UserInfoCard({ icon: Icon, name, email, className = '' }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-4 rounded-2xl bg-neutral-100/70 dark:bg-neutral-800/70 backdrop-blur-2xl shadow-liquid-md ring-1 ring-white/25 dark:ring-white/15 ring-inset ${className}`}>
      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 dark:from-primary-500/30 dark:to-accent-500/30">
        {Icon && <Icon className="w-6 h-6 text-primary-700 dark:text-primary-300" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate text-neutral-900 dark:text-neutral-100">
          {name}
        </p>
        {email && (
          <p className="text-xs text-neutral-600 dark:text-neutral-400 truncate mt-0.5 opacity-80">
            {email}
          </p>
        )}
      </div>
    </div>
  );
}
