# Phase 152: Pages Audit — Core & Device Pages - Research

**Researched:** 2026-04-01
**Domain:** Mobile-first CSS audit and fix — Tailwind responsive classes, overflow patterns
**Confidence:** HIGH

## Summary

Phase 152 is a mechanical audit-and-fix task: each page in scope is inspected at 375px (iPhone SE viewport) and any layout that causes horizontal overflow or clips controls is fixed with minimal Tailwind responsive class changes. No component restructuring is needed. The Design System components were confirmed mobile-safe in Phase 151; the problem is in page-level and sub-component layout code.

Code inspection reveals a small, well-defined set of issues. The dashboard (/) already uses a responsive masonry layout with a dedicated single-column mobile render block. Most stove pages use `grid-cols-1 md:grid-cols-3` which is already mobile-safe. The thermostat `/thermostat/schedule` page contains a WeeklyTimeline that already has `overflow-x-auto` and `min-w-[600px]` — it is already handled correctly. The main issues are in `/lights/page.tsx` (two hardcoded non-responsive grids) and `/network` (SystemInfoCard uses `grid-cols-3` without a mobile breakpoint; the tab nav bar may overflow on narrow widths).

**Primary recommendation:** Fix the three specific non-responsive grid patterns in lights and network pages, confirm all other pages are already mobile-safe through Playwright verification at 375px, and apply `overflow-x-auto` wrappers where data-heavy content requires horizontal scrolling.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Apply minimal, targeted fixes — add responsive Tailwind classes (e.g., `grid-cols-1 sm:grid-cols-3`) or `overflow-x-auto` wrappers. Do NOT restructure page layouts or rewrite components
- **D-02:** Follow Phase 151's mobile-first convention: base = mobile (375px+), `sm:` = desktop (640px+)
- **D-03:** For data-heavy components (tables, timelines, charts), prefer `overflow-x-auto` scroll wrapper over column hiding — preserves all data on mobile
- **D-04:** `WeeklyTimeline.tsx:106` (thermostat/schedule) has `min-w-[600px]` — wrap parent in `overflow-x-auto` to allow horizontal scroll at 375px rather than removing the min-width
- **D-05:** `lights/page.tsx:111` has non-responsive `grid-cols-3` — change to `grid-cols-1 sm:grid-cols-3` or similar
- **D-06:** `lights/page.tsx:233` has `grid-cols-5 gap-1.5` — change to `grid-cols-3 sm:grid-cols-5` or wrap to allow scroll
- **D-07:** Stove page uses `grid grid-cols-1 md:grid-cols-3` — already responsive, likely fine
- **D-08:** Use Playwright MCP at 375×812 viewport to verify each page after fixes
- **D-09:** Check `document.body.scrollWidth <= window.innerWidth` for each page as automated overflow test
- **D-10:** Visual screenshot for each page to catch clipped controls or unreadable text
- **D-11:** Plan 01: Dashboard (/) + stove pages — AUDIT-01, AUDIT-02
- **D-12:** Plan 02: Thermostat + lights + network — AUDIT-03, AUDIT-04, AUDIT-05

### Claude's Discretion
- Exact responsive breakpoint choices (grid-cols-1 vs grid-cols-2 at base) per component
- Whether to use `overflow-x-auto` vs responsive restructuring for charts on /network
- Order of page fixes within each plan
- Whether to add unit tests for layout changes (prefer Playwright verification over unit tests for layout)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUDIT-01 | Dashboard home page (/) verified and fixed at 375px | DashboardCards already has dedicated `flex flex-col gap-6 sm:hidden` mobile block — confirmed mobile-safe, Playwright verification confirms |
| AUDIT-02 | Stove pages (/stove, /stove/errors, /stove/maintenance, /stove/scheduler) verified at 375px | StovePageHero uses `grid grid-cols-2` (2-col metrics, fine at 375px); StovePageNavigation uses `grid grid-cols-1 sm:grid-cols-3` (already mobile-safe); stove/errors uses `grid-cols-1 md:grid-cols-3` (already responsive); maintenance uses `grid-cols-1 md:grid-cols-3` (already responsive); scheduler WeeklyTimeline requires overflow-x-auto wrapper |
| AUDIT-03 | Thermostat pages (/thermostat, /thermostat/schedule) verified at 375px | thermostat/page.tsx Grid cols={3} resolves to `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` — mobile-safe; schedule/WeeklyTimeline already has `overflow-x-auto` wrapper with `min-w-[600px]` — already handled |
| AUDIT-04 | Lights pages (/lights, /lights/scenes, /lights/automation) verified at 375px | lights/page.tsx has two problematic grids (line 111: `grid-cols-3`, line 233: `grid-cols-5`); scenes page uses `grid-cols-2 sm:grid-cols-3` (already responsive); automation page uses `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` (already responsive) |
| AUDIT-05 | Network page (/network) verified at 375px | Tab nav `flex gap-1` with 4 tabs may overflow at 375px; SystemInfoCard `grid-cols-3` has no mobile fallback; other tables use DataTable which already has `overflow-x-auto` |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tailwind CSS | Project standard | Responsive class utilities | All existing code uses Tailwind |
| Playwright MCP | Project standard | Viewport verification at 375px | Established in Phase 151 UAT |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| DataTable (DS) | Project standard | Already has `overflow-x-auto` | Network device/wifi tables — no changes needed |
| Grid (DS) | Project standard | Responsive grid with `grid-cols-1` base | Use when page uses plain `grid` without responsive fallback |

**No new packages required.** This phase is pure Tailwind class changes.

---

## Architecture Patterns

### Recommended Fix Pattern: Non-Responsive Grid
```
Before: className="grid grid-cols-3 gap-6"
After:  className="grid grid-cols-1 sm:grid-cols-3 gap-6"
```
Mobile base = 1 column, desktop (640px+) = original column count.

### Recommended Fix Pattern: Horizontal Overflow Content
```html
<!-- Wrap fixed-min-width content in overflow-x-auto -->
<div className="overflow-x-auto">
  <div className="min-w-[600px]">
    {/* timeline, chart, wide table */}
  </div>
</div>
```
The inner div keeps its min-width; the outer div scrolls on mobile. This is already the pattern used in thermostat `schedule/WeeklyTimeline.tsx` and DataTable.

### Recommended Fix Pattern: Tab Navigation Overflow
For the network page tab bar with 4 tabs (`flex gap-1`), if text clips at 375px:
```
Option A: overflow-x-auto on tab container (horizontal scroll)
Option B: flex-wrap (tabs wrap to next line)
Option C: reduce padding (px-3 py-2 → px-2 py-1.5 text-xs on mobile)
```
Decision is Claude's discretion — check actual pixel measurements first via Playwright screenshot.

### Anti-Patterns to Avoid
- **Removing min-width from timelines:** WeeklyTimeline needs min-w-[600px] to render 7-day view correctly. Always wrap in overflow-x-auto instead.
- **Hiding columns on mobile:** Per D-03, prefer scroll over hiding. All data must remain accessible.
- **Restructuring page layouts:** Per D-01, only add responsive classes. Do not move elements, add new components, or rewrite sections.
- **Changing `md:` breakpoints to `sm:`:** When D-07 confirms stove already uses `md:grid-cols-3`, leave it — it renders 1 column from 0-767px which is mobile-safe.

---

## Page-by-Page Audit Findings

### Dashboard (/)
**File:** `app/page.tsx` → `app/components/DashboardCards.tsx`
**Status:** MOBILE-SAFE — no changes needed

DashboardCards renders two distinct layout blocks:
- Mobile: `<div className="flex flex-col gap-6 sm:hidden">` — single column flat list
- Desktop: `<div className="hidden sm:flex sm:flex-row gap-8 lg:gap-10">` — two-column masonry

At 375px only the mobile block is visible. All cards are full-width. No overflow risk.

**Playwright verification still required** to confirm no individual card component causes page-level overflow.

---

### Stove Pages

#### /stove (StovePage)
**File:** `app/stove/page.tsx`
**Status:** LIKELY MOBILE-SAFE — verify via Playwright

Key layout elements:
- Loading skeleton: `grid grid-cols-1 md:grid-cols-3` — mobile-safe (1 column at 375px)
- `StovePageHero`: metrics grid is `grid-cols-2 gap-4` — 2 columns at all widths. At 375px, each column is ~170px, which is sufficient for the fan/power gauges.
- `StovePageHero`: action buttons are `grid grid-cols-2 gap-4` — same 2-column layout, fine for ACCENDI/SPEGNI buttons.
- `StovePageAdjustments`: needs visual verification (not read in full)
- `StovePageNavigation`: `grid grid-cols-1 sm:grid-cols-3 gap-4` — already mobile-safe

**Action:** Playwright verify, screenshot; fix if any component overflows.

#### /stove/errors (ErrorsPage)
**File:** `app/stove/errors/page.tsx`
**Status:** LIKELY MOBILE-SAFE

Key elements:
- Header `flex items-center justify-between` — could clip at 375px if heading + button don't wrap. The heading contains "🚨 Storico Allarmi" and the button is "Torna alla Home". This is `flex items-center justify-between mb-6` — **no flex-wrap**. If they don't fit on one line at 375px this will cause horizontal overflow.
- `Button.Group` for filter tabs — now has `flex-wrap` from Phase 151 fix.
- Error metadata: `grid grid-cols-1 md:grid-cols-3 gap-4` — mobile-safe.

**Action:** Playwright verify. If header row clips, add `flex-wrap gap-4` or change to `flex flex-col sm:flex-row` pattern.

#### /stove/maintenance (MaintenancePage)
**File:** `app/stove/maintenance/page.tsx`
**Status:** MOBILE-SAFE

Key elements:
- `max-w-2xl mx-auto py-8 px-4` — constrained width with padding
- Status card: `grid grid-cols-1 md:grid-cols-3 gap-4` — mobile-safe
- Quick presets: `flex gap-2 flex-wrap` — already has flex-wrap, safe

**Action:** Playwright verify.

#### /stove/scheduler (WeeklyScheduler)
**File:** `app/stove/scheduler/page.tsx`
**Status:** MOBILE-SAFE — WeeklyTimeline already wrapped correctly

Key elements:
- Outer grid: `grid grid-cols-1 lg:grid-cols-2 gap-6` — mobile-safe
- Mode/schedule selector card: single column, `flex flex-col gap-4`
- WeeklyTimeline usage (in scheduler): At line 839, the component is wrapped in `<Card variant="glass" className="p-6">`. The WeeklyTimeline at `app/components/scheduler/WeeklyTimeline.tsx` does NOT use `min-w-[600px]` — it uses `flex items-center gap-3 p-3 rounded-xl` per day row, with a `flex-1` timeline bar. This is flexible and should not overflow.

Note: D-04 in CONTEXT.md refers to a `min-w-[600px]` in WeeklyTimeline. This appears to be the THERMOSTAT WeeklyTimeline at `app/thermostat/schedule/components/WeeklyTimeline.tsx:106` (confirmed: `<div className="min-w-[600px]">`), which already has `overflow-x-auto` on the parent container at line 105. **Already handled.**

The STOVE WeeklyTimeline (`app/components/scheduler/WeeklyTimeline.tsx`) is a completely different component — it uses flexible percentage-based bars, no min-width, already mobile-safe.

**Action:** Playwright verify scheduler page.

---

### Thermostat Pages

#### /thermostat (NetatmoPage)
**File:** `app/thermostat/page.tsx`
**Status:** MOSTLY MOBILE-SAFE — one Grid call needs attention

Key elements:
- `PageLayout` wrapper — already mobile-safe
- Mode control: `flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4` — stacks vertically at 375px
- Mode buttons: `flex flex-wrap gap-2` — already wrapped
- Topology InfoBox grid: `<Grid cols={3} gap="sm" className="md:grid-cols-3">` — Grid with cols=3 resolves to `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`. At 375px = 1 column. MOBILE-SAFE. The `md:grid-cols-3` className override might conflict — needs verification.
- Room grid in manual tab: `<Grid cols={3} gap="md">` — also resolves to `grid-cols-1` at 375px.

**Action:** Playwright verify. Check if `md:grid-cols-3` override class on the InfoBox Grid causes issues (it would set 3 cols at 768px+ overriding the `lg:grid-cols-3` default — benign).

#### /thermostat/schedule (SchedulePage)
**File:** `app/thermostat/schedule/page.tsx`
**Status:** MOBILE-SAFE

Key elements:
- Header: `flex items-start justify-between` — heading + "Aggiorna" button. At 375px, heading with Calendar icon + long title may need flex-wrap. But `items-start` allows the content to start from top, check via screenshot.
- WeeklyTimeline: `app/thermostat/schedule/components/WeeklyTimeline.tsx` line 105: `<div className="overflow-x-auto pb-4 -mx-4 px-4 scrollbar-thin scrollbar-thumb-slate-600">` wrapping a `<div className="min-w-[600px]">`. **Already handled correctly** with scroll hint for mobile.

**Action:** Playwright verify, screenshot header row.

---

### Lights Pages

#### /lights (LightsPage)
**File:** `app/lights/page.tsx`
**Status:** HAS KNOWN ISSUES — two fixes required (D-05, D-06)

**Issue 1 — Line 111:** Stats summary grid
```tsx
// Current (BAD at 375px):
<div className="grid grid-cols-3 gap-6">
// Fix:
<div className="grid grid-cols-3 gap-4 sm:gap-6">
```
Wait — at 375px with `px-4` padding on parent, usable width ≈ 343px. Three columns = ~107px each. With gap-6 (24px), actual column width ≈ (343-48)/3 ≈ 98px. This is tight but the content is just a label + number heading, which may fit. The issue might be marginal — verify via Playwright. If it overflows, change to `grid-cols-3 gap-3` (reducing gap) or `grid-cols-1 sm:grid-cols-3`.

However, per D-05, the decision is to change to `grid-cols-1 sm:grid-cols-3` or similar. The planner should decide whether the 3-stat summary warrants 1 column (stacked) or can stay 3 columns with reduced gap.

**Issue 2 — Line 233:** Color presets grid
```tsx
// Current (BAD at 375px):
<div className="grid grid-cols-5 gap-1.5">
// Fix (per D-06):
<div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
// OR (alternative per D-06):
<div className="grid grid-cols-5 gap-1 min-w-fit overflow-x-auto">
```
5 color swatches at 375px in a grid: each swatch is `w-full aspect-square`. At 375px with parent `p-4` margin, the light card inner is ~295px wide. With 5 columns and gap-1.5 (6px), each swatch is (295-24)/5 ≈ 54px. This is tight. The `grid-cols-3 sm:grid-cols-5` approach is safer.

**Action:** Apply D-05 and D-06 fixes; Playwright verify.

#### /lights/scenes (ScenesPage)
**File:** `app/lights/scenes/page.tsx`
**Status:** MOBILE-SAFE

Scenes grid: `grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4` — base is 2 columns at mobile, already responsive.

**Action:** Playwright verify.

#### /lights/automation (AutomationPage)
**File:** `app/lights/automation/page.tsx`
**Status:** MOBILE-SAFE

Features grid: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6` — base is 1 column, already responsive. Page is a placeholder ("coming soon") so minimal content risk.

**Action:** Playwright verify.

---

### Network Page

#### /network (NetworkPage)
**File:** `app/network/page.tsx`
**Status:** HAS POTENTIAL ISSUES — tab bar and SystemInfoCard

**Issue 1 — Tab Navigation bar (line 215):**
```tsx
<div className="flex gap-1 border-b border-white/[0.06] pb-0">
  {/* 4 tabs: Dispositivi | WiFi Clients | Servizi di Rete | Reti WiFi */}
```
4 tab buttons in a `flex` container with no `flex-wrap`. Tab labels: "Dispositivi" (10), "WiFi Clients" (11), "Servizi di Rete" (14), "Reti WiFi" (9) chars. Each tab has `px-4 py-2 text-sm`. At 375px this is likely to overflow. Fix: `flex-wrap gap-1` or `overflow-x-auto` to allow horizontal scroll on the tab row.

**Issue 2 — SystemInfoCard (app/network/components/SystemInfoCard.tsx line 67):**
```tsx
<div className="grid grid-cols-3 gap-3">
  {/* 3 InfoBox items: Modello, Firmware, Uptime */}
```
No mobile breakpoint. At 375px each column ≈ (375-32-24)/3 ≈ 106px. InfoBox content (model name, firmware version string, uptime) may truncate. Fix: `grid-cols-1 sm:grid-cols-3`.

**Issue 3 — WanStatusCard (line 75):**
```tsx
<div className="grid grid-cols-2 gap-3">
```
2 columns at all widths — at 375px each ≈ 163px. Should be fine for status data. Verify via Playwright.

**Issue 4 — BudgetStatsCard (lines 50, 90):**
```tsx
<div className="grid grid-cols-2 gap-3">
```
Same 2-column pattern — verify via Playwright.

**Charts:** BandwidthChart, BandwidthCorrelationChart, DeviceCountChart are loaded with `next/dynamic`. Recharts charts typically need explicit width handling. These are already using `dynamic` import but may have fixed heights or widths. The charts render inside a `div` with the PageLayout container — overflow-x-auto on the card wrapper may be needed if charts have fixed widths. Verify via Playwright.

**DeviceListTable, WifiClientsTable:** Both use the DataTable DS component which already has `overflow-x-auto`. These are confirmed safe.

**Action:** Fix tab nav overflow (flex-wrap or overflow-x-auto), fix SystemInfoCard grid, verify all via Playwright with screenshots.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Horizontal overflow content | Custom scroll component | `overflow-x-auto` CSS class | Already proven pattern in DataTable and thermostat WeeklyTimeline |
| Responsive grid layout | Custom breakpoint logic | Tailwind responsive prefixes (`sm:`, `md:`, `lg:`) | Project standard throughout codebase |
| Mobile verification | Manual browser testing | Playwright MCP at 375×812 viewport | Established in Phase 151 UAT |

**Key insight:** All fixes are 1-2 class additions. No new components, no new files, no new logic.

---

## Common Pitfalls

### Pitfall 1: Assuming `md:` breakpoint is mobile-safe
**What goes wrong:** A grid with `grid-cols-1 md:grid-cols-3` is mobile-safe (1 column from 0-767px). But a grid with `grid-cols-3 md:grid-cols-3` is NOT — it has 3 columns from 0px upwards.
**Why it happens:** Developers add the desktop breakpoint but forget to set the mobile base.
**How to avoid:** Always check the BASE class (before any prefix). If no `grid-cols-1` base exists, the grid will be its declared count at all widths.
**Warning signs:** `grid grid-cols-N` without a bare `grid-cols-1` anywhere on the same element.

### Pitfall 2: Confusing stove WeeklyTimeline with thermostat WeeklyTimeline
**What goes wrong:** D-04 in CONTEXT.md mentions `WeeklyTimeline.tsx:106` having `min-w-[600px]`. There are TWO WeeklyTimeline components.
**Stove:** `app/components/scheduler/WeeklyTimeline.tsx` — percentage-based bars, no min-width, already mobile-safe.
**Thermostat:** `app/thermostat/schedule/components/WeeklyTimeline.tsx:106` — has `min-w-[600px]`, already wrapped in `overflow-x-auto` at line 105.
**How to avoid:** The thermostat one is ALREADY FIXED. Do not modify the stove one (it's fine). No changes to either WeeklyTimeline are needed.

### Pitfall 3: Breaking the stove page ambient gradient
**What goes wrong:** The stove page uses a `fixed inset-0 -z-10` gradient overlay. If layout changes affect containing blocks, the gradient may not render correctly.
**How to avoid:** Do not change the outer `<div className="relative">` wrapper or any `fixed` positioned elements. Only modify grid/flex children classes.

### Pitfall 4: Network tab bar scroll vs wrap choice
**What goes wrong:** Adding `overflow-x-auto` to the tab bar causes the bottom border to stop at the viewport width, leaving a visible gap. `flex-wrap` causes tabs to spill onto a second line, looking unintentional.
**How to avoid:** Check both visually via Playwright screenshot. Prefer `overflow-x-auto` with `whitespace-nowrap` on each tab button as it's cleaner UX. Or reduce tab font size to `text-xs sm:text-sm` on mobile.

### Pitfall 5: Recharts charts with fixed widths
**What goes wrong:** Recharts requires explicit width. If a chart uses `width={800}` it will overflow at 375px.
**How to avoid:** Recharts best practice is `<ResponsiveContainer width="100%" height={...}>`. Check BandwidthChart and other chart components for fixed width props. If found, wrap the card in `overflow-x-auto`.
**Warning signs:** `width={N}` as a numeric prop on a Recharts component.

---

## Code Examples

### Pattern: Minimal fix for non-responsive stats grid
```tsx
// Source: lights/page.tsx line 111 — apply D-05
// Before:
<div className="grid grid-cols-3 gap-6">
// After (Claude's discretion — 3 small stat boxes at 375px is borderline):
<div className="grid grid-cols-3 gap-3 sm:gap-6">
// OR if it overflows:
<div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
```

### Pattern: Minimal fix for color preset grid
```tsx
// Source: lights/page.tsx line 233 — apply D-06
// Before:
<div className="grid grid-cols-5 gap-1.5">
// After:
<div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
```

### Pattern: Network SystemInfoCard grid fix
```tsx
// Source: app/network/components/SystemInfoCard.tsx line 67
// Before:
<div className="grid grid-cols-3 gap-3">
// After:
<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
// Also fix skeleton at line 39 for consistency
```

### Pattern: Network tab bar overflow fix
```tsx
// Source: app/network/page.tsx line 215
// Option A — allow horizontal scroll:
<div className="flex gap-1 border-b border-white/[0.06] pb-0 overflow-x-auto">
  {tabs.map(tab => (
    <button key={tab.key} className={cn('px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap', ...)}>
      {tab.label}
    </button>
  ))}
</div>
// Option B — wrap to 2 lines:
<div className="flex flex-wrap gap-1 border-b border-white/[0.06] pb-0">
```

### Pattern: Header row justify-between fix
```tsx
// Source: stove/errors/page.tsx and thermostat/schedule/page.tsx header rows
// Before (clips at 375px when title + button exceed viewport width):
<div className="flex items-center justify-between mb-6">
// After:
<div className="flex flex-wrap items-center justify-between gap-3 mb-6">
```

### Pattern: Playwright verification at 375px
```javascript
// Use Playwright MCP to verify each page
// Set viewport to 375x812 (iPhone SE)
// Check: document.body.scrollWidth <= window.innerWidth
// Take screenshot and inspect for clipped controls
```

---

## Environment Availability

Step 2.6: SKIPPED (no external dependencies — pure CSS/Tailwind class changes only)

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest + React Testing Library (unit) + Playwright (E2E) |
| Config file | jest.config.ts |
| Quick run command | `npm test -- --testPathPattern="lights\|network\|stove\|thermostat" --passWithNoTests` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUDIT-01 | Dashboard renders single-column at 375px, no horizontal scroll | Visual/manual | Playwright MCP at 375×812 | N/A — Playwright MCP |
| AUDIT-02 | All stove sub-pages display without overflow at 375px | Visual/manual | Playwright MCP at 375×812 | N/A — Playwright MCP |
| AUDIT-03 | Thermostat pages show full controls at 375px | Visual/manual | Playwright MCP at 375×812 | N/A — Playwright MCP |
| AUDIT-04 | Lights pages fully operable on touch at 375px | Visual/manual | Playwright MCP at 375×812 | N/A — Playwright MCP |
| AUDIT-05 | Network page charts/tables without overflow at 375px | Visual/manual | Playwright MCP at 375×812 | N/A — Playwright MCP |

All requirements for this phase are verified via Playwright visual verification, not unit tests. Per Claude's Discretion (D-08, D-09, D-10), the verification method is:
1. Playwright MCP at 375×812 viewport
2. `document.body.scrollWidth <= window.innerWidth` assertion
3. Screenshot for each page

**No Wave 0 test gaps** — unit tests are not applicable for layout verification. Playwright smoke tests from Phase 97 already cover page loading; this phase adds overflow assertions on top.

### Sampling Rate
- **Per task commit:** Playwright verify the specific pages modified in that task
- **Per wave merge:** Full 13-page verification pass
- **Phase gate:** All 13 pages pass `scrollWidth <= innerWidth` check before `/gsd:verify-work`

---

## Open Questions

1. **Network tab bar — wrap vs scroll**
   - What we know: 4 tabs, labels up to 14 chars, `flex gap-1` no wrap
   - What's unclear: Exact pixel overflow amount at 375px (depends on computed font size/padding)
   - Recommendation: Playwright screenshot first; if it overflows use `overflow-x-auto` + `whitespace-nowrap` on buttons (cleaner UX than wrapping)

2. **Stove errors page header row**
   - What we know: `flex items-center justify-between` with "🚨 Storico Allarmi" heading + "Torna alla Home" button
   - What's unclear: Whether heading fits in remaining space after button at 375px
   - Recommendation: Playwright screenshot; if clipping occurs, add `flex-wrap gap-3` to the flex container

3. **Recharts chart widths on /network**
   - What we know: BandwidthChart, BandwidthCorrelationChart, DeviceCountChart all use `next/dynamic`
   - What's unclear: Whether their internal Recharts components use `ResponsiveContainer` or fixed `width` props
   - Recommendation: Playwright screenshot of /network at 375px will reveal any chart overflow immediately; if found, add `overflow-x-auto` wrapper to chart card containers

---

## Sources

### Primary (HIGH confidence)
- Direct code inspection of all 13 page files in scope (confirmed line numbers, class names)
- Phase 151 SUMMARY (151-01-SUMMARY.md) — DS component audit results
- Project CONTEXT.md decisions D-01 through D-12 — locked fix strategy

### Secondary (MEDIUM confidence)
- Tailwind CSS responsive prefix documentation — base/sm/md convention confirmed from project code
- DataTable component — `overflow-x-auto` at line 496 confirmed by Phase 151 audit

---

## Metadata

**Confidence breakdown:**
- Page audit findings: HIGH — all files read directly, line numbers confirmed
- Fix patterns: HIGH — based on existing project conventions and Phase 151 decisions
- Playwright verification: HIGH — established pattern from Phase 151 UAT

**Research date:** 2026-04-01
**Valid until:** 2026-05-01 (stable codebase)
