// Main app — wires everything together: dashboard, tab bar, sheets, tweaks panel

const { useState: useAppState, useEffect: useAppEffect } = React;

// Presets for accent hue (oklch with consistent L=0.65, C=0.17)
const ACCENT_PRESETS = {
  Copper: 'oklch(0.68 0.17 45)',   // the signature ember
  Coral:  'oklch(0.7 0.17 25)',
  Amber:  'oklch(0.76 0.15 75)',
  Sage:   'oklch(0.68 0.12 150)',
  Ocean:  'oklch(0.65 0.14 230)',
  Violet: 'oklch(0.65 0.17 290)',
  Rose:   'oklch(0.68 0.17 0)',
};

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "Copper",
  "density": "Media",
  "glass": 24,
  "radius": 24,
  "ambient": true
}/*EDITMODE-END*/;

const INITIAL_STATE = {
  stove:      { on: true,  power: 3, fan: 2, temp: 22, target: 21 },
  thermostat: {
    mode: 'Auto',
    zones: [
      { name: 'Soggiorno',   kind: 'termostato', current: 21.5, target: 21, on: true  },
      { name: 'Camera matr.',kind: 'valvola',    current: 19.2, target: 19, on: true  },
      { name: 'Studio',      kind: 'valvola',    current: 20.1, target: 20, on: true  },
      { name: 'Cameretta',   kind: 'valvola',    current: 18.4, target: 19, on: true  },
      { name: 'Bagno',       kind: 'valvola',    current: 22.0, target: 22, on: false },
    ],
  },
  lights: [
    { name: 'Soggiorno principale', room: 'Soggiorno', on: true  },
    { name: 'Tavolo da pranzo',     room: 'Soggiorno', on: true  },
    { name: 'Lettura divano',       room: 'Soggiorno', on: false },
    { name: 'Cucina piano',         room: 'Cucina',    on: false },
    { name: 'Cucina isola',         room: 'Cucina',    on: true  },
    { name: 'Camera matrim.',       room: 'Camera',    on: false },
    { name: 'Comodini',             room: 'Camera',    on: false },
    { name: 'Scrivania',            room: 'Studio',    on: true  },
    { name: 'Libreria',             room: 'Studio',    on: false },
    { name: 'Specchio bagno',       room: 'Bagno',     on: false },
    { name: 'Ingresso',             room: 'Ingresso',  on: true  },
    { name: 'Portico',              room: 'Esterno',   on: false },
  ],
  weather:    { temp: 8, city: 'Bolzano', condition: 'Nuvoloso', high: 11, low: 3 },
  sonos:      {
    groups: [
      { name: 'Soggiorno',      playing: true,  track: 'Weightless',      artist: 'Marconi Union', volume: 55 },
      { name: 'Cucina',         playing: true,  track: 'Morning Coffee',  artist: 'Lofi Radio',    volume: 32 },
      { name: 'Camera matr.',   playing: false, track: '—',               artist: '—',             volume: 0  },
      { name: 'Studio',         playing: false, track: 'Deep Focus',      artist: 'Paused',        volume: 40 },
    ],
  },
  network:    { up: 18, down: 142, devices: 24 },
  raspi:      { cpu: 34, ram: 58, temp: 52 },
  plugs: [
    { name: 'Caricatore Tesla',    room: 'Garage',    on: true,  power: 3400 },
    { name: 'TV + console',        room: 'Soggiorno', on: true,  power: 124  },
    { name: 'Lampada scrivania',   room: 'Studio',    on: true,  power: 9    },
    { name: 'Boiler cantina',      room: 'Cantina',   on: false, power: 0    },
    { name: 'Stampante 3D',        room: 'Studio',    on: false, power: 0    },
    { name: 'Deumidificatore',     room: 'Bagno',     on: false, power: 0    },
  ],
};

function App() {
  const [tweaks, setTweaks] = useAppState(TWEAK_DEFAULTS);
  const [tweaksVisible, setTweaksVisible] = useAppState(false);
  const [state, setState] = useAppState(INITIAL_STATE);
  const [sheet, setSheet] = useAppState(null); // 'stove' | 'thermo' | 'lights' | 'sonos' | null
  const [tab, setTab] = useAppState('home');
  const [notif, setNotif] = useAppState(null);

  // Tweaks host protocol
  useAppEffect(() => {
    const onMsg = (e) => {
      if (e.data?.type === '__activate_edit_mode') setTweaksVisible(true);
      if (e.data?.type === '__deactivate_edit_mode') setTweaksVisible(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);

  const updateTweak = (k, v) => {
    setTweaks((t) => ({ ...t, [k]: v }));
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { [k]: v } }, '*');
  };

  const accent = ACCENT_PRESETS[tweaks.accent] || ACCENT_PRESETS.Copper;
  const density = tweaks.density;
  const pad = density === 'Compatta' ? 12 : density === 'Ariosa' ? 22 : 16;
  const gap = density === 'Compatta' ? 10 : density === 'Ariosa' ? 20 : 14;

  const cssVars = {
    '--accent': accent,
    '--font-display': '"Outfit", system-ui, sans-serif',
    '--font-body': '"Inter", system-ui, sans-serif',
    '--text-1': '#f5f5f4',
    '--text-2': 'rgba(245, 245, 244, 0.55)',
    '--glass-bg': `rgba(255,255,255,0.04)`,
    '--glass-blur': `${tweaks.glass}px`,
    '--glass-border': 'rgba(255,255,255,0.08)',
    '--glass-shadow': '0 8px 32px rgba(0,0,0,0.18), inset 0 0 0 0.5px rgba(255,255,255,0.03)',
    '--r-card': `${tweaks.radius}px`,
    '--pad-card': `${pad}px`,
  };

  const openSheet = (name) => setSheet(name);
  const closeSheet = () => setSheet(null);

  const toggleLights = () => setState((s) => {
    const allOff = s.lights.every(l => !l.on);
    return { ...s, lights: s.lights.map(l => ({ ...l, on: allOff })) };
  });

  // Rotate notification hint
  useAppEffect(() => {
    const hints = [
      { Icon: IconFlame, text: 'Stufa a regime · 22°C raggiunti' },
      { Icon: IconDroplet, text: 'Pellet al 62% · sufficiente per 3 giorni' },
      { Icon: IconCloud, text: 'Domani pioggia · auto-boost stufa alle 6:30' },
    ];
    let i = 0;
    setNotif(hints[0]);
    const id = setInterval(() => { i = (i + 1) % hints.length; setNotif(hints[i]); }, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ ...cssVars, position: 'absolute', inset: 0, color: 'var(--text-1)', fontFamily: 'var(--font-body)', overflow: 'hidden' }}>
      {/* Ambient background */}
      <AmbientBg on={tweaks.ambient} accent={accent} />

      {/* Content scroll */}
      <div style={{
        position: 'absolute', inset: 0, overflowY: 'auto',
        paddingTop: 0, paddingBottom: 100,
      }}>
        {tab === 'home' && <HomeTab state={state} gap={gap} openSheet={openSheet} toggleLights={toggleLights} notif={notif} />}
        {tab === 'rooms' && <RoomsTab state={state} />}
        {tab === 'automations' && <AutomationsTab />}
        {tab === 'more' && <MoreTab />}
      </div>

      {/* Tab bar */}
      <TabBar current={tab} onChange={setTab} />

      {/* Sheets */}
      <StoveSheet  state={state} set={setState} open={sheet === 'stove'}  onClose={closeSheet} />
      <ThermoSheet state={state} set={setState} open={sheet === 'thermo'} onClose={closeSheet} />
      <LightsSheet state={state} set={setState} open={sheet === 'lights'} onClose={closeSheet} />
      <SonosSheet  state={state} set={setState} open={sheet === 'sonos'}  onClose={closeSheet} />
      <PlugsSheet  state={state} set={setState} open={sheet === 'plugs'}  onClose={closeSheet} />

      {/* Tweaks */}
      {tweaksVisible && <TweaksPanel tweaks={tweaks} update={updateTweak} presets={Object.keys(ACCENT_PRESETS)} />}
    </div>
  );
}

// ───────── Ambient background ─────────
const AmbientBg = ({ on, accent }) => (
  <>
    <div style={{
      position: 'absolute', inset: 0,
      background: 'linear-gradient(180deg, #0a0908 0%, #1c1917 50%, #0a0908 100%)',
    }} />
    {on && (
      <>
        <div style={{
          position: 'absolute', top: -60, left: -60, width: 320, height: 320, borderRadius: 999,
          background: `radial-gradient(circle, color-mix(in oklab, ${accent} 60%, transparent) 0%, transparent 70%)`,
          filter: 'blur(60px)', opacity: 0.5,
          animation: 'ambientA 14s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', bottom: 120, right: -80, width: 360, height: 360, borderRadius: 999,
          background: `radial-gradient(circle, color-mix(in oklab, ${accent} 40%, #301010) 0%, transparent 70%)`,
          filter: 'blur(70px)', opacity: 0.4,
          animation: 'ambientB 18s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', top: '40%', left: '30%', width: 260, height: 260, borderRadius: 999,
          background: 'radial-gradient(circle, rgba(94,175,255,0.25) 0%, transparent 70%)',
          filter: 'blur(80px)', opacity: 0.4,
          animation: 'ambientC 22s ease-in-out infinite',
        }} />
      </>
    )}
    {/* grain */}
    <div style={{
      position: 'absolute', inset: 0, opacity: 0.04, pointerEvents: 'none',
      backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/></filter><rect width='200' height='200' filter='url(%23n)'/></svg>")`,
    }} />
  </>
);

// ───────── Home tab ─────────
const HomeTab = ({ state, gap, openSheet, toggleLights }) => (
  <div style={{ paddingTop: 54 }}>
    <Header />
    <div style={{ padding: '8px 12px 0' }}>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap,
      }}>
        <StoveCard state={state} onOpen={() => openSheet('stove')} />
        <ThermostatCard state={state} onOpen={() => openSheet('thermo')} />
        <WeatherCard state={state} />
        <LightsCard state={state} onOpen={() => openSheet('lights')} onToggle={toggleLights} />
        <SonosCard state={state} onOpen={() => openSheet('sonos')} />
        <CameraCard state={state} onOpen={() => {}} />
        <TuyaCard state={state} onOpen={() => openSheet('plugs')} />
        <NetworkCard state={state} onOpen={() => {}} />
        <RaspiCard state={state} />
      </div>
    </div>
  </div>
);

const Header = () => {
  const now = new Date();
  const hh = now.getHours();
  const greet = hh < 6 ? 'Buonanotte' : hh < 12 ? 'Buongiorno' : hh < 18 ? 'Buon pomeriggio' : 'Buonasera';
  return (
    <div style={{ padding: '12px 20px 14px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500 }}>{greet}</div>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, color: '#fff',
          letterSpacing: -0.7, lineHeight: 1.1, marginTop: 2,
        }}>

        </div>
      </div>
    </div>
  );
};

const HeaderPill = ({ Icon, dot }) => (
  <button style={{
    position: 'relative',
    width: 40, height: 40, borderRadius: 999, border: 'none', cursor: 'pointer',
    background: 'rgba(255,255,255,0.06)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '0.5px solid rgba(255,255,255,0.08)',
    color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}>
    <Icon size={18} sw={2} />
    {dot && <div style={{ position: 'absolute', top: 9, right: 10, width: 7, height: 7, borderRadius: 999, background: 'var(--accent)' }} />}
  </button>
);

const NotificationBar = ({ Icon, text }) => (
  <div style={{
    margin: '0 12px 12px', padding: '12px 14px', borderRadius: 16,
    background: 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
    border: '0.5px solid rgba(255,255,255,0.06)',
    display: 'flex', alignItems: 'center', gap: 10,
  }}>
    <div style={{
      width: 28, height: 28, borderRadius: 8, flexShrink: 0,
      background: 'color-mix(in oklab, var(--accent) 20%, transparent)',
      color: 'var(--accent)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon size={14} sw={2} />
    </div>
    <div style={{ fontSize: 13, color: 'var(--text-1)', flex: 1, lineHeight: 1.4 }}>{text}</div>
    <IconChevR size={14} stroke="var(--text-2)" />
  </div>
);

// ───────── Other tabs (stubs) ─────────
// RoomsTab is defined in components/rooms.jsx

// AutomationsTab is defined in components/automations.jsx

const MoreTab = () => {
  const items = [
    [
      { Icon: IconCalendar, label: 'Orari stufa', tone: 'var(--accent)' },
      { Icon: IconAlert, label: 'Errori & manutenzione', tone: '#ff6676' },
      { Icon: IconClock, label: 'Registro eventi', tone: 'var(--text-2)' },
    ],
    [
      { Icon: IconShield, label: 'Sicurezza & privacy', tone: '#5eafff' },
      { Icon: IconBell, label: 'Notifiche', tone: '#ffb84a' },
      { Icon: IconSettings, label: 'Impostazioni', tone: 'var(--text-2)' },
    ],
  ];
  return (
    <div style={{ paddingTop: 70, paddingBottom: 20 }}>
      <div style={{ padding: '0 20px 20px' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 600, color: '#fff', letterSpacing: -0.8 }}>Altro</div>
      </div>
      <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map((group, gi) => (
          <div key={gi} style={{
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            borderRadius: 20, border: '0.5px solid rgba(255,255,255,0.06)', overflow: 'hidden',
          }}>
            {group.map((item, i) => (
              <div key={item.label} style={{
                display: 'flex', alignItems: 'center', padding: '14px 16px', gap: 12,
                borderBottom: i < group.length - 1 ? '0.5px solid rgba(255,255,255,0.06)' : 'none',
                cursor: 'pointer',
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 9,
                  background: `color-mix(in oklab, ${item.tone} 20%, transparent)`,
                  color: item.tone,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `0.5px solid color-mix(in oklab, ${item.tone} 25%, transparent)`,
                }}>
                  <item.Icon size={16} sw={2} />
                </div>
                <div style={{ flex: 1, fontSize: 15, color: '#fff' }}>{item.label}</div>
                <IconChevR size={14} stroke="var(--text-2)" />
              </div>
            ))}
          </div>
        ))}
        <div style={{ textAlign: 'center', marginTop: 12, fontSize: 11, color: 'var(--text-2)' }}>
          Smart Home · v19.0
        </div>
      </div>
    </div>
  );
};

// ───────── Tab bar ─────────
const TabBar = ({ current, onChange }) => {
  const tabs = [
    { id: 'home', label: 'Casa', Icon: IconHome },
    { id: 'rooms', label: 'Stanze', Icon: IconGrid },
    { id: 'automations', label: 'Automazioni', Icon: IconZap },
    { id: 'more', label: 'Altro', Icon: IconMore },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 16, left: 12, right: 12, zIndex: 150,
      borderRadius: 28,
      background: 'rgba(18, 15, 14, 0.75)',
      backdropFilter: 'blur(30px) saturate(180%)',
      WebkitBackdropFilter: 'blur(30px) saturate(180%)',
      border: '0.5px solid rgba(255,255,255,0.1)',
      boxShadow: '0 12px 40px rgba(0,0,0,0.4), inset 1px 1px 0 rgba(255,255,255,0.06)',
      padding: 6,
      display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
    }}>
      {tabs.map((t) => {
        const active = current === t.id;
        return (
          <button key={t.id} onClick={() => onChange(t.id)} style={{
            padding: '10px 0 8px', borderRadius: 22, border: 'none', cursor: 'pointer',
            background: active ? 'color-mix(in oklab, var(--accent) 18%, transparent)' : 'transparent',
            color: active ? 'var(--accent)' : 'rgba(255,255,255,0.55)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            transition: 'background .22s, color .22s',
            position: 'relative',
          }}>
            <t.Icon size={22} sw={active ? 2.2 : 1.8} />
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.1 }}>{t.label}</div>
          </button>
        );
      })}
    </div>
  );
};

// ───────── Tweaks panel ─────────
const TweaksPanel = ({ tweaks, update, presets }) => (
  <div style={{
    position: 'absolute', top: 60, right: 10, zIndex: 500,
    width: 230, borderRadius: 20, padding: 14,
    background: 'rgba(18,15,14,0.92)',
    backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)',
    border: '0.5px solid rgba(255,255,255,0.12)',
    boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
    fontSize: 12, color: '#fff',
  }}>
    <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, marginBottom: 10 }}>Tweaks</div>

    <TweakLabel>Colore accent</TweakLabel>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
      {presets.map((p) => (
        <button key={p} onClick={() => update('accent', p)} style={{
          width: 24, height: 24, borderRadius: 999, border: 'none', cursor: 'pointer',
          background: ACCENT_PRESETS[p],
          boxShadow: tweaks.accent === p ? '0 0 0 2px #fff, 0 0 0 3px rgba(0,0,0,0.5)' : 'inset 0 0 0 0.5px rgba(255,255,255,0.2)',
        }} title={p} />
      ))}
    </div>

    <TweakLabel>Densità</TweakLabel>
    <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
      {['Compatta','Media','Ariosa'].map((d) => (
        <button key={d} onClick={() => update('density', d)} style={{
          flex: 1, padding: '7px 4px', borderRadius: 10, border: 'none', cursor: 'pointer',
          fontSize: 11, fontWeight: 600,
          background: tweaks.density === d ? 'var(--accent)' : 'rgba(255,255,255,0.08)',
          color: tweaks.density === d ? '#1a0f08' : '#fff',
        }}>{d}</button>
      ))}
    </div>

    <TweakLabel>Glass blur <span style={{ opacity: 0.5, fontWeight: 400 }}>{tweaks.glass}px</span></TweakLabel>
    <input type="range" min="0" max="40" value={tweaks.glass}
      onChange={(e) => update('glass', Number(e.target.value))}
      style={{ width: '100%', marginBottom: 12, accentColor: '#fff' }} />

    <TweakLabel>Radius card <span style={{ opacity: 0.5, fontWeight: 400 }}>{tweaks.radius}px</span></TweakLabel>
    <input type="range" min="8" max="32" value={tweaks.radius}
      onChange={(e) => update('radius', Number(e.target.value))}
      style={{ width: '100%', marginBottom: 12, accentColor: '#fff' }} />

    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
      <TweakLabel style={{ marginBottom: 0 }}>Bagliore ambient</TweakLabel>
      <InlineToggle on={tweaks.ambient} color="var(--accent)" onChange={() => update('ambient', !tweaks.ambient)} />
    </div>
  </div>
);

const TweakLabel = ({ children, style }) => (
  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6, ...style }}>
    {children}
  </div>
);

Object.assign(window, { App, ACCENT_PRESETS });
