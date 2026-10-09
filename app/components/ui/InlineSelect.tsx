'use client';

import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

export interface InlineSelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface InlineSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  /** Options as data; `children` (<option>) is the alternative for custom lists */
  options?: InlineSelectOption[];
  /** Disabled first option with an empty value */
  placeholder?: string;
  /** xs: inside a table row or a dense form row · sm: toolbars and filters · md: form field */
  size?: 'xs' | 'sm' | 'md';
}

const SIZES: Record<NonNullable<InlineSelectProps['size']>, string> = {
  xs: 'h-7 rounded-lg pr-7 pl-2 text-xs',
  sm: 'h-9 rounded-xl pr-8 pl-3 text-[13px]',
  md: 'h-11 rounded-xl pr-9 pl-3 text-[15px]',
};

const CHEVRON =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>\")";

/**
 * InlineSelect — compact native select with the EmberGlass look (workspace ROADMAP M75).
 *
 * The only place where a native <select> is written. Use it where ui/Select (Radix popover) does not fit:
 * editing inside a table row, action menus that reset to an empty value, filters that need an aria-label,
 * dense form rows. The native control keeps the OS picker on phones.
 */
const InlineSelect = forwardRef<HTMLSelectElement, InlineSelectProps>(function InlineSelect(
  { options, placeholder, size = 'sm', className, style, children, ...props },
  ref
) {
  return (
    <select
      ref={ref}
      className={cn(
        'cursor-pointer appearance-none bg-white/6 bg-no-repeat font-[inherit] text-(--text-1)',
        'border-[0.5px] border-white/10 transition-colors duration-200',
        'hover:border-white/14 hover:bg-white/8',
        'focus:outline-none focus-visible:border-ember-500/60 focus-visible:ring-2 focus-visible:ring-ember-500/50',
        'disabled:cursor-not-allowed disabled:opacity-50',
        '[&>option]:bg-(--surface-solid) [&>option]:text-(--text-1)',
        SIZES[size],
        className
      )}
      style={{
        backgroundImage: CHEVRON,
        backgroundPosition: `right ${size === 'xs' ? 8 : 11}px center`,
        ...style,
      }}
      {...props}
    >
      {placeholder !== undefined && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options?.map((opt) => (
        <option key={opt.value} value={opt.value} disabled={opt.disabled}>
          {opt.label}
        </option>
      ))}
      {children}
    </select>
  );
});

export default InlineSelect;
