# Phase 154: Pages Audit — Admin & Support Pages - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Audit and fix all registry, settings, debug, camera, and remaining pages at 375px mobile viewport. Each page must render without horizontal overflow, clipped controls, or layout breakage. This phase does NOT touch core device pages (Phase 152) or extended device pages (Phase 153).

</domain>

<decisions>
## Implementation Decisions

### Fix Strategy (all pages)
- **D-01:** Apply minimal, targeted fixes — add responsive Tailwind classes or `overflow-x-auto` wrappers. Do NOT restructure page layouts or rewrite components (same as Phase 152/153 D-01)
- **D-02:** Follow Phase 151's mobile-first convention: base = mobile (375px+), `sm:` = desktop (640px+) (same as Phase 152/153 D-02)
- **D-03:** For data-heavy components (tables, charts), prefer `overflow-x-auto` scroll wrapper over column hiding (same as Phase 152/153 D-03)

### Camera Pages (AUDIT-14)
- **D-04:** Camera pages (/camera, /camera/events) do NOT exist in the codebase — no `app/camera/` directory found. Mark AUDIT-14 as N/A. If camera functionality exists under a different route, note the correct path during execution

### Known Issues (from codebase scout)
- **D-05:** `app/offline/page.tsx:213` has `grid-cols-3` at base with no responsive override — fix to `grid-cols-1 sm:grid-cols-3`
- **D-06:** `app/offline/page.tsx:295` has `grid-cols-2` at base — verify visually, may be fine for small stat items
- **D-07:** `app/debug/logs/page.tsx:187` has `grid-cols-2 md:grid-cols-4` — `grid-cols-2` at base may be tight at 375px for stat cards, verify visually
- **D-08:** `app/debug/notifications/test/page.tsx:379` has `grid-cols-2` — verify visually
- **D-09:** `app/debug/page.tsx:235` has `grid-cols-1 md:grid-cols-3` — already mobile-safe (grid-cols-1 at base)
- **D-10:** `app/debug/notifications/page.tsx` has multiple grids (grid-cols-1 md:grid-cols-3, grid-cols-1 md:grid-cols-2) — already mobile-safe
- **D-11:** Registry pages (devices, types) use DataTable which already has `overflow-x-auto` — likely need only column width verification at 375px
- **D-12:** Settings pages mostly have responsive grids already (notifications uses `grid-cols-1 sm:grid-cols-2`)
- **D-13:** `app/settings/notifications/history/page.tsx:129` has `max-w-[200px] truncate` — likely fine, verify visually
- **D-14:** `app/changelog/page.tsx:274` has `min-w-[40px]` on pagination buttons — likely fine

### Design-System Exclusion
- **D-15:** `/debug/design-system` is excluded from this audit — it's a 138KB developer showcase page, not user-facing. Already audited in Phase 151

### Debug Sub-Pages Scope
- **D-16:** `/debug/transitions` and `/debug/weather-test` are developer tools — include in audit but with lower priority. They have responsive grids already

### Verification Method
- **D-17:** Use Playwright MCP at 375x812 viewport (same as Phase 151/152/153 UAT) to verify each page after fixes
- **D-18:** Check `document.body.scrollWidth <= window.innerWidth` for each page as automated overflow test
- **D-19:** Visual screenshot for each page to catch clipped controls or unreadable text

### Plan Grouping
- **D-20:** Plan 01: Registry pages (/registry/devices, /registry/types) + Settings pages (/settings and all 7 sub-pages) — AUDIT-11, AUDIT-12
- **D-21:** Plan 02: Debug pages (/debug, /debug/api, /debug/logs, /debug/notifications, /debug/notifications/test, /debug/transitions, /debug/weather-test) + Remaining pages (/changelog, /offline, /log) — AUDIT-13, AUDIT-14 (N/A), AUDIT-15

### Claude's Discretion
- Exact responsive breakpoint choices per component (grid-cols-1 vs grid-cols-2 at base)
- Whether `grid-cols-2` stat grids in debug pages need mobile adjustment after visual inspection
- Order of page fixes within each plan
- Whether to add unit tests for layout changes (prefer Playwright verification over unit tests for layout)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Pages to Audit — Registry
- `app/registry/devices/page.tsx` — Device registry CRUD page with DataTable
- `app/registry/types/page.tsx` — Device types CRUD page with DataTable

### Pages to Audit — Settings
- `app/settings/page.tsx` — Settings root page
- `app/settings/dashboard/page.tsx` — Dashboard settings
- `app/settings/devices/page.tsx` — Device settings
- `app/settings/location/page.tsx` — Location settings
- `app/settings/notifications/page.tsx` — Notification settings (grid-cols-1 sm:grid-cols-2)
- `app/settings/notifications/devices/page.tsx` — Notification devices settings
- `app/settings/notifications/history/page.tsx` — Notification history (max-w-[200px])
- `app/settings/thermostat/page.tsx` — Thermostat settings

### Pages to Audit — Debug
- `app/debug/page.tsx` — Debug panel root (grid-cols-1 md:grid-cols-3, already responsive)
- `app/debug/api/page.tsx` — API debug page
- `app/debug/logs/page.tsx` — Logs page (grid-cols-2 md:grid-cols-4, check 375px)
- `app/debug/notifications/page.tsx` — Notification debug (multiple responsive grids)
- `app/debug/notifications/test/page.tsx` — Notification test (grid-cols-2)
- `app/debug/transitions/page.tsx` — Transition debug (grid-cols-2, sm:grid-cols-2)
- `app/debug/weather-test/page.tsx` — Weather test debug

### Pages to Audit — Remaining
- `app/changelog/page.tsx` — Changelog (min-w-[40px] pagination)
- `app/offline/page.tsx` — Offline page (grid-cols-3 and grid-cols-2 at base, NEEDS FIX)
- `app/log/page.tsx` — Log page (no grid patterns found)

### Prior Phase Context
- `.planning/phases/153-pages-audit-extended-device-pages/153-CONTEXT.md` — Extended device pages audit patterns
- `.planning/phases/152-pages-audit-core-device-pages/152-CONTEXT.md` — Core pages audit patterns
- `.planning/phases/151-design-system-mobile-first/151-CONTEXT.md` — DS mobile-first patterns

### Design System
- `docs/design-system.md` — Design system documentation
- `app/debug/design-system/page.tsx` — Mobile-First Patterns reference section (EXCLUDED from audit)

### Requirements
- `.planning/REQUIREMENTS.md` — AUDIT-11 through AUDIT-15

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Phase 151/152/153 established all responsive patterns — no new patterns needed
- `DataTable` component already has `overflow-x-auto` — Registry pages are covered
- `PageLayout` uses `px-4` base padding — consistent across all pages

### Established Patterns
- Mobile-first convention: base = 375px+, `sm:` = 640px+
- `overflow-x-auto` on data-heavy content (DataTable, charts)
- Grid responsive: `grid-cols-1` at base, `sm:grid-cols-N` for desktop
- Small stat grids: `grid-cols-2` at base is generally OK for tiny stat boxes (verified in Phase 153)

### Integration Points
- Registry pages use DataTable + FormModal + ConfirmationDialog pattern
- Settings pages use form-based layouts with various input components
- Debug pages are standalone developer tools with no cross-page dependencies
- Changelog/offline/log are standalone support pages

### Potential Issues Found
- `app/offline/page.tsx:213` — `grid-cols-3` guarantees tight layout at 375px (3 cols x ~100px + gaps)
- `app/debug/logs/page.tsx:187` — `grid-cols-2` stat cards may be tight if content is wide
- Most other pages appear to already have responsive patterns or simple single-column layouts

</code_context>

<specifics>
## Specific Ideas

No specific requirements — this is a mechanical audit-and-fix phase. Use Playwright at 375px to discover issues, apply minimal responsive fixes following Phase 151/152/153 conventions. Camera pages (AUDIT-14) are N/A as the directory doesn't exist.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 154-pages-audit-admin-support-pages*
*Context gathered: 2026-04-02*
