---
phase: 56-error-boundaries
plan: 02
subsystem: error-handling
tags: [error-boundaries, device-cards, crash-isolation, testing]
dependency_graph:
  requires: [error-boundaries-foundation, react-error-boundary, validation-error]
  provides: [error-fallback-ui, device-card-error-boundary, homepage-error-isolation]
  affects: [homepage, all-device-cards]
tech_stack:
  added: [ErrorFallback, DeviceCardErrorBoundary, DEVICE_META]
  patterns: [crash-isolation, instanceof-bypass, error-boundary-reset]
key_files:
  created:
    - app/components/ErrorBoundary/ErrorFallback.tsx
    - app/components/ErrorBoundary/DeviceCardErrorBoundary.tsx
    - app/components/ErrorBoundary/index.ts
    - __tests__/components/ErrorBoundary/DeviceCardErrorBoundary.test.tsx
    - __tests__/components/ErrorBoundary/ErrorFallback.test.tsx
  modified:
    - app/page.tsx
    - package.json
    - package-lock.json
decisions:
  - decision: ErrorFallback uses Ember Noir design system with device-specific icons
    rationale: Visual consistency with existing device cards, user-friendly error presentation
    impact: Error states match the look and feel of normal device cards
  - decision: Server Component (page.tsx) renders Client Component (DeviceCardErrorBoundary)
    rationale: Next.js pattern - Server Components can render Client Components as children
    impact: No hydration issues, error boundaries work correctly in mixed architecture
  - decision: DEVICE_META map provides fallback for unknown device IDs
    rationale: Defensive programming - handles edge cases where card.id not in metadata
    impact: Unknown devices show generic ⚠️ icon and raw card.id as name
metrics:
  duration: 6 min
  tasks_completed: 2
  tests_added: 13
  tests_passing: 13
  files_created: 5
  files_modified: 3
  commits: 2
  completed_date: 2026-02-12
---

# Phase 56 Plan 02: Feature-Level Error Boundaries Summary

**One-liner:** Device card error boundaries with crash isolation, ErrorFallback UI, ValidationError bypass, and homepage integration across all 5 device types.

## What Was Built

Created feature-level error boundary components and integrated them into the homepage for crash isolation:

1. **ErrorFallback Component** (`app/components/ErrorBoundary/ErrorFallback.tsx`)
   - 'use client' directive for client-side error handling
   - Extends FallbackProps from react-error-boundary with deviceName and deviceIcon props
   - Renders Ember Noir styled Card with:
     - Device icon (text-4xl, centered)
     - Heading level={3} variant="ember": "Errore: {deviceName}"
     - Text variant="secondary": shows error.message or fallback "Si è verificato un errore imprevisto"
     - Button variant="ember": "Riprova" that calls resetErrorBoundary
   - Centered layout with space-y-4 vertical spacing
   - Type guard: error instanceof Error to safely access error.message

2. **DeviceCardErrorBoundary Component** (`app/components/ErrorBoundary/DeviceCardErrorBoundary.tsx`)
   - 'use client' directive
   - Wraps children with react-error-boundary's ErrorBoundary
   - Props: children, deviceName, deviceIcon
   - onError handler logic:
     - **ValidationError bypass**: if (error instanceof ValidationError) throw error
     - **Analytics logging**: fire-and-forget POST to /api/analytics/error with device, component, message, stack
     - Type guards: error instanceof Error for safe property access
   - FallbackComponent: renders ErrorFallback with device-specific props
   - Fire-and-forget pattern: .catch(() => {}) on fetch to prevent cascading failures

3. **Barrel Export** (`app/components/ErrorBoundary/index.ts`)
   - Exports DeviceCardErrorBoundary and ErrorFallback as named exports
   - Pattern: export { default as ComponentName } from './ComponentName'

4. **Homepage Integration** (`app/page.tsx`)
   - Added DeviceCardErrorBoundary import
   - Created DEVICE_META map with device-specific metadata:
     - stove: { name: 'Stufa', icon: '🔥' }
     - thermostat: { name: 'Termostato', icon: '🌡️' }
     - weather: { name: 'Meteo', icon: '☀️' }
     - lights: { name: 'Luci', icon: '💡' }
     - camera: { name: 'Camera', icon: '📷' }
   - Wrapped each device card in .map() loop with DeviceCardErrorBoundary
   - Fallback handling: DEVICE_META[card.id]?.name ?? card.id (defensive)
   - Preserved existing Grid, EmptyState, and animation logic

5. **Unit Tests**
   - **ErrorFallback (6 tests)**:
     - Renders device name in heading
     - Renders device icon
     - Renders error message from error prop
     - Renders "Riprova" button
     - Calls resetErrorBoundary when button clicked
     - Shows fallback message when error has no message
   - **DeviceCardErrorBoundary (7 tests)**:
     - Renders children when no error occurs
     - Shows ErrorFallback when child throws Error (crash isolation)
     - Does NOT show ErrorFallback when ValidationError thrown (bypasses boundary)
     - Calls fetch to /api/analytics/error when error caught
     - Fetch body includes device name and error message
     - Clicking "Riprova" resets boundary and re-renders children
     - Handles fetch failure gracefully (fire-and-forget)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript error with unknown error type in onError handler**
- **Found during:** Task 1 TypeScript verification
- **Issue:** onError receives error as unknown (react-error-boundary v6.1.0 signature), but plan template typed it as Error
- **Fix:** Changed parameter type from `error: Error` to `error: unknown`, added type guards `error instanceof Error` for safe property access
- **Files modified:** app/components/ErrorBoundary/DeviceCardErrorBoundary.tsx
- **Commit:** 12e5f3d (part of Task 1)
- **Reason:** TypeScript strict mode requires proper type narrowing for unknown values

**2. [Rule 1 - Bug] Fixed TypeScript error with FallbackProps error property**
- **Found during:** Task 1 TypeScript verification
- **Issue:** error?.message failed TypeScript check because error property in FallbackProps is typed as unknown
- **Fix:** Changed from optional chaining to explicit instanceof check: `error instanceof Error ? error.message : 'fallback'`
- **Files modified:** app/components/ErrorBoundary/ErrorFallback.tsx
- **Commit:** 12e5f3d (part of Task 1)
- **Reason:** Matches react-error-boundary v6.1.0 types (error is unknown, not Error)

**3. [Rule 1 - Bug] Fixed TypeScript error in ParentBoundary test component**
- **Found during:** Task 2 TypeScript verification
- **Issue:** Test class component state type inference failed - TypeScript couldn't narrow `this.state.error` from null to Error
- **Fix:** Added explicit state type annotation: `state: { error: Error | null } = { error: null }`
- **Files modified:** __tests__/components/ErrorBoundary/DeviceCardErrorBoundary.test.tsx
- **Commit:** aa085ee (part of Task 2)
- **Reason:** Explicit type annotation required for class component state when using getDerivedStateFromError

**4. [Rule 2 - Critical] Added package.json and package-lock.json to Task 1 commit**
- **Found during:** Task 1 git status check
- **Issue:** react-error-boundary dependency was installed (prerequisite) but package.json changes weren't committed
- **Fix:** Staged package.json and package-lock.json with Task 1 commit
- **Files modified:** package.json, package-lock.json
- **Commit:** 12e5f3d (part of Task 1)
- **Reason:** Dependency changes must be committed to ensure reproducible builds

## Key Integration Points

1. **ErrorFallback → UI Design System** (app/components/ui)
   - Uses Card, Button, Heading, Text components for visual consistency
   - Ember Noir variant styling matches existing device cards
   - p-6 padding and space-y-4 spacing match device card dimensions

2. **DeviceCardErrorBoundary → ValidationError** (lib/errors)
   - instanceof ValidationError check re-throws error to bypass boundary
   - Allows safety-critical errors (maintenance required) to propagate
   - Prevents error boundaries from hiding blocking UI

3. **DeviceCardErrorBoundary → Error Logging API** (app/api/analytics/error)
   - Fire-and-forget POST to /api/analytics/error with device context
   - Logs all non-ValidationError crashes for monitoring
   - Never throws on fetch failure (prevents cascading failures)

4. **Homepage → Device Cards** (all 5 device types)
   - Each card independently wrapped in DeviceCardErrorBoundary
   - Crash in one card does not affect other cards
   - DEVICE_META provides device-specific names and icons for fallback UI

5. **Server Component → Client Component** (Next.js pattern)
   - page.tsx is Server Component (no 'use client')
   - DeviceCardErrorBoundary is Client Component ('use client')
   - Valid Next.js pattern: Server Components can render Client Components

## Technical Decisions

1. **react-error-boundary library over manual Error Boundary implementation**
   - Decision: Use react-error-boundary v6.1.0 instead of custom Error Boundary class
   - Rationale: Battle-tested library with proper hooks support, reset handling, and TypeScript types
   - Alternative considered: Manual class component with componentDidCatch (rejected as unmaintained pattern)

2. **Fallback device metadata (⚠️ icon, raw card.id)**
   - Decision: DEVICE_META[card.id]?.name ?? card.id provides defensive fallback
   - Rationale: Handles edge cases where new device types added without metadata update
   - Trade-off: Generic fallback vs. runtime error (chose graceful degradation)

3. **Fire-and-forget analytics logging**
   - Decision: Fetch errors in error logging are silently caught (.catch(() => {}))
   - Rationale: Error in error logger should never break the app or show UI to user
   - Impact: Some errors may go unlogged if analytics API is down (acceptable trade-off)

4. **Device metadata centralized in homepage**
   - Decision: DEVICE_META map lives in page.tsx, not in separate config file
   - Rationale: Small dataset (5 devices), tightly coupled to rendering logic
   - Alternative considered: lib/deviceMetadata.ts config file (rejected as over-engineering)

## Verification Results

All verification criteria met:

- ✅ `npx tsc --noEmit` passes with zero errors in new files (14 pre-existing errors in other files)
- ✅ `npx jest __tests__/components/ErrorBoundary/ --no-coverage` — 13 tests green (6 + 7)
- ✅ `app/page.tsx` imports DeviceCardErrorBoundary and wraps all 5 device card types
- ✅ Crash isolation verified via tests (BrokenComponent shows fallback, other cards unaffected)
- ✅ ValidationError bypass verified via tests (ParentBoundary catches re-thrown error)
- ✅ Error logging verified via tests (fetch called with correct body)
- ✅ Riprova button reset verified via tests (ToggleableComponent re-renders after reset)

**Test Results:**
```
Test Suites: 2 passed, 2 total
Tests:       13 passed, 13 total
Snapshots:   0 total
Time:        2.344 s
```

**File Verification:**
```
✓ app/components/ErrorBoundary/ErrorFallback.tsx
✓ app/components/ErrorBoundary/DeviceCardErrorBoundary.tsx
✓ app/components/ErrorBoundary/index.ts
✓ __tests__/components/ErrorBoundary/DeviceCardErrorBoundary.test.tsx
✓ __tests__/components/ErrorBoundary/ErrorFallback.test.tsx
```

**Homepage Integration:**
```
Line 13: import { DeviceCardErrorBoundary } from './components/ErrorBoundary';
Line 73: <DeviceCardErrorBoundary
Line 78: </DeviceCardErrorBoundary>
```

## Next Steps

**Phase 56 Plan 03** (if exists) will likely extend error boundaries to:
- Additional feature-level boundaries (forms, modals, data displays)
- Error recovery strategies (automatic retry, state reset)
- Error boundary telemetry dashboard

**Integration with existing features:**
- Device cards now crash-isolated - one card failure doesn't crash dashboard
- ValidationError from maintenance flow correctly bypasses boundaries
- All device card errors logged to Firebase Analytics for monitoring

## Commits

| Commit | Message | Files |
|--------|---------|-------|
| 12e5f3d | feat(56-02): create ErrorFallback and DeviceCardErrorBoundary components | 5 files (3 created, 2 modified) |
| aa085ee | feat(56-02): wrap homepage device cards with error boundaries and add tests | 3 files (2 created, 1 modified) |

## Self-Check: PASSED

All claimed files and commits verified:

**Files created:**
- ✓ app/components/ErrorBoundary/ErrorFallback.tsx exists
- ✓ app/components/ErrorBoundary/DeviceCardErrorBoundary.tsx exists
- ✓ app/components/ErrorBoundary/index.ts exists
- ✓ __tests__/components/ErrorBoundary/DeviceCardErrorBoundary.test.tsx exists
- ✓ __tests__/components/ErrorBoundary/ErrorFallback.test.tsx exists

**Files modified:**
- ✓ app/page.tsx modified (DeviceCardErrorBoundary import and wrapping)
- ✓ package.json modified (react-error-boundary dependency)
- ✓ package-lock.json modified (react-error-boundary lockfile)

**Commits:**
- ✓ 12e5f3d present in git log
- ✓ aa085ee present in git log

**Tests:**
- ✓ 13/13 tests passing
- ✓ 0 TypeScript errors in new files
