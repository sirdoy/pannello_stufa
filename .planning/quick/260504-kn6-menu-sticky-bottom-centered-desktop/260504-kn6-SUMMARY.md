---
quick_id: 260504-kn6
description: BottomTabBar sticky always visible (mobile + desktop centered)
date: 2026-05-04
status: complete
commit: faeb136b
---

# Quick 260504-kn6 — Summary

## What changed

`<BottomTabBar />` spostato fuori da `<ClientProviders>` in [app/layout.tsx](../../../app/layout.tsx). Ora è sibling di `</ClientProviders>` invece che child, così la `transform: scale(...)` del wrapper SplashGate non lo intercetta come containing block.

## Root cause

`SplashGate` ([SplashGate.tsx:62-74](../../../app/components/EmberGlass/SplashGate.tsx:62)) wrappa i children in un `<div>` con `transform: scale(0.97)` → `scale(1)` per l'animazione di splash. Per CSS spec, qualsiasi `transform` non-`none` su un antenato crea un containing block per `position: fixed` discendenti.

Risultato: il bar (`position: fixed; bottom: 8px`) si ancorava al fondo del wrapper SplashGate (che contiene il `<main>` flex-1 di altezza variabile) invece che al viewport. User vedeva il bar solo scrollando in fondo alla pagina, e su desktop "a metà" perché il wrapper era leggermente offset dal viewport.

## Why it works now

`<BottomTabBar />` ora è figlio diretto di `<body>` — l'unico wrapper rimasto è body stesso, che non ha `transform`. `position: fixed` si risolve contro il viewport come da default.

La regola CSS `body[data-sheet-open="true"] [data-bottom-tab="true"]` ([globals.css:378](../../../app/globals.css:378)) continua a funzionare: è un selector descendant da `body`, indipendente dalla profondità del nesting.

## Verification

- `npm run test:components -- BottomTabBar` → 16 tests passed (BottomTabBar 9 + adjacent suite)
- Code change: 1 file (app/layout.tsx), +4 -1 lines

## Commit

`faeb136b` — fix(layout): render BottomTabBar outside ClientProviders so SplashGate's transform wrapper doesn't become its containing block (260504-kn6)
