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
│   ├── ui/                    # Componenti UI atomici
│   │   ├── Card.js
│   │   ├── Button.js
│   │   ├── Input.js
│   │   ├── Select.js
│   │   ├── StatusBadge.js
│   │   ├── ModeIndicator.js
│   │   ├── Skeleton.js
│   │   ├── ErrorAlert.js
│   │   ├── Footer.js
│   │   └── index.js           # Export centralizzato
│   ├── scheduler/             # Componenti pianificazione
│   │   ├── TimeBar.js
│   │   ├── ScheduleInterval.js
│   │   ├── DayScheduleCard.js
│   │   └── DayAccordionItem.js
│   └── log/
│       └── LogEntry.js
├── page.js                    # Home - controllo stufa
├── scheduler/page.js          # Pianificazione settimanale
├── log/page.js               # Storico azioni utente
├── errors/page.js            # Storico allarmi
├── offline/page.js           # Fallback offline PWA
└── api/
    ├── stove/*               # Proxy Thermorossi API
    ├── scheduler/check/      # Cron endpoint
    ├── auth/[...auth0]/      # Auth0 routes
    ├── netatmo/*             # Netatmo integration
    ├── log/add/              # Logging utente
    └── user/                 # User info

lib/
├── stoveApi.js               # Thermorossi API wrapper
├── routes.js                 # Route definitions centralizzate
├── firebase.js               # Firebase client SDK
├── schedulerService.js       # Firebase scheduler operations
├── logService.js             # Logging service
├── errorMonitor.js           # Error detection & notification
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

**Skeleton** - Loading placeholders
- Pre-built: `Skeleton.StovePanel`, `Skeleton.Scheduler`, `Skeleton.LogPage`
- Animazione `animate-shimmer`
- Pattern: mostra solo durante fetch iniziale, non updates successivi

**Footer** - Info autore e versione
- Version da `lib/version.js`
- Auto-incluso in tutte le pagine via `app/layout.js`

**Import centralizzato**:
```javascript
import { Card, Button, Select, StatusBadge, Skeleton, ErrorAlert, Footer } from '@/app/components/ui';
```

### Pagine

**`/` (Home)** - StovePanel
- Layout: Error Alert → Hero (status) → Grid 2 col (Actions + Regolazioni) → Netatmo footer
- Real-time polling: 5 secondi
- Monitora errori e invia notifiche browser
- Loading: `Skeleton.StovePanel`
- Responsive: max-w-7xl, grid adapts mobile/desktop

**`/scheduler`** - Pianificazione settimanale
- Accordion UI (giorni collassabili con preview)
- TimeBar interattiva 24h
- Toggle Manual/Automatic mode
- Semi-manual status con returnToAutoAt
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

**`/offline`** - PWA offline fallback
- Messaggio friendly
- Auto-reload quando connessione ripristinata

### API Routes (`app/api/`)

**Stove Control (`/api/stove/*`)** - Proxy Thermorossi API
- `GET status` - Status + errori (GetStatus)
- `GET getFan` - Fan level 1-6 (GetFanLevel)
- `GET getPower` - Power level 0-5 (GetPower) - UI mostra solo 1-5
- `GET getRoomTemperature` - Setpoint temperatura (GetRoomControlTemperature)
- `POST ignite` - Accensione (Ignit) - trigger semi-manual se scheduler attivo
- `POST shutdown` - Spegnimento (Shutdown) - trigger semi-manual se scheduler attivo
- `POST setFan` - Imposta ventola (SetFanLevel/[apikey];[level])
- `POST setPower` - Imposta potenza (SetPower/[apikey];[level])

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

**8 Endpoints integrati**:
1. `GetStatus/[apikey]` → `STUFA_API.getStatus`
2. `GetFanLevel/[apikey]` → `STUFA_API.getFan`
3. `GetPower/[apikey]` → `STUFA_API.getPower`
4. `GetRoomControlTemperature/[apikey]` → `STUFA_API.getRoomTemperature`
5. `SetFanLevel/[apikey];[level]` → `STUFA_API.setFan(level)`
6. `SetPower/[apikey];[level]` → `STUFA_API.setPower(level)`
7. `Ignit/[apikey]` → `STUFA_API.ignite`
8. `Shutdown/[apikey]` → `STUFA_API.shutdown`

**Note**: API key hardcoded in `lib/stoveApi.js:18` (considerare env var per production)

### Firebase Realtime Database (`lib/firebase.js`)

**Export**: `export { db, db as database }` (compatibilità con errorMonitor.js)

**Struttura dati**:
```
stoveScheduler/
  {day}/               # Array intervalli: {start, end, power:1-5, fan:1-6}
  mode/                # {enabled, timestamp, semiManual, returnToAutoAt}

log/                   # {action, value, timestamp, user:{email,name,picture,sub}, source}

errors/                # {errorCode, errorDescription, severity, timestamp, resolved, resolvedAt, status}
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
- `logSchedulerAction.toggleMode(enabled)`, `.updateSchedule(day)`, `.addInterval(day)`, `.removeInterval(day, index)`, `.clearSemiManual()`
- `logNetatmoAction.connect()`, `.disconnect()`, `.selectDevice(id)`

**Auto-include**: Auth0 user info (email, name, picture, sub)

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
- **Semi-Manual** ⚙️ - Override manuale temporaneo con returnToAutoAt (warning color)

### Cron Integration

- External cron → `/api/scheduler/check?secret=cazzo` ogni minuto
- Logic: verifica mode → fetch status → compara orari → esegue comandi → clear semi-manual quando scheduled change

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

### Loading States
- ✅ Use component-specific skeletons
- ✅ Show skeleton during initial fetch only
- ✅ Pattern: `loading` state, `if (loading) return <Skeleton.X />`, `finally { setLoading(false) }`

### UI/UX
- Mobile-first, Tailwind spacing scale, emoji icons, color semantics
- Smooth transitions (`transition-all duration-200`)
- Card-based layout, proper contrast, semantic HTML

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

### Runtime Compatibility
- Firebase Client SDK: Node.js only (no Edge)
- Auth0: Node.js for consistency
- API Routes with Firebase: Never Edge runtime

---

## Quick Reference

### Key Files
- API endpoints: `lib/stoveApi.js`, `lib/routes.js`, `app/api/stove/*`
- UI components: `app/components/ui/*`
- Error handling: `lib/errorMonitor.js`
- Logging: `lib/logService.js`
- Scheduler: `lib/schedulerService.js`, `app/api/scheduler/check/route.js`
- Version: `lib/version.js` (APP_VERSION, LAST_UPDATE, VERSION_HISTORY)
- Styling: `tailwind.config.js`, inline Tailwind in components
- Config: `next.config.mjs`, `.env.local`, `CLAUDE.md`

### Common Tasks
- **Add error code**: Update `ERROR_CODES` in `lib/errorMonitor.js`
- **Add UI component**: Create in `app/components/ui/`, export in `index.js`, inline Tailwind
- **Modify scheduler**: Edit `app/api/scheduler/check/route.js`
- **Change polling**: Modify `setInterval` in `StovePanel.js` (default 5000ms)
- **Update version**: Edit `lib/version.js` (VERSION, LAST_UPDATE, VERSION_HISTORY)
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
2. Fetch: status, fan, power, temperature, scheduler mode
3. If `Error !== 0`: log Firebase, show ErrorAlert, send notification
4. Poll every 5s
5. Manual actions: API call + log + semi-manual mode

### Scheduler Automation
1. User configures → save Firebase
2. Cron calls `/api/scheduler/check?secret=cazzo` every minute
3. Check mode → fetch status → compare time → execute commands → clear semi-manual

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
