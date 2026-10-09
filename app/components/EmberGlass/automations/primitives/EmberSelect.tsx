'use client';
/**
 * EmberSelect — automations-local primitive (Phase 180.1)
 * String-valued wrapper of ui/InlineSelect (workspace ROADMAP M75). Used by DeviceIdField to surface
 * device pickers populated from per-category proxy hooks.
 */
import type { ChangeEvent, SelectHTMLAttributes } from 'react';
import InlineSelect from '@/app/components/ui/InlineSelect';

export interface EmberSelectOption {
  value: string;
  label: string;
}

export interface EmberSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: EmberSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  'aria-label'?: string;
}

export function EmberSelect({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  id,
  ...rest
}: EmberSelectProps & Pick<SelectHTMLAttributes<HTMLSelectElement>, 'aria-label'>) {
  return (
    <InlineSelect
      id={id}
      className="w-full"
      value={value}
      onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
      disabled={disabled}
      aria-label={rest['aria-label']}
      options={options}
      placeholder={placeholder}
    />
  );
}
