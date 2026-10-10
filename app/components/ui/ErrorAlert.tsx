/**
 * ErrorAlert Component - Ember Noir Design System
 *
 * Shows the alarm the stove is reporting. Code and text come from the backend
 * (local WiNet alarm bits, docs/api/thermorossi.md "Alarms").
 */

import { Siren } from 'lucide-react';
import Banner from './Banner';
import Button from './Button';

/**
 * ErrorAlert Component Props
 */
export interface ErrorAlertProps {
  errorCode: number;
  errorDescription?: string;
  className?: string;
  showDetailsButton?: boolean;
}

export default function ErrorAlert({ errorCode, errorDescription, className = '', showDetailsButton = false }: ErrorAlertProps) {
  if (!errorCode) {
    return null;
  }

  const actions = showDetailsButton ? (
    <Button
      variant="subtle"
      size="sm"
      onClick={() => { window.location.href = '/stove/errors'; }}
    >
      Storico allarmi
    </Button>
  ) : undefined;

  return (
    <Banner
      variant="error"
      icon={<Siren size={24} />}
      title="Stufa in allarme"
      description={
        <>
          <span className="mb-2 block font-semibold">
            {errorDescription || `Allarme con codice ${errorCode}`}
          </span>
          <span className="block text-sm">
            Risolvi la causa e azzera l&apos;allarme dal pannello della stufa: finché resta attivo non si può
            riaccendere.
          </span>
        </>
      }
      actions={actions}
      dismissKey=""
      compact={false}
      className={className}
    />
  );
}
