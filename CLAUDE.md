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

- **Next.js 15**: App Router, Server/Client Components, API Routes
- **React 18**: Hooks, Suspense
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
│   ├── scheduler/            # TimeBar, DayAccordionItem
│   ├── StovePanel.js         # Controllo principale + polling 5s
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
│   ├── netatmo/              # Termostato API
│   ├── log/add/              # User action logging
│   └── auth/[...auth0]/      # Auth0 handler
├── page.js                   # Home (StovePanel)
├── scheduler/page.js         # Pianificazione settimanale
├── maintenance/page.js       # Configurazione manutenzione stufa
├── log/page.js              # Storico azioni
├── errors/page.js           # Allarmi
├── changelog/page.js        # Versioni
└── not-found.js             # Pagina 404 (richiesta Next.js 15)

lib/
├── stoveApi.js              # Thermorossi wrapper
├── schedulerService.js      # Scheduler logic + timezone handling
├── maintenanceService.js    # Maintenance tracking + Firebase operations
├── firebase.js              # Client SDK (NO Edge runtime)
├── version.js               # APP_VERSION, VERSION_HISTORY
├── changelogService.js      # Version management + Firebase sync
├── errorMonitor.js          # Error detection + notification
├── logService.js            # Pre-configured logging functions
└── formatUtils.js           # Utility functions (es. formatHoursToHHMM)
```

## Componenti UI Principali

### Card
```jsx
<Card className="p-6">Content</Card>
<Card glass className="p-6">Glassmorphism</Card>  // iOS 18 style
```

### Button
```jsx
<Button variant="primary|secondary|success|danger|accent|outline|ghost|glass"
        size="sm|md|lg" icon="🔥">Accendi</Button>
```

### Banner
```jsx
// Componente riutilizzabile per alert, warnings e messaggi informativi
<Banner
  variant="info|warning|error|success"
  icon="⚠️"
  title="Titolo Banner"
  description="Descrizione messaggio"
  actions={<Button onClick={handleAction}>Azione</Button>}
  dismissible
  onDismiss={() => setShow(false)}
/>

// Con JSX inline per description e actions
<Banner
  variant="warning"
  icon="🧹"
  title="Pulizia Richiesta"
  description={<>Testo con <strong>bold</strong></>}
  actions={
    <>
      <Button variant="success" onClick={confirm}>Conferma</Button>
      <Button variant="outline" onClick={cancel}>Annulla</Button>
    </>
  }
/>
```
- **Props**: `variant`, `icon`, `title`, `description`, `actions`, `dismissible`, `onDismiss`, `children`, `className`
- **Varianti**: `info` (blu), `warning` (arancione), `error` (rosso), `success` (verde)
- **Icone default**: info=ℹ️, warning=⚠️, error=❌, success=✅
- **Layout responsive**: sm breakpoint per mobile/desktop
- **Stile**: Glassmorphism consistente con resto app

### Select
```jsx
<Select value={power} onChange={setPower}
        options={[{value: 1, label: 'P1'}]} disabled={!isOn} />
// Dropdown auto-glassmorphism + z-[100]
```

### Skeleton
```jsx
if (loading) return <Skeleton.StovePanel />;
```

### Navbar
- **Desktop**: Links orizzontali + dropdown utente (nome + logout)
- **Mobile**: Hamburger menu con slide-down
- **User Dropdown Pattern**:
  - State: `const [dropdownOpen, setDropdownOpen] = useState(false)`
  - Ref: `const dropdownRef = useRef(null)` per click outside detection
  - Click outside: `useEffect` con `mousedown` listener + `ref.current.contains(event.target)`
  - Escape key: `useEffect` con `keydown` listener + `e.key === 'Escape'`
  - Route change: chiudi automaticamente dropdown in `useEffect([pathname])`
- **Responsive**: Glassmorphism + z-[100] per dropdown, text truncation con breakpoint (max-w-[80px] md-xl, max-w-[120px] xl+)

## Custom Hooks

### useVersionCheck (Soft Notification)
```javascript
const { hasNewVersion, latestVersion, showWhatsNew, dismissWhatsNew, dismissBadge } = useVersionCheck();
```
- Semantic version comparison
- localStorage tracking
- Badge "NEW" + WhatsNewModal dismissibile

### useVersion (Hard Enforcement)
```javascript
const { needsUpdate, firebaseVersion, checkVersion, isChecking } = useVersion();
```
- Global context state
- On-demand check (chiamato da StovePanel ogni 5s)
- Semantic version comparison (`compareVersions(local, firebase) < 0`)
- Disabilitato in ambiente locale (development, localhost)
- ForceUpdateModal bloccante SOLO se versione locale < Firebase
- Log detection: `🔧 Ambiente locale: versioning enforcement disabilitato`

## API Routes Principali

### Stove Control (`/api/stove/*`)
| Endpoint | Method | Body | Note |
|----------|--------|------|------|
| `/status` | GET | - | Status + errori |
| `/getFan` | GET | - | Fan 1-6 |
| `/getPower` | GET | - | Power 0-5 (UI: 1-5) |
| `/ignite` | POST | `{source: 'manual'\|'scheduler'}` | Semi-manual SOLO se source='manual' |
| `/shutdown` | POST | `{source: 'manual'\|'scheduler'}` | Semi-manual SOLO se source='manual' |
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
    ├── errorCode, errorDescription
    ├── severity: INFO|WARNING|ERROR|CRITICAL
    ├── timestamp, resolved

changelog/
└── {version}/               # "1_1_0" (dots → underscores)
    ├── version, date, type
    ├── changes[]
    └── timestamp
```

**Export Pattern**: `export { db, db as database };` (NO Edge runtime)

## Modalità Operative

### Manual 🔧
- Scheduler disabilitato
- Controllo manuale completo

### Automatic ⏰
- Scheduler abilitato
- UI mostra prossimo cambio: "🔥 Accensione alle 18:30 del 04/10 (P4, V3)"

### Semi-Manual ⚙️
- Override temporaneo
- Trigger: Azione manuale homepage mentre in auto
  - ✅ Ignite/Shutdown manuali → attiva sempre
  - ✅ SetPower/SetFan manuali → attiva solo se stufa ON
  - ❌ Comandi da cron (source='scheduler') → NON attiva
- Calcola `returnToAutoAt` = prossimo cambio scheduler
- UI: "Ritorno auto: 18:30 del 04/10" + pulsante "↩️ Torna in Automatico"

## Sistema Manutenzione Stufa 🔧

### Overview
Sistema autonomo H24 per tracking ore utilizzo e gestione pulizia periodica.

**Caratteristiche principali**:
- ✅ Tracking automatico server-side (cron ogni minuto)
- ✅ Funziona anche app chiusa (calcolo tempo reale da Firebase)
- ✅ Blocco automatico accensione quando pulizia richiesta
- ✅ Configurazione flessibile ore target (default 50h)
- ✅ Barra progresso visiva con colori dinamici
- ✅ Auto-recovery se cron salta chiamate

### Funzioni maintenanceService.js

```javascript
// Recupera dati manutenzione (con init default se non esiste)
getMaintenanceData()

// Aggiorna ore target configurazione
updateTargetHours(hours)

// CRITICO: Tracking automatico chiamato da cron (NON client-side!)
// Calcola elapsed time da lastUpdatedAt e aggiorna currentHours
trackUsageHours(stoveStatus)

// Reset contatore dopo pulizia + log Firebase
confirmCleaning(user)

// Verifica se accensione consentita (blocco se needsCleaning)
canIgnite()

// Status completo: percentage, remainingHours, isNearLimit
getMaintenanceStatus()
```

### Configurazione (/maintenance page)

**UI Elements**:
- Card "Stato Attuale" con 3 metriche: Ore Utilizzo / Ore Target / Ore Rimanenti
- Input numerico custom (range 1-1000h)
- Preselezioni rapide: 25 / 50 / 75 / 100 / 150 / 200 ore
- Default: 50h
- Info ultima pulizia se disponibile

**Validazione**:
- Min: 1h, Max: 1000h
- Controllo threshold dopo update: se currentHours >= targetHours → needsCleaning=true

### UI Components

**MaintenanceBar** (sempre visibile in home):
```jsx
<MaintenanceBar maintenanceStatus={status} />
```
- Barra progresso lineare orizzontale
- Colori dinamici:
  - 0-59%: verde (`bg-success-600`)
  - 60-79%: giallo (`bg-yellow-500`)
  - 80-99%: arancione (`bg-orange-500`)
  - 100%+: rosso (`bg-danger-600`)
- Animazione shimmer quando ≥80% (warning visivo)
- Link cliccabile a `/maintenance`
- Info: "47.5h / 50h" + "2.5h rimanenti" + "95%"

**Banner Pulizia** (quando needsCleaning=true):
- Card arancione bloccante sopra StovePanel
- Icona 🧹 + messaggio chiaro
- Pulsante "✓ Ho Pulito la Stufa" → conferma pulizia
- Pulsante "⚙️ Vai alle Impostazioni" → link /maintenance
- Disabilita tutti i controlli stufa fino a conferma

### Blocco Accensione

**API Routes modificate**:
```javascript
// /api/stove/ignite
const allowed = await canIgnite();
if (!allowed) return Response.json({ error: 'Maintenance required' }, { status: 403 });

// /api/scheduler/check
const allowed = await canIgnite();
if (!allowed) return Response.json({ status: 'MANUTENZIONE_RICHIESTA' });
```

**UI Disabilitata**:
- Pulsante "🔥 Accendi" → `disabled={needsMaintenance}`
- Pulsante "❄️ Spegni" → `disabled={needsMaintenance}`
- Select Ventola → `disabled={needsMaintenance}`
- Select Potenza → `disabled={needsMaintenance}`

### Tracking Server-Side (CRITICO!)

**Perché Server-Side**:
- ❌ Client-side polling (vecchia implementazione): tracking SOLO se app aperta
- ✅ Server-side cron: tracking H24, anche app chiusa

**Implementazione**:
```javascript
// /api/scheduler/check (chiamato ogni minuto da cron esterno)
const statusRes = await fetch(`${baseUrl}/api/stove/status`);
const currentStatus = statusJson?.StatusDescription || 'unknown';

// Track usage automaticamente
const track = await trackUsageHours(currentStatus);
if (track.tracked) {
  console.log(`✅ Maintenance tracked: +${track.elapsedMinutes}min → ${track.newCurrentHours}h`);
}
```

**Logica trackUsageHours()**:
1. Check status WORK → se no, skip
2. Fetch lastUpdatedAt da Firebase
3. Calcola `elapsed = now - lastUpdatedAt` (minuti)
4. Se elapsed < 0.5min → skip (troppo presto)
5. Converti elapsed in ore: `hoursToAdd = elapsed / 60`
6. Update Firebase: `currentHours += hoursToAdd`, `lastUpdatedAt = now`
7. Se `currentHours >= targetHours` → `needsCleaning = true`

**Auto-Recovery**:
Se cron salta 10 chiamate (10 minuti), la successiva chiamata recupera tutti i 10 minuti automaticamente calcolando elapsed time corretto.

### Log e Monitoring

**Pulizia Confermata**:
```javascript
await logUserAction('Pulizia stufa', '47.50h', {
  previousHours: 47.5,
  targetHours: 50,
  cleanedAt: '2025-10-08T...',
  source: 'manual'
});
```

**Console Logs**:
- `✅ Maintenance tracked: +1.2min → 47.5h total` (ogni minuto se WORK)
- `⚠️ Maintenance threshold reached: 50.02h / 50h` (quando supera)

### Best Practices

1. **Configurazione iniziale**: Imposta targetHours adeguato al tipo di pellet (20-100h tipico)
2. **Monitoring**: Controlla barra progresso in home regolarmente
3. **Warning 80%**: Animazione shimmer indica pulizia imminente
4. **Reset pulizia**: SEMPRE confermare dopo aver pulito fisicamente la stufa
5. **Log storico**: Verificare in `/log` frequenza pulizie per ottimizzare targetHours

### Troubleshooting

**Contatore non avanza**:
1. Verifica cron attivo: `/api/scheduler/check` chiamato ogni minuto
2. Check status stufa: deve essere "WORK" per tracking
3. Verifica Firebase: `lastUpdatedAt` deve aggiornarsi ogni minuto
4. Console logs: cerca `✅ Maintenance tracked`

**Blocco accensione errato**:
1. Check Firebase: `needsCleaning` deve essere `false`
2. Verifica `currentHours < targetHours`
3. Se bloccato erroneamente: reset manuale Firebase o re-conferma pulizia

**Tracking impreciso**:
- Normal: precisione ±1 minuto (dipende da frequenza cron)
- Se cron salta chiamate: auto-recovery recupera tempo perso
- Per massima accuratezza: cron job stabile ogni 60 secondi

## Sistema Monitoring Cronjob 🔍

### Overview
Sistema autonomo per monitoraggio affidabilità cronjob scheduler.

**Caratteristiche principali**:
- ✅ Salvataggio timestamp Firebase ad ogni chiamata cron
- ✅ Monitoring realtime client-side su Firebase listener
- ✅ Alert automatico se cron inattivo >5 minuti
- ✅ Link diretto a console cron per riavvio immediato
- ✅ Auto-hide quando cron riprende a funzionare

### Implementazione Server-Side

**Endpoint `/api/scheduler/check`**:
```javascript
// SEMPRE all'inizio dell'esecuzione (dopo auth check)
const cronHealthTimestamp = new Date().toISOString();
await set(ref(db, 'cronHealth/lastCall'), cronHealthTimestamp);
console.log(`✅ Cron health updated: ${cronHealthTimestamp}`);
```

**Firebase Schema**:
```
cronHealth/
└── lastCall  # ISO string UTC, es: "2025-10-09T17:26:00.000Z"
```

### Implementazione Client-Side

**Componente CronHealthBanner**:
```jsx
import { ref, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';
import Banner from './ui/Banner';

// Firebase listener realtime
useEffect(() => {
  const cronHealthRef = ref(db, 'cronHealth/lastCall');
  const unsubscribe = onValue(cronHealthRef, (snapshot) => {
    if (snapshot.exists()) {
      setLastCallTime(snapshot.val());
    }
  });
  return () => unsubscribe();
}, []);

// Check health ogni 30s
useEffect(() => {
  const checkCronHealth = () => {
    const diffMinutes = Math.floor((now - lastCallDate) / 1000 / 60);
    setShowBanner(diffMinutes > 5);  // Threshold 5 minuti
  };
  const interval = setInterval(checkCronHealth, 30000);
  return () => clearInterval(interval);
}, [lastCallTime]);
```

**Integrazione UI**:
- Banner posizionato in cima a StovePanel (sopra MaintenanceBar)
- Variant "warning" con icona ⚠️
- Mostra minuti trascorsi dall'ultima chiamata
- Link esterno: `https://console.cron-job.org/jobs/6061667`
- Condizionale: `if (!showBanner) return null`

### Troubleshooting

**Banner non scompare dopo riavvio cron**:
1. Verifica Firebase: `cronHealth/lastCall` deve aggiornarsi
2. Check console: cerca log `✅ Cron health updated`
3. Attendi 30s: client-side check ha intervallo 30s
4. Force refresh pagina se necessario

**Banner appare anche con cron attivo**:
1. Verifica timezone: timestamp deve essere UTC (ISO string)
2. Check calcolo diff: `(now - lastCallDate) / 1000 / 60`
3. Threshold: attualmente 5 minuti, modificabile in CronHealthBanner.js

**Firebase listener non funziona**:
1. Verifica Firebase config in `.env.local`
2. Check Firebase rules: read access su `cronHealth/`
3. Console DevTools: cerca errori Firebase SDK

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
Verify CRON_SECRET (return 401 if invalid)
  ↓
Save timestamp to Firebase: cronHealth/lastCall = now (ISO UTC)
  ↓
Check maintenance status (canIgnite)
  ↓
If needsCleaning → skip + return MANUTENZIONE_RICHIESTA
  ↓
Check mode (manual/auto/semi-manual)
  ↓
If auto: fetch schedule + compare time
  ↓
Execute actions (ignite/shutdown/set) con source='scheduler'
  ↓
If scheduled change → clear semi-manual
  ↓
Track usage hours: trackUsageHours(currentStatus)
  ↓
Log: "✅ Cron health updated: {timestamp}"
```

**Cron Health Monitoring**:
- Timestamp salvato SEMPRE ad ogni chiamata (anche se scheduler disabilitato)
- Usato da `CronHealthBanner` per rilevare cron inattivo >5min
- Client-side check ogni 30s su Firebase `cronHealth/lastCall`
- Banner warning automatico in home con link diretto riavvio cron

### Maintenance Tracking Flow (Autonomo H24)
```
Cron ogni minuto → /api/scheduler/check
  ↓
Fetch stove status (WORK/OFF/etc)
  ↓
trackUsageHours(status)
  ↓
If status !== WORK → return (no tracking)
  ↓
Calculate elapsed = now - lastUpdatedAt (Firebase)
  ↓
If elapsed < 0.5min → return (too soon)
  ↓
Add elapsed time to currentHours
  ↓
Update Firebase: currentHours, lastUpdatedAt
  ↓
If currentHours >= targetHours → set needsCleaning=true
  ↓
Log: "✅ Maintenance tracked: +1.2min → 47.5h total"
```

**CRITICO**: Tracking è **server-side via cron**, non client-side!
- ✅ Funziona H24, anche se nessuno ha app aperta
- ✅ Auto-recovery: se cron salta, prossima esecuzione recupera minuti persi
- ✅ Accuratezza 100%: calcolo basato su timestamp Firebase, non su polling client
- ❌ NO più tracking in StovePanel (era inaffidabile, solo quando app aperta)

### Version Enforcement Flow
```
App mount → VersionProvider initializes
  ↓
StovePanel polling → checkVersion() ogni 5s
  ↓
Check isLocalEnvironment() → Se true, early return (no modal)
  ↓
Firebase fetch latest version
  ↓
Semantic comparison: compareVersions(local, firebase)
  ↓
If local < firebase → needsUpdate = true
  ↓
VersionEnforcer → ForceUpdateModal (blocking, z-10000)
  ↓
User clicks "Aggiorna Ora" → window.location.reload()
```
**Vantaggi**:
- 12x più veloce (5s vs 60s)
- Zero overhead, single Firebase read
- No interruzioni in dev (localhost detection)
- Modal SOLO se update realmente necessario (semantic comparison)

## Versioning Workflow (CRITICO)

### 1. Semantic Versioning
- **MAJOR** (x.0.0): Breaking changes
- **MINOR** (0.x.0): New features
- **PATCH** (0.0.x): Bug fixes

### 2. Update Files
```javascript
// lib/version.js
export const APP_VERSION = '1.4.1';
export const LAST_UPDATE = '2025-10-07';
export const VERSION_HISTORY = [
  { version: '1.4.1', date: '2025-10-07', type: 'patch', changes: [...] }
];

// package.json
{ "version": "1.4.1" }

// CHANGELOG.md
## [1.4.1] - 2025-10-07
### Changed
- ...
```

### 3. Deployment + Sync Firebase
```bash
npm run build
# Deploy app (vercel/firebase/etc)
node -e "require('./lib/changelogService').syncVersionHistoryToFirebase(require('./lib/version').VERSION_HISTORY)"
```

**⚠️ OBBLIGATORIO**: Sync Firebase entro 5s dal deploy, altrimenti utenti vedono ForceUpdateModal anche con versione corretta.

### 4. Soft vs Hard Updates
- **Soft**: Badge "NEW" + modal dismissibile (minor/patch)
- **Hard**: ForceUpdateModal bloccante (major/critical fixes)

### 5. Version Enforcement Technical Details

**Funzioni Helper** (`app/context/VersionContext.js`):

```javascript
// Confronto semantico versioni
compareVersions(v1, v2)
// Returns: -1 se v1 < v2, 0 se v1 === v2, 1 se v1 > v2
// Esempio: compareVersions('1.4.2', '1.5.0') => -1

// Detection ambiente locale
isLocalEnvironment()
// Returns: true se NODE_ENV=development || hostname in [localhost, 127.0.0.1, 192.168.*]
```

**Comportamento**:
- **Production**: Modal bloccante se `compareVersions(APP_VERSION, firebaseVersion) < 0`
- **Development**: Modal sempre disabilitata, log `🔧 Ambiente locale: versioning enforcement disabilitato`
- **Edge Case**: Se versione locale > Firebase (es. test nuova release), modal NON appare

**Perché Semantic Comparison**:
- Evita modal per versioni uguali (1.4.3 === 1.4.3)
- Evita modal per downgrade intenzionale Firebase (1.5.0 local vs 1.4.9 Firebase)
- Attiva modal SOLO quando utente ha versione obsoleta (1.4.2 local vs 1.5.0 Firebase)

### 6. Changelog Page Implementation

**Pagina**: `app/changelog/page.js`

**Data Source Priority**:
1. **Firebase** (primary): `getChangelogFromFirebase()` da `changelogService.js`
2. **Local fallback**: `VERSION_HISTORY` da `lib/version.js`
3. **Indicatore fonte**: UI mostra "Firebase Realtime" o "Locale"

**Ordinamento Semantico**:
```javascript
// CRITICO: Firebase ordina solo per data, serve ordinamento semantico client-side
const sortVersions = (versions) => {
  return [...versions].sort((a, b) => {
    const [aMajor, aMinor, aPatch] = a.version.split('.').map(Number);
    const [bMajor, bMinor, bPatch] = b.version.split('.').map(Number);

    if (bMajor !== aMajor) return bMajor - aMajor;  // Confronta MAJOR
    if (bMinor !== aMinor) return bMinor - aMinor;  // Confronta MINOR
    return bPatch - aPatch;                          // Confronta PATCH
  });
};
```

**Perché Necessario**:
- `changelogService.getChangelogFromFirebase()` ordina solo per data (Date object)
- Quando più versioni hanno stessa data (es. 1.4.4, 1.4.3, 1.4.2 tutte 2025-10-07), ordine può essere errato
- Ordinamento semantico garantisce sempre ordine corretto: 1.4.4 > 1.4.3 > 1.4.2 > 1.4.1

**Pattern di Utilizzo**:
```javascript
const firebaseChangelog = await getChangelogFromFirebase();
const sorted = sortVersions(firebaseChangelog);  // SEMPRE ordina semanticamente
setChangelog(sorted);
```

**Badge "LATEST"**: Applicato al primo elemento dell'array ordinato (index === 0)

**Colori per Tipo**:
- `major`: 🚀 rosso/primary (breaking changes)
- `minor`: ✨ verde/success (nuove features)
- `patch`: 🔧 blu/info (bug fix)

## Pattern Comuni Riutilizzabili

### Dropdown/Modal Pattern
```javascript
// 1. State + Ref
const [isOpen, setIsOpen] = useState(false);
const dropdownRef = useRef(null);

// 2. Click Outside
useEffect(() => {
  const handleClickOutside = (event) => {
    if (isOpen && dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsOpen(false);
    }
  };
  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, [isOpen]);

// 3. Escape Key
useEffect(() => {
  const handleEscape = (e) => {
    if (e.key === 'Escape' && isOpen) setIsOpen(false);
  };
  document.addEventListener('keydown', handleEscape);
  return () => document.removeEventListener('keydown', handleEscape);
}, [isOpen]);

// 4. Route Change (se necessario)
const pathname = usePathname();
useEffect(() => {
  setIsOpen(false);
}, [pathname]);
```

### Confirmation Modal Pattern
```jsx
// Struttura visuale modal bloccante con backdrop
{showModal && (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10000] p-4">
    <Card glass className="max-w-md w-full p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Titolo Modal</h2>
      <p className="text-gray-700 mb-6">Messaggio di conferma</p>

      {/* Warning box opzionale */}
      <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">⚠️ Attenzione:</p>
        <ul className="text-sm text-yellow-700 space-y-1 ml-4">
          <li>• Effetto 1</li>
          <li>• Effetto 2</li>
        </ul>
      </div>

      {/* Pulsanti azione */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={handleCancel} disabled={isLoading} className="flex-1">
          ✕ Annulla
        </Button>
        <Button variant="danger" onClick={handleConfirm} disabled={isLoading} className="flex-1">
          {isLoading ? '⏳ Attendere...' : '✓ Conferma'}
        </Button>
      </div>
    </Card>
  </div>
)}
```

**Caratteristiche**:
- **Backdrop**: `fixed inset-0 bg-black/50 backdrop-blur-sm` per overlay scuro con blur
- **Z-index**: `z-[10000]` per modal bloccante (più alto di dropdown z-[100] e modal z-50)
- **Centering**: `flex items-center justify-center` con padding responsive `p-4`
- **Glassmorphism**: Card con prop `glass` per effetto vetro smerigliato
- **Responsive**: `max-w-md w-full` per larghezza limitata su desktop, full-width su mobile
- **Loading state**: pulsanti disabilitati durante operazione async
- **Escape key**: gestito con pattern base (vedi Dropdown/Modal Pattern)

### Responsive Breakpoints Strategy
- **Mobile**: < 768px (`md:hidden`)
- **Tablet/Intermediate**: 768px-1024px (`md:flex`)
- **Desktop Small**: 1024px-1280px (`lg:`)
- **Desktop Large**: > 1280px (`xl:`)

**Best Practice Viewport Intermedi**:
- Usa text truncation con max-width responsive: `max-w-[80px] xl:max-w-[120px]`
- Riduci padding/gap nei viewport intermedi: `gap-1.5 lg:gap-2`
- Dropdown/collapse elementi non critici: info utente, badge, secondary actions
- Priorità: logo > navigation links > user menu

## Design System

### Palette Colori Semantici
**Tutti i colori hanno scala completa 50-900** (10 tonalità ciascuno):
- **primary** (rosso fuoco): `primary-50` → `primary-900` - Azioni primarie, errori critici
- **danger** (alias primary): Stesso colore di primary, per compatibilità nomenclatura componenti
- **accent** (arancione): `accent-50` → `accent-900` - Accenti, highlight, warning secondari
- **success** (verde): `success-50` → `success-900` - Successo, status positivi, conferme
- **warning** (giallo-arancio): `warning-50` → `warning-900` - Attenzioni, alert, avvisi
- **info** (blu): `info-50` → `info-900` - Informazioni, note, messaggi informativi
- **neutral** (grigio): `neutral-50` → `neutral-900` - Testi, bordi, background

### Nomenclatura Colori
**Regola fondamentale**: Usare SOLO `neutral-*`, MAI `gray-*`
```jsx
// ✅ CORRETTO
className="text-neutral-800 bg-neutral-50 border-neutral-200"

// ❌ ERRATO
className="text-gray-800 bg-gray-50 border-gray-200"
```

### Card Styling Standards
**Pattern standardizzati**:
```jsx
// Standard card (default)
<Card className="p-6">Content</Card>

// Hero card (sezioni principali)
<Card className="p-8">Hero Content</Card>

// Header card con glassmorphism
<Card glass className="p-6 border-2 border-primary-200">Header</Card>

// Info card colorata
<Card className="p-6 bg-info-50 border-2 border-info-200">Info</Card>
<Card className="p-6 bg-warning-50 border-2 border-warning-200">Warning</Card>
<Card className="p-6 bg-success-50 border-2 border-success-200">Success</Card>
```

**Regole**:
- `p-6`: Default per tutte le card normali
- `p-8`: Solo per hero sections (es. StovePanel main)
- `glass`: Header importanti + modal overlay
- Info card: `bg-{color}-50 border-2 border-{color}-200`

### Background Consistenza
**Usare SEMPRE background globale** definito in `globals.css`:
```css
body {
  @apply bg-gradient-to-br from-neutral-50 via-neutral-100 to-neutral-200;
}
```

❌ **MAI override custom** nelle singole pagine:
```jsx
// ❌ ERRATO - Override custom
<div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-orange-100">

// ✅ CORRETTO - Usa background globale
<div className="max-w-2xl mx-auto py-8 px-4">
```

## Code Quality Best Practices

### API Routes
- ✅ `import { handleAuth } from '@auth0/nextjs-auth0'` (NO `/edge`)
- ✅ `export const dynamic = 'force-dynamic'` per routes con Firebase
- ✅ NO `export const runtime = 'edge'` con Firebase
- ✅ Test `npm run build` before commit

### Client Components
```javascript
'use client';  // PRIMA riga, prima degli import
import { useState } from 'react';
```

### Images
- ✅ Always `<Image>` from `next/image` (not `<img>`)
- ✅ Add remote domains to `next.config.mjs` (`images.remotePatterns`)

### Styling

**Hierarchy CSS (in ordine di preferenza)**:
1. ✅ **Tailwind Inline** (caso principale, ~95% del codice)
   - `className="bg-white/70 backdrop-blur-xl p-4 rounded-2xl"`
   - Glassmorphism: `bg-white/70 backdrop-blur-xl shadow-glass-lg border-white/40`
   - Z-index: dropdown=100, modal=50, blocking-modal=9999+

2. ✅ **CSS Modules** (per animazioni e stili complessi componente-specifici)
   - File: `Component.module.css` nella stessa directory del componente
   - Import: `import styles from './Component.module.css'`
   - Usage: `className={styles.shimmer}` o `${styles.shimmer}`
   - **Quando usare**: Keyframe animations, hover complessi, stili che richiedono CSS puro
   - **Esempio**: `MaintenanceBar.module.css` contiene animazione shimmer
   ```css
   /* MaintenanceBar.module.css */
   @keyframes shimmer {
     0% { transform: translateX(-100%); }
     100% { transform: translateX(100%); }
   }
   .shimmer {
     animation: shimmer 2s infinite;
   }
   ```
   ```jsx
   // MaintenanceBar.js
   import styles from './MaintenanceBar.module.css';
   <div className={`...tailwind-classes ${styles.shimmer}`} />
   ```

3. ✅ **globals.css** (SOLO per base Tailwind + stili veramente globali)
   - Tailwind directives: `@tailwind base/components/utilities`
   - Stili base html/body in `@layer base`
   - ❌ NO animazioni componente-specifici
   - ❌ NO stili che possono essere in CSS Modules
   - Mantieni file minimo (~13 righe è ideale)

**Best Practices**:
- Se uno stile è usato da UN solo componente → CSS Module
- Se uno stile è usato da PIÙ componenti → Tailwind classe custom in `tailwind.config.js`
- Se uno stile è veramente globale (html/body) → `globals.css` in `@layer base`
- Preferisci sempre Tailwind quando possibile (utility-first)
- Code splitting automatico: CSS Modules caricati solo quando componente renderizzato

## Troubleshooting Comune

### Build Error: Firebase Initialization
```javascript
// ✅ CORRECT - Force dynamic rendering
export const dynamic = 'force-dynamic';
import { syncVersionHistoryToFirebase } from '@/lib/changelogService';
```

### Missing 'use client'
```bash
find app -name "*.js" -exec grep -l "useState\|useEffect" {} \; | \
  xargs -I {} sh -c 'if [ "$(head -1 "{}" | grep -c "use client")" -eq 0 ]; then echo "{}"; fi'
```

### Version Enforcement Not Working
1. **Check environment**: In localhost/dev, modal è disabilitata (by design). Verifica `isLocalEnvironment()` = false in production
2. **Check Firebase sync**: `getLatestVersion()` should return latest version
3. **Verify polling**: StovePanel calls `checkVersion()` ogni 5s
4. **Verify semantic comparison**: Modal appare SOLO se `compareVersions(APP_VERSION, firebaseVersion) < 0`
   - 1.4.2 < 1.5.0 → modal ✅
   - 1.5.0 >= 1.4.9 → NO modal ❌
5. **Console logs**: Cerca `🔧 Ambiente locale` o `⚠️ Update richiesto`
6. **Clear cache + reload**

### Scheduler Not Executing
1. Check mode: `enabled: true`, `semiManual: false`
2. Verify cron calls `/api/scheduler/check?secret=xxx`
3. Check `/api/stove/*` not blocked by middleware
4. Verify intervals valid in Firebase

### Changelog Ordering Wrong
1. **Check sortVersions()**: Deve essere chiamata su dati Firebase in `app/changelog/page.js`
2. **Problema**: `changelogService.getChangelogFromFirebase()` ordina solo per data
3. **Soluzione**: Applica sempre `sortVersions()` dopo fetch Firebase
4. **Test**: Verifica 1.4.4 > 1.4.3 > 1.4.2 quando stessa data
5. **Fallback**: `VERSION_HISTORY` locale è già ordinato correttamente

## Quick Reference Commands

```bash
# Development
npm run dev              # Dev server
npm run build            # Production build
npm run lint             # ESLint

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

# Netatmo
NEXT_PUBLIC_NETATMO_CLIENT_ID=
NETATMO_CLIENT_SECRET=

# Scheduler
CRON_SECRET=your-secret-here
```

## Task Priorities

1. 🔴 **NEVER** break existing functionality
2. 🟠 **ALWAYS** update version after changes (version.js + package.json + CHANGELOG.md)
3. 🟡 **PREFER** editing existing files
4. 🟢 **MAINTAIN** coding patterns
5. 🔵 **TEST** `npm run build` before commit

## Critical Decision Matrix

- State management → `useState` (local), Firebase (global)
- Data fetching → `useEffect` + fetch, Firebase listeners
- Styling → Inline Tailwind, components (Card/Button)
- Performance → `React.memo()`, `useMemo()`, `useCallback()`
- Versioning → Minor (features), Patch (fixes), Major (breaking)

---

**Last Updated**: 2025-10-10
**Version**: 1.5.0
**Author**: Federico Manfredi
