'use client';

/**
 * Pagina Impostazioni Notifiche
 *
 * Gestione completa notifiche push:
 * - Richiesta permessi
 * - Visualizzazione stato
 * - Test notifiche
 * - Gestione dispositivi registrati
 */

import { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { ref, onValue, off } from 'firebase/database';
import { db } from '@/lib/firebase';
import {
  isNotificationSupported,
  getNotificationPermission,
  getUserFCMTokens,
} from '@/lib/notificationService';
import SettingsLayout from '@/app/components/SettingsLayout';
import Card from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import Heading from '@/app/components/ui/Heading';
import Text from '@/app/components/ui/Text';
import NotificationPermissionButton from '@/app/components/NotificationPermissionButton';
import NotificationPreferencesPanel from '@/app/components/NotificationPreferencesPanel';
import Skeleton from '@/app/components/ui/Skeleton';

export default function NotificationsSettingsPage() {
  const { user, isLoading: userLoading } = useUser();
  const [devices, setDevices] = useState([]);
  const [isLoadingDevices, setIsLoadingDevices] = useState(true);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);

  // Load dispositivi registrati
  useEffect(() => {
    if (!user?.sub) {
      setIsLoadingDevices(false);
      return;
    }

    const tokensRef = ref(db, `users/${user.sub}/fcmTokens`);

    const unsubscribe = onValue(tokensRef, (snapshot) => {
      if (snapshot.exists()) {
        const tokensData = snapshot.val();
        const devicesList = Object.entries(tokensData).map(([key, data]) => ({
          id: key,
          ...data,
        }));
        setDevices(devicesList);
      } else {
        setDevices([]);
      }
      setIsLoadingDevices(false);
    });

    return () => off(tokensRef);
  }, [user?.sub]);

  // Handler test notifica
  const handleTestNotification = async () => {
    setIsSendingTest(true);
    setTestSuccess(false);

    try {
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        setTestSuccess(true);
        setTimeout(() => setTestSuccess(false), 3000);
      } else {
        throw new Error(data.error || 'Errore invio notifica test');
      }

    } catch (error) {
      console.error('❌ Errore test notifica:', error);
      alert('Errore invio notifica test: ' + error.message);
    } finally {
      setIsSendingTest(false);
    }
  };

  // Loading state
  if (userLoading) {
    return (
      <SettingsLayout title="Impostazioni Notifiche" icon="🔔">
        <Skeleton className="h-48 w-full" />
      </SettingsLayout>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <SettingsLayout title="Impostazioni Notifiche" icon="🔔">
        <Card liquid className="p-8 text-center">
          <div className="text-6xl mb-4">🔐</div>
          <Heading level={2} className="mb-2">
            Autenticazione Richiesta
          </Heading>
          <Text variant="secondary" className="mb-6">
            Devi effettuare il login per gestire le notifiche
          </Text>
          <Button
            liquid
            variant="primary"
            onClick={() => window.location.href = '/auth/login'}
          >
            Accedi
          </Button>
        </Card>
      </SettingsLayout>
    );
  }

  const permission = getNotificationPermission();
  const isSupported = isNotificationSupported();

  return (
    <SettingsLayout title="Impostazioni Notifiche" icon="🔔">
      {/* Permessi Notifiche */}
      <Card liquid className="p-6">
        <Heading level={2} size="xl" weight="semibold" className="mb-4">
          Stato Notifiche
        </Heading>

          <NotificationPermissionButton
            onSuccess={(token) => {
              console.log('✅ Notifiche attivate, token:', token);
            }}
            onError={(error) => {
              console.error('❌ Errore attivazione:', error);
            }}
          />
        </Card>

      {/* Gestione Preferenze */}
      {permission === 'granted' && isSupported && (
        <div>
          <Heading level={2} size="xl" weight="semibold" className="mb-4">
            ⚙️ Gestione Notifiche
          </Heading>
          <Text size="sm" variant="secondary" className="mb-4">
            Personalizza quali notifiche ricevere. Le preferenze sono salvate automaticamente.
          </Text>
          <NotificationPreferencesPanel />
        </div>
      )}

      {/* Test Notifica */}
      {permission === 'granted' && isSupported && (
        <Card liquid className="p-6">
          <Heading level={2} size="xl" weight="semibold" className="mb-4">
            Test Notifica
          </Heading>

            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <Button
                liquid
                variant="accent"
                size="md"
                onClick={handleTestNotification}
                disabled={isSendingTest}
                icon={isSendingTest ? '⏳' : '🧪'}
              >
                {isSendingTest ? 'Invio...' : 'Invia Test'}
              </Button>

            {testSuccess && (
              <div className="flex items-center gap-2 text-sage-400 [html:not(.dark)_&]:text-sage-600">
                <span className="text-xl">✅</span>
                <span className="font-medium">Notifica inviata!</span>
              </div>
            )}

            <Text size="sm" variant="secondary">
              Invia una notifica di test per verificare che tutto funzioni correttamente
            </Text>
          </div>
        </Card>
      )}

      {/* Dispositivi Registrati */}
      {permission === 'granted' && (
        <Card liquid className="p-6">
          <Heading level={2} size="xl" weight="semibold" className="mb-4">
            Dispositivi Registrati
          </Heading>

          {isLoadingDevices ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : devices.length === 0 ? (
            <Text variant="secondary">
              Nessun dispositivo registrato
            </Text>
          ) : (
            <div className="space-y-3">
              {devices.map((device) => (
                <Card key={device.id} liquid className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">
                          {device.platform === 'ios' ? '📱' : '💻'}
                        </span>
                        <Text as="span" weight="medium">
                          {device.platform === 'ios' ? 'iPhone/iPad' : 'Dispositivo'}
                        </Text>
                        {device.isPWA && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-sage-100 [html:not(.dark)_&]:bg-sage-100 bg-sage-900/30 text-sage-300 [html:not(.dark)_&]:text-sage-700 rounded-full">
                            PWA
                          </span>
                        )}
                      </div>

                      <Text size="sm" variant="secondary" className="mb-1">
                        Registrato: {new Date(device.createdAt).toLocaleString('it-IT')}
                      </Text>

                      {device.userAgent && (
                        <Text size="xs" variant="tertiary" className="truncate max-w-md">
                          {device.userAgent}
                        </Text>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Info iOS */}
      <Card liquid className="p-6 bg-ocean-50/50 [html:not(.dark)_&]:bg-ocean-50/50 bg-ocean-900/10 border-2 border-ocean-200 [html:not(.dark)_&]:border-ocean-200 border-ocean-800">
        <Heading level={3} size="lg" weight="semibold" variant="ocean" className="mb-3 flex items-center gap-2">
          <span>ℹ️</span>
          <span>Note per iOS (iPhone/iPad)</span>
        </Heading>

        <ul className="space-y-2">
          <li className="flex gap-2">
            <Text size="sm" variant="ocean">•</Text>
            <Text size="sm" variant="ocean">
              Le notifiche funzionano solo se l&apos;app è installata come PWA
              (Aggiungi a Home da Safari)
            </Text>
          </li>
          <li className="flex gap-2">
            <Text size="sm" variant="ocean">•</Text>
            <Text size="sm" variant="ocean">
              Richiede iOS 16.4 o superiore
            </Text>
          </li>
          <li className="flex gap-2">
            <Text size="sm" variant="ocean">•</Text>
            <Text size="sm" variant="ocean">
              Una volta negato il permesso, devi abilitarlo manualmente
              dalle impostazioni iOS
            </Text>
          </li>
          <li className="flex gap-2">
            <Text size="sm" variant="ocean">•</Text>
            <Text size="sm" variant="ocean">
              Le notifiche arrivano anche quando l&apos;app è chiusa
            </Text>
          </li>
        </ul>
      </Card>
    </SettingsLayout>
  );
}
