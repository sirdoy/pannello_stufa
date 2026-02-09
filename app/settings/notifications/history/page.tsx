'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import SettingsLayout from '@/app/components/SettingsLayout';
import { Card, Button, Heading, Text, Skeleton, EmptyState, Badge, DataTable } from '@/app/components/ui';

interface NotificationHistoryItem {
  id: string;
  timestamp: number;
  type: 'error' | 'scheduler' | 'maintenance' | 'test' | 'generic';
  status: 'sent' | 'delivered' | 'failed';
  title: string;
  body: string;
  deviceId?: string;
  [key: string]: any;
}

// Type for DataTable row
type NotificationHistoryRow = NotificationHistoryItem;

/**
 * Get Italian label for notification type
 */
const getTypeLabel = (type: string) => {
  const labels = {
    error: 'Errore',
    scheduler: 'Scheduler',
    maintenance: 'Manutenzione',
    test: 'Test',
    generic: 'Sistema',
  } as const;
  return labels[type as keyof typeof labels] || type;
};

export default function NotificationHistoryPage() {
  const { user, isLoading: userLoading } = useUser();
  const [notifications, setNotifications] = useState<NotificationHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all notifications (client-side pagination)
  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('/api/notifications/history?limit=100');

        if (!res.ok) {
          throw new Error('Errore nel caricamento delle notifiche');
        }

        const data = await res.json();
        setNotifications(data.notifications || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching notifications:', err);
        setError(err instanceof Error ? err.message : 'Errore sconosciuto');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, [user]);

  // Column definitions
  const columns = useMemo(
    () => [
      {
        accessorKey: 'timestamp',
        header: 'Data',
        cell: ({ getValue }: { getValue: () => number }) => {
          const date = new Date(getValue());
          return format(date, 'dd/MM/yyyy HH:mm', { locale: it });
        },
        sortingFn: 'datetime',
      },
      {
        accessorKey: 'type',
        header: 'Tipo',
        cell: ({ getValue }: { getValue: () => string }) => {
          const type = getValue();
          const variants = {
            scheduler: 'ocean',
            error: 'danger',
            maintenance: 'warning',
            test: 'neutral',
            generic: 'neutral',
          } as const;
          return (
            <Badge variant={variants[type as keyof typeof variants] || 'neutral'}>
              {getTypeLabel(type)}
            </Badge>
          );
        },
        filterFn: 'equals',
      },
      {
        accessorKey: 'status',
        header: 'Stato',
        cell: ({ getValue }: { getValue: () => string }) => {
          const status = getValue();
          const variants = {
            sent: 'ocean',
            delivered: 'sage',
            failed: 'danger',
          } as const;
          const labels = {
            sent: 'Inviata',
            delivered: 'Consegnata',
            failed: 'Fallita',
          } as const;
          return (
            <Badge variant={variants[status as keyof typeof variants] || 'neutral'}>
              {labels[status as keyof typeof labels] || status}
            </Badge>
          );
        },
        filterFn: 'equals',
      },
      {
        accessorKey: 'title',
        header: 'Titolo',
        cell: ({ getValue }: { getValue: () => string }) => (
          <Text className="max-w-[200px] truncate">{getValue()}</Text>
        ),
      },
    ],
    []
  );

  // Loading state
  if (userLoading) {
    return (
      <SettingsLayout title="Cronologia Notifiche" icon="📬">
        <div className="space-y-6">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </SettingsLayout>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <SettingsLayout title="Cronologia Notifiche" icon="📬">
        <Card variant="glass" className="p-8 text-center">
          <div className="text-6xl mb-4">🔐</div>
          <Heading level={2} size="xl" className="mb-2">
            Autenticazione Richiesta
          </Heading>
          <Text variant="secondary" className="mb-6">
            Devi effettuare il login per visualizzare la cronologia
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

  return (
    <SettingsLayout title="Cronologia Notifiche" icon="📬">
      {/* Description */}
      <div className="space-y-2 mb-6">
        <Text variant="secondary" size="sm">
          Visualizza le notifiche inviate negli ultimi 90 giorni.
          Le notifiche più vecchie vengono automaticamente eliminate per conformità GDPR.
        </Text>
      </div>

      {/* Error state */}
      {error && (
        <Card variant="glass" className="p-8 text-center mb-6">
          <Text variant="ember" size="lg" className="mb-2">
            {error}
          </Text>
          <Button variant="subtle" onClick={() => window.location.reload()}>
            Riprova
          </Button>
        </Card>
      )}

      {/* Loading state */}
      {isLoading && (
        <Card variant="glass" className="p-8">
          <Skeleton className="h-96 w-full rounded-xl" />
        </Card>
      )}

      {/* Empty state */}
      {!isLoading && !error && notifications.length === 0 && (
        <Card variant="glass" className="p-8">
          <EmptyState
            icon="🔔"
            title="Nessuna notifica trovata"
            description="Le notifiche inviate appariranno qui"
          />
        </Card>
      )}

      {/* Data table */}
      {!isLoading && !error && notifications.length > 0 && (
        <Card variant="glass" className="overflow-hidden">
          <DataTable
            data={notifications}
            columns={columns}
            density="compact"
            enableFiltering
            enablePagination
            enableExpansion
            pageSize={25}
            pageSizeOptions={[25, 50, 100]}
            showRowCount
            getRowId={(row: NotificationHistoryRow) => row.id}
            renderExpandedContent={(row: { original: NotificationHistoryRow }) => (
              <div className="space-y-2 p-4">
                <Text variant="secondary" size="sm">
                  <strong>Messaggio:</strong> {row.original.body}
                </Text>
                {row.original.deviceId && (
                  <Text variant="secondary" size="sm">
                    <strong>Dispositivo:</strong> {row.original.deviceId}
                  </Text>
                )}
              </div>
            )}
          />
        </Card>
      )}

      {/* Back link */}
      <Card variant="glass" className="p-4 mt-6">
        <div className="flex items-center justify-between">
          <Text variant="secondary" size="sm">
            Torna alle impostazioni notifiche
          </Text>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => (window.location.href = '/settings/notifications')}
          >
            ← Indietro
          </Button>
        </div>
      </Card>
    </SettingsLayout>
  );
}
