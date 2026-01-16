'use client';

import Link from 'next/link';
import Text from '@/app/components/ui/Text';

/**
 * Container per dropdown menu desktop - Ember Noir Design System
 */
export function DropdownContainer({ children, className = '', align = 'left' }) {
  const alignmentClass = align === 'right' ? 'right-0' : 'left-0';

  return (
    <div className={`absolute ${alignmentClass} mt-3 bg-slate-900/[0.95] [html:not(.dark)_&]:bg-white/[0.92] backdrop-blur-[80px] border border-white/15 [html:not(.dark)_&]:border-white/30 rounded-2xl shadow-liquid-xl overflow-hidden z-[9000] ring-1 ring-white/10 [html:not(.dark)_&]:ring-white/20 ring-inset animate-dropdown ${className}`}>
      <div className="p-1.5">
        {children}
      </div>
    </div>
  );
}

/**
 * Item standard del dropdown con hover effects - Ember Noir Design System
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
  const activeClasses = 'bg-ember-500/30 [html:not(.dark)_&]:bg-ember-500/20 text-ember-300 [html:not(.dark)_&]:text-ember-700 shadow-liquid-sm';
  const inactiveClasses = 'text-slate-200 [html:not(.dark)_&]:text-slate-800 hover:bg-slate-800/80 [html:not(.dark)_&]:hover:bg-slate-100/80 hover:shadow-liquid-sm hover:scale-[1.02]';

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
 * Card info per user dropdown - Ember Noir Design System
 */
export function DropdownInfoCard({ title, subtitle, details, className = '' }) {
  return (
    <div className={`px-4 py-3.5 mb-1 rounded-xl bg-slate-800/60 [html:not(.dark)_&]:bg-slate-100/60 ${className}`}>
      <Text variant="label" size="xs" weight="semibold" className="mb-1.5">
        {title}
      </Text>
      <Text variant="body" size="sm" weight="semibold" className="truncate">
        {subtitle}
      </Text>
      {details && (
        <Text variant="tertiary" size="xs" className="truncate mt-1 opacity-80">
          {details}
        </Text>
      )}
    </div>
  );
}

/**
 * Sezione menu mobile con header - Ember Noir Design System
 */
export function MenuSection({ icon, title, children, hasBorder = false, className = '' }) {
  return (
    <div className={`space-y-2 ${hasBorder ? 'pt-4 mt-4 border-t border-white/15 [html:not(.dark)_&]:border-white/30' : ''} ${className}`}>
      {title && (
        <div className="flex items-center gap-2 px-3 py-2">
          {icon && <span className="text-xl">{icon}</span>}
          <Text variant="label" size="xs" weight="bold" className="uppercase tracking-widest">
            {title}
          </Text>
        </div>
      )}
      <div className="space-y-1.5">
        {children}
      </div>
    </div>
  );
}

/**
 * Item menu mobile con effetti - Ember Noir Design System
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
  const activeClasses = 'bg-ember-500/30 [html:not(.dark)_&]:bg-ember-500/20 text-ember-300 [html:not(.dark)_&]:text-ember-700 shadow-liquid-md ring-1 ring-ember-500/40 [html:not(.dark)_&]:ring-ember-500/30 ring-inset';
  const inactiveClasses = variant === 'prominent'
    ? 'text-white bg-gradient-to-br from-ember-600 to-flame-700 [html:not(.dark)_&]:from-ember-500 [html:not(.dark)_&]:to-flame-600 hover:from-ember-700 hover:to-flame-800 [html:not(.dark)_&]:hover:from-ember-600 [html:not(.dark)_&]:hover:to-flame-700 shadow-liquid-lg hover:shadow-liquid-xl ring-1 ring-ember-600/50 [html:not(.dark)_&]:ring-ember-500/50 ring-inset'
    : 'text-slate-200 [html:not(.dark)_&]:text-slate-800 bg-slate-800/60 [html:not(.dark)_&]:bg-slate-100/60 hover:bg-slate-800/90 [html:not(.dark)_&]:hover:bg-slate-100/90 shadow-liquid-sm ring-1 ring-white/15 [html:not(.dark)_&]:ring-white/25 ring-inset';

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
 * Card utente per mobile menu - Ember Noir Design System
 */
export function UserInfoCard({ icon: Icon, name, email, className = '' }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-4 rounded-2xl bg-slate-800/70 [html:not(.dark)_&]:bg-slate-100/70 backdrop-blur-2xl shadow-liquid-md ring-1 ring-white/15 [html:not(.dark)_&]:ring-white/25 ring-inset ${className}`}>
      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-ember-500/30 to-flame-500/30 [html:not(.dark)_&]:from-ember-500/20 [html:not(.dark)_&]:to-flame-500/20">
        {Icon && <Icon className="w-6 h-6 text-ember-300 [html:not(.dark)_&]:text-ember-700" />}
      </div>
      <div className="flex-1 min-w-0">
        <Text variant="body" size="sm" weight="semibold" className="truncate">
          {name}
        </Text>
        {email && (
          <Text variant="tertiary" size="xs" className="truncate mt-0.5 opacity-80">
            {email}
          </Text>
        )}
      </div>
    </div>
  );
}
