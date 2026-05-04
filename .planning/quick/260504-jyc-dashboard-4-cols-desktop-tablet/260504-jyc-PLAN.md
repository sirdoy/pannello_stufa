---
id: 260504-jyc
title: Dashboard 4 colonne su desktop + tablet landscape
date: 2026-05-04
mode: quick
status: planned
---

# Quick Task 260504-jyc

## Goal

Mostrare 4 card per fila in home su desktop e tablet landscape (≥1024px). Mantenere 2 card su mobile e tablet portrait (come adesso).

## Scope

Solo `app/components/DashboardCards.tsx`. Una riga modificata.

## Change

`app/components/DashboardCards.tsx:96`

Prima:
```tsx
<div className="grid grid-cols-2 gap-3 max-w-md sm:max-w-2xl mx-auto px-3">
```

Dopo:
```tsx
<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 max-w-md sm:max-w-2xl lg:max-w-7xl mx-auto px-3">
```

Breakpoint scelto: `lg:` (≥1024px) — copre iPad landscape (1024px) e desktop. Tablet portrait (<1024px) resta a 2 colonne.

## Verify

- Mobile (<640px): 2 colonne, max-w-md.
- ≥640px (tablet portrait): 2 colonne, max-w-2xl (invariato).
- ≥1024px (tablet landscape + desktop): 4 colonne, max-w-7xl.
- Nessun test rotto su `lib/utils/dashboardColumns.ts` (utility non più usata da DashboardCards ma test separati restano verdi).

## Done

- File aggiornato, `npm run test:components -- DashboardCards` o sanity check classi via grep.
