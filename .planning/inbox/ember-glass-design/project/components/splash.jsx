// Splash screen — shown at app boot, fades to reveal dashboard

const { useState: useSplashState, useEffect: useSplashEffect } = React;

const Splash = ({ onDone }) => {
  const [phase, setPhase] = useSplashState(0);
  // phase 0: logo growing
  // phase 1: logo + wordmark
  // phase 2: fade out (cards fade in behind)
  // phase 3: gone

  useSplashEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 600);
    const t2 = setTimeout(() => setPhase(2), 1500);
    const t3 = setTimeout(() => { setPhase(3); onDone && onDone(); }, 2100);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  if (phase === 3) return null;

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 1000,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at center, #1c1917 0%, #0a0908 70%)',
      opacity: phase >= 2 ? 0 : 1,
      transition: 'opacity .55s cubic-bezier(.4,0,.2,1)',
      pointerEvents: phase >= 2 ? 'none' : 'auto',
    }}>
      {/* ambient glow */}
      <div style={{
        position: 'absolute', width: 400, height: 400, borderRadius: 999,
        background: 'radial-gradient(circle, color-mix(in oklab, var(--accent) 40%, transparent) 0%, transparent 65%)',
        filter: 'blur(60px)',
        opacity: phase >= 1 ? 0.7 : 0,
        transform: phase >= 1 ? 'scale(1.2)' : 'scale(0.6)',
        transition: 'opacity 1s, transform 1.2s cubic-bezier(.22,1,.36,1)',
      }} />

      {/* flame logo */}
      <div style={{
        position: 'relative', width: 88, height: 96,
        transform: phase === 0 ? 'scale(0.4)' : phase === 1 ? 'scale(1)' : 'scale(1.08)',
        opacity: phase === 0 ? 0 : 1,
        transition: 'transform .7s cubic-bezier(.22,1.2,.36,1), opacity .5s',
      }}>
        <FlameViz on intensity={0.95} />
      </div>

      {/* wordmark */}
      <div style={{
        marginTop: 26,
        fontFamily: 'var(--font-display)',
        fontSize: 28, fontWeight: 600,
        color: '#fff',
        letterSpacing: -0.8,
        opacity: phase >= 1 ? 1 : 0,
        transform: phase >= 1 ? 'translateY(0)' : 'translateY(12px)',
        transition: 'opacity .5s .15s, transform .6s .15s cubic-bezier(.22,1,.36,1)',
      }}>
        Home
      </div>

      {/* subtle caption */}
      <div style={{
        marginTop: 6,
        fontSize: 12, color: 'var(--text-2)', fontWeight: 500, letterSpacing: 0.3,
        opacity: phase >= 1 ? 1 : 0,
        transform: phase >= 1 ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity .5s .3s, transform .6s .3s cubic-bezier(.22,1,.36,1)',
      }}>
        Connessione al gateway…
      </div>

      {/* bottom auth hint */}
      <div style={{
        position: 'absolute', bottom: 40, left: 0, right: 0, textAlign: 'center',
        fontSize: 11, color: 'var(--text-2)', opacity: phase >= 1 ? 0.7 : 0,
        transition: 'opacity .5s .4s',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      }}>
        <div style={{
          width: 6, height: 6, borderRadius: 999, background: '#6aa86a',
          boxShadow: '0 0 8px #6aa86a',
          animation: 'pulse 1.6s infinite',
        }} />
        Autenticato · Auth0
      </div>
    </div>
  );
};

// Container that fades children in after splash
const AppShell = ({ children }) => {
  const [ready, setReady] = useSplashState(false);
  return (
    <>
      <div style={{
        position: 'absolute', inset: 0,
        opacity: ready ? 1 : 0,
        transform: ready ? 'scale(1)' : 'scale(0.97)',
        transition: 'opacity .6s cubic-bezier(.22,1,.36,1) .1s, transform .7s cubic-bezier(.22,1,.36,1) .1s',
      }}>
        {children}
      </div>
      <Splash onDone={() => setReady(true)} />
    </>
  );
};

Object.assign(window, { Splash, AppShell });
