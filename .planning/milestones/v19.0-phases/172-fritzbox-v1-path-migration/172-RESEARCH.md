# Phase 172: Fritz!Box v1 Path Migration - Research

**Researched:** 2026-04-24
**Domain:** Next.js App Router route relocation + consumer URL retargeting (pure rename, no behavioral change)
**Confidence:** HIGH

---

## Summary

Phase 172 is a pure path rename: move every route file from `app/api/fritzbox/**` to `app/api/v1/fritzbox/**` and retarget every URL string that references `/api/fritzbox/` to `/api/v1/fritzbox/`. There are no v1 fritzbox routes yet (unlike Hue/Sonos/Netatmo/DIRIGERA, which had v1 routes created in gap-closure phases before the old tree was deleted). Here the move IS the creation of the v1 surface.

The scope is well-defined: 28 production `route.ts` files + 20 co-located test files travel atomically via `git mv`; then 35 consumer files (production hooks, debug panels, page components, hook tests) need their URL strings updated. There are no dynamic route segments (`[param]`), no middleware matchers, no `lib/routes.ts` or `app/sw.ts` Fritz entries — the blast radius is entirely within `app/` and `app/components/`.

The playbook from Phase 164 (thermorossi) and Phase 169 (DIRIGERA) applies directly: `git mv` the whole tree atomically, then sweep consumers in a second commit. The key difference from other providers (Hue/Sonos) is that there is no "old v1 tree to delete" step — the `git mv` produces the v1 surface from scratch.

**Primary recommendation:** Plan 1 = `git mv app/api/fritzbox app/api/v1/fritzbox` (atomic, preserves history for 48 files); Plan 2 = sweep all 35 consumer files (hooks, pages, debug, tests) to replace `/api/fritzbox/` with `/api/v1/fritzbox/`; Plan 3 = repo-wide grep verification + scoped Jest + Playwright smoke.

---

## Project Constraints (from CLAUDE.md)

- **NEVER** run `npm run build` or `npm install`
- **NEVER** commit/push without explicit user request
- **ALWAYS** create/update unit tests when changing production code
- **USE** scoped test subsets (`npm test -- <path>` or `test:changed`, `test:quick`, `test:api`, `test:components`, `test:pages`). **NEVER** `npm test` alone from agents or PLAN.md `<verify><automated>` blocks
- **PREFER** editing existing files over creating new
- **USE** design system from `/debug/design-system`

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FRITZ-01 | GET /api/v1/fritzbox/telephony/dect returns registered DECT handsets | Route exists at `/api/fritzbox/telephony/dect/route.ts`; after `git mv`, served from `/api/v1/fritzbox/telephony/dect`. Hook `useFritzDectHandsets` retargeted in Plan 2. |
| FRITZ-02 | GET /api/v1/fritzbox/telephony/calls returns paginated call history | Route at `/api/fritzbox/telephony/calls/route.ts`; hook `useFritzCallHistory` retargeted in Plan 2. |
| FRITZ-03 | GET /api/v1/fritzbox/telephony/tam returns answering machine state | Route at `/api/fritzbox/telephony/tam/route.ts`; hook `useFritzTamStatus` retargeted in Plan 2. |
| FRITZ-04 | GET /api/v1/fritzbox/history/bandwidth returns raw bandwidth history | Route at `/api/fritzbox/history/bandwidth/route.ts`; hook `useFritzBandwidthHistoryRaw` retargeted in Plan 2. |
| FRITZ-05 | GET /api/v1/fritzbox/history/devices returns raw device presence history | Route at `/api/fritzbox/history/devices/route.ts` (404-graceful per phase 162 D-05); hook `useFritzDevicePresenceHistory` retargeted in Plan 2. |
| FRITZ-06 | GET /api/v1/fritzbox/history/device-events returns join/leave event log | Route at `/api/fritzbox/history/device-events/route.ts`; hook `useFritzDeviceEventsRaw` retargeted in Plan 2. |
| FRITZ-07 | GET /api/v1/fritzbox/service-discovery returns TR-064 service descriptor | Route at `/api/fritzbox/service-discovery/route.ts`; hook `useFritzServiceDiscovery` retargeted in Plan 2. |
</phase_requirements>

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Route file relocation | API / Backend (Next.js route files) | — | `git mv` operates on filesystem; Next.js discovers routes by directory structure automatically |
| Consumer URL retargeting | Browser / Client (hooks, pages) | Frontend Server (debug panels) | All consumers are client-side hooks and client-rendered pages; `fetch()` strings are client-tier |
| Test assertion updates | Test layer (co-located + external) | — | Jest tests assert on URL strings that hooks pass to `fetch()`; must mirror production changes |
| Verification sweep | CI / Tooling | — | `grep` proves zero legacy refs; Jest + Playwright proves nothing broke |

---

## Standard Stack

No new dependencies. All tools already in use.

| Tool | Purpose |
|------|---------|
| `git mv` | Atomic directory rename preserving history |
| `npm test -- <path>` | Scoped Jest execution |
| `grep -rn "/api/fritzbox/"` | Verification sweep |
| `npx playwright test tests/smoke/page-loads.spec.ts --list` | Playwright smoke check |

---

## Architecture Patterns

### System Architecture Diagram

```
app/api/fritzbox/**          →  (git mv)  →  app/api/v1/fritzbox/**
     (28 route.ts                                  (28 route.ts
      + 20 test files)                              + 20 test files)
          ↓                                               ↓
  Consumer fetch() calls              →   updated fetch() calls
  "/api/fritzbox/..."                     "/api/v1/fritzbox/..."
  (35 consumer files)                     (35 consumer files)
          ↓                                               ↓
  Jest tests assert                   →   Jest tests assert
  "/api/fritzbox/..."                     "/api/v1/fritzbox/..."
  (14 test files with URL assertions)
```

### Recommended Execution Structure

Three plans, sequenced:

```
Plan 1: git mv (route tree + co-located tests)
Plan 2: sweep 35 consumer files (hooks, pages, debug, test assertions)
Plan 3: verification (grep sweep + scoped Jest + Playwright smoke)
```

Plans 1 and 2 can be committed independently. Plan 3 is the gate before phase is approved.

---

## Exhaustive File Inventory

### Route Tree (Plan 1 scope)

28 production `route.ts` files + 20 co-located `*.test.ts` files = **48 files total** moved atomically by `git mv app/api/fritzbox app/api/v1/fritzbox`.

**Production routes:**
```
app/api/fritzbox/
├── bandwidth-history/route.ts
├── bandwidth/route.ts
├── budget-stats/route.ts
├── category-override/route.ts
├── debug/route.ts
├── devices/route.ts
├── health/route.ts
├── history/
│   ├── route.ts
│   ├── bandwidth/
│   │   ├── route.ts
│   │   ├── auto/route.ts
│   │   ├── daily/route.ts
│   │   └── hourly/route.ts
│   ├── device-events/route.ts
│   └── devices/
│       ├── route.ts
│       └── daily/route.ts
├── network/
│   ├── dhcp/reservations/route.ts
│   ├── mesh/route.ts
│   ├── port-forwarding/route.ts
│   └── upnp/route.ts
├── service-discovery/route.ts
├── system/route.ts
├── telephony/
│   ├── calls/route.ts
│   ├── dect/route.ts
│   └── tam/route.ts
├── vendor-lookup/route.ts
├── wan/route.ts
└── wifi/
    ├── clients/route.ts
    └── networks/route.ts
```

**Co-located test files (travel with `git mv`):**
```
app/api/fritzbox/
├── __tests__/
│   ├── devices-events.test.ts   (imports ../devices/route — stays valid after mv)
│   └── history.test.ts          (imports ../history/route — stays valid after mv)
├── bandwidth/__tests__/route.test.ts
├── budget-stats/__tests__/route.test.ts
├── category-override/__tests__/route.test.ts
├── devices/__tests__/route.test.ts
├── health/__tests__/route.test.ts
├── history/bandwidth/__tests__/route.test.ts
├── history/bandwidth/auto/__tests__/route.test.ts
├── history/bandwidth/daily/__tests__/route.test.ts
├── history/bandwidth/hourly/__tests__/route.test.ts
├── history/device-events/__tests__/route.test.ts
├── history/devices/__tests__/route.test.ts
├── history/devices/daily/__tests__/route.test.ts
├── service-discovery/__tests__/route.test.ts
├── telephony/calls/__tests__/route.test.ts
├── telephony/dect/__tests__/route.test.ts
├── telephony/tam/__tests__/route.test.ts
├── vendor-lookup/__tests__/route.test.ts
└── wan/__tests__/route.test.ts
```

**Note on co-located relative imports:** All 20 test files use `from '../route'` or `from '../devices/route'`. These paths remain correct after `git mv` because the relative relationship between test and source is preserved atomically. **No test file path-string updates are needed for the route tests themselves** — only the URL assertion strings change in the consumer hook tests (Plan 2 scope). [VERIFIED: codebase grep]

**Note on route imports:** All 28 `route.ts` files use only `@/lib/...` absolute imports — no relative imports. `git mv` produces zero broken imports in production routes. [VERIFIED: codebase grep]

**Note on `export const dynamic`:** All 28 `route.ts` files declare `export const dynamic = 'force-dynamic'`. No missing declarations to add. [VERIFIED: python scan]

---

### Consumer Files (Plan 2 scope)

**35 non-route files** referencing `/api/fritzbox/` that need their URL strings updated to `/api/v1/fritzbox/`.

#### Production Hooks (need URL string update):

| File | URLs to retarget | FRITZ req |
|------|------------------|-----------|
| `app/telefonia/hooks/useFritzDectHandsets.ts` | `/api/fritzbox/telephony/dect` (line 48) | FRITZ-01 |
| `app/telefonia/hooks/useFritzCallHistory.ts` | `/api/fritzbox/telephony/calls` (line 56) + JSDoc line 26 | FRITZ-02 |
| `app/telefonia/hooks/useFritzTamStatus.ts` | `/api/fritzbox/telephony/tam` (line 43) + JSDoc line 22 | FRITZ-03 |
| `app/network/hooks/useFritzBandwidthHistoryRaw.ts` | `/api/fritzbox/history/bandwidth` (line 72) + JSDoc lines 8, 44 | FRITZ-04 |
| `app/network/hooks/useFritzDevicePresenceHistory.ts` | `/api/fritzbox/history/devices` (line 68) + JSDoc lines 8, 39 | FRITZ-05 |
| `app/network/hooks/useFritzDeviceEventsRaw.ts` | `/api/fritzbox/history/device-events` (line 66) + JSDoc lines 8, 40 | FRITZ-06 |
| `app/debug/hooks/useFritzServiceDiscovery.ts` | `/api/fritzbox/service-discovery` (line 37) + JSDoc line 6 | FRITZ-07 |
| `app/network/hooks/useFritzBandwidthTiers.ts` | `/api/fritzbox/history/bandwidth/auto` (line 88), `/hourly` (line 111), `/daily` (line 112) | — |
| `app/network/hooks/useFritzBudgetStats.ts` | `/api/fritzbox/budget-stats` (line 35) | — |
| `app/network/hooks/useFritzDeviceCountHistory.ts` | `/api/fritzbox/history/devices/daily` (line 58) + JSDoc line 41 | — |
| `app/network/hooks/useFritzNetworkServices.ts` | `/api/fritzbox/network/dhcp/reservations`, `/port-forwarding`, `/upnp`, `/mesh` (lines 102-105) | — |
| `app/network/hooks/useFritzSystemInfo.ts` | `/api/fritzbox/system` (line 39) + JSDoc line 20 | — |
| `app/network/hooks/useFritzWifiClients.ts` | `/api/fritzbox/wifi/clients` (line 61) + JSDoc line 27 | — |
| `app/network/hooks/useFritzWifiNetworks.ts` | `/api/fritzbox/wifi/networks` (line 47) + JSDoc line 24 | — |
| `app/network/hooks/useBandwidthHistory.ts` | `/api/fritzbox/bandwidth-history` (line 49) | — |
| `app/network/hooks/useDeviceHistory.ts` | `/api/fritzbox/history` (line 42) | — |
| `app/components/devices/network/hooks/useNetworkData.ts` | `/api/fritzbox/bandwidth-history` (L84), `/vendor-lookup` (L136), `/bandwidth` (L276), `/devices` (L277), `/wan` (L278) | — |

#### Production Pages / Components (need URL string update):

| File | URLs to retarget |
|------|-----------------|
| `app/network/page.tsx` | `/api/fritzbox/category-override` (line 147) |
| `app/registry/devices/page.tsx` | `/api/fritzbox/devices` (line 164) |
| `app/debug/components/tabs/NetworkTab.tsx` | 37 occurrences across health, devices, bandwidth, wan, bandwidth-history, history, vendor-lookup, category-override URLs |

#### Test Files with URL Assertions (need URL string update — NOT file relocation):

| File | Assertions to update |
|------|---------------------|
| `app/telefonia/hooks/__tests__/useFritzDectHandsets.test.ts` | `toBe('/api/fritzbox/telephony/dect')` (L60) |
| `app/telefonia/hooks/__tests__/useFritzCallHistory.test.ts` | `toContain('/api/fritzbox/telephony/calls')` (L62) |
| `app/telefonia/hooks/__tests__/useFritzTamStatus.test.ts` | `toBe('/api/fritzbox/telephony/tam')` (L46) |
| `app/network/hooks/__tests__/useFritzBandwidthHistoryRaw.test.ts` | `toContain('/api/fritzbox/history/bandwidth')` (L94) |
| `app/network/hooks/__tests__/useFritzBandwidthTiers.test.ts` | 4 assertions (L100, L119, L213, L229) |
| `app/network/hooks/__tests__/useFritzBudgetStats.test.ts` | 2 refs (L31 desc, L43 assertion) |
| `app/network/hooks/__tests__/useFritzDeviceCountHistory.test.ts` | 3 refs (L43 desc, L57, L156) |
| `app/network/hooks/__tests__/useFritzDeviceEventsRaw.test.ts` | `toContain('/api/fritzbox/history/device-events')` (L107) |
| `app/network/hooks/__tests__/useFritzDevicePresenceHistory.test.ts` | `toContain('/api/fritzbox/history/devices')` (L102) |
| `app/network/hooks/__tests__/useFritzNetworkServices.test.ts` | 4 `toContain` assertions (L78-L81) |
| `app/network/hooks/__tests__/useFritzSystemInfo.test.ts` | 2 refs (L43 desc, L52 assertion) |
| `app/network/hooks/__tests__/useFritzWifiClients.test.ts` | `toContain('/api/fritzbox/wifi/clients')` (L63) |
| `app/network/hooks/__tests__/useFritzWifiNetworks.test.ts` | 2 refs (L64 desc, L76 assertion) |
| `app/network/hooks/__tests__/useDeviceHistory.test.ts` | 5 `toHaveBeenCalledWith` assertions (L48, L67, L75, L93, L101) |

#### Files NOT Needing URL Updates:

| File | Reason |
|------|--------|
| `lib/routes.ts` | No Fritz references found [VERIFIED] |
| `app/sw.ts` | No Fritz references found [VERIFIED] |
| `app/debug/components/tabs/FritzboxServiceDiscoveryTab.test.tsx` | Mocks hook, no `/api/` URL strings [VERIFIED] |
| `app/debug/hooks/__tests__/useFritzServiceDiscovery.test.ts` | No `/api/` strings — uses mocked fetch pattern [VERIFIED] |
| `app/components/devices/network/__tests__/useNetworkData.test.ts` | Contains `'fritzbox'` only as WS topic string and error code constant — not a URL path [VERIFIED] |
| `docs/setup/fritzbox-setup.md` | Legacy documentation (references old `.js` files); not production code. Out of scope for this phase. |

---

## Migration Strategy

### Why `git mv` atomically (not incremental per-route)

**Prior art in this repo:**
- Phase 169 used `git rm -r app/api/dirigera/` after consumers were migrated
- Phase 167 used a per-file loop for Sonos
- Phase 164 used `git rm -r app/api/stove/`

For this phase, the correct approach is `git mv app/api/fritzbox app/api/v1/fritzbox` **before** updating consumers, because:
1. There is no existing `app/api/v1/fritzbox/` — the move creates it
2. All 28 routes use `@/lib/...` absolute imports — zero relative import breakage
3. Co-located `__tests__/` use `from '../route'` which remains valid after the tree moves intact
4. Atomic move preserves git history for all 48 files in one commit

**Sequence:**
```bash
# Plan 1:
git mv app/api/fritzbox app/api/v1/fritzbox
git add -A
git commit -m "refactor(172-01): move app/api/fritzbox → app/api/v1/fritzbox (28 routes + 20 tests)"

# Plan 2 (consumer sweep - all URL strings):
# sed or manual edit: s|/api/fritzbox/|/api/v1/fritzbox/|g
# across 35 consumer files
git commit -m "refactor(172-02): retarget all consumers to /api/v1/fritzbox/*"

# Plan 3 (verification):
# grep proof + scoped Jest + Playwright smoke
```

**After Plan 1, the app will be broken** (consumers still call `/api/fritzbox/*` which no longer exists). Plan 2 restores green immediately after. Plans 1+2 must be in the same PR or sequenced within the same session.

### Alternative: Consumer-first then move

Consumer-first would require adding a temporary dual-serving shim or accepting a window where v1 routes don't exist. Since this is a development-environment migration (not live production with zero-downtime requirement), the move-first approach is simpler and matches what Phase 164 did for thermorossi.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| URL string replacement across 35 files | Custom find+replace script | `sed -i '' 's|/api/fritzbox/|/api/v1/fritzbox/|g' <files>` or editor find+replace |
| Verifying zero legacy refs | Manual file-by-file check | `grep -rn "/api/fritzbox/" app/ lib/ --include="*.ts" --include="*.tsx" --exclude-dir=".planning" --exclude-dir=".next"` |

---

## Common Pitfalls

### Pitfall 1: Forgetting NetworkTab.tsx has 37 URL occurrences
**What goes wrong:** Plan sweeps hooks but misses the debug panel, leaving 37 stale references.
**How to avoid:** Include `app/debug/components/tabs/NetworkTab.tsx` explicitly in Plan 2 consumer sweep.
**Warning signs:** Post-plan grep returns matches in NetworkTab.tsx.

### Pitfall 2: Forgetting useNetworkData.ts is not named useFritz*
**What goes wrong:** Searching by `useFritz*` filename pattern misses `useNetworkData.ts` (in `app/components/devices/network/hooks/`) and `useBandwidthHistory.ts` and `useDeviceHistory.ts` (in `app/network/hooks/`).
**How to avoid:** Grep by URL string `/api/fritzbox/`, not by filename. The consumer list is URL-derived, not name-derived.
**Warning signs:** Grep after Plan 2 still returns matches in these files.

### Pitfall 3: Confusing WS topic 'fritzbox' with URL path
**What goes wrong:** `useNetworkData.test.ts` contains `'fritzbox'` as a WebSocket topic string and `FRITZBOX_TIMEOUT` as an error code. These are NOT URL paths and must NOT be changed.
**How to avoid:** The migration target is the literal string `/api/fritzbox/` (with leading slash and trailing slash), not just the word `fritzbox`.
**Warning signs:** Tests for WS subscription break after migration.

### Pitfall 4: JSDoc strings are URLs too
**What goes wrong:** Some hooks have JSDoc comments like `* Polls /api/fritzbox/system for Fritz!Box system information.` These should be updated to keep documentation accurate, though they don't affect runtime behavior.
**How to avoid:** The sed command applies to all occurrences in the file, including comments. Verify JSDoc lines are updated.

### Pitfall 5: Test description strings need updating too
**What goes wrong:** Tests like `it('fetches /api/fritzbox/budget-stats on mount', ...)` leave stale description strings. While not functionally broken, they mislead future readers.
**How to avoid:** The URL replacement sed should cover test description strings as well as assertion values.

### Pitfall 6: docs/setup/fritzbox-setup.md contains `/api/fritzbox/` in legacy context
**What goes wrong:** The grep verification sweep after Plan 2 returns false positives from this doc file.
**How to avoid:** The success criterion states "outside `.planning/`" but the docs file is also outside `.planning/`. Decision: the docs references are in `app/api/fritzbox/` directory tree context (as a filesystem listing example), not API URL references. The success criterion 4 says "repo-wide grep for `/api/fritzbox/` outside `.planning/`". This doc file WILL return a match.
**Resolution:** The planner should either (a) update the doc file paths too, or (b) scope the final grep to `--include="*.ts" --include="*.tsx"` only. Option (b) matches the spirit of the requirement (no production code references) and is simpler. Document this scoping decision explicitly.

### Pitfall 7: `.next/` generated files contain legacy routes
**What goes wrong:** `.next/dev/types/routes.d.ts` contains all `/api/fritzbox/*` paths as TypeScript route types. These are auto-generated — they will update on next `npm run dev` invocation. They are NOT production code and NOT tracked by git.
**How to avoid:** Exclude `.next/` from all grep sweeps (`--exclude-dir=".next"`). Never manually edit `.next/` files.

---

## Runtime State Inventory

This is a route rename phase. The question is what persists beyond source files.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — Fritz!Box routes are stateless proxies; no Firebase RTDB records keyed on `/api/fritzbox/` paths | None |
| Live service config | None — no external service (n8n, Datadog, etc.) configured to call `/api/fritzbox/*` from external origin | None |
| OS-registered state | None — no Task Scheduler/cron jobs reference these paths | None |
| Secrets/env vars | None — no env var names embed the route path; Fritz!Box credentials are in `FRITZBOX_*` env vars which don't reference the URL path | None |
| Build artifacts | `.next/dev/types/routes.d.ts` — auto-generated TypeScript types listing all route paths — will auto-regenerate on next dev server start; NOT manually tracked or modified | Auto-resolved on next dev start |

**Conclusion:** No runtime migration needed. The rename is source-only.

---

## Environment Availability

Step 2.6: SKIPPED (no external dependencies — this phase requires only git, Node.js, and shell tools already verified present in the project environment).

---

## Validation Architecture

`workflow.nyquist_validation = true` in `.planning/config.json` — section required.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest (via `npm test`) |
| Config file | `jest.config.ts` (root) |
| Quick run command | `npm run test:changed` |
| Full suite command | `npm run test:api` + `npm run test:components` |
| Playwright smoke | `npx playwright test tests/smoke/page-loads.spec.ts` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FRITZ-01 | `useFritzDectHandsets` calls `/api/v1/fritzbox/telephony/dect` | unit | `npm test -- app/telefonia/hooks/__tests__/useFritzDectHandsets.test.ts` | ✅ (URL string update needed in Plan 2) |
| FRITZ-02 | `useFritzCallHistory` calls `/api/v1/fritzbox/telephony/calls` | unit | `npm test -- app/telefonia/hooks/__tests__/useFritzCallHistory.test.ts` | ✅ |
| FRITZ-03 | `useFritzTamStatus` calls `/api/v1/fritzbox/telephony/tam` | unit | `npm test -- app/telefonia/hooks/__tests__/useFritzTamStatus.test.ts` | ✅ |
| FRITZ-04 | `useFritzBandwidthHistoryRaw` calls `/api/v1/fritzbox/history/bandwidth` | unit | `npm test -- app/network/hooks/__tests__/useFritzBandwidthHistoryRaw.test.ts` | ✅ |
| FRITZ-05 | `useFritzDevicePresenceHistory` calls `/api/v1/fritzbox/history/devices` | unit | `npm test -- app/network/hooks/__tests__/useFritzDevicePresenceHistory.test.ts` | ✅ |
| FRITZ-06 | `useFritzDeviceEventsRaw` calls `/api/v1/fritzbox/history/device-events` | unit | `npm test -- app/network/hooks/__tests__/useFritzDeviceEventsRaw.test.ts` | ✅ |
| FRITZ-07 | `useFritzServiceDiscovery` calls `/api/v1/fritzbox/service-discovery` | unit | `npm test -- app/debug/hooks/__tests__/useFritzServiceDiscovery.test.ts` | ✅ (test mocks hook — no URL assertion; hook source update sufficient) |
| SC-4 | Repo-wide grep `/api/fritzbox/` in `*.ts`/`*.tsx` = 0 matches | verification | `grep -rn "/api/fritzbox/" app/ lib/ --include="*.ts" --include="*.tsx" --exclude-dir=".next" --exclude-dir="node_modules"` | N/A (shell command) |

### Sampling Rate

- **Per task commit (Plan 1):** `npm test -- app/api/v1/fritzbox/` (runs all 20 co-located route tests from new location)
- **Per task commit (Plan 2):** `npm test -- app/telefonia/ app/network/hooks/ app/debug/hooks/ app/components/devices/network/`
- **Per wave merge (Plan 3):** Full scoped sweep: `npm run test:api && npm run test:components`
- **Phase gate:** Full scoped suites green + Playwright smoke before `/gsd-verify-work`

### Wave 0 Gaps

None — all test files exist. No new test infrastructure needed. The only changes are URL string updates within existing test files.

---

## Code Examples

### Pattern 1: Atomic Route Tree Move

```bash
# Source: Phase 164 (164-01-PLAN.md) and Phase 169 (169-03-PLAN.md) playbook
# Move entire directory atomically — Next.js discovers routes by filesystem structure
git mv app/api/fritzbox app/api/v1/fritzbox

# Verify move is staged correctly
git status | grep "renamed:"
# Expected: renamed: app/api/fritzbox/... -> app/api/v1/fritzbox/...

# Confirm v1 tree exists and old tree is gone
ls app/api/v1/fritzbox/          # should list: bandwidth, bandwidth-history, ...
ls app/api/fritzbox/ 2>/dev/null # should fail (directory gone)
```

### Pattern 2: URL String Sweep (Consumer Files)

```bash
# Source: Phase 168 (168-02-PLAN.md) and Phase 167 (167-02-PLAN.md) playbook
# Replace all /api/fritzbox/ → /api/v1/fritzbox/ in production hooks
# macOS sed requires -i '' (empty string for no backup file)

# Telefonia hooks (FRITZ-01..03)
sed -i '' 's|/api/fritzbox/|/api/v1/fritzbox/|g' \
  app/telefonia/hooks/useFritzDectHandsets.ts \
  app/telefonia/hooks/useFritzCallHistory.ts \
  app/telefonia/hooks/useFritzTamStatus.ts

# Network hooks
sed -i '' 's|/api/fritzbox/|/api/v1/fritzbox/|g' \
  app/network/hooks/useFritzBandwidthHistoryRaw.ts \
  app/network/hooks/useFritzDevicePresenceHistory.ts \
  app/network/hooks/useFritzDeviceEventsRaw.ts \
  app/network/hooks/useFritzBandwidthTiers.ts \
  app/network/hooks/useFritzBudgetStats.ts \
  app/network/hooks/useFritzDeviceCountHistory.ts \
  app/network/hooks/useFritzNetworkServices.ts \
  app/network/hooks/useFritzSystemInfo.ts \
  app/network/hooks/useFritzWifiClients.ts \
  app/network/hooks/useFritzWifiNetworks.ts \
  app/network/hooks/useBandwidthHistory.ts \
  app/network/hooks/useDeviceHistory.ts

# Debug hook
sed -i '' 's|/api/fritzbox/|/api/v1/fritzbox/|g' \
  app/debug/hooks/useFritzServiceDiscovery.ts

# Components
sed -i '' 's|/api/fritzbox/|/api/v1/fritzbox/|g' \
  app/components/devices/network/hooks/useNetworkData.ts

# Pages
sed -i '' 's|/api/fritzbox/|/api/v1/fritzbox/|g' \
  app/network/page.tsx \
  app/registry/devices/page.tsx

# Debug panel (37 occurrences)
sed -i '' 's|/api/fritzbox/|/api/v1/fritzbox/|g' \
  app/debug/components/tabs/NetworkTab.tsx

# Hook test assertions (14 test files)
sed -i '' 's|/api/fritzbox/|/api/v1/fritzbox/|g' \
  app/telefonia/hooks/__tests__/useFritzDectHandsets.test.ts \
  app/telefonia/hooks/__tests__/useFritzCallHistory.test.ts \
  app/telefonia/hooks/__tests__/useFritzTamStatus.test.ts \
  app/network/hooks/__tests__/useFritzBandwidthHistoryRaw.test.ts \
  app/network/hooks/__tests__/useFritzBandwidthTiers.test.ts \
  app/network/hooks/__tests__/useFritzBudgetStats.test.ts \
  app/network/hooks/__tests__/useFritzDeviceCountHistory.test.ts \
  app/network/hooks/__tests__/useFritzDeviceEventsRaw.test.ts \
  app/network/hooks/__tests__/useFritzDevicePresenceHistory.test.ts \
  app/network/hooks/__tests__/useFritzNetworkServices.test.ts \
  app/network/hooks/__tests__/useFritzSystemInfo.test.ts \
  app/network/hooks/__tests__/useFritzWifiClients.test.ts \
  app/network/hooks/__tests__/useFritzWifiNetworks.test.ts \
  app/network/hooks/__tests__/useDeviceHistory.test.ts
```

### Pattern 3: Verification Sweep

```bash
# Source: Phase 164 (164-02-PLAN.md) playbook — repo-wide grep proof
# Must return 0 matches for success criterion 4

grep -rn "/api/fritzbox/" \
  app/ lib/ types/ \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir=".next" \
  --exclude-dir="node_modules"

# Expected output: (empty — no matches)
# If any matches remain, the planner failed to include that file in Plan 2 sweep.
```

### Pattern 4: Scoped Jest After Plan 1

```bash
# After git mv (Plan 1), run co-located route tests from new location
# This proves the move preserved import paths correctly
npm test -- app/api/v1/fritzbox/

# After Plan 2 (consumer sweep), run all affected consumer test suites
npm test -- \
  app/telefonia/hooks/__tests__/ \
  app/network/hooks/__tests__/ \
  app/debug/hooks/__tests__/useFritzServiceDiscovery.test.ts
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Routes at `/api/fritzbox/**` | Routes at `/api/v1/fritzbox/**` | Phase 172 | Closes REQUIREMENTS.md FRITZ-01..07 namespace mismatch; aligns with all other providers (hue, sonos, netatmo, thermorossi, dirigera) |

**Canonical provider path pattern in this repo (all now at `/api/v1/{provider}/*`):**
- `/api/v1/thermorossi/*` (Phase 156+164)
- `/api/v1/hue/*` (Phase 159+166)
- `/api/v1/sonos/*` (Phase 160+167)
- `/api/v1/netatmo/*` (Phase 161+168)
- `/api/v1/dirigera/*` (Phase 163+169)
- `/api/v1/fritzbox/*` ← Phase 172 closes this gap

---

## Open Questions

1. **docs/setup/fritzbox-setup.md: update or leave?**
   - What we know: Contains 3 references to `app/api/fritzbox/` in legacy filesystem listing context (references `.js` files, pre-TypeScript migration structure). Not production code.
   - What's unclear: Whether success criterion 4 ("repo-wide grep returns zero matches") applies to `.md` doc files or only `*.ts`/`*.tsx`.
   - Recommendation: Scope the final grep verification to `--include="*.ts" --include="*.tsx"` to exclude documentation. The doc file references are structurally stale (reference `.js` files from pre-v5.0) and will mislead if updated to `/api/v1/fritzbox/` since the surrounding context remains wrong. Leave the doc file untouched and narrow the grep scope.

2. **NetworkTab.tsx: is there a corresponding test that checks its URL strings?**
   - What we know: No `NetworkTab.test.tsx` was found — the debug panel has no co-located test. [VERIFIED: codebase grep]
   - What's unclear: Nothing — this confirms NetworkTab.tsx URL updates are unblocked by test failures.
   - Recommendation: Update NetworkTab.tsx in Plan 2 consumer sweep; no test file to update.

---

## Assumptions Log

All claims in this research were verified against the live codebase via file system scans, grep, and python inspection. No assumed claims.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| — | — | — | If this table is empty: all claims were verified or cited — no user confirmation needed. |

**This table is empty.** All claims verified directly from codebase.

---

## Sources

### Primary (HIGH confidence)
- Codebase: `find app/api/fritzbox -type f | sort` — 48 files enumerated [VERIFIED]
- Codebase: `grep -rln "/api/fritzbox/" app/ lib/ --include="*.ts" --include="*.tsx"` — 35 consumer files identified [VERIFIED]
- Codebase: `python3 glob + content scan` — all 28 route.ts have `@/` imports and `export const dynamic` [VERIFIED]
- Codebase: `git show d62cad86, 683a4863, 04a6e147` — Phase 166/167/169 deletion playbook confirmed [VERIFIED]
- `.planning/phases/171-fritzbox-consumer-ui/171-VERIFICATION.md` — Phase 171 wired all 7 FRITZ hooks to `/api/fritzbox/*`; confirms exact hook names and line numbers [VERIFIED]
- `.planning/REQUIREMENTS.md` — FRITZ-01..07 spec canonical paths as `/api/v1/fritzbox/*` [VERIFIED]
- `.planning/ROADMAP.md §Phase 172` — success criteria and dependency chain [VERIFIED]
- `.planning/config.json` — `nyquist_validation: true` [VERIFIED]

---

## Metadata

**Confidence breakdown:**
- Route tree inventory: HIGH — direct filesystem enumeration
- Consumer file list: HIGH — URL grep across entire codebase
- Migration strategy: HIGH — confirmed against 3 prior provider migrations in same repo
- Test assertions: HIGH — per-file content inspection
- Pitfalls: HIGH — derived from prior phase post-mortems (Phase 164 debug panel blind spot, Phase 166 deviceCommands.tsx blind spot)

**Research date:** 2026-04-24
**Valid until:** Indefinite (pure codebase facts, no external dependency versions)
