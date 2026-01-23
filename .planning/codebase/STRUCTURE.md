# Codebase Structure

**Analysis Date:** 2026-01-23

## Directory Layout

```
pannello-stufa/
├── app/                        # Next.js App Router root
│   ├── (pages)/               # Grouped routes (Camera placeholder)
│   │   └── camera/
│   ├── api/                   # API routes (70 handlers)
│   │   ├── admin/             # Admin operations (changelog sync)
│   │   ├── devices/           # Device preferences management
│   │   ├── errors/            # Error logging/resolution
│   │   ├── health/            # Health checks
│   │   ├── hue/               # Philips Hue integration (pair, control, rooms, scenes)
│   │   ├── log/               # Application logging
│   │   ├── maintenance/       # Maintenance status/updates
│   │   ├── netatmo/           # Netatmo thermostat/camera APIs
│   │   ├── notifications/     # Push notification configuration
│   │   ├── scheduler/         # Scheduler execution (check, update)
│   │   ├── schedules/         # Schedule CRUD operations
│   │   └── stove/             # Stove control (25+ endpoints)
│   ├── components/            # React components (101 files)
│   │   ├── devices/           # Device-specific components (stove, thermostat, lights, camera)
│   │   ├── ui/                # Design system (41 components)
│   │   ├── navigation/        # Navigation/navbar components
│   │   ├── scheduler/         # Scheduler UI components
│   │   ├── netatmo/           # Netatmo-specific UI
│   │   ├── log/               # Logging UI
│   │   ├── lights/            # Lights control UI
│   │   ├── sandbox/           # Development sandbox toggle
│   │   ├── ClientProviders.js # Client context setup
│   │   ├── Navbar.js          # Main navigation (25KB)
│   │   ├── MaintenanceBar.js  # Stove maintenance indicator
│   │   ├── StovePanel.js      # Stove control panel (23KB)
│   │   ├── PWAInitializer.js  # PWA initialization
│   │   ├── VersionEnforcer.js # Version checking
│   │   └── AppleSplashScreens.js # iOS splash screens
│   ├── context/               # React contexts
│   │   ├── ThemeContext.js    # Dark/light theme management
│   │   ├── PageTransitionContext.js # Page transition state
│   │   └── VersionContext.js  # App version state
│   ├── debug/                 # Debug utilities
│   ├── hooks/                 # Custom React hooks
│   ├── lights/                # Lights control pages
│   ├── netatmo/               # Thermostat pages
│   ├── stove/                 # Stove control pages
│   │   ├── scheduler/         # Schedule management UI
│   │   ├── maintenance/       # Maintenance UI
│   │   └── errors/            # Error display UI
│   ├── thermostat/            # Thermostat pages
│   ├── settings/              # Settings pages (devices, notifications, theme)
│   ├── changelog/             # Changelog display
│   ├── offline/               # Offline fallback
│   ├── layout.js              # Root layout with providers
│   ├── page.js                # Home page (device dashboard)
│   ├── not-found.js           # 404 page
│   ├── template.js            # Layout template
│   ├── globals.css            # Global Tailwind styles (20KB)
│   ├── favicon.png            # App icon
│   └── sw.ts                  # Service worker (Serwist)
│
├── lib/                       # Backend utilities and services
│   ├── core/                  # Core infrastructure
│   │   ├── apiErrors.js       # Error definitions and codes
│   │   ├── apiResponse.js     # Response formatting utilities
│   │   ├── middleware.js      # Auth/error handler decorators
│   │   ├── requestParser.js   # Request body/query parsing
│   │   ├── netatmoHelpers.js  # Netatmo-specific utilities
│   │   └── index.js           # Core exports
│   ├── repositories/          # Data access layer
│   │   ├── base/
│   │   │   └── BaseRepository.js # Abstract Firebase operations
│   │   ├── MaintenanceRepository.js
│   │   ├── StoveStateRepository.js
│   │   ├── ScheduleRepository.js
│   │   ├── SchedulerModeRepository.js
│   │   └── index.js
│   ├── services/              # Business logic layer
│   │   └── StoveService.js    # Stove operations orchestration
│   ├── devices/               # Device registry and configuration
│   │   ├── deviceTypes.js     # Device definitions + feature flags
│   │   ├── deviceRegistry.js  # Registry helper functions
│   │   └── index.js
│   ├── hue/                   # Philips Hue integration (11 files)
│   ├── maintenance/           # Maintenance logic
│   ├── validators/            # Input validation functions
│   ├── hooks/                 # Custom React hooks (backend utilities)
│   ├── pwa/                   # PWA utilities
│   ├── auth0.js               # Auth0 configuration and session management
│   ├── firebase.js            # Firebase client SDK
│   ├── firebaseAdmin.js       # Firebase Admin SDK
│   ├── stoveApi.js            # Thermorossi API wrapper
│   ├── stoveStateService.js   # Stove state management
│   ├── netatmoApi.js          # Netatmo API wrapper (12KB)
│   ├── netatmoCameraApi.js    # Netatmo camera API (13KB)
│   ├── netatmoService.js      # Netatmo service logic
│   ├── netatmoCredentials.js  # Netatmo OAuth handling
│   ├── netatmoCalibrationService.js # Netatmo calibration
│   ├── netatmoStoveSync.js    # Netatmo-to-stove sync logic
│   ├── schedulerService.js    # Scheduler orchestration
│   ├── maintenanceService.js  # Maintenance calculations
│   ├── logger.js              # Logging utility
│   ├── logService.js          # Firebase log storage
│   ├── devicePreferencesService.js # User device preferences
│   ├── themeService.js        # Theme preference management
│   ├── changelogService.js    # Changelog management
│   ├── hlsDownloader.js       # HLS stream downloader
│   ├── errorMonitor.js        # Error monitoring (10KB)
│   ├── environmentHelper.js   # Environment variable helpers
│   ├── formatUtils.js         # Formatting utilities
│   └── migrateSchedules.js    # Migration script
│
├── public/                    # Static assets
│   ├── sw.js                  # Compiled service worker
│   ├── manifest.json          # PWA manifest
│   ├── icons/                 # App icons (192px, 512px, etc.)
│   └── splash-screens/        # iOS splash screen images
│
├── __mocks__/                 # Jest mocks
│   └── next-server.js         # NextResponse mock
│
├── __tests__/                 # Integration tests
│
├── .planning/                 # Planning documents
│   └── codebase/              # This analysis output
│
├── .github/                   # GitHub Actions workflows
├── scripts/                   # Utility scripts
│   └── migrate-schedules.mjs  # Schedule migration (v1.76)
│
├── docs/                      # Project documentation (27 files)
│   ├── INDEX.md               # Documentation index
│   ├── architecture.md        # Architecture guide
│   ├── api-routes.md          # API route reference
│   ├── design-system.md       # UI component guide
│   ├── firebase.md            # Firebase setup
│   ├── testing.md             # Testing guide
│   └── troubleshooting.md     # Troubleshooting guide
│
├── package.json               # Dependencies (Next.js 16.1, React 19, Firebase 12.8)
├── next.config.mjs            # Next.js configuration with Serwist PWA
├── tsconfig.json              # TypeScript configuration
├── jest.config.js             # Jest testing configuration
├── jest.setup.js              # Jest setup file
├── eslint.config.mjs          # ESLint configuration
├── tailwind.config.js         # Tailwind CSS configuration
├── postcss.config.js          # PostCSS configuration
│
├── CLAUDE.md                  # Project instructions
├── CHANGELOG.md               # Version history (275KB)
├── .env.example               # Environment variable template
├── .env.local                 # Local environment (git-ignored)
├── .gitignore                 # Git ignore patterns
└── database.rules.json        # Firebase security rules
```

## Directory Purposes

**app/api/**
- Purpose: API endpoint handlers for all backend operations
- Contains: 70 route handlers organized by feature/device
- Key files: `stove/`, `netatmo/`, `schedules/`, `hue/`
- Authentication: All routes protected by `withAuth` middleware (except health)

**app/components/**
- Purpose: Reusable React components organized by function
- Contains: 101 component files across 27 subdirectories
- Largest: `ui/` (41 components for design system), `devices/` (device cards)
- Pattern: Each component is a separate file; complex components have directories with subcomponents

**lib/repositories/**
- Purpose: Firebase data access abstraction layer
- Contains: Base class + 4 specific repositories (Maintenance, StoveState, Schedule, SchedulerMode)
- Pattern: All inherit from `BaseRepository` for consistent timestamps and CRUD operations
- Firebase paths: `/maintenance`, `/stove/state`, `/schedules`, `/scheduler-mode`

**lib/core/**
- Purpose: Shared infrastructure used by all API routes
- Contains: Error handling, response formatting, middleware, request parsing
- Critical exports: `apiErrors.js` (error codes), `apiResponse.js` (success/error functions), `middleware.js` (decorators)

**lib/hue/**
- Purpose: Philips Hue integration (11 files)
- Contains: API wrapper, scene management, light control, discovery
- Pattern: Standalone module that can be disabled if Hue not configured

**app/components/ui/**
- Purpose: Design system with 41 reusable UI components
- Contains: Buttons, cards, inputs, modals, icons, primitives
- Styling: Tailwind with Ember Noir theme (dark-first, copper accents)
- Exported from: `app/components/ui/index.js` as barrel file

## Key File Locations

**Entry Points:**
- `app/page.js`: Home page (device dashboard) - renders enabled devices via device registry
- `app/layout.js`: Root layout with theme script, auth providers, PWA initialization
- `app/api/*/route.js`: API handlers - all follow pattern `export const GET/POST = withAuthAndErrorHandler(...)`
- `app/sw.ts`: Service worker - precaching + caching strategy configuration

**Configuration:**
- `next.config.mjs`: PWA setup with Serwist, image patterns, Turbopack
- `jest.config.js`: Test configuration with path aliases, coverage thresholds (70%)
- `tailwind.config.js`: Tailwind + custom Ember Noir colors (ember, copper, stone, slate)
- `.env.example`: All required environment variables (Auth0, Firebase, Netatmo, Hue, etc.)

**Core Logic:**
- `lib/services/StoveService.js`: Orchestrates ignite, shutdown, mode handling
- `lib/core/middleware.js`: `withAuth`, `withErrorHandler`, `withAuthAndErrorHandler` decorators
- `lib/core/apiResponse.js`: `success()`, `error()`, `badRequest()`, `created()` response builders
- `lib/stoveApi.js`: Thermorossi API client (external cloud API)
- `lib/netatmoApi.js`: Netatmo API client with auth/token refresh
- `lib/schedulerService.js`: Schedule execution and Netatmo sync logic

**Testing:**
- `jest.config.js`: Configuration (setupFilesAfterEnv, moduleNameMapper, coverage)
- `jest.setup.js`: Global test setup (testing-library configuration)
- `__mocks__/`: Global mocks for external modules
- Test files: Co-located as `__tests__/` directories next to source files

**Authentication:**
- `lib/auth0.js`: Auth0 session management (getSession, login redirect)
- `@auth0/nextjs-auth0`: Middleware automatically installed

**Database:**
- `lib/firebaseAdmin.js`: Firebase Admin SDK initialization (backend operations)
- `lib/firebase.js`: Firebase Client SDK (frontend operations)
- `database.rules.json`: Firebase Realtime Database security rules
- Storage: All data in `/` root with collections like `/stove/state`, `/schedules`, `/logs`

## Naming Conventions

**Files:**
- Components: PascalCase (`StoveCard.js`, `ThemeContext.js`)
- Utilities/Services: camelCase (`stoveApi.js`, `maintenanceService.js`)
- API routes: Descriptive lowercase segments (`app/api/stove/ignite/route.js`)
- Tests: Same name as source + `.test.js` or in `__tests__` directory

**Directories:**
- Feature-based: `app/api/stove/`, `app/stove/`, `lib/hue/`
- Component categories: `app/components/devices/`, `app/components/ui/`
- Test locations: `lib/__tests__/`, `app/components/ui/__tests__/`

**Exports:**
- Barrel files: `lib/devices/index.js`, `lib/core/index.js`, `app/components/ui/index.js`
- Named exports: `export function getEnabledDevices() {}`
- Default exports: Components only (less common; most are named)

**Route Handlers:**
- API routes: Must export `GET`, `POST`, `PUT`, `DELETE` functions
- File structure: `app/api/[feature]/[action]/route.js`
- Protection: All routes use `withAuthAndErrorHandler(handler, 'Feature/Action')` for logging

## Where to Add New Code

**New Feature (Device Control):**
- Primary code: `lib/services/NewDeviceService.js` (business logic)
- Repository: `lib/repositories/NewDeviceRepository.js` (data access)
- API routes: `app/api/newdevice/action/route.js` (endpoints)
- Tests: Co-located `__tests__` directories in same locations
- Pattern: Follow `StoveService` pattern with dependency injection (repos in constructor)

**New Component/Module:**
- Implementation: `app/components/[feature]/ComponentName.js`
- Tests: `app/components/[feature]/__tests__/ComponentName.test.js`
- Exports: Add to `app/components/ui/index.js` if reusable
- Pattern: Use design system components from `app/components/ui/` for consistency

**New UI Component:**
- Location: `app/components/ui/ComponentName.js` (or `ComponentName/index.js` for complex)
- Design: Use Tailwind classes; follow Ember Noir theme (dark-first)
- Tests: `app/components/ui/__tests__/ComponentName.test.js`
- Export: Add to `app/components/ui/index.js` barrel file
- Variants: Use className props or CSS modules for variants

**New API Endpoint:**
- File: `app/api/[feature]/[action]/route.js`
- Handler: `export const [METHOD] = withAuthAndErrorHandler(async (request, context, session) => { ... }, 'Feature/Action')`
- Validation: Use validator function from `lib/validators/`
- Response: Use `success()` or `error()` from `lib/core/apiResponse`
- Error handling: Throw `ApiError` subclasses (catch by middleware)

**Utilities:**
- Shared helpers: `lib/[domain]Utils.js` (e.g., `lib/formatUtils.js`)
- Validation: `lib/validators/[feature]Validators.js`
- Hooks (backend): `lib/hooks/[feature].js`
- Custom React hooks (frontend): `lib/hooks/use[Feature].js` (exported from `lib/hooks/index.js`)

## Special Directories

**app/settings/**
- Purpose: User preference pages (theme, notifications, device selection)
- Generated: No (source files)
- Committed: Yes
- Routes: `/settings/devices`, `/settings/notifications`, `/settings/theme`

**lib/hue/**
- Purpose: Philips Hue integration (separate from core)
- Generated: No (source files)
- Committed: Yes
- Extensible: Can be completely disabled if Hue not configured

**.planning/codebase/**
- Purpose: Architecture and structure documentation (auto-generated)
- Generated: Yes (by `/gsd:map-codebase` command)
- Committed: Yes (consumed by `/gsd:plan-phase`)

**public/**
- Purpose: Static assets served directly
- Generated: Partially (sw.js compiled from app/sw.ts)
- Committed: Icons and manifest committed; sw.js auto-compiled

**.next/**
- Purpose: Next.js build output
- Generated: Yes (by `npm run build`)
- Committed: No (in .gitignore)

**docs/**
- Purpose: Project documentation (27 markdown files)
- Generated: Manual (maintained by developers)
- Committed: Yes (source of truth for architecture/API docs)

---

*Structure analysis: 2026-01-23*
