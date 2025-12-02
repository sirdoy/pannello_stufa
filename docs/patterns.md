# Common Patterns

Pattern riutilizzabili per componenti e features comuni.

## WebGL Canvas Pattern

Pattern per componenti WebGL con gestione lifecycle, resize e cleanup.

### Setup Base

```javascript
'use client';

import { useEffect, useRef, useState } from 'react';

export default function WebGLComponent({ /* props */ }) {
  const canvasRef = useRef(null);
  const [webglError, setWebglError] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Context config ottimizzato
    const gl = canvas.getContext('webgl', {
      alpha: true,
      premultipliedAlpha: false,
      antialias: false,  // Disabilita per performance
      depth: false,      // Disabilita se non serve 3D
      stencil: false     // Disabilita se non serve masking
    });

    if (!gl) {
      setWebglError(true);
      return;
    }

    // Enable blending per trasparenza
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    let animationId;
    let resizeObserver;

    // Shader compilation
    const program = createProgram(gl, vertexSource, fragmentSource);

    // Resize handler con DPR limit
    function resize() {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2.0);
      const w = Math.floor(rect.width * dpr);
      const h = Math.floor(rect.height * dpr);

      if (w === 0 || h === 0) return;

      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    }

    // Animation loop
    function animate() {
      resize();

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      // Draw...
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      animationId = requestAnimationFrame(animate);
    }

    // Start con requestAnimationFrame per DOM ready
    requestAnimationFrame(() => {
      resize();
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(canvas);
      animate();
    });

    // Cleanup
    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      if (resizeObserver) resizeObserver.disconnect();
      gl.deleteProgram(program);
      // Delete shaders, buffers...
    };
  }, [/* deps */]);

  // Fallback CSS se WebGL non disponibile
  if (webglError) {
    return <div className="fallback-style">...</div>;
  }

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  );
}
```

### Best Practices WebGL

**Context Config**:
- Disabilita `antialias`, `depth`, `stencil` se non necessari (-30% GPU)
- Limita `devicePixelRatio` a 2.0 massimo
- Usa `alpha: true` per trasparenza

**Shader Optimization**:
- Riduci uniforms al minimo necessario
- Semplifica calcoli nel fragment shader
- Usa `precision mediump` invece di `highp` se possibile

**Canvas Sizing**:
- Usa `getBoundingClientRect()` invece di `clientWidth/Height`
- Wrap `resize()` iniziale in `requestAnimationFrame()`
- ResizeObserver per resize reattivo

**Cleanup**:
- Sempre `cancelAnimationFrame()` in cleanup
- Disconnect `ResizeObserver`
- Delete WebGL resources (programs, shaders, buffers)

**CSS Integration**:
- `pointer-events-none` se canvas non interattivo
- `z-index` esplicito per layering (es. z-0 per background)
- `mix-blend-mode` per blend naturale con contenuto

## Dropdown/Modal Pattern

Pattern base per dropdown, modal, overlay con gestione completa eventi.

### Pattern Base

```javascript
'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export default function DropdownExample() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const pathname = usePathname();

  // Click outside detection
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ESC key handler
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // Auto-close on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <div ref={dropdownRef} className="relative">
      <button onClick={() => setIsOpen(!isOpen)}>
        Toggle
      </button>

      {isOpen && (
        <div className="absolute z-[100] ...">
          {/* Dropdown content */}
        </div>
      )}
    </div>
  );
}
```

**Features**:
- ✅ Click outside → chiude
- ✅ ESC key → chiude
- ✅ Route change → chiude
- ✅ Ref-based outside detection

**Implementazione completa**: `app/components/Navbar.js:89-145`

## Confirmation Modal Pattern

Modal conferma con backdrop, warning box, loading state.

### Pattern Base

```jsx
const [showModal, setShowModal] = useState(false);
const [isSubmitting, setIsSubmitting] = useState(false);

const handleConfirm = async () => {
  setIsSubmitting(true);
  try {
    // Async operation
    await performAction();
    setShowModal(false);
  } catch (error) {
    console.error(error);
  } finally {
    setIsSubmitting(false);
  }
};

return (
  <>
    <Button onClick={() => setShowModal(true)}>
      Azione
    </Button>

    {showModal && (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 z-[10000]"
          onClick={() => !isSubmitting && setShowModal(false)}
        />

        {/* Modal */}
        <div className="fixed inset-0 flex items-center justify-center z-[10001] p-4">
          <Card liquid className="w-full max-w-md p-6 space-y-4">
            <h3 className="text-xl font-bold">Conferma Azione</h3>

            {/* Warning box */}
            <div className="bg-warning-50 border-2 border-warning-200 rounded-lg p-4">
              <p className="text-sm text-warning-800">
                ⚠️ Questa azione non può essere annullata.
              </p>
            </div>

            <p className="text-neutral-700">
              Sei sicuro di voler procedere?
            </p>

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <Button
                liquid
                variant="secondary"
                onClick={() => setShowModal(false)}
                disabled={isSubmitting}
              >
                Annulla
              </Button>
              <Button
                liquid
                variant="danger"
                onClick={handleConfirm}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Attendere...' : 'Conferma'}
              </Button>
            </div>
          </Card>
        </div>
      </>
    )}
  </>
);
```

**Features**:
- ✅ Fixed backdrop z-[10000]
- ✅ Modal z-[10001] (sopra backdrop)
- ✅ Click backdrop → chiude (disabled durante submit)
- ✅ Warning box per azioni distruttive
- ✅ Loading state durante async operation
- ✅ Liquid glass style

**Implementazione esempio**: `app/maintenance/page.js:120-165`

## Collapse/Expand with localStorage

Pattern per componenti collapse/expand con persistenza preferenze utente.

### Pattern Base

```javascript
'use client';

import { useState, useEffect } from 'react';
import styles from './Component.module.css';

export default function CollapsibleComponent() {
  const [isExpanded, setIsExpanded] = useState(false);

  // Load saved state or auto-expand logic
  useEffect(() => {
    const savedState = localStorage.getItem('componentExpanded');

    if (savedState === 'true') {
      setIsExpanded(true);
    } else if (savedState === 'false') {
      setIsExpanded(false);
    } else if (/* auto-expand condition */) {
      // Auto-expand ONLY first time
      setIsExpanded(true);
    }
  }, [/* dependencies */]);

  const handleToggle = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    localStorage.setItem('componentExpanded', newState);
  };

  return (
    <div>
      <button onClick={handleToggle}>
        {isExpanded ? '▼' : '▶'} Toggle
      </button>

      <div className={isExpanded ? styles.expanded : styles.collapsed}>
        {/* Collapsible content */}
      </div>
    </div>
  );
}
```

**CSS Modules** (`Component.module.css`):
```css
.collapsed {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  transition: max-height 0.3s ease, opacity 0.3s ease;
}

.expanded {
  max-height: 500px; /* Adjust to content */
  opacity: 1;
  transition: max-height 0.3s ease, opacity 0.3s ease;
}
```

**Priority Logic**:
1. localStorage `'true'` → Expand
2. localStorage `'false'` → Collapse
3. localStorage `null` + condition → Auto-expand prima volta
4. Default → Collapse

**Implementazione esempio**: `app/components/MaintenanceBar.js:89-120`

## Firebase Realtime Listeners

Pattern per Firebase realtime listeners con cleanup.

### Pattern Base

```javascript
'use client';

import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';

export default function RealtimeComponent() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const dataRef = ref(db, 'path/to/data');

    // Setup listener
    const unsubscribe = onValue(dataRef, (snapshot) => {
      if (snapshot.exists()) {
        setData(snapshot.val());
      } else {
        setData(null);
      }
    });

    // Cleanup listener
    return () => unsubscribe();
  }, []);

  return (
    <div>
      {data ? JSON.stringify(data) : 'Loading...'}
    </div>
  );
}
```

**CRITICO**: Sempre cleanup listener (`return () => unsubscribe()`) per evitare memory leaks.

**Implementazione esempio**: `app/components/CronHealthBanner.js:25-45`

### Multi-Listener Pattern

Pattern per ascoltare multipli path Firebase con cleanup singolo:

```javascript
'use client';

import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';

export default function MultiListenerComponent() {
  const [state1, setState1] = useState(null);
  const [state2, setState2] = useState(null);

  useEffect(() => {
    let unsubscribe1 = null;
    let unsubscribe2 = null;

    // Setup listeners
    const ref1 = ref(db, 'path/to/data1');
    unsubscribe1 = onValue(ref1, (snapshot) => {
      if (snapshot.exists()) {
        setState1(snapshot.val());
      }
    });

    const ref2 = ref(db, 'path/to/data2');
    unsubscribe2 = onValue(ref2, (snapshot) => {
      if (snapshot.exists()) {
        setState2(snapshot.val());
      }
    });

    // Cleanup tutti i listeners
    return () => {
      if (unsubscribe1) unsubscribe1();
      if (unsubscribe2) unsubscribe2();
    };
  }, []);

  return (
    <div>
      <p>Data 1: {state1 ? JSON.stringify(state1) : 'Loading...'}</p>
      <p>Data 2: {state2 ? JSON.stringify(state2) : 'Loading...'}</p>
    </div>
  );
}
```

**Best Practices**:
- ✅ Dichiara tutti `unsubscribe` a null all'inizio
- ✅ Verifica `if (unsubscribe)` prima di chiamare nel cleanup
- ✅ Un cleanup function che gestisce tutti i listener
- ✅ Dependencies array vuoto se listener non dipendono da props/state

**Implementazione esempio**: `app/components/devices/stove/StoveCard.js:169-229`

## Polling Pattern

Pattern per polling periodico con cleanup.

### Pattern Base

```javascript
'use client';

import { useState, useEffect } from 'react';

export default function PollingComponent() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch('/api/endpoint');
      const json = await res.json();
      setData(json);
    };

    // Initial fetch
    fetchData();

    // Setup polling
    const interval = setInterval(fetchData, 5000); // 5s

    // Cleanup
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      {data ? JSON.stringify(data) : 'Loading...'}
    </div>
  );
}
```

**Best Practices**:
- ✅ Initial fetch immediato (prima del primo interval)
- ✅ Cleanup interval in return
- ✅ Frequency ragionevole (5s per status, 30s per health check)

**Implementazione esempio**: `app/components/devices/stove/StoveCard.js`

## Form Validation Pattern

Pattern per validazione form con error states.

### Pattern Base

```javascript
'use client';

import { useState } from 'react';
import Input from './ui/Input';
import Button from './ui/Button';

export default function FormComponent() {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!value || value <= 0) {
      setError('Valore non valido');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/endpoint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      });

      if (!res.ok) {
        throw new Error('API error');
      }

      // Success
      setValue('');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        liquid
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Inserisci valore"
      />

      {error && (
        <p className="text-sm text-danger-600">
          {error}
        </p>
      )}

      <Button
        liquid
        type="submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Salvando...' : 'Salva'}
      </Button>
    </form>
  );
}
```

**Features**:
- ✅ Controlled input
- ✅ Client-side validation
- ✅ Error state display
- ✅ Loading state durante submit
- ✅ Disabled button durante submit

## Responsive Grid Pattern

Pattern per layout grid responsive.

### 2-Column Grid

```jsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
  <Card liquid>Column 1</Card>
  <Card liquid>Column 2</Card>
</div>
```

**Breakpoints**:
- Mobile (< 1024px): 1 colonna
- Desktop (≥ 1024px): 2 colonne
- Gap: 24px mobile, 32px desktop

### Auto-Fit Grid

```jsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {items.map(item => (
    <Card key={item.id} liquid>
      {item.name}
    </Card>
  ))}
</div>
```

**Breakpoints**:
- Mobile: 1 col
- Tablet (≥ 640px): 2 col
- Desktop (≥ 1024px): 3 col
- Large (≥ 1280px): 4 col

## Middleware Configuration Pattern

Pattern per configurare Next.js middleware con Auth0 evitando conflitti con PWA e service workers.

### Base Pattern

```javascript
// middleware.js
import { NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0/edge';

// Auth0 v4 pattern
import { auth0 } from '@/lib/auth0';

export default auth0.middleware();

export const config = {
  matcher: [
    // Exclude: Auth routes, API routes, PWA assets, static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png|offline|manifest.json|icons/|sw.js|firebase-messaging-sw.js|auth/*).*)',
  ],
};
```

**lib/auth0.js Setup**:
```javascript
import { Auth0Client } from '@auth0/nextjs-auth0/server';

export const auth0 = new Auth0Client({
  secret: process.env.AUTH0_SECRET,
  baseURL: process.env.AUTH0_BASE_URL,
  clientID: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
});
```

### Best Practices

**1. Escludi sempre route PWA e auth dal matcher**
```javascript
// ❌ WRONG - causa redirect loop su mobile
matcher: ["/((?!_next|favicon.ico).*)"]

// ✅ CORRECT - esclude auth routes e tutte le route PWA
matcher: [
  '/((?!_next/static|_next/image|favicon.ico|.*\\.png|offline|manifest.json|icons/|sw.js|firebase-messaging-sw.js|auth/*).*)'
]
```

**Motivo**: Service worker e manifest devono essere accessibili senza autenticazione, altrimenti:
- Mobile browsers non riescono a registrare il service worker
- PWA non può essere installata
- Session cookie non persiste correttamente tra navigazioni

**2. Escludi API pubbliche (cron, webhooks, health checks)**
```javascript
matcher: [
  "/((?!api/auth|api/scheduler/check|api/admin|...).*)"
]
```

**3. Pattern specific routes (alternativa)**

Se preferisci proteggere solo route specifiche:
```javascript
export const config = {
  matcher: [
    '/',                      // Homepage
    '/stove/:path*',          // Stove pages
    '/thermostat/:path*',     // Thermostat pages
    '/lights/:path*',         // Lights pages
    '/settings/:path*',       // Settings
    '/log/:path*',            // Log pages
    '/changelog/:path*',      // Changelog
  ],
};
```

**Pro**: Più esplicito, nessun rischio di dimenticare esclusioni
**Contro**: Richiede aggiornamento quando aggiungi nuove pagine

### Debugging Middleware

**Aggiungi logging temporaneo per debug**:
```javascript
// Auth0 v4 gestisce automaticamente sessione e redirect
import { auth0 } from '@/lib/auth0';

export default auth0.middleware();

// Per debugging personalizzato, usa afterCallback:
export default auth0.middleware({
  afterCallback: async (req, session) => {
    console.log('[Auth0 Middleware]', {
      path: req.nextUrl.pathname,
      hasSession: !!session,
      user: session?.user?.sub
    });
    return session;
  }
});
```

**Verifica esclusioni**:
```bash
# Check if service worker is accessible without auth
curl -I https://tuodominio.com/sw.js
# Should return 200, not 307 redirect

# Check manifest
curl -I https://tuodominio.com/manifest.json
# Should return 200, not 307 redirect
```

### Route Esclusioni Comuni

```javascript
// Route da SEMPRE escludere da auth middleware
const PUBLIC_ROUTES = [
  // Auth0
  'api/auth',           // Auth0 routes (/login, /callback, /logout)

  // PWA
  'offline',            // Offline fallback page
  'manifest.json',      // PWA manifest
  'sw.js',              // Service worker
  'firebase-messaging-sw.js',  // FCM service worker
  'icons',              // PWA icons directory

  // Next.js internals
  '_next',              // Next.js static assets
  'favicon.ico',        // Favicon

  // Public APIs (esempi)
  'api/scheduler/check',  // Cron endpoint (protetto da CRON_SECRET)
  'api/admin',            // Admin endpoints (protetto da Bearer token)

  // Static assets
  '*.png',
  '*.jpg',
  '*.svg',
  '*.ico',
];
```

### Troubleshooting

**Problema**: Auth0 redirect loop su mobile dopo navigazione
**Soluzione**: Verifica che route PWA siano escluse + configura Auth0 cookie settings
**Dettagli**: [Troubleshooting - Auth0 Redirect Loop](./troubleshooting.md#redirect-loop-su-mobile-production)

**Problema**: Service worker non si registra
**Soluzione**: Verifica che `/sw.js` risponda 200 (non 307)

**Problema**: PWA non installabile
**Soluzione**: Verifica che `/manifest.json` e `/icons/*` siano accessibili senza auth

**Implementazione**: `middleware.js:4-19`

## API Wrapper Functions Pattern

Pattern per intercettare chiamate API con logica condizionale (es: sandbox, mock, caching).

### Pattern Base

```javascript
// lib/someApi.js

/**
 * Wrapper function che intercetta chiamate API
 * Permette di iniettare logica custom prima della chiamata reale
 */
export async function getSomeData() {
  // 1. Check condition (es: sandbox mode, offline mode, etc.)
  if (shouldUseMockData()) {
    const mockData = await getMockData();
    return {
      ...mockData,
      isMock: true, // Flag per identificare source
    };
  }

  // 2. Chiamata API reale
  const response = await fetch('/api/real-endpoint');
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  return { ...data, isMock: false };
}

/**
 * POST wrapper con stessa logica
 */
export async function updateSomeData(payload) {
  if (shouldUseMockData()) {
    return await updateMockData(payload);
  }

  const response = await fetch('/api/real-endpoint', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}
```

### API Routes Integration

```javascript
// app/api/some-endpoint/route.js
import { getSomeData } from '@/lib/someApi';

/**
 * API route usa wrapper function
 * Wrapper gestisce automaticamente mock vs real
 */
export async function GET() {
  try {
    const data = await getSomeData(); // Wrapper intercetta automaticamente
    return Response.json(data);
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

### Best Practices

**1. Flag di identificazione source**
```javascript
return {
  ...data,
  isMock: true,        // ✅ Flag esplicito
  isSandbox: true,     // ✅ Flag esplicito
  isFromCache: true,   // ✅ Flag esplicito
};
```

**2. Condizioni environment-safe**
```javascript
// ✅ CORRECT - verifica ambiente prima
if (isLocalEnvironment() && await isSandboxEnabled()) {
  return await getMockData();
}

// ❌ WRONG - potrebbe attivare in production
if (await isSandboxEnabled()) {
  return await getMockData();
}
```

**3. Formato response consistente**
```javascript
// ✅ CORRECT - stesso formato per mock e real
const mockData = await getMockData();
return {
  Result: mockData.value,  // Converti al formato API reale
  isMock: true,
};

// ❌ WRONG - formati inconsistenti
return mockData;  // Formato diverso dall'API reale
```

**4. Wrapper per TUTTI gli endpoint correlati**
```javascript
// ✅ CORRECT - wrapper completo
export async function getStatus() { /* wrapper */ }
export async function ignite() { /* wrapper */ }
export async function shutdown() { /* wrapper */ }

// ❌ WRONG - solo alcuni endpoint wrappati
export async function getStatus() { /* wrapper */ }
const ignite = '/api/ignite';  // Direct URL
```

**Implementazione esempio**: `lib/stoveApi.js:91-256`

## Environment Detection Pattern

Pattern per feature disponibili solo in development/localhost.

### Pattern Base

```javascript
// lib/environmentUtils.js

/**
 * Verifica se siamo in ambiente locale
 * Check sia client che server-side
 */
export function isLocalEnvironment() {
  // Server-side check
  if (typeof window === 'undefined') {
    return process.env.NODE_ENV === 'development';
  }

  // Client-side check
  return (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === ''
  );
}

/**
 * Feature flag condizionale
 */
export async function isFeatureEnabled() {
  // Guard: feature solo in localhost
  if (!isLocalEnvironment()) {
    return false;
  }

  // Check addizionale (es: Firebase flag)
  const enabled = await checkFirebaseFlag();
  return enabled;
}
```

### UI Conditional Rendering

```jsx
'use client';

import { useState, useEffect } from 'react';
import { isLocalEnvironment, isFeatureEnabled } from '@/lib/environmentUtils';

export default function DevOnlyFeature() {
  const [isLocal, setIsLocal] = useState(false);
  const [featureEnabled, setFeatureEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkEnvironment() {
      const local = isLocalEnvironment();
      setIsLocal(local);

      if (local) {
        const enabled = await isFeatureEnabled();
        setFeatureEnabled(enabled);
      }

      setLoading(false);
    }

    checkEnvironment();
  }, []);

  // Non renderizzare se non localhost
  if (!isLocal || loading) {
    return null;
  }

  return (
    <div>
      {/* Feature visibile solo in localhost */}
      <DevPanel enabled={featureEnabled} />
    </div>
  );
}
```

### API Route Protection

```javascript
// app/api/dev-only/route.js
import { isLocalEnvironment } from '@/lib/environmentUtils';

export async function POST(req) {
  // Guard: endpoint solo in localhost
  if (!isLocalEnvironment()) {
    return Response.json(
      { error: 'Feature disponibile solo in localhost' },
      { status: 403 }
    );
  }

  // Logic dev-only
  const result = await performDevAction();
  return Response.json(result);
}
```

### Service Layer Guards

```javascript
// lib/someService.js

export async function devOnlyFunction() {
  // Guard multipli per sicurezza
  if (!isLocalEnvironment()) {
    throw new Error('Feature disponibile solo in localhost');
  }

  // Logic dev-only
  return await performAction();
}
```

### Best Practices

**1. Guards multipli per sicurezza**
```javascript
// ✅ CORRECT - guards a tutti i livelli
// UI component
if (!isLocalEnvironment()) return null;

// Service layer
if (!isLocalEnvironment()) throw new Error('...');

// API route
if (!isLocalEnvironment()) return 403;
```

**2. Check sia client che server**
```javascript
// ✅ CORRECT - check entrambi
export function isLocalEnvironment() {
  if (typeof window === 'undefined') {
    return process.env.NODE_ENV === 'development';  // Server
  }
  return window.location.hostname === 'localhost';  // Client
}
```

**3. Nessuna assunzione automatica**
```javascript
// ❌ WRONG - assume sviluppo se non production
if (process.env.NODE_ENV !== 'production') {
  // Potrebbe includere staging, test, etc.
}

// ✅ CORRECT - esplicito
if (process.env.NODE_ENV === 'development') {
  // Solo development
}
```

**Implementazione esempio**: `lib/sandboxService.js:46-54`

## Format Conversion Pattern

Pattern per convertire dati tra formati diversi (es: sandbox → production, API A → API B).

### Pattern Base

```javascript
// lib/formatConverters.js

/**
 * Converti formato A → formato B
 */
export function convertAToB(dataA) {
  return {
    fieldB1: dataA.fieldA1,
    fieldB2: dataA.fieldA2 || 'default',
    // Mapping esplicito
    fieldB3: mapValue(dataA.fieldA3),
  };
}

/**
 * Converti formato B → formato A
 */
export function convertBToA(dataB) {
  return {
    fieldA1: dataB.fieldB1,
    fieldA2: dataB.fieldB2,
    fieldA3: reverseMapValue(dataB.fieldB3),
  };
}

function mapValue(input) {
  // Logic conversione
  return output;
}
```

### Integration con Wrapper Functions

```javascript
// lib/someApi.js
import { convertMockToReal } from './formatConverters';

export async function getSomeData() {
  if (shouldUseMock()) {
    const mockData = await getMockData();

    // Converti formato mock → formato reale
    return {
      ...convertMockToReal(mockData),
      isMock: true,
    };
  }

  // Formato reale già corretto
  const response = await fetch('/api/real');
  const data = await response.json();
  return { ...data, isMock: false };
}
```

### Best Practices

**1. Conversione esplicita con mapping chiaro**
```javascript
// ✅ CORRECT - mapping esplicito
export function convertSandboxToProduction(sandbox) {
  return {
    StatusDescription: sandbox.status,       // Rinomina campo
    Error: parseErrorCode(sandbox.error),    // Conversione tipo
    ErrorDescription: sandbox.error?.description || '',
  };
}

// ❌ WRONG - spread generico
export function convert(data) {
  return { ...data };  // Non converte nulla
}
```

**2. Gestione campi opzionali**
```javascript
// ✅ CORRECT - defaults espliciti
return {
  required: data.value,
  optional: data.optional || 'default',
  nullable: data.nullable ?? null,
};

// ❌ WRONG - undefined non permessi (Firebase)
return {
  field: data.maybe,  // Potrebbe essere undefined
};
```

**3. Conversioni reversibili quando possibile**
```javascript
// ✅ CORRECT - funzioni paired
export function convertAToB(a) { /* ... */ }
export function convertBToA(b) { /* ... */ }

// Test roundtrip
const original = { /* ... */ };
const converted = convertAToB(original);
const back = convertBToA(converted);
assert.deepEqual(original, back);  // Dovrebbe essere uguale
```

**Implementazione esempio**: `lib/stoveApi.js:94-127`, `lib/maintenanceService.js:47-60`

## Immediate Feedback UX Pattern

Pattern per feedback utente immediato e chiaro con triplo approccio: preventivo → azione → conferma.

### Pattern Base

**Scenario**: Azione utente che causa cambio stato sistema (es: cambio modalità scheduler)

**Triplo Feedback**:
1. **Preventivo**: Badge/banner informativo PRIMA dell'azione
2. **Azione**: Cambio stato immediato (no attesa polling)
3. **Conferma**: Toast notification post-azione

```javascript
'use client';

import { useState } from 'react';
import Toast from '../ui/Toast';

export default function ActionComponent() {
  const [systemMode, setSystemMode] = useState('auto');
  const [toast, setToast] = useState(null);

  const handleUserAction = async () => {
    // 1. Call API
    const response = await fetch('/api/action', {
      method: 'POST',
      body: JSON.stringify({ data: '...' })
    });
    const data = await response.json();

    // 2. Check se cambio di stato
    if (data.stateChanged) {
      // 3. Update UI IMMEDIATAMENTE (no polling wait)
      setSystemMode(data.newMode);

      // 4. Toast confirmation
      setToast({
        message: 'Stato cambiato con successo',
        icon: '✓',
        variant: 'success'
      });

      // 5. Optional: verify with backend dopo delay
      setTimeout(() => fetchLatestState(), 500);
    }
  };

  return (
    <>
      {/* 1. PREVENTIVO: Informative badge */}
      {systemMode === 'auto' && (
        <div className="px-4 py-2 bg-info-50 rounded-lg text-sm text-info-700">
          ℹ️ Questa azione cambierà la modalità
        </div>
      )}

      {/* 2. AZIONE: User control */}
      <button onClick={handleUserAction}>
        Esegui Azione
      </button>

      {/* 3. CONFERMA: Toast feedback */}
      {toast && (
        <Toast
          message={toast.message}
          icon={toast.icon}
          variant={toast.variant}
          duration={3000}
          onDismiss={() => setToast(null)}
        />
      )}
    </>
  );
}
```

### Best Practices

**1. Badge preventivo**
- Colore: `bg-info-50` (blu neutro, non allarmante)
- Posizionamento: Sopra/vicino al controllo che attiverà l'azione
- Testo: Breve e chiaro ("Questa azione farà X")
- Condizione: Visibile solo quando rilevante

**2. Aggiornamento stato immediato**
```javascript
// ✅ CORRECT - Update locale + verify
if (data.modeChanged) {
  // Immediate local update
  setMode(data.newMode);
  setRelatedField(data.newValue);

  // Verify from backend (safety)
  setTimeout(() => refetchFromBackend(), 500);
}

// ❌ WRONG - Wait for polling
if (data.modeChanged) {
  // User sees no feedback for 5-10s
  // Bad UX
}
```

**3. Toast notification**
- Durata: 3000ms (3 secondi) per lettura comoda
- Variante semantica: success (verde), warning (giallo), error (rosso)
- Massimo 1 toast alla volta (sostituisci stato)
- Messaggio: Max 2 righe, focus sul "cosa è successo"

**4. API Response Structure**
```javascript
// Backend API should return enriched data
return Response.json({
  ...originalData,
  stateChanged: true,      // Flag per UI
  newMode: 'semi-manual',   // New state value
  metadata: { /* ... */ }   // Optional context
});
```

### Varianti Pattern

**Variante 1: Feedback su modifica input**
```javascript
// Badge appare sopra select quando condizione attiva
{isInAutomaticMode && (
  <div className="mb-2 px-3 py-1.5 bg-info-50 rounded text-xs text-info-700">
    La modifica attiverà override temporaneo
  </div>
)}

<Select onChange={handleChange} />
```

**Variante 2: Feedback su salvataggio**
```javascript
const handleSave = async () => {
  const response = await saveData();

  setToast({
    message: response.saved ? 'Salvato' : 'Errore salvataggio',
    variant: response.saved ? 'success' : 'error'
  });
};
```

**Variante 3: Feedback multi-step**
```javascript
// Step 1: Preventivo (banner)
// Step 2: Conferma (modal)
// Step 3: Azione (loading)
// Step 4: Risultato (toast)
```

### Console Logging

Aggiungi console.log per debugging durante sviluppo:

```javascript
if (data.modeChanged) {
  console.log('[Component] Mode changed:', data);

  setToast({ /* ... */ });
  // ...
}
```

**Best practice logging**:
- Prefix: `[ComponentName]` per filtro rapido
- Data completa: Log l'intero oggetto per debug
- Rimuovi in production: O usa environment check

**Implementazione esempio**:
- `app/components/devices/stove/StoveCard.js:241-305` (handleFanChange, handlePowerChange)
- `app/api/stove/setFan/route.js:28-34` (enriched response)

## Skeleton UI Alignment Pattern

**Pattern**: Quando modifichi l'UI di un componente, aggiorna SEMPRE il corrispondente Skeleton per mantenere il loading placeholder allineato.

### ❌ Anti-Pattern
```javascript
// Modifichi StoveCard con nuovo layout Frame 3
<div className="grid grid-cols-2 gap-4">
  <BoxVentola />
  <BoxPotenza />
</div>

// Ma NON aggiorni Skeleton.StovePanel → Utente vede layout inconsistente durante loading
```

### ✅ Pattern Corretto
```javascript
// 1. Modifichi StoveCard
<div className="relative mb-[-40px]">
  <IconaGrande />
</div>
<div className="relative z-10 grid grid-cols-2 gap-4">
  <BoxGlassmorphism />
</div>

// 2. IMMEDIATAMENTE aggiorni Skeleton.StovePanel con STESSA struttura
<div className="relative mb-[-40px]">
  <Skeleton className="h-[120px] w-[120px]" />
</div>
<div className="relative z-10 grid grid-cols-2 gap-4">
  <Skeleton className="min-h-[100px]" />
</div>
```

### Checklist Skeleton Update

Quando modifichi UI, verifica di aggiornare:

1. **Struttura HTML**: Stesso numero div/container
2. **Layout classes**: Grid, flex, gap, padding identici
3. **Dimensioni**: Height/width coerenti (usa classi Skeleton)
4. **Z-index e positioning**: Absolute, relative, z-10 stesso ordine
5. **Margin negativi**: Se usi overlap, replica in Skeleton

### Skeleton Components Disponibili

```javascript
// app/components/ui/Skeleton.js
<Skeleton className="h-8 w-32" />              // Base skeleton

<Skeleton.Card>...</Skeleton.Card>             // Card wrapper

<Skeleton.StovePanel />                         // StoveCard homepage
<Skeleton.ThermostatCard />                     // ThermostatCard
<Skeleton.Scheduler />                          // Scheduler page
<Skeleton.LogEntry />                           // Single log entry
<Skeleton.LogPage />                            // Log page complete
<Skeleton.NetatmoPage />                        // Netatmo dashboard
```

### Esempio Completo: StoveCard Frame 3 Update

**Prima** (vecchio layout):
```javascript
// StoveCard.js (vecchio)
<div className="rounded-3xl p-8">
  <div className="rounded-full">
    <Icon />
  </div>
  <div className="grid grid-cols-2">
    <Fan />
    <Power />
  </div>
</div>

// Skeleton.js (vecchio)
<div className="rounded-3xl p-8">
  <Skeleton className="h-24 w-24 rounded-full" />
  <div className="grid grid-cols-2">
    <Skeleton className="h-12" />
    <Skeleton className="h-12" />
  </div>
</div>
```

**Dopo** (nuovo layout Frame 3):
```javascript
// StoveCard.js (nuovo) - Frame 3 style
<div className="relative flex flex-col items-center">
  <div className="relative mb-[-40px]">  {/* Margin negativo per overlap */}
    <span className="text-[120px]">{icon}</span>
  </div>
  <div className="relative z-10 grid grid-cols-2 gap-4 mt-4">
    <BoxGlass minHeight={100} />
    <BoxGlass minHeight={100} />
  </div>
</div>

// Skeleton.js (nuovo) - STESSA struttura
<div className="relative flex flex-col items-center">
  <div className="relative mb-[-40px]">  {/* STESSO margin negativo */}
    <Skeleton className="h-[120px] w-[120px] rounded-full" />
  </div>
  <div className="relative z-10 grid grid-cols-2 gap-4 mt-4">  {/* STESSO layout */}
    <div className="min-h-[100px]">  {/* STESSA altezza minima */}
      <Skeleton className="h-8" />
    </div>
    <div className="min-h-[100px]">
      <Skeleton className="h-8" />
    </div>
  </div>
</div>
```

### Performance Note

- Skeleton è **sempre visibile** durante initial load (prima che arrivano dati)
- Layout shift (CLS) se Skeleton non matcha UI = **UX negativa**
- Test loading state: Limita network in DevTools per vedere Skeleton

### Implementazione

**File**:
- `app/components/ui/Skeleton.js:48-180` (Skeleton.StovePanel)
- `app/components/devices/stove/StoveCard.js:558-665` (StoveCard UI)

**Commit checklist**:
- [ ] Modificato componente UI
- [ ] Aggiornato Skeleton corrispondente
- [ ] Testato loading state (throttle network)
- [ ] Verificato no layout shift (CLS)

## See Also

- [UI Components](./ui-components.md) - Componenti base riutilizzabili (Toast)
- [Firebase](./firebase.md) - Firebase operations patterns
- [Testing](./testing.md) - Testing patterns
- [Troubleshooting](./troubleshooting.md) - Common issues and solutions

---

**Last Updated**: 2025-11-03
**Version**: 1.11.0
