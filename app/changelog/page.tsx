'use client';

import { useState, useEffect } from 'react';
import { getChangelogFromFirebase } from '@/lib/changelogService';
import { VERSION_HISTORY, APP_VERSION } from '@/lib/version';
import { Card, Skeleton, Heading, Text, StatusBadge, Divider } from '@/app/components/ui';

const ITEMS_PER_PAGE = 10;

interface ChangelogVersion {
  version: string;
  date: string;
  type: 'major' | 'minor' | 'patch';
  changes: string[];
}

type Source = 'local' | 'firebase';

export default function ChangelogPage() {
  const [changelog, setChangelog] = useState<ChangelogVersion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [source, setSource] = useState<Source>('local');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Pagination calculations
  const totalPages = Math.ceil(changelog.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedChangelog = changelog.slice(startIndex, endIndex);

  const goToPage = (page: number): void => {
    setCurrentPage(page);
    // Scroll to top of timeline
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const fetchChangelog = async (): Promise<void> => {
      try {
        // Prova prima Firebase
        const firebaseChangelog = await getChangelogFromFirebase();

        if (firebaseChangelog.length > 0) {
          // Ordina per versione semantica decrescente
          const sorted = sortVersions(firebaseChangelog);
          setChangelog(sorted);
          setSource('firebase');
        } else {
          // Fallback a VERSION_HISTORY locale (già ordinato)
          setChangelog(VERSION_HISTORY);
          setSource('local');
        }
      } catch (error) {
        console.error('Errore caricamento changelog:', error);
        setChangelog(VERSION_HISTORY);
        setSource('local');
      } finally {
        setLoading(false);
      }
    };

    fetchChangelog();
  }, []);

  // Ordina versioni in modo semantico decrescente
  const sortVersions = (versions: ChangelogVersion[]): ChangelogVersion[] => {
    return [...versions].sort((a, b) => {
      const [aMajor, aMinor, aPatch] = a.version.split('.').map(Number);
      const [bMajor, bMinor, bPatch] = b.version.split('.').map(Number);

      if (bMajor !== aMajor) return bMajor - aMajor;
      if (bMinor !== aMinor) return bMinor - aMinor;
      return bPatch - aPatch;
    });
  };

  // Version type configuration with proper dark-first styling
  const versionConfig = {
    major: {
      icon: '🚀',
      label: 'Major Release',
      badgeColor: 'ember',
      accentClass: 'from-ember-500/20 to-flame-500/10 border-ember-500/30 [html:not(.dark)_&]:from-ember-100 [html:not(.dark)_&]:to-flame-100/50 [html:not(.dark)_&]:border-ember-300',
      dotClass: 'bg-gradient-to-br from-ember-400 to-flame-500 shadow-[0_0_12px_rgba(237,111,16,0.4)]',
    },
    minor: {
      icon: '✨',
      label: 'Minor Update',
      badgeColor: 'sage',
      accentClass: 'from-sage-500/20 to-sage-500/10 border-sage-500/30 [html:not(.dark)_&]:from-sage-100 [html:not(.dark)_&]:to-sage-100/50 [html:not(.dark)_&]:border-sage-300',
      dotClass: 'bg-gradient-to-br from-sage-400 to-sage-500 shadow-[0_0_12px_rgba(96,115,96,0.4)]',
    },
    patch: {
      icon: '🔧',
      label: 'Patch',
      badgeColor: 'ocean',
      accentClass: 'from-ocean-500/20 to-ocean-500/10 border-ocean-500/30 [html:not(.dark)_&]:from-ocean-100 [html:not(.dark)_&]:to-ocean-100/50 [html:not(.dark)_&]:border-ocean-300',
      dotClass: 'bg-gradient-to-br from-ocean-400 to-ocean-500 shadow-[0_0_12px_rgba(67,125,174,0.4)]',
    },
  };

  const getConfig = (type: 'major' | 'minor' | 'patch') => versionConfig[type] || versionConfig.patch;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <Skeleton.Changelog />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Header Card */}
      <Card variant="elevated" className="overflow-hidden">
        {/* Gradient accent bar */}
        <div className="h-1 bg-gradient-to-r from-ember-500 via-flame-500 to-ember-600" />

        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-ember-500/20 to-flame-500/10 border border-ember-500/30 [html:not(.dark)_&]:from-ember-100 [html:not(.dark)_&]:to-flame-100 [html:not(.dark)_&]:border-ember-200">
                  <span className="text-2xl">📋</span>
                </div>
                <div>
                  <Heading level={1} size="2xl">Changelog</Heading>
                  <Text variant="tertiary" size="sm">Storico versioni</Text>
                </div>
              </div>
              <Text variant="secondary" size="sm" className="max-w-md">
                Tutte le modifiche, nuove funzionalità e fix dell&apos;applicazione.
              </Text>
            </div>

            {/* Current Version Badge */}
            <div className="flex flex-col items-start sm:items-end gap-2">
              <Text variant="label" size="xs">Versione Corrente</Text>
              <div className="flex items-center gap-2">
                <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-ember-500 to-flame-600 text-white shadow-lg shadow-ember-500/25">
                  <Text as="span" variant="body" size="xl" weight="bold" className="!text-white">
                    v{APP_VERSION}
                  </Text>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-2 h-2 rounded-full ${source === 'firebase' ? 'bg-sage-500' : 'bg-ocean-500'}`} />
                <Text variant="tertiary" size="xs">
                  {source === 'firebase' ? 'Sincronizzato' : 'Locale'}
                </Text>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical timeline line */}
        <div className="absolute left-[23px] sm:left-[27px] top-8 bottom-8 w-px bg-gradient-to-b from-slate-600/50 via-slate-700/30 to-transparent [html:not(.dark)_&]:from-slate-300 [html:not(.dark)_&]:via-slate-200/50" />

        <div className="space-y-6">
          {paginatedChangelog.map((version, index) => {
            const config = getConfig(version.type);
            const isLatest = currentPage === 1 && index === 0;

            return (
              <div key={version.version} className="relative pl-14 sm:pl-16 animate-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
                {/* Timeline dot */}
                <div className={`absolute left-0 top-6 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center z-10 ${config.dotClass} transition-all duration-300`}>
                  <span className="text-xl sm:text-2xl">{config.icon}</span>
                </div>

                <Card variant="default" hover className="overflow-hidden transition-all duration-300">
                  {/* Header with gradient accent */}
                  <div className={`p-5 sm:p-6 bg-gradient-to-r ${config.accentClass} border-b border-slate-700/30 [html:not(.dark)_&]:border-slate-200/50`}>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <Heading level={2} size="xl">v{version.version}</Heading>

                        {/* Version type badge */}
                        <StatusBadge
                          status={config.label}
                          color={config.badgeColor}
                          size="sm"
                        />

                        {/* Latest badge */}
                        {isLatest && (
                          <span className="px-2.5 py-1 text-xs font-bold font-display rounded-full bg-gradient-to-r from-ember-500 to-flame-600 text-white shadow-lg shadow-ember-500/30 animate-pulse-ember">
                            LATEST
                          </span>
                        )}
                      </div>

                      <Text variant="tertiary" size="sm" className="flex items-center gap-2">
                        <span className="opacity-70">📅</span>
                        {new Date(version.date).toLocaleDateString('it-IT', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </Text>
                    </div>
                  </div>

                  {/* Changes List */}
                  <div className="p-5 sm:p-6">
                    <ul className="space-y-3">
                      {version.changes.map((change, changeIndex) => (
                        <li key={changeIndex} className="flex items-start gap-3 group">
                          <span className={`mt-1.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold transition-colors ${
                            version.type === 'major'
                              ? 'bg-ember-500/20 text-ember-400 group-hover:bg-ember-500/30 [html:not(.dark)_&]:bg-ember-100 [html:not(.dark)_&]:text-ember-600'
                              : version.type === 'minor'
                                ? 'bg-sage-500/20 text-sage-400 group-hover:bg-sage-500/30 [html:not(.dark)_&]:bg-sage-100 [html:not(.dark)_&]:text-sage-600'
                                : 'bg-ocean-500/20 text-ocean-400 group-hover:bg-ocean-500/30 [html:not(.dark)_&]:bg-ocean-100 [html:not(.dark)_&]:text-ocean-600'
                          }`}>
                            ✓
                          </span>
                          <Text variant="secondary" className="flex-1 leading-relaxed">{change}</Text>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 sm:gap-4">
          {/* Previous Button */}
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 ${
              currentPage === 1
                ? 'bg-slate-800/30 text-slate-500 cursor-not-allowed [html:not(.dark)_&]:bg-slate-100 [html:not(.dark)_&]:text-slate-400'
                : 'bg-slate-800/50 text-slate-200 hover:bg-slate-700/50 active:scale-95 [html:not(.dark)_&]:bg-slate-200 [html:not(.dark)_&]:text-slate-700 [html:not(.dark)_&]:hover:bg-slate-300'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Precedente</span>
          </button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1 sm:gap-2">
            {[...Array(totalPages)].map((_, i) => {
              const page = i + 1;
              const isCurrentPage = page === currentPage;

              // Show first, last, current, and adjacent pages
              const showPage = page === 1 ||
                              page === totalPages ||
                              Math.abs(page - currentPage) <= 1;

              // Show ellipsis
              const showEllipsisBefore = page === currentPage - 2 && currentPage > 3;
              const showEllipsisAfter = page === currentPage + 2 && currentPage < totalPages - 2;

              if (showEllipsisBefore || showEllipsisAfter) {
                return (
                  <span key={page} className="px-2 text-slate-500">
                    ...
                  </span>
                );
              }

              if (!showPage) return null;

              return (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`min-w-[40px] h-10 rounded-xl font-medium transition-all duration-200 ${
                    isCurrentPage
                      ? 'bg-gradient-to-r from-ember-500 to-flame-600 text-white shadow-lg shadow-ember-500/25'
                      : 'bg-slate-800/30 text-slate-400 hover:bg-slate-700/50 hover:text-slate-200 [html:not(.dark)_&]:bg-slate-100 [html:not(.dark)_&]:text-slate-600 [html:not(.dark)_&]:hover:bg-slate-200'
                  }`}
                >
                  {page}
                </button>
              );
            })}
          </div>

          {/* Next Button */}
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 ${
              currentPage === totalPages
                ? 'bg-slate-800/30 text-slate-500 cursor-not-allowed [html:not(.dark)_&]:bg-slate-100 [html:not(.dark)_&]:text-slate-400'
                : 'bg-slate-800/50 text-slate-200 hover:bg-slate-700/50 active:scale-95 [html:not(.dark)_&]:bg-slate-200 [html:not(.dark)_&]:text-slate-700 [html:not(.dark)_&]:hover:bg-slate-300'
            }`}
          >
            <span className="hidden sm:inline">Successiva</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* Page Info */}
      {totalPages > 1 && (
        <div className="text-center">
          <Text variant="tertiary" size="sm">
            Pagina {currentPage} di {totalPages} ({changelog.length} versioni totali)
          </Text>
        </div>
      )}

      {/* Footer Legend */}
      <Card variant="subtle" className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
          <div className="flex items-center gap-6">
            {Object.entries(versionConfig).map(([type, config]) => (
              <div key={type} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${config.dotClass.split(' ')[0]} ${config.dotClass.split(' ')[1]}`} />
                <Text variant="tertiary" size="xs">{config.label}</Text>
              </div>
            ))}
          </div>
        </div>
        <Divider variant="gradient" spacing="small" className="my-4" />
        <div className="text-center">
          <Text variant="tertiary" size="xs">
            Versionamento Semantico: <Text as="span" variant="tertiary" size="xs" weight="semibold">MAJOR</Text>.
            <Text as="span" variant="tertiary" size="xs" weight="semibold">MINOR</Text>.
            <Text as="span" variant="tertiary" size="xs" weight="semibold">PATCH</Text>
          </Text>
        </div>
      </Card>
    </div>
  );
}
