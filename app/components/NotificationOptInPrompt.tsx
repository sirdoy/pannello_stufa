'use client';

/**
 * First-launch question "Vuoi ricevere le notifiche?" (workspace ROADMAP M48).
 *
 * Shown once per device to a signed-in user while no answer is stored
 * (`push-notifications-choice`): "Attiva" asks the browser permission and
 * registers this device for the Web Push the Pi sends, "No, grazie" stores the
 * refusal. The answer can be changed any time in /settings/notifications.
 */

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Bell } from 'lucide-react';
import { useUser } from '@/lib/auth/useUser';
import { Sheet } from '@/app/components/EmberGlass/Sheet';
import {
  errorTextStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
} from '@/app/components/EmberGlass/formStyles';
import { enablePush, setChoice, shouldAskForPush } from '@/lib/push/pushClient';

/** Let the dashboard settle before asking. */
export const PROMPT_DELAY_MS = 1500;

export default function NotificationOptInPrompt() {
  const { user } = useUser();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onAuthPage = pathname === '/auth' || pathname?.startsWith('/auth/');

  useEffect(() => {
    if (!user?.sub || onAuthPage || !shouldAskForPush()) return;
    const timer = setTimeout(() => setOpen(true), PROMPT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [user?.sub, onAuthPage]);

  const decline = () => {
    setChoice('disabled');
    setOpen(false);
  };

  const accept = async () => {
    setBusy(true);
    setError(null);
    const result = await enablePush();
    setBusy(false);
    if (result.ok || result.reason === 'denied') {
      // denied: the choice is stored as disabled, settings explain how to unblock
      setOpen(false);
      return;
    }
    setError(result.message);
  };

  return (
    <Sheet open={open} onClose={decline} title="Notifiche push">
      <div data-testid="push-optin" style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 18 }}>
        <Bell size={28} color="var(--accent)" aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: 15, lineHeight: 1.45, color: 'var(--text-2)' }}>
          <p style={{ margin: '0 0 8px', color: '#fff', fontWeight: 600 }}>
            Vuoi ricevere le notifiche su questo dispositivo?
          </p>
          <p style={{ margin: 0 }}>
            Accensioni e spegnimenti automatici della stufa, allarmi, manutenzione e sensori offline. Arrivano anche
            con l&apos;app chiusa e anche se la sessione scade. Puoi cambiare idea quando vuoi da Impostazioni →
            Notifiche.
          </p>
        </div>
      </div>
      {error && (
        <p role="alert" style={errorTextStyle}>
          {error}
        </p>
      )}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button type="button" onClick={decline} disabled={busy} style={{ ...secondaryButtonStyle, height: 44 }}>
          No, grazie
        </button>
        <button type="button" onClick={accept} disabled={busy} style={primaryButtonStyle(busy)}>
          {busy ? 'Attivazione…' : 'Attiva notifiche'}
        </button>
      </div>
    </Sheet>
  );
}
