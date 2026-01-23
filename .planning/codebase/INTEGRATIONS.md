# External Integrations

**Analysis Date:** 2026-01-23

## APIs & External Services

**Authentication:**
- Auth0 - User identity and session management
  - SDK: @auth0/nextjs-auth0 4.13.1
  - Config file: `lib/auth0.js`
  - Auth routes: `/auth/login`, `/auth/logout`, `/auth/callback`
  - Session: Rolling (24h) with 7-day absolute duration
  - Environment vars: `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `AUTH0_SECRET`

**Smart Home - Thermostat & Camera:**
- Netatmo API - Thermostat (Energy API) and Camera (Security API)
  - SDK: None (raw HTTP + OAuth 2.0)
  - Client implementation: `lib/netatmoApi.js`, `lib/netatmoCameraApi.js`
  - Token management: `lib/netatmoTokenHelper.js`
  - Credentials resolution: `lib/netatmoCredentials.js`
  - OAuth scopes: `read_thermostat`, `write_thermostat`, `read_camera`, `access_camera`
  - Environment vars:
    - `NEXT_PUBLIC_NETATMO_CLIENT_ID` (public - client-side visible)
    - `NETATMO_CLIENT_SECRET` (server-side only)
    - `NEXT_PUBLIC_NETATMO_REDIRECT_URI` (varies by environment)
  - Token endpoint: `https://api.netatmo.com/oauth2/token`
  - Token caching: Firebase database with 5-minute refresh buffer
  - Environment-aware storage: `dev/netatmo/` (localhost) or `netatmo/` (production)
  - API routes:
    - `GET /api/netatmo/homesdata` - Fetch thermostat homes/rooms
    - `GET /api/netatmo/camera` - List cameras
    - `GET /api/netatmo/camera/[cameraId]/snapshot` - Camera snapshot
    - `GET /api/netatmo/camera/[cameraId]/events` - Camera events
    - `POST /api/netatmo/stove-sync` - Stove-to-thermostat sync control

**Smart Home - Lights:**
- Philips Hue Remote API - Light control (OAuth 2.0)
  - Status: Hybrid local/remote architecture
  - Local access: `lib/hue/hueLocalHelper.js` (primary, in-network access)
  - Remote access: `lib/hue/hueRemoteApi.js` (future use, currently experimental)
  - Token management: `lib/hue/hueRemoteTokenHelper.js` (not yet implemented)
  - Connection strategy: `lib/hue/hueConnectionStrategy.js`
  - Environment vars:
    - `NEXT_PUBLIC_HUE_APP_ID` (public)
    - `NEXT_PUBLIC_HUE_CLIENT_ID` (public)
    - `HUE_CLIENT_SECRET` (server-side only)
  - Note: Remote API OAuth not yet enabled; local network API currently active

**Video Streaming:**
- HLS.js - HTTP Live Streaming for video playback
  - Package: hls.js 1.6.15
  - Used for camera video feed streaming

## Data Storage

**Databases:**
- Firebase Realtime Database
  - Client SDK: firebase 12.8.0
  - Admin SDK: firebase-admin 13.6.0
  - Connection: Environment-specific URL from `NEXT_PUBLIC_FIREBASE_DATABASE_URL`
  - Regions: europe-west1 (Pannello Stufa project)
  - Data structure:
    - `users/[userId]/fcmTokens` - Push notification device tokens
    - `users/[userId]/settings` - User preferences (theme, notifications)
    - `users/[userId]/devices` - Device preferences
    - `maintenance/[deviceId]` - Maintenance tracking
    - `schedules/[scheduleId]` - Heating schedules
    - `stove/[stoveId]/state` - Stove state and settings
    - `netatmo/access_token_cache` - Cached Netatmo OAuth tokens (dev/ prefix in localhost)
    - `hue/` - Philips Hue credentials and state
    - `changelog/` - Event logging for changes
  - Security rules: `database.rules.json` (defines access control)
  - Admin operations bypass security rules (used in API routes)
  - Client operations respect security rules

**File Storage:**
- Firebase Storage
  - Client SDK: firebase 12.8.0
  - Storage bucket: `pannellostufa.firebasestorage.app`
  - Used for: User profiles, device images, icons

**Caching:**
- Firebase Realtime Database (dual use)
  - Netatmo token caching: `netatmo/access_token_cache` with expiration handling
  - In-memory JS caching: `refreshPromise` prevents concurrent token refresh operations (race condition prevention)

## Authentication & Identity

**Auth Provider:**
- Auth0 (OAuth 2.0 + OpenID Connect)
  - Tenant: `pannellostufa.eu.auth0.com`
  - Configuration: `lib/auth0.js`
  - Session strategy: Rolling sessions (24h rolling, 7-day absolute)
  - Cookie config: `HttpOnly`, `Secure` (production only), `SameSite: lax`
  - Callback route: `/auth/callback`
  - Login route: `/auth/login`
  - Logout route: `/auth/logout`
  - User ID extraction: `user.sub` (Auth0 subject claim) used as Firebase key
  - OIDC discovery: Explicit endpoints configured (prevents middleware fetch failures)

## Notifications

**Push Notifications:**
- Firebase Cloud Messaging (FCM)
  - Admin SDK: firebase-admin/messaging
  - Implementation: `lib/firebaseAdmin.js` → `sendPushNotification()`, `sendNotificationToUser()`
  - Token storage: Firebase Realtime Database at `users/[userId]/fcmTokens`
  - Multi-platform support:
    - Android: High/normal priority, custom sound and vibration
    - iOS (APNS): Alert, sound, badge, content-available
    - Web: Notification icon, badge, vibration, requireInteraction for high priority
  - Use cases:
    - Scheduler notifications (heating schedule events)
    - Error alerts (stove sync failures, maintenance reminders)
    - Manual trigger capability via API

## Monitoring & Observability

**Error Tracking:**
- Not detected - No formal error tracking service (Sentry, Datadog, etc.)
- Local error monitoring: `lib/errorMonitor.js` (reads error logs from Firebase)

**Logs:**
- Firebase Realtime Database
  - Error logs: `logs/[timestamp]/[errorId]`
  - Stored via API route: `POST /api/log/add`
  - Client-side errors sent to backend for persistence
- Console logging (browser console and server logs)

## CI/CD & Deployment

**Hosting:**
- Vercel (detected from `vercel.json` and OIDC token)
- Deployment: Git-based automatic deployment

**CI Pipeline:**
- Vercel CI/CD (implicit, inferred from deployment config)
- Test command: `npm test:ci` configured for parallel testing

**Environment Configuration:**
- Development: `.env.local` (Git-ignored)
- Production: Vercel Environment Variables
- Environment detection: `lib/environmentHelper.js` (hostname-based)
  - `localhost:3000` = development
  - Production domain = production
- Multi-app Netatmo setup:
  - Two separate Netatmo apps registered at dev.netatmo.com
  - Same env var names, different values per environment
  - Credentials switch at deploy time

## Webhooks & Callbacks

**Incoming:**
- `GET /auth/callback` - Auth0 callback after login
- `GET /api/netatmo/callback` - Netatmo OAuth callback (configured for dev and production)
- `POST /api/scheduler/check` - Cron scheduler trigger (secured with `CRON_SECRET`)

**Outgoing:**
- Not detected - No outgoing webhooks to external services
- Internal: Netatmo API calls (request-response, not webhook-based)

## Admin & Operational Endpoints

**Cron Scheduler:**
- Route: `POST /api/scheduler/check`
- Trigger: External cron service (e.g., cron-job.org, AWS EventBridge)
- Purpose: Automatic heating schedule enforcement and stove sync
- Security: Required `CRON_SECRET` header validation
- Functions called:
  - `syncLivingRoomWithStove()` - Sync Netatmo thermostat with Thermorossi stove
  - `enforceStoveSyncSetpoints()` - Enforce stove temperature setpoints
  - `calibrateValvesServer()` - Valve calibration automation
  - Push notifications to admin user

**Admin Endpoints:**
- Routes: `POST /api/admin/*`
- Security: `ADMIN_SECRET` validation
- Operations: Changelog sync, system maintenance

**Data Migration Scripts:**
- `scripts/migrate-schedules.mjs` - Schedule format migration
- Run via: `npm run migrate:schedules` (with optional `--dry-run` flag)
- Purpose: One-time data transformation for schedule structure changes

## Environment Variables Summary

**Required (All Environments):**
- `NODE_ENV` - Environment (development/production)
- `AUTH0_SECRET` - Session encryption key
- `AUTH0_BASE_URL` - App base URL
- `AUTH0_ISSUER_BASE_URL` - Auth0 tenant URL
- `AUTH0_CLIENT_ID` - Auth0 application ID
- `AUTH0_CLIENT_SECRET` - Auth0 application secret

**Firebase (All Environments):**
- `NEXT_PUBLIC_FIREBASE_API_KEY` - Public API key
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` - Project ID
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` - Auth domain
- `NEXT_PUBLIC_FIREBASE_DATABASE_URL` - Realtime Database URL
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` - Storage bucket
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` - FCM sender ID
- `NEXT_PUBLIC_FIREBASE_APP_ID` - Firebase app ID
- `NEXT_PUBLIC_FIREBASE_VAPID_KEY` - FCM VAPID key for web push
- `FIREBASE_ADMIN_PROJECT_ID` - Admin SDK project ID
- `FIREBASE_ADMIN_CLIENT_EMAIL` - Admin SDK service account email
- `FIREBASE_ADMIN_PRIVATE_KEY` - Admin SDK private key (newlines as `\n`)

**Netatmo (Environment-Specific):**
- `NEXT_PUBLIC_NETATMO_CLIENT_ID` - OAuth app client ID (public, varies by env)
- `NETATMO_CLIENT_SECRET` - OAuth app secret (server-side only, varies by env)
- `NEXT_PUBLIC_NETATMO_REDIRECT_URI` - OAuth callback URL (varies: localhost vs production)

**Philips Hue (Optional - Future):**
- `NEXT_PUBLIC_HUE_APP_ID` - Local app identifier
- `NEXT_PUBLIC_HUE_CLIENT_ID` - Remote API client ID
- `HUE_CLIENT_SECRET` - Remote API secret (server-side only)

**Operations:**
- `CRON_SECRET` - Cron scheduler validation token
- `ADMIN_SECRET` - Admin operations validation token
- `ADMIN_USER_ID` - Auth0 user ID for scheduler notifications

**Secrets Location:**
- Development: `.env.local` (Git-ignored)
- Production: Vercel Environment Variables (encrypted at rest)

---

*Integration audit: 2026-01-23*
