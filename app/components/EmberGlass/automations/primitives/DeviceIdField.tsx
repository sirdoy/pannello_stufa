'use client';
/**
 * DeviceIdField — Phase 180.1
 *
 * Combines EmberSelect with a TextInput fallback so action forms can offer a
 * dropdown of available devices when the matching API responds, while still
 * letting the user paste a raw ID when:
 *   - the fetch is loading (disabled select with "Caricamento…" placeholder)
 *   - the fetch failed (TextInput + inline error hint)
 *   - the API returned no devices (TextInput + "nessun dispositivo" hint)
 *   - the current value isn't in the list yet (TextInput, e.g. when editing
 *     an existing rule whose target device was removed)
 */
import type { EmberSelectOption } from './EmberSelect';
import { EmberSelect } from './EmberSelect';
import { TextInput } from './TextInput';

export interface DeviceIdFieldProps {
  value: string;
  onChange: (value: string) => void;
  options: EmberSelectOption[];
  loading: boolean;
  error: string | null;
  placeholder?: string;
  id?: string;
  'aria-label'?: string;
}

export function DeviceIdField({
  value,
  onChange,
  options,
  loading,
  error,
  placeholder = 'Seleziona…',
  id,
  ...rest
}: DeviceIdFieldProps) {
  const ariaLabel = rest['aria-label'];

  if (loading) {
    return (
      <EmberSelect
        id={id}
        value=""
        onChange={() => {}}
        options={[]}
        placeholder="Caricamento…"
        disabled
        aria-label={ariaLabel}
      />
    );
  }

  const hasMatchingOption = value !== '' && options.some((o) => o.value === value);
  const fallbackToText = error !== null || options.length === 0 || (value !== '' && !hasMatchingOption);

  if (fallbackToText) {
    const hint =
      error !== null
        ? `Errore: ${error}. Inserisci l'ID manualmente.`
        : options.length === 0
          ? 'Nessun dispositivo disponibile. Inserisci l\'ID manualmente.'
          : 'ID non trovato fra i dispositivi attuali. Modificalo manualmente.';
    return (
      <>
        <TextInput
          id={id}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          aria-label={ariaLabel}
        />
        <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 4 }}>{hint}</div>
      </>
    );
  }

  return (
    <EmberSelect
      id={id}
      value={value}
      onChange={onChange}
      options={options}
      placeholder={value === '' ? placeholder : undefined}
      aria-label={ariaLabel}
    />
  );
}
