'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getRecentErrors, resolveError } from '@/lib/errorMonitor';
import { Card, Button, Pagination, Skeleton } from '@/app/components/ui';
import ErrorAlert from '@/app/components/ui/ErrorAlert';

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
            <h1 className="text-3xl font-bold text-slate-100 [html:not(.dark)_&]:text-slate-900 flex items-center gap-3">
              <span>🚨</span>
              Storico Allarmi
            </h1>
            <p className="text-sm text-slate-400 [html:not(.dark)_&]:text-slate-500 mt-1">
              Registro completo degli errori e allarmi della stufa
            </p>
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
                : 'bg-white/[0.08] backdrop-blur-2xl text-slate-400 [html:not(.dark)_&]:text-slate-600 hover:bg-white/[0.12] shadow-liquid-sm ring-1 ring-white/[0.15] ring-inset hover:text-slate-100 [html:not(.dark)_&]:text-slate-900'
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
            <h3 className="text-xl font-bold text-slate-100 [html:not(.dark)_&]:text-slate-900 mb-2">
              Nessun errore trovato
            </h3>
            <p className="text-slate-400 [html:not(.dark)_&]:text-slate-600">
              {filter === 'all' && 'Non ci sono errori registrati nel sistema.'}
              {filter === 'active' && 'Non ci sono errori attivi al momento.'}
              {filter === 'resolved' && 'Non ci sono errori risolti da visualizzare.'}
            </p>
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-200 [html:not(.dark)_&]:border-slate-200">
                  <div>
                    <p className="text-xs text-slate-400 [html:not(.dark)_&]:text-slate-500 mb-1">Data e Ora</p>
                    <p className="text-sm font-medium text-slate-100 [html:not(.dark)_&]:text-slate-900">
                      {formatDate(error.timestamp)}
                    </p>
                  </div>

                  {error.status && (
                    <div>
                      <p className="text-xs text-slate-400 [html:not(.dark)_&]:text-slate-500 mb-1">Stato Stufa</p>
                      <p className="text-sm font-medium text-slate-100 [html:not(.dark)_&]:text-slate-900">
                        {error.status}
                      </p>
                    </div>
                  )}

                  <div>
                    <p className="text-xs text-slate-400 [html:not(.dark)_&]:text-slate-500 mb-1">Stato</p>
                    <div className="flex items-center gap-2">
                      {error.resolved ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-sage-100 [html:not(.dark)_&]:bg-sage-100 text-sage-300 [html:not(.dark)_&]:text-sage-700 rounded text-xs font-medium">
                          ✓ Risolto
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-warning-100 [html:not(.dark)_&]:bg-warning-100 text-warning-300 [html:not(.dark)_&]:text-warning-700 rounded text-xs font-medium">
                          ⚠ Attivo
                        </span>
                      )}
                    </div>
                  </div>

                  {error.resolved && error.resolvedAt && (
                    <div>
                      <p className="text-xs text-slate-400 [html:not(.dark)_&]:text-slate-500 mb-1">Risolto Dopo</p>
                      <p className="text-sm font-medium text-slate-100 [html:not(.dark)_&]:text-slate-900">
                        {formatDuration(error.timestamp, error.resolvedAt)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {!error.resolved && (
                  <div className="pt-4 border-t border-slate-200 [html:not(.dark)_&]:border-slate-200">
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
