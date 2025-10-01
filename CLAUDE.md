# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 PWA application called "Pannello Stufa" (Stove Panel) that provides remote control functionality for a Thermorossi stove through their cloud API. The app integrates with Auth0 for authentication, Firebase Realtime Database for logging, and Netatmo API for temperature monitoring.

## Development Commands

- `npm run dev` - Start development server on http://localhost:3000 (PWA disabled in dev mode)
- `npm run build` - Build for production (generates service worker and PWA assets)
- `npm run start` - Start production server (PWA enabled)
- `npm run lint` - Run ESLint

**PWA Testing**:
- PWA features (service worker, offline mode, install prompt) are **disabled in development**
- To test PWA: run `npm run build` then `npm run start`
- Service worker is generated in `public/sw.js` during production build
- Clear service worker cache: DevTools → Application → Service Workers → Unregister

## Architecture

### Core Components
- **StovePanel** (`app/components/StovePanel.js`) - Main control interface with dashboard layout
  - **Layout**: Modern dashboard with hero section (status card), 2-column grid (actions + settings), and Netatmo footer
  - **Hero Section**: Full-width status card with state badge, mode indicator, and refresh button
  - **Quick Actions Card**: Large buttons (h-24) for ignite/shutdown with visual feedback (✓ in funzione / ○ spenta)
  - **Regolazioni Card**: Fan and power controls with live display showing current levels (X/6, X/5)
  - **Netatmo Section**: Bottom card with dashed border indicating "work in progress", shows temperature if available
  - Uses: Card, Button, Select, StatusBadge, ModeIndicator, Skeleton
  - Implements loading state with `initialLoading` flag
  - Shows `Skeleton.StovePanel` until all initial data (status, fan, power, scheduler mode) is fetched
  - Responsive: Full dashboard on desktop (max-w-7xl), stacked on mobile
  - Real-time status polling every 5 seconds
- **Navbar** (`app/components/Navbar.js`) - Navigation with Auth0 integration, glassmorphism design with backdrop blur

### Reusable UI Components (`app/components/ui/`)
Modular component system for consistent UI across the application:

- **Card** (`Card.js`) - Base container component
  - Props: `children`, `className`, `...props`
  - Implementation: Uses pure Tailwind classes (`bg-white rounded-2xl shadow-soft border border-neutral-200/50 backdrop-blur-sm`)
  - Usage: `<Card className="p-6">content</Card>`

- **Button** (`Button.js`) - Standardized button with variants
  - Props: `variant` (primary|secondary|success|danger|accent|outline|ghost), `size` (sm|md|lg), `icon`, `disabled`, `loading`
  - Usage: `<Button variant="success" icon="🔥" onClick={handleClick}>Accendi</Button>`

- **Input** (`Input.js`) - Text input with label and icon support
  - Props: `type`, `label`, `icon`, `className`, `containerClassName`
  - Implementation: Uses pure Tailwind classes for styling (focus ring, border, rounded corners)
  - Usage: `<Input type="time" label="⏰ Dalle" value={start} onChange={handleChange} />`

- **Select** (`Select.js`) - Custom dropdown select with modern UI
  - **Implementation**: Custom dropdown (not native `<select>`) with React state management
  - Props: `label`, `icon`, `options` (array of `{value, label, disabled?}`), `value`, `onChange`, `disabled`, `className`, `containerClassName`
  - **Features**:
    - Custom dropdown menu with smooth animations using `animate-dropdown` from Tailwind config (fade in + slide down + scale)
    - Selected option highlighted with red background and left border
    - Checkmark (✓) on selected item
    - Animated chevron that rotates on open/close
    - Click-outside to close functionality
    - Touch-friendly padding for mobile
    - Hover and active states with visual feedback
    - Max-height with scroll for long lists
  - **Design**: No placeholder options (e.g., "-- Seleziona --"), only actual values
  - Usage: `<Select label="💨 Ventola" options={fanOptions} value={level} onChange={handleChange} />`

- **StatusBadge** (`StatusBadge.js`) - Status display with dynamic colors and icons
  - Props: `status`, `icon`, `size` (sm|md|lg)
  - Automatically determines color and icon based on status keywords (WORK, OFF, ERROR, etc.)
  - Usage: `<StatusBadge status="WORK" />`

- **ModeIndicator** (`ModeIndicator.js`) - Scheduler mode indicator
  - Props: `enabled`, `semiManual`, `returnToAutoAt`, `onConfigClick`, `showConfigButton`, `compact`
  - Displays current mode (Manual/Automatic/Semi-manual) with icon and colors
  - Optional configure button and return time display
  - Usage: `<ModeIndicator enabled={schedulerEnabled} semiManual={semiManualMode} returnToAutoAt={returnToAutoAt} onConfigClick={() => router.push('/scheduler')} />`

- **Pagination** (`Pagination.js`) - Page navigation controls
  - Props: `currentPage`, `totalPages`, `onPrevious`, `onNext`, `hasPrev`, `hasNext`
  - Usage: `<Pagination currentPage={0} totalPages={10} onPrevious={handlePrev} onNext={handleNext} hasPrev={true} hasNext={true} />`

- **Skeleton** (`Skeleton.js`) - Loading placeholder component with shimmer animation
  - Props: `className` (for generic skeleton), `children` (for Skeleton.Card)
  - Pre-built specialized loaders:
    - `Skeleton.StovePanel` - Full skeleton for StovePanel component (home page)
    - `Skeleton.Scheduler` - Full skeleton for Scheduler page
    - `Skeleton.LogPage` - Full skeleton for Log page
    - `Skeleton.Card` - Card wrapper for custom skeleton content
    - `Skeleton.LogEntry` - Single log entry skeleton
  - Design: Gradient shimmer animation following app's neutral color palette
  - Implementation: Uses `animate-shimmer` from Tailwind config (keyframes defined in tailwind.config.js)
  - Usage:
    ```javascript
    // Generic skeleton
    <Skeleton className="h-8 w-32" />

    // Page-specific skeleton (shown during data fetch)
    if (loading) return <Skeleton.StovePanel />;

    // Custom card skeleton
    <Skeleton.Card>
      <Skeleton className="h-6 w-1/2 mb-4" />
      <Skeleton className="h-4 w-full" />
    </Skeleton.Card>
    ```

### Scheduler Components (`app/components/scheduler/`)
Specialized components for weekly schedule management:

- **TimeBar** (`TimeBar.js`) - 24-hour visual timeline with interactive features
  - Props: `intervals`, `hoveredIndex`, `selectedIndex`, `onHover`, `onClick`
  - Shows colored bars for scheduled intervals with hover/selection states
  - Displays time labels and reference hours
  - **Interactive tooltip**: Shows interval details (time range, power, fan) on hover
  - **Visual feedback**: Hovered/selected intervals scale up and change color
  - **Click to select**: Click on interval bar to toggle persistent selection
  - Usage: `<TimeBar intervals={schedule[day]} hoveredIndex={0} selectedIndex={1} onHover={setHover} onClick={handleClick} />`

- **ScheduleInterval** (`ScheduleInterval.js`) - Single time interval editor
  - Props: `range`, `onRemove`, `onChange`, `isHighlighted`, `onMouseEnter`, `onMouseLeave`, `onClick`
  - Editable time inputs (start/end), power (1-5) and fan (1-6) selects, remove button
  - **Validation on blur**: Time inputs validate only when user leaves the field
  - **Highlighted state**: Visual emphasis when hovered or selected (pink background, border, ring, scale)
  - **Bidirectional sync**: Syncs with TimeBar for hover/selection states
  - Usage: `<ScheduleInterval range={interval} isHighlighted={true} onRemove={handleRemove} onChange={handleChange} />`

- **DayScheduleCard** (`DayScheduleCard.js`) - Complete day schedule card with state management
  - Props: `day`, `intervals`, `onAddInterval`, `onRemoveInterval`, `onChangeInterval`
  - Manages hover and selection state for synchronization between TimeBar and ScheduleInterval cards
  - Combines TimeBar, list of ScheduleIntervals, and add button
  - **State tracking**: `hoveredIndex` and `selectedIndex` for interactive highlighting
  - Usage: `<DayScheduleCard day="Lunedì" intervals={schedule['Lunedì']} onAddInterval={addInterval} onRemoveInterval={removeInterval} onChangeInterval={changeInterval} />`

- **DayAccordionItem** (`DayAccordionItem.js`) - Collapsible day schedule card with preview
  - Props: `day`, `intervals`, `isExpanded`, `onToggle`, `onAddInterval`, `onRemoveInterval`, `onChangeInterval`
  - **Accordion UI**: Clickable header to expand/collapse day content
  - **Compact preview**: When collapsed, shows time range coverage and total hours
  - **Smart preview**: Displays "08:00 - 22:00 • 3 intervalli • 6.5h totali" in collapsed state
  - **Empty state**: Shows friendly message when no intervals configured
  - **Smooth animations**: 300ms transition for expand/collapse with opacity fade
  - Includes all DayScheduleCard features (TimeBar, intervals, hover/selection)
  - Usage: `<DayAccordionItem day="Lunedì" intervals={schedule['Lunedì']} isExpanded={true} onToggle={toggleDay} ... />`

### Log Components (`app/components/log/`)
Components for user action log display:

- **LogEntry** (`LogEntry.js`) - Single log entry display
  - Props: `entry`, `formatDate`, `getIcon`
  - Shows user avatar, name, timestamp, action, and optional metadata
  - **IMPORTANT**: Uses Next.js `<Image>` component (not `<img>`) for avatars
  - Imports: `import Image from 'next/image'`
  - Image props: `src`, `alt`, `width={24}`, `height={24}`, `className`
  - Remote images require configuration in `next.config.mjs`
  - Usage: `<LogEntry entry={logEntry} formatDate={formatFn} getIcon={getIconFn} />`

### Component Export Structure
All UI components are exported from `app/components/ui/index.js` for clean imports:
```javascript
import { Card, Button, Select, StatusBadge, ModeIndicator, Pagination, Skeleton, ErrorAlert, ErrorBadge } from '@/app/components/ui';
```

Scheduler components from `app/components/scheduler/index.js`:
```javascript
import { TimeBar, ScheduleInterval, DayScheduleCard, DayAccordionItem } from '@/app/components/scheduler';
```

Log components from `app/components/log/index.js`:
```javascript
import { LogEntry } from '@/app/components/log';
```

### Error Monitoring System (`lib/errorMonitor.js`)
Sistema completo per il monitoraggio e tracking degli errori/allarmi della stufa:

**Funzionalità principali**:
- **Rilevamento errori**: Monitora il campo `Error` e `ErrorDescription` da `GetStatus`
- **Classificazione severità**: INFO, WARNING, ERROR, CRITICAL
- **Logging su Firebase**: Salva tutti gli errori in `errors/` con timestamp e metadata
- **Notifiche browser**: Alert push per errori critici (richiede permesso utente)
- **Storico errori**: Query Firebase per visualizzare errori recenti
- **Risoluzione manuale**: Possibilità di segnare errori come risolti

**Funzioni esportate**:
- `getErrorInfo(errorCode)` - Ottiene informazioni su un codice errore
- `isCriticalError(errorCode)` - Verifica se errore è critico
- `logError(errorCode, errorDescription, additionalData)` - Salva errore su Firebase
- `getRecentErrors(limit)` - Recupera errori recenti (default 50)
- `getActiveErrors()` - Recupera solo errori non risolti
- `resolveError(errorId)` - Segna errore come risolto
- `shouldNotify(errorCode, previousErrorCode)` - Logica notifica
- `sendErrorNotification(errorCode, errorDescription)` - Invia notifica browser

**Costanti**:
- `ERROR_SEVERITY`: Enum per livelli di severità
- `ERROR_CODES`: Dizionario codici errore conosciuti (espandibile)

### UI Components - Error Management (`app/components/ui/ErrorAlert.js`)
Componenti per visualizzazione errori/allarmi:

- **ErrorAlert** - Alert completo per visualizzare errori
  - Props: `errorCode`, `errorDescription`, `className`, `onDismiss`
  - Styling dinamico basato su severità (critical=rosso, error=rosso chiaro, warning=giallo, info=blu)
  - Icone contestuali (🚨 critical, ⚠️ error, ⚡ warning, ℹ️ info)
  - Pulsante dismiss opzionale
  - Usage: `<ErrorAlert errorCode={5} errorDescription="Pellet esaurito" onDismiss={handleDismiss} />`

- **ErrorBadge** - Badge compatto per indicatore errore
  - Props: `errorCode`, `className`
  - Mostra solo se errorCode !== 0
  - Usage: `<ErrorBadge errorCode={5} />`

### Pages
- `/` (`app/page.js`) - Main StovePanel interface for controlling the stove
  - **Dashboard Layout**:
    - **Error Alert** (top): Visualizza errori/allarmi in tempo reale quando presenti
    - Hero: Full-width status card with badge, mode indicator, refresh button
    - Grid: 2 columns on desktop (Quick Actions + Regolazioni), stacked on mobile
    - Footer: Netatmo card (dashed border, "in development" style)
  - **Real-time monitoring**:
    - Polling every 5 seconds for status updates
    - Monitora `Error` e `ErrorDescription` da GetStatus
    - Salva automaticamente errori su Firebase
    - Invia notifiche browser per nuovi errori
  - **Quick Actions**: Large ignite/shutdown buttons with visual status feedback
  - **Regolazioni**:
    - Fan (1-6) and power (1-5) controls with live level display
    - **Temperatura Target**: Visualizza setpoint da `GetRoomControlTemperature`
    - Note: Power level 0 not available in UI (reserved for API-only standby mode)
  - Netatmo temperature display (if available) and connection management in bottom section
  - Scheduler mode indicator with link to scheduler page
  - Force dynamic rendering for real-time data
  - **Loading state**: Shows `Skeleton.StovePanel` during initial data fetch
  - Responsive: max-w-7xl container, grid adapts mobile/desktop
- `/scheduler` (`app/scheduler/page.js`) - Weekly schedule configuration
  - Weekly timeline view (7 days × 24 hours) with interactive TimeBar
  - **Accordion UI**: Collapsible days with preview (time range, intervals count, total hours)
  - **Expand/Collapse controls**: Buttons to expand/collapse all days at once
  - Add/remove time intervals per day
  - Configure power (1-5) and fan (1-6) levels per interval
  - Manual/Automatic mode toggle
  - Semi-manual status display with return time
  - Firebase integration for schedule persistence
  - **Interactive features**:
    - Hover on TimeBar or interval card to see tooltip and highlight both
    - Click to toggle persistent selection
    - Automatic interval sorting by start time
    - Bidirectional linking of adjacent intervals (on blur)
    - Automatic removal of completely overlapped intervals (on blur)
    - Validation: minimum 15-minute interval duration (on blur)
  - **Loading state**: Shows `Skeleton.Scheduler` during initial data fetch
  - **Default state**: All days collapsed on page load for compact view
- `/log` (`app/log/page.js`) - User action logs viewer
  - Real-time display of all user actions from Firebase
  - Shows user information (name/email, avatar)
  - Timestamped entries with action details
  - Icons for different action types (🔥 ignite, ❄️ shutdown, 💨 fan, ⚡ power, ⏰ scheduler, 🌡️ netatmo, 📅 intervals)
  - Pagination (50 entries per page)
  - Reverse chronological order (newest first)
  - **Loading state**: Shows `Skeleton.LogPage` during initial data fetch from Firebase
- `/netatmo/authorized` (`app/netatmo/authorized/page.js`) - Netatmo OAuth success page
  - Confirmation page after Netatmo authorization
  - Shows authorization status
- `/errors` (`app/errors/page.js`) - Storico allarmi e errori stufa
  - Visualizzazione completa storico errori da Firebase
  - **Filtri**: Tutti / Attivi / Risolti
  - **Paginazione**: 20 errori per pagina
  - **Dettagli per ogni errore**:
    - Codice errore e descrizione
    - Data e ora occorrenza
    - Stato stufa al momento dell'errore
    - Status: Attivo o Risolto
    - Durata (per errori risolti)
  - **Azioni**: Pulsante "Segna come Risolto" per errori attivi
  - **Loading state**: Skeleton durante caricamento dati
  - Link rapido alla home page
  - Responsive design con card layout
- `/offline` (`app/offline/page.js`) - PWA offline fallback page
  - Displayed when user is offline and navigates to an uncached page
  - Friendly message with connectivity status
  - Manual retry button to attempt reconnection
  - Automatically reloads when connection restored (via `reloadOnOnline` PWA config)
  - Consistent UI using Card component and app design system

### API Routes Structure
All API routes are in `app/api/` with the following organization:

#### Stove Control (`/api/stove/*`)
Internal API endpoints that wrap Thermorossi Cloud API calls. All routes proxy requests to the external API.

**Status & Information**:
- `GET /api/stove/status` - Get current stove status
  - Returns: `StatusDescription`, operational state (WORK, OFF, START, CLEAN, COOL, etc.)
  - Proxies: `GetStatus/[apikey]`
- `GET /api/stove/getFan` - Get current fan level
  - Returns: `{ Result: number }` (1-6)
  - Proxies: `GetFanLevel/[apikey]`
- `GET /api/stove/getPower` - Get current power level
  - Returns: `{ Result: number }` (0-5)
  - Proxies: `GetPower/[apikey]`
- `GET /api/stove/getRoomTemperature` - Get target room temperature setpoint
  - Returns: Temperature setpoint value
  - Proxies: `GetRoomControlTemperature/[apikey]`
- `GET /api/stove/settings` - Get all stove settings
  - Returns: Complete settings object
  - Proxies: `GetSettings/[apikey]`

**Control Commands**:
- `POST /api/stove/ignite` - Turn on the stove
  - Triggers semi-manual mode if scheduler is active
  - Sets `returnToAutoAt` to next scheduled change
  - Proxies: `Ignit/[apikey]`
- `POST /api/stove/shutdown` - Turn off the stove
  - Triggers semi-manual mode if scheduler is active
  - Sets `returnToAutoAt` to next scheduled change
  - Proxies: `Shutdown/[apikey]`

**Settings**:
- `POST /api/stove/setFan` - Set fan level (1-6)
  - Body: `{ level: number }`
  - Proxies: `SetFanLevel/[apikey];[level]`
- `POST /api/stove/setPower` - Set power level (0-5, but UI only exposes 1-5)
  - Body: `{ level: number }`
  - Proxies: `SetPower/[apikey];[level]`
  - Note: Level 0 is supported by API but not exposed in the UI controls
- `POST /api/stove/setSettings` - Update multiple stove settings
  - Body: `{ fanLevel: number, powerLevel: number }`

#### Authentication (`/api/auth/*`)
- `/api/auth/[...auth0]` - Auth0 dynamic routes for login/logout/callback
  - Handled by `@auth0/nextjs-auth0` package

#### Netatmo Integration (`/api/netatmo/*`)
- `POST /api/netatmo/devices` - Get list of Netatmo devices
  - Body: `{ refresh_token: string }`
  - Returns: Array of devices with modules
- `POST /api/netatmo/temperature` - Get temperature from configured device
  - Uses `refresh_token` from Firebase (`netatmo/refresh_token`)
  - Reads `device_id` and `module_id` from Firebase (`netatmo/deviceConfig`)
  - Calls Netatmo `getthermstate` API
  - Saves temperature to Firebase (`netatmo/temperature`)
- `GET /api/netatmo/callback` - OAuth2 callback handler
  - Query param: `code` (authorization code)
  - Exchanges code for refresh token
  - Saves refresh token to Firebase
  - Redirects to `/netatmo/authorized`
- `GET /api/netatmo/devices-temperatures` - Get all devices with temperatures
  - Returns array of all modules with current temperature readings
  - Format: `{ device_id, module_id, name, temperature }`

#### Scheduler System (`/api/scheduler/*`)
- `GET /api/scheduler/check?secret=<CRON_SECRET>` - Cron endpoint for automatic control
  - Called every minute by external cron job
  - Checks scheduler mode (manual/automatic/semi-manual)
  - Returns `MODALITA_MANUALE` if scheduler disabled
  - Returns `MODALITA_SEMI_MANUALE` if waiting for next scheduled change
  - Compares current time with schedule intervals
  - Executes stove commands (ignite/shutdown/setFan/setPower) as needed
  - Clears semi-manual mode when scheduled change is applied
  - Uses `Europe/Rome` timezone for scheduling

#### Logging (`/api/log/*`)
- `POST /api/log/add` - Add user action log entry to Firebase
  - Body: `{ action: string, value?: any, ...metadata }`
  - Automatically adds:
    - `timestamp`: Current timestamp (Date.now())
    - `user`: Auth0 user object with email, name, picture, sub
    - `source`: Always 'user' for manual actions
  - Only tracks manual user actions (not automated scheduler actions)
  - Saves to `log/` path in Firebase

#### User Management (`/api/user/*`)
- `GET /api/user` - Get current authenticated user info
  - Returns Auth0 session user object
  - Returns `{ user: null }` if not authenticated

### External Integrations

#### Thermorossi Cloud API (`lib/stoveApi.js`)
Complete integration with Thermorossi WiNetStove cloud service for remote stove control.

**Base URL**: `https://wsthermorossi.cloudwinet.it/WiNetStove.svc/json`

**All 8 Thermorossi API Endpoints** (fully integrated and documented):

1. **`GetStatus/[apikey]`** - Get current operational status and errors
   - Mapped to: `STUFA_API.getStatus`
   - Internal route: `GET /api/stove/status`
   - Returns: `{ Error, ErrorDescription, Status, StatusDescription, Success }`
   - Used for: Real-time monitoring, error detection, status display

2. **`GetFanLevel/[apikey]`** - Get current fan level
   - Mapped to: `STUFA_API.getFan`
   - Internal route: `GET /api/stove/getFan`
   - Returns: `{ Result: number }` (1-6)
   - Used for: Displaying current fan setting

3. **`GetPower/[apikey]`** - Get current power level
   - Mapped to: `STUFA_API.getPower`
   - Internal route: `GET /api/stove/getPower`
   - Returns: `{ Result: number }` (0-5)
   - Used for: Displaying current power setting

4. **`GetRoomControlTemperature/[apikey]`** - Get target room temperature setpoint
   - Mapped to: `STUFA_API.getRoomTemperature`
   - Internal route: `GET /api/stove/getRoomTemperature`
   - Returns: `{ Result: number }` (temperature in °C)
   - Used for: Displaying target temperature in Regolazioni card
   - Note: May return special values (e.g., -18) when temperature control disabled

5. **`SetFanLevel/[apikey];[level]`** - Set fan level (1-6)
   - Mapped to: `STUFA_API.setFan(level)`
   - Internal route: `POST /api/stove/setFan`
   - Used for: Manual fan control, automatic scheduler adjustments

6. **`SetPower/[apikey];[level]`** - Set power level (0-5)
   - Mapped to: `STUFA_API.setPower(level)`
   - Internal route: `POST /api/stove/setPower`
   - Used for: Manual power control, automatic scheduler adjustments
   - Note: API supports level 0 (standby mode) but UI controls only expose levels 1-5

7. **`Ignit/[apikey]`** - Turn on the stove
   - Mapped to: `STUFA_API.ignite`
   - Internal route: `POST /api/stove/ignite`
   - Used for: Manual ignition, automatic scheduler ignition
   - Side effect: Triggers semi-manual mode if scheduler is active

8. **`Shutdown/[apikey]`** - Turn off the stove
   - Mapped to: `STUFA_API.shutdown`
   - Internal route: `POST /api/stove/shutdown`
   - Used for: Manual shutdown, automatic scheduler shutdown
   - Side effect: Triggers semi-manual mode if scheduler is active

**Usage Examples**:
```javascript
import { STUFA_API } from '@/lib/stoveApi';

// Get status with error information
const statusRes = await fetch(STUFA_API.getStatus);
const { Error, ErrorDescription, StatusDescription } = await statusRes.json();

// Get current settings
const fanRes = await fetch(STUFA_API.getFan);
const { Result: fanLevel } = await fanRes.json();

// Get temperature target
const tempRes = await fetch(STUFA_API.getRoomTemperature);
const { Result: targetTemp } = await tempRes.json();

// Set fan level
await fetch(STUFA_API.setFan(4));

// Turn on stove
await fetch(STUFA_API.ignite);
```

**Internal Routes**: All 8 endpoints are wrapped by internal Next.js API routes in `/api/stove/*` for:
- Auth0 middleware bypass (required for scheduler cron)
- Consistent error handling
- Logging and monitoring
- Response normalization

**Security Note**: API key is currently hardcoded in `lib/stoveApi.js:18`. Consider moving to environment variables for production.

#### Other Integrations
- **Firebase Realtime Database** (`lib/firebase.js`) - Used for logging stove operations and scheduler data storage
  - **IMPORTANT**: Exports both `db` and `database` for compatibility: `export { db, db as database }`
  - `db` used in most components, `database` used in `lib/errorMonitor.js`
  - Client SDK only (no Admin SDK), works with Node.js runtime (not Edge)
- **Auth0** - User authentication and session management with middleware protection
  - **Node.js Runtime**: All Auth0 routes use standard `@auth0/nextjs-auth0` (NOT `/edge` version)
  - Import: `import { handleAuth, getSession } from '@auth0/nextjs-auth0'`
  - Edge runtime incompatible with Firebase client SDK
- **Netatmo API** - Temperature monitoring from smart thermostats

### Logging System
- **Log Service** (`lib/logService.js`) - Centralized logging service for user actions
  - `logUserAction(action, value?, metadata?)` - Generic logging function
  - `logStoveAction` - Pre-configured functions for stove operations:
    - `ignite()`, `shutdown()`, `setFan(level)`, `setPower(level)`
  - `logSchedulerAction` - Pre-configured functions for scheduler operations:
    - `toggleMode(enabled)`, `updateSchedule(day)`, `addInterval(day)`, `removeInterval(day, index)`, `clearSemiManual()`
  - `logNetatmoAction` - Pre-configured functions for Netatmo operations:
    - `connect()`, `disconnect()`, `selectDevice(deviceId)`
  - All logs automatically include Auth0 user information (email, name, picture, sub)
  - Only tracks manual user actions, not automated scheduler actions
  - Usage: `import { logStoveAction } from '@/lib/logService'`

### Route Management System
- **Route Configuration** (`lib/routes.js`) - Centralized API route definitions
  - All API routes are defined in a single source of truth
  - Prevents hardcoded URLs throughout the codebase
  - Makes route changes easier to manage and maintain

  **Exported Constants:**
  - `STOVE_ROUTES`: All stove control endpoints
    - `status`, `ignite`, `shutdown`, `getFan`, `getPower`, `getRoomTemperature`, `setFan`, `setPower`, `getSettings`, `setSettings`
  - `SCHEDULER_ROUTES`: Scheduler system endpoints
    - `check(secret)` - Function that returns cron endpoint with secret parameter
  - `NETATMO_ROUTES`: Netatmo integration endpoints
    - `devices`, `temperature`, `callback`, `devicesTemperatures`
  - `LOG_ROUTES`: Logging endpoints
    - `add`
  - `USER_ROUTES`: User management endpoints
    - `me`
  - `AUTH_ROUTES`: Authentication endpoints
    - `login`, `logout`, `callback`, `me`
  - `API_ROUTES`: Combined export of all route groups

  **Usage Examples:**
  ```javascript
  // Frontend component
  import { STOVE_ROUTES, LOG_ROUTES } from '@/lib/routes';

  await fetch(STOVE_ROUTES.status);
  await fetch(STOVE_ROUTES.ignite, { method: 'POST' });
  await fetch(LOG_ROUTES.add, { method: 'POST', body: JSON.stringify(data) });
  ```

  ```javascript
  // Backend endpoint
  import { STOVE_ROUTES } from '@/lib/routes';

  const response = await fetch(`${baseUrl}${STOVE_ROUTES.status}`);
  ```

### Firebase Structure
- `stoveScheduler/{day}` - Weekly schedule data (Lunedì, Martedì, Mercoledì, Giovedì, Venerdì, Sabato, Domenica)
  - Each day contains array of time ranges with: `start`, `end`, `power` (1-5), `fan` (1-6)
  - Intervals are automatically sorted by start time before saving
  - Note: Power level 0 not available in scheduler or manual UI (would keep stove in standby)
- `stoveScheduler/mode` - Scheduler mode state object:
  - `enabled`: boolean (manual/automatic toggle)
  - `timestamp`: when mode was last changed
  - `semiManual`: boolean (temporary manual override)
  - `returnToAutoAt`: ISO timestamp for automatic return to scheduled mode
- `log/` - User action logs with full traceability:
  - `action`: Description of the action performed
  - `value`: Optional value associated with action (e.g., fan level)
  - `timestamp`: Unix timestamp (Date.now())
  - `user`: Auth0 user object:
    - `email`: User email address
    - `name`: User display name
    - `picture`: User avatar URL
    - `sub`: Auth0 user ID
  - `source`: Always 'user' for manual actions
  - Additional metadata fields (e.g., `day` for scheduler actions)
- `errors/` - Error and alarm logs for stove monitoring:
  - `errorCode`: Numeric error code from GetStatus API
  - `errorDescription`: Error description from GetStatus API
  - `severity`: ERROR_SEVERITY enum (info, warning, error, critical)
  - `timestamp`: Unix timestamp when error occurred (Date.now())
  - `resolved`: Boolean flag indicating if error has been resolved
  - `resolvedAt`: Unix timestamp when error was marked as resolved (if applicable)
  - `status`: Stove status at time of error (e.g., "WORK", "START")
  - `source`: Source of error detection (e.g., "status_monitor")
  - Additional metadata fields as needed
- Firebase uses client SDK for all operations (no Admin SDK currently)

### Key Configuration
- **Tailwind CSS** for styling with custom design system
- App Router architecture (Next.js 15)
- Force dynamic rendering on main page for real-time data
- **Next.js Config** (`next.config.mjs`):
  - `outputFileTracingRoot: resolve(__dirname)` - Prevents workspace root warnings
  - `images.remotePatterns` - Allows Auth0 avatar images from:
    - `**.gravatar.com` (Gravatar avatars)
    - `**.googleusercontent.com` (Google profile pictures)
    - `s.gravatar.com` (Secure Gravatar)
  - Uses ES modules syntax with `import` statements
  - PWA configuration wrapped with `withPWA(nextConfig)`

### PWA Configuration
Complete Progressive Web App implementation with offline support and native-like experience:

**`public/manifest.json`** - PWA manifest with full metadata:
- **App info**: Name, short name, description in Italian
- **Display**: Standalone mode (fullscreen app experience)
- **Theme**: `#ef4444` (primary red) matching app design
- **Icons**: 8 sizes (72, 96, 128, 144, 152, 192, 384, 512px) for all platforms
  - `purpose: "any maskable"` for 192x192 and 512x512 (adaptive icons)
  - Covers Android, iOS, Windows, Chrome requirements
  - **Original sources**: `icon-192.png` and `icon-512.png` (manually created)
  - **Generated sizes**: 72, 96, 128, 144, 152, 384px (auto-generated from icon-512.png using ImageMagick)
  - **To regenerate**: Use ImageMagick `magick` command to resize icon-512.png to needed dimensions
  - **Favicon**: `app/favicon.png` is a copy of `public/icons/icon-192.png`
- **Shortcuts**: Quick actions accessible from home screen (long-press app icon on iOS/Android):
  - 🔥 "Accendi stufa" → `/?action=ignite` - Direct ignition action
  - ⏰ "Pianificazione" → `/scheduler` - Open scheduler configuration
  - 🚨 "Allarmi" → `/errors` - View error history
  - **IMPORTANT**: Shortcuts are **static only** - defined in manifest.json at build time
  - **Cannot display dynamic data** (e.g., current stove status, temperature)
  - **Cannot be updated** in real-time or based on API responses
  - Limit: 4-5 shortcuts recommended (iOS/Android constraint)
  - To modify: edit `public/manifest.json` shortcuts array and rebuild
- **Categories**: utilities, lifestyle

**`next.config.mjs`** - PWA plugin configuration:
- Enabled only in production (`disable: process.env.NODE_ENV === 'development'`)
- `reloadOnOnline: true` - Auto-reload when connection restored
- Offline fallback to `/offline` page
- **Workbox caching strategies**:
  - **Stove API** (`wsthermorossi.cloudwinet.it`): NetworkFirst with 10s timeout, 60s cache
  - **Images**: CacheFirst, 7-day expiration, 100 entries max
  - **Static resources** (JS/CSS): StaleWhileRevalidate, 24h cache

**`app/layout.js`** - PWA metadata and iOS support:
- Next.js metadata API integration for PWA tags
- Apple Web App support: capable, status bar style, custom title
- Multiple icon sizes for iOS home screen
- Viewport optimized for mobile (max-scale=5, user-scalable)
- Format detection disabled for phone numbers

**`app/offline/page.js`** - Offline fallback page:
- Friendly message when no connection available
- Automatic reconnection detection
- Manual retry button
- Consistent UI with app design (Card component)

**Service Worker**: Auto-generated in `public/` by next-pwa during build
- Registration: Automatic on page load
- Skip waiting: Immediate activation of new versions
- Background sync: Queues failed requests for retry
- Push notifications: Ready for Firebase Cloud Messaging integration

### PWA Limitations and Alternatives

**Static Shortcuts Limitation**:
- PWA shortcuts in `manifest.json` are **static only** - cannot display real-time data
- No API exists to update shortcut text/labels dynamically
- iOS and Android read shortcuts once at installation time
- **Cannot show**: current stove status, temperature, power level, or any live data in shortcut menu

**Alternatives for Dynamic Information**:

1. **App Badge** (icon notification badge):
   - Can show numeric count (e.g., number of active errors)
   - Limited iOS support, requires notification permissions
   - Only numbers, no text or status labels
   - Implementation: Badging API (experimental)

2. **Push Notifications**:
   - Periodic status updates sent as notifications
   - Already implemented for errors via `lib/errorMonitor.js`
   - Could be extended to send status changes (e.g., "Stufa accesa", "Stufa spenta")
   - User must grant notification permission

3. **Fast App Launch**:
   - Current approach: App loads in <1 second, shows real-time status immediately
   - Polling every 5 seconds ensures fresh data on home page
   - Most reliable solution for real-time monitoring

4. **Native App Widgets** (requires native development):
   - iOS/Android home screen widgets with live data
   - Requires building native apps (Swift/Kotlin), not web PWA
   - Out of scope for current web-based architecture

**Recommendation**: For users wanting quick status checks, the best approach is opening the app (instant load via PWA) rather than attempting to show dynamic data in shortcuts.

### Design System (Tailwind)
Modern, minimal design with warm color palette reflecting the stove's purpose:
- **Primary** (red #ef4444): Fire/heat theme, used for critical actions and error states
- **Accent** (orange #f97316): Warmth emphasis, used for manual mode and secondary highlights
- **Neutral** (grays): Text, backgrounds, and borders
- **Success** (green #10b981): Positive states, stove working, automatic mode
- **Warning** (yellow #f59e0b): Semi-manual mode, standby states
- **Info** (blue #3b82f6): Information and links

**CSS Architecture**: The application uses **pure Tailwind CSS** with no custom CSS classes for components.

**`app/globals.css`** - Minimal global styles only:
```css
@layer base {
  html { @apply antialiased; }
  body { @apply bg-gradient-to-br from-neutral-50 via-neutral-100 to-neutral-200; }
}
```

**`tailwind.config.js`** - Custom animations and design tokens:
- **Animations**:
  - `animate-shimmer`: Gradient shimmer for skeleton loaders (1.5s ease-in-out infinite)
  - `animate-dropdown`: Smooth dropdown menu animation (fade + slide + scale, 0.15s ease-out)
- **Custom shadows**: `shadow-soft`, `shadow-card`
- **Custom border radius**: `rounded-xl` (1rem), `rounded-2xl` (1.5rem), `rounded-3xl` (2rem)

**Component Styling Approach**:
- All components use inline Tailwind classes (no `.card`, `.btn-primary`, etc.)
- Reusable components (Card, Button, Input, Select) encapsulate common Tailwind patterns
- Consistent spacing with Tailwind scale (gap-2, gap-4, p-6, p-8, etc.)
- Mobile-first responsive approach throughout
- All interactive elements have `transition-all duration-200` for smooth animations

### Environment Variables Required
- Firebase config variables (`NEXT_PUBLIC_FIREBASE_*`)
- Auth0 configuration (`AUTH0_*`)
- Netatmo API credentials (`NEXT_PUBLIC_NETATMO_*`, `NETATMO_*`)
- `CRON_SECRET=cazzo` - Secret for scheduler cron endpoint authentication

## Important Notes

### Security & Configuration
- The stove API key is hardcoded in `lib/stoveApi.js:18` - consider moving to environment variables for production
- All Thermorossi API endpoints use semicolon (`;`) as parameter separator (e.g., `SetFanLevel/[apikey];[level]`)
- **Route system**: All API routes are centralized in `lib/routes.js` for consistency
  - Frontend components import routes from this file
  - Backend endpoints also use the same route definitions
  - Makes route changes easier to manage and prevents hardcoded URLs

### Real-time Monitoring & Error Detection
- **Polling interval**: Main StovePanel polls API every 5 seconds for status updates
- **Error detection**: The `GetStatus` endpoint returns:
  - `Error`: Numeric error code (0 = no error)
  - `ErrorDescription`: Human-readable error message
  - `Status`: Numeric status code
  - `StatusDescription`: Human-readable status (WORK, OFF, START, CLEAN, COOL, etc.)
- **Error logging**: All non-zero errors are automatically logged to Firebase `errors/` path
- **Browser notifications**: New errors trigger browser push notifications (requires user permission)
- **Error codes**: The `ERROR_CODES` dictionary in `lib/errorMonitor.js` can be expanded as new error codes are discovered
- **Critical errors**: Errors marked as CRITICAL severity will show `requireInteraction: true` in notifications

### Application Behavior
- **PWA Features**:
  - Service worker auto-generated in `public/` during build (disabled in development)
  - Install prompt on supported browsers (Chrome, Edge, Safari iOS 16.4+)
  - Offline fallback to `/offline` page when no connection
  - Home screen shortcuts for quick actions (ignite, scheduler, errors) - **static only, no dynamic data**
  - Full-screen standalone mode on mobile
  - Smart caching: Stove API (1min), images (7 days), static files (24h)
  - Favicon: Uses PWA icon (`app/favicon.png` from `public/icons/icon-192.png`)
- **Language**: Italian interface ("it" locale) - All UI text and labels in Italian
- **Development server**: Typically runs on port 3000, but may use alternatives (3002, 3003) if occupied
- **Navigation** links in Navbar:
  - **Home** (`/`) - Stove control panel
  - **Pianificazione** (`/scheduler`) - Weekly schedule configuration
  - **Storico** (`/log`) - User action logs
  - **Allarmi** (`/errors`) - Error/alarm history

### Temperature Monitoring
- **Room Temperature Target**: Retrieved from `GetRoomControlTemperature` endpoint
  - Returns `Result` field with temperature setpoint value
  - Displayed in StovePanel "Regolazioni" card
  - Note: Some stoves may return special values (e.g., -18) when temperature control is disabled
- **Netatmo Integration**: Separate system for ambient temperature monitoring (work in progress)

## Component Architecture Philosophy

### Component Strategy
The application follows a **balanced component approach**:
- **Atomic UI components** (`app/components/ui/`) for basic elements (Card, Button, Input, Select, etc.)
- **Composite domain components** (`app/components/scheduler/`, `app/components/log/`) for feature-specific functionality
- **Presentation-focused**: Components handle UI and user interaction, business logic stays in parent components
- **Prop-based communication**: All data and callbacks passed via props, no internal state for data fetching

### When to Create New Components
✅ **DO create components for:**
- Repeated UI patterns across multiple pages
- Complex UI sections that benefit from encapsulation
- Elements that need variant support (buttons, badges, etc.)
- Standalone features that can be tested independently

❌ **DON'T create components for:**
- One-off UI sections used in a single place
- Trivial wrappers that don't add value
- Over-abstracting simple HTML structures

### Component Best Practices
- **Props over configuration**: Pass behavior via props, not internal config
- **Composition over inheritance**: Combine small components to build complex ones
- **Single responsibility**: Each component should do one thing well
- **Predictable props**: Use consistent naming (e.g., `onClick`, `onChange`, `className`)
- **Forward ...props**: Allow parent to override any HTML attributes
- **TypeScript-ready**: Structure components for easy future TypeScript migration

## UI/UX Guidelines

When modifying components, maintain these design principles:
- **Mobile-first**: Always design for mobile screens first, then scale up
- **Consistent spacing**: Use Tailwind spacing scale (gap-2, gap-4, p-6, p-8, etc.)
- **Icon usage**: Emoji icons throughout for visual clarity and simplicity
- **Color semantics**: Follow the design system colors for consistent meaning
- **Smooth transitions**: All interactive elements should have `transition-all duration-200`
- **Card-based layout**: Main content areas use the `<Card>` component (encapsulates Tailwind styles: `bg-white rounded-2xl shadow-soft border border-neutral-200/50 backdrop-blur-sm`)
- **Active states**: Buttons should have hover, active, and disabled states clearly defined
- **Accessibility**: Maintain proper contrast ratios and semantic HTML
- **Reusable components**: Always use existing UI components from `app/components/ui/` instead of duplicating styles
- **Visual hierarchy**: Use size and spacing to create clear information hierarchy
  - Hero sections: Large text (text-3xl), prominent icons (text-6xl), ample padding (p-8)
  - Action buttons: Increased height for touch targets (h-24 for primary actions)
  - Status feedback: Immediate visual confirmation below actions (✓/○ indicators)
  - Live data display: Large numbers with labels (text-2xl for values, text-sm for labels)
- **Dashboard layouts**: Use responsive grids (lg:grid-cols-2, lg:grid-cols-3) with mobile stacking
- **Development states**: Mark incomplete features with dashed borders and "In fase di sviluppo" labels
- **Loading states**: All pages/components that fetch external data should implement skeleton loading states
  - Use component-specific skeletons (`Skeleton.StovePanel`, `Skeleton.Scheduler`, `Skeleton.LogPage`)
  - Loading states should occupy the exact space of the final content
  - Only show skeleton during initial data fetch, not on subsequent updates
  - Pattern: Add `loading` state, show skeleton if `loading === true`, set to `false` in `finally` block

## Scheduler System

### Manual/Automatic Mode
- **Manual Mode** 🔧: User controls stove directly via StovePanel interface (accent color)
- **Automatic Mode** ⏰: Cron job controls stove based on weekly schedule (success color)
- **Semi-Manual Mode** ⚙️: Temporary manual override with automatic return scheduled (warning color)
- Mode toggle available in `/scheduler` page with visual indication
- Current mode displayed on home page with corresponding icon and color coding
- `semiManualMode` state with `returnToAutoAt` timestamp for automatic return

### Cron Integration
- External cron calls `/api/scheduler/check?secret=cazzo` every minute
- Route checks scheduler mode before executing any stove actions
- If mode disabled, returns "MODALITA_MANUALE" status
- Automatic ignition/shutdown and fan/power level adjustments when enabled

### Components
- `lib/schedulerService.js` - Firebase operations for schedule and mode management
  - `saveSchedule(day, schedule)` - Save day's schedule to Firebase
  - `getWeeklySchedule()` - Fetch all 7 days of schedule
  - `setSchedulerMode(enabled)` - Toggle automatic/manual mode
  - `getFullSchedulerMode()` - Get complete mode state including semi-manual
  - `setSemiManualMode(returnToAutoAt)` - Enable semi-manual with return time
  - `clearSemiManualMode()` - Exit semi-manual mode
  - `getNextScheduledChange()` - Calculate next scheduled time change
- `app/scheduler/page.js` - Weekly schedule configuration interface
  - Visual timeline bar showing 24-hour schedule per day
  - Add/remove time intervals with power and fan settings
  - Mode toggle between manual/automatic
  - Shows semi-manual status and return time if active
- `app/components/StovePanel.js` - Home interface with mode indication
  - Real-time status display with dynamic colors
  - Manual control buttons (ignite/shutdown)
  - Fan level (1-6) and power level (1-5) controls with custom Select dropdowns
  - Netatmo connection management
  - Mode indicator with link to scheduler
- `app/api/scheduler/check/route.js` - Cron endpoint for automatic control
  - Called every minute by external cron
  - Checks current time against schedule
  - Executes stove commands based on schedule
  - Respects manual mode (returns "MODALITA_MANUALE")

### Scheduler Validation Logic
The scheduler implements smart validation and synchronization rules:

#### Interval Sorting
- All intervals are automatically sorted by start time (ascending)
- Sorting occurs at: data load from Firebase, after adding new interval, and on blur of time fields
- During typing (onChange), no sorting to preserve input focus and avoid index shifts

#### Time Validation (on blur only)
- **Minimum duration**: End time must be > start time by at least 15 minutes
- **Auto-increment**: If end ≤ start, end is automatically set to start + 15 minutes
- Validation triggers only when user leaves the time field (onBlur), not during typing

#### Adjacent Interval Linking (bidirectional, on blur only)
When modifying time boundaries:
- **Start time change**: If previous interval's end was equal to old start → previous end updates to new start
- **End time change**: If next interval's start was equal to old end → next start updates to new end
- **Gap creation allowed**: If you create a time gap between intervals, it stays (no automatic closing)
- **Example**: Intervals 08:00-12:00 and 12:00-16:00
  - Change first end to 13:00 → second becomes 13:00-16:00
  - Change first end to 11:00 → second stays 12:00-16:00 (gap: 11:00-12:00)

#### Overlap Detection and Removal (on blur only)
- When an interval is extended to completely contain another interval, the contained one is automatically removed
- **Example**: Intervals 08:00-12:00, 14:00-16:00, 18:00-20:00
  - Extend first to 08:00-19:00 → middle interval (14:00-16:00) is deleted
  - Last interval stays because only partially overlapped

#### Power and Fan Levels
- **Power**: Levels 1-5 only in UI (Level 0 exists in API but removed from all UI controls - scheduler and manual)
- **Fan**: Levels 1-6
- Changes to power/fan trigger save on blur but don't affect time-based validations
- Note: Level 0 would keep stove in standby mode, not useful for scheduled operation or manual control

#### onChange vs onBlur Behavior
- **onChange** (during typing):
  - Updates local state only
  - No validation
  - No sorting
  - No linking with adjacent intervals
  - No Firebase save
  - Visual feedback only

- **onBlur** (when leaving field):
  - Validates end > start (+15min minimum)
  - Links adjacent intervals if applicable
  - Removes completely overlapped intervals
  - Sorts all intervals
  - Saves to Firebase
  - Updates semi-manual returnToAutoAt if in semi-manual mode (for time fields only)

This design ensures smooth typing experience while maintaining data integrity.

## Security & Middleware

- Auth0 middleware (`middleware.js`) protects all routes except:
  - `/api/auth/*` - Authentication endpoints
  - `/api/scheduler/check` - Cron endpoint (protected by CRON_SECRET)
  - `/api/stove/*` - Stove control endpoints (REQUIRED: must be excluded to allow internal API calls from `/api/scheduler/check` without Auth0 session)
  - Static assets (`_next`, `favicon.ico`)
- **Important**: The `/api/scheduler/check` route makes internal fetch calls to `/api/stove/status`, `/api/stove/getFan`, `/api/stove/getPower`, `/api/stove/ignite`, `/api/stove/shutdown`, `/api/stove/setFan`, and `/api/stove/setPower`. These internal calls don't have an Auth0 session, so all `/api/stove/*` routes must be excluded from Auth0 middleware to prevent redirect loops and JSON parsing errors.

## Application Workflow

### Real-time Monitoring Flow
1. **User opens app** → Loads StovePanel component
2. **Initial fetch** → Shows `Skeleton.StovePanel` while loading
3. **Data fetching** → Simultaneous calls to:
   - `/api/stove/status` (status + errors)
   - `/api/stove/getFan` (fan level)
   - `/api/stove/getPower` (power level)
   - `/api/stove/getRoomTemperature` (temperature target)
   - `getFullSchedulerMode()` (scheduler mode)
4. **Error detection** → If `Error !== 0`:
   - Logs error to Firebase (`errors/`)
   - Displays ErrorAlert at top of page
   - Sends browser notification (if new error)
5. **Continuous monitoring** → Polling repeats every 5 seconds
6. **User actions** → Manual controls trigger:
   - API calls to Thermorossi
   - Logging to Firebase (`log/`)
   - Semi-manual mode if scheduler active

### Scheduler Flow
1. **User configures schedule** → `/scheduler` page
2. **Saves to Firebase** → `stoveScheduler/{day}` and `stoveScheduler/mode`
3. **External cron** → Calls `/api/scheduler/check?secret=cazzo` every minute
4. **Scheduler logic**:
   - Checks if mode is automatic
   - Fetches current status and settings
   - Compares current time with schedule
   - Executes commands if needed (ignite, shutdown, setFan, setPower)
   - Clears semi-manual mode when scheduled change occurs
5. **Semi-manual override** → When user manually controls stove:
   - Sets `semiManual: true`
   - Calculates `returnToAutoAt` (next scheduled change)
   - Shows countdown in UI
   - Automatically returns to automatic mode at scheduled time

### Error Management Flow
1. **Error detected** → `GetStatus` returns `Error !== 0`
2. **Logged to Firebase** → Saved in `errors/` with severity classification
3. **Notification sent** → Browser push notification (if critical or new)
4. **Displayed in UI**:
   - ErrorAlert on home page
   - Badge in StatusBadge component
   - Full history in `/errors` page
5. **User resolution** → User can mark error as resolved in `/errors` page
6. **Tracking** → Duration calculated between occurrence and resolution

### Authentication Flow
1. **User visits app** → Auth0 middleware checks session
2. **Not authenticated** → Redirects to `/api/auth/login`
3. **Auth0 flow** → User logs in with Auth0
4. **Callback** → Redirects to `/api/auth/callback`
5. **Session created** → User info stored in session
6. **Navbar displays** → User avatar and name
7. **All actions logged** → User info automatically added to Firebase logs

## Common Issues & Solutions

### Firebase Configuration
- Current Firebase rules may block write access to `stoveScheduler/mode`
- Error: "PERMISSION_DENIED: Permission denied"
- Solution: Update Firebase security rules or implement Firebase Admin SDK for server operations

### Build Errors

#### 1. Firebase Export Issue
**Error**: `'database' is not exported from './firebase'`
**Cause**: `lib/errorMonitor.js` imports `database`, but `lib/firebase.js` only exported `db`
**Solution**: Export both names from `lib/firebase.js`:
```javascript
export { db, db as database };
```

#### 2. Auth0 Edge Runtime Conflict
**Error**: Build failures in `/api/auth/[...auth0]` and `/api/log/add`
**Cause**: Using `@auth0/nextjs-auth0/edge` with Firebase client SDK (incompatible)
**Solution**: Use standard Node.js runtime:
```javascript
// CORRECT
import { handleAuth } from '@auth0/nextjs-auth0';

// WRONG - don't use edge runtime with Firebase
import { handleAuth } from '@auth0/nextjs-auth0/edge';
export const runtime = 'edge'; // ❌ Remove this
```

#### 3. Next.js Image Component Warning
**Error**: ESLint warning about using `<img>` instead of `<Image>`
**Cause**: Direct HTML `<img>` tags for Auth0 avatars in `LogEntry.js`
**Solution**:
```javascript
import Image from 'next/image';

// Use Next.js Image component with explicit dimensions
<Image
  src={entry.user.picture}
  alt={entry.user.name}
  width={24}
  height={24}
  className="w-6 h-6 rounded-full"
/>
```

#### 4. Remote Image Domain Error
**Error**: Images from external domains (Gravatar, Google) fail to load
**Solution**: Configure `next.config.mjs`:
```javascript
images: {
  remotePatterns: [
    { protocol: 'https', hostname: '**.gravatar.com' },
    { protocol: 'https', hostname: '**.googleusercontent.com' },
    { protocol: 'https', hostname: 's.gravatar.com' },
  ],
}
```

#### 5. Workspace Root Warning
**Warning**: "Next.js inferred your workspace root, but it may not be correct"
**Cause**: Multiple package-lock.json files detected
**Solution**: Add to `next.config.mjs`:
```javascript
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const nextConfig = {
  outputFileTracingRoot: resolve(__dirname),
  // ... rest of config
};
```

#### 6. ESLint Anonymous Export Warning
**Warning**: "Assign object to a variable before exporting as module default"
**Cause**: Direct object literal in export statement in `lib/logService.js`
**Solution**:
```javascript
// WRONG
export default {
  logUserAction,
  stove: logStoveAction,
};

// CORRECT
const logService = {
  logUserAction,
  stove: logStoveAction,
};
export default logService;
```

### Runtime Compatibility
- **Firebase Client SDK**: Node.js runtime only (not Edge)
- **Auth0**: Works with both, but use Node.js for consistency
- **API Routes with Firebase**: Never use `export const runtime = 'edge'`

## Quick Reference

### Key Files to Modify
- **Add/modify API endpoints**: `lib/stoveApi.js`, `lib/routes.js`, `app/api/stove/*`
- **UI components**: `app/components/ui/*`
- **Error handling**: `lib/errorMonitor.js`, `app/components/ui/ErrorAlert.js`
- **Logging**: `lib/logService.js`
- **Scheduler logic**: `lib/schedulerService.js`, `app/api/scheduler/check/route.js`
- **Styling**: `tailwind.config.js` (animations, colors, shadows), inline Tailwind classes in components. **Note**: `app/globals.css` contains only base styles (no component classes)
- **Configuration**: `CLAUDE.md`, `.env.local`

### Common Tasks
- **Add new error code**: Update `ERROR_CODES` in `lib/errorMonitor.js`
- **Add new UI component**: Create in `app/components/ui/`, export in `index.js`, use inline Tailwind classes (no custom CSS classes)
- **Modify scheduler logic**: Edit `app/api/scheduler/check/route.js`
- **Change polling interval**: Modify `setInterval` in `app/components/StovePanel.js` (currently 5000ms)
- **Add new log action**: Add to `lib/logService.js` with pre-configured function
- **Modify color scheme**: Update `tailwind.config.js` theme.extend.colors
- **Add new animation**: Define keyframes in `tailwind.config.js` theme.extend.keyframes and add to theme.extend.animation
- **Modify existing component styles**: Edit component file directly using Tailwind utility classes (e.g., `Card.js`, `Button.js`, `Input.js`)

**PWA-specific tasks**:
- **Update PWA shortcuts**: Edit `public/manifest.json` shortcuts array, then rebuild
- **Change PWA theme color**: Update `theme_color` in `public/manifest.json` AND `viewport.themeColor` in `app/layout.js`
- **Update app icon**: Replace `public/icons/icon-192.png` and `icon-512.png`, regenerate other sizes with ImageMagick, update `app/favicon.png`
- **Modify cache strategies**: Edit `runtimeCaching` array in `next.config.mjs` (NetworkFirst, CacheFirst, StaleWhileRevalidate)
- **Add new cached route**: Add new entry to `runtimeCaching` in `next.config.mjs` with appropriate handler
- **Test PWA offline**: Build production (`npm run build`), start server (`npm run start`), disable network in DevTools
- **Clear service worker**: DevTools → Application → Service Workers → Unregister, then hard refresh

### Development Best Practices

#### When Creating New API Routes:
1. ✅ Use `@auth0/nextjs-auth0` (NOT `/edge` version)
2. ✅ Never add `export const runtime = 'edge'` when using Firebase
3. ✅ Import Firebase as `import { db } from '@/lib/firebase'`
4. ✅ Test with `npm run build` before committing

#### When Using Images:
1. ✅ Always use `<Image>` from `next/image` (not `<img>`)
2. ✅ Provide explicit `width` and `height` props
3. ✅ Add remote domains to `next.config.mjs` if loading external images
4. ✅ Use descriptive `alt` text for accessibility

#### When Exporting Modules:
1. ✅ Assign objects to variables before exporting: `const x = {...}; export default x`
2. ✅ Use named exports when exporting multiple items: `export { a, b, c }`
3. ✅ Avoid anonymous object exports: `export default { ... }` triggers ESLint warnings

#### When Styling Components:
1. ✅ Use inline Tailwind utility classes directly in components (no custom CSS classes)
2. ✅ Never add new classes to `app/globals.css` (reserved for base styles only)
3. ✅ For custom animations, define in `tailwind.config.js` under `theme.extend.keyframes` and `theme.extend.animation`
4. ✅ For new colors/shadows/etc., extend Tailwind theme in `tailwind.config.js`
5. ✅ Reusable styles should be encapsulated in components (e.g., `<Card>`, `<Button>`), not CSS classes
6. ❌ Never create utility classes like `.card`, `.btn-primary`, `.input-modern` in globals.css
7. ✅ Example of correct approach:
```javascript
// ✅ CORRECT - Component with inline Tailwind
export default function Card({ children, className }) {
  return (
    <div className={`bg-white rounded-2xl shadow-soft border border-neutral-200/50 ${className}`}>
      {children}
    </div>
  );
}

// ❌ WRONG - Using custom CSS class
export default function Card({ children, className }) {
  return <div className={`card ${className}`}>{children}</div>;
}
```

#### Code Quality Checks:
```bash
# Run these before committing
npm run build    # Check for build errors (also generates PWA files)
npm run lint     # Check for ESLint warnings
npm run dev      # Test runtime behavior
```

#### When Modifying PWA Configuration:
1. ✅ **Shortcuts are static** - remind user that shortcuts in manifest.json cannot show dynamic data
2. ✅ **Test in production mode** - PWA is disabled in dev, always test with `npm run build && npm run start`
3. ✅ **Update both files** - if changing theme color, update BOTH `manifest.json` and `app/layout.js` viewport export
4. ✅ **Regenerate icons** - use ImageMagick `magick` command to create all sizes from a single source
5. ✅ **Clear cache after changes** - service worker caches aggressively, users may need to unregister SW to see updates
6. ✅ **Verify offline fallback** - ensure `/offline` page works when disconnected (test in DevTools Network tab)