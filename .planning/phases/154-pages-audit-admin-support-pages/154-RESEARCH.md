# Phase 154: Pages Audit — Admin & Support Pages - Research

**Researched:** 2026-04-02
**Domain:** Tailwind CSS responsive layout — admin, debug, and support pages at 375px
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Apply minimal, targeted fixes — add responsive Tailwind classes or `overflow-x-auto` wrappers. Do NOT restructure page layouts or rewrite components (same as Phase 152/153 D-01)
- **D-02:** Follow Phase 151's mobile-first convention: base = mobile (375px+), `sm:` = desktop (640px+) (same as Phase 152/153 D-02)
- **D-03:** For data-heavy components (tables, charts), prefer `overflow-x-auto` scroll wrapper over column hiding (same as Phase 152/153 D-03)
- **D-04:** Camera pages (/camera, /camera/events) do NOT exist in the codebase — no `app/camera/` directory found. Mark AUDIT-14 as N/A.
- **D-05 through D-16:** Specific codebase findings (grid patterns, known issues) documented in CONTEXT.md Canonical Refs and Known Issues sections
- **D-17:** Use Playwright MCP at 375x812 viewport for verification
- **D-18:** Check `document.body.scrollWidth <= window.innerWidth` as automated overflow test
- **D-19:** Visual screenshot for each page
- **D-20:** Plan 01: Registry pages + Settings pages (AUDIT-11, AUDIT-12)
- **D-21:** Plan 02: Debug pages + Remaining pages (AUDIT-13, AUDIT-14 N/A, AUDIT-15)
- **D-15:** `/debug/design-system` is excluded from this audit

### Claude's Discretion
- Exact responsive breakpoint choices per component (grid-cols-1 vs grid-cols-2 at base)
- Whether `grid-cols-2` stat grids in debug pages need mobile adjustment after visual inspection
- Order of page fixes within each plan
- Whether to add unit tests for layout changes (prefer Playwright verification over unit tests for layout)

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUDIT-11 | Registry pages (/registry/devices, /registry/types) verified at 375px | DataTable already has `overflow-x-auto`. Toolbar `flex items-center justify-between` may need `flex-wrap` at narrow width if Select + Button exceed container width. Confirmed pattern from Phase 152. |
| AUDIT-12 | Settings pages (all 7 settings sub-pages) verified at 375px | settings/page.tsx uses responsive patterns throughout. Notifications sub-pages have `grid-cols-1 sm:grid-cols-2` already. No blocking issues found. Visual verification needed. |
| AUDIT-13 | Debug pages (/debug, /debug/api, /debug/logs, /debug/notifications) verified at 375px | Known issue at debug/logs line 187: `grid-cols-2 md:grid-cols-4` — 2-col nav links at 375px is tight but likely acceptable. debug/page.tsx uses `overflow="scroll"` on Tabs.List. |
| AUDIT-14 | Camera pages (/camera, /camera/events) verified at 375px | N/A — directory does not exist in codebase. Mark as verified-N/A. |
| AUDIT-15 | Remaining pages (changelog, offline, log) verified at 375px | CONFIRMED FIX: offline/page.tsx line 213 has `grid-cols-3` at base (3 temperature cells). Also offline/page.tsx line 295 has `grid-cols-2` (thermostat temperatures). changelog/page.tsx min-w-[40px] pagination is fine. log/page.tsx uses `flex flex-wrap gap-2` — already responsive. |
</phase_requirements>

---

## Summary

Phase 154 is the final pages audit in v18.0 covering admin/registry, settings, debug, and support pages. The codebase scout from CONTEXT.md already identified the most likely issues. The pattern established by Phases 151–153 applies uniformly: targeted Tailwind class additions, no layout rewrites.

The dominant finding from direct code inspection is that most pages are already mobile-safe due to responsive patterns applied in prior development. The one confirmed problem is `app/offline/page.tsx` which has `grid-cols-3` and `grid-cols-2` at base for temperature cells — both small stat boxes at ~100px per cell in a 375px container (with px-4 padding = 343px usable) which means approximately 107px per column including gap, a tight fit that will likely overflow or clip content. All other issues are "verify visually" — likely fine.

The registry pages use `DataTable` which already wraps in `overflow-x-auto` (confirmed at line 496 of DataTable.tsx). The toolbar `flex items-center justify-between` pattern on the devices page may need `flex-wrap` if the Select + Button combination is too wide, following the exact pattern used in Phase 152-01 for other header rows. Debug pages have `Tabs.List overflow="scroll"` (confirmed) for the 9-tab debug page, which scrolls horizontally — this is the correct pattern. The debug/logs back-links grid (`grid-cols-2 md:grid-cols-4`) is 4 short navigation buttons, which at 2 columns and ~150px each fits comfortably in 343px.

**Primary recommendation:** Run Playwright screenshots first, then apply targeted fixes for confirmed overflows. The only guaranteed fix before screenshot inspection is `app/offline/page.tsx` line 213 (`grid-cols-3` → `grid-cols-1 sm:grid-cols-3`).

## Standard Stack

### Core (no new dependencies — audit-only phase)
| Tool | Version | Purpose | Source |
|------|---------|---------|--------|
| Tailwind CSS | project version | Responsive utility classes | Already installed |
| Playwright MCP | project version | 375x812 viewport screenshots and overflow checks | Already configured |

No new packages. This is a pure CSS/layout audit phase.

## Architecture Patterns

### Established Mobile-First Convention (from Phase 151)
```
base classes   = 375px+ (mobile)
sm: prefix     = 640px+ (desktop)
md: prefix     = 768px+ (not commonly used — prefer sm:)
```

### Pattern 1: Responsive Grid Fix
**What:** Replace non-responsive grid with mobile-first responsive version
**When to use:** Any `grid-cols-N` at base that forces content into narrow cells
**Example:**
```tsx
// Before (overflows at 375px)
<div className="grid grid-cols-3 gap-4">

// After (mobile-first fix)
<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
```

### Pattern 2: Header Row Flex-Wrap (from Phase 152-01)
**What:** Add `flex-wrap` to header rows containing button + select/input combos
**When to use:** `flex items-center justify-between` rows where content may exceed 375px
**Example:**
```tsx
// Before (can overflow on narrow viewport)
<div className="flex items-center justify-between mb-4">
  <Select ... />
  <Button ...>Registra dispositivo</Button>
</div>

// After
<div className="flex flex-wrap items-center gap-3 mb-4">
  <Select ... />
  <Button ...>Registra dispositivo</Button>
</div>
```

### Pattern 3: Small Stat Grid — 2-col base is OK
**What:** 2-column stat grids are acceptable at 375px for compact numeric stats
**When to use:** Small numeric cells (~150px each), short labels
**Verified in:** Phase 153 (stat grids kept 2-col at base for thermostat/sonos pages)
**Example:**
```tsx
// grid-cols-2 for 2 temperature cells is fine (170px per cell in 343px)
<div className="grid grid-cols-2 gap-4">
  <div className="text-center p-4">Current Temp</div>
  <div className="text-center p-4">Target</div>
</div>
```

### Pattern 4: Tabs Overflow Scroll (already in DS)
**What:** `Tabs.List` with `overflow="scroll"` horizontally scrolls tab list
**When to use:** Any tab list with many tabs (>4) at 375px
**Status:** Already applied correctly to `/debug` page (`<Tabs.List overflow="scroll">`)

### Anti-Patterns to Avoid
- **3-column base grid for full-width content:** `grid-cols-3` with text/number cells ≥80px will overflow 375px container (343px usable). Must be `grid-cols-1 sm:grid-cols-3`
- **Hardcoded `justify-between` on multi-item rows:** Forces items to opposite ends, causing overflow if items are wide
- **Page rewrites:** NEVER restructure layouts — only add responsive classes

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Horizontal table scroll | Custom scroll logic | `overflow-x-auto` wrapper (DataTable already has it) | Already solved in DataTable component |
| Tab overflow | Custom tab navigation | `Tabs.List overflow="scroll"` | Already in DS with `scrollbar-hide` |
| Responsive breakpoints | Custom media queries | Tailwind `sm:` prefix | Consistent with whole codebase |

**Key insight:** All tools exist. This phase is applying established patterns, not inventing solutions.

## Common Pitfalls

### Pitfall 1: Assuming grid-cols-2 always overflows
**What goes wrong:** Fixing 2-column grids that are actually fine at 375px (small stat boxes, compact content)
**Why it happens:** Rule-based application without visual verification
**How to avoid:** Always screenshot before changing. `grid-cols-2` for 2 cells of ~150px each in 343px usable space is fine. Only `grid-cols-3` (3×~107px) or wider is problematic
**Warning signs:** Content visually clipped or overflowing in screenshot

### Pitfall 2: Breaking the toolbar layout when adding flex-wrap
**What goes wrong:** Adding `flex-wrap` to a `justify-between` row without adjusting gaps, causing items to stack awkwardly
**Why it happens:** `flex-wrap + justify-between` can put each wrapped item on its own row with full width
**How to avoid:** Replace `justify-between` with `gap-3` when adding `flex-wrap`. Pattern: `flex flex-wrap items-center gap-3 mb-4`

### Pitfall 3: Missing that a page is already mobile-safe
**What goes wrong:** Making unnecessary changes to pages that already work at 375px
**Why it happens:** Not running screenshot verification first
**How to avoid:** Playwright screenshot pass first, fix only confirmed issues

### Pitfall 4: Modifying design-system page
**What goes wrong:** Including `app/debug/design-system/page.tsx` in the audit
**Why it happens:** It's in the debug directory
**How to avoid:** D-15 is explicit: this page is excluded. Don't touch it.

## Code Examples

### Confirmed Fix: offline/page.tsx line 213
```tsx
// Source: app/offline/page.tsx line 213
// Before — 3 cells in ~343px = ~107px each (tight, will overflow with padding)
<div className="grid grid-cols-3 gap-4">
  {/* Room Temperature */}
  <div className="text-center p-3 rounded-lg bg-white/[0.02]">...</div>
  {/* Setpoint */}
  <div className="text-center p-3 rounded-lg bg-white/[0.02]">...</div>
  {/* Exhaust Temperature */}
  <div className="text-center p-3 rounded-lg bg-white/[0.02]">...</div>
</div>

// After — single column on mobile, 3-col on desktop
<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
```

### Visual Verification Pattern (from Phase 153)
```javascript
// Playwright check — run for each page
await page.setViewportSize({ width: 375, height: 812 });
await page.goto('/registry/devices');
await page.screenshot({ path: 'uat-154-registry-devices-375.png' });
const overflows = await page.evaluate(() =>
  document.body.scrollWidth <= window.innerWidth
);
// overflows === true means no horizontal scroll
```

### Registry Devices Toolbar (verify-first, fix if needed)
```tsx
// Current — verify if this overflows at 375px
<div className="flex items-center justify-between mb-4">
  <Select label="Provider" ... />
  <Button variant="ember" size="sm">Registra dispositivo</Button>
</div>

// Fix if overflows (following Phase 152-01 pattern)
<div className="flex flex-wrap items-center gap-3 mb-4">
  <Select label="Provider" ... />
  <Button variant="ember" size="sm">Registra dispositivo</Button>
</div>
```

## Page-by-Page Findings

### AUDIT-11: Registry Pages

**`/registry/devices`** (app/registry/devices/page.tsx)
- DataTable: `overflow-x-auto` confirmed at DataTable.tsx:496 — safe
- Health stats row (line 519): `flex items-center gap-6` — flex row, may wrap if 2 items exceed width, but short numeric text — likely fine
- Toolbar (line 532): `flex items-center justify-between mb-4` — Select + Button — **visual verification needed** (may need flex-wrap)
- Pagination (line 567): `flex items-center justify-between` — short text + 2 buttons — likely fine at 375px
- **Risk:** LOW-MEDIUM on toolbar row

**`/registry/types`** (app/registry/types/page.tsx)
- DataTable: same `overflow-x-auto` applies — safe
- Card header (line 193): `flex items-center justify-between mb-4` — Heading + "Crea tipo" button — likely fine (short label)
- **Risk:** LOW

### AUDIT-12: Settings Pages

**`/settings`** (app/settings/page.tsx)
- Tabs (Posizione / Dispositivi): 2 tabs, Tabs.List default overflow="scroll" — safe
- UnifiedDevicesContent device rows (line 345): `flex items-center justify-between gap-2 sm:gap-4` — responsive gaps applied
- Action buttons (line 409): `flex flex-col sm:flex-row` — already responsive
- **Risk:** LOW (already well-structured)

**`/settings/notifications`** (NotificationSettingsForm.tsx)
- Grid at line 257: `grid-cols-1 sm:grid-cols-2` — already responsive
- Grid at line 355: `grid-cols-1 sm:grid-cols-2` — already responsive
- **Risk:** NONE

**`/settings/notifications/history`**
- `max-w-[200px] truncate` on title column — safe, constrains width within DataTable
- DataTable has `overflow-x-auto` — safe
- **Risk:** NONE

**`/settings/dashboard`, `/settings/devices`, `/settings/location`, `/settings/thermostat`**
- No grid-cols patterns found in grep scan
- Form-based layouts with Card + Input/Select components — naturally responsive via block flow
- **Risk:** LOW (visual verification to confirm)

**`/settings/notifications/devices`** (not grepped — scan during execution)
- Expected to be similar to other settings sub-pages
- **Risk:** LOW

### AUDIT-13: Debug Pages

**`/debug`** (app/debug/page.tsx)
- Tabs.List uses `overflow="scroll"` explicitly (line 381) — 9 tabs scroll horizontally — safe
- NotificheContent grid (line 235): `grid-cols-1 md:grid-cols-3` — already mobile-safe (grid-cols-1 at base)
- Header flex (line 100): `flex items-center justify-between flex-wrap gap-4` — already has flex-wrap
- Keyboard hint (line 373): `flex flex-wrap gap-2` — already responsive
- **Risk:** NONE

**`/debug/api`** (app/debug/api/page.tsx)
- Header (line 74): `flex flex-col md:flex-row md:items-center md:justify-between gap-4` — already responsive
- No grid-cols patterns found
- Tabs with 6 items — uses Tabs.List default overflow="scroll" — safe
- **Risk:** NONE

**`/debug/logs`** (app/debug/logs/page.tsx)
- Back-links grid (line 187): `grid-cols-2 md:grid-cols-4 gap-3` — 4 navigation buttons in 2 cols at base. Each button is ~(343px - 12px gap)/2 = ~165px. Navigation buttons with emoji + text like "🏠 Home" — **visual verification needed**, but likely fine
- Header (line 76): `flex items-center justify-between mb-6` — Title div + 2 buttons row — **may need flex-wrap** if buttons are wide
- Category selector (line 104): `flex gap-2 mb-6` — 3 category buttons that may wrap if too wide for 375px
- **Risk:** LOW-MEDIUM on header button row

**`/debug/notifications`** (app/debug/notifications/page.tsx)
- Grids: `grid-cols-1 md:grid-cols-3`, `grid-cols-1 md:grid-cols-2` — all already mobile-safe
- **Risk:** NONE

**`/debug/notifications/test`** (app/debug/notifications/test/page.tsx)
- Delivery trace grid (line 379): `grid-cols-2 gap-3` — 4 small stat cells (Sent at, Target devices, Delivered, Failed) — 2-col at 375px is approximately 165px per cell. Short labels and values — likely fine per Phase 153 precedent
- **Risk:** LOW (visual verification)

**`/debug/transitions`** (lower priority developer tool)
- Status grid (line 132): `grid-cols-2 gap-4` — 2 cells (Transition Type, Direction) — fine at 375px
- Transition cards (line 156): `grid gap-4 sm:grid-cols-2 lg:grid-cols-3` — base has no explicit grid-cols, defaults to 1 column — safe
- **Risk:** NONE

**`/debug/weather-test`** (lower priority developer tool)
- Uses `max-w-2xl mx-auto p-4 space-y-4` single-column layout — safe
- **Risk:** NONE

### AUDIT-14: Camera Pages
- `app/camera/` directory does NOT exist. Mark AUDIT-14 as N/A — verified.

### AUDIT-15: Remaining Pages

**`/offline`** (app/offline/page.tsx)
- **CONFIRMED FIX (line 213):** `grid-cols-3` for stove temperature cells — must change to `grid-cols-1 sm:grid-cols-3`
- **Verify (line 295):** `grid-cols-2` for thermostat temperatures — 2 cells in ~343px = ~165px each — likely fine but screenshot needed
- Container: `max-w-2xl mx-auto py-8 px-4` — single column wrapper, safe
- **Risk:** HIGH for line 213 (confirmed fix), LOW for line 295

**`/changelog`** (app/changelog/page.tsx)
- Pagination buttons: `min-w-[40px]` — fine at 375px
- Footer legend (line 315): `flex flex-col sm:flex-row` — already responsive
- **Risk:** NONE

**`/log`** (app/log/page.tsx)
- Device filter (line ~): `flex flex-wrap gap-2` — already responsive
- LogEntry items: single-column card list — safe
- Pagination component (Pagination.tsx) — already responsive per prior audits
- **Risk:** NONE

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Fixed grid at all breakpoints | Mobile-first `grid-cols-1 sm:grid-cols-N` | Phase 151–153 | Standard for this codebase |
| `justify-between` header rows | `flex-wrap gap-3` header rows | Phase 152-01 | Pattern for crowded toolbars |
| Fixed-width table containers | `overflow-x-auto` on DataTable | Phase 118 | Already baked into DataTable component |

## Open Questions

1. **Registry devices toolbar overflow**
   - What we know: `flex items-center justify-between mb-4` with a Select + Button
   - What's unclear: Exact rendered width of the Select component at 375px
   - Recommendation: Screenshot first, apply flex-wrap fix if Select overflows

2. **debug/logs header button row**
   - What we know: `flex items-center justify-between mb-6` with heading div + 2 buttons
   - What's unclear: Whether the buttons ("🔄 Refresh" + "▶️ Auto (5s)") exceed available width
   - Recommendation: Screenshot first, apply flex-wrap fix if needed

3. **offline/page.tsx grid-cols-2 thermostat (line 295)**
   - What we know: 2-col grid for Current Temp + Target cells
   - What's unclear: Whether cell content (temperature values + labels) causes overflow at 165px per cell
   - Recommendation: Verify visually — if tight, keep grid-cols-2 as per Phase 153 stat grid precedent

## Environment Availability

Step 2.6: SKIPPED (no external dependencies — this is a pure CSS/layout audit using existing Playwright MCP)

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright MCP (UAT) |
| Config file | playwright.config.ts |
| Quick run command | Playwright MCP screenshot at 375x812 |
| Full suite command | `npm test` (Jest unit tests) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUDIT-11 | Registry pages no horizontal overflow at 375px | visual/Playwright | Playwright MCP screenshot + scrollWidth check | N/A (MCP) |
| AUDIT-12 | Settings pages no overflow at 375px | visual/Playwright | Playwright MCP screenshot + scrollWidth check | N/A (MCP) |
| AUDIT-13 | Debug pages no overflow at 375px | visual/Playwright | Playwright MCP screenshot + scrollWidth check | N/A (MCP) |
| AUDIT-14 | Camera pages N/A | manual-only | N/A — pages don't exist | N/A |
| AUDIT-15 | Remaining pages correct layout at 375px | visual/Playwright | Playwright MCP screenshot + scrollWidth check | N/A (MCP) |

### Sampling Rate
- **Per task commit:** Playwright screenshot for that page group
- **Per wave merge:** All screenshots pass scrollWidth check
- **Phase gate:** Full screenshot set before `/gsd:verify-work`

### Wave 0 Gaps
None — test infrastructure (Playwright MCP) is pre-existing and works as in Phases 152/153.

## Sources

### Primary (HIGH confidence)
- Direct code inspection: `app/registry/devices/page.tsx`, `app/registry/types/page.tsx`, `app/settings/page.tsx`, `app/debug/page.tsx`, `app/debug/logs/page.tsx`, `app/debug/api/page.tsx`, `app/debug/notifications/page.tsx`, `app/debug/notifications/test/page.tsx`, `app/debug/transitions/page.tsx`, `app/debug/weather-test/page.tsx`, `app/offline/page.tsx`, `app/changelog/page.tsx`, `app/log/page.tsx`
- `app/components/ui/DataTable.tsx` line 496 — `overflow-x-auto` confirmed
- `app/components/ui/Tabs.tsx` lines 73-80 — `overflow-x-auto scrollbar-hide` default confirmed
- `.planning/phases/154-pages-audit-admin-support-pages/154-CONTEXT.md` — locked decisions and known issues
- Phase 151/152/153 patterns from `STATE.md` accumulated decisions

### Secondary (MEDIUM confidence)
- grep scan of all `grid-cols` patterns across `app/settings/` and `app/debug/` directories

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies, all patterns established
- Architecture: HIGH — direct code inspection, confirmed patterns
- Pitfalls: HIGH — verified against actual code and prior phase decisions

**Research date:** 2026-04-02
**Valid until:** 2026-04-09 (stable CSS/layout domain, short-lived)
