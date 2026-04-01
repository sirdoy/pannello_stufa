# Phase 152: Pages Audit — Core & Device Pages - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Audit and fix all core and device pages at 375px viewport: dashboard (/), stove (/stove, /stove/errors, /stove/maintenance, /stove/scheduler), thermostat (/thermostat, /thermostat/schedule), lights (/lights, /lights/scenes, /lights/automation), and network (/network). Each page must render without horizontal overflow, clipped controls, or layout breakage. This phase does NOT touch DS components (done in Phase 151) or extended device pages (Phase 153).

</domain>

<decisions>
## Implementation Decisions

### Fix Strategy (all pages)
- **D-01:** Apply minimal, targeted fixes — add responsive Tailwind classes (e.g., `grid-cols-1 sm:grid-cols-3`) or `overflow-x-auto` wrappers. Do NOT restructure page layouts or rewrite components
- **D-02:** Follow Phase 151's mobile-first convention: base = mobile (375px+), `sm:` = desktop (640px+)
- **D-03:** For data-heavy components (tables, timelines, charts), prefer `overflow-x-auto` scroll wrapper over column hiding — preserves all data on mobile

### Known Issues (from codebase scout)
- **D-04:** `WeeklyTimeline.tsx:106` has `min-w-[600px]` — wrap parent in `overflow-x-auto` to allow horizontal scroll at 375px rather than removing the min-width (timeline needs horizontal space for 7 days)
- **D-05:** `lights/page.tsx:111` has non-responsive `grid-cols-3` — change to `grid-cols-1 sm:grid-cols-3` or similar
- **D-06:** `lights/page.tsx:233` has `grid-cols-5 gap-1.5` — change to `grid-cols-3 sm:grid-cols-5` or wrap to allow scroll
- **D-07:** Stove page uses `grid grid-cols-1 md:grid-cols-3` — already responsive, likely fine

### Verification Method
- **D-08:** Use Playwright MCP at 375×812 viewport (same as Phase 151 UAT) to verify each page after fixes
- **D-09:** Check `document.body.scrollWidth <= window.innerWidth` for each page as automated overflow test
- **D-10:** Visual screenshot for each page to catch clipped controls or unreadable text

### Plan Grouping
- **D-11:** Plan 01: Dashboard (/) + all stove pages (/stove, /stove/errors, /stove/maintenance, /stove/scheduler) — AUDIT-01, AUDIT-02
- **D-12:** Plan 02: Thermostat (/thermostat, /thermostat/schedule) + lights (/lights, /lights/scenes, /lights/automation) + network (/network) — AUDIT-03, AUDIT-04, AUDIT-05

### Claude's Discretion
- Exact responsive breakpoint choices (grid-cols-1 vs grid-cols-2 at base) per component
- Whether to use `overflow-x-auto` vs responsive restructuring for charts on /network
- Order of page fixes within each plan
- Whether to add unit tests for layout changes (prefer Playwright verification over unit tests for layout)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Pages to Audit
- `app/page.tsx` — Dashboard home (delegates to DashboardCards)
- `app/components/DashboardCards.tsx` — Dashboard card layout
- `app/stove/page.tsx` — Stove orchestrator page
- `app/stove/errors/page.tsx` — Stove errors page
- `app/stove/maintenance/page.tsx` — Stove maintenance page
- `app/stove/scheduler/page.tsx` — Stove scheduler page
- `app/thermostat/page.tsx` — Thermostat page
- `app/thermostat/schedule/page.tsx` — Thermostat schedule page (contains WeeklyTimeline)
- `app/thermostat/schedule/components/WeeklyTimeline.tsx` — Known `min-w-[600px]` issue
- `app/lights/page.tsx` — Lights page (known grid-cols issues)
- `app/lights/scenes/page.tsx` — Lights scenes page
- `app/lights/automation/page.tsx` — Lights automation page
- `app/network/page.tsx` — Network page with charts/tables

### Prior Phase Context
- `.planning/phases/151-design-system-mobile-first/151-CONTEXT.md` — DS mobile-first patterns and conventions (D-01 through D-12)
- `.planning/phases/151-design-system-mobile-first/151-01-SUMMARY.md` — DS component audit results

### Design System
- `docs/design-system.md` — Design system documentation
- `app/debug/design-system/page.tsx` — Mobile-First Patterns reference section

### Requirements
- `.planning/REQUIREMENTS.md` — AUDIT-01 through AUDIT-05

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Phase 151 established `flex-wrap` on ButtonGroup — no further DS changes needed
- `Grid` component already uses `grid-cols-1` as base — pages using Grid component are likely mobile-safe
- `PageLayout` uses `px-4` base padding — consistent mobile spacing

### Established Patterns
- Mobile-first convention: base = 375px+, `sm:` = 640px+
- `overflow-x-auto` on DataTable — proven pattern for wide content
- Stove page uses orchestrator pattern with hooks + presentational components
- Charts use `next/dynamic` for lazy loading (Recharts)

### Integration Points
- Dashboard renders cards via DashboardCards async server component with per-card Suspense
- Each device page follows orchestrator pattern: page.tsx → hooks → components
- Network page has Recharts charts that may need responsive width/height

### Potential Issues Found
- `WeeklyTimeline.tsx:106` — `min-w-[600px]` guarantees overflow at 375px
- `lights/page.tsx:111` — `grid-cols-3` without mobile base
- `lights/page.tsx:233` — `grid-cols-5` at base breakpoint
- Network charts may have fixed dimensions — need to verify

</code_context>

<specifics>
## Specific Ideas

No specific requirements — this is a mechanical audit-and-fix phase. Use Playwright at 375px to discover issues, apply minimal responsive fixes following Phase 151's conventions.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 152-pages-audit-core-device-pages*
*Context gathered: 2026-04-01*
