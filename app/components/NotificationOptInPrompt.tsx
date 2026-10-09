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
import Button from '@/app/components/ui/Button';
import Text from '@/app/components/ui/Text';
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
      <div data-testid="push-optin" className="mb-4.5 flex items-start gap-3.5">
        <Bell size={28} className="mt-0.5 shrink-0 text-(--accent)" aria-hidden="true" />
        <div>
          <Text weight="semibold" className="mb-2">
            Vuoi ricevere le notifiche su questo dispositivo?
          </Text>
          <Text variant="secondary" size="sm">
            Accensioni e spegnimenti automatici della stufa, allarmi, manutenzione e sensori offline. Arrivano anche
            con l&apos;app chiusa e anche se la sessione scade. Puoi cambiare idea quando vuoi da Impostazioni →
            Notifiche.
          </Text>
        </div>
      </div>
      {error && (
        <Text role="alert" variant="danger" size="sm" className="mb-3">
          {error}
        </Text>
      )}
      <div className="flex justify-end gap-2.5">
        <Button type="button" variant="subtle" size="sm" onClick={decline} disabled={busy}>
          No, grazie
        </Button>
        <Button type="button" variant="ember" size="sm" onClick={accept} disabled={busy}>
          {busy ? 'Attivazione…' : 'Attiva notifiche'}
        </Button>
      </div>
    </Sheet>
  );
}
