# CLAUDE.md

Guida completa per Claude Code quando lavora su questo repository.

## 📑 Indice

### 🚀 Getting Started
- [Overview Progetto](#overview-progetto)
- [Quick Start](#quick-start)
- [Stack Tecnologico](#stack-tecnologico)
- [Struttura Directory](#struttura-directory)

### 🏗️ Architettura
- [Componenti UI](#componenti-ui)
- [Custom Hooks](#custom-hooks)
- [Pagine](#pagine)
- [API Routes](#api-routes)
- [Data Flow](#data-flow)

### 🔌 Integrazioni
- [Thermorossi Cloud API](#thermorossi-cloud-api)
- [Firebase Realtime DB](#firebase-realtime-database)
- [Auth0](#auth0)
- [Netatmo API](#netatmo-api)
- [Error Monitoring](#error-monitoring)
- [Logging System](#logging-system)

### ⏰ Scheduler
- [Modalità Operative](#modalità-operative)
- [Cron Integration](#cron-integration)
- [Validation Logic](#validation-logic)

### 🎨 Design System
- [Tailwind Configuration](#tailwind-configuration)
- [Component Patterns](#component-patterns)
- [Styling Best Practices](#styling-best-practices)

### 📱 PWA
- [Configuration](#pwa-configuration)
- [Caching Strategy](#caching-strategy)
- [Offline Support](#offline-support)

### ✅ Best Practices
- [Versioning](#versioning-workflow)
- [Code Quality](#code-quality)
- [Testing](#testing)
- [Security](#security)
- [Performance](#performance)

### 🔧 Deployment & Maintenance
- [Deployment Workflow](#deployment-workflow)
- [Troubleshooting](#troubleshooting)
- [Debugging](#debugging)

---

## Overview Progetto

**Pannello Stufa** - Next.js 15 PWA per controllo remoto stufa pellet Thermorossi via cloud API.

### Descrizione
Applicazione web progressiva che permette il controllo completo della stufa (accensione, spegnimento, regolazioni), pianificazione settimanale automatica, integrazione con sistema domotico Netatmo, e monitoraggio errori in tempo reale.

### Caratteristiche principali
- ✅ Controllo remoto stufa via cloud API Thermorossi
- ✅ Pianificazione settimanale automatica con scheduler
- ✅ Integrazione termostato Netatmo
- ✅ Monitoraggio errori e notifiche browser
- ✅ Modalità automatica/manuale/semi-manuale
- ✅ PWA installabile (offline-ready)
- ✅ Sistema versioning con enforcement
- ✅ Storico azioni e log utente
- ✅ Autenticazione Auth0

---

## Quick Start

### Setup iniziale
```bash
# 1. Clona e installa dipendenze
git clone [repo-url]
cd pannello-stufa
npm install

# 2. Configura environment variables
cp .env.example .env.local
# Modifica .env.local con le tue credenziali

# 3. Avvia development server
npm run dev
# App disponibile su http://localhost:3000
```

### Comandi principali
```bash
npm run dev       # Dev server (PWA disabilitata, hot reload)
npm run build     # Build production (genera service worker)
npm run start     # Production server (PWA abilitata)
npm run lint      # ESLint check
```

### Test PWA locale
```bash
npm run build && npm run start
# Apri http://localhost:3000 e testa funzionalità offline
```

### Primo task
1. Leggi questo file completo (CLAUDE.md)
2. Esplora `/app/page.js` (home) per capire il flow
3. Guarda `lib/stoveApi.js` per capire le API
4. Controlla `lib/firebase.js` per il database

---

## Stack Tecnologico

### Core
- **Next.js 15** - App Router, Server/Client Components, API Routes
- **React 18** - Hooks, Suspense, Concurrent Mode
- **Tailwind CSS 3** - Utility-first styling, custom design system

### Integrazioni
- **Firebase Realtime DB** - Database real-time, scheduler data, logs
- **Auth0** - Autenticazione utenti, session management
- **Thermorossi Cloud API** - Controllo remoto stufa pellet
- **Netatmo Energy API** - Integrazione termostato smart

### PWA
- **next-pwa** - Service Worker, caching, offline fallback
- **Workbox** - Advanced caching strategies

### Lingua
- **Italiano** - Tutta l'UI, labels, messaggi, log

---

## Struttura Directory

```
pannello-stufa/
├── app/                          # Next.js 15 App Router
│   ├── components/               # React components
│   │   ├── ui/                   # Atomic UI components
│   │   │   ├── Card.js           # Container base
│   │   │   ├── Button.js         # Button con varianti
│   │   │   ├── Select.js         # Custom dropdown
│   │   │   ├── Input.js          # Input fields
│   │   │   ├── StatusBadge.js    # Status indicator
│   │   │   ├── ModeIndicator.js  # Mode display
│   │   │   ├── Skeleton.js       # Loading states
│   │   │   ├── ErrorAlert.js     # Error display
│   │   │   ├── Footer.js         # App footer + version
│   │   │   └── index.js          # Barrel export
│   │   ├── scheduler/            # Scheduler components
│   │   │   ├── TimeBar.js        # 24h timeline
│   │   │   ├── ScheduleInterval.js
│   │   │   ├── DayScheduleCard.js
│   │   │   └── DayAccordionItem.js
│   │   ├── netatmo/              # Netatmo components
│   │   │   └── RoomCard.js       # Room temperature card
│   │   ├── log/
│   │   │   └── LogEntry.js       # Log entry display
│   │   ├── StovePanel.js         # Main control panel
│   │   ├── Navbar.js             # Navigation + Auth0
│   │   ├── WhatsNewModal.js      # Version changelog modal
│   │   ├── VersionNotifier.js    # Soft version notification
│   │   ├── ForceUpdateModal.js   # Hard version enforcement
│   │   └── VersionEnforcer.js    # Version check wrapper
│   │
│   ├── hooks/                    # Custom React hooks
│   │   ├── useVersionCheck.js    # Soft version check
│   │   └── useVersionEnforcement.js  # Hard version enforcement
│   │
│   ├── api/                      # API Routes
│   │   ├── stove/                # Thermorossi proxy
│   │   │   ├── status/route.js
│   │   │   ├── getFan/route.js
│   │   │   ├── getPower/route.js
│   │   │   ├── ignite/route.js
│   │   │   ├── shutdown/route.js
│   │   │   ├── setFan/route.js
│   │   │   └── setPower/route.js
│   │   ├── scheduler/
│   │   │   └── check/route.js    # Cron endpoint
│   │   ├── netatmo/              # Netatmo endpoints
│   │   ├── log/
│   │   │   └── add/route.js      # User action logging
│   │   ├── user/route.js         # User info
│   │   └── auth/[...auth0]/route.js  # Auth0 handler
│   │
│   ├── page.js                   # Home - Stove control
│   ├── scheduler/page.js         # Weekly scheduler
│   ├── log/page.js               # Action history
│   ├── errors/page.js            # Error history
│   ├── changelog/page.js         # Version history
│   ├── netatmo/page.js           # Netatmo dashboard
│   ├── offline/page.js           # PWA offline fallback
│   ├── layout.js                 # Root layout
│   └── globals.css               # Global styles (minimal)
│
├── lib/                          # Utility libraries
│   ├── stoveApi.js               # Thermorossi API wrapper
│   ├── netatmoApi.js             # Netatmo API wrapper
│   ├── firebase.js               # Firebase client SDK
│   ├── schedulerService.js       # Scheduler operations
│   ├── netatmoService.js         # Netatmo service layer
│   ├── logService.js             # Logging utilities
│   ├── errorMonitor.js           # Error detection & notification
│   ├── changelogService.js       # Version management
│   ├── version.js                # App version constants
│   └── routes.js                 # Centralized route definitions
│
├── public/                       # Static assets
│   ├── manifest.json             # PWA manifest
│   ├── icons/                    # PWA icons
│   └── sw.js                     # Service Worker (generated)
│
├── middleware.js                 # Auth0 middleware
├── next.config.mjs               # Next.js + PWA config
├── tailwind.config.js            # Tailwind design system
├── package.json                  # Dependencies
├── CLAUDE.md                     # This file
└── CHANGELOG.md                  # Version history
```

---

## Componenti UI

### Card Component
Container base per layout consistente.

```jsx
import { Card } from '@/app/components/ui';

<Card className="p-6">
  {/* content */}
</Card>
```

**Props**: `children`, `className` (merged con base styles)

---

### Button Component
Pulsante con varianti multiple e stati.

```jsx
import { Button } from '@/app/components/ui';

<Button
  variant="primary"    // primary|secondary|success|danger|accent|outline|ghost
  size="md"            // sm|md|lg
  icon="🔥"           // optional emoji/icon
  disabled={false}
  loading={false}
  onClick={handleClick}
>
  Accendi
</Button>
```

**Variants**:
- `primary` - Rosso, azioni principali
- `secondary` - Grigio, azioni secondarie
- `success` - Verde, conferme
- `danger` - Rosso intenso, azioni distruttive
- `accent` - Arancione, mode manuale
- `outline` - Bordo, azioni terziarie
- `ghost` - Trasparente, minimal

---

### Select Component
Dropdown custom (non-native) con animazioni.

```jsx
import { Select } from '@/app/components/ui';

<Select
  value={power}
  onChange={setPower}
  options={[
    { value: 1, label: 'Potenza 1' },
    { value: 2, label: 'Potenza 2' },
    // ...
  ]}
  disabled={!isOn}
/>
```

**Features**:
- React state management
- Animazione dropdown (`animate-dropdown`)
- Click-outside to close
- Disabled state (opacity + cursor-not-allowed)
- No placeholder options (solo valori reali)

---

### Skeleton Component
Loading placeholders pre-configurati.

```jsx
import { Skeleton } from '@/app/components/ui';

// Pre-built skeletons
if (loading) return <Skeleton.StovePanel />;
if (loading) return <Skeleton.Scheduler />;
if (loading) return <Skeleton.LogPage />;
```

**Pattern**:
- Mostra solo durante fetch iniziale
- Non mostrare su updates successivi (evita flashing)
- Animazione shimmer automatica

---

### Footer Component
Info autore e versione + soft version notification.

```jsx
// Auto-incluso in app/layout.js
import { Footer } from '@/app/components/ui';
```

**Features**:
- Version da `lib/version.js`
- Badge "NEW" animato quando nuova versione disponibile
- Click badge → dismiss notifica + save localStorage
- Modal "What's New" integrato
- Link cliccabile a `/changelog`

---

### Modal Components

#### WhatsNewModal
Modal informativa per nuove versioni (soft notification).

**Features**:
- Mostra automaticamente al primo accesso post-update
- Header gradiente colorato per tipo (major/minor/patch)
- Lista modifiche versione corrente
- Link a changelog completo
- Checkbox "Non mostrare più" per versione specifica
- Dismissibile (ESC, backdrop click, close button)

#### ForceUpdateModal
Modal bloccante per aggiornamento obbligatorio (hard enforcement).

**Features**:
- Appare quando `local_version !== firebase_version`
- **NON dismissibile** (no ESC, no backdrop, no close)
- Design distintivo (gradiente primary/accent, pulse animation)
- Mostra versione corrente vs richiesta
- Unica azione: "🔄 Aggiorna Ora" → `window.location.reload()`
- z-index 9999/10000 (sopra tutto)
- **Blocca completamente l'app** fino al reload

---

### Import Centralizzato
```javascript
import {
  Card,
  Button,
  Select,
  Input,
  StatusBadge,
  ModeIndicator,
  Skeleton,
  ErrorAlert,
  Footer
} from '@/app/components/ui';
```

---

## Custom Hooks

### useVersionCheck
Hook per controllo soft delle nuove versioni.

```javascript
import { useVersionCheck } from '@/app/hooks/useVersionCheck';

const {
  hasNewVersion,      // boolean - true se nuova versione disponibile
  latestVersion,      // object|null - ultima versione Firebase
  showWhatsNew,       // boolean - true se mostrare modal
  dismissWhatsNew,    // function(dontShowAgain: boolean)
  dismissBadge        // function() - nasconde badge NEW
} = useVersionCheck();
```

**Funzionalità**:
- Confronta `APP_VERSION` locale con Firebase (`semantic versioning`)
- Check localStorage: `lastSeenVersion`, `dismissedVersions`
- Mostra modal al primo accesso se versione diversa
- Badge "NEW" in footer se nuova versione disponibile

**localStorage keys**:
- `lastSeenVersion` - Ultima versione vista
- `dismissedVersions` - Array versioni permanentemente dismesse

---

### useVersionEnforcement
Hook per forzare aggiornamento app (hard enforcement).

```javascript
import { useVersionEnforcement } from '@/app/hooks/useVersionEnforcement';

const {
  needsUpdate,        // boolean - true se versione locale ≠ Firebase
  firebaseVersion     // string|null - versione attuale Firebase
} = useVersionEnforcement();
```

**Funzionalità**:
- **Polling automatico**: Check ogni 60 secondi (`setInterval`)
- **Confronto strict** (`!==`): Versione deve essere esattamente uguale
- **Trigger automatico**: `needsUpdate = true` quando diverse
- **Blocco app**: Impedisce uso fino a reload

**Differenze con useVersionCheck**:

| Feature | useVersionCheck | useVersionEnforcement |
|---------|-----------------|----------------------|
| Scopo | Notifica soft | Enforcement hard |
| Trigger | Semantic version > | Strict !== |
| UI | Badge + modal dismissibile | Modal bloccante |
| App usabilità | Piena | Bloccata |
| Polling | No (solo mount) | Sì (60s) |
| localStorage | Sì (tracking) | No |

**Usage**: Usato da `VersionEnforcer.js` in `app/layout.js`

---

## Pagine

### Home (`/`)
Pannello controllo principale stufa.

**Layout**:
1. Error Alert (se errori attivi)
2. Hero Card (status + info compatte)
   - Barra gradiente top
   - Grid 2 col: status principale | ventola/potenza
   - Separator decorativo
   - Mode indicator con icona colorata
3. Grid 2 col: Actions | Regolazioni
4. Netatmo footer (temperature)

**Mode Indicator**:
- **Automatica** ⏰: Mostra prossimo cambio scheduler
  "🔥 Accensione alle 18:30 del 04/10 (P4, V3)"
- **Semi-manuale** ⚙️: Mostra ritorno automatico
  "Ritorno auto: 18:30 del 04/10" + pulsante "↩️ Torna in Automatico"
- **Manuale** 🔧: "Controllo manuale attivo"

**Features**:
- Real-time polling: **5 secondi**
- Monitora errori → notifiche browser
- Loading: `Skeleton.StovePanel`
- Responsive: max-w-7xl, grid adapts
- Regolazioni disabilitate quando stufa OFF (con alert visivo)

---

### Scheduler (`/scheduler`)
Pianificazione settimanale automatica.

**Features**:
- Accordion UI (giorni collassabili con preview)
- TimeBar interattiva 24h
- Toggle Manual/Automatic mode
- Semi-manual status con returnToAutoAt
- Pulsante "↩️ Torna in Automatico/Manuale" (solo se semi-manuale)
- Loading: `Skeleton.Scheduler`

**Validation** (onBlur):
- End > Start + 15min
- Link adjacent intervals (bidirectional)
- Remove overlapped intervals
- Sort by start time
- Save to Firebase
- Update semi-manual returnToAutoAt (solo time fields)

---

### Log (`/log`)
Storico azioni utente.

**Features**:
- Firebase real-time display
- Avatar utente (Next.js `<Image>`, non `<img>`)
- Paginazione: 50 entries/page
- Loading: `Skeleton.LogPage`
- Filtro per azione, utente, data

---

### Errors (`/errors`)
Storico allarmi stufa.

**Features**:
- Filtri: Tutti / Attivi / Risolti
- Paginazione: 20 errors/page
- Azione: "Segna come Risolto"
- Badge severity: INFO|WARNING|ERROR|CRITICAL

---

### Changelog (`/changelog`)
Storico versioni e modifiche.

**Features**:
- Timeline versioni con badge tipo (Major/Minor/Patch)
- Visualizzazione modifiche per versione
- Source indicator (Firebase/Locale)
- Link da Footer (versione cliccabile)
- Fallback automatico a `VERSION_HISTORY` se Firebase non disponibile

---

### Netatmo (`/netatmo`)
Dashboard integrazione termostato.

**Features**:
- Grid stanze con RoomCard
- Controllo modalità riscaldamento globale
- Temperature real-time + setpoint
- Indicatori riscaldamento attivo
- Controlli per stanza: set temp, auto, off
- Polling: **30 secondi**

---

### Offline (`/offline`)
PWA offline fallback.

**Features**:
- Messaggio friendly
- Auto-reload quando connessione ripristinata
- Icona animata

---

## API Routes

### Stove Control (`/api/stove/*`)
Proxy per Thermorossi Cloud API.

| Endpoint | Method | Descrizione | Body / Note |
|----------|--------|-------------|-------------|
| `/status` | GET | Status + errori | GetStatus |
| `/getFan` | GET | Fan level 1-6 | GetFanLevel |
| `/getPower` | GET | Power level 0-5 | GetPower (UI: 1-5) |
| `/ignite` | POST | Accensione | `{source: 'manual'\|'scheduler'}` - Semi-manual SOLO se `source='manual'` |
| `/shutdown` | POST | Spegnimento | `{source: 'manual'\|'scheduler'}` - Semi-manual SOLO se `source='manual'` |
| `/setFan` | POST | Imposta ventola | `{level: 1-6, source: 'manual'\|'scheduler'}` - Semi-manual SOLO se `source='manual'` E stufa ON |
| `/setPower` | POST | Imposta potenza | `{level: 1-5, source: 'manual'\|'scheduler'}` - Semi-manual SOLO se `source='manual'` E stufa ON |

**Parametro `source`**:
- `'manual'` - Comando da homepage utente → **attiva** semi-manual se scheduler abilitato
- `'scheduler'` - Comando da cron automatico → **NON attiva** semi-manual

**Attivazione semi-manual**:
- ✅ Ignite/Shutdown manuali (sempre se scheduler attivo)
- ✅ SetPower/SetFan manuali (solo se stufa già accesa)
- ❌ Tutti i comandi da scheduler cron (source='scheduler')

**⚠️ NON SUPPORTATA**: `getRoomTemperature` (endpoint deprecato dalla stufa)

---

### Scheduler (`/api/scheduler/*`)

**`GET /check?secret=<CRON_SECRET>`** - Cron endpoint (chiamato ogni minuto)
- Verifica mode
- Compara orari
- Esegue comandi (ignite/shutdown/setPower/setFan)
- Clear semi-manual quando scheduled change
- Returns: `MODALITA_MANUALE` o `MODALITA_SEMI_MANUALE`

---

### Auth (`/api/auth/*`)
Auth0 dynamic routes (`handleAuth`).

- `/api/auth/login` - Login redirect
- `/api/auth/logout` - Logout + clear session
- `/api/auth/callback` - OAuth callback
- `/api/auth/me` - User info

---

### Netatmo (`/api/netatmo/*`)

| Endpoint | Method | Descrizione | Body |
|----------|--------|-------------|------|
| `/homesdata` | GET | Topologia completa + save Firebase | - |
| `/homestatus` | GET | Stato real-time tutte stanze + temp | - |
| `/setroomthermpoint` | POST | Imposta setpoint stanza | `{room_id, mode, temp?, endtime?}` |
| `/setthermmode` | POST | Imposta modalità casa | `{mode, endtime?}` |
| `/callback` | GET | OAuth2 callback | - |

**Room Modes**: `manual`, `home`, `max`, `off`
**Home Modes**: `schedule`, `away`, `hg` (antigelo), `off`

---

### Logging (`/api/log/*`)

**`POST /add`** - Aggiungi log azione utente
- Body: `{action, value, source: 'manual'|'scheduler'}`
- Auto-include: Auth0 user info (email, name, picture, sub)
- Solo azioni manuali vengono loggate (non scheduler)

---

### User (`/api/user/*`)

**`GET /user`** - Info utente Auth0
- Returns: `{email, name, picture, sub}`

---

## Data Flow

### Request Flow (User Action)
```
User Click → UI Component → API Route → External API → Response
                ↓                           ↓
         Update State              Log to Firebase
                ↓                           ↓
         Re-render UI           Update History/Log
```

### Real-time Polling Flow
```
                    ┌─────────────┐
                    │  useEffect  │ (5s interval)
                    └─────┬───────┘
                          │
                          ↓
                 ┌────────────────┐
                 │  Fetch Status  │
                 └────────┬───────┘
                          │
                   ┌──────┴───────┐
                   │              │
                   ↓              ↓
              Status OK      Error !== 0
                   │              │
                   ↓              ↓
           Update UI State   Log + Notify
                   │              │
                   └──────┬───────┘
                          │
                          ↓
                  Re-render Component
```

### Scheduler Flow (Cron)
```
Cron (ogni minuto)
  ↓
GET /api/scheduler/check?secret=xxx
  ↓
Check mode (auto/manual/semi-manual)
  ↓
If AUTO → Fetch schedule + Compare time
  ↓
Execute action (ignite/shutdown/set)
  ↓
If scheduled change → Clear semi-manual
  ↓
Return status
```

### Version Enforcement Flow
```
App Mount
  ↓
useVersionEnforcement (60s polling)
  ↓
Fetch latest version from Firebase
  ↓
Compare: local_version !== firebase_version?
  ↓
YES → Show ForceUpdateModal (blocking)
  ↓
User clicks "Aggiorna Ora"
  ↓
window.location.reload() → Load new version
```

---

## Thermorossi Cloud API

### Base URL
```
https://wsthermorossi.cloudwinet.it/WiNetStove.svc/json
```

### Endpoints integrati (7)
1. `GetStatus/[apikey]` → `STUFA_API.getStatus()`
2. `GetFanLevel/[apikey]` → `STUFA_API.getFan()`
3. `GetPower/[apikey]` → `STUFA_API.getPower()`
4. `SetFanLevel/[apikey];[level]` → `STUFA_API.setFan(level)`
5. `SetPower/[apikey];[level]` → `STUFA_API.setPower(level)`
6. `Ignit/[apikey]` → `STUFA_API.ignite()`
7. `Shutdown/[apikey]` → `STUFA_API.shutdown()`

### Usage
```javascript
import { STUFA_API } from '@/lib/stoveApi';

// Get status
const status = await STUFA_API.getStatus();
console.log(status); // { Status, Error, ErrorDescription, ... }

// Ignite stove
await STUFA_API.ignite();

// Set power
await STUFA_API.setPower(3); // 1-5
```

**⚠️ Note**: API key hardcoded in `lib/stoveApi.js:18` (considerare env var)

---

## Firebase Realtime Database

### Schema Structure
```
📦 Firebase Realtime Database
├── stoveScheduler/
│   ├── monday/                   # Array intervalli
│   │   └── [{start, end, power, fan}]
│   ├── tuesday/
│   ├── wednesday/
│   ├── thursday/
│   ├── friday/
│   ├── saturday/
│   ├── sunday/
│   └── mode/                     # Scheduler mode
│       ├── enabled               # boolean
│       ├── timestamp             # ISO string
│       ├── semiManual            # boolean
│       └── returnToAutoAt        # ISO string | null
│
├── netatmo/
│   ├── refresh_token             # OAuth2 token
│   ├── home_id                   # ID casa principale
│   ├── topology/                 # Struttura casa
│   │   ├── home_id
│   │   ├── home_name
│   │   ├── rooms[]               # [{id, name, type, modules[]}]
│   │   ├── modules[]             # [{id, name, type, bridge, room_id}]
│   │   ├── schedules[]
│   │   └── updated_at
│   ├── currentStatus/            # Stato real-time
│   │   ├── rooms[]               # [{room_id, name, temp, setpoint, mode, heating}]
│   │   ├── mode                  # schedule|away|hg|off
│   │   └── updated_at
│   ├── deviceConfig/             # Legacy
│   │   ├── device_id
│   │   └── module_id
│   └── automation/               # Regole (future)
│       └── {ruleId}/
│           ├── id, name, enabled
│           ├── trigger, conditions
│           ├── actions
│           └── updated_at
│
├── log/                          # User actions
│   └── {logId}/
│       ├── action                # "ignite", "shutdown", etc.
│       ├── value                 # Valore azione (es. potenza)
│       ├── timestamp             # ISO string
│       ├── source                # "manual" | "scheduler"
│       └── user/
│           ├── email
│           ├── name
│           ├── picture
│           └── sub
│
├── errors/                       # Error logs
│   └── {errorId}/
│       ├── errorCode             # Codice errore stufa
│       ├── errorDescription      # Descrizione
│       ├── severity              # INFO|WARNING|ERROR|CRITICAL
│       ├── timestamp             # ISO string
│       ├── resolved              # boolean
│       ├── resolvedAt            # ISO string | null
│       └── status                # "active" | "resolved"
│
└── changelog/                    # Version history
    └── {version}/                # Es: "1_1_0" (dots → underscores)
        ├── version               # "1.1.0"
        ├── date                  # "2025-10-04"
        ├── type                  # "major" | "minor" | "patch"
        ├── changes[]             # Array descrizioni
        └── timestamp             # ISO creation time
```

### Export Pattern
```javascript
// lib/firebase.js
export { db, db as database }; // Both exports required for compatibility
```

**⚠️ Runtime**: Node.js only (NO Edge runtime) - Client SDK only

---

## Auth0

### Configuration
- Import: `import { handleAuth, getSession } from '@auth0/nextjs-auth0'`
- **NO** `/edge` import (incompatibile con Firebase)

### Middleware (`middleware.js`)
Protegge tutte le route ECCETTO:
- `/api/auth/*` - Auth0 routes
- `/api/scheduler/check` - Protetto da `CRON_SECRET`
- `/api/stove/*` - Required per internal calls da scheduler
- Static assets (\_next, images, icons, manifest, sw)

### Usage in API Routes
```javascript
import { getSession } from '@auth0/nextjs-auth0';

export async function GET(request) {
  const session = await getSession();
  const user = session?.user;

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Use user.email, user.name, user.picture, user.sub
}
```

---

## Netatmo API

### API Wrapper (`lib/netatmoApi.js`)
- **Auth**: `getAccessToken(refreshToken)`
- **Topology**: `getHomesData()`, `getDeviceList()`
- **Real-time**: `getHomeStatus(homeId)`, `getThermState(deviceId, moduleId)`
- **Control**: `setRoomThermpoint(params)`, `setThermMode(params)`, `switchHomeSchedule(homeId, scheduleId)`
- **History**: `getRoomMeasure(params)`
- **Helpers**: `parseRooms()`, `parseModules()`, `extractTemperatures()`, `isHeatingActive()`

### Service Layer (`lib/netatmoService.js`)
- **State**: Firebase CRUD per tokens, topology, currentStatus
- **Automation**: Regole automazione (future)
- **Helpers**: `getRoomsWithTemperatures()`, `getRoomsNeedingHeating()`, `isAnyRoomHeating()`, `getAverageTemperature()`
- **Logging**: `logNetatmoAction(action, details, user)`

---

## Error Monitoring

### Error Monitor (`lib/errorMonitor.js`)

**Funzioni**:
```javascript
import {
  getErrorInfo,          // (code) → {severity, description}
  isCriticalError,       // (code) → boolean
  logError,              // (errorCode, errorDesc) → Promise<errorId>
  getRecentErrors,       // (limit) → Promise<errors[]>
  getActiveErrors,       // () → Promise<errors[]>
  resolveError,          // (errorId) → Promise<void>
  shouldNotify,          // (errorCode) → boolean
  sendErrorNotification  // (errorCode, errorDesc) → void
} from '@/lib/errorMonitor';
```

**Severities**:
- `INFO` - Informazioni, no action needed
- `WARNING` - Attenzione, monitorare
- `ERROR` - Errore, richiede intervento
- `CRITICAL` - Critico, notifica browser immediata

**Flow**:
1. Error detected da `GetStatus` (Error !== 0)
2. `logError()` → Firebase `errors/`
3. `isCriticalError()` → check severity
4. `sendErrorNotification()` → Browser notification (se CRITICAL)

---

## Logging System

### Pre-configured Functions
```javascript
import { logStoveAction, logSchedulerAction, logNetatmoAction } from '@/lib/logService';

// Stove actions
await logStoveAction.ignite();
await logStoveAction.shutdown();
await logStoveAction.setFan(3);
await logStoveAction.setPower(4);

// Scheduler actions
await logSchedulerAction.toggleMode(true);
await logSchedulerAction.updateSchedule('monday');
await logSchedulerAction.addInterval('monday');
await logSchedulerAction.removeInterval('monday', 0);
await logSchedulerAction.clearSemiManual(); // Uscita manuale da semi-manual

// Netatmo actions
await logNetatmoAction.connect();
await logNetatmoAction.disconnect();
await logNetatmoAction.selectDevice(deviceId);
```

**Auto-include**: Auth0 user info (email, name, picture, sub)

---

## Modalità Operative

### Manual Mode 🔧
- Controllo manuale via UI
- Color: Accent (orange)
- Scheduler disabilitato
- Tutte le azioni disponibili

### Automatic Mode ⏰
- Controllo automatico via cron
- Color: Success (green)
- Scheduler abilitato
- Mostra prossimo cambio in UI:
  "🔥 Accensione alle 18:30 del 04/10 (P4, V3)"

### Semi-Manual Mode ⚙️
- Override manuale temporaneo
- Color: Warning (yellow)
- Scheduler rimane abilitato
- **Trigger**: Azione manuale **dalla homepage** mentre in automatico
  - ✅ Ignite manuale → attiva semi-manual
  - ✅ Shutdown manuale → attiva semi-manual
  - ✅ SetPower/SetFan manuali → attiva semi-manual (solo se stufa già accesa)
  - ❌ Comandi da scheduler cron → **NON** attiva semi-manual
- Calcola `returnToAutoAt` = prossimo cambio scheduler
- Mostra in UI: "Ritorno auto: 18:30 del 04/10"
- Pulsante "↩️ Torna in Automatico" per uscire manualmente

**Differenza source='manual' vs source='scheduler'**:
- `source='manual'` → Comando da StovePanel homepage → Attiva semi-manual
- `source='scheduler'` → Comando da cron automatico → Mantiene modalità automatica

---

## Cron Integration

### Endpoint
```bash
GET /api/scheduler/check?secret=<CRON_SECRET>
```

**Chiamato ogni minuto** da external cron job.

### Logic Flow
1. Verifica mode (`enabled`, `semiManual`)
2. Se manual → return `MODALITA_MANUALE`
3. Se semi-manual → return `MODALITA_SEMI_MANUALE` (aspetta returnToAutoAt)
4. Se automatico:
   - Fetch status stufa
   - Fetch schedule per giorno corrente
   - Compara orario corrente con intervalli
   - Determina azione (ignite/shutdown/set)
   - Esegue comandi API
   - Se scheduled change → clear semi-manual
5. Return status

### Scheduler Service Functions
```javascript
import {
  getNextScheduledChange,   // () → ISO timestamp prossimo cambio (UTC)
  getNextScheduledAction,   // () → {timestamp, action, power?, fan?}
  saveSchedule,             // (day, intervals) → Promise<void>
  getSchedule,              // (day) → Promise<intervals[]>
  getWeeklySchedule,        // () → Promise<{monday: [], ...}>
  setSchedulerMode,         // (enabled) → Promise<void>
  getSchedulerMode,         // () → Promise<boolean>
  getFullSchedulerMode,     // () → Promise<{enabled, semiManual, returnToAutoAt}>
  setSemiManualMode,        // (nextScheduledChange) → Promise<void>
  clearSemiManualMode       // () → Promise<void>
} from '@/lib/schedulerService';
```

**Gestione Fusi Orari**:
Tutte le funzioni scheduler utilizzano internamente `createDateInRomeTimezone()` per garantire consistenza:
- **Input utente**: Orari in formato `HH:MM` (interpretati come Europe/Rome)
- **Calcoli interni**: Conversione automatica Europe/Rome → UTC
- **Salvataggio Firebase**: ISO string UTC (`.toISOString()`)
- **Confronti**: Date objects UTC (consistenti indipendentemente da timezone server)

Helper interno:
```javascript
// Crea Date UTC da componenti in timezone Europe/Rome
function createDateInRomeTimezone(baseDate, targetHour, targetMinute)
```
Gestisce automaticamente DST (ora legale/solare) e garantisce che gli orari siano sempre corretti anche se il server è in timezone diverso da Europe/Rome.

---

## Validation Logic

### Scheduler Intervals

**onChange** (durante typing):
- Solo visual feedback
- NO validation/sorting/save

**onBlur** (quando lasci campo):
1. ✅ **Validate**: `end > start + 15min`
2. ✅ **Link adjacent**: Bidirectional linking
3. ✅ **Remove overlapped**: Rimuovi intervalli sovrapposti
4. ✅ **Sort**: Ordina per start time
5. ✅ **Save**: Persist to Firebase
6. ✅ **Update semi-manual**: Aggiorna `returnToAutoAt` se time fields modificati

**Power levels**: 1-5 in UI (0 esiste in API ma non esposto - standby)
**Fan levels**: 1-6

---

## Tailwind Configuration

### Design System

**Colors** (`tailwind.config.js`):
```javascript
colors: {
  primary: '#ef4444',   // Red - Fire/heat, critical
  accent: '#f97316',    // Orange - Manual mode, warmth
  success: '#10b981',   // Green - Working, automatic
  warning: '#f59e0b',   // Yellow - Semi-manual, standby
  info: '#3b82f6',      // Blue - Information, links
  neutral: {            // Grays - Text, backgrounds, borders
    50: '#fafafa',
    100: '#f5f5f5',
    // ...
  }
}
```

**Animations**:
```javascript
animation: {
  shimmer: 'shimmer 1.5s infinite',
  dropdown: 'dropdown 0.15s ease-out'
},
keyframes: {
  shimmer: {
    '0%': { backgroundPosition: '-1000px 0' },
    '100%': { backgroundPosition: '1000px 0' }
  },
  dropdown: {
    from: { opacity: 0, transform: 'translateY(-10px) scale(0.95)' },
    to: { opacity: 1, transform: 'translateY(0) scale(1)' }
  }
}
```

**Custom Utilities**:
```javascript
boxShadow: {
  soft: '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
  card: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)'
},
borderRadius: {
  xl: '0.75rem',
  '2xl': '1rem',
  '3xl': '1.5rem'
}
```

---

## Component Patterns

### Standard Component Pattern
```javascript
// ✅ CORRECT - Inline Tailwind, component encapsulation
export default function Card({ children, className = '' }) {
  return (
    <div className={`
      bg-white rounded-2xl shadow-soft
      border border-neutral-200/50
      ${className}
    `}>
      {children}
    </div>
  );
}
```

### Client Component Pattern
```javascript
// ✅ CORRECT - 'use client' as first line
'use client';

import { useState } from 'react';

export default function MyComponent() {
  const [state, setState] = useState(false);
  return <button onClick={() => setState(!state)}>Toggle</button>;
}
```

**Quando usare `'use client'`**:
- ✅ React hooks (useState, useEffect, useCallback, useMemo, etc.)
- ✅ Eventi browser (onClick, onChange, etc.)
- ✅ Browser APIs (localStorage, window, document)
- ✅ Interattività client-side

**Posizionamento**: **Prima riga** del file (prima di qualsiasi import)

---

## Styling Best Practices

### ✅ DO
- Inline Tailwind classes only
- Encapsulate patterns in reusable components (Card, Button)
- Custom animations in `tailwind.config.js`
- Mobile-first responsive design
- Semantic color usage (primary=danger, success=confirm, etc.)
- Smooth transitions (`transition-all duration-200`)
- Glassmorphism (`backdrop-blur-sm`, `bg-white/60`)
- Active feedback (`active:scale-95`)
- Hover animations (`group-hover:rotate-180`)

### ❌ DON'T
- NO utility classes in `app/globals.css` (`.card`, `.btn-primary`)
- NO custom CSS classes (use Tailwind)
- NO inline styles (use Tailwind utilities)
- NO anonymous object exports (`export default { ... }`)

### `app/globals.css` - Solo base styles
```css
@layer base {
  html { @apply antialiased; }
  body {
    @apply bg-gradient-to-br from-neutral-50 via-neutral-100 to-neutral-200;
  }
}
```

---

## PWA Configuration

### Manifest (`public/manifest.json`)
```json
{
  "name": "Pannello Stufa",
  "short_name": "Stufa",
  "theme_color": "#ef4444",
  "background_color": "#ffffff",
  "display": "standalone",
  "start_url": "/",
  "icons": [
    { "src": "/icons/icon-72x72.png", "sizes": "72x72", "type": "image/png" },
    { "src": "/icons/icon-96x96.png", "sizes": "96x96", "type": "image/png" },
    { "src": "/icons/icon-128x128.png", "sizes": "128x128", "type": "image/png" },
    { "src": "/icons/icon-144x144.png", "sizes": "144x144", "type": "image/png" },
    { "src": "/icons/icon-152x152.png", "sizes": "152x152", "type": "image/png" },
    { "src": "/icons/icon-192x192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "/icons/icon-384x384.png", "sizes": "384x384", "type": "image/png" },
    { "src": "/icons/icon-512x512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ],
  "shortcuts": [
    { "name": "🔥 Accendi", "url": "/" },
    { "name": "⏰ Pianificazione", "url": "/scheduler" },
    { "name": "🚨 Allarmi", "url": "/errors" }
  ]
}
```

**⚠️ Limitations**: Shortcuts sono **static only** (no dynamic data, no real-time updates)

---

### Next.js Config (`next.config.mjs`)
```javascript
import withPWA from 'next-pwa';

const nextConfig = withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  reloadOnOnline: true,
  fallbacks: {
    document: '/offline'
  },
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/wsthermorossi\.cloudwinet\.it\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'stove-api',
        networkTimeoutSeconds: 10,
        expiration: { maxEntries: 50, maxAgeSeconds: 60 }
      }
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images',
        expiration: { maxEntries: 100, maxAgeSeconds: 7 * 24 * 60 * 60 }
      }
    },
    {
      urlPattern: /^https?.*/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'others',
        expiration: { maxEntries: 200, maxAgeSeconds: 24 * 60 * 60 }
      }
    }
  ]
});

export default nextConfig;
```

---

### Layout Meta Tags (`app/layout.js`)
```jsx
export const metadata = {
  title: 'Pannello Stufa',
  description: 'Controllo remoto stufa pellet Thermorossi',
  manifest: '/manifest.json',
  themeColor: '#ef4444',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Pannello Stufa'
  }
};
```

---

## Versioning Workflow

### **IMPORTANTE**: Aggiornare SEMPRE dopo modifiche

### 1. Semantic Versioning (MAJOR.MINOR.PATCH)
- **MAJOR** (x.0.0): Breaking changes, modifiche architetturali importanti
- **MINOR** (0.x.0): Nuove funzionalità, feature aggiunte (no breaking)
- **PATCH** (0.0.x): Bug fixes, correzioni, miglioramenti minori

### 2. Update `lib/version.js`
```javascript
export const APP_VERSION = '1.3.0';
export const LAST_UPDATE = '2025-10-04';
export const VERSION_HISTORY = [
  {
    version: '1.3.0',
    date: '2025-10-04',
    type: 'minor', // 'major' | 'minor' | 'patch'
    changes: [
      'Aggiungi sistema enforcement versione con ForceUpdateModal',
      'Implementa polling 60s per controllo versione automatico',
      'Migliora gestione notifiche versione soft/hard'
    ]
  },
  // ... older versions
];
```

### 3. Update `package.json`
```json
{
  "version": "1.3.0"
}
```
**⚠️ Sincronizza con `APP_VERSION` da `lib/version.js`**

### 4. Update `CHANGELOG.md`
```markdown
# Changelog

## [1.3.0] - 2025-10-04

### Aggiunto
- Sistema enforcement versione con `ForceUpdateModal` bloccante
- Hook `useVersionEnforcement` con polling automatico ogni 60s
- Integrazione `VersionEnforcer` in layout.js per copertura globale

### Modificato
- Migliorato sistema notifiche versione (soft + hard)
- Aggiornato service worker con nuove strategie caching

### Corretto
- Fix bug visualizzazione badge "NEW" in footer
```

### 5. Sync Firebase (**OBBLIGATORIO per enforcement**)
```bash
# Dopo deploy app, PRIMA che utenti accedano
node -e "require('./lib/changelogService').syncVersionHistoryToFirebase(require('./lib/version').VERSION_HISTORY)"
```

**⚠️ Importante**: Firebase è source of truth per `VersionEnforcer`.
Se non sincronizzato: utenti vedranno `ForceUpdateModal` anche con versione corretta.

### 6. Deployment Workflow Completo
```bash
# 1. Aggiorna versioni (version.js, package.json, CHANGELOG.md)

# 2. Build locale
npm run build

# 3. Test locale
npm run start

# 4. Deploy app su hosting
# (comando dipende: vercel deploy, firebase deploy, etc.)

# 5. Sync Firebase (OBBLIGATORIO)
node -e "require('./lib/changelogService').syncVersionHistoryToFirebase(require('./lib/version').VERSION_HISTORY)"

# 6. Verifica enforcement
# Utenti con versione vecchia vedranno ForceUpdateModal (max 60s)
```

### 7. Soft vs Hard Updates

**Soft (notifica dismissibile)**:
- Minor/patch updates
- Nuove features non breaking
- Bug fixes non critici
- Badge "NEW" + Modal "What's New"
- App rimane completamente usabile

**Hard (enforcement bloccante)**:
- Major updates (breaking changes)
- Fix critici sicurezza
- Modifiche architetturali importanti
- `ForceUpdateModal` bloccante
- App inutilizzabile fino a reload

### 8. Checklist Versioning
- [ ] `lib/version.js` → APP_VERSION, LAST_UPDATE, VERSION_HISTORY
- [ ] `package.json` → campo "version"
- [ ] `CHANGELOG.md` → nuova sezione con data e modifiche
- [ ] `npm run build` → verifica compilazione
- [ ] Deploy app su hosting
- [ ] **Sync Firebase** → `syncVersionHistoryToFirebase(VERSION_HISTORY)`
- [ ] Verifica → `getLatestVersion()` ritorna nuova versione
- [ ] Test enforcement → utenti con versione vecchia vedono modal

### 9. Esempi
- Nuova feature → 1.0.0 → **1.1.0** (minor)
- Bug fix → 1.1.0 → **1.1.1** (patch)
- Breaking change → 1.1.1 → **2.0.0** (major)

---

## Code Quality

### API Routes Best Practices
1. ✅ Use `@auth0/nextjs-auth0` (NO `/edge`)
2. ✅ Never `export const runtime = 'edge'` with Firebase
3. ✅ Import Firebase: `import { db } from '@/lib/firebase'`
4. ✅ Test with `npm run build` before commit
5. ✅ Validate input parameters
6. ✅ Handle errors gracefully (try/catch)
7. ✅ Return consistent response format

### Images
1. ✅ Always `<Image>` from `next/image` (not `<img>`)
2. ✅ Explicit `width` and `height` props
3. ✅ Add remote domains to `next.config.mjs` (`images.remotePatterns`)
4. ✅ Use `priority` for above-fold images
5. ✅ Optimize with `quality` prop (default 75)

### Module Exports
1. ✅ Assign to variable before export:
   ```javascript
   const config = { ... };
   export default config;
   ```
2. ✅ Named exports for multiple items
3. ❌ Avoid anonymous object exports:
   ```javascript
   // ❌ WRONG
   export default { ... };
   ```

### Component Guidelines
**DO**:
- Repeated patterns
- Complex UI with multiple states
- Variant support (Button, Card)
- Testable, reusable features
- Props over config
- Composition over inheritance
- Single responsibility

**DON'T**:
- One-off sections (inline in page)
- Trivial wrappers (`<div>` wrapper)
- Over-abstraction (YAGNI)

### Loading States
- ✅ Use component-specific skeletons
- ✅ Show skeleton during initial fetch only
- ✅ Pattern:
  ```javascript
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await fetch(...);
        setData(data);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <Skeleton.StovePanel />;
  ```

### UI/UX Best Practices
- Mobile-first responsive design
- Tailwind spacing scale (4px increments)
- Emoji icons (accessibility: aria-label)
- Color semantics (primary=danger, success=confirm)
- Smooth transitions (`transition-all duration-200`)
- Card-based layout
- Proper contrast (WCAG AA)
- Semantic HTML (button, nav, main, section)
- Glassmorphism: `backdrop-blur-sm`, `bg-white/60`
- Active feedback: `active:scale-95`
- Hover animations: `group-hover:rotate-180`
- Disabled states: opacity + cursor-not-allowed + alert visivo

---

## Testing

### Manual Testing Checklist

**Before Commit**:
- [ ] `npm run lint` - No ESLint errors
- [ ] `npm run build` - Build succeeds
- [ ] Test in browser - No console errors
- [ ] Test responsive - Mobile + Desktop
- [ ] Test dark mode (if applicable)

**Features to Test**:
- [ ] Stove control (ignite, shutdown, set power/fan)
- [ ] Scheduler (add/edit/remove intervals)
- [ ] Mode switching (manual, auto, semi-manual)
- [ ] Real-time polling (5s updates)
- [ ] Error notifications (trigger error, check notification)
- [ ] Netatmo integration (set temp, check status)
- [ ] Auth flow (login, logout, session)
- [ ] Version notification (change version, check badge/modal)
- [ ] PWA (install, offline mode, shortcuts)

**Cross-browser**:
- [ ] Chrome/Edge (Chromium)
- [ ] Safari (iOS)
- [ ] Firefox

**Performance**:
- [ ] Lighthouse score > 90
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s
- [ ] No layout shifts (CLS < 0.1)

---

## Security

### Best Practices
1. **Environment Variables**:
   - ✅ Never commit `.env.local`
   - ✅ Use `NEXT_PUBLIC_` prefix for client-side vars
   - ✅ Store secrets server-side only (API keys, tokens)
   - ✅ Rotate credentials periodically

2. **Authentication**:
   - ✅ All routes protected by Auth0 middleware
   - ✅ Validate session in API routes
   - ✅ Never expose user credentials
   - ✅ Use HTTPS in production

3. **API Security**:
   - ✅ Validate input parameters (type, range, format)
   - ✅ Sanitize user input (prevent injection)
   - ✅ Rate limiting (consider for production)
   - ✅ CRON_SECRET for scheduler endpoint
   - ✅ CORS policy (restrict origins)

4. **Firebase**:
   - ✅ Use Security Rules to restrict access
   - ✅ Never expose Firebase Admin SDK client-side
   - ✅ Validate all writes (type, structure, auth)

5. **Error Handling**:
   - ✅ Never expose stack traces to users
   - ✅ Log errors server-side only
   - ✅ Generic error messages to client
   - ✅ Sanitize error details before logging

### Firebase Security Rules (Example)
```json
{
  "rules": {
    "stoveScheduler": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "log": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "errors": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "changelog": {
      ".read": true,
      ".write": false
    }
  }
}
```

---

## Performance

### Optimization Tips
1. **React**:
   - ✅ Use `React.memo()` for expensive components
   - ✅ `useMemo()` for expensive calculations
   - ✅ `useCallback()` for stable function references
   - ✅ Code splitting with `dynamic()` from `next/dynamic`
   - ✅ Lazy load heavy components

2. **Images**:
   - ✅ Next.js `<Image>` with automatic optimization
   - ✅ WebP format when possible
   - ✅ Appropriate sizes (`width`, `height`)
   - ✅ `priority` for above-fold images
   - ✅ Lazy load below-fold images

3. **API**:
   - ✅ Debounce frequent API calls
   - ✅ Cache responses when appropriate
   - ✅ Pagination for large datasets
   - ✅ Optimize Firebase queries (limit, orderBy)

4. **Bundle**:
   - ✅ Analyze bundle size: `npm run build` output
   - ✅ Remove unused dependencies
   - ✅ Tree-shaking (import only what's needed)
   - ✅ Dynamic imports for heavy libraries

5. **PWA**:
   - ✅ Cache static assets aggressively
   - ✅ NetworkFirst for dynamic data
   - ✅ Precache critical resources
   - ✅ Service Worker updates strategy

### Performance Monitoring
```bash
# Lighthouse audit
npx lighthouse http://localhost:3000 --view

# Bundle analysis
npm run build
# Check .next/build-manifest.json for bundle sizes
```

---

## Deployment Workflow

### Pre-deployment Checklist
- [ ] Update version (`lib/version.js`, `package.json`, `CHANGELOG.md`)
- [ ] Run `npm run lint` - Fix all issues
- [ ] Run `npm run build` - Ensure build succeeds
- [ ] Test locally with `npm run start`
- [ ] Test PWA offline functionality
- [ ] Check responsive design (mobile, tablet, desktop)
- [ ] Verify environment variables in hosting platform
- [ ] Review Security Rules (Firebase)

### Deployment Steps
```bash
# 1. Update versions
# (lib/version.js, package.json, CHANGELOG.md)

# 2. Commit changes
git add .
git commit -m "Release v1.3.0: Add version enforcement system"
git push origin main

# 3. Build
npm run build

# 4. Deploy
# Vercel:
vercel --prod
# OR Firebase:
firebase deploy --only hosting
# OR custom hosting

# 5. Sync Firebase (CRITICAL)
node -e "require('./lib/changelogService').syncVersionHistoryToFirebase(require('./lib/version').VERSION_HISTORY)"

# 6. Verify deployment
# - Check app loads correctly
# - Test main features
# - Verify version enforcement (if applicable)
# - Check console for errors
```

### Post-deployment Verification
- [ ] App loads without errors
- [ ] Auth0 login works
- [ ] Stove control functional
- [ ] Scheduler operational
- [ ] Netatmo integration works
- [ ] Version badge/modal correct
- [ ] PWA installable
- [ ] Service Worker active
- [ ] Firebase sync successful (`getLatestVersion()` returns correct version)

---

## Troubleshooting

### Common Build Errors

#### Firebase Export Error
```javascript
// ❌ WRONG
export default db;

// ✅ CORRECT
export { db, db as database }; // Both exports required
```

#### Auth0 Edge Conflict
```javascript
// ❌ WRONG
import { handleAuth } from '@auth0/nextjs-auth0/edge';
export const runtime = 'edge';

// ✅ CORRECT
import { handleAuth } from '@auth0/nextjs-auth0';
// No edge runtime
```

#### Next.js Image Domains
```javascript
// next.config.mjs
images: {
  remotePatterns: [
    { protocol: 'https', hostname: '**.gravatar.com' },
    { protocol: 'https', hostname: '**.googleusercontent.com' },
  ],
}
```

#### Missing 'use client' Directive
```bash
# Diagnosi rapida
find app -name "*.js" -type f -exec grep -l "useState\|useEffect" {} \; | \
  xargs -I {} sh -c 'if [ "$(head -1 "{}" | grep -c "use client")" -eq 0 ]; then echo "{}"; fi'
```

```javascript
// ❌ WRONG - Hook without 'use client'
import { useState } from 'react';
export default function Component() { ... }

// ✅ CORRECT - Add 'use client' as first line
'use client';

import { useState } from 'react';
export default function Component() { ... }
```

### Runtime Errors

#### Firebase Connection Issues
- Check Firebase config in `.env.local`
- Verify Firebase project permissions
- Check Security Rules
- Ensure Node.js runtime (not Edge)

#### Auth0 Session Issues
- Clear cookies and retry
- Check Auth0 config in dashboard
- Verify callback URLs
- Check middleware exclusions

#### Stove API Errors
- Verify API key in `lib/stoveApi.js`
- Check Thermorossi cloud status
- Network timeout? Increase timeout
- Check response format (might have changed)

#### Cron Scheduler Not Working
- Verify `CRON_SECRET` in `.env.local`
- Check cron job is running (external service)
- Verify `/api/stove/*` excluded from Auth0 middleware
- Check Firebase mode: `enabled` should be `true`

---

## Debugging

### Debug Tools

**Browser DevTools**:
```javascript
// Enable verbose logging
localStorage.setItem('debug', 'true');

// Check version enforcement status
console.log('Local:', APP_VERSION);
console.log('Firebase:', await getLatestVersion());

// Check scheduler mode
const mode = await getFullSchedulerMode();
console.log('Mode:', mode);

// Check Firebase connection
import { db } from '@/lib/firebase';
console.log('Firebase connected:', !!db);
```

**Network Tab**:
- Monitor API calls (timing, status, payload)
- Check Service Worker (Application > Service Workers)
- Verify caching strategy (Application > Cache Storage)

**React DevTools**:
- Inspect component tree
- Check props and state
- Profile performance

### Common Debug Scenarios

#### "Version enforcement not working"
1. Check Firebase sync: `getLatestVersion()` should return latest
2. Verify `useVersionEnforcement` polling (60s interval)
3. Check `APP_VERSION` in code vs Firebase
4. Clear browser cache and reload

#### "Scheduler not executing"
1. Check mode: `getFullSchedulerMode()` → `enabled: true`
2. Verify cron is calling `/api/scheduler/check?secret=xxx`
3. Check intervals: `getSchedule('monday')` → valid intervals?
4. Check stufa status: must be reachable
5. Verify `/api/stove/*` not blocked by middleware

#### "PWA not installing"
1. Check manifest: `/manifest.json` accessible?
2. Verify Service Worker: registered? (Application > Service Workers)
3. Build production: `npm run build && npm run start`
4. HTTPS required (localhost exempt)
5. Check console for SW errors

#### "Real-time updates not working"
1. Check Firebase connection: `db` initialized?
2. Verify polling interval: `setInterval` active?
3. Check network: API reachable?
4. Verify state updates: `setState()` called?
5. Check React re-render: props/state changed?

---

## Quick Reference

### Key Files Map
```
📁 Project Root
├── 📄 lib/version.js              # APP_VERSION, VERSION_HISTORY
├── 📄 lib/firebase.js             # Firebase client SDK
├── 📄 lib/stoveApi.js             # Thermorossi API wrapper
├── 📄 lib/schedulerService.js     # Scheduler operations
├── 📄 lib/errorMonitor.js         # Error detection
├── 📄 lib/logService.js           # Logging utilities
├── 📄 lib/changelogService.js     # Version management
├── 📄 lib/netatmoApi.js           # Netatmo API
├── 📄 lib/netatmoService.js       # Netatmo service layer
├── 📄 lib/routes.js               # Route definitions
├── 📄 app/layout.js               # Root layout + metadata
├── 📄 app/page.js                 # Home (StovePanel)
├── 📄 app/components/StovePanel.js
├── 📄 app/components/VersionEnforcer.js
├── 📄 app/hooks/useVersionCheck.js
├── 📄 app/hooks/useVersionEnforcement.js
├── 📄 middleware.js               # Auth0 middleware
├── 📄 next.config.mjs             # Next.js + PWA config
├── 📄 tailwind.config.js          # Design system
├── 📄 package.json                # Dependencies + version
├── 📄 CLAUDE.md                   # This file
└── 📄 CHANGELOG.md                # Version history
```

### Common Tasks

**Update version** (SEMPRE dopo modifiche):
1. `lib/version.js` → APP_VERSION, LAST_UPDATE, VERSION_HISTORY
2. `package.json` → "version"
3. `CHANGELOG.md` → New section
4. `npm run build`
5. Deploy app
6. **Sync Firebase**: `syncVersionHistoryToFirebase(VERSION_HISTORY)`
7. Verify: `getLatestVersion()` returns new version

**Force user updates**:
- Update version (steps above)
- Deploy + Sync Firebase
- Users outdated: `ForceUpdateModal` at next polling (max 60s)
- Hard reload: new version downloaded automatically

**Add error code**:
- Update `ERROR_CODES` in `lib/errorMonitor.js`
- Add severity: INFO|WARNING|ERROR|CRITICAL

**Add UI component**:
1. Create in `app/components/ui/`
2. Export in `app/components/ui/index.js`
3. Use inline Tailwind classes

**Modify scheduler**:
- Edit `app/api/scheduler/check/route.js`
- Update logic in `lib/schedulerService.js`

**Change polling interval**:
- StovePanel: `setInterval` in `app/page.js` (default 5000ms)
- Netatmo: `setInterval` in `app/netatmo/page.js` (default 30000ms)
- VersionEnforcer: `useVersionEnforcement.js` (60000ms)

**Modify colors**:
- `tailwind.config.js` → `theme.extend.colors`

**Add animation**:
- `tailwind.config.js` → `keyframes` + `animation`

### PWA Tasks

**Update shortcuts**:
- Edit `public/manifest.json`
- Rebuild: `npm run build`

**Change theme color**:
- Update `manifest.json` AND `app/layout.js` (both required)

**Update icon**:
1. Replace `public/icons/icon-{192,512}.png`
2. Regenerate sizes (ImageMagick/online tool)
3. Update `app/favicon.png`

**Modify cache strategy**:
- Edit `runtimeCaching` in `next.config.mjs`

**Test offline**:
```bash
npm run build && npm run start
# Open http://localhost:3000
# DevTools → Network → Offline
```

**Clear Service Worker**:
- DevTools → Application → Service Workers → Unregister
- Clear site data
- Hard refresh (Cmd+Shift+R / Ctrl+Shift+F5)

---

## Environment Variables

### Required Variables
```env
# Firebase (Client SDK)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
NEXT_PUBLIC_FIREBASE_DATABASE_URL=

# Auth0
AUTH0_SECRET=
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=
AUTH0_CLIENT_ID=
AUTH0_CLIENT_SECRET=

# Netatmo
NEXT_PUBLIC_NETATMO_CLIENT_ID=
NETATMO_CLIENT_SECRET=
NEXT_PUBLIC_NETATMO_REDIRECT_URI=

# Scheduler
CRON_SECRET=your-secret-here

# Optional
NODE_ENV=development|production
```

### Setup `.env.local`
```bash
cp .env.example .env.local
# Edit .env.local with your credentials
```

**⚠️ Security**:
- Never commit `.env.local`
- Use `NEXT_PUBLIC_` prefix only for client-safe vars
- Rotate secrets periodically
- Use different credentials for dev/prod

---

## Application Workflows (Detailed)

### Real-time Monitoring Flow
```
1. User opens app
   ↓
2. Show Skeleton.StovePanel
   ↓
3. Parallel fetch:
   - GET /api/stove/status
   - GET /api/stove/getFan
   - GET /api/stove/getPower
   - GET /api/scheduler/mode
   ↓
4. If mode = automatic:
   - Call getNextScheduledAction()
   - Display: "🔥 Accensione alle 18:30 del 04/10 (P4, V3)"
   ↓
5. If Error !== 0:
   - logError(errorCode, errorDescription)
   - Show ErrorAlert in UI
   - If critical: sendErrorNotification()
   ↓
6. Update UI (hide skeleton)
   ↓
7. Set interval: poll every 5s
   ↓
8. User manual action (ignite/shutdown):
   - If mode = automatic → trigger semi-manual
   - Calculate nextScheduledChange
   - setSemiManualMode(nextScheduledChange)
   - Show: "Ritorno auto: HH:MM del DD/MM"
   - logStoveAction.ignite() / .shutdown()
   ↓
9. Regolazioni (setPower/setFan):
   - Disabled if status.includes('OFF|ERROR|WAIT')
   - Show alert if disabled
   - If enabled: API call + log
```

### Scheduler Automation Flow
```
1. User configures schedule
   - Add/edit intervals
   - onBlur → validate + save Firebase
   ↓
2. External cron every minute
   ↓
3. GET /api/scheduler/check?secret=xxx
   ↓
4. Fetch mode from Firebase
   ↓
5. If manual:
   - Return "MODALITA_MANUALE"
   - Exit
   ↓
6. If semi-manual:
   - Check returnToAutoAt
   - If not reached: Return "MODALITA_SEMI_MANUALE"
   - If reached: Clear semi-manual, proceed as automatic
   ↓
7. If automatic:
   - Fetch schedule for current day
   - Get current time
   - Compare with intervals
   ↓
8. Determine action:
   - In interval → should be ON
   - Outside interval → should be OFF
   ↓
9. Fetch current status
   ↓
10. Execute commands if needed:
    - If should be ON and is OFF → ignite
    - If should be OFF and is ON → shutdown
    - Set power/fan if changed
    ↓
11. If scheduled change executed:
    - Clear semi-manual mode
    ↓
12. Return status
```

### Semi-Manual Mode Flow
```
1. User in automatic mode
   ↓
2. User clicks manual action (ignite/shutdown/setPower/setFan) dalla HOMEPAGE
   ↓
3. StovePanel invia request con source='manual':
   - POST /api/stove/ignite {source: 'manual'}
   - POST /api/stove/shutdown {source: 'manual'}
   - POST /api/stove/setPower {level: X, source: 'manual'}
   - POST /api/stove/setFan {level: X, source: 'manual'}
   ↓
4. API route verifica source='manual':
   - Se source='scheduler' → Skip logic semi-manual (exit)
   - Se source='manual' → Continua
   ↓
5. Verifica condizioni:
   - Check scheduler mode: enabled = true
   - Se setPower/setFan: verifica stufa ON (StatusDescription includes 'WORK'|'START')
   ↓
6. Calculate next scheduled change:
   - getNextScheduledChange() → ISO timestamp UTC (Europe/Rome timezone aware)
   ↓
7. Set semi-manual mode:
   - setSemiManualMode(nextScheduledChange)
   - Firebase: {
       enabled: true,
       semiManual: true,
       returnToAutoAt: "2025-10-04T18:30:00Z"  // UTC timestamp
     }
   ↓
8. UI updates:
   - Mode indicator: "Ritorno auto: 18:30 del 04/10"
   - Show button: "↩️ Torna in Automatico"
   ↓
9. User clicks "Torna in Automatico":
   - clearSemiManualMode()
   - logSchedulerAction.clearSemiManual()
   - UI updates to automatic mode
   - Fetch next scheduled action for display
   ↓
10. OR wait for scheduled time:
    - Cron reaches returnToAutoAt
    - Execute scheduled change (con source='scheduler')
    - Clear semi-manual automatically
    - Ritorno in modalità automatica
```

**IMPORTANTE**: Comandi da scheduler cron usano sempre `source='scheduler'` quindi **NON** attivano mai semi-manual, evitando loop infiniti.

### Version Enforcement Flow (Hard)
```
1. App mount (layout.js)
   ↓
2. VersionEnforcer component renders
   ↓
3. useVersionEnforcement hook activates
   ↓
4. Initial check:
   - Fetch getLatestVersion() from Firebase
   - Compare: latest.version !== APP_VERSION?
   ↓
5. If versions DIFFERENT:
   - Set needsUpdate = true
   - firebaseVersion = latest.version
   ↓
6. VersionEnforcer renders ForceUpdateModal:
   - Modal covers entire screen (z-index 10000)
   - No dismiss (no ESC, no backdrop click, no close button)
   - Shows: "Versione corrente: 1.2.0"
   - Shows: "Nuova versione: 1.3.0"
   - Only action: "🔄 Aggiorna Ora" button
   - App completely blocked (can't interact with anything)
   ↓
7. User clicks "Aggiorna Ora":
   - window.location.reload()
   - Browser hard refresh
   - Downloads new version from server
   - Service Worker updates
   - App reloads with new version
   ↓
8. Polling continues (60s interval):
   - Check every minute
   - If new version deployed → force update again
   ↓
9. If versions SAME:
   - needsUpdate = false
   - VersionEnforcer renders nothing (invisible)
   - App works normally
```

### Version Notification Flow (Soft)
```
1. App mount
   ↓
2. useVersionCheck hook activates (Footer)
   ↓
3. Fetch getLatestVersion() from Firebase
   ↓
4. Compare versions (semantic):
   - Parse: "1.3.0" → [1, 3, 0]
   - Compare: latest > current?
   ↓
5. Check localStorage:
   - lastSeenVersion = "1.2.0"
   - dismissedVersions = ["1.1.0"]
   ↓
6. If new version AND not dismissed:
   - hasNewVersion = true
   - Show badge "NEW" in footer (animated)
   ↓
7. If first time (lastSeenVersion !== APP_VERSION):
   - Show WhatsNewModal automatically
   - Header gradient (color based on type: major/minor/patch)
   - List changes from VERSION_HISTORY
   - Checkbox: "Non mostrare più"
   - Buttons: Close, "Vai al Changelog"
   ↓
8. User dismisses modal:
   - Standard: Save APP_VERSION to lastSeenVersion
   - "Non mostrare più": Add to dismissedVersions array
   - Modal closes, badge still visible
   ↓
9. User clicks badge "NEW":
   - dismissBadge()
   - Hide badge
   - Save to localStorage
   ↓
10. App remains fully usable throughout
    - No blocking
    - No forced reload
    - User decides when to check changelog
```

---

## Critical Decision Matrix

### When to use what?

**State Management**:
- Local component state → `useState`
- Derived state → `useMemo`
- Callbacks → `useCallback`
- Side effects → `useEffect`
- Global state → Firebase Realtime DB (real-time sync)
- Form state → Controlled components

**Data Fetching**:
- Real-time updates → Firebase listeners (`onValue`)
- API calls → `fetch` in `useEffect`
- User actions → Event handlers + API calls
- Polling → `setInterval` in `useEffect`

**Styling**:
- Utility classes → Inline Tailwind
- Reusable patterns → Component (Card, Button)
- Animations → Tailwind config (`keyframes`, `animation`)
- Responsive → Tailwind breakpoints (`sm:`, `md:`, `lg:`)

**Performance**:
- Heavy component → `React.memo()`
- Expensive calc → `useMemo()`
- Callback prop → `useCallback()`
- Large bundle → Dynamic import (`next/dynamic`)
- Images → Next.js `<Image>`

**Versioning**:
- New feature → Minor version (0.x.0)
- Bug fix → Patch version (0.0.x)
- Breaking change → Major version (x.0.0)
- Soft notification → Badge + Modal (dismissible)
- Hard enforcement → ForceUpdateModal (blocking)

---

## Final Notes for Claude Code

### Working on this project
1. **Always read CLAUDE.md first** when starting a new task
2. **Follow versioning workflow** after ANY code change
3. **Test locally** before suggesting changes (`npm run build`)
4. **Check compatibility**: Node.js runtime, no Edge with Firebase
5. **Maintain consistency**: Follow existing patterns and conventions
6. **Document changes**: Update CLAUDE.md if architecture changes

### Code modification priorities
1. 🔴 **NEVER** break existing functionality
2. 🟠 **ALWAYS** update version after changes
3. 🟡 **PREFER** editing existing files over creating new ones
4. 🟢 **MAINTAIN** coding style and patterns
5. 🔵 **TEST** thoroughly before marking complete

### Communication with user
- Be concise and direct
- Explain "why" not just "what"
- Ask for clarification if task is ambiguous
- Provide code examples when relevant
- Suggest best practices proactively

### Task completion checklist
- [ ] Code implemented correctly
- [ ] Follows existing patterns
- [ ] No console errors
- [ ] Version updated (if applicable)
- [ ] CLAUDE.md updated (if architecture changed)
- [ ] Tested locally (`npm run build && npm run start`)
- [ ] User informed of changes

---

**Last Updated**: 2025-10-06
**Document Version**: 2.1
**App Version**: 1.3.1

---

## Appendix: Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm run start            # Production server
npm run lint             # ESLint check

# Testing
npm run build && npm run start  # Test PWA locally

# Firebase
firebase login                                    # Login to Firebase
firebase deploy --only database:rules            # Deploy security rules
node -e "require('./lib/changelogService').syncVersionHistoryToFirebase(require('./lib/version').VERSION_HISTORY)"  # Sync versions

# Debugging
find app -name "*.js" -exec grep -l "useState\|useEffect" {} \; | xargs -I {} sh -c 'if [ "$(head -1 "{}" | grep -c "use client")" -eq 0 ]; then echo "{}"; fi'  # Find missing 'use client'

# Git
git status
git add .
git commit -m "Release vX.X.X: Description"
git push origin main

# Performance
npx lighthouse http://localhost:3000 --view  # Lighthouse audit
```
