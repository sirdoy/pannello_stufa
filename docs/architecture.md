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

### Pattern Comune

Tutte le device cards seguono lo stesso pattern:

1. **Connection Check** - Verifica connessione API/servizio
2. **Polling** - Fetch stato ogni N secondi
3. **Controls** - Interfaccia controllo device
4. **Link Pagina Dedicata** - Link a pagina full-featured (se esiste)

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

## See Also

- [API Routes](./api-routes.md) - API patterns e external integrations
- [UI Components](./ui-components.md) - Device cards UI components
- [Firebase](./firebase.md) - Schema device data
- [Systems](./systems/) - Device-specific systems (maintenance, errors, etc.)

---

**Last Updated**: 2025-10-21
