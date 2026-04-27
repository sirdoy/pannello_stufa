// Dashboard card components — all glass, all interactive
// Each card: tap to expand sheet, inline primary toggle where useful

const { useState } = React;

// ───────── Glass card base ─────────
const GlassCard = ({ children, onClick, tone, style }) => {
  const [pressed, setPressed] = useState(false);
  return (
    <div
      onClick={onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        position: 'relative',
        borderRadius: 'var(--r-card)',
        padding: 'var(--pad-card)',
        aspectRatio: '1 / 1',
        cursor: 'pointer',
        overflow: 'hidden',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(var(--glass-blur)) saturate(180%)',
        WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(180%)',
        border: '0.5px solid var(--glass-border)',
        boxShadow: 'var(--glass-shadow)',
        transform: pressed ? 'scale(0.97)' : 'scale(1)',
        transition: 'transform .22s cubic-bezier(.34,1.56,.64,1), background .2s',
        display: 'flex', flexDirection: 'column',
        ...style,
      }}
    >
      {/* tone wash */}
      {tone && (
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.55, pointerEvents: 'none',
          background: `radial-gradient(120% 70% at 100% 0%, ${tone} 0%, transparent 55%)`,
        }} />
      )}
      {/* inner highlight */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 'inherit', pointerEvents: 'none',
        boxShadow: 'inset 1px 1px 0 rgba(255,255,255,0.08)',
      }} />
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1 }}>
        {children}
      </div>
    </div>
  );
};

// Label + icon header within a card
const CardHead = ({ Icon, label, tone, right }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
    <div style={{
      width: 32, height: 32, borderRadius: 10,
      background: `color-mix(in oklab, ${tone} 22%, transparent)`,
      color: tone,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: `0.5px solid color-mix(in oklab, ${tone} 30%, transparent)`,
    }}>
      <Icon size={18} sw={2} />
    </div>
    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', letterSpacing: 0.2, flex: 1 }}>
      {label}
    </div>
    {right}
  </div>
);

const StatusDot = ({ on, color }) => (
  <div style={{
    width: 8, height: 8, borderRadius: 999,
    background: on ? (color || 'var(--accent)') : 'rgba(255,255,255,0.18)',
    boxShadow: on ? `0 0 12px ${color || 'var(--accent)'}` : 'none',
  }} />
);

// ───────── Individual cards ─────────

const StoveCard = ({ state, onOpen }) => {
  const { on, power, fan, temp } = state.stove;
  return (
    <GlassCard onClick={onOpen} tone="var(--accent)">
      <CardHead Icon={IconFlame} label="Stufa" tone="var(--accent)" right={<StatusDot on={on} />} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', position: 'relative' }}>
        <div style={{
          position: 'absolute', right: -8, top: -10, opacity: 0.9,
        }}>
          <FlameViz on={on} intensity={power / 5} />
        </div>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 36, fontWeight: 600, lineHeight: 1,
          color: on ? '#fff' : 'var(--text-2)',
          letterSpacing: -1.2,
          position: 'relative', zIndex: 1,
        }}>
          {temp}<span style={{ fontSize: 16, opacity: 0.5, marginLeft: 2 }}>°C</span>
        </div>
        <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-2)' }}>
          {on ? `Fiamma ${power} · Ventola ${fan}` : 'Spenta'}
        </div>
      </div>
    </GlassCard>
  );
};

const FlameViz = ({ on, intensity = 0.6 }) => (
  <div style={{
    width: 64, height: 80, position: 'relative',
    opacity: on ? 1 : 0.25, transition: 'opacity .4s',
  }}>
    <div style={{
      position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      width: 48, height: 64 * (0.5 + intensity * 0.5), borderRadius: '50% 50% 45% 45% / 60% 60% 40% 40%',
      background: `radial-gradient(ellipse at 50% 80%, color-mix(in oklab, var(--accent) 80%, white) 0%, var(--accent) 40%, color-mix(in oklab, var(--accent) 60%, #6a1a00) 90%)`,
      filter: 'blur(0.5px)',
      boxShadow: on ? `0 0 40px color-mix(in oklab, var(--accent) 70%, transparent), 0 0 80px color-mix(in oklab, var(--accent) 40%, transparent)` : 'none',
      animation: on ? 'flamePulse 1.8s ease-in-out infinite' : 'none',
    }} />
    <div style={{
      position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)',
      width: 28, height: 40 * (0.5 + intensity * 0.5), borderRadius: '50% 50% 40% 40%',
      background: `radial-gradient(ellipse at 50% 90%, #fff5c0 0%, #ffd27a 50%, transparent 75%)`,
      animation: on ? 'flamePulse 1.4s ease-in-out infinite alternate' : 'none',
    }} />
  </div>
);

const ThermostatCard = ({ state, onOpen }) => {
  const { zones, mode } = state.thermostat;
  const activeCount = zones.filter(z => z.on).length;
  // show up to 4 zones inline
  const visible = zones.slice(0, 4);
  return (
    <GlassCard onClick={onOpen} tone="#5eafff">
      <CardHead Icon={IconThermo} label="Clima" tone="#5eafff" right={
        <div style={{ fontSize: 11, fontWeight: 600, color: '#5eafff', letterSpacing: 0.5 }}>{mode}</div>
      } />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1, justifyContent: 'center' }}>
        {visible.map((z) => (
          <div key={z.name} style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <div style={{
              width: 6, height: 6, borderRadius: 999, flexShrink: 0,
              background: z.on ? '#5eafff' : 'rgba(255,255,255,0.18)',
              boxShadow: z.on ? '0 0 8px #5eafff' : 'none',
            }} />
            <div style={{ fontSize: 11, color: z.on ? '#fff' : 'var(--text-2)', flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }}>
              {z.name}
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: z.on ? '#fff' : 'var(--text-2)', fontFamily: 'var(--font-display)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
              {z.current.toFixed(1)}°
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-2)' }}>
        {activeCount} di {zones.length} attive
      </div>
    </GlassCard>
  );
};

const LightsCard = ({ state, onOpen, onToggle }) => {
  const lights = state.lights;
  const onLights = lights.filter(l => l.on);
  const anyOn = onLights.length > 0;
  const visible = onLights.slice(0, 4);
  return (
    <GlassCard onClick={onOpen} tone="#f5c84a">
      <CardHead Icon={IconBulb} label="Luci" tone="#f5c84a" right={
        <InlineToggle on={anyOn} color="#f5c84a" onChange={(e) => { e.stopPropagation(); onToggle(); }} />
      } />
      {anyOn ? (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1, justifyContent: 'center' }}>
            {visible.map((l) => (
              <div key={l.name} style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                <div style={{
                  width: 6, height: 6, borderRadius: 999, flexShrink: 0,
                  background: '#f5c84a', boxShadow: '0 0 8px #f5c84a',
                }} />
                <div style={{ fontSize: 11, color: '#fff', flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }}>
                  {l.name}
                </div>
              </div>
            ))}
            {onLights.length > visible.length && (
              <div style={{ fontSize: 10, color: 'var(--text-2)', marginLeft: 12, fontWeight: 500 }}>
                + altre {onLights.length - visible.length}
              </div>
            )}
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-2)' }}>
            {onLights.length} di {lights.length} accese
          </div>
        </>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, color: 'var(--text-2)', lineHeight: 1 }}>
            Spente
          </div>
          <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-2)' }}>
            {lights.length} disponibili
          </div>
        </div>
      )}
    </GlassCard>
  );
};

const WeatherCard = ({ state }) => {
  const { temp, city, condition, high, low } = state.weather;
  return (
    <GlassCard tone="#ffb84a">
      <CardHead Icon={IconSun} label="Meteo" tone="#ffb84a" right={
        <div style={{ fontSize: 11, color: 'var(--text-2)' }}>{city}</div>
      } />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 600, color: '#fff', lineHeight: 1, letterSpacing: -1 }}>
            {temp}<span style={{ fontSize: 18, opacity: 0.4 }}>°</span>
          </div>
        </div>
        <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-2)' }}>
          {condition} · ↑{high}° ↓{low}°
        </div>
      </div>
    </GlassCard>
  );
};

const SonosCard = ({ state, onOpen }) => {
  const { groups } = state.sonos;
  const playingCount = groups.filter(g => g.playing).length;
  const visible = groups.slice(0, 4);
  return (
    <GlassCard onClick={onOpen} tone="#b080ff">
      <CardHead Icon={IconMusic} label="Sonos" tone="#b080ff" right={
        <div style={{ fontSize: 11, fontWeight: 600, color: '#b080ff', letterSpacing: 0.3 }}>
          {playingCount > 0 ? `${playingCount} in riprod.` : 'In pausa'}
        </div>
      } />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1, justifyContent: 'center' }}>
        {visible.map((g) => (
          <div key={g.name} style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <div style={{ flexShrink: 0, width: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {g.playing ? (
                <PlayingBars />
              ) : (
                <div style={{ width: 6, height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.18)' }} />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: g.playing ? '#fff' : 'var(--text-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.2 }}>
                {g.name}
              </div>
              {g.playing && (
                <div style={{ fontSize: 10, color: 'var(--text-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.2, marginTop: 1 }}>
                  {g.track}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};

const PlayingBars = () => (
  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1.5, height: 9 }}>
    {[0, 1, 2].map((i) => (
      <div key={i} style={{
        width: 2, borderRadius: 1, background: '#b080ff',
        animation: `sonosBar${i} 0.9s ease-in-out ${i * 0.15}s infinite`,
        height: 4,
      }} />
    ))}
  </div>
);

const AlbumArt = ({ playing, small }) => (
  <div style={{
    width: small ? 44 : 72, height: small ? 44 : 72, borderRadius: small ? 10 : 14, flexShrink: 0, position: 'relative',
    background: 'linear-gradient(135deg, #b080ff 0%, #5eafff 50%, #f5c84a 100%)',
    boxShadow: playing ? '0 0 24px rgba(176,128,255,0.3)' : 'none',
    overflow: 'hidden',
  }}>
    <div style={{
      position: 'absolute', inset: 0,
      background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3) 0%, transparent 50%)',
    }} />
  </div>
);

const CircBtn = ({ Icon, onClick, primary, tone }) => (
  <button onClick={onClick} style={{
    width: 34, height: 34, borderRadius: 999, border: 'none', cursor: 'pointer',
    background: primary ? tone : 'rgba(255,255,255,0.08)',
    color: primary ? '#1a0f08' : '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 0,
  }}>
    <Icon size={16} sw={2.2} />
  </button>
);

const CameraCard = ({ state, onOpen }) => (
  <GlassCard onClick={onOpen} tone="#6aa86a" style={{ overflow: 'hidden' }}>
    <CardHead Icon={IconCamera} label="Camera" tone="#6aa86a" right={
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#ff4d5c', fontWeight: 700, letterSpacing: 0.5 }}>
        <div style={{ width: 6, height: 6, borderRadius: 999, background: '#ff4d5c', animation: 'pulse 1.6s infinite' }} />
        LIVE
      </div>
    } />
    <div style={{
      flex: 1, marginTop: 4, borderRadius: 14, position: 'relative', overflow: 'hidden',
      background: 'linear-gradient(135deg, #0a1a12 0%, #1a2a1a 100%)',
      border: '0.5px solid rgba(255,255,255,0.06)',
      minHeight: 90,
    }}>
      {/* fake grainy scene */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.6,
        background: `
          radial-gradient(circle at 30% 40%, #2a3a2a 0%, transparent 40%),
          radial-gradient(circle at 70% 60%, #1a2a3a 0%, transparent 40%),
          linear-gradient(180deg, transparent 60%, rgba(0,0,0,0.4) 100%)
        `,
      }} />
      <div style={{
        position: 'absolute', bottom: 8, left: 10, fontSize: 10,
        color: 'rgba(255,255,255,0.7)', fontFamily: 'ui-monospace, SF Mono, monospace',
      }}>
        INGRESSO · 1080p
      </div>
    </div>
  </GlassCard>
);

const NetworkCard = ({ state, onOpen }) => {
  const { up, down, devices } = state.network;
  return (
    <GlassCard onClick={onOpen} tone="#5eafff">
      <CardHead Icon={IconWifi} label="Rete" tone="#5eafff" right={<StatusDot on color="#6aa86a" />} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: '#fff' }}>{down}</div>
          <div style={{ fontSize: 11, color: 'var(--text-2)' }}>Mbps ↓</div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
          {up} Mbps ↑ · {devices} dispositivi
        </div>
      </div>
    </GlassCard>
  );
};

const RaspiCard = ({ state }) => {
  const { cpu, ram, temp } = state.raspi;
  return (
    <GlassCard tone="#6aa86a">
      <CardHead Icon={IconCpu} label="Raspberry" tone="#6aa86a" right={<StatusDot on color="#6aa86a" />} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, flex: 1, alignContent: 'end' }}>
        <MiniStat label="CPU" value={`${cpu}%`} bar={cpu/100} />
        <MiniStat label="RAM" value={`${ram}%`} bar={ram/100} />
      </div>
      <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-2)' }}>CPU temp {temp}°C</div>
    </GlassCard>
  );
};

const MiniStat = ({ label, value, bar }) => (
  <div>
    <div style={{ fontSize: 11, color: 'var(--text-2)', marginBottom: 3 }}>{label}</div>
    <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', fontFamily: 'var(--font-display)' }}>{value}</div>
    <div style={{ height: 3, borderRadius: 999, background: 'rgba(255,255,255,0.08)', marginTop: 5, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${bar * 100}%`, background: 'var(--accent)', borderRadius: 999 }} />
    </div>
  </div>
);

const TuyaCard = ({ state, onOpen }) => {
  const { plugs } = state;
  const onCount = plugs.filter(p => p.on).length;
  const totalPower = plugs.reduce((s, p) => s + p.power, 0);
  const visible = plugs.slice(0, 4);
  return (
    <GlassCard onClick={onOpen} tone="#ffb84a">
      <CardHead Icon={IconPlug} label="Prese smart" tone="#ffb84a" right={
        <div style={{ fontSize: 11, fontWeight: 600, color: '#ffb84a', letterSpacing: 0.3, fontVariantNumeric: 'tabular-nums' }}>
          {totalPower >= 1000 ? `${(totalPower/1000).toFixed(1)}kW` : `${totalPower}W`}
        </div>
      } />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1, justifyContent: 'center' }}>
        {visible.map((p) => (
          <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <div style={{
              width: 6, height: 6, borderRadius: 999, flexShrink: 0,
              background: p.on ? '#ffb84a' : 'rgba(255,255,255,0.18)',
              boxShadow: p.on ? '0 0 8px #ffb84a' : 'none',
            }} />
            <div style={{ fontSize: 11, color: p.on ? '#fff' : 'var(--text-2)', flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }}>
              {p.name}
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-2)' }}>
        {onCount} di {plugs.length} accese
      </div>
    </GlassCard>
  );
};

// iOS-style toggle
const InlineToggle = ({ on, color = 'var(--accent)', onChange }) => (
  <button onClick={onChange} style={{
    width: 44, height: 26, borderRadius: 999, border: 'none',
    background: on ? color : 'rgba(255,255,255,0.15)',
    position: 'relative', cursor: 'pointer', padding: 0,
    transition: 'background .22s',
    boxShadow: on ? `0 0 12px color-mix(in oklab, ${color} 40%, transparent)` : 'none',
  }}>
    <div style={{
      position: 'absolute', top: 2, left: on ? 20 : 2,
      width: 22, height: 22, borderRadius: 999,
      background: '#fff',
      transition: 'left .22s cubic-bezier(.34,1.56,.64,1)',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    }} />
  </button>
);

Object.assign(window, {
  GlassCard, CardHead, StatusDot,
  StoveCard, ThermostatCard, LightsCard, WeatherCard, SonosCard, CameraCard,
  NetworkCard, RaspiCard, TuyaCard, InlineToggle, CircBtn, FlameViz, AlbumArt, MiniStat,
});
