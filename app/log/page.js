'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { onValue, ref } from 'firebase/database';
import Card from '@/app/components/ui/Card';
import Skeleton from '@/app/components/ui/Skeleton';
import Heading from '@/app/components/ui/Heading';
import Text from '@/app/components/ui/Text';
import LogEntry from '@/app/components/log/LogEntry';
import Pagination from '@/app/components/ui/Pagination';
import { DEVICE_CONFIG } from '@/lib/devices/deviceTypes';

const PAGE_SIZE = 50;

export default function LogPage() {
  const [log, setLog] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deviceFilter, setDeviceFilter] = useState('all'); // 'all', 'stove', 'thermostat', etc.

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

  const formatDate = (ts) => {
    const d = new Date(ts);
    return d.toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getIcon = (action, device) => {
    // Device-specific icons first
    if (device === 'stove') {
      if (action.toLowerCase().includes('accensione')) return '🔥';
      if (action.toLowerCase().includes('spegnimento')) return '❄️';
      if (action.toLowerCase().includes('ventola')) return '💨';
      if (action.toLowerCase().includes('potenza')) return '⚡';
      if (action.toLowerCase().includes('scheduler') || action.toLowerCase().includes('modalità')) return '⏰';
      return '🔥'; // Default stove icon
    }
    if (device === 'thermostat') {
      if (action.toLowerCase().includes('temperatura')) return '🌡️';
      if (action.toLowerCase().includes('modalità')) return '⚙️';
      return '🌡️'; // Default thermostat icon
    }
    if (device === 'lights') return '💡';
    if (device === 'sonos') return '🎵';

    // Legacy fallback (for old logs without device field)
    if (action.toLowerCase().includes('accensione')) return '🔥';
    if (action.toLowerCase().includes('spegnimento')) return '❄️';
    if (action.toLowerCase().includes('ventola')) return '💨';
    if (action.toLowerCase().includes('potenza')) return '⚡';
    if (action.toLowerCase().includes('scheduler') || action.toLowerCase().includes('modalità')) return '⏰';
    if (action.toLowerCase().includes('netatmo') || action.toLowerCase().includes('temperatura')) return '🌡️';
    if (action.toLowerCase().includes('intervallo')) return '📅';
    return '📄';
  };

  const getDeviceBadge = (device) => {
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
        <Heading level={3} size="sm" className="mb-3">Filtra per dispositivo</Heading>
        <div className="flex flex-wrap gap-2">
          {/* All */}
          <button
            onClick={() => setDeviceFilter('all')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              deviceFilter === 'all'
                ? 'bg-slate-900 text-white shadow-liquid-sm'
                : 'bg-white/[0.08] backdrop-blur-2xl text-slate-300 [html:not(.dark)_&]:text-slate-700 hover:bg-white/[0.12] shadow-liquid-sm ring-1 ring-white/[0.15] ring-inset'
            }`}
          >
            🏠 Tutti ({deviceCounts.all})
          </button>

          {/* Stove */}
          {deviceCounts.stove > 0 && (
            <button
              onClick={() => setDeviceFilter('stove')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                deviceFilter === 'stove'
                  ? 'bg-ember-600 text-white shadow-liquid-sm'
                  : 'bg-ember-500/[0.08] [html:not(.dark)_&]:bg-ember-500/[0.08] bg-ember-500/[0.15] backdrop-blur-2xl text-ember-400 [html:not(.dark)_&]:text-ember-700 hover:bg-ember-500/[0.12] [html:not(.dark)_&]:hover:bg-ember-500/[0.12] hover:bg-ember-500/[0.20] shadow-liquid-sm ring-1 ring-ember-500/20 [html:not(.dark)_&]:ring-ember-500/20 ring-ember-500/30 ring-inset'
              }`}
            >
              🔥 Stufa ({deviceCounts.stove})
            </button>
          )}

          {/* Thermostat */}
          {deviceCounts.thermostat > 0 && (
            <button
              onClick={() => setDeviceFilter('thermostat')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                deviceFilter === 'thermostat'
                  ? 'bg-ocean-600 text-white shadow-liquid-sm'
                  : 'bg-ocean-500/[0.08] [html:not(.dark)_&]:bg-ocean-500/[0.08] bg-ocean-500/[0.15] backdrop-blur-2xl text-ocean-400 [html:not(.dark)_&]:text-ocean-700 hover:bg-ocean-500/[0.12] [html:not(.dark)_&]:hover:bg-ocean-500/[0.12] hover:bg-ocean-500/[0.20] shadow-liquid-sm ring-1 ring-ocean-500/20 [html:not(.dark)_&]:ring-ocean-500/20 ring-ocean-500/30 ring-inset'
              }`}
            >
              🌡️ Termostato ({deviceCounts.thermostat})
            </button>
          )}

          {/* Lights */}
          {deviceCounts.lights > 0 && (
            <button
              onClick={() => setDeviceFilter('lights')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                deviceFilter === 'lights'
                  ? 'bg-warning-600 text-white shadow-liquid-sm'
                  : 'bg-warning-500/[0.08] [html:not(.dark)_&]:bg-warning-500/[0.08] bg-warning-500/[0.15] backdrop-blur-2xl text-warning-400 [html:not(.dark)_&]:text-warning-700 hover:bg-warning-500/[0.12] [html:not(.dark)_&]:hover:bg-warning-500/[0.12] hover:bg-warning-500/[0.20] shadow-liquid-sm ring-1 ring-warning-500/20 [html:not(.dark)_&]:ring-warning-500/20 ring-warning-500/30 ring-inset'
              }`}
            >
              💡 Luci ({deviceCounts.lights})
            </button>
          )}

          {/* Sonos */}
          {deviceCounts.sonos > 0 && (
            <button
              onClick={() => setDeviceFilter('sonos')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                deviceFilter === 'sonos'
                  ? 'bg-sage-600 text-white shadow-liquid-sm'
                  : 'bg-sage-500/[0.08] [html:not(.dark)_&]:bg-sage-500/[0.08] bg-sage-500/[0.15] backdrop-blur-2xl text-sage-400 [html:not(.dark)_&]:text-sage-700 hover:bg-sage-500/[0.12] [html:not(.dark)_&]:hover:bg-sage-500/[0.12] hover:bg-sage-500/[0.20] shadow-liquid-sm ring-1 ring-sage-500/20 [html:not(.dark)_&]:ring-sage-500/20 ring-sage-500/30 ring-inset'
              }`}
            >
              🎵 Sonos ({deviceCounts.sonos})
            </button>
          )}
        </div>
      </Card>

      {/* Log Entries */}
      <Card variant="default" className="p-4 sm:p-6">
        {filteredLog.length === 0 ? (
          <div className="text-center py-12">
            <Text variant="tertiary" size="lg" className="mb-2">Nessuna azione registrata</Text>
            {deviceFilter !== 'all' && (
              <button
                onClick={() => setDeviceFilter('all')}
                className="text-sm text-ember-400 [html:not(.dark)_&]:text-ember-600 hover:text-ember-500 [html:not(.dark)_&]:hover:text-ember-700 font-medium"
              >
                Mostra tutti i log
              </button>
            )}
          </div>
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
