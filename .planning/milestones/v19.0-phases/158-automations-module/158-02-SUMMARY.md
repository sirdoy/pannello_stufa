---
phase: 158-automations-module
plan: "02"
subsystem: automations-ui
tags: [ui, crud, automations, navigation, datatable, formmodal]
dependency_graph:
  requires: ["158-01"]
  provides: ["automations-ui", "automations-nav"]
  affects: ["lib/devices/deviceTypes.ts", "app/components/Navbar.tsx"]
tech_stack:
  added: []
  patterns: ["DataTable+FormModal+ConfirmationDialog CRUD", "inline hook pattern", "paginated PaginatedResponse<T>"]
key_files:
  created:
    - app/automations/page.tsx
    - app/automations/[rule_id]/page.tsx
  modified:
    - lib/devices/deviceTypes.ts
    - app/components/Navbar.tsx
decisions:
  - "Switch component used for enabled toggle via checked+onCheckedChange props"
  - "SettingsLayout title+backHref used instead of PageLayout.Header (matches existing rooms pattern)"
  - "EmptyState implemented inline (text+button) matching rooms/page.tsx pattern rather than EmptyState component"
metrics:
  duration_minutes: 25
  completed_date: "2026-04-08"
  tasks_completed: 4
  files_modified: 4
---

# Phase 158 Plan 02: Automations UI Summary

**One-liner:** Full Automations UI with nav entry (Zap icon), CRUD list page (DataTable+FormModal+Zod), and rule detail page with paginated execution history.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add Automazioni nav entry | 57af5cef | lib/devices/deviceTypes.ts, app/components/Navbar.tsx |
| 2 | Rules list page with CRUD | 78c27aab | app/automations/page.tsx |
| 3 | Rule detail + execution history | a0ed5461 | app/automations/[rule_id]/page.tsx |
| 4 | Visual verification (auto-approved) | — | — |

## What Was Built

### Navigation (Task 1)
- Added `AUTOMAZIONI` entry to `GLOBAL_SECTIONS` in `lib/devices/deviceTypes.ts` with `id: 'automations'`, `name: 'Automazioni'`, `route: '/automations'`
- Added `Zap` to lucide-react imports in `Navbar.tsx`
- Added `if (path.includes('automations')) return <Zap className="w-5 h-5" />` in `getIconForPath`

### Rules List Page (Task 2) — `app/automations/page.tsx`
- `useAutomations` hook: paginated fetch from `/api/v1/automations?limit=20&offset=N`
- `ColumnDef<AutomationRule>[]`: Nome (clickable → detail), Stato (ember/neutral Badge), Ultima esecuzione, Azioni (edit/delete)
- Create FormModal with Zod validation: name (min 1, max 128), description (max 500), enabled (Switch)
- Edit FormModal with `key={ruleToEdit?.id ?? 'create'}` for remount
- Delete ConfirmationDialog with Italian copy
- Pagination controls when totalCount > PAGE_SIZE
- Italian toast messages: "Regola creata con successo", "Regola aggiornata con successo", "Regola eliminata"

### Rule Detail Page (Task 3) — `app/automations/[rule_id]/page.tsx`
- `useAutomationDetail` hook: fetches `/api/v1/automations/${ruleId}`
- `useExecutions` hook: paginated fetch from `/api/v1/automations/${ruleId}/executions`
- Execution status badges: sage=Completata, danger=Fallita, warning=In esecuzione
- Metadata card: Stato badge, Creata il (it-IT date), ID
- Execution history DataTable: Data (toLocaleString it-IT), Stato, Durata (ms), Dettaglio
- Empty state: "Nessuna esecuzione registrata"
- Pagination controls for executions

## Deviations from Plan

### Auto-fixed Issues

None.

### Minor Adjustments

**1. PageLayout.Header not used — SettingsLayout title prop used instead**
- Found during: Task 2, Task 3
- Issue: Existing CRUD pages (rooms/page.tsx, registry/devices/page.tsx) use `<SettingsLayout title="..." backHref="...">` without PageLayout.Header
- Fix: Matched the established pattern — `<SettingsLayout title="Automazioni">` for list, `title={rule?.name ?? 'Caricamento...'}` for detail
- Impact: Consistent UX with existing pages

**2. EmptyState implemented inline rather than as EmptyState component**
- Found during: Task 2
- Issue: Existing rooms/page.tsx uses inline text+button for empty state, not the EmptyState component
- Fix: Matched rooms pattern — `<div className="text-center py-8 text-slate-400">` with text and button
- Impact: Visual consistency with existing pages

## Known Stubs

None — all data fetching is wired to live API endpoints (`/api/v1/automations*`).

## Threat Flags

None. No new network endpoints, auth paths, or trust boundaries introduced. Pages fetch via existing auth-protected API routes (T-158-07 accepted per plan).

## Self-Check: PASSED

- app/automations/page.tsx: FOUND
- app/automations/[rule_id]/page.tsx: FOUND
- lib/devices/deviceTypes.ts AUTOMAZIONI entry: FOUND
- app/components/Navbar.tsx Zap import: FOUND
- Commits 57af5cef, 78c27aab, a0ed5461: FOUND
