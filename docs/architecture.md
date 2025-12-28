# Architecture

Architettura multi-device scalabile per gestione dispositivi smart home.

## Overview

Il progetto utilizza un'architettura modulare basata su device registry centralizzato che permette di:
- Aggiungere/rimuovere dispositivi senza modificare il core
- Gestire configurazione dispositivi in un unico posto
- Scalare facilmente con nuovi dispositivi (luci, termostato, sonos, etc.)

## Multi-Device Architecture

### Device Registry (`lib/devices/deviceTypes.js`)

Registry centralizzato per configurazione tutti i dispositivi supportati.

```javascript
export const DEVICE_TYPES = {
  STOVE: 'stove',
  THERMOSTAT: 'thermostat',
  LIGHTS: 'lights',    // Future dev
  SONOS: 'sonos',      // Future dev
};

export const DEVICE_CONFIG = {
  [DEVICE_TYPES.STOVE]: {
    id: 'stove',
    name: 'Stufa',
    icon: '🔥',
    color: 'primary',     // Tailwind palette
    enabled: true,        // Mostra in homepage
    routes: {
      main: '/',
      scheduler: '/scheduler',
      maintenance: '/maintenance',
      errors: '/errors',
    },
    features: {
      hasScheduler: true,
      hasMaintenance: true,
      hasErrors: true,
    },
  },
  [DEVICE_TYPES.THERMOSTAT]: {
    id: 'thermostat',
    name: 'Termostato',
    icon: '🌡️',
    color: 'info',
    enabled: true,
    routes: {
      main: '/',
    },
    features: {
      hasScheduler: false,
      hasMaintenance: false,
      hasErrors: false,
    },
  },
  // ... altri device
};
```

**Config Structure**:
- `id` - Identificatore unico device
- `name` - Nome visualizzato
- `icon` - Emoji rappresentativa
- `color` - Colore semantico (primary/accent/success/info/etc.)
- `enabled` - Mostra in homepage (true/false)
- `routes` - Percorsi pagine device
- `features` - Feature flags per funzionalità device

### Helper Functions

**`getEnabledDevices()`**
Filtra solo device con `enabled: true`.

```javascript
import { getEnabledDevices } from '@/lib/devices';

const enabledDevices = getEnabledDevices();
// Returns: [{ id: 'stove', ... }, { id: 'thermostat', ... }]
```

**`getDeviceConfig(id)`**
Ottiene configurazione singolo device.

```javascript
import { getDeviceConfig } from '@/lib/devices';

const stoveConfig = getDeviceConfig('stove');
// Returns: { id: 'stove', name: 'Stufa', ... }
```

**Implementazione**: `lib/devices/deviceTypes.js`, `lib/devices/index.js`

## Device Cards Pattern

Ogni device ha card dedicata in `app/components/devices/{device}/`:

```
app/components/devices/
├── stove/
│   └── StoveCard.js         # Polling 5s, controls, maintenance bar
├── thermostat/
│   └── ThermostatCard.js    # Multi-room selection, temperature controls
└── lights/                   # Future dev
    └── LightsCard.js        # Hue lights control
```

### Self-Contained Pattern

**Principio fondamentale**: Ogni device card è **auto-contenuta** e include **tutte le informazioni** specifiche del device.

**✅ CORRETTO - Dentro la card**:
- Banner specifici del device (manutenzione, errori connessione, warning)
- Stato e metriche del device
- Controlli e azioni
- Link a pagine dedicate

**❌ SCORRETTO - Fuori dalla card**:
- Banner device-specific fuori dalla card principale
- Informazioni frammentate in più card separate

**Esempio**:

```jsx
// ✅ CORRETTO - Auto-contenuto
<Card liquid>
  {/* Device-specific banner INSIDE */}
  {needsMaintenance && <Banner variant="warning" title="Pulizia Richiesta" />}

  {/* Status, controls, etc. */}
  <StatusDisplay />
  <Controls />
</Card>

// ❌ SCORRETTO - Banner fuori dalla card
{needsMaintenance && <Banner variant="warning" />}
<Card liquid>
  <StatusDisplay />
  <Controls />
</Card>
```

**Eccezione**: Alert critici di sistema che riguardano più device o errori globali possono stare fuori dalle card.

**Implementazione**: `app/components/devices/stove/StoveCard.js:376-413` (maintenance banner), `app/components/devices/thermostat/ThermostatCard.js:248-260` (error banner), `app/components/devices/lights/LightsCard.js:281-293` (error banner)

### Pattern Comune

Tutte le device cards seguono lo stesso pattern:

1. **Connection Check** - Verifica connessione API/servizio
2. **Polling** - Fetch stato ogni N secondi
3. **Self-Contained UI** - Banner e info device-specific dentro la card
4. **Controls** - Interfaccia controllo device
5. **Link Pagina Dedicata** - Link a pagina full-featured (se esiste)

**Esempio: StoveCard**

```javascript
'use client';

import { useState, useEffect } from 'react';
import Card from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';

export default function StoveCard() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Connection check + polling
  useEffect(() => {
    const fetchStatus = async () => {
      const res = await fetch('/api/stove/status');
      const data = await res.json();
      setStatus(data);
      setLoading(false);
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 5000); // 5s polling
    return () => clearInterval(interval);
  }, []);

  // 2. Controls
  const handleIgnite = async () => {
    await fetch('/api/stove/ignite', {
      method: 'POST',
      body: JSON.stringify({ source: 'manual' }),
    });
  };

  // 3. UI
  return (
    <Card liquid className="p-6">
      <h2>🔥 Stufa</h2>
      {/* Status display */}
      {/* Controls */}
      {/* Link pagina dedicata */}
    </Card>
  );
}
```

**Implementazione**: `app/components/devices/stove/StoveCard.js`, `app/components/devices/thermostat/ThermostatCard.js`

## Homepage Layout

Layout responsive con grid che si adatta automaticamente ai device abilitati.

```jsx
// app/page.js
import { getEnabledDevices } from '@/lib/devices';
import StoveCard from '@/app/components/devices/stove/StoveCard';
import ThermostatCard from '@/app/components/devices/thermostat/ThermostatCard';

export default function HomePage() {
  const enabledDevices = getEnabledDevices();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
      {enabledDevices.map(device => {
        if (device.id === 'stove') return <StoveCard key={device.id} />;
        if (device.id === 'thermostat') return <ThermostatCard key={device.id} />;
        if (device.id === 'lights') return <LightsCard key={device.id} />;
        // ... altri device
        return null;
      })}
    </div>
  );
}
```

**Responsive Behavior**:
- **Mobile** (< 1024px): Stack verticale (1 colonna)
- **Desktop** (≥ 1024px): Grid 2 colonne

**Implementazione**: `app/page.js`

## Aggiungere Nuovo Device

Procedura step-by-step per integrare nuovo dispositivo.

### Step 1: Aggiorna Device Registry

```javascript
// lib/devices/deviceTypes.js

// 1. Aggiungi type
export const DEVICE_TYPES = {
  // ... existing
  SONOS: 'sonos',
};

// 2. Aggiungi config
export const DEVICE_CONFIG = {
  // ... existing
  [DEVICE_TYPES.SONOS]: {
    id: 'sonos',
    name: 'Sonos',
    icon: '🔊',
    color: 'accent',
    enabled: false,  // Start disabled
    routes: {
      main: '/',
    },
    features: {
      hasScheduler: false,
      hasMaintenance: false,
      hasErrors: false,
    },
  },
};
```

### Step 2: Crea Device Card

```bash
mkdir -p app/components/devices/sonos
touch app/components/devices/sonos/SonosCard.js
```

```javascript
// app/components/devices/sonos/SonosCard.js
'use client';

import { useState, useEffect } from 'react';
import Card from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';

export default function SonosCard() {
  // Implementa pattern: connection check → polling → controls
  return (
    <Card liquid className="p-6">
      <h2>🔊 Sonos</h2>
      {/* Your implementation */}
    </Card>
  );
}
```

### Step 3: Aggiungi Mapping Homepage

```javascript
// app/page.js
import SonosCard from '@/app/components/devices/sonos/SonosCard';

export default function HomePage() {
  const enabledDevices = getEnabledDevices();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
      {enabledDevices.map(device => {
        // ... existing mappings
        if (device.id === 'sonos') return <SonosCard key={device.id} />;
        return null;
      })}
    </div>
  );
}
```

### Step 4: Crea API Routes (se necessario)

```bash
mkdir -p app/api/sonos
touch app/api/sonos/status/route.js
```

```javascript
// app/api/sonos/status/route.js
import { NextResponse } from 'next/server';

export async function GET() {
  // Implementa logica fetch status
  return NextResponse.json({ /* data */ });
}
```

### Step 5: Abilita Device

Quando pronto:

```javascript
// lib/devices/deviceTypes.js
export const DEVICE_CONFIG = {
  [DEVICE_TYPES.SONOS]: {
    // ...
    enabled: true,  // Enable device
  },
};
```

## External API Integration Pattern

Pattern per integrare API esterne (OAuth, REST, etc.).

Vedi [API Routes](./api-routes.md) per dettagli completi.

**Struttura base**:
```
app/api/[device-api]/
├── callback/route.js        # OAuth callback (se necessario)
├── status/route.js          # Status endpoint
└── [action]/route.js        # Action endpoints

lib/[device-api]/
├── api.js                   # API wrapper
├── service.js               # State management + Firebase (opzionale)
└── tokenHelper.js           # Token management (se OAuth)
```

**Esempio**: Vedi `lib/netatmo/` per implementazione completa OAuth 2.0 con auto-refresh.

## Navbar Device Menu

Menu dropdown in navbar per navigazione rapida tra device.

**Desktop**: Dropdown con lista device abilitati
**Mobile**: Accordion nel mobile menu

**Configurazione**: `DEVICE_CONFIG` in `lib/devices/deviceTypes.js`

**Implementazione**: `app/components/Navbar.js`

## Settings Menu

Menu dropdown impostazioni in navbar.

**Voci**:
- Gestione Notifiche (`/settings/notifications`)
- Storico (`/log`)
- Changelog (`/changelog`)

**Configurazione**: `SETTINGS_MENU` in `lib/devices/deviceTypes.js`

**Implementazione**: `app/components/Navbar.js`

## Custom Hooks

### useVersionCheck (Soft Notification)

Hook per notifica soft nuove versioni.

**Features**:
- Semantic version comparison
- localStorage tracking per dismissione
- Badge "NEW" + WhatsNewModal dismissibile

**Implementazione**: `app/hooks/useVersionCheck.js`

### useVersion (Hard Enforcement)

Context hook per enforcement versione obbligatoria.

**Features**:
- Global context state
- On-demand check ogni 5s (integrato in polling)
- ForceUpdateModal bloccante SOLO se versione locale < Firebase

**Implementazione**: `app/context/VersionContext.js`

## Authentication Middleware

Pattern di autenticazione globale con validazione sessione Auth0 in middleware.

**File**: `middleware.js`

### Implementazione

```javascript
import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

export async function middleware(req) {
  // Step 1: Bypass in test mode
  if (process.env.TEST_MODE === 'true') {
    return NextResponse.next();
  }

  // Step 2: Delega route auth ad Auth0 middleware
  const authResponse = await auth0.middleware(req);
  if (authResponse) {
    return authResponse;
  }

  // Step 3: Valida sessione con Auth0
  const session = await auth0.getSession(req);
  if (!session) {
    const loginUrl = new URL('/auth/login', req.url);
    loginUrl.searchParams.set('returnTo', req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  // Step 4: Consenti accesso
  return NextResponse.next();
}
```

### Caratteristiche Principali

1. **TEST_MODE Bypass**: Permette test E2E senza autenticazione
2. **Gestione Route Auth**: Delega `/auth/*` routes ad Auth0 SDK
3. **Validazione Sessione**: Usa `getSession(request)` per verifica completa token
4. **Return URL**: Preserva URL destinazione per redirect post-login
5. **Compatibilità PWA**: Matcher esclude service workers e manifests

### Defense-in-Depth

Middleware fornisce **primo layer** di protezione. Validare sempre sessione in:

- **Server Components**: Usa `await auth0.getSession()` prima di renderizzare
- **API Routes**: Usa `await auth0.getSession()` prima di accesso database
- **Server Actions**: Usa `await auth0.getSession()` prima di mutazioni

**Esempio Server Component**:

```javascript
// app/dashboard/page.js
import { auth0 } from '@/lib/auth0';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await auth0.getSession();

  if (!session) {
    redirect('/auth/login?returnTo=/dashboard');
  }

  // Renderizza contenuto protetto
  return <div>Welcome, {session.user.name}!</div>;
}
```

**Rationale**: CVE-2025-29927 ha dimostrato che protezione solo middleware è insufficiente. Validare sempre al layer dati.

### Matcher Configuration

```javascript
export const config = {
  matcher: [
    "/((?!api/scheduler/check|api/stove|api/admin|offline|_next|favicon.ico|icons|manifest.json|sw.js|firebase-messaging-sw.js).*)",
  ],
};
```

**Esclude**:
- API pubbliche (`/api/scheduler/check`, `/api/admin`, etc.)
- Asset PWA (`/offline`, `/manifest.json`, `/sw.js`, etc.)
- Internal Next.js (`/_next/*`, `/favicon.ico`)

**Include**:
- Tutte le route pagine (`/`, `/dashboard`, etc.)
- Route auth (`/auth/login`, `/auth/callback`) - gestite da `auth0.middleware()`

### Testing Manuale

1. **Accesso non autenticato** → Redirect a login
2. **Accesso autenticato** → Consenti accesso
3. **Parametro returnTo** → Redirect a pagina corretta post-login
4. **TEST_MODE** → Bypass auth nei test
5. **Asset PWA** → Accessibili senza auth

**Implementazione**: `middleware.js:1-40`

## See Also

- [API Routes](./api-routes.md) - API patterns e external integrations
- [UI Components](./ui-components.md) - Device cards UI components
- [Firebase](./firebase.md) - Schema device data
- [Systems](./systems/) - Device-specific systems (maintenance, errors, etc.)

---

**Last Updated**: 2025-12-28
