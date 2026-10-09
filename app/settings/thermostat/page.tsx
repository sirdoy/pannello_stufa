'use client';

/**
 * /settings/thermostat — stove climate control (workspace ROADMAP D16, D18).
 *
 * The controller runs on the Pi: while the stove works in a slot, power and fan
 * follow the temperature of one room against its programmed Netatmo setpoint.
 * This page turns it on and off, picks the room, tunes it and shows what it
 * reads and its latest decisions. Contract: docs/api/scheduler.md (Climate Control).
 */

import { useEffect, useState } from 'react';
import { GlassCard } from '@/app/components/EmberGlass/GlassCard';
import { PageHeader } from '@/app/components/EmberGlass/PageHeader';
import { InlineToggle } from '@/app/components/EmberGlass/InlineToggle';
import {
  errorTextStyle,
  inputStyle,
  labelStyle,
  okTextStyle,
  primaryButtonStyle,
} from '@/app/components/EmberGlass/formStyles';
import type { NetatmoProxyHomestatusResponse } from '@/types/netatmoProxy';
import type { ClimateLogResponse, ClimatePatch, ClimateState } from '@/types/thermorossiScheduler';

const API = '/api/v1/thermorossi/scheduler/climate';
const LOG_LIMIT = 20;
const POWER_LEVELS = [1, 2, 3, 4, 5];
const FAN_LEVELS = [1, 2, 3, 4, 5, 6];

const cardStyle = { aspectRatio: 'auto', marginBottom: 16 } as const;
const titleStyle = { fontSize: 17, fontWeight: 700, margin: '0 0 6px' } as const;
const mutedStyle = { fontSize: 13, color: 'var(--text-2)', margin: '0 0 12px', lineHeight: 1.45 } as const;
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 } as const;

type Room = { id: string; name: string };
type Status = { ok: boolean; text: string } | null;
/** Tuning fields edited locally and saved together. */
type Tuning = Pick<ClimateState, 'min_power' | 'max_power' | 'kp' | 'ti_minutes' | 'fan_by_power'>;

const tuningOf = (s: ClimateState): Tuning => ({
  min_power: s.min_power,
  max_power: s.max_power,
  kp: s.kp,
  ti_minutes: s.ti_minutes,
  fan_by_power: [...s.fan_by_power],
});

function degrees(value: number | null): string {
  return value === null ? '—' : `${value.toLocaleString('it-IT', { maximumFractionDigits: 1 })} °C`;
}

function formatTs(ts: number): string {
  return new Date(ts * 1000).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' });
}

function Reading({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-2)', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 17, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function LevelSelect({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  options: number[];
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label htmlFor={id} style={labelStyle}>
        {label}
      </label>
      <select id={id} value={value} onChange={(e) => onChange(Number(e.target.value))} style={inputStyle}>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function ThermostatSettingsPage() {
  const [state, setState] = useState<ClimateState | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [log, setLog] = useState<ClimateLogResponse['items'] | null>(null);
  const [tuning, setTuning] = useState<Tuning | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(API)
      .then(async (res) => {
        if (!res.ok) throw new Error();
        const data = (await res.json()) as ClimateState;
        if (!alive) return;
        setState(data);
        setTuning(tuningOf(data));
      })
      .catch(() => {
        if (alive) setLoadError('Impossibile caricare il controllo climatico');
      });
    fetch('/api/v1/netatmo/homestatus')
      .then(async (res) => {
        if (!res.ok || !alive) return;
        const data = (await res.json()) as NetatmoProxyHomestatusResponse;
        if (alive) setRooms(data.rooms.map((r) => ({ id: r.room_id, name: r.room_name ?? r.room_id })));
      })
      .catch(() => {});
    fetch(`${API}/log?limit=${LOG_LIMIT}`)
      .then(async (res) => {
        if (!res.ok || !alive) return;
        const data = (await res.json()) as ClimateLogResponse;
        if (alive) setLog(data.items);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const save = async (patch: ClimatePatch, okText: string) => {
    setBusy(true);
    setStatus(null);
    const res = await fetch(API, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    }).catch(() => null);
    if (res?.ok) {
      const data = (await res.json()) as ClimateState;
      setState(data);
      setTuning(tuningOf(data));
      setStatus({ ok: true, text: okText });
    } else {
      setStatus({ ok: false, text: 'Salvataggio non riuscito, riprova' });
    }
    setBusy(false);
  };

  if (loadError) {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <PageHeader title="Clima stufa" backHref="/altro" />
        <p role="alert" style={errorTextStyle}>
          {loadError}
        </p>
      </div>
    );
  }
  if (!state || !tuning) {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <PageHeader title="Clima stufa" backHref="/altro" />
        <p style={mutedStyle}>Caricamento…</p>
      </div>
    );
  }

  const { live } = state;
  const rangeInvalid = tuning.min_power > tuning.max_power;
  const tuningDirty = JSON.stringify(tuning) !== JSON.stringify(tuningOf(state));
  // The room list comes from Netatmo; keep the saved room selectable if it is missing there
  const roomOptions =
    state.room_id && !rooms.some((r) => r.id === state.room_id)
      ? [...rooms, { id: state.room_id, name: state.room_id }]
      : rooms;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <PageHeader title="Clima stufa" backHref="/altro" />

      <GlassCard style={cardStyle} data-testid="climate-main-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <h2 style={titleStyle}>Potenza dalla temperatura</h2>
            <p style={{ ...mutedStyle, margin: 0 }} data-testid="climate-state">
              {state.enabled ? 'Attivo' : 'Spento: la stufa usa i livelli delle fasce'}
            </p>
          </div>
          <InlineToggle
            on={state.enabled}
            disabled={busy || (!state.enabled && !state.room_id)}
            onChange={() =>
              void save({ enabled: !state.enabled }, state.enabled ? 'Controllo spento' : 'Controllo attivo')
            }
            aria-label={state.enabled ? 'Spegni il controllo climatico' : 'Attiva il controllo climatico'}
          />
        </div>
        <p style={{ ...mutedStyle, marginTop: 12 }}>
          Con la stufa accesa in una fascia, potenza e ventola seguono la temperatura della stanza rispetto al
          setpoint del programma Netatmo. Vale con la stufa accesa dallo scheduler o a mano; i livelli della fascia
          valgono solo per l&apos;accensione. Se imposti potenza o ventola a mano, il controllo si ferma finché la
          stufa si spegne o lo scheduler riprende.
        </p>

        <label htmlFor="climate-room" style={labelStyle}>
          Stanza
        </label>
        <select
          id="climate-room"
          value={state.room_id ?? ''}
          disabled={busy}
          onChange={(e) => e.target.value && void save({ room_id: e.target.value }, 'Stanza salvata')}
          style={{ ...inputStyle, marginBottom: 16 }}
        >
          {!state.room_id && <option value="">Scegli una stanza…</option>}
          {roomOptions.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>

        <div style={gridStyle} data-testid="climate-live">
          <Reading label="Setpoint del programma" value={degrees(live.setpoint)} />
          <Reading label="Temperatura" value={degrees(live.temperature)} />
          <Reading
            label="Livelli decisi ora"
            value={live.power_level === null ? '—' : `P${live.power_level} · V${live.fan_level}`}
          />
        </div>
        {state.room_id && (live.setpoint === null || live.temperature === null) && (
          <p style={{ ...mutedStyle, margin: '12px 0 0' }}>
            Dati mancanti (casa non in programma, o temperatura più vecchia di 20 minuti): la stufa segue la fascia.
          </p>
        )}
        {state.enabled && live.paused && (
          <p style={{ ...mutedStyle, margin: '12px 0 0' }} data-testid="climate-paused">
            In pausa: potenza o ventola impostate a mano. Riprende quando la stufa si spegne o lo scheduler torna in
            automatico.
          </p>
        )}
        {status && (
          <p role="status" style={{ ...(status.ok ? okTextStyle : errorTextStyle), margin: '12px 0 0' }}>
            {status.text}
          </p>
        )}
      </GlassCard>

      <GlassCard style={cardStyle} data-testid="climate-tuning-card">
        <h2 style={titleStyle}>Regolazione</h2>
        <p style={mutedStyle}>
          La potenza sale di «guadagno» livelli per ogni grado sotto il setpoint, più una correzione lenta che cresce
          finché la stanza resta sotto.
        </p>
        <div style={gridStyle}>
          <LevelSelect
            id="climate-min-power"
            label="Potenza minima"
            value={tuning.min_power}
            options={POWER_LEVELS}
            onChange={(v) => setTuning({ ...tuning, min_power: v })}
          />
          <LevelSelect
            id="climate-max-power"
            label="Potenza massima"
            value={tuning.max_power}
            options={POWER_LEVELS}
            onChange={(v) => setTuning({ ...tuning, max_power: v })}
          />
          <div>
            <label htmlFor="climate-kp" style={labelStyle}>
              Guadagno (livelli/°C)
            </label>
            <input
              id="climate-kp"
              type="number"
              min={0.1}
              max={10}
              step={0.1}
              value={tuning.kp}
              onChange={(e) => setTuning({ ...tuning, kp: Number(e.target.value) })}
              style={inputStyle}
            />
          </div>
          <div>
            <label htmlFor="climate-ti" style={labelStyle}>
              Correzione lenta (minuti)
            </label>
            <input
              id="climate-ti"
              type="number"
              min={5}
              max={600}
              step={5}
              value={tuning.ti_minutes}
              onChange={(e) => setTuning({ ...tuning, ti_minutes: Number(e.target.value) })}
              style={inputStyle}
            />
          </div>
        </div>

        <h3 style={{ fontSize: 13, fontWeight: 700, margin: '18px 0 8px' }}>Ventola per ogni potenza</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 16 }}>
          {POWER_LEVELS.map((power, i) => (
            <LevelSelect
              key={power}
              id={`climate-fan-${power}`}
              label={`P${power}`}
              value={tuning.fan_by_power[i] ?? 1}
              options={FAN_LEVELS}
              onChange={(v) =>
                setTuning({ ...tuning, fan_by_power: tuning.fan_by_power.map((f, j) => (j === i ? v : f)) })
              }
            />
          ))}
        </div>

        {rangeInvalid && (
          <p role="alert" style={errorTextStyle}>
            La potenza minima non può superare la massima.
          </p>
        )}
        <button
          type="button"
          disabled={busy || !tuningDirty || rangeInvalid}
          onClick={() => void save(tuning, 'Regolazione salvata')}
          style={primaryButtonStyle(busy || !tuningDirty || rangeInvalid)}
        >
          Salva regolazione
        </button>
      </GlassCard>

      <GlassCard style={cardStyle} data-testid="climate-log-card">
        <h2 style={titleStyle}>Ultime decisioni</h2>
        {log === null && <p style={mutedStyle}>Caricamento…</p>}
        {log?.length === 0 && (
          <p style={mutedStyle}>Ancora nessuna: il controllo decide solo a stufa accesa in una fascia.</p>
        )}
        {log && log.length > 0 && (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {log.map((row, i) => (
              <li
                key={`${row.timestamp}-${i}`}
                data-testid="climate-log-row"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '8px 0',
                  borderTop: i === 0 ? 'none' : '0.5px solid rgba(255,255,255,0.08)',
                  fontSize: 13,
                }}
              >
                <span style={{ color: 'var(--text-2)' }}>{formatTs(row.timestamp)}</span>
                <span>
                  {degrees(row.temperature)} su {degrees(row.setpoint)}
                </span>
                <span style={{ fontWeight: 700 }}>
                  P{row.power} · V{row.fan}
                  {row.frozen ? ' (tenuta)' : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>
    </div>
  );
}
