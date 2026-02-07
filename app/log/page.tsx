'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { onValue, ref } from 'firebase/database';
import Card from '@/app/components/ui/Card';
import Skeleton from '@/app/components/ui/Skeleton';
import Heading from '@/app/components/ui/Heading';
import Text from '@/app/components/ui/Text';
import Button from '@/app/components/ui/Button';
import EmptyState from '@/app/components/ui/EmptyState';
import LogEntry from '@/app/components/log/LogEntry';
import Pagination from '@/app/components/ui/Pagination';
import { DEVICE_CONFIG } from '@/lib/devices/deviceTypes';

const PAGE_SIZE = 50;

interface LogEntryData {
  id: string;
  action: string;
  device?: string;
  timestamp: number;
  [key: string]: any;
}

type DeviceFilter = 'all' | 'stove' | 'thermostat' | 'lights' | 'sonos';

export default function LogPage() {
  const [log, setLog] = useState<LogEntryData[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [deviceFilter, setDeviceFilter] = useState<DeviceFilter>('all');

  useEffect(() => {
    const logRef = ref(db, 'log');

    const unsubscribe = onValue(logRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setLog([]);
        setLoading(false);
        return;
      }

      const entries = Object.entries(data)
        .map(([id, entry]) => ({ id, ...entry }))
        .sort((a, b) => b.timestamp - a.timestamp);

      setLog(entries);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const formatDate = (ts: number): string => {
    const d = new Date(ts);
    return d.toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getIcon = (action: string, device?: string): string => {
    const actionLower = action.toLowerCase();

    // Device-specific icons first
    if (device === 'stove') {
      if (actionLower.includes('accensione')) return '🔥';
      if (actionLower.includes('spegnimento')) return '❄️';
      if (actionLower.includes('ventola') || actionLower.includes('ventilazione')) return '💨';
      if (actionLower.includes('potenza')) return '⚡';
      if (actionLower.includes('pulizia')) return '🧹';
      if (actionLower.includes('scheduler') || actionLower.includes('modalità')) return '⏰';
      return '🔥'; // Default stove icon
    }

    if (device === 'thermostat') {
      if (actionLower.includes('temperatura')) return '🌡️';
      if (actionLower.includes('modalità') || actionLower.includes('mode')) return '⚙️';
      if (actionLower.includes('calibra')) return '🔧';
      if (actionLower.includes('sincronizzazione')) return '🔄';
      if (actionLower.includes('connessione')) return '🔗';
      if (actionLower.includes('disconnessione')) return '🔌';
      return '🌡️'; // Default thermostat icon
    }

    if (device === 'lights') {
      if (actionLower.includes('accesa') || actionLower.includes('on')) return '💡';
      if (actionLower.includes('spenta') || actionLower.includes('off')) return '🌑';
      if (actionLower.includes('luminosità') || actionLower.includes('brightness')) return '☀️';
      if (actionLower.includes('scena')) return '🎭';
      if (actionLower.includes('stanza')) return '🏠';
      if (actionLower.includes('connessione')) return '🔗';
      if (actionLower.includes('disconnessione')) return '🔌';
      return '💡'; // Default lights icon
    }

    if (device === 'sonos') return '🎵';

    // Legacy fallback (for old logs without device field)
    if (actionLower.includes('accensione')) return '🔥';
    if (actionLower.includes('spegnimento')) return '❄️';
    if (actionLower.includes('ventola')) return '💨';
    if (actionLower.includes('potenza')) return '⚡';
    if (actionLower.includes('scheduler') || actionLower.includes('modalità')) return '⏰';
    if (actionLower.includes('netatmo') || actionLower.includes('temperatura')) return '🌡️';
    if (actionLower.includes('intervallo')) return '📅';
    return '📄';
  };

  const getDeviceBadge = (device?: string): { label: string; icon?: string; color: string } => {
    const config = DEVICE_CONFIG[device];
    if (!config) return { label: 'Sistema', color: 'neutral' };

    const colorMap = {
      primary: 'primary',
      info: 'info',
      warning: 'warning',
      success: 'success',
    };

    return {
      label: config.name,
      icon: config.icon,
      color: colorMap[config.color] || 'neutral',
    };
  };

  // Filter logs by device
  const filteredLog = deviceFilter === 'all'
    ? log
    : log.filter(entry => entry.device === deviceFilter);

  // Count by device
  const deviceCounts = {
    all: log.length,
    stove: log.filter(e => e.device === 'stove').length,
    thermostat: log.filter(e => e.device === 'thermostat').length,
    lights: log.filter(e => e.device === 'lights').length,
    sonos: log.filter(e => e.device === 'sonos').length,
  };

  const startIndex = currentPage * PAGE_SIZE;
  const currentPageData = filteredLog.slice(startIndex, startIndex + PAGE_SIZE);

  const hasNext = startIndex + PAGE_SIZE < filteredLog.length;
  const hasPrev = currentPage > 0;

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(0);
  }, [deviceFilter]);

  if (loading) {
    return <Skeleton.LogPage />;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <Heading level={1} size="3xl" className="mb-2">📋 Storico Azioni</Heading>
        <Text variant="secondary">Tutte le azioni registrate nel sistema</Text>
      </div>

      {/* Filters Card */}
      <Card variant="default" className="p-4 sm:p-6">
        <Text variant="label" className="mb-3">Filtra per dispositivo</Text>
        <div className="flex flex-wrap gap-2">
          {/* All */}
          <Button
            variant={deviceFilter === 'all' ? 'subtle' : 'ghost'}
            size="sm"
            icon="🏠"
            onClick={() => setDeviceFilter('all')}
            className={deviceFilter === 'all' ? 'ring-1 ring-slate-500/30' : ''}
          >
            Tutti ({deviceCounts.all})
          </Button>

          {/* Stove */}
          {deviceCounts.stove > 0 && (
            <Button
              variant={deviceFilter === 'stove' ? 'ember' : 'ghost'}
              size="sm"
              icon="🔥"
              onClick={() => setDeviceFilter('stove')}
              className={deviceFilter !== 'stove' ? 'text-ember-400 [html:not(.dark)_&]:text-ember-600 hover:bg-ember-500/10' : ''}
            >
              Stufa ({deviceCounts.stove})
            </Button>
          )}

          {/* Thermostat */}
          {deviceCounts.thermostat > 0 && (
            <Button
              variant={deviceFilter === 'thermostat' ? 'ocean' : 'ghost'}
              size="sm"
              icon="🌡️"
              onClick={() => setDeviceFilter('thermostat')}
              className={deviceFilter !== 'thermostat' ? 'text-ocean-400 [html:not(.dark)_&]:text-ocean-600 hover:bg-ocean-500/10' : ''}
            >
              Termostato ({deviceCounts.thermostat})
            </Button>
          )}

          {/* Lights */}
          {deviceCounts.lights > 0 && (
            <Button
              variant={deviceFilter === 'lights' ? 'subtle' : 'ghost'}
              size="sm"
              icon="💡"
              onClick={() => setDeviceFilter('lights')}
              className={deviceFilter === 'lights'
                ? 'bg-warning-500/20 text-warning-300 [html:not(.dark)_&]:bg-warning-500/15 [html:not(.dark)_&]:text-warning-700'
                : 'text-warning-400 [html:not(.dark)_&]:text-warning-700 hover:bg-warning-500/10'}
            >
              Luci ({deviceCounts.lights})
            </Button>
          )}

          {/* Sonos */}
          {deviceCounts.sonos > 0 && (
            <Button
              variant={deviceFilter === 'sonos' ? 'success' : 'ghost'}
              size="sm"
              icon="🎵"
              onClick={() => setDeviceFilter('sonos')}
              className={deviceFilter !== 'sonos' ? 'text-sage-400 [html:not(.dark)_&]:text-sage-600 hover:bg-sage-500/10' : ''}
            >
              Sonos ({deviceCounts.sonos})
            </Button>
          )}
        </div>
      </Card>

      {/* Log Entries */}
      <Card variant="default" className="p-4 sm:p-6">
        {filteredLog.length === 0 ? (
          <EmptyState
            icon="📋"
            title="Nessuna azione registrata"
            description={deviceFilter !== 'all'
              ? 'Non ci sono log per questo dispositivo'
              : 'Le azioni verranno visualizzate qui'}
            action={deviceFilter !== 'all' && (
              <Button
                variant="subtle"
                size="sm"
                onClick={() => setDeviceFilter('all')}
              >
                Mostra tutti i log
              </Button>
            )}
          />
        ) : (
          <>
            <ul className="space-y-3">
              {currentPageData.map((entry) => (
                <LogEntry
                  key={entry.id}
                  entry={entry}
                  formatDate={formatDate}
                  getIcon={getIcon}
                  getDeviceBadge={getDeviceBadge}
                />
              ))}
            </ul>

            {Math.ceil(filteredLog.length / PAGE_SIZE) > 1 && (
              <div className="mt-6">
                <Pagination
                  currentPage={currentPage}
                  totalPages={Math.ceil(filteredLog.length / PAGE_SIZE)}
                  onPrevious={() => setCurrentPage((p) => Math.max(0, p - 1))}
                  onNext={() => setCurrentPage((p) => p + 1)}
                  hasPrev={hasPrev}
                  hasNext={hasNext}
                />
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
