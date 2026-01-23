# Architecture

**Analysis Date:** 2026-01-23

## Pattern Overview

**Overall:** Service + Repository Pattern with Next.js 16 App Router

**Key Characteristics:**
- Multi-device smart home control system (stove, thermostat, lights, camera)
- Service layer (`StoveService`) abstracts business logic from API routes
- Repository pattern (`MaintenanceRepository`, `StoveStateRepository`) abstracts Firebase data access
- Auth0 middleware for authentication; centralized error handling
- Client-side React contexts for theme and UI state
- PWA-first architecture with Serwist service worker caching

## Layers

**API Layer:**
- Purpose: HTTP endpoints for device control, data retrieval, configuration
- Location: `app/api/`
- Contains: Route handlers using Next.js 16 file-based routing
- Depends on: Middleware (`withAuth`, `withErrorHandler`), Services, Repositories
- Used by: Client components, external integrations (webhooks)

**Service Layer:**
- Purpose: Business logic, orchestration, state management
- Location: `lib/services/StoveService.js`
- Contains: Domain logic (e.g., `ignite()`, `shutdown()`, maintenance checks)
- Depends on: Repositories, External APIs (`stoveApi`, `netatmoApi`)
- Used by: API routes

**Repository Layer:**
- Purpose: Data access abstraction for Firebase
- Location: `lib/repositories/`
- Contains: `BaseRepository`, `MaintenanceRepository`, `StoveStateRepository`, `SchedulerModeRepository`, `ScheduleRepository`
- Depends on: Firebase Admin SDK, Core utilities
- Used by: Services

**Core/Utilities Layer:**
- Purpose: Reusable infrastructure (errors, responses, middleware, validation)
- Location: `lib/core/`
- Contains: `apiResponse.js`, `apiErrors.js`, `middleware.js`, `requestParser.js`
- Depends on: Next.js, Firebase
- Used by: All API routes

**Integration Layer:**
- Purpose: External service communication
- Location: `lib/stoveApi.js`, `lib/netatmoApi.js`, `lib/hue/`, etc.
- Contains: SDK wrappers, API clients
- Depends on: External APIs (Thermorossi, Netatmo, Philips Hue)
- Used by: Services

**UI Component Layer:**
- Purpose: React components for rendering pages and UI
- Location: `app/components/`, `app/(pages)/`
- Contains: Device cards, controls, settings pages, design system components
- Depends on: React contexts, hooks, UI primitives
- Used by: Page routes

**Context & Hooks Layer:**
- Purpose: Client-side state and logic reuse
- Location: `app/context/`, `lib/hooks/`
- Contains: `ThemeContext`, `PageTransitionContext`, custom hooks
- Depends on: React, Auth0 client SDK
- Used by: Components

## Data Flow

**Device Control Flow (e.g., Ignite Stove):**

1. User clicks ignite button → `StoveCard` component
2. Component calls `POST /api/stove/ignite`
3. Route handler: `withAuthAndErrorHandler` middleware authenticates request
4. Request validation: `validateIgniteInput()` checks power/source parameters
5. Service instantiation: `getStoveService()` creates service with repos
6. Business logic: `StoveService.ignite(power, source)` executes:
   - Maintenance check via `MaintenanceRepository.canIgnite()`
   - External API call via `stoveApi.igniteStove(power)`
   - State update via `StoveStateRepository.updateState()`
   - Mode handling for semi-manual/automatic modes
7. Response formatting: `success(result)` wraps data in standardized JSON
8. Client receives success → UI updates via React state/hooks

**Status Synchronization Flow:**

1. Component mounts or button clicked → calls `GET /api/stove/status`
2. Route handler calls `getStoveStatus()` from `stoveApi`
3. External API fetches current state from Thermorossi cloud
4. Response includes status, power level, temperature readings
5. Client updates component state with new values
6. UI re-renders with current status

**Thermostat Sync Flow (Automatic):**

1. Scheduler detects time to sync → `POST /api/scheduler/check`
2. Service retrieves scheduled setpoint and current thermostat setpoint
3. Calls `netatmoApi.setTarget()` if difference exceeds threshold
4. Updates `StoveStateRepository` with sync results
5. Logs operation to `logService` for audit trail

**State Management Flow:**

- Device state stored in Firebase: `/stove/state`, `/maintenance`, `/schedules`
- Repositories handle CRUD operations with timestamp tracking
- Services read state, apply business logic, update state
- API routes expose state to client
- Components fetch via API or context providers

## Key Abstractions

**Device Registry:**
- Purpose: Centralized configuration for all devices (stove, thermostat, lights, camera)
- Examples: `lib/devices/deviceTypes.js`, `lib/devices/deviceRegistry.js`
- Pattern: Registry pattern with feature flags and route configuration
- Allows adding new devices without modifying core code

**API Response Standardization:**
- Purpose: Consistent response format across all API routes
- Examples: `lib/core/apiResponse.js` exports `success()`, `error()`, `created()`
- Pattern: Wrapper functions that format data + status codes
- All routes use: `return success({ data })` instead of raw `NextResponse.json()`

**Error Handling:**
- Purpose: Centralized error definitions and HTTP status mapping
- Examples: `lib/core/apiErrors.js` exports `ApiError` class with factory methods
- Pattern: Custom error class with `code`, `message`, `statusCode`
- Usage: `throw ApiError.maintenanceRequired()` → automatic 409 response

**Middleware Decorators:**
- Purpose: Wrap route handlers with auth/error handling without repetition
- Examples: `withAuth()`, `withErrorHandler()`, `withAuthAndErrorHandler()`
- Pattern: Higher-order function that intercepts requests
- Benefit: Auth0 session extraction, error catching, consistent error responses

**Repository Base Class:**
- Purpose: Shared Firebase operations (get, set, update, delete)
- Location: `lib/repositories/base/BaseRepository.js`
- Pattern: Abstract parent with `get()`, `set()`, `update()`, `delete()`, `withTimestamp()`
- Benefit: All repos inherit timestamp tracking, atomic operations

**Validation Layer:**
- Purpose: Input validation for API requests
- Location: `lib/validators/`
- Pattern: Pure functions that throw `ApiError` on invalid input
- Usage: `const { power, source } = validateIgniteInput(body)`

## Entry Points

**Web/Browser Entry:**
- Location: `app/page.js`
- Triggers: User navigates to `/`, receives session check and device list
- Responsibilities: Authenticate user, fetch enabled devices, render device cards

**API Entry Points:**
- Location: `app/api/[feature]/[action]/route.js`
- Triggers: HTTP requests from client or webhooks
- Responsibilities: Validate input, execute service logic, return standardized response

**Service Worker Entry:**
- Location: `app/sw.ts`
- Triggers: Browser service worker registration
- Responsibilities: Precache assets, cache API responses, offline fallback

**Scheduler Entry (Cron/External Trigger):**
- Location: `app/api/scheduler/check/route.js`
- Triggers: External scheduler (e.g., AWS EventBridge, cron service)
- Responsibilities: Check scheduled tasks, sync thermostat, log operations

**Auth Entry:**
- Location: Handled by `@auth0/nextjs-auth0` middleware
- Triggers: Protected routes or login page
- Responsibilities: Session validation, token refresh, redirect to login

## Error Handling

**Strategy:** Centralized error definitions with HTTP status mapping

**Patterns:**

1. **Validation Errors (400):**
   ```javascript
   throw ApiError.badRequest('Invalid power level: must be 1-5');
   ```

2. **Authentication Errors (401):**
   ```javascript
   // Automatic via withAuth middleware
   if (!session?.user) return unauthorized();
   ```

3. **Business Logic Errors (409, 422):**
   ```javascript
   throw ApiError.maintenanceRequired();
   throw ApiError.conflict('Thermostat not reachable');
   ```

4. **Internal Errors (500):**
   ```javascript
   // Automatic via withErrorHandler, logs to Firebase
   throw new Error('Firebase connection failed');
   ```

5. **Error Recovery:**
   - Errors logged to `lib/logService` and Firebase `/logs` collection
   - Client notified with user-friendly message
   - Original error details stored server-side for debugging

## Cross-Cutting Concerns

**Logging:**
- Approach: Winston-style logging via `lib/logger.js` and `lib/logService.js`
- Captured: API calls, errors, state changes, external integrations
- Storage: Firebase `/logs` collection + server console (dev)
- Usage: `logger.info('Stove ignited', { power, source })`

**Validation:**
- Approach: Pure validator functions in `lib/validators/`
- Timing: Request body parsing → validation → service execution
- Scope: Input types, ranges, required fields
- Example: `validateIgniteInput({ power, source })` returns validated object or throws

**Authentication:**
- Approach: Auth0 via `@auth0/nextjs-auth0`
- Session: Retrieved via `auth0.getSession(request)`
- Protected Routes: All `/api/` routes require `withAuth` middleware
- User ID: `session.user.sub` used for device preferences, theme, schedules

**Theme Management:**
- Approach: React context (`ThemeContext`) + Firebase storage
- Storage: User preference in `/users/{userId}/preferences/theme`
- CSS Classes: Tailwind dark mode with `dark:` prefix
- Implementation: `lib/themeService.js` provides `getThemePreference()`, `updateThemePreference()`

**State Synchronization:**
- Approach: Repository pattern handles write operations; API routes expose read
- Timestamp Tracking: All updates include `lastUpdatedAt` via `BaseRepository.withTimestamp()`
- Consistency: Services orchestrate multi-step updates (check → API → state)
- Example: `StoveService.ignite()` → check maintenance → call API → update state

**PWA Caching:**
- Approach: Serwist service worker with layered strategies
- Precache: Static assets (JS, CSS, images)
- Network First: Navigation requests (always fetch fresh content)
- Cache First: API responses with 1-minute expiry for stove API, 24h for pages
- Configuration: `app/sw.ts` defines cache names and expiration

---

*Architecture analysis: 2026-01-23*
