# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 PWA application called "Pannello Stufa" (Stove Panel) that provides remote control functionality for a Thermorossi stove through their cloud API. The app integrates with Auth0 for authentication, Firebase Realtime Database for logging, and Netatmo API for temperature monitoring.

## Development Commands

- `npm run dev` - Start development server on http://localhost:3000
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Architecture

### Core Components
- **StovePanel** (`app/components/StovePanel.js`) - Main control interface with real-time status updates, separated into status card, controls card, and Netatmo connection card
- **Navbar** (`app/components/Navbar.js`) - Navigation with Auth0 integration, glassmorphism design with backdrop blur

### Pages
- `/` (`app/page.js`) - Main StovePanel interface for controlling the stove
  - Real-time status polling every 5 seconds
  - Ignite/shutdown buttons
  - Fan (1-6) and power (0-5) level controls
  - Netatmo temperature display and connection management
  - Scheduler mode indicator with link to scheduler page
  - Force dynamic rendering for real-time data
- `/scheduler` (`app/scheduler/page.js`) - Weekly schedule configuration
  - Weekly timeline view (7 days × 24 hours)
  - Add/remove time intervals per day
  - Configure power and fan levels per interval
  - Manual/Automatic mode toggle
  - Semi-manual status display with return time
  - Firebase integration for schedule persistence
- `/log` (`app/log/page.js`) - Historical logs viewer
  - Display of stove operation logs from Firebase
  - Timestamped entries of all actions
- `/netatmo/authorized` (`app/netatmo/authorized/page.js`) - Netatmo OAuth success page
  - Confirmation page after Netatmo authorization
  - Shows authorization status

### API Routes Structure
All API routes are in `app/api/` with the following organization:

#### Stove Control (`/api/stove/*`)
- `GET /api/stove/status` - Get current stove status from Thermorossi API
  - Returns: `StatusDescription`, operational state (WORK, START, etc.)
- `POST /api/stove/ignite` - Turn on the stove
  - Triggers semi-manual mode if scheduler is active
  - Sets `returnToAutoAt` to next scheduled change
- `POST /api/stove/shutdown` - Turn off the stove
  - Triggers semi-manual mode if scheduler is active
  - Sets `returnToAutoAt` to next scheduled change
- `POST /api/stove/setFan` - Set fan level (1-6)
  - Body: `{ level: number }`
- `POST /api/stove/setPower` - Set power level (0-5)
  - Body: `{ level: number }`
- `GET /api/stove/getFan` - Get current fan level
  - Returns: `{ Result: number }`
- `GET /api/stove/getPower` - Get current power level
  - Returns: `{ Result: number }`
- `GET /api/stove/settings` - Get all stove settings
  - Calls: `GetSettings/${API_KEY}`
- `POST /api/stove/setSettings` - Update stove settings
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
- `POST /api/log/add` - Add log entry to Firebase
  - Body: Any JSON object with log data
  - Adds timestamp automatically
  - Saves to `log/` path in Firebase

#### User Management (`/api/user/*`)
- `GET /api/user` - Get current authenticated user info
  - Returns Auth0 session user object
  - Returns `{ user: null }` if not authenticated

### External Integrations
- **Thermorossi Cloud API** (`lib/stoveApi.js`) - Contains API endpoints and key for stove control
- **Firebase Realtime Database** (`lib/firebase.js`) - Used for logging stove operations and scheduler data storage
- **Auth0** - User authentication and session management with middleware protection
- **Netatmo API** - Temperature monitoring from smart thermostats

### Route Management System
- **Route Configuration** (`lib/routes.js`) - Centralized API route definitions
  - All API routes are defined in a single source of truth
  - Prevents hardcoded URLs throughout the codebase
  - Makes route changes easier to manage and maintain

  **Exported Constants:**
  - `STOVE_ROUTES`: All stove control endpoints
    - `status`, `ignite`, `shutdown`, `getFan`, `getPower`, `setFan`, `setPower`, `getSettings`, `setSettings`
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
  - Each day contains array of time ranges with: `start`, `end`, `power` (0-5), `fan` (1-6)
- `stoveScheduler/mode` - Scheduler mode state object:
  - `enabled`: boolean (manual/automatic toggle)
  - `timestamp`: when mode was last changed
  - `semiManual`: boolean (temporary manual override)
  - `returnToAutoAt`: ISO timestamp for automatic return to scheduled mode
- Firebase uses client SDK for all operations (no Admin SDK currently)
- `stoveLogs/` - Historical logs of all stove operations with timestamps

### Key Configuration
- PWA enabled via `next-pwa` plugin (disabled in development)
- **Tailwind CSS** for styling with custom design system
- App Router architecture (Next.js 15)
- Force dynamic rendering on main page for real-time data

### Design System (Tailwind)
Modern, minimal design with warm color palette reflecting the stove's purpose:
- **Primary** (red #ef4444): Fire/heat theme, used for critical actions and error states
- **Accent** (orange #f97316): Warmth emphasis, used for manual mode and secondary highlights
- **Neutral** (grays): Text, backgrounds, and borders
- **Success** (green #10b981): Positive states, stove working, automatic mode
- **Warning** (yellow #f59e0b): Semi-manual mode, standby states
- **Info** (blue #3b82f6): Information and links

Custom utility classes in `app/globals.css`:
- `.card`: Modern white cards with soft shadow and border
- `.btn-primary`, `.btn-secondary`: Consistent button styles
- `.input-modern`, `.select-modern`: Form controls with custom styling
- Gradient background on body for depth
- Mobile-first responsive approach throughout

### Environment Variables Required
- Firebase config variables (`NEXT_PUBLIC_FIREBASE_*`)
- Auth0 configuration (`AUTH0_*`)
- Netatmo API credentials (`NEXT_PUBLIC_NETATMO_*`, `NETATMO_*`)
- `CRON_SECRET=cazzo` - Secret for scheduler cron endpoint authentication

## Important Notes

- The stove API key is hardcoded in `lib/stoveApi.js:15` - consider moving to environment variables for security
- Main component uses polling every 5 seconds for status updates
- PWA configuration generates service worker in `public/` directory
- Italian language interface ("it" locale)
- All UI text and labels are in Italian
- Theme color for PWA: `#ef4444` (primary red)
- **Route system**: All API routes are centralized in `lib/routes.js` for consistency
  - Frontend components import routes from this file
  - Backend endpoints also use the same route definitions
  - Makes route changes easier to manage and prevents hardcoded URLs

## UI/UX Guidelines

When modifying components, maintain these design principles:
- **Mobile-first**: Always design for mobile screens first, then scale up
- **Consistent spacing**: Use Tailwind spacing scale (gap-2, gap-4, p-6, etc.)
- **Icon usage**: Emoji icons throughout for visual clarity and simplicity
- **Color semantics**: Follow the design system colors for consistent meaning
- **Smooth transitions**: All interactive elements should have `transition-all duration-200`
- **Card-based layout**: Main content areas use the `.card` utility class
- **Active states**: Buttons should have hover, active, and disabled states clearly defined
- **Accessibility**: Maintain proper contrast ratios and semantic HTML

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
  - Fan level (1-6) and power level (0-5) controls
  - Netatmo connection management
  - Mode indicator with link to scheduler
- `app/api/scheduler/check/route.js` - Cron endpoint for automatic control
  - Called every minute by external cron
  - Checks current time against schedule
  - Executes stove commands based on schedule
  - Respects manual mode (returns "MODALITA_MANUALE")

## Security & Middleware

- Auth0 middleware (`middleware.js`) protects all routes except:
  - `/api/auth/*` - Authentication endpoints
  - `/api/scheduler/check` - Cron endpoint (protected by CRON_SECRET)
  - `/api/stove/*` - Stove control endpoints
  - Static assets (`_next`, `favicon.ico`)

## Firebase Permissions Issue

- Current Firebase rules may block write access to `stoveScheduler/mode`
- Error: "PERMISSION_DENIED: Permission denied"
- Solution: Update Firebase security rules or implement Firebase Admin SDK for server operations