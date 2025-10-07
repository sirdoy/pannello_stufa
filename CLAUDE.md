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
│   ├── ui/                   # Card, Button, Select, Skeleton, Footer
│   ├── scheduler/            # TimeBar, DayAccordionItem
│   ├── StovePanel.js         # Controllo principale + polling 5s
│   ├── VersionEnforcer.js    # Hard update modal
│   └── ClientProviders.js    # Wrapper contexts
├── context/
│   └── VersionContext.js     # State globale versioning
├── hooks/
│   └── useVersionCheck.js    # Soft version notification
├── api/
│   ├── stove/                # Proxy Thermorossi (status, ignite, shutdown, setFan, setPower)
│   ├── scheduler/check/      # Cron endpoint
│   ├── netatmo/              # Termostato API
│   ├── log/add/              # User action logging
│   └── auth/[...auth0]/      # Auth0 handler
├── page.js                   # Home (StovePanel)
├── scheduler/page.js         # Pianificazione settimanale
├── log/page.js              # Storico azioni
├── errors/page.js           # Allarmi
└── changelog/page.js        # Versioni

lib/
├── stoveApi.js              # Thermorossi wrapper
├── schedulerService.js      # Scheduler logic + timezone handling
├── firebase.js              # Client SDK (NO Edge runtime)
├── version.js               # APP_VERSION, VERSION_HISTORY
├── changelogService.js      # Version management + Firebase sync
├── errorMonitor.js          # Error detection + notification
└── logService.js            # Pre-configured logging functions
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
Check mode (manual/auto/semi-manual)
  ↓
If auto: fetch schedule + compare time
  ↓
Execute actions (ignite/shutdown/set) con source='scheduler'
  ↓
If scheduled change → clear semi-manual
```

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
- ✅ Inline Tailwind only
- ✅ Glassmorphism: `bg-white/70 backdrop-blur-xl shadow-glass-lg border-white/40`
- ✅ Z-index: dropdown=100, modal=50, blocking-modal=9999+
- ❌ NO custom CSS in `globals.css`

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

**Last Updated**: 2025-10-07
**Version**: 1.4.4
**Author**: Federico Manfredi
