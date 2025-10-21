# CLAUDE.md - Guida Progetto Pannello Stufa

**Next.js 15 PWA** per controllo remoto stufa pellet Thermorossi via cloud API.

## Quick Start

```bash
npm install
cp .env.example .env.local  # Configura credenziali
npm run dev                 # Development (localhost:3000)
npm run build && npm run start  # Test PWA locale
```

## Stack

- **Next.js 15.5.4**: App Router, Server/Client Components, API Routes
- **React 19.2**: Hooks, Suspense, modern async patterns
- **Tailwind CSS 3**: Utility-first + glassmorphism iOS 18 style
- **Firebase Realtime DB**: Scheduler, logs, versioning
- **Auth0**: Autenticazione
- **Thermorossi Cloud API**: Controllo stufa
- **Netatmo Energy API**: Termostato
- **next-pwa**: Service Worker, offline support

## Struttura Directory Essenziale

```
app/
├── components/
│   ├── ui/                   # Card, Button, Banner, Select, Skeleton, Footer
│   ├── devices/              # Device-specific components (multi-device architecture)
│   │   ├── stove/            # StoveCard (polling 5s, controls, maintenance)
│   │   ├── thermostat/       # ThermostatCard (Netatmo multi-room)
│   │   └── lights/           # LightsCard (Hue - future dev)
│   ├── scheduler/            # TimeBar, DayAccordionItem
│   ├── MaintenanceBar.js     # Barra progresso manutenzione
│   ├── MaintenanceBar.module.css  # CSS Module: animazione shimmer
│   ├── CronHealthBanner.js   # Alert cronjob inattivo >5min
│   ├── VersionEnforcer.js    # Hard update modal
│   └── ClientProviders.js    # Wrapper contexts (UserProvider + VersionProvider)
├── context/
│   └── VersionContext.js     # State globale versioning
├── hooks/
│   └── useVersionCheck.js    # Soft version notification
├── api/
│   ├── stove/                # Proxy Thermorossi (status, ignite, shutdown, setFan, setPower)
│   ├── scheduler/check/      # Cron endpoint + maintenance tracking
│   ├── netatmo/              # Termostato API (OAuth 2.0)
│   ├── hue/                  # Luci API (Local API - future dev)
│   ├── log/add/              # User action logging
│   └── auth/[...auth0]/      # Auth0 handler
├── page.js                   # Home (grid responsive multi-device)
├── scheduler/page.js         # Pianificazione settimanale
├── maintenance/page.js       # Configurazione manutenzione stufa
├── log/page.js              # Storico azioni (con device filtering)
├── errors/page.js           # Allarmi stufa
├── changelog/page.js        # Versioni
└── not-found.js             # Pagina 404 (richiesta Next.js 15)

lib/
├── devices/                 # Multi-device registry (CRITICO per scalabilità)
│   ├── deviceTypes.js       # DEVICE_CONFIG registry + getEnabledDevices()
│   └── index.js             # Esporta funzioni helper
├── stoveApi.js              # Thermorossi wrapper
├── schedulerService.js      # Scheduler logic + timezone handling
├── maintenanceService.js    # Maintenance tracking + Firebase operations
├── firebase.js              # Client SDK (NO Edge runtime)
├── version.js               # APP_VERSION, VERSION_HISTORY
├── changelogService.js      # Version management + Firebase sync
├── errorMonitor.js          # Error detection + notification
├── logService.js            # Pre-configured logging functions (device-aware)
├── formatUtils.js           # Utility functions (es. formatHoursToHHMM)
└── [external-api]/          # Pattern per integrazioni API esterne
    ├── api.js               # API wrapper (es. netatmoApi.js, hueApi.js)
    ├── service.js           # State management + Firebase (opzionale)
    └── tokenHelper.js       # Token management per OAuth APIs
```

## Componenti UI Principali

### Card
```jsx
<Card className="p-6">Content</Card>
<Card liquid className="p-6">Liquid Glass iOS 18 style</Card>
<Card glass className="p-6">Legacy glassmorphism</Card>  // Mantenuto per compatibilità
```
**Props**: `liquid={true}` applica liquid glass style, `glass={true}` legacy glassmorphism.

### Button
```jsx
<Button liquid variant="primary|secondary|success|danger|accent|outline|ghost"
        size="sm|md|lg" icon="🔥">Accendi</Button>
```
**Props**: `liquid={true}` applica liquid glass style a tutte le varianti.

### Banner
Componente riutilizzabile per alert/warnings con 4 varianti (info/warning/error/success).
- **Props**: `variant`, `icon`, `title`, `description`, `actions`, `dismissible`, `onDismiss`, `liquid`
- **Supporto JSX inline** per `description` e `actions`
- **Liquid variant**: `liquid={true}` applica liquid glass style con colori semantici
- **Esempio**: Vedi `app/components/ui/Banner.js`

### Select
Dropdown con liquid glass style e z-[100].
```jsx
<Select liquid value={power} onChange={setPower}
        options={[{value: 1, label: 'P1'}]} disabled={!isOn} />
```
**Props**: `liquid={true}` applica liquid glass a trigger button e dropdown menu.

### Input
```jsx
<Input liquid type="text" placeholder="Inserisci valore" />
```
**Props**: `liquid={true}` applica liquid glass style con backdrop blur.

### Liquid Glass Style Pattern
Pattern unificato iOS 18 per componenti UI con trasparenza e blur.

**Composizione base**:
```jsx
className="bg-white/[0.08] backdrop-blur-3xl shadow-liquid-sm ring-1 ring-white/20 ring-inset
           relative overflow-hidden
           before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/10 before:to-transparent before:pointer-events-none"
```

**Shadows disponibili** (tailwind.config.js):
- `shadow-liquid-sm`: Piccoli elementi (buttons, input)
- `shadow-liquid`: Elementi medi (cards, dropdowns)
- `shadow-liquid-lg`: Elementi grandi (modals, panels)
- `shadow-liquid-xl`: Hero sections

**Z-index layers**: Contenuto con `relative z-10` sopra gradient overlay.

**Quando usare**: Tutti i componenti interattivi (buttons, cards, inputs, dropdowns, mobile menu) per consistenza visiva iOS 18 style.

### Navbar
**Architettura**: Stati separati mobile/desktop per zero interferenze
- **Desktop** (≥1024px): Links orizzontali + dropdown device + dropdown utente
- **Mobile** (< 1024px): Hamburger button + fixed overlay menu

**Pattern Mobile Menu**:
- Fixed overlay: backdrop (`z-[100]`) + menu panel (`z-[101]`) sotto navbar (`z-50`)
- Backdrop position: `fixed top-[navbar-height]` per mantenere header visibile
- Click fuori → chiude menu (backdrop onClick)
- Body scroll lock quando menu aperto
- Auto-chiusura: route change + ESC key

**Pattern Dropdown Desktop**:
- State + ref per click outside detection
- `useEffect` con addEventListener mousedown
- Chiusura: click outside + ESC key + route change
- Z-index: `z-[100]` per dropdown sopra altri elementi

## Multi-Device Architecture

### Device Registry (`lib/devices/deviceTypes.js`)
Centralizza configurazione tutti i dispositivi supportati.

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
    routes: { main, scheduler, maintenance, errors },
    features: { hasScheduler, hasMaintenance, hasErrors },
  },
  // ... altri device
};
```

**Helper Functions**:
- `getEnabledDevices()` - Filtra solo device con `enabled: true`
- `getDeviceConfig(id)` - Ottiene config singolo device

### Device Cards Pattern
Ogni device ha card dedicata in `app/components/devices/{device}/`:
- **StoveCard**: Polling 5s, controls, maintenance bar
- **ThermostatCard**: Multi-room selection, temperature controls
- Pattern: connection check → polling → controls → link pagina dedicata

### Homepage Layout
```jsx
// app/page.js
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
  {enabledDevices.map(device => {
    if (device.id === 'stove') return <StoveCard key={device.id} />;
    if (device.id === 'thermostat') return <ThermostatCard key={device.id} />;
    // ...
  })}
</div>
```
- **Mobile** (< 1024px): Stack verticale
- **Desktop** (≥ 1024px): Grid 2 colonne

### Aggiungere Nuovo Device
1. Aggiorna `DEVICE_TYPES` in `deviceTypes.js`
2. Aggiungi config in `DEVICE_CONFIG` con `enabled: false`
3. Crea directory `app/components/devices/{device}/`
4. Crea `{Device}Card.js` con pattern esistente
5. Aggiungi case in `app/page.js` mapping
6. Quando pronto: `enabled: true`

## Custom Hooks

### useVersionCheck (Soft Notification)
Semantic version comparison, localStorage tracking, badge "NEW" + WhatsNewModal dismissibile.

### useVersion (Hard Enforcement)
Global context state, on-demand check ogni 5s, ForceUpdateModal bloccante SOLO se versione locale < Firebase.

## API Routes Principali

### Stove Control (`/api/stove/*`)
| Endpoint | Method | Body | Note |
|----------|--------|------|------|
| `/status` | GET | - | Status + errori |
| `/getFan` | GET | - | Fan 1-6 |
| `/getPower` | GET | - | Power 0-5 (UI: 1-5) |
| `/ignite` | POST | `{source: 'manual'\|'scheduler'}` | Semi-manual SOLO se source='manual'. **Bloccato se needsCleaning=true** |
| `/shutdown` | POST | `{source: 'manual'\|'scheduler'}` | Semi-manual SOLO se source='manual'. **Sempre permesso** |
| `/setFan` | POST | `{level: 1-6, source}` | Semi-manual SOLO se source='manual' E stufa ON |
| `/setPower` | POST | `{level: 1-5, source}` | Semi-manual SOLO se source='manual' E stufa ON |

**Parametro `source`**:
- `'manual'` → Comando da homepage → Attiva semi-manual se scheduler enabled
- `'scheduler'` → Comando da cron → NON attiva semi-manual

### Scheduler (`/api/scheduler/check?secret=<CRON_SECRET>`)
- Chiamato ogni minuto da cron
- Verifica mode (manual/auto/semi-manual)
- Esegue comandi se automatico
- Clear semi-manual quando scheduled change

### External APIs Pattern (`/api/[external-api]/*`)

Pattern generico per integrare API esterne (es. Netatmo, Stripe, Twilio, etc.).

**Struttura**:
```
app/api/[external-api]/
├── callback/route.js        # OAuth callback (se necessario)
├── [endpoint]/route.js      # Endpoint API specifici

lib/[external-api]/
├── api.js                   # API wrapper
├── service.js               # State management + Firebase
└── tokenHelper.js           # Token management (se OAuth required)
```

**Token Helper Pattern** (OAuth 2.0):
```javascript
export async function getValidAccessToken() {
  // 1. Fetch refresh_token from Firebase
  // 2. Exchange for access_token
  // 3. If new refresh_token → save to Firebase
  // 4. Handle errors (expired, invalid, etc.)
  return { accessToken, error, message };
}
```

**Client Reconnect Pattern**:
```javascript
const response = await fetch('/api/external-api/endpoint');
const data = await response.json();
if (data.reconnect) {
  setConnected(false); // Show auth/connection UI
}
```

**Esempio implementazione completa**: Vedi `lib/netatmo/` per pattern OAuth con auto-refresh e error handling.

## Log Service (`lib/logService.js`)

Sistema centralizzato logging azioni utente con supporto multi-device.

```javascript
logUserAction(action, device, value, metadata)
// device: from DEVICE_TYPES ('stove', 'thermostat', 'lights', 'sonos')
```

**Pre-configured helpers**:
- `logStoveAction.{ignite, shutdown, setFan, setPower}`
- `logSchedulerAction.{toggleMode, updateSchedule, addInterval}`
- `logNetatmoAction.{connect, setRoomTemperature, setMode}`

**Device Filtering**: `/log` page supporta filtri per dispositivo (Tutti, Stufa, Termostato, Luci, Sonos).

## Firebase Schema Essenziale

```
stoveScheduler/
├── monday-sunday/           # [{start, end, power, fan}]
└── mode/
    ├── enabled              # boolean
    ├── semiManual           # boolean
    └── returnToAutoAt       # ISO string UTC

maintenance/
├── currentHours             # float (ore utilizzo attuali, 4 decimali)
├── targetHours              # float (ore prima pulizia, default 50)
├── lastCleanedAt            # ISO string UTC (null se mai pulita)
├── needsCleaning            # boolean (blocco accensione)
└── lastUpdatedAt            # ISO string UTC (per calcolo elapsed time)

cronHealth/
└── lastCall                 # ISO string UTC (timestamp ultima chiamata cron)

log/
└── {logId}/
    ├── action, value, timestamp
    ├── source: 'manual'|'scheduler'
    └── user/                # Auth0 info

errors/
└── {errorId}/
    ├── errorCode: number           # Codice errore (0 = nessun errore)
    ├── errorDescription: string    # Descrizione testuale
    ├── severity: string            # INFO|WARNING|ERROR|CRITICAL
    ├── timestamp: number           # Unix timestamp (ms)
    ├── resolved: boolean
    ├── resolvedAt: number          # Unix timestamp (ms) [opzionale]
    ├── status: string              # Status stufa quando errore verificato
    └── source: string              # Origine rilevamento (es. 'status_monitor')

changelog/
└── {version}/               # "1_1_0" (dots → underscores)
    ├── version, date, type
    ├── changes[]
    └── timestamp

[external-api]/              # Pattern per integrazioni esterne (es. netatmo/)
├── refresh_token            # OAuth refresh token persistente
├── [config]/                # Configurazione API (es. home_id, device_id, etc.)
├── [data]/                  # Cache dati fetched (es. topology, status)
│   └── updated_at           # timestamp last fetch
└── [automation]/            # Regole automazione custom (opzionale)
```

**Export Pattern**: `export { db, db as database };` (NO Edge runtime)

## Modalità Operative

### Manual 🔧
Scheduler disabilitato, controllo manuale completo.

### Automatic ⏰
Scheduler abilitato. UI mostra prossimo cambio: "🔥 Accensione alle 18:30 del 04/10 (P4, V3)".

### Semi-Manual ⚙️
Override temporaneo. Trigger: azione manuale homepage mentre in auto.
- ✅ Ignite/Shutdown manuali → attiva sempre
- ✅ SetPower/SetFan manuali → attiva solo se stufa ON
- ❌ Comandi da cron (source='scheduler') → NON attiva

Calcola `returnToAutoAt` = prossimo cambio scheduler. UI mostra countdown + pulsante "↩️ Torna in Automatico".

## Sistema Manutenzione Stufa 🔧

Sistema autonomo H24 per tracking ore utilizzo e gestione pulizia periodica.

**Caratteristiche**:
- ✅ Tracking automatico server-side (cron ogni minuto)
- ✅ Funziona H24, anche app chiusa
- ✅ Blocco automatico **solo accensione** quando pulizia richiesta (spegnimento sempre permesso)
- ✅ Barra progresso visiva con colori dinamici + animazione shimmer ≥80%

### Funzioni maintenanceService.js
```javascript
getMaintenanceData()         // Recupera dati manutenzione (init default se non esiste)
updateTargetHours(hours)     // Aggiorna ore target configurazione
trackUsageHours(status)      // CRITICO: Tracking automatico da cron (NON client-side!)
confirmCleaning(user)        // Reset contatore dopo pulizia + log Firebase
canIgnite()                  // Verifica se accensione consentita (blocco se needsCleaning)
getMaintenanceStatus()       // Status completo: percentage, remainingHours, isNearLimit
```

### UI Components
- **MaintenanceBar**: Barra progresso integrata in card "Stato Stufa" con collapse/expand intelligente
  - Auto-expand SOLO prima volta quando percentage ≥80%
  - localStorage persistence per preferenza utente
  - Colori dinamici: verde (0-59%) → giallo (60-79%) → arancione (80-99%) → rosso (100%+)
  - Implementazione: `app/components/MaintenanceBar.js:89-180`
- **Banner Pulizia**: Card bloccante quando needsCleaning=true con conferma pulizia

### Tracking Server-Side (CRITICO)
**Perché server-side**: Client-side tracking funziona SOLO se app aperta. Server-side cron funziona H24.

**Implementazione**: `/api/scheduler/check` chiama `trackUsageHours()` ogni minuto.

**Lifecycle `lastUpdatedAt`** (IMPORTANTE per evitare ore fantasma):
1. **Init**: `null` in Firebase (NO timestamp inizializzazione)
2. **Primo WORK**: Inizializza `lastUpdatedAt = now` senza aggiungere ore
3. **Tracking continuo**: Calcola `elapsed = now - lastUpdatedAt`, aggiorna entrambi
4. **Config change**: `updateTargetHours()` NON tocca `lastUpdatedAt` (evita ore fantasma)

**Logica tracking**:
1. Check status WORK → se no, skip
2. Se `lastUpdatedAt === null` → inizializza e return (no tracking)
3. Calcola `elapsed = now - lastUpdatedAt` (Firebase)
4. Se elapsed < 0.5min → skip
5. Update Firebase: `currentHours += elapsed/60`, `lastUpdatedAt = now`
6. Se `currentHours >= targetHours` → `needsCleaning = true`

**Auto-recovery**: Se cron salta chiamate, prossima esecuzione recupera minuti persi automaticamente.

## Sistema Monitoring Cronjob 🔍

Sistema per monitoraggio affidabilità cronjob scheduler.

**Features**:
- Salvataggio timestamp Firebase ad ogni chiamata cron (`cronHealth/lastCall`)
- Firebase listener realtime client-side
- Alert automatico se cron inattivo >5 minuti
- Auto-hide quando cron riprende

**Implementazione**:
- Server: `/api/scheduler/check` salva timestamp all'inizio esecuzione
- Client: `CronHealthBanner` con Firebase listener + check ogni 30s
- UI: Variante inline integrata in card "Stato Stufa" (default) o banner standalone

**Codice**: Vedi `app/components/CronHealthBanner.js:25-85` per pattern Firebase listener.

## Sistema Rilevamento Errori 🚨

**Overview**: Sistema autonomo per rilevamento, monitoraggio e visualizzazione errori stufa in tempo reale.

**Features**:
- Database 23 codici errore con severità (INFO/WARNING/ERROR/CRITICAL) e suggerimenti risoluzione
- Badge errore pulsante con animazione pulse nel display status
- ErrorAlert banner con suggerimenti e link storico errori
- Browser notifications per errori critici
- Logging persistente su Firebase con stato risoluzione

**Implementazione completa**: 📖 Vedi `ERRORS-DETECTION.md` per:
- Database ERROR_CODES completo
- UI components (badge, alert, pagina storico)
- Data flow e testing
- Best practices e troubleshooting

## Sistema Notifiche Push 🔔

**Overview**: Sistema completo notifiche push multi-dispositivo con supporto iOS PWA.

**Features**:
- Firebase Cloud Messaging (FCM) per delivery notifiche
- Supporto iOS 16.4+ tramite PWA installation
- Notifiche automatiche per errori stufa, azioni scheduler, soglie manutenzione
- Gestione permessi e device registration
- Testing via pagina settings

**Architettura**:
- **Client**: `lib/notificationService.js` - Request permissions, FCM token management, foreground notifications
- **Server**: `lib/firebaseAdmin.js` - Send push notifications via Firebase Admin SDK
- **Service Worker**: `public/firebase-messaging-sw.js` - Background message handler
- **API Routes**: `/api/notifications/{test,send}` - Test e invio notifiche
- **UI**: `app/settings/notifications/page.js` - Gestione permessi e device list

**Integrazione Eventi**:
- **Errori**: `errorMonitor.js` → `sendErrorPushNotification()` quando error !== 0
- **Scheduler**: `/api/scheduler/check` → `sendSchedulerNotification()` per accensione/spegnimento auto
- **Manutenzione**: `maintenanceService.js` → notifiche a 80%, 90%, 100% (una volta per livello)

**Configurazione Richiesta**:
```env
NEXT_PUBLIC_FIREBASE_VAPID_KEY=...           # Firebase Console → Cloud Messaging → Web Push certificates
FIREBASE_ADMIN_PROJECT_ID=...                # Service account JSON
FIREBASE_ADMIN_CLIENT_EMAIL=...              # Service account JSON
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN..."  # Service account JSON (mantieni \n)
ADMIN_USER_ID=auth0|xxx                      # Destinatario notifiche scheduler/manutenzione
```

**Firebase Schema**:
```
users/{userId}/fcmTokens/{token}/
  ├─ token: "fcm-token"
  ├─ createdAt: timestamp
  ├─ platform: "ios"|"other"
  └─ isPWA: boolean

maintenance/
  └─ lastNotificationLevel: 80|90|100  # Evita spam notifiche duplicate
```

**iOS Requirements**:
- iOS 16.4+ (release Marzo 2023)
- App installata come PWA (Add to Home Screen da Safari)
- HTTPS connection (production)

**Gestione Preferenze Utente**:
Sistema completo di personalizzazione notifiche con toggle switches e salvataggio Firebase per utente.

**Service**: `lib/notificationPreferencesService.js`
- `getUserPreferences(userId)` - Recupera preferenze (init defaults se non esistono)
- `updatePreferenceSection(userId, section, prefs)` - Update parziale preferenze
- `shouldSendErrorNotification(userId, severity)` - Check se inviare errore per severità
- `shouldSendSchedulerNotification(userId, action)` - Check se inviare scheduler per azione
- `shouldSendMaintenanceNotification(userId, threshold)` - Check se inviare manutenzione per soglia
- `resetPreferences(userId)` - Reset a defaults

**UI**: `app/components/NotificationPreferencesPanel.js`
- Toggle switches organizzati per categoria (Errori/Scheduler/Manutenzione)
- Salvataggio automatico real-time
- Integrato in `/settings/notifications`
- Pattern riutilizzabile: master toggle + sotto-opzioni conditional rendering

**Schema Preferenze**:
```
users/{userId}/notificationPreferences/
  errors/
    enabled: boolean
    severityLevels:
      info: false         # Default off (rumore)
      warning: true
      error: true
      critical: true
  scheduler/
    enabled: boolean
    ignition: boolean     # Accensione auto
    shutdown: boolean     # Spegnimento auto
  maintenance/
    enabled: boolean
    threshold80: boolean  # Promemoria 80%
    threshold90: boolean  # Attenzione 90%
    threshold100: boolean # Urgente 100%
```

**Integrazione**:
- `errorMonitor.js` → Check preferenze prima `sendErrorPushNotification()`
- `/api/scheduler/check` → Check preferenze prima invio notifiche scheduler/manutenzione
- Fail-safe: Se errore check preferenze, invia comunque (safety-first)

**Menu Impostazioni Navbar**:
- Dropdown "⚙️ Impostazioni" in navbar (desktop + mobile)
- Configurato in `SETTINGS_MENU` (`lib/devices/deviceTypes.js`)
- 3 voci: Gestione Notifiche, Storico, Changelog
- Pattern: riuso esistente dropdown device + accordion mobile

**Setup completo**: 📖 Vedi `NOTIFICATIONS-SETUP.md` per:
- Configurazione Firebase Cloud Messaging step-by-step
- Generazione VAPID keys e Admin SDK credentials
- Installazione PWA su iOS (guida illustrata)
- Testing notifiche (manuale + automatiche)
- Troubleshooting iOS e debug tools

## Data Flow Essenziale

### Polling Status (ogni 5s)
```
StovePanel useEffect
  ↓
Fetch: status + fan + power + mode
  ↓
checkVersion() (VersionContext)  // Integrated
  ↓
If Error !== 0 → logError + notify
  ↓
Update UI
```

### Scheduler Cron (ogni minuto)
```
GET /api/scheduler/check?secret=xxx
  ↓
Verify CRON_SECRET (401 if invalid)
  ↓
Save cronHealth/lastCall timestamp (ISO UTC)
  ↓
Check mode (manual/auto/semi-manual)
  ↓
If auto: fetch schedule + execute actions (source='scheduler')
  ↓
  ├─ IGNITE: Check maintenance (canIgnite) → skip if needsCleaning
  └─ SHUTDOWN/SetFan/SetPower: NO maintenance check (sempre permessi)
  ↓
If scheduled change → clear semi-manual
  ↓
Track usage: trackUsageHours(currentStatus)
```

**CRITICO**:
- Maintenance tracking è **server-side via cron**, non client-side
- Blocco manutenzione applicato **solo all'accensione** (manuale e schedulata)
- Spegnimento sempre permesso, anche con manutenzione richiesta

### OAuth Token Management Flow
```
Client request → API route
  ↓
getValidAccessToken() // Token helper
  ↓
Fetch refresh_token from Firebase
  ↓
If not exists → { error: 'NOT_CONNECTED', reconnect: true }
  ↓
Exchange refresh_token for access_token
  ↓
If expired → clear Firebase + { error: 'TOKEN_EXPIRED', reconnect: true }
  ↓
If success: auto-save new refresh_token if returned
  ↓
Return { accessToken: 'xxx', error: null }
```

**Vantaggi**: Zero config client-side, sessione permanente, auto-refresh, flag `reconnect` per UI feedback.

## Versioning Workflow (CRITICO)

### 1. Semantic Versioning
- **MAJOR** (x.0.0): Breaking changes
- **MINOR** (0.x.0): New features
- **PATCH** (0.0.x): Bug fixes

### 2. Update Files
Aggiorna sempre: `lib/version.js`, `package.json`, `CHANGELOG.md`

### 3. Deployment + Sync Firebase
```bash
npm run build
# Deploy app
node -e "require('./lib/changelogService').syncVersionHistoryToFirebase(require('./lib/version').VERSION_HISTORY)"
```

**⚠️ OBBLIGATORIO**: Sync Firebase entro 5s dal deploy.

### 4. Version Enforcement Technical Details

**Funzioni Helper** (`app/context/VersionContext.js`):
- `compareVersions(v1, v2)`: Confronto semantico (returns -1/0/1)
- `isLocalEnvironment()`: Detection ambiente sviluppo

**Comportamento**:
- **Production**: Modal bloccante se `compareVersions(APP_VERSION, firebaseVersion) < 0`
- **Development**: Modal sempre disabilitata
- **Polling**: Check versione integrato in StovePanel polling 5s (12x più veloce vs 60s autonomo)

### 5. Changelog Page
**Ordinamento semantico CRITICO**: Firebase ordina solo per data. Applicare sempre `sortVersions()` client-side per garantire ordine corretto (1.4.4 > 1.4.3 > 1.4.2).

**Implementazione**: Vedi `app/changelog/page.js:45-65` per funzione sortVersions().

## Pattern Comuni Riutilizzabili

### Dropdown/Modal Pattern
**Pattern base**: State + Ref + Click Outside + Escape Key + Route Change (opzionale).
**Implementazione**: Vedi `app/components/Navbar.js:89-145` per esempio completo.

### Confirmation Modal Pattern
**Struttura**: Fixed backdrop (`z-[10000]`) + glassmorphism card + warning box + loading state.
**Esempio**: Vedi `app/maintenance/page.js:120-165` per modal reset manutenzione.

### Collapse/Expand Components with localStorage
**Pattern**:
1. State + localStorage per persistenza
2. **Priority logic**: savedState 'false'/'true' > auto-expand condition
3. CSS Modules per animazioni smooth (max-height + opacity)
4. Conditional rendering per evitare duplicazioni

**Esempio implementazione**: Vedi `app/components/MaintenanceBar.js:89-120` per collapse intelligente.

### Responsive Breakpoints Strategy
- **Mobile**: < 768px (`md:hidden`)
- **Tablet/Intermediate**: 768px-1024px (`md:flex`)
- **Desktop Small**: 1024px-1280px (`lg:`)
- **Desktop Large**: > 1280px (`xl:`)

**Best Practice**: Text truncation responsive (`max-w-[80px] xl:max-w-[120px]`), dropdown/collapse non-critical elements.

### Componenti con Varianti Multiple
**Pattern**: Usa prop `variant` per layout/stile diversi. Default variant sempre standalone, varianti aggiuntive per integrazioni (inline, compact, minimal).
**Esempio**: `CronHealthBanner` (banner/inline), `Banner` (info/warning/error/success).

### Badge Pulsante con Animazione
**Pattern**: Doppio layer (blur + solid) per glow effect, `animate-pulse`, positioning `absolute -top-2 -right-2`.
**Implementazione**: Vedi `app/page.js:180-195` per badge errore stufa.

### Debug/Monitoring Page Pattern
**Pattern**: Auto-refresh toggle + color-coding cards + raw JSON viewer + grid responsive.
**Esempio**: Vedi `app/debug/page.js` per implementazione completa.

## Design System

### Palette Colori Semantici
Tutti i colori hanno scala completa 50-900 (10 tonalità ciascuno):
- **primary/danger** (rosso): Azioni primarie, errori critici
- **accent** (arancione): Accenti, highlight
- **success** (verde): Successo, status positivi
- **warning** (giallo-arancio): Attenzioni, alert
- **info** (blu): Informazioni, note
- **neutral** (grigio): Testi, bordi, background

**Nomenclatura**: Usare SOLO `neutral-*`, MAI `gray-*`.

### Card Styling Standards
```jsx
<Card className="p-6">Standard</Card>              // Default solid
<Card liquid className="p-6">Liquid Glass</Card>   // iOS 18 style (preferito)
<Card className="p-8">Hero Content</Card>          // Hero sections
<Card glass className="p-6">Legacy Glass</Card>    // Glassmorphism legacy
<Card className="p-6 bg-info-50 border-2 border-info-200">Info</Card> // Colored info
```
**Best practice**: Usa `liquid` per UI moderna consistente, `glass` mantenuto per compatibilità.

### Background Consistenza
**SEMPRE** usa background globale definito in `globals.css`. **MAI** override custom nelle pagine.

## Code Quality Best Practices

### API Routes
- ✅ `import { handleAuth } from '@auth0/nextjs-auth0'` (NO `/edge`)
- ✅ `export const dynamic = 'force-dynamic'` per routes con Firebase
- ✅ NO `export const runtime = 'edge'` con Firebase
- ✅ Test `npm run build` before commit

### Firebase Operations
**CRITICO**: Firebase Realtime Database **NON accetta valori `undefined`** nelle write operations.

**Helper pattern per undefined**:
```javascript
function filterUndefined(obj) {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (value !== undefined && value !== null) {
      acc[key] = value;
    }
    return acc;
  }, {});
}
```

**Pattern `null` initialization** (IMPORTANTE):
- Usa `null` per campi che saranno popolati successivamente (es. `lastUpdatedAt: null`)
- Evita timestamp/valori default se il dato sarà aggiornato da eventi futuri
- Previene "dati fantasma" in calcoli basati su elapsed time
- Esempio: `lastUpdatedAt` inizia `null`, settato solo al primo evento WORK

Applicare SEMPRE quando: API esterne con campi opzionali, parsing oggetti complessi, form/input utente, campi timestamp event-driven.

### Client Components
```javascript
'use client';  // PRIMA riga, prima degli import
import { useState } from 'react';
```

### Images
- ✅ Always `<Image>` from `next/image` (not `<img>`)
- ✅ Add remote domains to `next.config.mjs` (`images.remotePatterns`)

### Styling Hierarchy
1. **Tailwind Inline** (~95% codice): Preferenza primaria
2. **CSS Modules** (animazioni componente-specifici): File `.module.css` nella stessa directory
3. **globals.css** (SOLO base Tailwind + stili globali): Mantieni minimo (~13 righe)

**Best Practices**:
- Stile UN componente → CSS Module
- Stile PIÙ componenti → Tailwind custom in `tailwind.config.js`
- Stile globale → `globals.css` in `@layer base`

## Testing & Quality Assurance

### 🚨 REGOLA FONDAMENTALE
**OGNI modifica o nuova implementazione DEVE essere accompagnata da unit tests aggiornati o nuovi.**

**Quick Reference**:
- Framework: Jest 30.2 + Testing Library React 16.3
- Coverage Target: 70% (statements, branches, functions, lines)
- Struttura: `lib/__tests__/`, `app/components/ui/__tests__/`, `app/hooks/__tests__/`
- Pattern: AAA (Arrange-Act-Assert), Naming Convention (`describe` > `test`), Mock Strategy

**Comandi**:
```bash
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
npm run test:ci          # CI/CD mode
```

📖 **Documentazione completa**: Vedi `README-TESTING.md` per:
- Setup dettagliato e configurazione Jest
- Pattern di testing e best practices
- Esempi completi (componenti, hooks, context)
- Troubleshooting comune (localStorage, matchMedia, Firebase mocking)
- Template test riutilizzabili

**Workflow consigliato**:
1. Implementa feature/fix
2. Crea/aggiorna test
3. Verifica coverage: `npm run test:coverage`
4. Build production: `npm run build`
5. Commit solo se test passano

**Pattern Date mocking** (per test con timestamp):
```javascript
// ❌ EVITARE: jest.spyOn(global, 'Date') - instabile
// ✅ USARE: jest.useFakeTimers()
jest.useFakeTimers();
jest.setSystemTime(new Date('2025-10-15T12:00:00.000Z'));
// ... test code ...
jest.useRealTimers(); // cleanup
```

## Troubleshooting Comune

### Build Error: Firebase Initialization
```javascript
export const dynamic = 'force-dynamic'; // Force dynamic rendering
```

### Missing 'use client'
```bash
find app -name "*.js" -exec grep -l "useState\|useEffect" {} \; | \
  xargs -I {} sh -c 'if [ "$(head -1 "{}" | grep -c "use client")" -eq 0 ]; then echo "{}"; fi'
```

### Version Enforcement Not Working
1. Check environment: modal disabilitata in localhost/dev (by design)
2. Check Firebase sync: `getLatestVersion()` must return latest
3. Verify polling: StovePanel calls `checkVersion()` ogni 5s
4. Verify semantic comparison: modal SOLO se `compareVersions(local, firebase) < 0`

### Scheduler Not Executing
1. Check mode: `enabled: true`, `semiManual: false`
2. Verify cron calls `/api/scheduler/check?secret=xxx`
3. Verify intervals valid in Firebase

### Changelog Ordering Wrong
Applica sempre `sortVersions()` dopo fetch Firebase. Firebase ordina solo per data, serve ordinamento semantico client-side.

## Quick Reference Commands

```bash
# Development
npm run dev              # Dev server
npm run build            # Production build
npm run lint             # ESLint

# Testing
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report

# Firebase
node -e "require('./lib/changelogService').syncVersionHistoryToFirebase(require('./lib/version').VERSION_HISTORY)"

# Debugging
find app -name "*.js" -exec grep -l "useState" {} \;  # Find client components
```

## Environment Variables

```env
# Firebase (Client SDK)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_DATABASE_URL=
# ... (altri Firebase config)

# Auth0
AUTH0_SECRET=
AUTH0_BASE_URL=http://localhost:3000
AUTH0_CLIENT_ID=
AUTH0_CLIENT_SECRET=

# External APIs (pattern OAuth)
NEXT_PUBLIC_[EXTERNAL_API]_CLIENT_ID=
NEXT_PUBLIC_[EXTERNAL_API]_REDIRECT_URI=http://localhost:3000/api/[external-api]/callback
[EXTERNAL_API]_CLIENT_ID=
[EXTERNAL_API]_CLIENT_SECRET=
[EXTERNAL_API]_REDIRECT_URI=http://localhost:3000/api/[external-api]/callback

# Scheduler
CRON_SECRET=your-secret-here
```

**⚠️ IMPORTANTE OAuth**: `REDIRECT_URI` deve corrispondere a porta/path corretto e essere registrato nella console developer API esterna. HTTPS in production, HTTP solo per localhost.

## Task Priorities

1. 🔴 **NEVER** break existing functionality
2. 🟠 **ALWAYS** update version after changes (version.js + package.json + CHANGELOG.md)
3. 🟡 **PREFER** editing existing files
4. 🟢 **MAINTAIN** coding patterns
5. 🔵 **TEST** `npm run build` before commit
6. ⚡ **ALWAYS** create or update unit tests when modifying or implementing new features

## Critical Decision Matrix

- State management → `useState` (local), Firebase (global)
- Data fetching → `useEffect` + fetch, Firebase listeners
- Styling → Inline Tailwind, components (Card/Button)
- Performance → `React.memo()`, `useMemo()`, `useCallback()`
- Versioning → Minor (features), Patch (fixes), Major (breaking)

---

**Last Updated**: 2025-10-21
**Version**: 1.5.15
**Author**: Federico Manfredi
