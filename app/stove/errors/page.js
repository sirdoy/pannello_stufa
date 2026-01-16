'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getRecentErrors, resolveError } from '@/lib/errorMonitor';
import { Card, Button, Pagination, Skeleton } from '@/app/components/ui';
import ErrorAlert from '@/app/components/ui/ErrorAlert';
import Heading from '@/app/components/ui/Heading';
import Text from '@/app/components/ui/Text';

export default function ErrorsPage() {
  const router = useRouter();
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'resolved'

  const ERRORS_PER_PAGE = 20;

  useEffect(() => {
    fetchErrors();
  }, []);

  const fetchErrors = async () => {
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

  const handleResolve = async (errorId) => {
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

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (startTime, endTime) => {
    const duration = (endTime - startTime) / 1000 / 60; // minutes
    if (duration < 60) return `${Math.round(duration)}m`;
    const hours = Math.floor(duration / 60);
    const minutes = Math.round(duration % 60);
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <Skeleton.Card>
          <Skeleton className="h-8 w-64 mb-6" />
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
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <Card liquid className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Heading level={1} size="3xl" weight="bold" className="flex items-center gap-3">
              <span>🚨</span>
              Storico Allarmi
            </Heading>
            <Text variant="tertiary" size="sm" className="mt-1">
              Registro completo degli errori e allarmi della stufa
            </Text>
          </div>
          <Button liquid
            variant="outline"
            icon="🏠"
            onClick={() => router.push('/')}
          >
            Torna alla Home
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => {
              setFilter('all');
              setCurrentPage(0);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              filter === 'all'
                ? 'bg-slate-900 text-white shadow-liquid-sm'
                : 'bg-white/[0.08] backdrop-blur-2xl text-slate-400 hover:bg-white/[0.12] hover:text-slate-100 shadow-liquid-sm ring-1 ring-white/[0.15] ring-inset [html:not(.dark)_&]:text-slate-600 [html:not(.dark)_&]:hover:text-slate-900'
            }`}
          >
            Tutti ({errors.length})
          </button>
          <button
            onClick={() => {
              setFilter('active');
              setCurrentPage(0);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              filter === 'active'
                ? 'bg-ember-600 text-white shadow-liquid-sm'
                : 'bg-ember-500/[0.08] backdrop-blur-2xl text-ember-400 [html:not(.dark)_&]:text-ember-600 hover:bg-ember-500/[0.12] shadow-liquid-sm ring-1 ring-ember-500/20 ring-inset'
            }`}
          >
            Attivi ({errors.filter(e => !e.resolved).length})
          </button>
          <button
            onClick={() => {
              setFilter('resolved');
              setCurrentPage(0);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              filter === 'resolved'
                ? 'bg-sage-600 text-white shadow-liquid-sm'
                : 'bg-sage-500/[0.08] backdrop-blur-2xl text-sage-400 [html:not(.dark)_&]:text-sage-600 hover:bg-sage-500/[0.12] shadow-liquid-sm ring-1 ring-sage-500/20 ring-inset'
            }`}
          >
            Risolti ({errors.filter(e => e.resolved).length})
          </button>
        </div>
      </Card>

      {/* Errors List */}
      <div className="space-y-4">
        {paginatedErrors.length === 0 ? (
          <Card liquid className="p-12 text-center">
            <span className="text-6xl mb-4 block">✅</span>
            <Heading level={3} size="xl" weight="bold" className="mb-2">
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
            <Card liquid key={error.id} className="p-6">
              <div className="space-y-4">
                {/* Error Alert */}
                <ErrorAlert
                  errorCode={error.errorCode}
                  errorDescription={error.errorDescription}
                />

                {/* Metadata */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-700 [html:not(.dark)_&]:border-slate-200">
                  <div>
                    <Text variant="tertiary" size="xs" className="mb-1">Data e Ora</Text>
                    <Text size="sm" weight="medium">
                      {formatDate(error.timestamp)}
                    </Text>
                  </div>

                  {error.status && (
                    <div>
                      <Text variant="tertiary" size="xs" className="mb-1">Stato Stufa</Text>
                      <Text size="sm" weight="medium">
                        {error.status}
                      </Text>
                    </div>
                  )}

                  <div>
                    <Text variant="tertiary" size="xs" className="mb-1">Stato</Text>
                    <div className="flex items-center gap-2">
                      {error.resolved ? (
                        <Text as="span" variant="sage" size="xs" weight="medium" className="inline-flex items-center gap-1 px-2 py-1 bg-sage-100 [html:not(.dark)_&]:bg-sage-100 rounded">
                          ✓ Risolto
                        </Text>
                      ) : (
                        <Text as="span" variant="warning" size="xs" weight="medium" className="inline-flex items-center gap-1 px-2 py-1 bg-warning-100 [html:not(.dark)_&]:bg-warning-100 rounded">
                          ⚠ Attivo
                        </Text>
                      )}
                    </div>
                  </div>

                  {error.resolved && error.resolvedAt && (
                    <div>
                      <Text variant="tertiary" size="xs" className="mb-1">Risolto Dopo</Text>
                      <Text size="sm" weight="medium">
                        {formatDuration(error.timestamp, error.resolvedAt)}
                      </Text>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {!error.resolved && (
                  <div className="pt-4 border-t border-slate-700 [html:not(.dark)_&]:border-slate-200">
                    <Button liquid
                      variant="success"
                      size="sm"
                      icon="✓"
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
        <Card liquid className="p-4">
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
