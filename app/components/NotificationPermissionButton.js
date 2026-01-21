'use client';

/**
 * NotificationPermissionButton
 *
 * Componente per richiedere e gestire permessi notifiche push
 *
 * Features:
 * - Auto-detect supporto device/browser
 * - Gestione stato permessi (granted/denied/default)
 * - iOS PWA detection e istruzioni
 * - Error handling user-friendly
 * - Integrazione con FCM token management
 */

import { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import {
  isNotificationSupported,
  isIOS,
  isPWA,
  getNotificationPermission,
  getFCMToken,
  requestNotificationPermission,
} from '@/lib/notificationService';
import Button from './ui/Button';
import Banner from './ui/Banner';
import { Text } from './ui';

export default function NotificationPermissionButton({ onSuccess, onError }) {
  const { user } = useUser();
  const [permission, setPermission] = useState('default');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [supported, setSupported] = useState(true);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  // Check supporto e permessi al mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check supporto
    const isSupported = isNotificationSupported();
    setSupported(isSupported);

    if (!isSupported) {
      setError('Le notifiche non sono supportate su questo dispositivo');
      return;
    }

    // Check permessi attuali
    const currentPermission = getNotificationPermission();
    setPermission(currentPermission);

    // Su iOS, verifica se è PWA
    if (isIOS() && !isPWA()) {
      setShowIOSInstructions(true);
    }
  }, []);

  // Handler richiesta permessi
  const handleRequestPermission = async () => {
    if (!user?.sub) {
      setError('Devi essere autenticato per abilitare le notifiche');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Richiedi permesso
      const result = await requestNotificationPermission();

      if (result === 'granted') {
        // Ottieni FCM token
        const token = await getFCMToken(user.sub);

        setPermission('granted');

        // Callback success
        if (onSuccess) onSuccess(token);

        console.log('✅ Notifiche abilitate con successo');
      } else {
        throw new Error('Permesso notifiche non concesso');
      }

    } catch (err) {
      console.error('❌ Errore abilitazione notifiche:', err);
      setError(err.message || 'Errore durante l\'abilitazione delle notifiche');

      // Callback error
      if (onError) onError(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Render: Notifiche non supportate
  if (!supported) {
    return (
      <Banner
        variant="info"
        icon="ℹ️"
        title="Notifiche non disponibili"
        description="Il tuo browser/dispositivo non supporta le notifiche push"
        liquid
      />
    );
  }

  // Render: iOS non-PWA
  if (showIOSInstructions && permission === 'default') {
    return (
      <Banner
        variant="warning"
        icon="📱"
        title="iPhone/iPad rilevato"
        description={
          <div className="space-y-2">
            <Text variant="warning" size="sm">
              Per ricevere notifiche su iOS, devi prima installare l&apos;app:
            </Text>
            <ol className="list-decimal list-inside space-y-1">
              <Text as="li" variant="warning" size="sm">Tocca il pulsante Condividi in Safari</Text>
              <Text as="li" variant="warning" size="sm">Seleziona &quot;Aggiungi a Home&quot;</Text>
              <Text as="li" variant="warning" size="sm">Apri l&apos;app dalla schermata Home</Text>
              <Text as="li" variant="warning" size="sm">Ritorna qui per abilitare le notifiche</Text>
            </ol>
          </div>
        }
        liquid
      />
    );
  }

  // Render: Permesso negato
  if (permission === 'denied') {
    return (
      <Banner
        variant="error"
        icon="🚫"
        title="Notifiche bloccate"
        description={
          <div className="space-y-2">
            <Text variant="ember" size="sm">
              Hai negato il permesso per le notifiche.
            </Text>
            <Text variant="ember" size="sm">
              Per abilitarle, vai nelle impostazioni del browser/dispositivo e
              consenti le notifiche per questo sito.
            </Text>
          </div>
        }
        liquid
      />
    );
  }

  // Render: Permesso concesso
  if (permission === 'granted') {
    return (
      <Banner
        variant="success"
        icon="✅"
        title="Notifiche attive"
        description="Riceverai notifiche per errori stufa, scheduler e manutenzione"
        liquid
      />
    );
  }

  // Render: Pulsante richiesta permesso
  return (
    <div className="space-y-4">
      {error && (
        <Banner
          variant="error"
          icon="⚠️"
          title="Errore"
          description={error}
          dismissible
          onDismiss={() => setError(null)}
          liquid
        />
      )}

      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <Button
          liquid
          variant="primary"
          size="md"
          onClick={handleRequestPermission}
          disabled={isLoading || !user}
          icon={isLoading ? '⏳' : '🔔'}
        >
          {isLoading ? 'Attivazione...' : 'Attiva Notifiche'}
        </Button>

        <div>
          <Text variant="secondary" size="sm" weight="medium" className="mb-1">
            Riceverai notifiche per:
          </Text>
          <ul className="list-disc list-inside space-y-0.5">
            <Text as="li" variant="secondary" size="sm">Errori critici della stufa</Text>
            <Text as="li" variant="secondary" size="sm">Azioni automatiche dello scheduler</Text>
            <Text as="li" variant="secondary" size="sm">Promemoria manutenzione</Text>
          </ul>
        </div>
      </div>

      {!user && (
        <Text variant="warning" size="sm">
          Devi effettuare il login per abilitare le notifiche
        </Text>
      )}
    </div>
  );
}
