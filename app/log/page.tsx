'use client';

import { useEffect, useState, type ReactNode } from 'react';
import {
  AlarmClock, Brush, Calendar, ClipboardList, FileText, Flame, Home, Lightbulb, LightbulbOff, Link, Music, Palette, RefreshCw,
  Settings, Snowflake, Sun, Thermometer, Unplug, Wind, Wrench, Zap, type LucideIcon,
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { onValue, ref } from 'firebase/database';
import Card from '@/app/components/ui/Card';
import Skeleton from '@/app/components/ui/Skeleton';
import Text from '@/app/components/ui/Text';
import { PageHeader } from '@/app/components/EmberGlass/PageHeader';
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
  [key: string]: unknown;
}

type DeviceFilter = 'all' | 'stove' | 'thermostat' | 'lights' | 'sonos';

export default function LogPage() {
  const [log, setLog] = useState<LogEntryData[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [deviceFilter, setDeviceFilterState] = useState<DeviceFilter>('all');

  // Changing filter goes back to the first page
  const setDeviceFilter = (filter: DeviceFilter) => {
    if (filter === deviceFilter) return;
    setDeviceFilterState(filter);
    setCurrentPage(0);
  };

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
        .map(([id, entry]) => ({ id, ...(entry as Record<string, unknown>) } as LogEntryData))
        .sort((a: LogEntryData, b: LogEntryData) => b.timestamp - a.timestamp);

      setLog(entries);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const formatDate = (ts: string | number): string => {
    const d = new Date(ts);
    return d.toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const pickIcon = (action: string, device?: string): LucideIcon => {
    const actionLower = action.toLowerCase();

    // Device-specific icons first
    if (device === 'stove') {
      if (actionLower.includes('accensione')) return Flame;
      if (actionLower.includes('spegnimento')) return Snowflake;
      if (actionLower.includes('ventola') || actionLower.includes('ventilazione')) return Wind;
      if (actionLower.includes('potenza')) return Zap;
      if (actionLower.includes('pulizia')) return Brush;
      if (actionLower.includes('scheduler') || actionLower.includes('modalità')) return AlarmClock;
      return Flame; // Default stove icon
    }

    if (device === 'thermostat') {
      if (actionLower.includes('temperatura')) return Thermometer;
      if (actionLower.includes('modalità') || actionLower.includes('mode')) return Settings;
      if (actionLower.includes('calibra')) return Wrench;
      if (actionLower.includes('sincronizzazione')) return RefreshCw;
      if (actionLower.includes('connessione')) return Link;
      if (actionLower.includes('disconnessione')) return Unplug;
      return Thermometer; // Default thermostat icon
    }

    if (device === 'lights') {
      if (actionLower.includes('accesa') || actionLower.includes('on')) return Lightbulb;
      if (actionLower.includes('spenta') || actionLower.includes('off')) return LightbulbOff;
      if (actionLower.includes('luminosità') || actionLower.includes('brightness')) return Sun;
      if (actionLower.includes('scena')) return Palette;
      if (actionLower.includes('stanza')) return Home;
      if (actionLower.includes('connessione')) return Link;
      if (actionLower.includes('disconnessione')) return Unplug;
      return Lightbulb; // Default lights icon
    }

    if (device === 'sonos') return Music;

    // Legacy fallback (for old logs without device field)
    if (actionLower.includes('accensione')) return Flame;
    if (actionLower.includes('spegnimento')) return Snowflake;
    if (actionLower.includes('ventola')) return Wind;
    if (actionLower.includes('potenza')) return Zap;
    if (actionLower.includes('scheduler') || actionLower.includes('modalità')) return AlarmClock;
    if (actionLower.includes('netatmo') || actionLower.includes('temperatura')) return Thermometer;
    if (actionLower.includes('intervallo')) return Calendar;
    return FileText;
  };

  const getIcon = (action: string, device?: string): ReactNode => {
    const Icon = pickIcon(action, device);
    return <Icon size={20} className="text-(--text-2)" aria-hidden="true" />;
  };

  const getDeviceBadge = (device?: string): { label: string; icon?: string; color: 'primary' | 'info' | 'warning' | 'success' | 'neutral' } => {
    const config = device ? DEVICE_CONFIG[device as keyof typeof DEVICE_CONFIG] : undefined;
    if (!config) return { label: 'Sistema', color: 'neutral' };

    const colorMap = {
      primary: 'primary',
      info: 'info',
      warning: 'warning',
      success: 'success',
    } as const;

    return {
      label: config.name,
      icon: config.icon,
      color: colorMap[config.color as keyof typeof colorMap] || 'neutral',
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

  const pageHeader = (
    <PageHeader title="Storico azioni" description="Tutte le azioni registrate nel sistema" backHref="/altro" />
  );

  if (loading) {
    return (
      <>
        <div className="mx-auto max-w-5xl">{pageHeader}</div>
        <Skeleton.LogPage />
      </>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {pageHeader}

      {/* Filters Card */}
      <Card variant="default">
        <Text variant="label" className="mb-3">Filtra per dispositivo</Text>
        <div className="flex flex-wrap gap-2">
          {/* All */}
          <Button
            variant={deviceFilter === 'all' ? 'subtle' : 'ghost'}
            size="sm"
            icon={<Home size={16} />}
            onClick={() => setDeviceFilter('all')}
            className={deviceFilter === 'all' ? 'ring-1 ring-white/14' : ''}
          >
            Tutti ({deviceCounts.all})
          </Button>

          {/* Stove */}
          {deviceCounts.stove > 0 && (
            <Button
              variant={deviceFilter === 'stove' ? 'ember' : 'ghost'}
              size="sm"
              icon={<Flame size={16} />}
              onClick={() => setDeviceFilter('stove')}
              className={deviceFilter !== 'stove' ? 'text-ember-400 hover:bg-ember-500/10' : ''}
            >
              Stufa ({deviceCounts.stove})
            </Button>
          )}

          {/* Thermostat */}
          {deviceCounts.thermostat > 0 && (
            <Button
              variant={deviceFilter === 'thermostat' ? 'ember' : 'ghost'}
              size="sm"
              icon={<Thermometer size={16} />}
              onClick={() => setDeviceFilter('thermostat')}
              className={deviceFilter !== 'thermostat' ? 'text-ocean-400 hover:bg-ocean-500/10' : ''}
            >
              Termostato ({deviceCounts.thermostat})
            </Button>
          )}

          {/* Lights */}
          {deviceCounts.lights > 0 && (
            <Button
              variant={deviceFilter === 'lights' ? 'subtle' : 'ghost'}
              size="sm"
              icon={<Lightbulb size={16} />}
              onClick={() => setDeviceFilter('lights')}
              className={deviceFilter === 'lights'
                ? 'bg-warning-500/20 text-warning-300'
                : 'text-warning-400 hover:bg-warning-500/10'}
            >
              Luci ({deviceCounts.lights})
            </Button>
          )}

          {/* Sonos */}
          {deviceCounts.sonos > 0 && (
            <Button
              variant={deviceFilter === 'sonos' ? 'success' : 'ghost'}
              size="sm"
              icon={<Music size={16} />}
              onClick={() => setDeviceFilter('sonos')}
              className={deviceFilter !== 'sonos' ? 'text-sage-400 hover:bg-sage-500/10' : ''}
            >
              Sonos ({deviceCounts.sonos})
            </Button>
          )}
        </div>
      </Card>

      {/* Log Entries */}
      <Card variant="default">
        {filteredLog.length === 0 ? (
          <EmptyState
            icon={<ClipboardList size={48} className="text-(--text-2)" />}
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
