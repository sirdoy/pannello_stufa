'use client';

/**
 * /settings/notifications — Web Push sent by the Pi (workspace ROADMAP M48).
 *
 * - This device: on/off (stored per device, same choice as the first-launch
 *   question), test push, help when the browser blocks or cannot receive pushes.
 * - Registered devices: every subscription on the Pi, removable.
 * - Last notifications sent (history kept 90 days on the Pi).
 */

import { useEffect, useState, useSyncExternalStore } from 'react';
import { GlassCard } from '@/app/components/EmberGlass/GlassCard';
import { InlineToggle } from '@/app/components/EmberGlass/InlineToggle';
import { errorTextStyle, okTextStyle, secondaryButtonStyle } from '@/app/components/EmberGlass/formStyles';
import {
  disablePush,
  enablePush,
  getChoice,
  getPermission,
  getPushSupport,
  getSubscriptionId,
  type PushSupport,
} from '@/lib/push/pushClient';
import type { PushHistoryItem, PushSendResult, PushSubscriptionInfo } from '@/types/notificationsProxy';

const API = '/api/v1/notifications';
const HISTORY_LIMIT = 20;
const cardStyle = { aspectRatio: 'auto', marginBottom: 16 } as const;
const titleStyle = { fontSize: 17, fontWeight: 700, margin: '0 0 6px' } as const;
const mutedStyle = { fontSize: 13, color: 'var(--text-2)', margin: '0 0 12px', lineHeight: 1.45 } as const;

type Status = { ok: boolean; text: string } | null;

function formatTs(ts: number | null): string {
  if (!ts) return 'mai';
  return new Date(ts * 1000).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' });
}

// ---------------------------------------------------------------------------
// This device
// ---------------------------------------------------------------------------

interface DeviceState {
  support: PushSupport;
  permission: NotificationPermission | 'unsupported';
  enabled: boolean;
}

function readDeviceState(): DeviceState {
  const permission = getPermission();
  return {
    support: getPushSupport(),
    permission,
    enabled: getChoice() === 'enabled' && permission === 'granted',
  };
}

const subscribeNoop = () => () => {};

function ThisDeviceSection({ onChanged }: { onChanged: () => void }) {
  // Browser-only state (permission, localStorage): null on the server and during hydration
  const mounted = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const [, setVersion] = useState(0);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  if (!mounted) return null;
  const state = readDeviceState();
  const rerender = () => setVersion((n) => n + 1);

  const toggle = async () => {
    setBusy(true);
    setStatus(null);
    if (state.enabled) {
      await disablePush();
      setStatus({ ok: true, text: 'Notifiche disattivate su questo dispositivo' });
    } else {
      const result = await enablePush();
      setStatus(result.ok ? { ok: true, text: 'Notifiche attivate' } : { ok: false, text: result.message });
    }
    rerender();
    setBusy(false);
    onChanged();
  };

  const sendTest = async () => {
    setBusy(true);
    setStatus(null);
    const id = getSubscriptionId();
    const res = await fetch(`${API}/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(id ? { subscription_id: id } : {}),
    }).catch(() => null);
    if (res?.ok) {
      const result = (await res.json()) as PushSendResult;
      setStatus(
        result.sent > 0
          ? { ok: true, text: 'Notifica di prova inviata: dovrebbe arrivare tra pochi secondi' }
          : { ok: false, text: 'Invio non riuscito: disattiva e riattiva le notifiche' }
      );
    } else {
      setStatus({ ok: false, text: res?.status === 404 ? 'Dispositivo non registrato: riattiva le notifiche' : 'Invio non riuscito' });
    }
    setBusy(false);
    onChanged();
  };

  let help: string | null = null;
  if (state.support === 'ios-install') {
    help =
      "Su iPhone/iPad le notifiche arrivano solo all'app installata: in Safari tocca Condividi → \"Aggiungi alla " +
      'schermata Home", apri l\'app dall\'icona e torna qui.';
  } else if (state.support === 'unsupported') {
    help = 'Questo browser non supporta le notifiche push.';
  } else if (state.permission === 'denied') {
    help =
      'Le notifiche sono bloccate per questa app: abilitale nelle impostazioni del telefono o del browser ' +
      '(permessi del sito), poi riattivale qui.';
  } else if (getChoice() === 'enabled' && state.permission !== 'granted') {
    help = 'Il permesso alle notifiche è stato tolto: riattiva le notifiche.';
  }

  const canToggle = state.support === 'supported' && state.permission !== 'denied';

  return (
    <GlassCard style={cardStyle} data-testid="push-device-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h2 style={titleStyle}>Questo dispositivo</h2>
          <p style={{ ...mutedStyle, margin: 0 }} data-testid="push-device-state">
            {state.enabled ? 'Notifiche attive' : 'Notifiche disattivate'}
          </p>
        </div>
        {canToggle && (
          <InlineToggle
            on={state.enabled}
            onChange={toggle}
            disabled={busy}
            aria-label={state.enabled ? 'Disattiva notifiche' : 'Attiva notifiche'}
          />
        )}
      </div>
      <p style={{ ...mutedStyle, marginTop: 12 }}>
        Accensioni e spegnimenti automatici, allarmi stufa, manutenzione, sensori IKEA offline. Arrivano anche con
        l&apos;app chiusa e anche se la sessione è scaduta.
      </p>
      {help && <p style={errorTextStyle} data-testid="push-help">{help}</p>}
      {status && (
        <p role="status" style={status.ok ? okTextStyle : errorTextStyle}>
          {status.text}
        </p>
      )}
      {state.enabled && (
        <button type="button" onClick={sendTest} disabled={busy} style={secondaryButtonStyle}>
          Invia notifica di prova
        </button>
      )}
    </GlassCard>
  );
}

// ---------------------------------------------------------------------------
// Registered devices
// ---------------------------------------------------------------------------

function DevicesSection({ devices, error, onRemove }: {
  devices: PushSubscriptionInfo[] | null;
  error: string | null;
  onRemove: (device: PushSubscriptionInfo) => void;
}) {
  const currentId = getSubscriptionId();
  return (
    <GlassCard style={cardStyle} data-testid="push-devices-card">
      <h2 style={titleStyle}>Dispositivi registrati</h2>
      {error && <p role="alert" style={errorTextStyle}>{error}</p>}
      {devices && devices.length === 0 && <p style={mutedStyle}>Nessun dispositivo riceve le notifiche.</p>}
      {devices && devices.length > 0 && (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {devices.map((d) => (
            <li
              key={d.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
                padding: '10px 0',
                borderTop: '0.5px solid rgba(255,255,255,0.08)',
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>
                  {d.device_name || 'Dispositivo'}
                  {d.id === currentId && (
                    <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--accent)' }}>questo dispositivo</span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
                  Ultima consegna: {formatTs(d.last_success_at)} · registrato {formatTs(d.created_at)}
                </div>
                {d.last_error && (
                  <div style={{ fontSize: 12, color: '#ff8a8a' }}>
                    Ultimo errore ({d.failure_count}×): {d.last_error}
                  </div>
                )}
              </div>
              <button type="button" onClick={() => onRemove(d)} style={secondaryButtonStyle}>
                Rimuovi
              </button>
            </li>
          ))}
        </ul>
      )}
    </GlassCard>
  );
}

// ---------------------------------------------------------------------------
// History
// ---------------------------------------------------------------------------

function HistorySection({ items }: { items: PushHistoryItem[] | null }) {
  if (!items) return null;
  return (
    <GlassCard style={cardStyle} data-testid="push-history-card">
      <h2 style={titleStyle}>Ultime notifiche</h2>
      {items.length === 0 && <p style={mutedStyle}>Nessuna notifica inviata negli ultimi 90 giorni.</p>}
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {items.map((n) => (
          <li key={n.id} style={{ padding: '10px 0', borderTop: '0.5px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 14, fontWeight: 600 }}>
              <span>{n.title}</span>
              <span style={{ fontSize: 12, color: 'var(--text-2)', whiteSpace: 'nowrap' }}>{formatTs(n.ts)}</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-2)' }}>{n.body}</div>
            {n.failed > 0 && (
              <div style={{ fontSize: 12, color: '#ff8a8a' }}>
                Consegnata a {n.sent} dispositivi, non consegnata a {n.failed}
              </div>
            )}
          </li>
        ))}
      </ul>
    </GlassCard>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function NotificationsSettingsPage() {
  const [devices, setDevices] = useState<PushSubscriptionInfo[] | null>(null);
  const [devicesError, setDevicesError] = useState<string | null>(null);
  const [history, setHistory] = useState<PushHistoryItem[] | null>(null);
  const [reload, setReload] = useState(0);
  const [deviceKey, setDeviceKey] = useState(0);

  useEffect(() => {
    let alive = true;
    fetch(`${API}/subscriptions`)
      .then(async (res) => {
        if (!alive) return;
        if (!res.ok) throw new Error();
        const data = (await res.json()) as { items: PushSubscriptionInfo[] };
        if (alive) {
          setDevices(data.items);
          setDevicesError(null);
        }
      })
      .catch(() => {
        if (alive) setDevicesError('Impossibile caricare i dispositivi');
      });
    fetch(`${API}/history?limit=${HISTORY_LIMIT}`)
      .then(async (res) => {
        if (!res.ok || !alive) return;
        const data = (await res.json()) as { items: PushHistoryItem[] };
        if (alive) setHistory(data.items);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [reload]);

  const refresh = () => setReload((n) => n + 1);

  const removeDevice = async (device: PushSubscriptionInfo) => {
    if (device.id === getSubscriptionId()) {
      await disablePush(); // also drops the browser subscription and the stored choice
      setDeviceKey((n) => n + 1);
    } else {
      await fetch(`${API}/subscriptions/${device.id}`, { method: 'DELETE' }).catch(() => null);
    }
    refresh();
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, margin: '4px 0 18px' }}>Notifiche</h1>
      <ThisDeviceSection key={deviceKey} onChanged={refresh} />
      <DevicesSection devices={devices} error={devicesError} onRemove={removeDevice} />
      <HistorySection items={history} />
    </div>
  );
}
