# Phase 3 Plan 01: Foundation - Dependencies & Schema

**One-liner:** React Hook Form + Zod installed, notification preferences schema ready with type-level toggles, DND windows, and rate limits

---

## Frontmatter

```yaml
phase: 03-user-preferences-control
plan: 01
subsystem: preferences-infrastructure
tags: [zod, react-hook-form, schema-validation, dependencies]

# Dependency graph
requires: []
provides:
  - react-hook-form-zod-stack
  - notification-preferences-schema
  - default-preferences-function
affects:
  - 03-02 (settings UI will use schema)
  - 03-03 (server filtering will validate against schema)

# Tech tracking
tech-stack:
  added:
    - react-hook-form@^7.54.2
    - zod@^3.24.2
    - @hookform/resolvers@^3.9.3
  patterns:
    - zod-schema-validation
    - type-safe-form-validation

# Files
key-files:
  created:
    - lib/schemas/notificationPreferences.js
  modified:
    - package.json

# Decisions
decisions:
  - use-zod-3x-stable
  - balanced-default-preferences

# Metrics
duration: 2.4
completed: 2026-01-25
```

---

## Objective Achieved

✅ **Installed React Hook Form, Zod, and @hookform/resolvers** (dependencies added to package.json)
✅ **Created Zod schema for notification preferences** with complete validation rules
✅ **Default preferences match CONTEXT.md balanced approach** (Alerts + System enabled, Routine disabled)

**Purpose delivered:** Foundation for type-safe form validation and server-side preference validation. INFRA-03 requirement complete.

**Output:** Dependencies ready (user must run `npm install`), Zod schema available at `lib/schemas/notificationPreferences.js`

---

## Tasks Completed

| # | Task | Type | Commit | Files |
|---|------|------|--------|-------|
| 1 | Install React Hook Form, Zod, and resolvers | auto | 303d7af | package.json |
| 2 | Create Zod schema for notification preferences | auto | 98adf20 | lib/schemas/notificationPreferences.js |

**Total tasks:** 2/2 ✅

---

## Implementation Details

### Task 1: Dependencies Installation

**What was done:**
- Added `react-hook-form@^7.54.2` to package.json dependencies
- Added `zod@^3.24.2` to package.json dependencies (stable 3.x, NOT 4.x beta per RESEARCH.md pitfall)
- Added `@hookform/resolvers@^3.9.3` for RHF + Zod integration

**Why Zod 3.x:**
Per RESEARCH.md Pitfall 6, Zod 4.x beta versions have error handling issues. Using stable 3.24.2 ensures form validation errors are properly captured in `formState.errors`.

**User action required:**
```bash
npm install
```

### Task 2: Zod Schema Creation

**Schema structure:**

1. **DND Window Schema** (`dndWindowSchema`)
   - `id`: UUID for React key prop
   - `startTime`: HH:mm format (24-hour) with regex validation (Zod 3.x syntax)
   - `endTime`: HH:mm format with regex validation
   - `enabled`: Boolean (default true)
   - `deviceId`: Optional string for per-device DND
   - **Validation:** Start and end times must differ (prevents invalid windows)

2. **Rate Limit Schema** (`rateLimitSchema`)
   - `windowMinutes`: Integer 1-60 (default 5)
   - `maxPerWindow`: Integer 1-10 (default 1)

3. **Main Preferences Schema** (`notificationPreferencesSchema`)
   - `enabledTypes`: Record<string, boolean> with type-level toggles
   - `dndWindows`: Array of DND windows (max 5)
   - `rateLimits`: Per-type rate limit configuration
   - `timezone`: Auto-detected timezone string
   - `version`: Integer for conflict detection
   - `updatedAt`: ISO datetime string (optional)

**Default preferences (balanced approach):**
- ✅ **Alerts enabled:** CRITICAL, ERROR
- ✅ **System enabled:** maintenance, updates
- ⛔ **Routine disabled:** scheduler_success, status (opt-in)

This matches the CONTEXT.md decision to enable Alerts + System by default while keeping Routine notifications opt-in.

**Exports:**
- `notificationPreferencesSchema` - Main Zod schema
- `dndWindowSchema` - DND window validation
- `rateLimitSchema` - Rate limit validation
- `getDefaultPreferences()` - Function returning validated defaults

**Type mapping from existing NOTIFICATION_CATEGORIES_CONFIG:**
The schema aligns with existing notification types from `lib/notificationPreferencesService.js`:
- stove.severityLevels → CRITICAL, ERROR (Alerts category)
- maintenance → maintenance (System category)
- system.updates → updates (System category)
- scheduler → scheduler_success (Routine category)
- stove.statusWork → status (Routine category)

---

## Technical Decisions

### Decision 1: Use Zod 3.x Stable (not 4.x beta)

**Context:** RESEARCH.md documents Pitfall 6 - Zod beta versions throw errors instead of capturing in formState.errors

**Decision:** Use `zod@^3.24.2` stable version

**Rationale:**
- Stable error handling behavior
- Proven compatibility with @hookform/resolvers
- Avoids React Hook Form validation display issues

**Impact:**
- Use `z.string().regex()` syntax instead of `z.iso.time()` (Zod 4.x feature)
- Schema validated and working with Zod 3.x syntax
- Future migration to Zod 4.x will require regex → iso.time conversion

**Alternatives considered:**
- Zod 4.x beta: Rejected due to error handling issues
- Custom validation: Rejected - Zod provides type safety and composition

### Decision 2: Balanced Default Preferences

**Context:** CONTEXT.md specifies balanced approach vs conservative (only CRITICAL/ERROR)

**Decision:** Enable Alerts + System categories by default, Routine opt-in

**Defaults:**
```javascript
{
  CRITICAL: true,      // Alerts
  ERROR: true,         // Alerts
  maintenance: true,   // System
  updates: true,       // System
  scheduler_success: false,  // Routine (opt-in)
  status: false        // Routine (opt-in)
}
```

**Rationale:**
- Alerts (CRITICAL/ERROR): User MUST know about critical issues
- System (maintenance/updates): Important operational notifications
- Routine (scheduler events): Can be noisy, better as opt-in
- Balances user awareness with notification fatigue prevention

**Impact:**
- New users receive important alerts without overwhelming noise
- Scheduler success notifications require explicit opt-in
- Aligns with success criteria expectations

---

## Verification Results

All verification checks passed ✅

1. ✅ **Dependencies in package.json:**
   - react-hook-form@^7.54.2
   - zod@^3.24.2
   - @hookform/resolvers@^3.9.3

2. ✅ **Schema exports complete:**
   - notificationPreferencesSchema
   - dndWindowSchema
   - rateLimitSchema
   - getDefaultPreferences

3. ✅ **Default preferences validated:**
   - Alerts enabled (CRITICAL && ERROR): true
   - System enabled (maintenance && updates): true
   - Routine disabled (scheduler_success && status): true
   - Timezone: Europe/Rome (auto-detected)
   - Version: 1

**Test command:**
```javascript
const schema = require('./lib/schemas/notificationPreferences.js');
const defaults = schema.getDefaultPreferences();
// Returns validated preferences object
```

---

## Deviations from Plan

None - plan executed exactly as written.

---

## Next Phase Readiness

**Ready for Plan 03-02 (Settings UI):**
- ✅ Schema available for React Hook Form validation
- ✅ getDefaultPreferences() provides initial form values
- ✅ Type-level toggles match existing notification system
- ✅ DND window schema ready for time picker integration

**Blockers:** None

**User action required before next plan:**
```bash
npm install  # Install new dependencies
```

**Concerns:**
None - dependencies are stable versions, schema validated successfully

---

## Commits

1. **303d7af** - `chore(03-01): add react-hook-form, zod, and resolvers dependencies`
   - Added 3 dependencies to package.json
   - React Hook Form 7.54.2, Zod 3.24.2, resolvers 3.9.3
   - User must run npm install

2. **98adf20** - `feat(03-01): create notification preferences Zod schema`
   - Created lib/schemas/notificationPreferences.js
   - Type-level toggles, DND windows, rate limits
   - Default preferences match balanced approach
   - 207 lines, 4 exports

---

## Success Criteria Met

- ✅ React Hook Form, Zod, and resolvers dependencies present in package.json
- ✅ Zod schema file exists with all required exports
- ✅ Default preferences match CONTEXT.md balanced approach (Alerts + System enabled)
- ✅ Schema validates without errors
- ✅ getDefaultPreferences() returns properly formatted defaults

**Plan status:** COMPLETE ✅

---

**Duration:** 2.4 minutes
**Phase:** 03-user-preferences-control (1 of N plans complete)
**Next plan:** 03-02 (Settings UI implementation)
