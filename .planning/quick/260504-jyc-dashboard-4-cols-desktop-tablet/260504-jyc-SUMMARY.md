---
id: 260504-jyc
title: Dashboard 4 colonne su desktop + tablet landscape
date: 2026-05-04
status: complete
---

# Quick Task 260504-jyc — Summary

## Change

`app/components/DashboardCards.tsx:96` — wrapper grid:

- Prima: `grid grid-cols-2 gap-3 max-w-md sm:max-w-2xl mx-auto px-3`
- Dopo: `grid grid-cols-2 lg:grid-cols-4 gap-3 max-w-md sm:max-w-2xl lg:max-w-7xl mx-auto px-3`

## Behavior

| Breakpoint | Cols | Max-width |
|-----------|------|-----------|
| <640px (mobile) | 2 | max-w-md (28rem) |
| 640–1023px (tablet portrait) | 2 | max-w-2xl (42rem) |
| ≥1024px (tablet landscape + desktop) | 4 | max-w-7xl (80rem) |

`lg:` breakpoint (1024px) coincide con iPad landscape e dimensioni desktop.

## Tests

`npm run test:components -- DashboardCards` → 18/18 PASS. Test selector `.grid.grid-cols-2` continua a matchare grazie alla classe base mantenuta.

## Files

- `app/components/DashboardCards.tsx` — 1 line modified
