---
phase: 177
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/components/EmberGlass/GlassCard.tsx
  - app/components/EmberGlass/CardHead.tsx
  - app/components/EmberGlass/StatusDot.tsx
  - app/components/EmberGlass/MiniStat.tsx
  - app/components/EmberGlass/InlineToggle.tsx
  - app/components/EmberGlass/__tests__/GlassCard.test.tsx
  - app/components/EmberGlass/__tests__/CardHead.test.tsx
  - app/components/EmberGlass/__tests__/StatusDot.test.tsx
  - app/components/EmberGlass/__tests__/MiniStat.test.tsx
  - app/components/EmberGlass/__tests__/InlineToggle.test.tsx
autonomous: true
requirements: [DASH-01, DASH-04, DASH-09, DASH-12]
tags: [ember-glass, primitives, dashboard]
must_haves:
  truths:
    - "GlassCard renders a 1:1 square glass surface and auto-wraps in Pressable when onOpen is provided"
    - "CardHead renders a 32x32 colored icon tile + 13px label + optional right slot"
    - "StatusDot renders an 8px dot with on/off glow"
    - "MiniStat renders a label + 15px value + 3px progress bar"
    - "InlineToggle renders an iOS-style 44x26 switch that calls onChange on click"
  artifacts:
    - path: app/components/EmberGlass/GlassCard.tsx
      provides: "1:1 glass surface primitive"
    - path: app/components/EmberGlass/CardHead.tsx
      provides: "Card header row primitive"
    - path: app/components/EmberGlass/StatusDot.tsx
      provides: "8px status indicator dot"
    - path: app/components/EmberGlass/MiniStat.tsx
      provides: "Compact stat with progress bar"
    - path: app/components/EmberGlass/InlineToggle.tsx
      provides: "iOS-style switch"
  key_links:
    - from: app/components/EmberGlass/GlassCard.tsx
      to: app/components/EmberGlass/Pressable.tsx
      via: "import { Pressable }"
      pattern: "import.*Pressable.*from.*Pressable"
---

<objective>
Ship the 5 stateless EmberGlass micro-primitives that all 9 dashboard cards consume. These primitives lift their visuals verbatim from `.planning/inbox/ember-glass-design/project/components/cards.jsx` onto Phase 174 tokens (`var(--glass-bg)`, `var(--r-card)`, `var(--pad-card)`, `var(--text-1)`, `var(--text-2)`, `var(--accent)`, `var(--font-display)`).

Purpose: Establish the foundational building blocks for the equal-size 1:1 dashboard grid (DASH-01) so cards in Wave 2 can compose them without re-implementing glass styling.
Output: 5 primitive components + 5 jest unit tests, all under `app/components/EmberGlass/`. No card files in this plan.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/ROADMAP.md
@.planning/phases/177-equal-size-dashboard-glass-cards/177-CONTEXT.md
@.planning/phases/177-equal-size-dashboard-glass-cards/177-PATTERNS.md
@.planning/phases/177-equal-size-dashboard-glass-cards/177-UI-SPEC.md
@CLAUDE.md
@app/components/EmberGlass/Pressable.tsx
@app/components/EmberGlass/FlameViz.tsx
@app/components/EmberGlass/AmbientBg.tsx

<interfaces>
<!-- Phase 175 Pressable contract — consumed by GlassCard when onOpen is provided -->
From app/components/EmberGlass/Pressable.tsx:
```typescript
export interface PressableProps {
  children: ReactNode;
  as?: ElementType;
  onClick?: (e: MouseEvent) => void;
  style?: CSSProperties;
  className?: string;
  disabled?: boolean;
  // ...polymorphic prop forwarding
}
export const Pressable: <As extends ElementType = 'button'>(props: PressableProps) => JSX.Element;
```

<!-- Phase 174 token block — consumed by every primitive -->
:root tokens (locked in Phase 174):
- `--glass-bg`, `--glass-blur`, `--glass-border`, `--glass-shadow`
- `--accent` (oklch)
- `--text-1`, `--text-2`
- `--r-card` (24px), `--pad-card` (16px)
- `--font-display` (Outfit), `--font-body` (Inter)
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Build GlassCard + StatusDot primitives with jest tests</name>
  <files>
    app/components/EmberGlass/GlassCard.tsx
    app/components/EmberGlass/StatusDot.tsx
    app/components/EmberGlass/__tests__/GlassCard.test.tsx
    app/components/EmberGlass/__tests__/StatusDot.test.tsx
  </files>
  <read_first>
    - .planning/phases/177-equal-size-dashboard-glass-cards/177-PATTERNS.md (sections "Primitive: GlassCard" + "Primitive: StatusDot")
    - .planning/phases/177-equal-size-dashboard-glass-cards/177-UI-SPEC.md (sections "Color" + "Component Inventory")
    - .planning/inbox/ember-glass-design/project/components/cards.jsx (lines 7-80 — bundle source)
    - app/components/EmberGlass/Pressable.tsx (full file — interface contract for `Pressable`)
    - app/components/EmberGlass/AmbientBg.tsx (top-of-file `'use client'` + inline-style convention)
    - app/components/EmberGlass/FlameViz.tsx (pure-prop primitive analog)
    - app/components/EmberGlass/__tests__/Pressable.test.tsx (jest analog: rendering + click + style assertions)
  </read_first>
  <behavior>
    - GlassCard with no onOpen: renders a `div[data-testid="glass-card"]` with `aspectRatio: '1 / 1'`, `borderRadius: var(--r-card)`, `padding: var(--pad-card)`, `background: var(--glass-bg)`, `backdropFilter: blur(var(--glass-blur)) saturate(180%)`, `WebkitBackdropFilter` matching, no `cursor: pointer`.
    - GlassCard with onOpen: same visuals, root rendered via `<Pressable>`, has `cursor: pointer`, `onClick` invokes `onOpen` exactly once per click.
    - GlassCard with `tone` prop: renders an absolute-positioned radial-gradient overlay div using the tone color at `opacity: 0.55`.
    - GlassCard with `data-testid` prop: overrides default `glass-card` testid.
    - StatusDot on=true: 8x8 round, `boxShadow: 0 0 12px {color}`, default color = `var(--accent)`.
    - StatusDot on=false: same size, `background: rgba(255,255,255,0.18)`, `boxShadow: 'none'`.
    - StatusDot exposes `data-testid="status-dot"` and `data-on={"true"|"false"}` attributes.
  </behavior>
  <action>
Create both primitives following the exact pattern in 177-PATTERNS.md:

1. `app/components/EmberGlass/GlassCard.tsx` — copy the code block from PATTERNS.md "Primitive: GlassCard" verbatim. Include `'use client'`, header docstring referencing bundle line range `cards.jsx:7-50`, types `GlassCardProps { children, tone?, onOpen?, style?, 'data-testid'? }`, the `baseStyle` constant with all listed properties, and the conditional Pressable wrap pattern. Default `data-testid` is `glass-card`. Aspect-ratio `1 / 1` is hard-coded. NO useMemo, NO useCallback (D-28).

2. `app/components/EmberGlass/StatusDot.tsx` — copy from PATTERNS.md "Primitive: StatusDot" verbatim. `'use client'`, props `{ on, color? }`, default color `var(--accent)`, `data-testid="status-dot"`, `data-on` attribute reflects `on`. Styles inline.

3. Tests:
   - `app/components/EmberGlass/__tests__/GlassCard.test.tsx` — three test cases per `<behavior>`: (a) renders 1:1 + tokens with no onOpen (assert `el.style.aspectRatio === '1 / 1'`, `el.style.borderRadius` contains `var(--r-card)`, `el.style.cursor` !== `'pointer'`); (b) with onOpen wraps in Pressable (assert `el.style.cursor === 'pointer'`, `el.click()` calls jest.fn() once); (c) with tone renders radial-gradient overlay child (query for inline-style child containing `radial-gradient` and the tone string).
   - `app/components/EmberGlass/__tests__/StatusDot.test.tsx` — three test cases: (a) on=true with default color uses `var(--accent)` and has `boxShadow` containing `12px`; (b) on=false has `background` matching `rgba(255,255,255,0.18)` and `boxShadow: none`; (c) `data-on` attribute equals `"true"` when on is true.
   - Test scaffolding: `import { render } from '@testing-library/react'` + `import { GlassCard } from '../GlassCard'` (analog: `__tests__/Pressable.test.tsx`).
  </action>
  <verify>
    <automated>npm run test:components -- --testPathPattern='EmberGlass/(GlassCard|StatusDot)\.test'</automated>
  </verify>
  <acceptance_criteria>
    - File exists: `test -f app/components/EmberGlass/GlassCard.tsx` AND `test -f app/components/EmberGlass/StatusDot.tsx`
    - `grep -q "aspectRatio: '1 / 1'" app/components/EmberGlass/GlassCard.tsx` (D-07)
    - `grep -q "var(--glass-bg)" app/components/EmberGlass/GlassCard.tsx`
    - `grep -q "from './Pressable'" app/components/EmberGlass/GlassCard.tsx`
    - `grep -q "data-testid=\"glass-card\"" app/components/EmberGlass/GlassCard.tsx`
    - `grep -q "data-testid=\"status-dot\"" app/components/EmberGlass/StatusDot.tsx`
    - `grep -v '^//' app/components/EmberGlass/GlassCard.tsx | grep -v '^ \*' | grep -cE "useMemo|useCallback"` returns `0` (D-28)
    - `grep -v '^//' app/components/EmberGlass/StatusDot.tsx | grep -cE "useMemo|useCallback"` returns `0` (D-28)
    - `npx tsc --noEmit` exits 0
    - `npm run test:components -- --testPathPattern='EmberGlass/(GlassCard|StatusDot)\.test'` exits 0
  </acceptance_criteria>
  <done>
    GlassCard.tsx and StatusDot.tsx exist with bundle-faithful visuals, jest specs green, no useMemo/useCallback, tsc passes.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Build CardHead + MiniStat + InlineToggle primitives with jest tests</name>
  <files>
    app/components/EmberGlass/CardHead.tsx
    app/components/EmberGlass/MiniStat.tsx
    app/components/EmberGlass/InlineToggle.tsx
    app/components/EmberGlass/__tests__/CardHead.test.tsx
    app/components/EmberGlass/__tests__/MiniStat.test.tsx
    app/components/EmberGlass/__tests__/InlineToggle.test.tsx
  </files>
  <read_first>
    - .planning/phases/177-equal-size-dashboard-glass-cards/177-PATTERNS.md (sections "CardHead", "MiniStat", "InlineToggle")
    - .planning/phases/177-equal-size-dashboard-glass-cards/177-UI-SPEC.md (sections "Typography" + "Component Inventory")
    - .planning/inbox/ember-glass-design/project/components/cards.jsx (lines 53-77 CardHead, lines 375-383 MiniStat, lines 419-435 InlineToggle)
    - app/components/EmberGlass/FlameViz.tsx (pure-prop primitive analog)
  </read_first>
  <behavior>
    - CardHead renders `{ Icon, label, tone, right? }` as a 46px-tall row: 32x32 colored tile (gradient `color-mix(in oklab, ${tone} 22%, transparent)`) holding the Icon at `size={18}`, then a 13px semibold `var(--text-2)` label with `letterSpacing: 0.2`, then an optional `right` slot pushed via `flex: 1` on the label.
    - MiniStat renders `{ label, value, bar }` as label (11px var(--text-2)) + value (15px 600 var(--font-display) #fff) + 3px progress bar with `var(--accent)` fill clamped to 0..1 of `bar`.
    - InlineToggle is a `<button role="switch" aria-checked={on}>` 44x26 with a 22x22 thumb that translates `left: 2 → 20` on `on`, `cubic-bezier(.34,1.56,.64,1)` 220ms transition, default color `var(--accent)`. `onChange` is called when the user clicks. `data-testid="inline-toggle"`.
  </behavior>
  <action>
1. `app/components/EmberGlass/CardHead.tsx` — copy from PATTERNS.md "Primitive: CardHead" verbatim. `'use client'`, types `CardHeadProps { Icon: LucideIcon; label: string; tone: string; right?: ReactNode }`. Use `color-mix(in oklab, ${tone} 22%, transparent)` for the tile background per the bundle (cards.jsx:60). Icon stroke 2.

2. `app/components/EmberGlass/MiniStat.tsx` — copy from PATTERNS.md "Primitive: MiniStat" verbatim. Clamp `bar` via `Math.min(1, Math.max(0, bar))`. Bar fill = `var(--accent)`.

3. `app/components/EmberGlass/InlineToggle.tsx` — copy from PATTERNS.md "Primitive: InlineToggle" verbatim. Add a top-of-file comment: `// Stop-propagation rule (D-17): consumers MUST call e.stopPropagation() in onChange when nested inside a Pressable.`

4. Tests (all use `@testing-library/react` like `__tests__/Pressable.test.tsx`):
   - `CardHead.test.tsx`: (a) renders icon, label, and right slot when provided; (b) tile background style uses `color-mix(...${tone}` substring; (c) label has `fontSize: 13`.
   - `MiniStat.test.tsx`: (a) renders label + value text content; (b) clamps `bar=1.5` so fill width is `100%`; (c) clamps `bar=-0.5` so fill width is `0%`.
   - `InlineToggle.test.tsx`: (a) `role="switch"` with `aria-checked` matching `on`; (b) clicking calls `onChange` exactly once with the click event; (c) thumb `left` style is `20px` when on, `2px` when off.
  </action>
  <verify>
    <automated>npm run test:components -- --testPathPattern='EmberGlass/(CardHead|MiniStat|InlineToggle)\.test'</automated>
  </verify>
  <acceptance_criteria>
    - All three primitive files exist with `'use client'` directive: `grep -l "'use client'" app/components/EmberGlass/CardHead.tsx app/components/EmberGlass/MiniStat.tsx app/components/EmberGlass/InlineToggle.tsx | wc -l` returns `3`
    - `grep -q "color-mix(in oklab" app/components/EmberGlass/CardHead.tsx`
    - `grep -q "var(--accent)" app/components/EmberGlass/MiniStat.tsx`
    - `grep -q "role=\"switch\"" app/components/EmberGlass/InlineToggle.tsx`
    - `grep -q "data-testid=\"inline-toggle\"" app/components/EmberGlass/InlineToggle.tsx`
    - `grep -q "cubic-bezier(.34,1.56,.64,1)" app/components/EmberGlass/InlineToggle.tsx`
    - `grep -v '^//' app/components/EmberGlass/CardHead.tsx app/components/EmberGlass/MiniStat.tsx app/components/EmberGlass/InlineToggle.tsx | grep -cE "useMemo|useCallback"` returns `0` (D-28)
    - `npx tsc --noEmit` exits 0
    - `npm run test:components -- --testPathPattern='EmberGlass/(CardHead|MiniStat|InlineToggle)\.test'` exits 0
  </acceptance_criteria>
  <done>
    All three primitives ship with jest tests green; bundle-verbatim visuals; no React Compiler opt-outs.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| (none new) | Phase 177 is a pure presentational rebuild. No new endpoints, no new data flow, no user input collected by these primitives. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-177-01 | Information disclosure | GlassCard | accept | Frontend-only presentational change; no PII rendered by primitives themselves; consumers (cards) reuse existing hooks with established auth gates. |
</threat_model>

<verification>
- All 5 primitive files exist under `app/components/EmberGlass/`
- All 5 jest specs pass under `npm run test:components`
- Zero `useMemo`/`useCallback` introductions (grep gate)
- `npx tsc --noEmit` exits 0
</verification>

<success_criteria>
- DASH-01 enabling artifact (GlassCard 1:1 footprint) shipped
- DASH-04 enabling artifact (InlineToggle for LightsCard header) shipped
- DASH-09 enabling artifact (MiniStat for RaspiCard 2-stat grid) shipped
- DASH-12 satisfied at primitive level (no RC opt-outs introduced)
</success_criteria>

<output>
After completion, create `.planning/phases/177-equal-size-dashboard-glass-cards/177-01-SUMMARY.md` documenting the 5 primitives, file paths, jest pass output, and confirmation of zero useMemo/useCallback.
</output>
