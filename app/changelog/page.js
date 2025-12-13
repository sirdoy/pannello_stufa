'use client';

import { useState, useEffect } from 'react';
import { getChangelogFromFirebase } from '@/lib/changelogService';
import { VERSION_HISTORY, APP_VERSION } from '@/lib/version';
import { Card, Skeleton } from '@/app/components/ui';

export default function ChangelogPage() {
  const [changelog, setChangelog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState('local'); // 'local' | 'firebase'

  useEffect(() => {
    const fetchChangelog = async () => {
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
  const sortVersions = (versions) => {
    return [...versions].sort((a, b) => {
      const [aMajor, aMinor, aPatch] = a.version.split('.').map(Number);
      const [bMajor, bMinor, bPatch] = b.version.split('.').map(Number);

      if (bMajor !== aMajor) return bMajor - aMajor;
      if (bMinor !== aMinor) return bMinor - aMinor;
      return bPatch - aPatch;
    });
  };

  const getVersionIcon = (type) => {
    switch (type) {
      case 'major': return '🚀';
      case 'minor': return '✨';
      case 'patch': return '🔧';
      default: return '📦';
    }
  };

  const getVersionColor = (type) => {
    switch (type) {
      case 'major': return 'bg-primary-50 border-primary-200 text-primary-700';
      case 'minor': return 'bg-success-50 border-success-200 text-success-700';
      case 'patch': return 'bg-info-50 border-info-200 text-info-700';
      default: return 'bg-neutral-50 border-neutral-200 text-neutral-700';
    }
  };

  const getVersionTypeLabel = (type) => {
    switch (type) {
      case 'major': return 'Major Release';
      case 'minor': return 'Minor Update';
      case 'patch': return 'Patch';
      default: return 'Release';
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <Skeleton.LogPage />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <Card liquid className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-2">📋 Changelog</h1>
            <p className="text-neutral-600 dark:text-neutral-400">Storico di tutte le versioni e modifiche dell&apos;applicazione</p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">Versione Corrente</p>
            <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">{APP_VERSION}</p>
          </div>
        </div>

        {/* Source indicator */}
        <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Fonte: <span className="font-semibold">{source === 'firebase' ? 'Firebase Realtime' : 'Locale'}</span>
          </p>
        </div>
      </Card>

      {/* Timeline */}
      <div className="space-y-6">
        {changelog.map((version, index) => (
          <Card key={version.version} liquid className="overflow-hidden">
            {/* Version Header */}
            <div className={`p-6 border-b-2 ${getVersionColor(version.type)}`}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{getVersionIcon(version.type)}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-bold">v{version.version}</h2>
                      {index === 0 && (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-primary-500 text-white">
                          LATEST
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium mt-1">{getVersionTypeLabel(version.type)}</p>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-sm font-medium text-neutral-600">
                    📅 {new Date(version.date).toLocaleDateString('it-IT', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Changes List */}
            <div className="p-6">
              <ul className="space-y-3">
                {version.changes.map((change, changeIndex) => (
                  <li key={changeIndex} className="flex items-start gap-3">
                    <span className="text-success-500 dark:text-success-400 mt-1">✓</span>
                    <p className="text-neutral-700 dark:text-neutral-300 flex-1">{change}</p>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        ))}
      </div>

      {/* Footer Info */}
      <Card liquid className="p-6 sm:p-8 bg-neutral-50/50 dark:bg-neutral-900/20">
        <div className="text-center space-y-2">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            💡 <strong>Versionamento Semantico</strong>: MAJOR.MINOR.PATCH
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            MAJOR = Breaking changes • MINOR = Nuove funzionalità • PATCH = Bug fix
          </p>
        </div>
      </Card>
    </div>
  );
}
