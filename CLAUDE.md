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
- **StovePanel** (`app/components/StovePanel.js`) - Main control interface with real-time status updates
- **Navbar** (`app/components/Navbar.js`) - Navigation with Auth0 integration

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
- `stoveScheduler/{day}` - Weekly schedule data (Lunedì, Martedì, etc.)
- `stoveScheduler/mode` - Scheduler mode state (enabled/disabled) with timestamp
- Firebase uses client SDK for all operations (no Admin SDK currently)

### Key Configuration
- PWA enabled via `next-pwa` plugin (disabled in development)
- Tailwind CSS for styling
- App Router architecture (Next.js 15)
- Force dynamic rendering on main page for real-time data

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

## Scheduler System

### Manual/Automatic Mode
- **Manual Mode**: User controls stove directly via StovePanel interface
- **Automatic Mode**: Cron job controls stove based on weekly schedule
- Mode toggle available in `/scheduler` page with visual indication
- Current mode displayed on home page with ⏰ (automatic) or 🔧 (manual) icons

### Cron Integration
- External cron calls `/api/scheduler/check?secret=cazzo` every minute
- Route checks scheduler mode before executing any stove actions
- If mode disabled, returns "MODALITA_MANUALE" status
- Automatic ignition/shutdown and fan/power level adjustments when enabled

### Components
- `lib/schedulerService.js` - Firebase operations for schedule and mode management
- `app/scheduler/page.js` - Weekly schedule configuration with mode toggle
- `app/components/StovePanel.js` - Home interface with mode indication
- `app/api/scheduler/check/route.js` - Cron endpoint for automatic control

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