---
phase: 182-design-system-reference-page-v2
plan: "05"
subsystem: debug/design-system-v2
tags: [design-system, tokens, typography, spacing, shadow, blur, useEffect, getComputedStyle]
dependency_graph:
  requires: [182-01-PLAN]
  provides: [Section03Tokens extended token reference]
  affects: [app/debug/design-system-v2/sections/Section03Tokens.tsx]
tech_stack:
  added: []
  patterns:
    - getComputedStyle(document.documentElement) inside useEffect for SSR-safe CSS variable reads
    - AUDIT-EXCEPTION comments for documentary literal values
key_files:
  modified:
    - app/debug/design-system-v2/sections/Section03Tokens.tsx
decisions:
  - Preserved verbatim oklch swatch grid from Plan 01 (existing static dl) + appended four new sub-blocks after it
  - Used useEffect with empty deps array for one-time client-side token resolution (SSR safety per RESEARCH Pitfall 7)
  - Zero-width spacing tile for 0px uses minWidth:1 to remain visible
  - Sub-block D renders two glass tiles side-by-side (shadow + blur) wrapped in a flex row
metrics:
  duration: "~5 minutes"
  completed: "2026-05-03T12:34:03Z"
  tasks_completed: 1
  tasks_total: 1
  files_modified: 1
---

# Phase 182 Plan 05: Extend Section03Tokens — Token Reference Specimens

Section03Tokens extended from a verbatim oklch swatch grid (~100 LOC) into a full token reference page (~400+ LOC) covering live token values, all 10 typography specimens, 12 spacing scale tiles, and shadow/blur sample tiles.

## What Was Built

**File:** `app/debug/design-system-v2/sections/Section03Tokens.tsx`

Four new sub-blocks appended below the existing static oklch swatch grid:

**Sub-block A — Live token table (D-15)**
- `TOKEN_NAMES` const with all 11 CSS variable names
- `useState<Record<TokenName, string>>` initialized with empty strings
- `useEffect(() => { getComputedStyle(document.documentElement) ... }, [])` reads live resolved values on mount — SSR safe (RESEARCH Pitfall 7)
- `<dl>` grid showing each token name + live-resolved value with `data-token-name` attributes

**Sub-block B — Typography specimens (D-17, UI-SPEC §Specimen Scale)**
All 10 specimens from the spec, each showing the text at the target size/weight/family with a 12px annotation below:
1. Outfit 40/600 / tracking -1px — "Ember Glass"
2. Outfit 24/600 — "Tipografia display"
3. Outfit 18/600 — "Nome primitivo"
4. Outfit 68/600 — "21°"
5. Outfit 28/600 — "72%"
6. Inter 16/400 — "Testo corpo con ritmo 1.5."
7. Inter 14/500 — "Descrizione in una riga."
8. Inter 12/600/1.2px/uppercase — "01 / TOKENS"
9. Inter 13/500 — "Stufa"
10. ui-monospace 12/400 — `<GlassCard tone={…} />`

All font-size literals inside Sub-block B are tagged with an `AUDIT-EXCEPTION (DSREF-02)` comment block.

**Sub-block C — Spacing scale tiles (D-16)**
12 px literals (0, 4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 64) each rendered as a horizontal `var(--accent)` filled bar with `data-spacing-px` attribute + label. Includes `minWidth: 1` so the 0px tile is still visible.

**Sub-block D — Shadow + blur tiles (DSREF-01)**
Two glass tiles side-by-side:
- Shadow tile: `boxShadow: 'var(--glass-shadow)'` with `data-shadow-tile`
- Blur tile: `backdropFilter: 'blur(var(--glass-blur)) saturate(180%)'` (+ `-webkit-` prefix) with `data-blur-tile`

## Verification

- `head -1`: `'use client';`
- Import: `import React, { useState, useEffect } from 'react';`
- TOKEN_NAMES entries: 22 matches (11 in const array + 11 in static dl + additional references)
- `getComputedStyle(document.documentElement)`: 1 occurrence (inside useEffect)
- Spacing array: 1 occurrence
- Typography specimen sizes (68|28|18|14|13|40): 6 matches
- `var(--glass-shadow)`: 1 occurrence
- `var(--glass-blur)`: 2 occurrences
- `id="sec-03-heading"`: 1 occurrence (preserved)
- `oklch`: 7 occurrences (existing preset map preserved)
- No Tailwind visual classNames: 0 matches
- Page Jest test: 13/13 passing

## Deviations from Plan

None — plan executed exactly as written. The file was extended additively with all four sub-blocks; the existing oklch swatch grid was preserved verbatim.

## Threat Flags

None. Section03Tokens reads CSS variables via `getComputedStyle` (read-only CSSOM, no injection path per T-182-05-01 in plan threat register). No new network endpoints or auth paths.

## Self-Check: PASSED

| Item | Status |
|------|--------|
| `app/debug/design-system-v2/sections/Section03Tokens.tsx` | FOUND |
| `.planning/phases/182-design-system-reference-page-v2/182-05-SUMMARY.md` | FOUND |
| Commit `4c007db4` | FOUND |
| Jest 13/13 passing | PASSED |
