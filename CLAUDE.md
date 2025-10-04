# CLAUDE.md

Guida per Claude Code quando lavora su questo repository.

## Indice Rapido
- [Progetto](#progetto) - Overview e comandi development
- [Architettura](#architettura) - Componenti, pagine, API routes
- [Integrazioni](#integrazioni) - API esterne, Firebase, Auth0
- [Scheduler](#scheduler) - Sistema pianificazione automatica
- [Styling](#styling) - Tailwind CSS e design system
- [PWA](#pwa) - Progressive Web App configuration
- [Best Practices](#best-practices) - Linee guida sviluppo
- [Troubleshooting](#troubleshooting) - Problemi comuni e soluzioni

---

## Progetto

**Pannello Stufa** - Next.js 15 PWA per controllo remoto stufa Thermorossi via cloud API.

**Stack**: Next.js 15, Auth0, Firebase Realtime DB, Netatmo API, Tailwind CSS

**Comandi**:
- `npm run dev` - Dev server (PWA disabilitata)
- `npm run build` - Build production (genera service worker)
- `npm run start` - Production server (PWA abilitata)
- `npm run lint` - ESLint

**Test PWA**: `npm run build && npm run start` (PWA disabilitata in dev)

**Lingua**: Italiano (UI, labels, messaggi)

---

## Architettura

### Struttura Componenti

```
app/
├── components/
│   ├── StovePanel.js          # Pannello controllo principale
│   ├── Navbar.js              # Navigazione + Auth0
│   ├── WhatsNewModal.js       # Modal novità versione
│   ├── VersionNotifier.js     # Notifier versioni (wrapper modal)
│   ├── ui/                    # Componenti UI atomici
│   │   ├── Card.js
│   │   ├── Button.js
│   │   ├── Input.js
│   │   ├── Select.js
│   │   ├── StatusBadge.js
│   │   ├── ModeIndicator.js
│   │   ├── Skeleton.js
│   │   ├── ErrorAlert.js
│   │   ├── Footer.js          # Client component con badge NEW e modal
│   │   └── index.js           # Export centralizzato
│   ├── scheduler/             # Componenti pianificazione
│   │   ├── TimeBar.js
│   │   ├── ScheduleInterval.js
│   │   ├── DayScheduleCard.js
│   │   └── DayAccordionItem.js
│   ├── netatmo/               # Componenti Netatmo
│   │   └── RoomCard.js
│   └── log/
│       └── LogEntry.js
├── hooks/                     # Custom React hooks
│   └── useVersionCheck.js     # Hook confronto versioni + localStorage
├── page.js                    # Home - controllo stufa
├── netatmo/page.js           # Dashboard Netatmo
├── scheduler/page.js          # Pianificazione settimanale
├── log/page.js               # Storico azioni utente
├── errors/page.js            # Storico allarmi
├── offline/page.js           # Fallback offline PWA
└── api/
    ├── stove/*               # Proxy Thermorossi API
    ├── scheduler/check/      # Cron endpoint
    ├── auth/[...auth0]/      # Auth0 routes
    ├── netatmo/*             # Netatmo Energy API
    ├── log/add/              # Logging utente
    └── user/                 # User info

lib/
├── stoveApi.js               # Thermorossi API wrapper
├── netatmoApi.js             # Netatmo Energy API wrapper
├── routes.js                 # Route definitions centralizzate
├── firebase.js               # Firebase client SDK
├── schedulerService.js       # Firebase scheduler operations
├── netatmoService.js         # Netatmo state & automation
├── logService.js             # Logging service
├── errorMonitor.js           # Error detection & notification
├── changelogService.js       # Changelog management & Firebase sync
└── version.js                # App versioning
```

### Componenti UI (`app/components/ui/`)

**Card** - Container base
```jsx
<Card className="p-6">content</Card>
```

**Button** - Pulsanti con varianti
- Variants: `primary|secondary|success|danger|accent|outline|ghost`
- Props: `variant`, `size`, `icon`, `disabled`, `loading`

**Select** - Dropdown custom (non native)
- React state management
- Animazione `animate-dropdown` da Tailwind config
- No placeholder options, solo valori reali
- Click-outside to close
- Support `disabled` prop con styling opacity + cursor-not-allowed

**Skeleton** - Loading placeholders
- Pre-built: `Skeleton.StovePanel`, `Skeleton.Scheduler`, `Skeleton.LogPage`
- Animazione `animate-shimmer`
- Pattern: mostra solo durante fetch iniziale, non updates successivi

**Footer** - Info autore e versione (client component)
- Version da `lib/version.js`
- Auto-incluso in tutte le pagine via `app/layout.js`
- Badge "NEW" animato quando disponibile nuova versione
- Click badge → dismiss notifica + salva in localStorage
- Modal "What's New" integrato

**WhatsNewModal** - Modal novità versione
- Mostra automaticamente al primo accesso post-update
- Header gradiente colorato per tipo versione (major/minor/patch)
- Lista modifiche versione corrente
- Link a changelog completo
- Checkbox "Non mostrare più" per versione specifica
- Chiusura con ESC o backdrop click

**Import centralizzato**:
```javascript
import { Card, Button, Select, StatusBadge, Skeleton, ErrorAlert, Footer } from '@/app/components/ui';
```

### Custom Hooks (`app/hooks/`)

**useVersionCheck** - Hook per controllo nuove versioni
```javascript
const { hasNewVersion, latestVersion, showWhatsNew, dismissWhatsNew, dismissBadge } = useVersionCheck();
```

**Funzionalità**:
- Confronta versione locale (`APP_VERSION`) con ultima versione Firebase
- Controlla localStorage per versioni già viste (`lastSeenVersion`)
- Gestisce lista versioni dismesse (`dismissedVersions`)
- Mostra modal al primo accesso se versione diversa

**States**:
- `hasNewVersion` (boolean) - True se disponibile versione più recente
- `latestVersion` (object|null) - Oggetto ultima versione da Firebase
- `showWhatsNew` (boolean) - True se mostrare modal What's New
- `dismissWhatsNew(dontShowAgain)` - Chiude modal, opzionale dismiss permanente
- `dismissBadge()` - Nasconde badge NEW nel footer

**localStorage keys**:
- `lastSeenVersion` - Ultima versione vista dall'utente
- `dismissedVersions` - Array versioni permanentemente dismesse

### Pagine

**`/` (Home)** - StovePanel
- Layout: Error Alert → Hero (status con glassmorphism + info compatte) → Grid 2 col (Actions + Regolazioni) → Netatmo footer
- Hero modernizzato: barra gradiente top, grid 2 col (status principale + ventola/potenza), separator decorativo, mode indicator con icona colorata
- **Mode Indicator**:
  - Modalità Automatica: mostra prossimo cambio scheduler (🔥 Accensione/❄️ Spegnimento) con orario formato "HH:MM del DD/MM", potenza e ventola
  - Modalità Semi-manuale: mostra "Ritorno auto: HH:MM del DD/MM" + pulsante "↩️ Torna in Automatico"
  - Modalità Manuale: mostra "Controllo manuale attivo"
- Real-time polling: 5 secondi
- Monitora errori e invia notifiche browser
- Loading: `Skeleton.StovePanel`
- Responsive: max-w-7xl, grid adapts mobile/desktop
- Regolazioni disabilitate quando stufa OFF con alert visivo

**`/scheduler`** - Pianificazione settimanale
- Accordion UI (giorni collassabili con preview)
- TimeBar interattiva 24h
- Toggle Manual/Automatic mode
- Semi-manual status con returnToAutoAt + pulsante "↩️ Torna in Automatico/Manuale" (visibile solo in semi-manuale)
- Loading: `Skeleton.Scheduler`

**`/log`** - Storico azioni utente
- Firebase real-time display
- Avatar utente (Next.js `<Image>`, non `<img>`)
- Paginazione: 50 entries/page
- Loading: `Skeleton.LogPage`

**`/errors`** - Storico allarmi
- Filtri: Tutti / Attivi / Risolti
- Paginazione: 20 errors/page
- Azione: "Segna come Risolto"

**`/changelog`** - Storico versioni e modifiche
- Timeline versioni con badge tipo (Major/Minor/Patch)
- Visualizzazione modifiche per versione
- Source indicator (Firebase/Locale)
- Link da Footer (versione cliccabile)
- Fallback automatico a VERSION_HISTORY se Firebase non disponibile

**`/offline`** - PWA offline fallback
- Messaggio friendly
- Auto-reload quando connessione ripristinata

### API Routes (`app/api/`)

**Stove Control (`/api/stove/*`)** - Proxy Thermorossi API
- `GET status` - Status + errori (GetStatus)
- `GET getFan` - Fan level 1-6 (GetFanLevel)
- `GET getPower` - Power level 0-5 (GetPower) - UI mostra solo 1-5
- ~~`GET getRoomTemperature`~~ - **NON SUPPORTATA** dalla stufa (endpoint deprecato)
- `POST ignite` - Accensione (Ignit) - trigger semi-manual se scheduler attivo
- `POST shutdown` - Spegnimento (Shutdown) - trigger semi-manual se scheduler attivo
- `POST setFan` - Imposta ventola (SetFanLevel/[apikey];[level]) - **DISABILITATA quando stufa OFF**
- `POST setPower` - Imposta potenza (SetPower/[apikey];[level]) - **DISABILITATA quando stufa OFF**

**Scheduler (`/api/scheduler/*`)**
- `GET check?secret=<CRON_SECRET>` - Cron endpoint (chiamato ogni minuto)
  - Verifica mode, compara orari, esegue comandi
  - Returns: `MODALITA_MANUALE` o `MODALITA_SEMI_MANUALE`

**Auth (`/api/auth/*`)** - Auth0 dynamic routes (handleAuth)

**Netatmo (`/api/netatmo/*`)**
- `POST devices` - Lista devices
- `POST temperature` - Temperatura configurata
- `GET callback` - OAuth2 callback
- `GET devices-temperatures` - Tutte le temperature

**Logging (`/api/log/*`)**
- `POST add` - Aggiungi log azione utente (solo azioni manuali, non scheduler)

**User (`/api/user/*`)**
- `GET user` - Info utente Auth0

---

## Integrazioni

### Thermorossi Cloud API (`lib/stoveApi.js`)

**Base URL**: `https://wsthermorossi.cloudwinet.it/WiNetStove.svc/json`

**7 Endpoints integrati** (GetRoomControlTemperature non supportata dalla stufa):
1. `GetStatus/[apikey]` → `STUFA_API.getStatus`
2. `GetFanLevel/[apikey]` → `STUFA_API.getFan`
3. `GetPower/[apikey]` → `STUFA_API.getPower`
4. `SetFanLevel/[apikey];[level]` → `STUFA_API.setFan(level)`
5. `SetPower/[apikey];[level]` → `STUFA_API.setPower(level)`
6. `Ignit/[apikey]` → `STUFA_API.ignite`
7. `Shutdown/[apikey]` → `STUFA_API.shutdown`

**Note**: API key hardcoded in `lib/stoveApi.js:18` (considerare env var per production)

### Firebase Realtime Database (`lib/firebase.js`)

**Export**: `export { db, db as database }` (compatibilità con errorMonitor.js)

**Struttura dati**:
```
stoveScheduler/
  {day}/               # Array intervalli: {start, end, power:1-5, fan:1-6}
  mode/                # {enabled, timestamp, semiManual, returnToAutoAt}

netatmo/
  refresh_token/       # Token OAuth2 per autenticazione
  home_id/             # ID casa principale
  topology/            # {home_id, home_name, rooms[], modules[], schedules[], updated_at}
  currentStatus/       # {rooms[], mode, updated_at}
  deviceConfig/        # {device_id, module_id} - per retrocompatibilità
  automation/          # {ruleId: {id, name, enabled, trigger, conditions, actions}}

log/                   # {action, value, timestamp, user:{email,name,picture,sub}, source}

errors/                # {errorCode, errorDescription, severity, timestamp, resolved, resolvedAt, status}

changelog/             # Storico versioni
  {version}/           # Es: "1_1_0" (dots sostituiti da underscore)
    version            # "1.1.0"
    date               # "2025-10-04"
    type               # "major" | "minor" | "patch"
    changes[]          # Array descrizioni modifiche
    timestamp          # ISO timestamp creazione
```

**Runtime**: Node.js only (no Edge) - Client SDK only

### Auth0 (`@auth0/nextjs-auth0`)

**Import**: `import { handleAuth, getSession } from '@auth0/nextjs-auth0'` (NO `/edge`)

**Middleware** (`middleware.js`):
- Protegge tutte le route ECCETTO:
  - `/api/auth/*`
  - `/api/scheduler/check` (protetto da CRON_SECRET)
  - `/api/stove/*` (REQUIRED per internal calls da scheduler)
  - Static assets

### Error Monitor (`lib/errorMonitor.js`)

**Funzionalità**:
- Monitora campo `Error` e `ErrorDescription` da GetStatus
- Classificazione: INFO, WARNING, ERROR, CRITICAL
- Logging Firebase `errors/`
- Notifiche browser per errori critici

**Funzioni**:
- `getErrorInfo(code)`, `isCriticalError(code)`, `logError(...)`, `getRecentErrors(limit)`, `getActiveErrors()`, `resolveError(id)`, `shouldNotify(...)`, `sendErrorNotification(...)`

### Logging Service (`lib/logService.js`)

**Pre-configured functions**:
- `logStoveAction.ignite()`, `.shutdown()`, `.setFan(level)`, `.setPower(level)`
- `logSchedulerAction.toggleMode(enabled)`, `.updateSchedule(day)`, `.addInterval(day)`, `.removeInterval(day, index)`, `.clearSemiManual()` - log uscita manuale da modalità semi-manuale
- `logNetatmoAction.connect()`, `.disconnect()`, `.selectDevice(id)`

**Auto-include**: Auth0 user info (email, name, picture, sub)

### Changelog Service (`lib/changelogService.js`)

**Funzioni**:
- `saveVersionToFirebase(version, date, changes, type)` - Salva versione su Firebase
- `getChangelogFromFirebase()` - Recupera tutte le versioni ordinate per data (più recenti prima)
- `getLatestVersion()` - Recupera ultima versione rilasciata
- `getVersionType(currentVersion, newVersion)` - Determina tipo versione ('major'|'minor'|'patch')
- `syncVersionHistoryToFirebase(versionHistory)` - Sincronizza VERSION_HISTORY con Firebase

**Workflow**:
1. Aggiorna `lib/version.js` (APP_VERSION, LAST_UPDATE, VERSION_HISTORY con `type`)
2. Aggiorna `CHANGELOG.md` manualmente seguendo formato Keep a Changelog
3. Sync automatico su deploy o manuale (opzionale)

### Netatmo Integration (`lib/netatmoApi.js`, `lib/netatmoService.js`)

**API Wrapper** (`lib/netatmoApi.js`):
- **Autenticazione**: `getAccessToken(refreshToken)` - Ottiene access token da refresh token
- **Topologia**: `getHomesData()`, `getDeviceList()` - Recupera struttura casa/dispositivi
- **Stato Real-time**: `getHomeStatus(homeId)`, `getThermState(deviceId, moduleId)` - Temperature e setpoint
- **Controllo**: `setRoomThermpoint(params)`, `setThermMode(params)`, `switchHomeSchedule(homeId, scheduleId)`
- **Storico**: `getRoomMeasure(params)` - Dati storici temperature
- **Helper**: `parseRooms()`, `parseModules()`, `extractTemperatures()`, `isHeatingActive()`

**Service Layer** (`lib/netatmoService.js`):
- **State Management**: Firebase CRUD per refresh_token, home_id, topology, currentStatus
- **Automation**: CRUD regole automazione in `netatmo/automation/`
- **Helper Functions**: `getRoomsWithTemperatures()`, `getRoomsNeedingHeating()`, `isAnyRoomHeating()`, `getAverageTemperature()`
- **Logging**: `logNetatmoAction(action, details, user)` - Log azioni Netatmo

**API Endpoints** (`app/api/netatmo/*`):
- `GET /api/netatmo/homesdata` - Topologia completa (home_id, rooms, modules) + save Firebase
- `GET /api/netatmo/homestatus` - Stato real-time tutte le stanze + temperature
- `POST /api/netatmo/setroomthermpoint` - Imposta setpoint temperatura stanza (body: `{room_id, mode, temp?, endtime?}`)
- `POST /api/netatmo/setthermmode` - Imposta modalità riscaldamento casa (body: `{mode, endtime?}`)
- `POST /api/netatmo/devices` - Lista dispositivi (legacy)
- `POST /api/netatmo/temperature` - Temperatura singolo modulo (legacy)
- `GET /api/netatmo/callback` - OAuth2 callback
- `GET /api/netatmo/devices-temperatures` - Tutte temperature (legacy)

**Room Modes**:
- `manual` - Setpoint manuale (richiede `temp`)
- `home` - Modalità comfort
- `max` - Massimo riscaldamento
- `off` - Spento

**Home Modes**:
- `schedule` - Programmazione attiva
- `away` - Modalità assenza
- `hg` - Antigelo (frost guard)
- `off` - Spento

**Dashboard** (`/netatmo`):
- Grid stanze con RoomCard component
- Controllo modalità riscaldamento globale
- Visualizzazione temperature real-time + setpoint
- Indicatori riscaldamento attivo
- Controlli per stanza: imposta temperatura, auto, off
- Polling ogni 30 secondi

**Struttura Firebase**:
```
netatmo/
  refresh_token          # OAuth2 refresh token
  home_id                # ID casa principale Netatmo
  topology/              # Struttura completa
    home_id
    home_name
    rooms[]              # [{id, name, type, modules[]}]
    modules[]            # [{id, name, type, bridge, room_id}]
    schedules[]          # Programmazioni disponibili
    updated_at
  currentStatus/         # Stato real-time
    rooms[]              # [{room_id, room_name, temperature, setpoint, mode, heating}]
    mode                 # Modalità globale (schedule/away/hg/off)
    updated_at
  deviceConfig/          # Legacy - compatibilità endpoint vecchi
    device_id
    module_id
  automation/            # Regole automazione (future)
    {ruleId}/
      id, name, enabled, trigger, conditions, actions, updated_at
```

### Route Management (`lib/routes.js`)

**Centralized route definitions** - single source of truth

**Export**:
- `STOVE_ROUTES`, `SCHEDULER_ROUTES`, `NETATMO_ROUTES`, `LOG_ROUTES`, `USER_ROUTES`, `AUTH_ROUTES`, `API_ROUTES`

**Usage**:
```javascript
import { STOVE_ROUTES } from '@/lib/routes';
await fetch(STOVE_ROUTES.status);
```

---

## Scheduler

### Modalità

- **Manual** 🔧 - Controllo manuale via UI (accent color)
- **Automatic** ⏰ - Controllo automatico via cron (success color)
  - Visualizza prossimo cambio scheduler in home: azione (accensione/spegnimento), orario "HH:MM del DD/MM", potenza e ventola
- **Semi-Manual** ⚙️ - Override manuale temporaneo con returnToAutoAt (warning color)
  - Pulsante "↩️ Torna in Automatico" disponibile in StovePanel e Scheduler page per uscire dalla modalità semi-manuale

### Cron Integration

- External cron → `/api/scheduler/check?secret=cazzo` ogni minuto
- Logic: verifica mode → fetch status → compara orari → esegue comandi → clear semi-manual quando scheduled change

### Funzioni schedulerService.js

- `getNextScheduledChange()` - Ritorna timestamp ISO del prossimo cambio (per returnToAutoAt)
- `getNextScheduledAction()` - Ritorna oggetto con `{timestamp, action: 'ignite'|'shutdown', power?, fan?}` per visualizzazione UI
- `saveSchedule(day, intervals)`, `getSchedule(day)`, `getWeeklySchedule()` - CRUD scheduler
- `setSchedulerMode(enabled)`, `getSchedulerMode()`, `getFullSchedulerMode()` - Gestione modalità
- `setSemiManualMode(nextScheduledChange)`, `clearSemiManualMode()` - Gestione semi-manual

### Validation Logic (Scheduler Intervals)

**onChange** (durante typing):
- Solo visual feedback, no validation/sorting/save

**onBlur** (quando lasci campo):
- ✅ Validate: end > start + 15min
- ✅ Link adjacent intervals (bidirectional)
- ✅ Remove overlapped intervals
- ✅ Sort by start time
- ✅ Save to Firebase
- ✅ Update semi-manual returnToAutoAt (solo time fields)

**Power levels**: 1-5 in UI (level 0 esiste in API ma non esposto - standby mode)

**Fan levels**: 1-6

---

## Styling

### Design System (Tailwind)

**Colors**:
- Primary (red #ef4444) - Fire/heat, critical actions, errors
- Accent (orange #f97316) - Manual mode, warmth
- Success (green #10b981) - Working, automatic mode
- Warning (yellow #f59e0b) - Semi-manual, standby
- Info (blue #3b82f6) - Information, links
- Neutral (grays) - Text, backgrounds, borders

**Animations** (`tailwind.config.js`):
- `animate-shimmer` - Skeleton loaders (1.5s infinite)
- `animate-dropdown` - Dropdown menu (fade+slide+scale 0.15s)

**Custom**:
- Shadows: `shadow-soft`, `shadow-card`
- Border radius: `rounded-xl`, `rounded-2xl`, `rounded-3xl`

### CSS Architecture

**IMPORTANTE**: Pure Tailwind CSS inline - NO custom CSS classes

**`app/globals.css`** - Solo base styles:
```css
@layer base {
  html { @apply antialiased; }
  body { @apply bg-gradient-to-br from-neutral-50 via-neutral-100 to-neutral-200; }
}
```

**Component Styling**:
- ✅ Inline Tailwind classes in components
- ✅ Encapsulate patterns in reusable components (Card, Button)
- ❌ NO utility classes in globals.css (`.card`, `.btn-primary`, etc.)

**Pattern**:
```javascript
// ✅ CORRECT
export default function Card({ children, className }) {
  return (
    <div className={`bg-white rounded-2xl shadow-soft border border-neutral-200/50 ${className}`}>
      {children}
    </div>
  );
}

// ❌ WRONG
export default function Card({ children, className }) {
  return <div className={`card ${className}`}>{children}</div>;
}
```

---

## PWA

### Configuration Files

**`public/manifest.json`**:
- Icons: 8 sizes (72-512px), adaptive (192, 512)
- Shortcuts: 🔥 Accendi, ⏰ Pianificazione, 🚨 Allarmi
- **IMPORTANTE**: Shortcuts sono **static only** - no dynamic data
- Theme: `#ef4444` (primary red)

**`next.config.mjs`**:
- `disable: process.env.NODE_ENV === 'development'`
- `reloadOnOnline: true`
- Offline fallback: `/offline`
- Caching strategies:
  - Stove API: NetworkFirst (10s timeout, 60s cache)
  - Images: CacheFirst (7 days, 100 max)
  - Static: StaleWhileRevalidate (24h)

**`app/layout.js`**:
- PWA metadata tags
- Apple Web App support
- Viewport: max-scale=5, user-scalable

### Limitations

**Shortcuts**:
- ❌ Cannot show dynamic data (status, temperature, power)
- ❌ Cannot update in real-time
- ✅ Static only, defined at build time

**Alternatives**:
1. App Badge - numeric count only
2. Push Notifications - already implemented per errors
3. Fast App Launch - current approach (<1s load, 5s polling)

---

## Best Practices

### Versioning (IMPORTANTE)
**OGNI VOLTA che viene effettuata una lavorazione, aggiornare sistema di versioning**:

1. **Versionamento Semantico** (MAJOR.MINOR.PATCH):
   - **MAJOR** (x.0.0): Breaking changes, modifiche architetturali importanti
   - **MINOR** (0.x.0): Nuove funzionalità, feature aggiunte senza breaking changes
   - **PATCH** (0.0.x): Bug fixes, correzioni, miglioramenti minori

2. **Aggiornare `lib/version.js`**:
   - `APP_VERSION` - Incrementa secondo semantic versioning
   - `LAST_UPDATE` - Data corrente formato YYYY-MM-DD
   - `VERSION_HISTORY` - Aggiungi nuovo oggetto in testa all'array con:
     - `version`: numero versione
     - `date`: data aggiornamento
     - `type`: 'major' | 'minor' | 'patch'
     - `changes`: array descrizioni modifiche (bullet points chiari e concisi)

3. **Aggiornare `CHANGELOG.md`**:
   - Formato [Keep a Changelog](https://keepachangelog.com/it/1.0.0/)
   - Sezioni: Aggiunto, Modificato, Deprecato, Rimosso, Corretto, Sicurezza
   - Ordine: versioni più recenti in alto

4. **Sincronizzazione Firebase** (opzionale):
   - Sync automatico su deploy
   - Manuale: usa `changelogService.syncVersionHistoryToFirebase(VERSION_HISTORY)`

5. **Esempi**:
   - Nuova feature → 1.0.0 → 1.1.0 (minor)
   - Bug fix → 1.1.0 → 1.1.1 (patch)
   - Breaking change → 1.1.1 → 2.0.0 (major)

### API Routes
1. ✅ Use `@auth0/nextjs-auth0` (NO `/edge`)
2. ✅ Never `export const runtime = 'edge'` with Firebase
3. ✅ Import Firebase as `import { db } from '@/lib/firebase'`
4. ✅ Test with `npm run build` before commit

### Images
1. ✅ Always `<Image>` from `next/image` (not `<img>`)
2. ✅ Explicit `width` and `height` props
3. ✅ Add remote domains to `next.config.mjs` (`images.remotePatterns`)

### Module Exports
1. ✅ Assign to variable before export: `const x = {...}; export default x`
2. ✅ Named exports for multiple items
3. ❌ Avoid anonymous object exports

### Styling
1. ✅ Inline Tailwind classes only
2. ❌ Never add classes to `app/globals.css`
3. ✅ Custom animations in `tailwind.config.js`
4. ✅ Encapsulate reusable styles in components

### Components
- **DO**: Repeated patterns, complex UI, variant support, testable features
- **DON'T**: One-off sections, trivial wrappers, over-abstraction
- **Props over config**, **Composition over inheritance**, **Single responsibility**

### Client Components (Next.js 15 App Router)
1. ✅ Usa `'use client'` quando il componente:
   - Usa React hooks (`useState`, `useEffect`, `useCallback`, `useMemo`, etc.)
   - Gestisce eventi browser (`onClick`, `onChange`, etc.)
   - Usa browser APIs (localStorage, window, document, etc.)
   - Necessita di interattività lato client
2. ✅ Posiziona `'use client'` come **prima riga** del file (prima di qualsiasi import)
3. ✅ Server components per default - aggiungi `'use client'` solo se necessario
4. ❌ Non dimenticare la direttiva in custom hooks che usano hooks React

**Pattern corretto**:
```javascript
'use client';

import { useState } from 'react';

export default function MyComponent() {
  const [state, setState] = useState(false);
  return <button onClick={() => setState(!state)}>Toggle</button>;
}
```

### Loading States
- ✅ Use component-specific skeletons
- ✅ Show skeleton during initial fetch only
- ✅ Pattern: `loading` state, `if (loading) return <Skeleton.X />`, `finally { setLoading(false) }`

### UI/UX
- Mobile-first, Tailwind spacing scale, emoji icons, color semantics
- Smooth transitions (`transition-all duration-200`)
- Card-based layout, proper contrast, semantic HTML
- Glassmorphism: `backdrop-blur-sm`, `bg-white/60` per effetto moderno
- Active feedback: `active:scale-95` sui pulsanti interattivi
- Hover animations: `group-hover:rotate-180` per icone
- Disabled states: opacity + cursor-not-allowed + alert visivo contestuale
- Gradienti decorativi: `bg-gradient-to-r from-primary-500 via-accent-500 to-primary-500`

---

## Troubleshooting

### Build Errors

**Firebase Export**:
```javascript
// lib/firebase.js
export { db, db as database }; // Both exports required
```

**Auth0 Edge Conflict**:
```javascript
// ✅ CORRECT
import { handleAuth } from '@auth0/nextjs-auth0';
// ❌ WRONG
import { handleAuth } from '@auth0/nextjs-auth0/edge';
export const runtime = 'edge'; // Remove
```

**Next.js Image**:
```javascript
import Image from 'next/image';
<Image src={url} alt={alt} width={24} height={24} className="..." />
```

**Remote Image Domains**:
```javascript
// next.config.mjs
images: {
  remotePatterns: [
    { protocol: 'https', hostname: '**.gravatar.com' },
    { protocol: 'https', hostname: '**.googleusercontent.com' },
  ],
}
```

**Workspace Root Warning**:
```javascript
// next.config.mjs
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const nextConfig = { outputFileTracingRoot: resolve(__dirname) };
```

**Missing 'use client' Directive**:
```javascript
// ❌ WRONG - Hook senza 'use client'
import { useState } from 'react';
export default function Component() { ... }

// ✅ CORRECT - Aggiungi 'use client' come prima riga
'use client';

import { useState } from 'react';
export default function Component() { ... }
```

**Diagnosi rapida**:
```bash
# Trova file con hooks ma senza 'use client'
find app -name "*.js" -type f -exec grep -l "useState\|useEffect" {} \; | \
  xargs -I {} sh -c 'if [ "$(head -1 "{}" | grep -c "use client")" -eq 0 ]; then echo "{}"; fi'
```

### Runtime Compatibility
- Firebase Client SDK: Node.js only (no Edge)
- Auth0: Node.js for consistency
- API Routes with Firebase: Never Edge runtime

---

## Quick Reference

### Key Files
- API endpoints: `lib/stoveApi.js`, `lib/netatmoApi.js`, `lib/routes.js`
- UI components: `app/components/ui/*`, `app/components/netatmo/*`
- Error handling: `lib/errorMonitor.js`
- Logging: `lib/logService.js`
- Services: `lib/schedulerService.js`, `lib/netatmoService.js`
- Version: `lib/version.js` (APP_VERSION, LAST_UPDATE, VERSION_HISTORY)
- Styling: `tailwind.config.js`, inline Tailwind in components
- Config: `next.config.mjs`, `.env.local`, `CLAUDE.md`

### Common Tasks
- **Update version** (SEMPRE dopo modifiche):
  1. Edit `lib/version.js` - Incrementa APP_VERSION (semantic), aggiorna LAST_UPDATE, aggiungi entry con `type` in VERSION_HISTORY
  2. Edit `CHANGELOG.md` - Aggiungi sezione nuova versione con formato Keep a Changelog
  3. (Opzionale) Sync Firebase: `changelogService.syncVersionHistoryToFirebase(VERSION_HISTORY)`
- **Add error code**: Update `ERROR_CODES` in `lib/errorMonitor.js`
- **Add UI component**: Create in `app/components/ui/`, export in `index.js`, inline Tailwind
- **Modify scheduler**: Edit `app/api/scheduler/check/route.js`
- **Change polling**: Modify `setInterval` in `StovePanel.js` (default 5000ms)
- **Modify colors**: Update `tailwind.config.js` theme.extend.colors
- **Add animation**: Define in `tailwind.config.js` keyframes + animation

### PWA Tasks
- **Update shortcuts**: Edit `public/manifest.json`, rebuild
- **Change theme color**: Update BOTH `manifest.json` AND `app/layout.js`
- **Update icon**: Replace `public/icons/icon-{192,512}.png`, regenerate sizes (ImageMagick), update `app/favicon.png`
- **Modify cache**: Edit `runtimeCaching` in `next.config.mjs`
- **Test offline**: `npm run build && npm run start`, disable network in DevTools
- **Clear SW**: DevTools → Application → Service Workers → Unregister

### Code Quality
```bash
npm run build    # Build + generate PWA
npm run lint     # ESLint
npm run dev      # Test runtime
```

---

## Environment Variables

```env
# Firebase
NEXT_PUBLIC_FIREBASE_*

# Auth0
AUTH0_*

# Netatmo
NEXT_PUBLIC_NETATMO_*
NETATMO_*

# Scheduler
CRON_SECRET=cazzo
```

---

## Application Workflows

### Real-time Monitoring
1. User opens app → `Skeleton.StovePanel`
2. Fetch: status, fan, power, scheduler mode (NO temperatura - non supportata)
3. If modalità automatica: fetch prossimo cambio scheduler con `getNextScheduledAction()` → mostra in UI (azione, orario, potenza, ventola)
4. If `Error !== 0`: log Firebase, show ErrorAlert, send notification
5. Poll every 5s
6. Manual actions: API call + log + semi-manual mode
7. Regolazioni disabilitate automaticamente se `status.includes('OFF|ERROR|WAIT')`

### Scheduler Automation
1. User configures → save Firebase
2. Cron calls `/api/scheduler/check?secret=cazzo` every minute
3. Check mode → fetch status → compare time → execute commands → clear semi-manual

### Semi-Manual Mode
1. User fa azione manuale (accensione/spegnimento) mentre scheduler in automatico → trigger semi-manual
2. Calcola `nextScheduledChange` con `getNextScheduledChange()` → salva come `returnToAutoAt`
3. Mostra in UI: "Ritorno auto: HH:MM del DD/MM" + pulsante "↩️ Torna in Automatico"
4. Click pulsante → `clearSemiManualMode()` + log → torna in automatico, reload prossimo cambio scheduler

### Error Management
1. Error detected → log Firebase with severity
2. Send browser notification (if critical/new)
3. Display: ErrorAlert (home), Badge (StatusBadge), History (/errors)
4. User marks resolved → duration calculated

### Authentication
1. Visit app → Auth0 middleware check
2. Not authenticated → redirect `/api/auth/login`
3. Login → callback → session created
4. All actions logged with user info

### Version Notifications
1. App mount → `useVersionCheck` hook si attiva
2. Fetch ultima versione da Firebase (`getLatestVersion`)
3. Confronta con `APP_VERSION` locale (semantic versioning)
4. Check localStorage: `lastSeenVersion` e `dismissedVersions`
5. **Se nuova versione disponibile**: Mostra badge "NEW" nel footer
6. **Se prima volta post-update**: Mostra modal "What's New" automatico
7. User dismiss modal:
   - Standard: salva `APP_VERSION` in `lastSeenVersion`
   - "Non mostrare più": aggiunge a `dismissedVersions` array
8. Click badge NEW: dismiss notifica + salva in localStorage
