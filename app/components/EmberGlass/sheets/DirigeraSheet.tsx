'use client';

/**
 * DirigeraSheet — body for the IKEA DIRIGERA sheet.
 *
 * Presentational — receives sensors from the parent DirigeraCard (the card
 * mounts useDirigeraFullData; the sheet must not re-mount it).
 *
 * Sections:
 *   - Hero: total / active counts + Apri pagina action
 *   - Sensor list grouped by type (contact, motion). Each row: dot, name,
 *     room, battery %, last seen relative time, status badge
 *   - Low battery panel (≤25%) — quick visible reference
 */

import { TriangleAlert, BatteryWarning, DoorOpen, Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import type { DirigeraSensor } from '@/types/dirigeraProxy';
import { useDirigeraFullData } from '@/app/components/devices/dirigera/hooks/useDirigeraFullData';
import { SheetRow } from './primitives/SheetRow';

export interface DirigeraSheetProps {
  sensors: DirigeraSensor[];
  loading: boolean;
  /** Optional nav callback — kept for parity with other sheets. */
  onNavigate?: (path: string) => void;
}

const TONE = '#ffb84a';

function isSensorActive(s: DirigeraSensor): boolean {
  if (s.type === 'openCloseSensor') return s.is_open === true;
  const detected = (s as { is_detected?: boolean }).is_detected;
  return detected === true;
}

function statusLabel(s: DirigeraSensor): string {
  if (s.type === 'openCloseSensor') return s.is_open ? 'Aperto' : 'Chiuso';
  return isSensorActive(s) ? 'Movimento' : 'Fermo';
}

function lastSeenLabel(iso: string | null): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return formatDistanceToNow(d, { addSuffix: true, locale: it });
  } catch {
    return '—';
  }
}

export function DirigeraSheet({ sensors, loading }: DirigeraSheetProps) {
  const contact = sensors.filter((s) => s.type === 'openCloseSensor');
  const motion = sensors.filter((s) => s.type === 'occupancySensor');
  const activeCount = sensors.filter(isSensorActive).length;
  const totalCount = sensors.length;
  const offlineCount = sensors.filter((s) => !s.is_reachable).length;
  const lowBattery = sensors.filter(
    (s) => typeof s.battery_percentage === 'number' && s.battery_percentage <= 25,
  );

  if (loading && sensors.length === 0) {
    return (
      <div
        data-testid="dirigera-sheet-skeleton"
        style={{
          height: 320,
          borderRadius: 'var(--r-card)',
          background: 'rgba(255,255,255,0.05)',
          opacity: 0.6,
        }}
        className="animate-pulse"
      />
    );
  }

  if (!loading && sensors.length === 0) {
    return (
      <div
        data-testid="dirigera-sheet-empty"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          padding: '24px 0',
        }}
      >
        <TriangleAlert size={32} color="var(--text-2)" />
        <div style={{ fontSize: 14, color: 'var(--text-1)' }}>
          Nessun sensore DIRIGERA disponibile.
        </div>
      </div>
    );
  }

  return (
    <div data-testid="dirigera-sheet">
      {/* Hero */}
      <div
        style={{
          borderRadius: 24,
          padding: '24px 20px',
          background:
            activeCount > 0
              ? `linear-gradient(160deg, color-mix(in oklab, ${TONE} 22%, transparent) 0%, transparent 70%)`
              : 'rgba(255,255,255,0.03)',
          border: '0.5px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: 20,
        }}
      >
        <Activity size={48} color={activeCount > 0 ? TONE : 'var(--text-2)'} />
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 12,
              color: 'var(--text-2)',
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            DIRIGERA
          </div>
          <div
            data-testid="dirigera-sheet-headline"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 40,
              fontWeight: 600,
              color: '#fff',
              lineHeight: 1.05,
              letterSpacing: -1.5,
            }}
          >
            {activeCount}
            <span style={{ fontSize: 18, opacity: 0.5 }}> / {totalCount}</span>
          </div>
          <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-2)' }}>
            attivi · {offlineCount > 0 ? `${offlineCount} offline` : 'tutti online'}
          </div>
        </div>
      </div>

      {/* Low battery panel */}
      {lowBattery.length > 0 && (
        <div
          data-testid="dirigera-sheet-battery-warning"
          style={{
            marginTop: 18,
            padding: 12,
            borderRadius: 14,
            background: 'rgba(255, 184, 74, 0.08)',
            border: '0.5px solid rgba(255, 184, 74, 0.3)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 8,
            }}
          >
            <BatteryWarning size={16} color="#ffb84a" />
            <div style={{ fontSize: 13, fontWeight: 600, color: '#ffb84a' }}>
              Batterie scariche
            </div>
          </div>
          {lowBattery.map((s) => {
            const pct = s.battery_percentage ?? 0;
            const color = pct <= 10 ? '#ff4d5c' : '#ffb84a';
            return (
              <div
                key={s.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '4px 0',
                  fontSize: 12,
                  color: 'var(--text-1)',
                }}
              >
                <span>{s.custom_name}</span>
                <span style={{ color, fontWeight: 600 }}>{pct}%</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Contact sensors */}
      {contact.length > 0 && (
        <>
          <div
            style={{
              fontSize: 11,
              color: 'var(--text-2)',
              textTransform: 'uppercase',
              letterSpacing: 1,
              marginTop: 22,
              marginBottom: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <DoorOpen size={14} /> Contatti
          </div>
          {contact.map((s) => (
            <SensorRow key={s.id} sensor={s} />
          ))}
        </>
      )}

      {/* Motion sensors */}
      {motion.length > 0 && (
        <>
          <div
            style={{
              fontSize: 11,
              color: 'var(--text-2)',
              textTransform: 'uppercase',
              letterSpacing: 1,
              marginTop: 22,
              marginBottom: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Activity size={14} /> Movimento
          </div>
          {motion.map((s) => (
            <SensorRow key={s.id} sensor={s} />
          ))}
        </>
      )}
    </div>
  );
}

interface SensorRowProps {
  sensor: DirigeraSensor;
}

function SensorRow({ sensor }: SensorRowProps) {
  const active = isSensorActive(sensor);
  const label = statusLabel(sensor);
  const pct = sensor.battery_percentage;
  const room = sensor.room ?? '—';
  const seen = lastSeenLabel(sensor.last_seen);
  const isLow = typeof pct === 'number' && pct <= 25;
  return (
    <SheetRow
      label={sensor.custom_name}
      value={`${room} · ${seen}`}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexShrink: 0,
        }}
      >
        {typeof pct === 'number' && (
          <span
            style={{
              fontSize: 11,
              color: isLow ? '#ffb84a' : 'var(--text-2)',
              fontWeight: isLow ? 600 : 500,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {pct}%
          </span>
        )}
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            padding: '4px 10px',
            borderRadius: 999,
            background: active
              ? `color-mix(in oklab, ${TONE} 20%, transparent)`
              : 'rgba(255,255,255,0.05)',
            color: active ? TONE : 'var(--text-2)',
            border: active
              ? `0.5px solid color-mix(in oklab, ${TONE} 35%, transparent)`
              : '0.5px solid rgba(255,255,255,0.06)',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </span>
      </div>
    </SheetRow>
  );
}

/**
 * Self-fetching wrapper for the design-system gallery — production card uses
 * the prop-based DirigeraSheet directly.
 */
export function DirigeraSheetSelfFetch() {
  const { data } = useDirigeraFullData('all');
  return (
    <DirigeraSheet
      sensors={data?.sensors ?? []}
      loading={data === null}
      onNavigate={() => {}}
    />
  );
}
