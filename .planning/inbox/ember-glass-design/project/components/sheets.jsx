// Bottom sheets — swipe-from-bottom modal controls

const { useState: useSheetState, useEffect: useSheetEffect } = React;

const Sheet = ({ open, onClose, children, height = 'auto', title }) => {
  useSheetEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      {/* backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute', inset: 0, zIndex: 200,
          background: open ? 'rgba(0,0,0,0.5)' : 'transparent',
          backdropFilter: open ? 'blur(8px)' : 'none',
          WebkitBackdropFilter: open ? 'blur(8px)' : 'none',
          transition: 'background .3s, backdrop-filter .3s',
          pointerEvents: open ? 'auto' : 'none',
        }}
      />
      {/* sheet */}
      <div style={{
        position: 'absolute', left: 8, right: 8, bottom: 8, zIndex: 201,
        borderRadius: 32,
        background: 'rgba(28, 25, 23, 0.85)',
        backdropFilter: 'blur(40px) saturate(200%)',
        WebkitBackdropFilter: 'blur(40px) saturate(200%)',
        border: '0.5px solid rgba(255,255,255,0.12)',
        boxShadow: '0 -20px 60px rgba(0,0,0,0.5), inset 1px 1px 0 rgba(255,255,255,0.08)',
        padding: '10px 20px 30px',
        maxHeight: '85%',
        overflowY: 'auto',
        transform: open ? 'translateY(0)' : 'translateY(110%)',
        transition: 'transform .4s cubic-bezier(.22,1,.36,1)',
      }}>
        {/* grabber */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0 12px' }}>
          <div style={{ width: 40, height: 5, borderRadius: 999, background: 'rgba(255,255,255,0.2)' }} />
        </div>
        {title && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: '#fff' }}>
              {title}
            </div>
            <button onClick={onClose} style={{
              width: 32, height: 32, borderRadius: 999, border: 'none',
              background: 'rgba(255,255,255,0.1)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}>
              <IconX size={16} sw={2.2} />
            </button>
          </div>
        )}
        {children}
      </div>
    </>
  );
};

// ───────── Stove sheet ─────────
const StoveSheet = ({ state, set, open, onClose }) => {
  const s = state.stove;
  return (
    <Sheet open={open} onClose={onClose} title="Stufa">
      <div style={{
        borderRadius: 24, padding: '24px 20px',
        background: s.on
          ? `linear-gradient(160deg, color-mix(in oklab, var(--accent) 25%, transparent) 0%, transparent 70%)`
          : 'rgba(255,255,255,0.03)',
        border: '0.5px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', gap: 20,
      }}>
        <FlameViz on={s.on} intensity={s.power / 5} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: 1 }}>
            {s.on ? 'In funzione' : 'Spenta'}
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 54, fontWeight: 600, color: '#fff', lineHeight: 1, letterSpacing: -2 }}>
            {s.temp}<span style={{ fontSize: 22, opacity: 0.5 }}>°C</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4 }}>
            Obiettivo {s.target}°C · Pellet 62%
          </div>
        </div>
      </div>

      <SheetRow label="Livello fiamma" value={`${s.power}/5`}>
        <Stepper value={s.power} min={1} max={5}
                 onChange={(v) => set((st) => ({ ...st, stove: { ...st.stove, power: v } }))} />
      </SheetRow>

      <SheetRow label="Ventola" value={`${s.fan}/5`}>
        <Stepper value={s.fan} min={1} max={5}
                 onChange={(v) => set((st) => ({ ...st, stove: { ...st.stove, fan: v } }))} />
      </SheetRow>

      <SheetRow label="Temperatura obiettivo" value={`${s.target}°C`}>
        <Slider value={s.target} min={15} max={28}
                onChange={(v) => set((st) => ({ ...st, stove: { ...st.stove, target: v } }))} />
      </SheetRow>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 22 }}>
        <SheetBtn Icon={IconCalendar} label="Orari" />
        <SheetBtn Icon={IconAlert} label="Manutenzione" />
      </div>

      <button onClick={() => set((st) => ({ ...st, stove: { ...st.stove, on: !st.stove.on } }))}
        style={{
          marginTop: 18, width: '100%', height: 56, borderRadius: 18, border: 'none',
          fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, cursor: 'pointer',
          background: s.on
            ? 'rgba(255, 77, 92, 0.15)' : 'var(--accent)',
          color: s.on ? '#ff6676' : '#1a0f08',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          boxShadow: s.on ? 'none' : '0 0 30px color-mix(in oklab, var(--accent) 40%, transparent)',
          border: s.on ? '0.5px solid rgba(255, 77, 92, 0.25)' : 'none',
        }}>
        <IconPower size={18} sw={2.2} />
        {s.on ? 'Spegni stufa' : 'Accendi stufa'}
      </button>
    </Sheet>
  );
};

// ───────── Thermostat sheet ─────────
const ThermoSheet = ({ state, set, open, onClose }) => {
  const t = state.thermostat;
  const modes = ['Auto', 'Manuale', 'Eco', 'Off'];
  const [selectedIdx, setSelectedIdx] = useSheetState(0);
  const zone = t.zones[selectedIdx];

  const updateZone = (patch) => set((st) => {
    const zones = st.thermostat.zones.map((z, i) => i === selectedIdx ? { ...z, ...patch } : z);
    return { ...st, thermostat: { ...st.thermostat, zones } };
  });

  return (
    <Sheet open={open} onClose={onClose} title="Clima">
      {/* Zone selector */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, margin: '0 -20px 18px', padding: '0 20px 4px' }}>
        {t.zones.map((z, i) => (
          <button key={z.name}
            onClick={() => setSelectedIdx(i)}
            style={{
              flexShrink: 0, padding: '10px 14px', borderRadius: 12, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
              background: selectedIdx === i ? 'rgba(94,175,255,0.18)' : 'rgba(255,255,255,0.05)',
              color: selectedIdx === i ? '#5eafff' : 'var(--text-2)',
              border: selectedIdx === i ? '0.5px solid rgba(94,175,255,0.4)' : '0.5px solid rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
            <div style={{
              width: 6, height: 6, borderRadius: 999,
              background: z.on ? '#5eafff' : 'rgba(255,255,255,0.25)',
              boxShadow: z.on ? '0 0 6px #5eafff' : 'none',
            }} />
            {z.name}
          </button>
        ))}
      </div>

      <RadialDial value={zone.target} min={15} max={28} color="#5eafff"
                  label={`${zone.name} · attuale ${zone.current.toFixed(1)}°`}
                  onChange={(v) => updateZone({ target: v })} />

      <SheetRow label="Tipo" value={zone.kind === 'termostato' ? 'Termostato di stanza' : 'Termovalvola radiatore'}>
        <InlineToggle on={zone.on} color="#5eafff" onChange={() => updateZone({ on: !zone.on })} />
      </SheetRow>

      <div style={{ fontSize: 11, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 22, marginBottom: 10 }}>
        Modalità globale
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {modes.map((m) => (
          <button key={m}
            onClick={() => set((st) => ({ ...st, thermostat: { ...st.thermostat, mode: m } }))}
            style={{
              padding: '14px 8px', borderRadius: 14, cursor: 'pointer',
              fontSize: 13, fontWeight: 600,
              background: t.mode === m ? 'rgba(94,175,255,0.2)' : 'rgba(255,255,255,0.05)',
              color: t.mode === m ? '#5eafff' : 'var(--text-2)',
              border: t.mode === m ? '0.5px solid rgba(94,175,255,0.4)' : '0.5px solid rgba(255,255,255,0.06)',
            }}>
            {m}
          </button>
        ))}
      </div>
    </Sheet>
  );
};

// ───────── Lights sheet ─────────
const LightsSheet = ({ state, set, open, onClose }) => {
  const lights = state.lights;
  const onCount = lights.filter(l => l.on).length;

  const toggleLight = (i) => set((st) => ({
    ...st,
    lights: st.lights.map((l, j) => j === i ? { ...l, on: !l.on } : l),
  }));
  const setAll = (on) => set((st) => ({ ...st, lights: st.lights.map(l => ({ ...l, on })) }));

  // group by room
  const byRoom = lights.reduce((acc, l, i) => {
    (acc[l.room] = acc[l.room] || []).push({ ...l, idx: i });
    return acc;
  }, {});

  const scenes = [
    { name: 'Rilassante', color: 'linear-gradient(135deg, #ff8a5c, #b080ff)' },
    { name: 'Concentrato', color: 'linear-gradient(135deg, #fff3c4, #5eafff)' },
    { name: 'Cena', color: 'linear-gradient(135deg, #ffb84a, #ff8a5c)' },
    { name: 'Notte', color: 'linear-gradient(135deg, #2a3a6a, #b080ff)' },
  ];

  return (
    <Sheet open={open} onClose={onClose} title="Luci">
      {/* Summary + quick actions */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 10, marginBottom: 18,
        alignItems: 'center',
      }}>
        <div style={{
          padding: '14px 18px', borderRadius: 16,
          background: onCount > 0 ? 'rgba(245,200,74,0.1)' : 'rgba(255,255,255,0.04)',
          border: `0.5px solid ${onCount > 0 ? 'rgba(245,200,74,0.25)' : 'rgba(255,255,255,0.06)'}`,
        }}>
          <div style={{ fontSize: 11, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: 0.8 }}>Accese</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, color: '#fff', marginTop: 2, letterSpacing: -0.5 }}>
            {onCount}<span style={{ fontSize: 14, color: 'var(--text-2)', marginLeft: 4 }}>/ {lights.length}</span>
          </div>
        </div>
        <button onClick={() => setAll(true)} style={quickBtn(onCount === lights.length)}>
          Tutte on
        </button>
        <button onClick={() => setAll(false)} style={quickBtn(false)}>
          Tutte off
        </button>
      </div>

      {/* Scenes */}
      <div style={{ fontSize: 11, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
        Scene
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {scenes.map((s) => (
          <button key={s.name} style={{
            padding: 12, borderRadius: 14, cursor: 'pointer',
            background: 'rgba(255,255,255,0.04)',
            border: '0.5px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
          }}>
            <div style={{ width: 28, height: 28, borderRadius: 9, background: s.color }} />
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{s.name}</div>
          </button>
        ))}
      </div>

      {/* Lights grouped by room */}
      {Object.entries(byRoom).map(([room, items]) => (
        <div key={room}>
          <div style={{ fontSize: 11, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 20, marginBottom: 8 }}>
            {room}
          </div>
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, border: '0.5px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            {items.map((l, i) => (
              <div key={l.name} style={{
                display: 'flex', alignItems: 'center', padding: '12px 14px', gap: 12,
                borderBottom: i < items.length - 1 ? '0.5px solid rgba(255,255,255,0.06)' : 'none',
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                  background: l.on ? 'rgba(245,200,74,0.18)' : 'rgba(255,255,255,0.05)',
                  color: l.on ? '#f5c84a' : 'rgba(255,255,255,0.3)',
                  border: `0.5px solid ${l.on ? 'rgba(245,200,74,0.3)' : 'rgba(255,255,255,0.06)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: l.on ? '0 0 12px rgba(245,200,74,0.25)' : 'none',
                }}>
                  <IconBulb size={15} sw={2} />
                </div>
                <div style={{ flex: 1, fontSize: 14, color: '#fff', fontWeight: 500 }}>{l.name}</div>
                <InlineToggle on={l.on} color="#f5c84a" onChange={() => toggleLight(l.idx)} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </Sheet>
  );
};

const quickBtn = (active) => ({
  padding: '10px 14px', borderRadius: 12, border: 'none', cursor: 'pointer',
  fontSize: 12, fontWeight: 600,
  background: active ? 'rgba(245,200,74,0.18)' : 'rgba(255,255,255,0.05)',
  color: active ? '#f5c84a' : '#fff',
  border: `0.5px solid ${active ? 'rgba(245,200,74,0.3)' : 'rgba(255,255,255,0.06)'}`,
  whiteSpace: 'nowrap',
});

// ───────── Sonos sheet ─────────
const SonosSheet = ({ state, set, open, onClose }) => {
  const s = state.sonos;
  const [selectedIdx, setSelectedIdx] = useSheetState(0);
  const group = s.groups[selectedIdx];

  const updateGroup = (patch) => set((st) => {
    const groups = st.sonos.groups.map((g, i) => i === selectedIdx ? { ...g, ...patch } : g);
    return { ...st, sonos: { ...st.sonos, groups } };
  });

  const toggleAll = () => {
    const anyPlaying = s.groups.some(g => g.playing);
    set((st) => ({
      ...st, sonos: {
        ...st.sonos,
        groups: st.sonos.groups.map(g => ({ ...g, playing: !anyPlaying && g.track !== '—' }))
      }
    }));
  };

  return (
    <Sheet open={open} onClose={onClose} title="Sonos">
      {/* Group list */}
      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 18, border: '0.5px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        {s.groups.map((g, i) => (
          <div key={g.name}
            onClick={() => setSelectedIdx(i)}
            style={{
              display: 'flex', alignItems: 'center', padding: '12px 14px', gap: 12,
              borderBottom: i < s.groups.length - 1 ? '0.5px solid rgba(255,255,255,0.06)' : 'none',
              cursor: 'pointer',
              background: selectedIdx === i ? 'rgba(176,128,255,0.08)' : 'transparent',
            }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: g.playing
                ? 'linear-gradient(135deg, #b080ff 0%, #5eafff 100%)'
                : 'rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: g.playing ? '0 0 16px rgba(176,128,255,0.35)' : 'none',
            }}>
              {g.playing ? <PlayingBars /> : <IconMusic size={14} stroke="rgba(255,255,255,0.35)" />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{g.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 1 }}>
                {g.playing ? `${g.track} · ${g.artist}` : 'Non in riproduzione'}
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setSelectedIdx(i); updateGroup({ playing: !g.playing }); }}
              style={{
                width: 34, height: 34, borderRadius: 999, border: 'none', cursor: 'pointer',
                background: g.playing ? '#fff' : 'rgba(255,255,255,0.08)',
                color: g.playing ? '#1a0f08' : '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
              {g.playing ? <IconPause size={14} sw={2.4} /> : <IconPlay size={14} sw={2.4} />}
            </button>
          </div>
        ))}
      </div>

      {/* Selected group volume */}
      <div style={{ fontSize: 11, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 20, marginBottom: 10 }}>
        Volume · {group.name}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <IconVolume size={16} stroke="rgba(255,255,255,0.5)" sw={2} />
        <input type="range" min="0" max="100" value={group.volume}
          onChange={(e) => updateGroup({ volume: Number(e.target.value) })}
          style={{ flex: 1, accentColor: '#b080ff' }} />
        <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', minWidth: 32, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
          {group.volume}
        </div>
      </div>

      <button onClick={toggleAll} style={{
        marginTop: 22, width: '100%', height: 52, borderRadius: 16, border: 'none',
        fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, cursor: 'pointer',
        background: 'rgba(176,128,255,0.15)', color: '#b080ff',
        border: '0.5px solid rgba(176,128,255,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      }}>
        <IconPower size={16} sw={2.2} />
        {s.groups.some(g => g.playing) ? 'Pausa ovunque' : 'Riproduci ovunque'}
      </button>
    </Sheet>
  );
};

// ───────── Plugs sheet ─────────
const PlugsSheet = ({ state, set, open, onClose }) => {
  const plugs = state.plugs;
  const onCount = plugs.filter(p => p.on).length;
  const totalPower = plugs.reduce((s, p) => s + p.power, 0);

  const togglePlug = (i) => set((st) => ({
    ...st,
    plugs: st.plugs.map((p, j) => j === i ? { ...p, on: !p.on, power: p.on ? 0 : (p.power || 50) } : p),
  }));

  return (
    <Sheet open={open} onClose={onClose} title="Prese smart">
      {/* Summary */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18,
      }}>
        <div style={{
          padding: '16px 18px', borderRadius: 18,
          background: 'rgba(255,184,74,0.08)', border: '0.5px solid rgba(255,184,74,0.2)',
        }}>
          <div style={{ fontSize: 11, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: 0.8 }}>Accese</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, color: '#fff', marginTop: 4, letterSpacing: -0.5 }}>
            {onCount}<span style={{ fontSize: 14, color: 'var(--text-2)', marginLeft: 4 }}>/ {plugs.length}</span>
          </div>
        </div>
        <div style={{
          padding: '16px 18px', borderRadius: 18,
          background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ fontSize: 11, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: 0.8 }}>Consumo</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, color: '#fff', marginTop: 4, letterSpacing: -0.5, fontVariantNumeric: 'tabular-nums' }}>
            {totalPower >= 1000 ? (totalPower/1000).toFixed(2) : totalPower}
            <span style={{ fontSize: 14, color: 'var(--text-2)', marginLeft: 4 }}>{totalPower >= 1000 ? 'kW' : 'W'}</span>
          </div>
        </div>
      </div>

      {/* Plug list */}
      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 18, border: '0.5px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        {plugs.map((p, i) => (
          <div key={p.name} style={{
            display: 'flex', alignItems: 'center', padding: '14px 16px', gap: 12,
            borderBottom: i < plugs.length - 1 ? '0.5px solid rgba(255,255,255,0.06)' : 'none',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: p.on ? 'rgba(255,184,74,0.18)' : 'rgba(255,255,255,0.05)',
              color: p.on ? '#ffb84a' : 'rgba(255,255,255,0.3)',
              border: `0.5px solid ${p.on ? 'rgba(255,184,74,0.3)' : 'rgba(255,255,255,0.06)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <IconPlug size={16} sw={2} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#fff' }}>{p.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2 }}>
                {p.room}{p.on && p.power > 0 ? ` · ${p.power >= 1000 ? `${(p.power/1000).toFixed(1)}kW` : `${p.power}W`}` : ''}
              </div>
            </div>
            <InlineToggle on={p.on} color="#ffb84a" onChange={() => togglePlug(i)} />
          </div>
        ))}
      </div>
    </Sheet>
  );
};

// ───────── Shared controls ─────────
const SheetRow = ({ label, value, children }) => (
  <div style={{
    marginTop: 18, padding: '14px 0',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    borderBottom: '0.5px solid rgba(255,255,255,0.06)',
    gap: 12,
  }}>
    <div>
      <div style={{ fontSize: 14, color: '#fff', fontWeight: 500 }}>{label}</div>
      {value && <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>{value}</div>}
    </div>
    {children}
  </div>
);

const Stepper = ({ value, min, max, onChange }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <button onClick={() => onChange(Math.max(min, value - 1))}
      style={{ width: 36, height: 36, borderRadius: 999, border: 'none',
               background: 'rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer' }}>
      <IconMinus size={14} sw={2.5} />
    </button>
    <div style={{ minWidth: 36, textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, color: '#fff' }}>
      {value}
    </div>
    <button onClick={() => onChange(Math.min(max, value + 1))}
      style={{ width: 36, height: 36, borderRadius: 999, border: 'none',
               background: 'rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer' }}>
      <IconPlus size={14} sw={2.5} />
    </button>
  </div>
);

const Slider = ({ value, min, max, onChange, color = 'var(--accent)' }) => {
  const pct = (value - min) / (max - min);
  return (
    <input type="range" min={min} max={max} value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{
        WebkitAppearance: 'none', appearance: 'none', width: 140, height: 6,
        borderRadius: 999, outline: 'none',
        background: `linear-gradient(to right, ${color} 0%, ${color} ${pct*100}%, rgba(255,255,255,0.1) ${pct*100}%, rgba(255,255,255,0.1) 100%)`,
      }} />
  );
};

const BigSlider = ({ value, onChange, color = 'var(--accent)' }) => (
  <div style={{ position: 'relative', height: 72, borderRadius: 20, overflow: 'hidden',
                background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.06)' }}>
    <div style={{
      position: 'absolute', left: 0, top: 0, bottom: 0, width: `${value}%`,
      background: `linear-gradient(90deg, color-mix(in oklab, ${color} 70%, transparent) 0%, ${color} 100%)`,
    }} />
    <input type="range" min="0" max="100" value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
    <div style={{
      position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 20px', pointerEvents: 'none',
    }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, color: '#fff' }}>{value}%</div>
      <IconBulb size={22} stroke="rgba(255,255,255,0.7)" />
    </div>
  </div>
);

// Apple-Home-style radial dial
const RadialDial = ({ value, min, max, onChange, color, label }) => {
  const pct = (value - min) / (max - min);
  const angle = pct * 270 - 135; // -135 to 135
  const size = 220;
  const r = 92;
  const circ = 2 * Math.PI * r;
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0 16px',
      position: 'relative',
    }}>
      <svg width={size} height={size} style={{ transform: 'rotate(135deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke="rgba(255,255,255,0.08)" strokeWidth="10" strokeLinecap="round"
          strokeDasharray={`${circ * 0.75} ${circ}`} />
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={`${circ * 0.75 * pct} ${circ}`}
          style={{ filter: `drop-shadow(0 0 12px ${color})`, transition: 'stroke-dasharray .3s' }} />
      </svg>
      <div style={{
        position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 68, fontWeight: 600, color: '#fff', lineHeight: 1, letterSpacing: -3 }}>
          {value}<span style={{ fontSize: 28, opacity: 0.5 }}>°</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>{label}</div>
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 14 }}>
        <button onClick={() => onChange(Math.max(min, value - 1))}
          style={{ width: 44, height: 44, borderRadius: 999, border: 'none',
                   background: 'rgba(255,255,255,0.08)', color: '#fff', cursor: 'pointer' }}>
          <IconMinus size={18} sw={2.2} />
        </button>
        <button onClick={() => onChange(Math.min(max, value + 1))}
          style={{ width: 44, height: 44, borderRadius: 999, border: 'none',
                   background: 'rgba(255,255,255,0.08)', color: '#fff', cursor: 'pointer' }}>
          <IconPlus size={18} sw={2.2} />
        </button>
      </div>
    </div>
  );
};

const SheetBtn = ({ Icon, label, onClick }) => (
  <button onClick={onClick} style={{
    padding: '16px', borderRadius: 16, border: 'none', cursor: 'pointer',
    background: 'rgba(255,255,255,0.05)',
    border: '0.5px solid rgba(255,255,255,0.06)',
    display: 'flex', alignItems: 'center', gap: 10, color: '#fff',
    fontSize: 14, fontWeight: 500,
  }}>
    <Icon size={18} stroke="var(--text-2)" />
    {label}
  </button>
);

Object.assign(window, {
  Sheet, StoveSheet, ThermoSheet, LightsSheet, SonosSheet, PlugsSheet,
  SheetRow, Stepper, Slider, BigSlider, RadialDial, SheetBtn,
});
