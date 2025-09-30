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
- `/` (home) - Main StovePanel interface for controlling the stove
- `/scheduler` - Weekly schedule configuration with timeline visualization and mode toggle
- `/log` - Historical logs of stove operations

### API Routes Structure
All API routes are in `app/api/` with the following organization:
- `stove/*` - Thermorossi stove control endpoints (ignite, shutdown, fan/power control, status)
- `auth/[...auth0]/*` - Auth0 authentication handling
- `netatmo/*` - Netatmo temperature sensor integration
- `scheduler/*` - Automated stove scheduling system
- `log/*` - Firebase logging functionality
- `user/*` - User management

### External Integrations
- **Thermorossi Cloud API** (`lib/stoveApi.js`) - Contains API endpoints and key for stove control
- **Firebase Realtime Database** (`lib/firebase.js`) - Used for logging stove operations and scheduler data storage
- **Auth0** - User authentication and session management with middleware protection
- **Netatmo API** - Temperature monitoring from smart thermostats

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