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
  getFCMToken,
  initializeNotifications,
  checkStoredToken,
} from '@/lib/notificationService';
import SettingsLayout from '@/app/components/SettingsLayout';
import Card from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import { Heading, Text, Banner, Badge } from '@/app/components/ui';
import NotificationPermissionButton from '@/app/components/NotificationPermissionButton';
import NotificationPreferencesPanel from '@/app/components/NotificationPreferencesPanel';
import NotificationSettingsForm from './NotificationSettingsForm';
import Skeleton from '@/app/components/ui/Skeleton';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';

type TestResult = 'success' | 'error' | 'no_tokens';

interface NotificationDevice {
  tokenKey: string;
  customName?: string;
  lastUsed?: number;
  [key: string]: any;
}

interface NotificationPreferences {
  enabledTypes: Record<string, boolean>;
  dndWindows: Array<{
    enabled: boolean;
    start: string;
    end: string;
  }>;
  timezone: string;
  rateLimits?: Record<string, number>;
}

export default function NotificationsSettingsPage() {
  const { user, isLoading: userLoading } = useUser();
  const [devices, setDevices] = useState<NotificationDevice[]>([]);
  const [isLoadingDevices, setIsLoadingDevices] = useState(true);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [isReactivating, setIsReactivating] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [currentDeviceToken, setCurrentDeviceToken] = useState<string | null>(null);
  const [isCurrentDeviceRegistered, setIsCurrentDeviceRegistered] = useState(false);

  // Notification preferences - managed by hook with Firestore sync
  const {
    prefs: preferences,
    loading: isLoadingPreferences,
    error: preferencesError,
    isSaving: isSavingPreferences,
    savePreferences,
  } = useNotificationPreferences(user?.sub);

  // Success banner state
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load existing token on mount and check for 30-day refresh
  useEffect(() => {
    if (!user?.sub) return;

    const loadExistingToken = async () => {
      try {
        // Initialize notifications - checks for existing token and refreshes if >30 days
        const result = await initializeNotifications(user.sub);

        if (result.hasToken && result.token) {
          setCurrentDeviceToken(result.token);
          console.log('[NotificationsPage] Token loaded from storage:', {
            hasToken: result.hasToken,
            wasRefreshed: result.wasRefreshed,
            permissionStatus: result.permissionStatus,
          });
        } else {
          console.log('[NotificationsPage] No stored token found');
        }
      } catch (error) {
        console.error('[NotificationsPage] Error loading token:', error);
      }
    };

    loadExistingToken();
  }, [user?.sub]);

  // Handler per riattivare le notifiche (ri-registra il token)
  const handleReactivate = async () => {
    if (!user?.sub) return;

    setIsReactivating(true);
    setRegistrationError(null);
    setTestResult(null);

    try {
      const token = await getFCMToken(user.sub);
      setCurrentDeviceToken(token);
      setIsCurrentDeviceRegistered(true);
      setTestResult('success');
      setTimeout(() => setTestResult(null), 5000);
    } catch (error) {
      console.error('Errore riattivazione:', error);
      setRegistrationError(error instanceof Error ? error.message : 'Errore sconosciuto');
      setTestResult('error');
    } finally {
      setIsReactivating(false);
    }
  };

  // Handler per disattivare le notifiche (rimuove tutti i token)
  const handleDeactivate = async () => {
    if (!confirm('Vuoi disattivare le notifiche su tutti i dispositivi?')) return;

    setIsDeactivating(true);
    try {
      const response = await fetch('/api/notifications/unregister', {
        method: 'DELETE',
      });

      if (response.ok) {
        setDevices([]);
        setTestResult(null);
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Errore disattivazione');
      }
    } catch (error) {
      console.error('Errore disattivazione:', error);
      alert('Errore: ' + (error instanceof Error ? error.message : 'Errore sconosciuto'));
    } finally {
      setIsDeactivating(false);
    }
  };

  // Handler for saving notification preferences
  const handleSavePreferences = async (data: NotificationPreferences) => {
    try {
      await savePreferences(data);

      // Show success message
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('[NotificationsPage] Error saving preferences:', error);
      alert('Errore salvataggio preferenze: ' + (error instanceof Error ? error.message : 'Errore sconosciuto'));
    }
  };

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

        // Check if current device token is in the list
        if (currentDeviceToken) {
          const isRegistered = devicesList.some(
            (d) => d.token === currentDeviceToken
          );
          setIsCurrentDeviceRegistered(isRegistered);
        }
      } else {
        setDevices([]);
        setIsCurrentDeviceRegistered(false);
      }
      setIsLoadingDevices(false);
    });

    return () => off(tokensRef);
  }, [user?.sub, currentDeviceToken]);

  // Handler test notifica - invia solo al dispositivo corrente se registrato
  const handleTestNotification = async (broadcastToAll = false) => {
    setIsSendingTest(true);
    setTestResult(null);

    try {
      // Build request body
      // - If broadcastToAll: send empty body (API sends to all devices)
      // - Otherwise: include deviceToken to send only to this device
      const requestBody = broadcastToAll
        ? {}
        : currentDeviceToken
          ? { deviceToken: currentDeviceToken }
          : {};

      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok) {
        setTestResult('success');
        setTimeout(() => setTestResult(null), 5000);
      } else {
        // Gestisci errori specifici
        if (data.errorCode === 'NO_TOKENS') {
          setTestResult('no_tokens');
        } else if (data.error?.includes('Rate limit exceeded')) {
          // Rate limit hit - informational, not an error
          setTestResult('rate_limited');
          setTimeout(() => setTestResult(null), 5000);
        } else {
          throw new Error(data.error || 'Errore invio notifica test');
        }
      }
    } catch (error) {
      console.error('Errore test notifica:', error);
      setTestResult('error');
      setTimeout(() => setTestResult(null), 5000);
    } finally {
      setIsSendingTest(false);
    }
  };

  // Loading state
  if (userLoading) {
    return (
      <SettingsLayout title="Notifiche" icon="🔔">
        <div className="space-y-6">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      </SettingsLayout>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <SettingsLayout title="Notifiche" icon="🔔">
        <Card variant="glass" className="p-8 text-center">
          <div className="text-6xl mb-4">🔐</div>
          <Heading level={2} size="xl" className="mb-2">
            Autenticazione Richiesta
          </Heading>
          <Text variant="secondary" className="mb-6">
            Devi effettuare il login per gestire le notifiche
          </Text>
          <Button
            variant="ember"
            onClick={() => (window.location.href = '/auth/login')}
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
    <SettingsLayout title="Notifiche" icon="🔔">
      {/* Stato Permessi */}
      <Card variant="glass" className="p-6 sm:p-8">
        <Heading level={2} size="lg" className="mb-4">
          Stato Notifiche
        </Heading>
        <NotificationPermissionButton
          onSuccess={(token) => {
            console.log('Notifiche attivate, token:', token);
          }}
          onError={(error) => {
            console.error('Errore attivazione:', error);
          }}
        />
      </Card>

      {/* Preferenze Notifiche */}
      {permission === 'granted' && isSupported && (
        <>
          <div className="space-y-2">
            <Heading level={2} size="lg">
              Preferenze Notifiche
            </Heading>
            <Text variant="secondary" size="sm">
              Scegli quali notifiche ricevere e quando. Le preferenze sono salvate per questo account.
            </Text>
          </div>

          {/* Success Banner */}
          {saveSuccess && (
            <Banner
              variant="success"
              title="Preferenze salvate con successo!"
              dismissible
              onDismiss={() => setSaveSuccess(false)}
            />
          )}

          <NotificationSettingsForm
            initialValues={preferences}
            onSubmit={handleSavePreferences}
            isLoading={isLoadingPreferences}
            isSaving={isSavingPreferences}
          />
        </>
      )}

      {/* Test Notifica */}
      {permission === 'granted' && isSupported && (
        <Card variant="glass" className="p-6 sm:p-8">
          <Heading level={2} size="lg" className="mb-2">
            Test Notifiche
          </Heading>
          <Text variant="secondary" size="sm" className="mb-6">
            Invia notifiche di prova per testare il sistema e le preferenze Phase 3 (filtri, rate limits, DND).
          </Text>

          <div className="flex flex-col gap-4">
            {/* Test dispositivo corrente */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <Button
                variant={testResult === 'success' ? 'success' : 'ember'}
                size="md"
                onClick={() => handleTestNotification(false)}
                disabled={isSendingTest || !isCurrentDeviceRegistered}
              >
                {isSendingTest
                  ? 'Invio in corso...'
                  : testResult === 'success'
                    ? 'Notifica inviata!'
                    : 'Test Questo Dispositivo'}
              </Button>

              {!isCurrentDeviceRegistered && !testResult && (
                <Text variant="warning" size="sm">
                  Registra prima questo dispositivo per il test singolo
                </Text>
              )}

              {testResult === 'success' && (
                <Text variant="sage" size="sm">
                  Notifica inviata! Controlla il dispositivo tra pochi secondi
                </Text>
              )}

              {testResult === 'error' && (
                <Text variant="ember" size="sm">
                  Errore durante l&apos;invio della notifica
                </Text>
              )}

              {testResult === 'rate_limited' && (
                <Text variant="copper" size="sm">
                  ⏱️ Rate limit: troppi test ravvicinati. Attendi qualche secondo.
                </Text>
              )}
            </div>

            {/* Test tutti i dispositivi */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center border-t border-default pt-4">
              <Button
                variant="subtle"
                size="md"
                onClick={() => handleTestNotification(true)}
                disabled={isSendingTest || devices.length === 0}
              >
                {isSendingTest
                  ? 'Invio in corso...'
                  : `Test Tutti i Dispositivi (${devices.length})`}
              </Button>

              {devices.length === 0 && (
                <Text variant="warning" size="sm">
                  Nessun dispositivo registrato
                </Text>
              )}

              {devices.length > 0 && !isSendingTest && (
                <Text variant="secondary" size="sm">
                  Invia a {devices.length} {devices.length === 1 ? 'dispositivo' : 'dispositivi'} registrati
                </Text>
              )}
            </div>

            {testResult === 'no_tokens' && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <Text variant="warning" size="sm">
                  Dispositivo non registrato
                </Text>
                <Button
                  variant="ember"
                  size="sm"
                  onClick={handleReactivate}
                  disabled={isReactivating}
                >
                  {isReactivating ? 'Riattivazione...' : 'Riattiva Notifiche'}
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Dispositivi Registrati */}
      {permission === 'granted' && (
        <Card variant="glass" className="p-6 sm:p-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Heading level={2} size="lg">
                Dispositivi Registrati
              </Heading>
              {devices.length > 0 && (
                <Badge variant="ocean" size="sm">{devices.length}</Badge>
              )}
            </div>
            {devices.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeactivate}
                disabled={isDeactivating}
                className="text-ember-400 hover:text-ember-300 [html:not(.dark)_&]:text-ember-600 [html:not(.dark)_&]:hover:text-ember-700"
              >
                {isDeactivating ? 'Disattivazione...' : 'Disattiva Tutti'}
              </Button>
            )}
          </div>

          {isLoadingDevices ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </div>
          ) : devices.length === 0 ? (
            <div className="space-y-4">
              {/* Warning: No devices registered */}
              <Banner
                variant="warning"
                title="Nessun dispositivo registrato"
                description="Il permesso notifiche è attivo ma questo dispositivo non è registrato. Registra il dispositivo per ricevere notifiche."
              />

              {/* Register button */}
              <div className="flex flex-col gap-3">
                <Button
                  variant="ember"
                  size="md"
                  onClick={handleReactivate}
                  disabled={isReactivating}
                >
                  {isReactivating
                    ? 'Registrazione in corso...'
                    : 'Registra Dispositivo'}
                </Button>

                {registrationError && (
                  <Banner variant="error" description={registrationError} compact />
                )}

                {testResult === 'success' && (
                  <Banner variant="success" title="Dispositivo registrato con successo!" compact />
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Device list */}
              <div className="space-y-3">
                {devices.map((device) => (
                  <Card key={device.id} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">
                            {device.platform === 'ios' ? '📱' : '💻'}
                          </span>
                          <Text weight="medium">
                            {device.platform === 'ios'
                              ? 'iPhone/iPad'
                              : 'Dispositivo'}
                          </Text>
                          {device.isPWA && (
                            <Badge variant="sage" size="sm">PWA</Badge>
                          )}
                          {device.token === currentDeviceToken && (
                            <Badge variant="ocean" size="sm">Questo dispositivo</Badge>
                          )}
                        </div>

                        <Text size="sm" variant="secondary">
                          Registrato:{' '}
                          {new Date(device.createdAt).toLocaleString('it-IT', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>

                        {device.userAgent && (
                          <Text
                            size="xs"
                            variant="tertiary"
                            className="truncate mt-1"
                          >
                            {device.userAgent}
                          </Text>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Register current device button - always visible */}
              <div className="pt-2 border-t border-default">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <Button
                    variant={isCurrentDeviceRegistered ? 'ghost' : 'ember'}
                    size="sm"
                    onClick={handleReactivate}
                    disabled={isReactivating}
                  >
                    {isReactivating
                      ? 'Registrazione...'
                      : isCurrentDeviceRegistered
                        ? 'Aggiorna registrazione'
                        : 'Registra questo dispositivo'}
                  </Button>
                  <Text variant="tertiary" size="sm">
                    {isCurrentDeviceRegistered
                      ? 'Il dispositivo è già registrato'
                      : 'Registra questo dispositivo per ricevere notifiche'}
                  </Text>
                </div>

                {registrationError && (
                  <Banner variant="error" description={registrationError} compact className="mt-3" />
                )}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Notification History Link */}
      <Card variant="glass" className="p-4 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="text-xl flex-shrink-0">📬</div>
            <div className="min-w-0">
              <Text weight="medium">Cronologia Notifiche</Text>
              <Text variant="tertiary" size="sm">
                Visualizza tutte le notifiche inviate
              </Text>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => (window.location.href = '/settings/notifications/history')}
          >
            Apri
          </Button>
        </div>
      </Card>

      {/* Device Management Link */}
      <Card variant="glass" className="p-4 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="text-xl flex-shrink-0">📱</div>
            <div className="min-w-0">
              <Text weight="medium">Gestione Dispositivi</Text>
              <Text variant="tertiary" size="sm">
                Rinomina o rimuovi dispositivi registrati
              </Text>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => (window.location.href = '/settings/notifications/devices')}
          >
            Apri
          </Button>
        </div>
      </Card>

      {/* Info iOS */}
      <Card
        variant="glass"
        className="p-6 sm:p-8 bg-ocean-500/10 [html:not(.dark)_&]:bg-ocean-50 border-2 border-ocean-500/30 [html:not(.dark)_&]:border-ocean-200"
      >
        <div className="flex gap-4">
          <div className="text-2xl flex-shrink-0">ℹ️</div>
          <div className="flex-1">
            <Heading level={3} size="md" variant="ocean" className="mb-3">
              Note per iOS (iPhone/iPad)
            </Heading>

            <ul className="space-y-2">
              <li className="flex gap-2">
                <Text variant="ocean" size="sm" className="flex-shrink-0">
                  •
                </Text>
                <Text variant="ocean" size="sm">
                  Le notifiche funzionano solo se l&apos;app è installata come
                  PWA (Aggiungi a Home da Safari)
                </Text>
              </li>
              <li className="flex gap-2">
                <Text variant="ocean" size="sm" className="flex-shrink-0">
                  •
                </Text>
                <Text variant="ocean" size="sm">
                  Richiede iOS 16.4 o superiore
                </Text>
              </li>
              <li className="flex gap-2">
                <Text variant="ocean" size="sm" className="flex-shrink-0">
                  •
                </Text>
                <Text variant="ocean" size="sm">
                  Una volta negato il permesso, devi abilitarlo manualmente
                  dalle impostazioni iOS
                </Text>
              </li>
              <li className="flex gap-2">
                <Text variant="ocean" size="sm" className="flex-shrink-0">
                  •
                </Text>
                <Text variant="ocean" size="sm">
                  Le notifiche arrivano anche quando l&apos;app è chiusa
                </Text>
              </li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Debug Logs Link */}
      <Card variant="glass" className="p-4 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="text-xl flex-shrink-0">🔍</div>
            <div className="min-w-0">
              <Text weight="medium">Debug Logs</Text>
              <Text variant="tertiary" size="sm">
                Visualizza log diagnostici per troubleshooting
              </Text>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => (window.location.href = '/debug/logs')}
          >
            Apri
          </Button>
        </div>
      </Card>
    </SettingsLayout>
  );
}
