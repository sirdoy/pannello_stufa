# Phase 95: Tech Debt Cleanup - Research

**Researched:** 2026-03-18
**Domain:** React Compiler memoization removal + environment variable cleanup
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Memoization removal scope:**
- Remove ALL `useMemo` and `useCallback` calls from component and hook files — React Compiler 1.0 handles all 271 components transparently
- 137 occurrences across 38 files (30 in `app/`, 8 in `lib/hooks/`)
- Replace each with direct inline computation or function definition (no wrapper needed)
- Files with highest density: `useLightsData.ts` (22), `useLightsCommands.ts` (13), `useBackgroundSync.ts` (7)
- Debug/design-system pages included — React Compiler handles them too

**Env var cleanup scope:**
- Remove the 8 stale `HOMEASSISTANT_*` and `NETATMO_*` variables from `.env.local`
- Also clean `.env.example` or `.env.local.example` if they reference these vars
- Also clean any documentation that references these specific env vars
- Do NOT touch `NETATMO_ROUTES`, `NETATMO_CAMERA_API`, or `ERROR_CODES.NETATMO_*` — these are active code constants, not env vars

**Validation approach:**
- Remove all memoization at once (not incrementally) — React Compiler is a transparent replacement
- Run full test suite after removal to verify zero regressions
- No new tests needed — existing tests validate behavior unchanged

### Claude's Discretion
- Order of file processing (by directory, by density, alphabetical — any is fine)
- Whether to split into one plan or two (one per DEBT requirement)
- Inline computation style (keep variable name with direct assignment vs inline into JSX)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DEBT-01 | Remove manual useMemo/useCallback replaced by React Compiler | Confirmed 178 call-sites (50 useMemo + 128 useCallback) across 62 files; transformation pattern is mechanical find-and-remove; React Compiler 1.0 active in next.config.ts |
| DEBT-02 | Remove stale env vars from .env.local (8 HOMEASSISTANT_*/NETATMO_* vars) | Confirmed 8 stale vars present in .env.local; .env.example is already clean; source code has zero references to these vars; CHANGELOG.md and .planning/ files reference them but are historical docs, not active config |
</phase_requirements>

## Summary

Phase 95 is a pure cleanup phase with two independent concerns: removing manual memoization hooks made redundant by React Compiler 1.0, and deleting stale environment variables left in `.env.local` from the pre-v11.0 Netatmo/HomeAssistant OAuth integration.

Both concerns are mechanical: no new logic, no new tests, no new files. The memoization removal is a find-and-remove operation on 62 files totaling ~178 call-sites. The env var cleanup is a direct edit to `.env.local` only — `.env.example` is already clean, and no source code references the stale vars.

React Compiler 1.0 is already active (`reactCompiler: true` in `next.config.ts`). It operates at compile time as a Babel plugin, automatically inserting memoization boundaries where needed. Manual `useMemo`/`useCallback` wrappers are genuinely redundant — removing them does not change runtime semantics. Imports of `useMemo`/`useCallback` from React must also be cleaned up where they become unused after removal.

**Primary recommendation:** Split into two plans — one per DEBT requirement. Plan 1 handles memoization removal across all 62 files. Plan 2 handles env var deletion from `.env.local`.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React Compiler | 1.0 (babel-plugin-react-compiler) | Auto-memoization at compile time | Active since Phase 71 — already handles all 271 components |
| Next.js | 15.5 | Framework (reactCompiler flag) | Project standard |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Jest | current | Unit test runner | Verify zero regressions after memoization removal |

### Alternatives Considered
None. No new libraries are needed; this is removal work only.

**Installation:** None required. No new packages.

## Architecture Patterns

### Recommended Project Structure
No structural changes. Files are edited in-place.

### Pattern 1: useMemo Removal
**What:** Replace `useMemo(() => computation, [deps])` with a plain `const` assignment.
**When to use:** Every `useMemo` call in non-test component and hook files.
**Example:**
```typescript
// BEFORE
const selectedRoom = useMemo(() => {
  return rooms.find(r => r.id === selectedRoomId) || rooms[0];
}, [rooms, selectedRoomId]);

// AFTER
const selectedRoom = rooms.find(r => r.id === selectedRoomId) || rooms[0];
```

### Pattern 2: useCallback Removal
**What:** Replace `useCallback((args) => body, [deps])` with a plain `const` arrow function.
**When to use:** Every `useCallback` call in non-test component and hook files.
**Example:**
```typescript
// BEFORE
const handleRoomToggle = useCallback(
  (roomId: string) => {
    setSelectedRoomId(roomId);
  },
  [setSelectedRoomId]
);

// AFTER
const handleRoomToggle = (roomId: string) => {
  setSelectedRoomId(roomId);
};
```

### Pattern 3: Import Cleanup
**What:** After removing all useMemo/useCallback calls in a file, remove those names from the React import.
**When to use:** Any file where no remaining usage of the hook exists.
**Example:**
```typescript
// BEFORE (useMemo removed, still in import)
import { useState, useEffect, useMemo } from 'react';

// AFTER
import { useState, useEffect } from 'react';
```

If `useMemo` or `useCallback` was the ONLY import, remove the entire import line.

### Pattern 4: Env Var Deletion
**What:** Remove specific key=value lines from `.env.local`.
**When to use:** The 8 stale vars identified below.
**Example (lines to delete):**
```
HOMEASSISTANT_API_URL="..."
HOMEASSISTANT_USER="..."
HOMEASSISTANT_PASSWORD="..."
NETATMO_CLIENT_ID="..."
NETATMO_CLIENT_SECRET="..."
NETATMO_REDIRECT_URI="..."
NEXT_PUBLIC_NETATMO_CLIENT_ID="..."
NEXT_PUBLIC_NETATMO_REDIRECT_URI="..."
```

### Anti-Patterns to Avoid
- **Removing useMemo/useCallback from test files:** Test files mock hooks — do not touch `.test.ts` or `.test.tsx` files.
- **Removing `useRef`, `useState`, `useEffect`:** Only `useMemo` and `useCallback` are targets. Leave all other hooks untouched.
- **Removing env vars from `.env.example`:** It is already clean (confirmed). Editing it is unnecessary.
- **Removing `NETATMO_ROUTES`, `NETATMO_CAMERA_API`, or `ERROR_CODES.NETATMO_*`:** These are active code constants in TypeScript files, not environment variables.
- **Touching `.planning/` or `CHANGELOG.md` references:** Historical documents retain the references for traceability — do not edit them.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Memoization | Manual useMemo/useCallback | React Compiler 1.0 | Already active; duplicating its work wastes bundle bytes and confuses future maintainers |
| Regex-based AST edits | sed/awk multi-line replacement | Direct file editing with Read+Edit tools | Memoization calls span multiple lines with arbitrary bodies; line-by-line regex is error-prone |

**Key insight:** React Compiler inserts memoization at the IR level, not the source level. Manual `useMemo`/`useCallback` do not compound with compiler memoization — they add redundant wrapping. Removal is semantically safe.

## Common Pitfalls

### Pitfall 1: Multi-line useMemo/useCallback Bodies
**What goes wrong:** A naive single-line replacement misses calls whose body spans 5-20 lines.
**Why it happens:** Many useMemo calls in `useLightsData.ts` contain multi-line filter/map chains.
**How to avoid:** For each occurrence, read the full block (from opening paren through closing `}, [deps])`) and replace the entire block — not just the first line.
**Warning signs:** TypeScript errors like "unexpected token" or mismatched braces after edit.

### Pitfall 2: Unused Import Left Behind
**What goes wrong:** `useMemo` is removed from call sites but left in the import — TypeScript strict mode will flag it as an unused import (or ESLint will warn).
**Why it happens:** Editors and humans forget to update import lines.
**How to avoid:** After processing each file, verify the import line no longer lists `useMemo` or `useCallback` if those hooks had no remaining usages.
**Warning signs:** TypeScript `'useMemo' is declared but its value is never read` error.

### Pitfall 3: useCallback with Async Body
**What goes wrong:** `useCallback(async () => { ... }, [deps])` converted to `const fn = async () => { ... }` loses nothing semantically, but the implementer might forget `async`.
**Why it happens:** The keyword lives after `useCallback(`, not at the start of the line.
**How to avoid:** When replacing, check if the callback function body starts with `async` and preserve it.
**Warning signs:** TypeScript error: "await used in non-async function."

### Pitfall 4: Tests Spy on Specific Hook Returns
**What goes wrong:** A test mocks `useMemo` or `useCallback` directly (very rare in this codebase). After removal from source, the mock is testing nothing.
**Why it happens:** Framework-level mocking of React internals.
**How to avoid:** Before removing from a file, check its corresponding test file for any `jest.mock` of `useMemo`/`useCallback`. (This is not present in this codebase based on current test patterns, but worth confirming.)
**Warning signs:** Test suddenly passes trivially — no assertions fire.

### Pitfall 5: Stale Env Var Still Referenced in Active Code
**What goes wrong:** Removing an env var that is still consumed by some code path causes a runtime error.
**Why it happens:** Migration left a stray reference.
**How to avoid:** Grep the source before deleting. Confirmed: zero references to `HOMEASSISTANT_*`, `NETATMO_CLIENT_ID`, `NETATMO_CLIENT_SECRET`, `NETATMO_REDIRECT_URI`, `NEXT_PUBLIC_NETATMO_CLIENT_ID`, `NEXT_PUBLIC_NETATMO_REDIRECT_URI` exist in `app/` or `lib/`.
**Warning signs:** Runtime 500 error or `undefined` env var log after deletion.

## Code Examples

Verified patterns from codebase inspection:

### Highest-Density File Sample: useLightsData.ts (21 useMemo calls)
```typescript
// Source: app/components/devices/lights/hooks/useLightsData.ts (lines 258-313)
// Current (to remove):
const selectedRoom = useMemo(() => {
  return rooms.find(r => r.id === selectedRoomId) || rooms[0];
}, [rooms, selectedRoomId]);

// Replacement:
const selectedRoom = rooms.find(r => r.id === selectedRoomId) || rooms[0];
```

### useCallback with Dependencies: useLightsCommands.ts
```typescript
// Source: app/components/devices/lights/hooks/useLightsCommands.ts
// Current (to remove):
const handleRoomToggle = useCallback(
  async (roomId: string, currentlyOn: boolean) => {
    // ... body ...
  },
  [selectedRoomId, handleCommand]
);

// Replacement (drop wrapper, keep async, drop deps array):
const handleRoomToggle = async (roomId: string, currentlyOn: boolean) => {
  // ... body ...
};
```

### Import Cleanup Example
```typescript
// BEFORE: useMemo and useCallback both present
import { useState, useEffect, useRef, useMemo } from 'react';

// AFTER: only useMemo was used, now removed entirely
import { useState, useEffect, useRef } from 'react';
```

## File Inventory

### Files by Occurrence Count (useMemo + useCallback, non-import lines)
Confirmed by codebase grep:

| File | Count | Primary Hook |
|------|-------|--------------|
| `app/components/devices/lights/hooks/useLightsData.ts` | 21 | useMemo |
| `app/components/devices/lights/hooks/useLightsCommands.ts` | 12 | useCallback |
| `app/components/ui/DataTable.tsx` | 9 | useMemo + useCallback |
| `app/components/devices/stove/hooks/useStoveCommands.ts` | 9 | useCallback |
| `app/components/ui/ToastProvider.tsx` | 7 | useCallback |
| `lib/hooks/useBackgroundSync.ts` | 6 | useCallback |
| `app/components/devices/network/hooks/useNetworkData.ts` | 6 | useMemo + useCallback |
| `app/network/components/DeviceListTable.tsx` | 5 | useMemo |
| `app/stove/page.tsx` | 4 | useCallback |
| `app/components/ui/FormModal.tsx` | 4 | useMemo + useCallback |
| `app/components/ui/DataTableToolbar.tsx` | 4 | useCallback |
| (49 more files with 1-3 occurrences each) | ~87 | mixed |

**Total call-site occurrences:** ~178 (50 useMemo + 128 useCallback)
**Total files to edit:** 62

### Env Vars to Delete from .env.local
Confirmed present by direct inspection:

| Variable | Was Used For |
|----------|--------------|
| `HOMEASSISTANT_API_URL` | Pre-v11.0 HA direct connection |
| `HOMEASSISTANT_USER` | Pre-v11.0 HA auth |
| `HOMEASSISTANT_PASSWORD` | Pre-v11.0 HA auth |
| `NETATMO_CLIENT_ID` | Pre-v10.0 Netatmo OAuth |
| `NETATMO_CLIENT_SECRET` | Pre-v10.0 Netatmo OAuth |
| `NETATMO_REDIRECT_URI` | Pre-v10.0 Netatmo OAuth |
| `NEXT_PUBLIC_NETATMO_CLIENT_ID` | Pre-v10.0 Netatmo OAuth (client-side) |
| `NEXT_PUBLIC_NETATMO_REDIRECT_URI` | Pre-v10.0 Netatmo OAuth (client-side) |

**.env.example status:** Already clean — none of these 8 vars are present. No edit needed.
**Source code status:** Zero references confirmed by grep across `app/` and `lib/`.
**Docs status:** No references in `docs/`. References in `.planning/` and `CHANGELOG.md` are historical and must NOT be edited.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual `useMemo`/`useCallback` for perf | React Compiler 1.0 auto-memoization | Phase 71 (v9.0) | Manual hooks are now dead weight |
| Direct HA/Netatmo OAuth env vars | Shared `haClient` with `HA_API_URL`/`HA_API_KEY` | v10.0 + v11.0 | Old vars unused in source |

**Deprecated/outdated:**
- `useMemo`/`useCallback` for memoization: redundant since React Compiler 1.0 was enabled; should not be written in new code going forward.
- `HOMEASSISTANT_*` vars: replaced by `HA_API_URL` + `HA_API_KEY` in v11.0.
- `NETATMO_CLIENT_ID/SECRET/REDIRECT` vars: OAuth flow replaced by HA proxy in v10.0.

## Open Questions

None. Both tasks are fully bounded by codebase inspection. No ambiguity remains.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (current) |
| Config file | `jest.config.ts` |
| Quick run command | `npm test -- --testPathPattern="useLightsData|useLightsCommands|useStoveCommands|useBackgroundSync" --passWithNoTests` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DEBT-01 | Memoization removal causes zero test regressions | integration (existing suite) | `npm test` | Yes — existing tests cover all affected hooks/components |
| DEBT-02 | Stale env vars absent from .env.local | manual verify | `grep "HOMEASSISTANT_\|NETATMO_CLIENT" .env.local` | N/A — file not in git |

### Sampling Rate
- **Per task commit:** `npm test -- --testPathPattern="<affected_file_basename>" --passWithNoTests`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
None — existing test infrastructure covers all phase requirements. No new test files needed.

## Sources

### Primary (HIGH confidence)
- Direct codebase grep — `useMemo`/`useCallback` occurrence counts and file list (live code, 2026-03-18)
- `next.config.ts` — `reactCompiler: true` confirmed active
- `.env.local` — 8 stale vars confirmed present by direct file read
- `.env.example` — confirmed clean, no stale vars
- `.planning/milestones/v11.0-MILESTONE-AUDIT.md` — canonical list of 8 stale env vars
- CONTEXT.md — locked decisions and scope

### Secondary (MEDIUM confidence)
- Phase 71 MEMORY.md entry — React Compiler 1.0 on 271/271 components, zero regressions
- `docs/testing.md` — `npm test` command confirmed

### Tertiary (LOW confidence)
None — all claims backed by primary sources.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — confirmed by `next.config.ts` and live grep
- File inventory: HIGH — produced by live grep, not training data estimates
- Env var scope: HIGH — confirmed by direct `.env.local` read and source grep returning zero matches
- Architecture: HIGH — patterns derived from actual file content

**Research date:** 2026-03-18
**Valid until:** 2026-04-18 (stable — no external dependencies changing)
