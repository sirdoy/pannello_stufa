'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Check, CircleCheck } from 'lucide-react';
import { getRecentErrors, resolveError, type ErrorEntry } from '@/lib/errorMonitor';
import { Card, Button, Pagination, Skeleton, Badge } from '@/app/components/ui';
import ErrorAlert from '@/app/components/ui/ErrorAlert';
import Heading from '@/app/components/ui/Heading';
import Text from '@/app/components/ui/Text';
import { PageHeader } from '@/app/components/EmberGlass/PageHeader';

export default function ErrorsPage() {
  const [errors, setErrors] = useState<ErrorEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all');

  const ERRORS_PER_PAGE = 20;

  useEffect(() => {
    fetchErrors();
  }, []);

  const fetchErrors = async (): Promise<void> => {
    setLoading(true);
    try {
      const allErrors = await getRecentErrors(100);
      setErrors(allErrors);
    } catch (error) {
      console.error('Failed to fetch errors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (errorId: string): Promise<void> => {
    const success = await resolveError(errorId);
    if (success) {
      await fetchErrors();
    }
  };

  const filteredErrors = errors.filter(error => {
    if (filter === 'active') return !error.resolved;
    if (filter === 'resolved') return error.resolved;
    return true;
  });

  const totalPages = Math.ceil(filteredErrors.length / ERRORS_PER_PAGE);
  const paginatedErrors = filteredErrors.slice(
    currentPage * ERRORS_PER_PAGE,
    (currentPage + 1) * ERRORS_PER_PAGE
  );

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (startTime: number, endTime: number): string => {
    const duration = (endTime - startTime) / 1000 / 60; // minutes
    if (duration < 60) return `${Math.round(duration)}m`;
    const hours = Math.floor(duration / 60);
    const minutes = Math.round(duration % 60);
    return `${hours}h ${minutes}m`;
  };

  const pageHeader = (
    <PageHeader
      title="Storico allarmi"
      description="Registro completo degli errori e allarmi della stufa"
      backHref="/stove"
    />
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        {pageHeader}
        <Skeleton.Card>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="mb-4">
              <Skeleton className="h-24 w-full" />
            </div>
          ))}
        </Skeleton.Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {pageHeader}

      <Card variant="glass" className="p-6">
        {/* Filter Tabs */}
        <Button.Group>
          <Button
            variant={filter === 'all' ? 'subtle' : 'ghost'}
            size="sm"
            onClick={() => { setFilter('all'); setCurrentPage(0); }}
          >
            Tutti ({errors.length})
          </Button>
          <Button
            variant={filter === 'active' ? 'ember' : 'ghost'}
            size="sm"
            onClick={() => { setFilter('active'); setCurrentPage(0); }}
          >
            Attivi ({errors.filter(e => !e.resolved).length})
          </Button>
          <Button
            variant={filter === 'resolved' ? 'success' : 'ghost'}
            colorScheme={filter !== 'resolved' ? 'sage' : undefined}
            size="sm"
            onClick={() => { setFilter('resolved'); setCurrentPage(0); }}
          >
            Risolti ({errors.filter(e => e.resolved).length})
          </Button>
        </Button.Group>
      </Card>

      {/* Errors List */}
      <div className="space-y-4">
        {paginatedErrors.length === 0 ? (
          <Card variant="glass" className="p-12 text-center">
            <CircleCheck size={40} className="mx-auto mb-4 text-sage-400" aria-hidden="true" />
            <Heading level={2} size="xl" className="mb-2">
              Nessun errore trovato
            </Heading>
            <Text variant="tertiary">
              {filter === 'all' && 'Non ci sono errori registrati nel sistema.'}
              {filter === 'active' && 'Non ci sono errori attivi al momento.'}
              {filter === 'resolved' && 'Non ci sono errori risolti da visualizzare.'}
            </Text>
          </Card>
        ) : (
          paginatedErrors.map((error) => (
            <Card variant="glass" key={error.id} className="p-6">
              <div className="space-y-4">
                {/* Error Alert */}
                <ErrorAlert
                  errorCode={error.errorCode}
                  errorDescription={error.errorDescription}
                />

                {/* Metadata */}
                <div className="grid grid-cols-1 gap-4 border-t border-white/8 pt-4 md:grid-cols-3">
                  <div>
                    <Text variant="tertiary" size="xs" className="mb-1">Data e Ora</Text>
                    <Text size="sm">
                      {formatDate(error.timestamp)}
                    </Text>
                  </div>

                  {error.status && (
                    <div>
                      <Text variant="tertiary" size="xs" className="mb-1">Stato Stufa</Text>
                      <Text size="sm">
                        {error.status}
                      </Text>
                    </div>
                  )}

                  <div>
                    <Text variant="tertiary" size="xs" className="mb-1">Stato</Text>
                    <div className="flex items-center gap-2">
                      {error.resolved ? (
                        <Badge variant="sage" size="sm" icon={<Check size={12} />}>Risolto</Badge>
                      ) : (
                        <Badge variant="warning" size="sm" icon={<AlertTriangle size={12} />}>Attivo</Badge>
                      )}
                    </div>
                  </div>

                  {error.resolved && error.resolvedAt && (
                    <div>
                      <Text variant="tertiary" size="xs" className="mb-1">Risolto Dopo</Text>
                      <Text size="sm">
                        {formatDuration(error.timestamp, error.resolvedAt)}
                      </Text>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {!error.resolved && (
                  <div className="border-t border-white/8 pt-4">
                    <Button
                      variant="success"
                      size="sm"
                      icon={<Check size={16} />}
                      onClick={() => handleResolve(error.id)}
                    >
                      Segna come Risolto
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card variant="glass" className="p-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPrevious={() => setCurrentPage(p => Math.max(0, p - 1))}
            onNext={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
            hasPrev={currentPage > 0}
            hasNext={currentPage < totalPages - 1}
          />
        </Card>
      )}
    </div>
  );
}
