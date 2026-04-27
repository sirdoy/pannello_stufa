// Rooms — derives devices per room from global state and renders cards + sheet

const { useState: useRoomsState } = React;

// Static room config (icon + tone); devices are derived from state
const ROOMS = [
  { name: 'Soggiorno', tone: 'var(--accent)', Icon: IconHome },
  { name: 'Cucina',    tone: '#f5c84a',       Icon: IconHome },
  { name: 'Camera',    tone: '#b080ff',       Icon: IconMoon },
  { name: 'Studio',    tone: '#5eafff',       Icon: IconHome },
  { name: 'Bagno',     tone: '#6aa86a',       Icon: IconDroplet },
  { name: 'Ingresso',  tone: '#ffb84a',       Icon: IconHome },
];

// Map short room keys used in state data → display room name
const ROOM_ALIASES = {
  'Soggiorno':     'Soggiorno',
  'Cucina':        'Cucina',
  'Camera':        'Camera',
  'Camera matr.':  'Camera',
  'Camera matrim.':'Camera',
  'Studio':        'Studio',
  'Bagno':         'Bagno',
  'Ingresso':      'Ingresso',
  'Cameretta':     'Camera',
  'Garage':        'Soggiorno',
  'Cantina':       'Bagno',
  'Esterno':       'Ingresso',
};

// Extra static devices per room (things not in state)
const EXTRA_DEVICES = {
  'Soggiorno': [
    { kind: 'tv',       name: 'TV soggiorno',  on: true,  value: 'Netflix · HDMI 1', extra: { source: 'HDMI 1', volume: 18 } },
    { kind: 'shade',    name: 'Tapparella',    on: false, value: 'Alzata',           extra: { position: 0 } },
  ],
  'Cucina': [
    { kind: 'shade',    name: 'Tapparella',    on: true,  value: 'Abbassata',        extra: { position: 100 } },
  ],
  'Camera': [
    { kind: 'shade',    name: 'Tapparelle',    on: true,  value: 'Abbassate',        extra: { position: 80 } },
  ],
  'Bagno': [
    { kind: 'sensor',   name: 'Umidità',       on: false, value: '58%',              extra: { humidity: 58, trend: 'stabile' } },
  ],
  'Ingresso': [
    { kind: 'camera',   name: 'Camera ingresso', on: true, value: 'LIVE',            extra: { motion: 'rilevato 2m fa', fps: 25 } },
  ],
};

const ICON_FOR = {
  stove: IconFlame, thermo: IconThermo, valve: IconThermo, light: IconBulb,
  plug: IconPlug, sonos: IconMusic, tv: IconTv, camera: IconCamera,
  shade: IconBlind, sensor: IconDroplet,
};

// Build rich devices list for a given room
function getDevicesForRoom(state, roomName) {
  const devices = [];

  if (roomName === 'Soggiorno') {
    devices.push({
      kind: 'stove', name: 'Stufa pellet',
      on: state.stove.on,
      tone: 'var(--accent)',
      value: state.stove.on ? `${state.stove.temp}°C` : 'Spenta',
      extra: { ...state.stove },
    });
  }

  state.thermostat.zones.forEach((z) => {
    if (ROOM_ALIASES[z.name] === roomName) {
      devices.push({
        kind: z.kind === 'valvola' ? 'valve' : 'thermo',
        name: z.kind === 'valvola' ? 'Termovalvola' : 'Termostato',
        on: z.on,
        tone: '#5eafff',
        value: `${z.current.toFixed(1)}° → ${z.target}°`,
        extra: { current: z.current, target: z.target, kind: z.kind },
      });
    }
  });

  state.lights.forEach((l, idx) => {
    if (ROOM_ALIASES[l.room] === roomName) {
      devices.push({
        kind: 'light', name: l.name,
        on: l.on,
        tone: '#f5c84a',
        value: l.on ? 'Accesa' : 'Spenta',
        extra: { idx, brightness: l.on ? 80 : 0, temp: 2700 },
      });
    }
  });

  state.plugs.forEach((p, idx) => {
    if (ROOM_ALIASES[p.room] === roomName) {
      devices.push({
        kind: 'plug', name: p.name,
        on: p.on,
        tone: '#ffb84a',
        value: p.on ? (p.power >= 1000 ? `${(p.power/1000).toFixed(1)}kW` : `${p.power}W`) : 'Inattiva',
        extra: { idx, power: p.power, today: Math.round(p.power * 4.2 / 100) / 10 },
      });
    }
  });

  state.sonos.groups.forEach((g) => {
    if (ROOM_ALIASES[g.name] === roomName) {
      devices.push({
        kind: 'sonos', name: `Sonos ${g.name}`,
        on: g.playing,
        tone: '#b080ff',
        value: g.playing ? g.track : 'In pausa',
        extra: { track: g.track, artist: g.artist, volume: g.volume, playing: g.playing },
      });
    }
  });

  (EXTRA_DEVICES[roomName] || []).forEach((d) => {
    devices.push({
      ...d,
      tone: d.kind === 'tv' ? '#5eafff' : d.kind === 'camera' ? '#6aa86a' : d.kind === 'shade' ? '#b0b0b0' : '#9a9a9a',
    });
  });

  return devices.map((d) => ({ ...d, icon: ICON_FOR[d.kind] || IconHome }));
}

// ─────── Rooms tab ───────
const RoomsTab = ({ state }) => {
  const [sheet, setSheet] = useRoomsState(null);

  return (
    <>
      <div style={{ paddingTop: 70 }}>
        <div style={{ padding: '0 20px 20px' }}>
          <div style={{ fontSize: 13, color: 'var(--text-2)' }}>{ROOMS.length} stanze</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 600, color: '#fff', letterSpacing: -0.8 }}>Stanze</div>
        </div>
        <div style={{ padding: '0 12px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {ROOMS.map((r) => (
            <RoomCard key={r.name} room={r} devices={getDevicesForRoom(state, r.name)}
                      onOpen={() => setSheet(r.name)} />
          ))}
        </div>
      </div>
      <RoomSheet
        open={!!sheet}
        onClose={() => setSheet(null)}
        room={ROOMS.find(r => r.name === sheet)}
        devices={sheet ? getDevicesForRoom(state, sheet) : []}
      />
    </>
  );
};

const RoomCard = ({ room, devices, onOpen }) => {
  const activeCount = devices.filter(d => d.on).length;
  const visible = devices.slice(0, 6);
  const overflow = devices.length - visible.length;

  return (
    <GlassCard onClick={onOpen} tone={room.tone}>
      <CardHead Icon={room.Icon} label={room.name} tone={room.tone} right={
        <div style={{ fontSize: 11, fontWeight: 600, color: activeCount > 0 ? room.tone : 'var(--text-2)', letterSpacing: 0.3, fontVariantNumeric: 'tabular-nums' }}>
          {activeCount}/{devices.length}
        </div>
      } />
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, alignContent: 'start' }}>
        {visible.map((d, i) => <DeviceChip key={i} device={d} />)}
        {overflow > 0 && (
          <div style={{
            aspectRatio: '1 / 1', borderRadius: 10,
            background: 'rgba(255,255,255,0.04)',
            border: '0.5px dashed rgba(255,255,255,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, color: 'var(--text-2)', fontWeight: 600,
          }}>+{overflow}</div>
        )}
        {devices.length === 0 && (
          <div style={{ gridColumn: '1 / -1', fontSize: 11, color: 'var(--text-2)', padding: '14px 0', textAlign: 'center' }}>
            Nessun dispositivo
          </div>
        )}
      </div>
    </GlassCard>
  );
};

const DeviceChip = ({ device }) => {
  const Icon = device.icon;
  return (
    <div style={{
      aspectRatio: '1 / 1', borderRadius: 10, position: 'relative',
      background: device.on
        ? `color-mix(in oklab, ${device.tone} 18%, transparent)`
        : 'rgba(255,255,255,0.04)',
      border: `0.5px solid ${device.on ? `color-mix(in oklab, ${device.tone} 35%, transparent)` : 'rgba(255,255,255,0.06)'}`,
      color: device.on ? device.tone : 'rgba(255,255,255,0.3)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: device.on ? `0 0 10px color-mix(in oklab, ${device.tone} 25%, transparent)` : 'none',
    }}>
      <Icon size={14} sw={2} />
      {device.on && (
        <div style={{
          position: 'absolute', top: 3, right: 3,
          width: 5, height: 5, borderRadius: 999,
          background: device.tone, boxShadow: `0 0 6px ${device.tone}`,
        }} />
      )}
    </div>
  );
};

// ─────── Room sheet — full device list with expanded cards ───────
const RoomSheet = ({ open, onClose, room, devices }) => {
  if (!room) return <Sheet open={false} onClose={onClose} />;
  const activeCount = devices.filter(d => d.on).length;

  const CATEGORY_ORDER = ['stove', 'thermo', 'valve', 'light', 'plug', 'sonos', 'tv', 'camera', 'shade', 'sensor'];
  const CATEGORY_LABEL = {
    stove: 'Stufa', thermo: 'Termostato', valve: 'Termovalvole', light: 'Luci',
    plug: 'Prese', sonos: 'Audio', tv: 'TV', camera: 'Telecamera',
    shade: 'Tapparelle', sensor: 'Sensori',
  };

  const grouped = CATEGORY_ORDER
    .map(k => ({ key: k, label: CATEGORY_LABEL[k], items: devices.filter(d => d.kind === k) }))
    .filter(g => g.items.length > 0);

  return (
    <Sheet open={open} onClose={onClose} title={room.name}>
      <div style={{
        padding: '16px 18px', borderRadius: 18, marginBottom: 18,
        background: `linear-gradient(130deg, color-mix(in oklab, ${room.tone} 16%, transparent) 0%, transparent 70%)`,
        border: `0.5px solid color-mix(in oklab, ${room.tone} 20%, transparent)`,
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <div style={{
          width: 42, height: 42, borderRadius: 12, flexShrink: 0,
          background: `color-mix(in oklab, ${room.tone} 22%, transparent)`,
          color: room.tone,
          border: `0.5px solid color-mix(in oklab, ${room.tone} 35%, transparent)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <room.Icon size={20} sw={2} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, color: '#fff' }}>
            {activeCount} di {devices.length} attivi
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
            {grouped.length} categorie di dispositivi
          </div>
        </div>
      </div>

      {grouped.map((g) => (
        <div key={g.key} style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 11, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, paddingLeft: 4 }}>
            {g.label}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {g.items.map((d, i) => (
              <DeviceCard key={i} device={d} />
            ))}
          </div>
        </div>
      ))}
    </Sheet>
  );
};

// ─────── Expanded device card — multi-row, rich controls ───────
const DeviceCard = ({ device }) => {
  const Icon = device.icon;
  return (
    <div style={{
      background: device.on
        ? `linear-gradient(135deg, color-mix(in oklab, ${device.tone} 8%, rgba(255,255,255,0.03)) 0%, rgba(255,255,255,0.03) 100%)`
        : 'rgba(255,255,255,0.03)',
      borderRadius: 16,
      border: `0.5px solid ${device.on ? `color-mix(in oklab, ${device.tone} 22%, rgba(255,255,255,0.06))` : 'rgba(255,255,255,0.06)'}`,
      padding: 14,
      transition: 'all .2s',
    }}>
      {/* Header row: icon + name + primary toggle/indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 11, flexShrink: 0,
          background: device.on
            ? `color-mix(in oklab, ${device.tone} 22%, transparent)`
            : 'rgba(255,255,255,0.05)',
          color: device.on ? device.tone : 'rgba(255,255,255,0.4)',
          border: `0.5px solid ${device.on ? `color-mix(in oklab, ${device.tone} 35%, transparent)` : 'rgba(255,255,255,0.06)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: device.on ? `0 0 14px color-mix(in oklab, ${device.tone} 30%, transparent)` : 'none',
        }}>
          <Icon size={18} sw={2} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', letterSpacing: -0.2 }}>
            {device.name}
          </div>
          <div style={{ fontSize: 11, color: device.on ? device.tone : 'var(--text-2)', marginTop: 2, fontWeight: 500 }}>
            {device.on ? 'Attivo' : 'Inattivo'} · {device.value}
          </div>
        </div>
        <DevicePrimaryControl device={device} />
      </div>

      {/* Body: device-specific extended controls */}
      <DeviceBody device={device} />
    </div>
  );
};

const DevicePrimaryControl = ({ device }) => {
  if (device.kind === 'sonos') {
    return (
      <button style={{
        width: 40, height: 40, borderRadius: 999, border: 'none', cursor: 'pointer',
        background: device.on ? '#fff' : 'rgba(255,255,255,0.08)',
        color: device.on ? '#1a0f08' : '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {device.on ? <IconPause size={14} sw={2.4} /> : <IconPlay size={14} sw={2.4} />}
      </button>
    );
  }
  if (device.kind === 'sensor' || device.kind === 'camera') {
    return (
      <div style={{
        padding: '5px 10px', borderRadius: 999,
        background: device.on ? `color-mix(in oklab, ${device.tone} 18%, transparent)` : 'rgba(255,255,255,0.06)',
        color: device.on ? device.tone : 'var(--text-2)',
        fontSize: 10, fontWeight: 700, letterSpacing: 0.6,
        display: 'flex', alignItems: 'center', gap: 5,
      }}>
        <span style={{
          width: 6, height: 6, borderRadius: 999,
          background: device.on ? device.tone : 'rgba(255,255,255,0.3)',
          boxShadow: device.on ? `0 0 6px ${device.tone}` : 'none',
          animation: device.on ? 'pulse 1.6s ease-in-out infinite' : 'none',
        }} />
        {device.kind === 'camera' ? 'LIVE' : 'OK'}
      </div>
    );
  }
  return <InlineToggle on={device.on} color={device.tone} onChange={() => {}} />;
};

// ─── Device-specific extended controls ───
const DeviceBody = ({ device }) => {
  const kind = device.kind;

  if (kind === 'stove') {
    const e = device.extra;
    return (
      <DeviceBodyLayout>
        <StatChip label="Target" value={`${e.target}°`} tone={device.tone} />
        <StatChip label="Fiamma" value={`${e.power}/5`} tone={device.tone} />
        <StatChip label="Ventola" value={`${e.fan}/5`} tone={device.tone} />
        <ControlRow>
          <MiniButton Icon={IconMinus} label="Meno" />
          <MiniButton Icon={IconPower} label="Power" tone={device.tone} filled={device.on} />
          <MiniButton Icon={IconPlus} label="Più" />
        </ControlRow>
      </DeviceBodyLayout>
    );
  }

  if (kind === 'thermo' || kind === 'valve') {
    const e = device.extra;
    return (
      <DeviceBodyLayout>
        <DualTempReadout current={e.current} target={e.target} tone={device.tone} />
        <ControlRow>
          <MiniButton Icon={IconMinus} label="−0.5°" />
          <MiniButton Icon={IconPlus} label="+0.5°" />
          <MiniButton label="Eco" />
          <MiniButton label="Auto" filled tone={device.tone} />
        </ControlRow>
      </DeviceBodyLayout>
    );
  }

  if (kind === 'light') {
    const e = device.extra;
    return (
      <DeviceBodyLayout>
        <SliderRow label="Luminosità" value={e.brightness} unit="%" tone={device.tone} disabled={!device.on} />
        <SliderRow label="Temperatura" value={e.temp} unit="K" min={2200} max={6500} tone={device.tone} disabled={!device.on} />
      </DeviceBodyLayout>
    );
  }

  if (kind === 'plug') {
    const e = device.extra;
    return (
      <DeviceBodyLayout>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <StatChip label="Ora" value={device.on ? (e.power >= 1000 ? `${(e.power/1000).toFixed(2)} kW` : `${e.power} W`) : '0 W'} tone={device.tone} />
          <StatChip label="Oggi" value={`${e.today} kWh`} tone={device.tone} />
        </div>
      </DeviceBodyLayout>
    );
  }

  if (kind === 'sonos') {
    const e = device.extra;
    return (
      <DeviceBodyLayout>
        <div style={{ fontSize: 12, color: 'var(--text-2)', padding: '6px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, marginBottom: 4, lineHeight: 1.4 }}>
          <span style={{ color: '#fff', fontWeight: 500 }}>{e.track}</span>
          {e.artist !== '—' && <span> · {e.artist}</span>}
        </div>
        <SliderRow label="Volume" value={e.volume} unit="%" icon={IconVolume} tone={device.tone} disabled={!device.on} />
        <ControlRow>
          <MiniButton Icon={IconSkipB} />
          <MiniButton Icon={e.playing ? IconPause : IconPlay} filled tone={device.tone} />
          <MiniButton Icon={IconSkipF} />
        </ControlRow>
      </DeviceBodyLayout>
    );
  }

  if (kind === 'tv') {
    const e = device.extra;
    return (
      <DeviceBodyLayout>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <StatChip label="Sorgente" value={e.source} tone={device.tone} />
          <StatChip label="Volume" value={`${e.volume}`} tone={device.tone} />
        </div>
        <ControlRow>
          <MiniButton label="HDMI 1" filled={e.source === 'HDMI 1'} tone={device.tone} />
          <MiniButton label="HDMI 2" filled={e.source === 'HDMI 2'} tone={device.tone} />
          <MiniButton label="App" />
        </ControlRow>
      </DeviceBodyLayout>
    );
  }

  if (kind === 'shade') {
    const e = device.extra;
    return (
      <DeviceBodyLayout>
        <SliderRow label="Posizione" value={e.position} unit="%" tone={device.tone} />
        <ControlRow>
          <MiniButton Icon={IconChevU} label="Su" />
          <MiniButton label="Stop" />
          <MiniButton Icon={IconChevD} label="Giù" />
        </ControlRow>
      </DeviceBodyLayout>
    );
  }

  if (kind === 'camera') {
    const e = device.extra;
    return (
      <DeviceBodyLayout>
        <div style={{
          aspectRatio: '16/9', borderRadius: 10, position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(135deg, #0a1a0a 0%, #0a0908 100%)',
          border: '0.5px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{
            position: 'absolute', top: 6, left: 8,
            fontSize: 9, fontWeight: 700, color: '#6aa86a', letterSpacing: 0.8,
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <span style={{ width: 5, height: 5, borderRadius: 999, background: '#6aa86a', animation: 'pulse 1.4s ease-in-out infinite' }} />
            LIVE · {e.fps}fps
          </div>
          <div style={{
            position: 'absolute', bottom: 6, left: 8, right: 8,
            fontSize: 10, color: 'rgba(255,255,255,0.65)',
          }}>
            Movimento {e.motion}
          </div>
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: 46, height: 46, borderRadius: 999,
            background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
          }}>
            <IconPlay size={18} sw={2} />
          </div>
        </div>
      </DeviceBodyLayout>
    );
  }

  if (kind === 'sensor') {
    const e = device.extra;
    return (
      <DeviceBodyLayout>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <StatChip label="Valore" value={`${e.humidity}%`} tone={device.tone} />
          <StatChip label="Trend" value={e.trend} tone={device.tone} />
        </div>
      </DeviceBodyLayout>
    );
  }

  return null;
};

// ─── Building blocks ───
const DeviceBodyLayout = ({ children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</div>
);

const StatChip = ({ label, value, tone }) => (
  <div style={{
    background: 'rgba(255,255,255,0.04)',
    border: '0.5px solid rgba(255,255,255,0.06)',
    borderRadius: 10, padding: '8px 10px',
  }}>
    <div style={{ fontSize: 10, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</div>
    <div style={{
      fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, color: '#fff',
      letterSpacing: -0.3, marginTop: 2, fontVariantNumeric: 'tabular-nums',
    }}>{value}</div>
  </div>
);

const DualTempReadout = ({ current, target, tone }) => (
  <div style={{
    display: 'flex', alignItems: 'baseline', gap: 14,
    background: 'rgba(255,255,255,0.04)',
    border: '0.5px solid rgba(255,255,255,0.06)',
    borderRadius: 12, padding: '10px 14px',
  }}>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 10, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: 0.8 }}>Attuale</div>
      <div style={{
        fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: '#fff',
        letterSpacing: -0.6, fontVariantNumeric: 'tabular-nums', marginTop: 2,
      }}>
        {current.toFixed(1)}<span style={{ fontSize: 13, opacity: 0.5 }}>°</span>
      </div>
    </div>
    <IconChevR size={14} sw={2} />
    <div style={{ flex: 1, textAlign: 'right' }}>
      <div style={{ fontSize: 10, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: 0.8 }}>Target</div>
      <div style={{
        fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: tone,
        letterSpacing: -0.6, fontVariantNumeric: 'tabular-nums', marginTop: 2,
      }}>
        {target}<span style={{ fontSize: 13, opacity: 0.5 }}>°</span>
      </div>
    </div>
  </div>
);

const SliderRow = ({ label, value, unit = '', icon: Icon, tone, min = 0, max = 100, disabled }) => {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ opacity: disabled ? 0.45 : 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-2)' }}>
          {Icon && <Icon size={12} sw={2} />}
          {label}
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
          {value}{unit}
        </div>
      </div>
      <div style={{
        height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.08)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`,
          background: `linear-gradient(90deg, ${tone} 0%, color-mix(in oklab, ${tone} 70%, #fff) 100%)`,
          borderRadius: 999,
          boxShadow: disabled ? 'none' : `0 0 8px color-mix(in oklab, ${tone} 40%, transparent)`,
        }} />
      </div>
    </div>
  );
};

const ControlRow = ({ children }) => (
  <div style={{ display: 'flex', gap: 6 }}>{children}</div>
);

const MiniButton = ({ Icon, label, filled, tone = 'var(--accent)' }) => (
  <button style={{
    flex: 1, height: 34, borderRadius: 10, border: 'none', cursor: 'pointer',
    background: filled ? `color-mix(in oklab, ${tone} 22%, rgba(255,255,255,0.04))` : 'rgba(255,255,255,0.05)',
    color: filled ? tone : '#fff',
    border: filled ? `0.5px solid color-mix(in oklab, ${tone} 35%, transparent)` : '0.5px solid rgba(255,255,255,0.06)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
    fontSize: 11, fontWeight: 600, letterSpacing: 0.2,
    boxShadow: filled ? `0 0 10px color-mix(in oklab, ${tone} 25%, transparent)` : 'none',
  }}>
    {Icon && <Icon size={12} sw={2.4} />}
    {label && <span>{label}</span>}
  </button>
);

Object.assign(window, { RoomsTab, RoomCard, RoomSheet, DeviceChip, getDevicesForRoom });
