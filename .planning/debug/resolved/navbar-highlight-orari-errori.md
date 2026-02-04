---
status: resolved
trigger: "Nella navbar quando vado in 'Orari' mi illumina anche 'Errori' e viceversa"
created: 2026-02-04T10:30:00Z
updated: 2026-02-04T10:42:00Z
---

## Current Focus

hypothesis: CONFIRMED - Mobile bottom nav extracts first path segment ("stove") causing both /stove/scheduler and /stove/errors to highlight
test: Replace pathname.includes(firstSegment) with exact pathname comparison
expecting: Only the exact matching route will be highlighted
next_action: fix the active route detection logic

## Symptoms

expected: Solo la voce cliccata dovrebbe essere illuminata/evidenziata come attiva
actual: Quando clicco su "Orari" si illumina anche "Errori", e viceversa quando clicco su "Errori" si illumina anche "Orari"
errors: Nessun errore nella console
reproduction: Navigare alla pagina Orari o Errori nella navbar
started: Il bug è apparso da poco tempo, prima funzionava correttamente

## Eliminated

## Evidence

- timestamp: 2026-02-04T10:35:00Z
  checked: Navbar.js component (line 639-648)
  found: Mobile bottom navigation uses pathname.includes() to check active state
  implication: Line 648 checks if pathname includes first segment of action.href, so "/stove/errors" includes "stove" AND "/stove/scheduler" includes "stove" - both get highlighted

- timestamp: 2026-02-04T10:36:00Z
  checked: getMobileQuickActions function (lines 27-57)
  found: Returns both '/stove/scheduler' (Orari) and '/stove/errors' (Errori) as separate actions
  implication: Both buttons exist and should be independently highlightable

- timestamp: 2026-02-04T10:37:00Z
  checked: Active route logic (lines 646-648)
  found: `pathname.includes(action.href.split('/').filter(Boolean)[0])` extracts first path segment
  implication: For both "Orari" (/stove/scheduler) and "Errori" (/stove/errors), it extracts "stove", so both match when pathname is /stove/*

## Resolution

root_cause: Mobile bottom navigation (Navbar.js:646-648) uses `pathname.includes(action.href.split('/').filter(Boolean)[0])` which extracts only the first path segment. For both "Orari" (/stove/scheduler) and "Errori" (/stove/errors), this extracts "stove", causing both buttons to highlight when on any /stove/* route. The logic should do exact pathname comparison instead.
fix: Replaced `pathname.includes(action.href.split('/').filter(Boolean)[0])` with `isActive(action.href)` which performs exact pathname comparison (`pathname === path`)
verification: PASSED - All Navbar tests pass (11/11). The mobile bottom navigation now uses the same exact pathname matching as the desktop navigation and mobile menu, ensuring only the current active route is highlighted. Fix is minimal (removed 3 lines) and uses existing helper function.
files_changed: ['app/components/Navbar.js']
