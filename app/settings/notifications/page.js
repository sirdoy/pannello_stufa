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
          <h2 className="text-2xl font-bold text-slate-100 [html:not(.dark)_&]:text-slate-900 mb-2">
            Autenticazione Richiesta
          </h2>
          <p className="text-slate-400 [html:not(.dark)_&]:text-slate-600 mb-6">
            Devi effettuare il login per gestire le notifiche
          </p>
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
        <h2 className="text-xl font-semibold text-slate-100 [html:not(.dark)_&]:text-slate-900 mb-4">
          Stato Notifiche
        </h2>

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
          <h2 className="text-xl font-semibold text-slate-100 [html:not(.dark)_&]:text-slate-900 mb-4">
            ⚙️ Gestione Notifiche
          </h2>
          <p className="text-sm text-slate-400 [html:not(.dark)_&]:text-slate-600 mb-4">
            Personalizza quali notifiche ricevere. Le preferenze sono salvate automaticamente.
          </p>
          <NotificationPreferencesPanel />
        </div>
      )}

      {/* Test Notifica */}
      {permission === 'granted' && isSupported && (
        <Card liquid className="p-6">
          <h2 className="text-xl font-semibold text-slate-100 [html:not(.dark)_&]:text-slate-900 mb-4">
            Test Notifica
          </h2>

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

            <p className="text-sm text-slate-400 [html:not(.dark)_&]:text-slate-600">
              Invia una notifica di test per verificare che tutto funzioni correttamente
            </p>
          </div>
        </Card>
      )}

      {/* Dispositivi Registrati */}
      {permission === 'granted' && (
        <Card liquid className="p-6">
          <h2 className="text-xl font-semibold text-slate-100 [html:not(.dark)_&]:text-slate-900 mb-4">
            Dispositivi Registrati
          </h2>

          {isLoadingDevices ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : devices.length === 0 ? (
            <p className="text-slate-400 [html:not(.dark)_&]:text-slate-600">
              Nessun dispositivo registrato
            </p>
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
                        <span className="font-medium text-slate-100 [html:not(.dark)_&]:text-slate-900">
                          {device.platform === 'ios' ? 'iPhone/iPad' : 'Dispositivo'}
                        </span>
                        {device.isPWA && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-sage-100 [html:not(.dark)_&]:bg-sage-100 bg-sage-900/30 text-sage-300 [html:not(.dark)_&]:text-sage-700 rounded-full">
                            PWA
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-slate-400 [html:not(.dark)_&]:text-slate-600 mb-1">
                        Registrato: {new Date(device.createdAt).toLocaleString('it-IT')}
                      </p>

                      {device.userAgent && (
                        <p className="text-xs text-slate-500 [html:not(.dark)_&]:text-slate-500 truncate max-w-md">
                          {device.userAgent}
                        </p>
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
        <h3 className="text-lg font-semibold text-ocean-300 [html:not(.dark)_&]:text-ocean-900 mb-3 flex items-center gap-2">
          <span>ℹ️</span>
          <span>Note per iOS (iPhone/iPad)</span>
        </h3>

        <ul className="space-y-2 text-sm text-ocean-400 [html:not(.dark)_&]:text-ocean-700">
          <li className="flex gap-2">
            <span>•</span>
            <span>
              Le notifiche funzionano solo se l&apos;app è installata come PWA
              (Aggiungi a Home da Safari)
            </span>
          </li>
          <li className="flex gap-2">
            <span>•</span>
            <span>
              Richiede iOS 16.4 o superiore
            </span>
          </li>
          <li className="flex gap-2">
            <span>•</span>
            <span>
              Una volta negato il permesso, devi abilitarlo manualmente
              dalle impostazioni iOS
            </span>
          </li>
          <li className="flex gap-2">
            <span>•</span>
            <span>
              Le notifiche arrivano anche quando l&apos;app è chiusa
            </span>
          </li>
        </ul>
      </Card>
    </SettingsLayout>
  );
}
