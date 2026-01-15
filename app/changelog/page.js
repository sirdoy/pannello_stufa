'use client';

import { useState, useEffect } from 'react';
import { getChangelogFromFirebase } from '@/lib/changelogService';
import { VERSION_HISTORY, APP_VERSION } from '@/lib/version';
import { Card, Skeleton, Heading, Text } from '@/app/components/ui';

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
      case 'major': return 'bg-ember-50 [html:not(.dark)_&]:bg-ember-50 border-ember-200 [html:not(.dark)_&]:border-ember-200 text-ember-300 [html:not(.dark)_&]:text-ember-700';
      case 'minor': return 'bg-sage-50 [html:not(.dark)_&]:bg-sage-50 border-sage-200 [html:not(.dark)_&]:border-sage-200 text-sage-300 [html:not(.dark)_&]:text-sage-700';
      case 'patch': return 'bg-ocean-50 [html:not(.dark)_&]:bg-ocean-50 border-ocean-200 [html:not(.dark)_&]:border-ocean-200 text-ocean-300 [html:not(.dark)_&]:text-ocean-700';
      default: return 'bg-slate-50 [html:not(.dark)_&]:bg-slate-50 border-slate-200 [html:not(.dark)_&]:border-slate-200 text-slate-300 [html:not(.dark)_&]:text-slate-700';
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
      <Card variant="elevated" className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <Heading level={1} size="3xl" className="mb-2">📋 Changelog</Heading>
            <Text variant="secondary">Storico di tutte le versioni e modifiche dell&apos;applicazione</Text>
          </div>
          <div className="text-left sm:text-right">
            <Text variant="tertiary" size="sm" className="mb-1">Versione Corrente</Text>
            <Text variant="ember" size="3xl" weight="bold">{APP_VERSION}</Text>
          </div>
        </div>

        {/* Source indicator */}
        <div className="mt-4 pt-4 border-t border-slate-700/50 [html:not(.dark)_&]:border-slate-200">
          <Text variant="tertiary" size="xs">
            Fonte: <Text as="span" variant="tertiary" size="xs" weight="semibold">{source === 'firebase' ? 'Firebase Realtime' : 'Locale'}</Text>
          </Text>
        </div>
      </Card>

      {/* Timeline */}
      <div className="space-y-6">
        {changelog.map((version, index) => (
          <Card key={version.version} variant="default" className="overflow-hidden">
            {/* Version Header */}
            <div className={`p-6 border-b-2 ${getVersionColor(version.type)}`}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{getVersionIcon(version.type)}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <Heading level={2} size="2xl">v{version.version}</Heading>
                      {index === 0 && (
                        <span className="px-2 py-1 text-xs font-bold font-display rounded-full bg-gradient-to-r from-ember-500 to-flame-600 text-white shadow-ember-glow-sm">
                          LATEST
                        </span>
                      )}
                    </div>
                    <Text variant="secondary" size="sm" weight="medium" className="mt-1">{getVersionTypeLabel(version.type)}</Text>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <Text variant="tertiary" size="sm" weight="medium">
                    📅 {new Date(version.date).toLocaleDateString('it-IT', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </Text>
                </div>
              </div>
            </div>

            {/* Changes List */}
            <div className="p-6">
              <ul className="space-y-3">
                {version.changes.map((change, changeIndex) => (
                  <li key={changeIndex} className="flex items-start gap-3">
                    <Text variant="sage" className="mt-1">✓</Text>
                    <Text variant="secondary" className="flex-1">{change}</Text>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        ))}
      </div>

      {/* Footer Info */}
      <Card variant="subtle" className="p-6 sm:p-8">
        <div className="text-center space-y-2">
          <Text variant="secondary" size="sm">
            💡 <Text as="span" variant="secondary" size="sm" weight="bold">Versionamento Semantico</Text>: MAJOR.MINOR.PATCH
          </Text>
          <Text variant="tertiary" size="xs">
            MAJOR = Breaking changes • MINOR = Nuove funzionalità • PATCH = Bug fix
          </Text>
        </div>
      </Card>
    </div>
  );
}
