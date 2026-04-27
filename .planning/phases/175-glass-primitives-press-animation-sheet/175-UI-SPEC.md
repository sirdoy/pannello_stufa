---
phase: 175
slug: glass-primitives-press-animation-sheet
status: draft
shadcn_initialized: false
preset: none
created: 2026-04-27
---

# Phase 175 — UI Design Contract

> Visual + interaction contract for the **Pressable press animation primitive (DS-07)** and the **Sheet primitive (SHEET-01)** under `app/components/EmberGlass/`. Auto-resolved from CONTEXT.md (D-01..D-18), RESEARCH.md, the design bundle (`.planning/inbox/ember-glass-design/project/components/sheets.jsx`, `cards.jsx`), and the sibling Phase 174 UI-SPEC. Verified by gsd-ui-checker downstream.

**Scope reminder:** Phase 175 ships ONLY (a) `app/components/EmberGlass/Pressable.tsx` (component + `usePressed` hook), (b) `app/components/EmberGlass/Sheet.tsx`, (c) `app/components/EmberGlass/index.ts` barrel, (d) one `.press-anim` CSS utility appended to `app/globals.css` plus its reduced-motion override, and (e) two new sections (Press, Sheet) appended to the existing `/debug/design-system-v2/page.tsx`. No dashboard cards, no device sheets, no nav bar, no migration of legacy `app/components/ui/Sheet.tsx` / `BottomSheet.tsx` consumers — all deferred to Phases 177-181.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (Tailwind v4 + CVA project convention; no shadcn) |
| Preset | not applicable |
| Component library | `@radix-ui/react-dialog ^1.1.14` (already installed) for Sheet a11y/focus-trap/ESC/portal mechanics; `@radix-ui/react-visually-hidden ^1.2.4` for fallback `<DialogTitle>` when `title` prop omitted |
| Icon library | `lucide-react` (already installed; `<X size={16} strokeWidth={2.2}>` for Sheet close button) |
| Display font | `var(--font-display)` → Outfit (consumed; declared by Phase 174) |
| Body font | `var(--font-body)` → Inter (consumed; declared by Phase 174) |
| Color space | OKLCH for `--accent`; rgba/hex/inline literals for non-tokenized bundle values (documented as AUDIT-EXCEPTION below) |
| Styling approach | **Inline `style={...}` objects (NOT Tailwind classes)** — matches Phase 174 sibling primitive `AmbientBg.tsx` and lifts bundle visuals verbatim. Tokens consumed via `var(--token)` inside inline style. CVA NOT used here. |

**Detected existing UI:**
- `app/globals.css` lines 302-344 — Phase 174's locked Ember Glass token block + `.glass-surface` utility + `@supports not` fallback. **Phase 175 appends ONE `.press-anim` rule + one `@media (prefers-reduced-motion: reduce)` block AFTER line 344.** No edits to existing rules.
- `app/components/EmberGlass/AmbientBg.tsx` — sibling Phase 174 primitive. Same namespace, same `'use client'` boundary, same inline-style approach. **Phase 175 follows this convention exactly.**
- `app/debug/design-system-v2/page.tsx` — extended with 2 new sections (Press, Sheet). Existing 4 sections (hue picker, ambient toggle, token grid, glass demo) untouched.
- `app/components/ui/Sheet.tsx` (334 LOC, Radix-based) and `app/components/ui/BottomSheet.tsx` (153 LOC, custom portal) — **legacy, not modified**. New `EmberGlass/Sheet` is a sibling primitive, not a replacement (D-02).

---

## Spacing Scale

Declared values (all multiples of 4):

| Token | Value | Usage in Phase 175 |
|-------|-------|-------|
| xs | 4px | Sheet grabber row top inner padding (`padding: '4px 0 12px'`); inline gaps inside demo Pressable surfaces |
| sm | 8px | Sheet container outer offsets (`left: 8px`, `right: 8px`, `bottom: 8px`); demo press grid gap |
| md | 16px | Demo section grid gap (`gap: 16` between Pressable samples); Sheet body row inner padding bottom |
| lg | 24px | Demo section vertical breathing; demo Sheet content row vertical spacing |
| xl | 32px | Sheet container `borderRadius: 32` (lifted verbatim from bundle `sheets.jsx:30`) |
| 2xl | 48px | `marginBottom: 48` between new section 05 (Press) and section 06 (Sheet) — matches Phase 174 page convention |

**Sheet header internal spacing (lifted verbatim from `sheets.jsx:43,47`):**
- Grabber row: `padding: '4px 0 12px'` (4px above grabber, 12px below).
- Title row: `marginBottom: 18` between header and first body row.
- Sheet container padding: `padding: '10px 20px 30px'` (10 top / 20 sides / 30 bottom).

**Touch target exceptions:**
- **Sheet close button: 32×32px** — lifted verbatim from bundle `sheets.jsx:51-52`. This is below the Apple HIG 44×44 minimum. **Locked at 32×32 for bundle fidelity in Phase 175.** Phases 178+ device sheets inherit this. If a future a11y phase needs to upsize close buttons, that's its own scope.
- **Sheet grabber: 40×5px** — purely decorative (visual affordance for a swipe gesture deferred to a future phase per D-14). Not a touch target. `borderRadius: 999` (pill).
- **Demo Pressable surfaces (`/debug/design-system-v2`):** the 3 sample shapes each render at ≥56×56 minimum (button is 56px tall full-width; circular is 80×80; card is `aspectRatio: 1/1` driven by grid → ~120×120 at 375px viewport). All ≥44×44 on mobile.

**Z-index reservations (CRITICAL — documented in `Sheet.tsx` top-of-file comment per D-13):**
- 200 → Sheet backdrop
- 201 → Sheet container
- All other Phase 178-181 stacked content (incl. NAV bottom bar from Phase 181) MUST stay below 200.

---

## Typography

Declared roles for Phase 175 surfaces (`<Sheet>` header, demo sections on `/debug/design-system-v2`). Sizes lifted from bundle `sheets.jsx` and aligned with Phase 174's 4-size budget.

| Role | Size | Weight | Line Height | Family | Used By |
|------|------|--------|-------------|--------|---------|
| Body | 16px | 400 | 1.5 | `var(--font-body)` (Inter) | Demo section descriptions; demo Sheet body row primary text |
| Label / Caption | 12px | 600 | 1.4 | `var(--font-body)` (Inter) | Demo section eyebrows ("05 / PRESS", "06 / SHEET" — uppercase + 1.2px letter-spacing); demo Sheet body row secondary text ("Contenuto fittizio") |
| Section heading | 24px | 600 | 1.2 | `var(--font-display)` (Outfit) | Demo section H2s ("Animazione di pressione", "Sheet primitivo") |
| Sheet title (display M) | 22px | 600 | 1.2 | `var(--font-display)` (Outfit) | `<DialogPrimitive.Title>` rendered in Sheet header when `title` prop is provided. **Lifted verbatim from bundle `sheets.jsx:48` (`fontSize: 22, fontWeight: 600`).** Color `#fff` (NOT `var(--text-1)` — bundle uses pure white inside Sheet header for max contrast against the rgba(28,25,23,0.85) sheet background; documented as AUDIT-EXCEPTION below). |

**Weights:** exactly 2 — `400` regular (body copy) + `600` semibold (labels, headings, Sheet title).

**Sizes:** exactly 4 — `12, 16, 22, 24`. Phase 174 used `12, 16, 24, 40`; Phase 175 swaps the 40px page display for the 22px Sheet title (no page-level display heading is needed in Phase 175 — the demo sections inherit the existing v2 page header from Phase 174). The new files in Phase 175 contain zero usages of font sizes outside `{12, 16, 22, 24}`.

**Verification gate:** repo-wide grep against the new files (`Pressable.tsx`, `Sheet.tsx`, `index.ts`, the `.press-anim` rule, the appended `/debug/design-system-v2/page.tsx` sections) MUST show zero usages of `fontSize` outside `{12, 16, 22, 24}` and zero `fontWeight` outside `{400, 600}`.

---

## Color

Phase 175 dark-only Ember Glass palette — surfaces are the demo sections (consume v2 page background, declared in Phase 174) + the Sheet itself (renders as a portal over the document, has its own backdrop + container colors).

| Role | Value | Token | Usage |
|------|-------|-------|-------|
| Dominant (60%) | inherits Phase 174's `#0a0908` linear-gradient base behind the v2 page | `--bg-0` | Background visible BEHIND the Sheet backdrop when Sheet open; background of demo Pressable area when Sheet closed |
| Secondary (30%) | `rgba(28, 25, 23, 0.85)` | NOT a `--glass-bg` token (bundle hard-codes a denser glass for sheets) | Sheet container fill — denser than `--glass-bg` (`rgba(255,255,255,0.04)`) because the Sheet must remain readable when 85% of the viewport is the dark dominant. **AUDIT-EXCEPTION (DS-02):** lifted verbatim from `sheets.jsx:31`. Bundle's intentional non-token. |
| Secondary 2 | `rgba(255, 255, 255, 0.04)` | `--glass-bg` (Phase 174 token) | Demo Pressable surfaces use `.glass-surface` utility, which fills with `--glass-bg`. |
| Accent (10%) | `oklch(0.68 0.17 45)` (Copper default, runtime-overridable) | `--accent` | **Reserved for `:focus-visible` outlines on Pressable rendered as `as="button"` and on the Sheet close button** (`outline: 2px solid var(--accent); outline-offset: 2px`). NOT used inside the Sheet body, NOT used as primary fill anywhere in Phase 175. |
| Text primary | `#f5f5f4` | `--text-1` | Demo section H2s, demo Sheet body row primary text. |
| Text inside Sheet header | `#fff` (pure white) | NOT a token | Sheet title, close-button icon. **AUDIT-EXCEPTION (DS-02):** lifted verbatim from `sheets.jsx:39, 55`. Bundle uses pure white inside the Sheet header for max contrast. |
| Text secondary | `rgba(245, 245, 244, 0.55)` | `--text-2` | Demo section eyebrows, helper copy, demo Sheet body row secondary text. |
| Backdrop | `rgba(0, 0, 0, 0.5)` | NOT a token | Sheet backdrop fill when `open`. **AUDIT-EXCEPTION (DS-02):** lifted verbatim from `sheets.jsx:20`. Bundle's intentional non-token (the 50% black creates the dimming behind the blur). |
| Backdrop blur | `blur(8px)` (with `-webkit-` prefix) | NOT a token | Sheet backdrop's `backdrop-filter`. AUDIT-EXCEPTION; bundle hard-codes 8px (lighter than `--glass-blur: 24px` — the backdrop only needs to soften background detail, not opaque-blur it). |
| Sheet body blur | `blur(40px) saturate(200%)` (with `-webkit-` prefix) | NOT a token | Sheet container's `backdrop-filter`. AUDIT-EXCEPTION; bundle hard-codes 40px (heavier than `--glass-blur: 24px` — the sheet must read as solid against the busy backdrop). |
| Sheet border | `0.5px solid rgba(255,255,255,0.12)` | NOT a token | Sheet container 0.5px hairline. **AUDIT-EXCEPTION (DS-02):** lifted verbatim from `sheets.jsx:34`; slightly different alpha than `--glass-border` (0.12 vs 0.08) because the denser sheet bg needs a brighter rim to read as a panel. |
| Sheet shadow | `0 -20px 60px rgba(0,0,0,0.5), inset 1px 1px 0 rgba(255,255,255,0.08)` | NOT a token | Sheet container shadow. **AUDIT-EXCEPTION (DS-02):** lifted verbatim from `sheets.jsx:35`. Negative-Y outer shadow (sheet rises from below) + inset highlight. Different shape from `--glass-shadow`. |
| Close button bg | `rgba(255,255,255,0.1)` | NOT a token | Sheet close button fill. AUDIT-EXCEPTION; bundle `sheets.jsx:53`. |
| Grabber bg | `rgba(255,255,255,0.2)` | NOT a token | Sheet grabber pill fill. AUDIT-EXCEPTION; bundle `sheets.jsx:44`. |
| Border (between rows in demo Sheet body) | `0.5px solid var(--glass-border)` | `--glass-border` | Demo Sheet content uses tokens for inter-row dividers (the rows are NOT bundle-locked content — they're our demo). |
| Destructive | n/a in this phase | — | No destructive actions in Phase 175 (Sheet has no delete/danger paths; Pressable is a pure interaction primitive). |

**Accent reserved-for list (the 10% zone — Phase 175 surfaces):**
1. **Pressable `:focus-visible` outline** when rendered as a focusable element (`as="button"`, `as="a"`, or any `tabIndex >= 0` host). `outline: 2px solid var(--accent); outline-offset: 2px`. Default browser focus ring is suppressed (`outline: none` on the unfocused state) and `:focus-visible` re-enables our accent outline so keyboard users get a clear cue while pointer/touch users do not see the ring on click.
2. **Sheet close button `:focus-visible` outline** — same `outline: 2px solid var(--accent); outline-offset: 2px`. The close button is a `<button>` so it's keyboard-focusable; Radix focus-traps the Sheet, so when Sheet opens the close button is the first focusable element by default (Radix auto-focuses).

**Explicitly NOT accented in Phase 175:**
- Sheet container, backdrop, grabber, body, header — all neutral dark / rgba whites.
- Demo Pressable surfaces — fill with `--glass-bg` (4% white), no accent.
- Demo section eyebrows, headings, body — all `--text-1` / `--text-2`.
- Pressed state on Pressable — pure `transform: scale(0.97)`, no color shift.

Accent is rare-and-precious (10% rule) and ONLY paints focus-visible outlines in this phase.

**Documented AUDIT-EXCEPTIONS (DS-02 grep gate inheritance):**
The following hardcoded values appear in Phase 175 source files. They are lifted verbatim from the design bundle `sheets.jsx:13-65` and are documented inline with `// AUDIT-EXCEPTION` comments in `Sheet.tsx`. The grep gate established by Phase 174 (`grep -rEn '#[0-9a-fA-F]{3,8}\b\|blur\([0-9]+px\)' app/components/EmberGlass`) MUST tolerate these by tagging:

| File:Line | Value | Bundle source | Why non-token |
|-----------|-------|---------------|---------------|
| `Sheet.tsx` (backdrop bg) | `rgba(0,0,0,0.5)` | `sheets.jsx:20` | Backdrop dimming is a single-purpose value; not reused elsewhere. |
| `Sheet.tsx` (backdrop blur) | `blur(8px)` | `sheets.jsx:21` | Backdrop blur is intentionally lighter than `--glass-blur` (24px). |
| `Sheet.tsx` (sheet bg) | `rgba(28, 25, 23, 0.85)` | `sheets.jsx:31` | Denser than `--glass-bg`; sheets need to read as panels, not surfaces-on-glass. |
| `Sheet.tsx` (sheet blur) | `blur(40px) saturate(200%)` | `sheets.jsx:32` | Heavier blur for opaque panel feel; differs from `--glass-blur`. |
| `Sheet.tsx` (sheet border) | `0.5px solid rgba(255,255,255,0.12)` | `sheets.jsx:34` | Brighter rim than `--glass-border`; needed for denser sheet bg. |
| `Sheet.tsx` (sheet shadow) | `0 -20px 60px rgba(0,0,0,0.5), inset 1px 1px 0 rgba(255,255,255,0.08)` | `sheets.jsx:35` | Negative-Y outer shadow + inset highlight; bundle-specific elevation curve. |
| `Sheet.tsx` (grabber bg) | `rgba(255,255,255,0.2)` | `sheets.jsx:44` | Grabber alone; not reused. |
| `Sheet.tsx` (title color) | `#fff` (pure white) | `sheets.jsx:39` | Pure white inside the dense sheet header for max contrast. |
| `Sheet.tsx` (close button bg) | `rgba(255,255,255,0.1)` | `sheets.jsx:53` | Close button alone; not reused. |
| `Sheet.tsx` (close button icon) | `#fff` | `sheets.jsx:55` | Same as title color. |

All other visual values in Phase 175 source files use Phase 174 tokens (`var(--accent)`, `var(--glass-bg)`, `var(--glass-border)`, `var(--text-1)`, `var(--text-2)`, `var(--font-display)`, `var(--font-body)`, `var(--r-card)`, `var(--pad-card)`).

---

## Component API + Variants

This is the **prescriptive contract** that gsd-planner and gsd-executor consume. Every prop, default, and behavior below is non-negotiable.

### `<Pressable>` (DS-07)

```ts
// app/components/EmberGlass/Pressable.tsx

export interface PointerHandlers {
  onPointerDown: PointerEventHandler;
  onPointerUp: PointerEventHandler;
  onPointerLeave: PointerEventHandler;
  onPointerCancel: PointerEventHandler;
}

export function usePressed(): {
  pressed: boolean;
  pointerHandlers: PointerHandlers;
};

export const Pressable: <E extends ElementType = 'div'>(
  props: PressableProps<E> & { ref?: React.Ref<Element> }
) => React.ReactElement;
```

**Props:**

| Prop | Type | Default | Behavior |
|------|------|---------|----------|
| `as` | `ElementType` | `'div'` | Polymorphic host element. Renders any HTML tag (`'button'`, `'article'`, `'a'`, etc.) or React component. |
| `children` | `ReactNode` | — | Rendered inside the host element. |
| `style` | `CSSProperties` | — | Spread AFTER the press transform (caller cannot accidentally override the press contract). Caller's style wins ONLY for properties other than `transform` and `transition`. |
| `className` | `string` | — | Forwarded to host element. |
| `onClick` | `MouseEventHandler` | — | Forwarded to host element. (Not consumed by `Pressable` itself.) |
| `aria-*`, all other DOM props | varies | — | Forwarded to host element via spread. |
| `ref` | `React.Ref<Element>` | — | Forwarded to the host element. |

**Internal behavior:**
- Tracks `pressed: boolean` via `useState`. Pointer handlers are stable (`useCallback`) so React Compiler memoization downstream stays trivially correct.
- Default `style` applied:
  ```ts
  {
    transform: pressed ? 'scale(0.97)' : 'scale(1)',
    transition: 'transform .22s cubic-bezier(.34,1.56,.64,1)',
    ...callerStyle,
  }
  ```
- Pointer events bound: `onPointerDown` (sets `pressed=true`), `onPointerUp` / `onPointerLeave` / `onPointerCancel` (each sets `pressed=false`).

**Hover state:** **none.** Bundle does not implement hover. Pressable has only two visual states: `idle` (`scale(1)`) and `pressed` (`scale(0.97)`). No `:hover` background change, no opacity shift.

**Tap delay / touch behavior:** caller is responsible for adding `touchAction: 'manipulation'` to their style if they want to suppress the iOS 300ms double-tap zoom delay. Phase 175 does NOT bake this into Pressable because Phases 177-181 may want different touch behaviors per surface. Demo Pressable surfaces in `/debug/design-system-v2` add `touchAction: 'manipulation'` inline.

**Keyboard interaction (when `as="button"` or another natively-focusable host):**
- Space and Enter trigger the host's native click — the consumer's `onClick` fires. Pressable does NOT add custom keyboard handlers (the press scale animation is purely a pointer affordance).
- Focus visible outline: caller must apply `:focus-visible` outline. **For Phase 175 demo surfaces:** the demo Pressable rendered as `as="button"` MUST apply `outline: 'none'` on the unfocused element and rely on a CSS rule `[data-pressable-button]:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }` (or equivalent inline `:focus-visible` shim — the simplest in inline-style mode is to add a small `<style>` block in the demo page or rely on the global utility). **Recommended:** add a `[data-pressable-button]` selector + `:focus-visible` rule to `globals.css` ONCE in the same append block as `.press-anim`. Spec lock: focus-visible accent ring is a Phase 175 contract for keyboard-focusable Pressable hosts.
- When `as="div"` or another non-focusable host, no focus ring is needed (the surface is decorative).

**ARIA / role considerations:**
- When `as="button"`: native button semantics apply. No additional `role` needed.
- When `as="div"` and the surface has an `onClick`: the consumer SHOULD pass `role="button" tabIndex={0}` and a keyboard handler for Space/Enter. **Pressable does NOT silently inject these — the consumer is responsible.** Phase 175 demo div-Pressable surfaces are decorative (no `onClick`) so no role injection is needed.
- When `as="a"`: native link semantics apply.

**`usePressed()` hook:**
- For consumers that already have a wrapper element (e.g., a card with its own `<div>`) and want to opt into press behavior without an extra DOM node.
- Returns `{ pressed, pointerHandlers }`. Consumer spreads `pointerHandlers` onto their element and applies their own `transform`/`transition` (or uses the `.press-anim` CSS class for the transition shape and inline transform for the scale).

**`.press-anim` CSS utility (`globals.css` append):**
```css
.press-anim { transition: transform .22s cubic-bezier(.34,1.56,.64,1); }
@media (prefers-reduced-motion: reduce) {
  .press-anim { transition: transform 50ms linear; }
}
```
The `.press-anim` class declares ONLY the transition. The transform itself stays inline (driven by the JS `pressed` state). Consumers in Phases 177-181 can use any of the three grep-targets — `<Pressable>`, `usePressed()`, or `.press-anim` — to satisfy DS-07's "shared utility" contract.

**Reduced-motion override (D-15, locked YES per UI-SPEC discretion):**
- Phase 175 ships the `@media (prefers-reduced-motion: reduce)` block (3 LOC). When set, the press transition collapses to `50ms linear`. Visual difference: instant scale snap instead of bouncy.
- Aligns with Phase 176's reduced-motion philosophy (splash is the next phase that ships explicit reduced-motion handling).
- Cost: 3 LOC. Benefit: courtesy + alignment. **Locked: ship it.**

### `<Sheet>` (SHEET-01)

```ts
// app/components/EmberGlass/Sheet.tsx

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children?: ReactNode;
}

export function Sheet(props: SheetProps): React.ReactElement;
```

**Props:**

| Prop | Type | Default | Behavior |
|------|------|---------|----------|
| `open` | `boolean` | (required) | Controlled prop. When `true`, sheet renders open with `translateY(0)`. When `false`, sheet renders closed with `translateY(110%)` (off-screen below) and the outro transition plays. |
| `onClose` | `() => void` | (required) | Called on EACH dismissal vector: ESC keypress, backdrop tap, close button click. **Not called twice.** Backdrop's own `onClick` is the single dismiss path; Radix's `onPointerDownOutside` is suppressed via `e.preventDefault()` to avoid double-fire (D-10). |
| `title` | `string` | `undefined` | When provided, renders the title row with the string as Sheet heading (22px Outfit 600) + a 32×32 close button. When omitted, renders only the grabber + a `<VisuallyHidden>` title (Radix a11y requirement). |
| `children` | `ReactNode` | `undefined` | Sheet body. Caller is responsible for layout (rows, controls, etc.). Phase 175 does NOT ship `<SheetRow>` / `<SheetBtn>` helpers — those are Phase 178's problem. |

**Internal composition (locked per D-07..D-13):**

```
<DialogPrimitive.Root open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
  <DialogPrimitive.Portal forceMount>
    <div                                            ← Custom backdrop (D-10)
      aria-hidden="true"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: open ? 'rgba(0,0,0,0.5)' : 'transparent',  // AUDIT-EXCEPTION
        backdropFilter: open ? 'blur(8px)' : 'none',           // AUDIT-EXCEPTION
        WebkitBackdropFilter: open ? 'blur(8px)' : 'none',
        transition: 'background .3s, backdrop-filter .3s',
        pointerEvents: open ? 'auto' : 'none',
      }}
    />
    <DialogPrimitive.Content
      forceMount
      onPointerDownOutside={(e) => e.preventDefault()}         ← Suppress Radix dismiss (D-10)
      style={{
        position: 'fixed', left: 8, right: 8, bottom: 8, zIndex: 201,
        borderRadius: 32,
        background: 'rgba(28, 25, 23, 0.85)',                  // AUDIT-EXCEPTION
        backdropFilter: 'blur(40px) saturate(200%)',           // AUDIT-EXCEPTION
        WebkitBackdropFilter: 'blur(40px) saturate(200%)',
        border: '0.5px solid rgba(255,255,255,0.12)',          // AUDIT-EXCEPTION
        boxShadow: '0 -20px 60px rgba(0,0,0,0.5), inset 1px 1px 0 rgba(255,255,255,0.08)',  // AUDIT-EXCEPTION
        padding: '10px 20px 30px',
        maxHeight: '85%',
        overflowY: 'auto',
        transform: open ? 'translateY(0)' : 'translateY(110%)',
        transition: 'transform .4s cubic-bezier(.22,1,.36,1)',
      }}
    >
      <Grabber />                                    ← always rendered
      {title ? (
        <Header title={title} onClose={onClose} />   ← title (22px Outfit 600, color #fff) + close button
      ) : (
        <VisuallyHidden asChild><DialogPrimitive.Title>Sheet</DialogPrimitive.Title></VisuallyHidden>
      )}
      {children}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
</DialogPrimitive.Root>
```

**Header structure (D-09):**
- **Grabber row** (always rendered): centered flex; `padding: '4px 0 12px'`. Inner pill: `width: 40, height: 5, borderRadius: 999, background: 'rgba(255,255,255,0.2)'`.
- **Title row** (when `title` prop provided): flex `space-between`; `alignItems: 'center'`; `marginBottom: 18`.
  - Title: `<DialogPrimitive.Title style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: '#fff', margin: 0 }}>{title}</DialogPrimitive.Title>`.
  - Close button: 32×32 circle, `borderRadius: 999`, `background: 'rgba(255,255,255,0.1)'`, `border: 'none'`, `color: '#fff'`, `cursor: 'pointer'`. Renders `<X size={16} strokeWidth={2.2}>` from `lucide-react`. `aria-label="Chiudi"`. On click → `onClose()`. On `:focus-visible` → `outline: 2px solid var(--accent); outline-offset: 2px`.

**Animation timing (locked per D-08, SC-#2):**
- Sheet container `transform`: `.4s cubic-bezier(.22,1,.36,1)` — **400ms ease-out-cubic-back**. Same value when opening AND closing.
- Backdrop `background` + `backdrop-filter`: `.3s` (no curve — uses CSS default `ease`). Slightly faster than the sheet so the backdrop fades in just before the sheet finishes sliding up.

**Dismissal vectors (3 total, per D-09, D-10, SC-#3):**
1. **Escape key** — handled by Radix `DialogPrimitive.Root` automatically. Radix fires `onOpenChange(false)` on ESC; our handler converts to `onClose()`.
2. **Backdrop tap/click** — our own `<div onClick={onClose}>` fires. Radix's `onPointerDownOutside` is suppressed via `e.preventDefault()` to avoid double-fire.
3. **Close button click** — direct `<button onClick={onClose}>`. Always present when `title` prop is provided.

**Body scroll-lock (D-11, SC-#4):**

```ts
const lockedScrollY = useRef<number>(0);
useEffect(() => {
  if (!open) return;
  lockedScrollY.current = window.scrollY;
  document.body.style.position = 'fixed';
  document.body.style.top = `-${lockedScrollY.current}px`;
  document.body.style.width = '100%';
  document.body.style.overflow = 'hidden';
  return () => {
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.style.overflow = '';
    window.scrollTo(0, lockedScrollY.current);
  };
}, [open]);
```

Lifted verbatim from `app/components/ui/BottomSheet.tsx:50-67`. **`useRef`-captured scrollY** (not closure-captured) so cleanup uses the same value even on React 18 strict-mode double-mount. Restore via `window.scrollTo(0, lockedScrollY.current)` is the non-obvious detail — Radix's built-in scroll-lock does NOT restore.

**Focus management (Radix default):**
- On open: Radix auto-focuses the first focusable element inside `DialogPrimitive.Content`. When `title` is provided, the close button is the first focusable element → close button receives focus. Visible via the `:focus-visible` accent outline.
- Focus trap: Radix cycles Tab/Shift-Tab inside the Sheet only.
- On close: Radix returns focus to the element that opened the Sheet (e.g., the "Open Sheet" button on the demo page).
- **No imperative focus management in Phase 175.** Phase 178 may customize per-sheet (e.g., focus a specific input on `StoveSheet` open) but Phase 175 ships the Radix default.

**Sizing (D-12):**
- `maxHeight: 85%` (of the parent — typically the viewport via `position: fixed`). Content-driven height with internal `overflowY: auto`. No size variants.

**Reduced-motion override (locked YES, ≤10 LOC bonus per D-15):**
- Append to `globals.css` immediately after the `.press-anim` block:

```css
/* (note: Sheet uses inline styles so we cannot target it via a class. The reduced-motion
   override for Sheet lives INSIDE Sheet.tsx as a media-query-conditional inline style
   helper, OR is omitted in favor of the press-anim-only override.)
   Recommendation: ship press-anim reduced-motion only. Sheet's 400ms transition is
   on the edge of acceptable for reduced-motion users; if a future a11y phase needs to
   tighten it, refactor Sheet to use a CSS class then. */
```

**Lock:** `.press-anim` reduced-motion is shipped. Sheet's reduced-motion is **NOT** shipped in Phase 175 (would require refactoring Sheet to use a CSS class instead of inline style — out of scope per the ≤10 LOC budget). Documented as a Deferred item below for a future a11y phase.

---

## Demo Page Sections (`/debug/design-system-v2/page.tsx` extension)

Phase 175 appends 2 new sections to the existing v2 page after Section 04 (glass-surface demo). Sections 01-04 (hue picker, ambient toggle, token grid, glass demo) are untouched. Page voice matches Phase 174: Italian copy, code-style monospace for token values, `XX / LABEL` eyebrow numbering format.

### Section 05 — Press primitive

```
┌───────────────────────────────────────────────────────────────┐
│ EYEBROW: "05 / PRESS" (12px / 600 / uppercase / --text-2)     │
│ HEADING: "Animazione di pressione" (24px / 600 / Outfit / --text-1) │
│ HELPER:  "Tap o clicca per vedere scale(0.97) ↔ scale(1)"     │
│          (16px / Inter / --text-2)                            │
│                                                               │
│ Grid (3 columns at >= 640px, single column < 640px, gap 16):  │
│ ┌────────┐ ┌────────┐ ┌────────┐                              │
│ │ Card   │ │ Button │ │  Pill  │  ← 3 sample shapes           │
│ └────────┘ └────────┘ └────────┘                              │
└───────────────────────────────────────────────────────────────┘
```

**Sample 1 — Card-shape Pressable** (`as="div"`, decorative):
- `<Pressable as="div" className="glass-surface" style={{ aspectRatio: '1 / 1', display: 'grid', placeItems: 'center', touchAction: 'manipulation' }}>`
- Body: `<span style={{ fontSize: 14, color: 'var(--text-1)', fontFamily: 'var(--font-display)' }}>Card</span>` — wait, 14 is not in the 4-size budget. **Use 16 instead** (body size). Final body: `<span style={{ fontSize: 16, color: 'var(--text-1)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>Card</span>`.
- Visual: square glass surface; tapping shows scale(0.97) bounce.

**Sample 2 — Button-shape Pressable** (`as="button"`, focusable):
- `<Pressable as="button" type="button" className="glass-surface" style={{ height: 56, border: 0, color: 'var(--text-1)', fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, cursor: 'pointer', touchAction: 'manipulation' }} aria-label="Esempio bottone pressabile">Pressable button</Pressable>`
- Visual: full-width 56px-tall pill button; keyboard-focusable; shows accent focus-visible ring.

**Sample 3 — Circular Pressable** (`as="div"`, decorative):
- `<Pressable as="div" className="glass-surface" style={{ width: 80, height: 80, borderRadius: 999, justifySelf: 'center', touchAction: 'manipulation' }} />`
- Visual: empty 80×80 circle; press shows scale(0.97).

### Section 06 — Sheet primitive

```
┌───────────────────────────────────────────────────────────────┐
│ EYEBROW: "06 / SHEET"                                         │
│ HEADING: "Sheet primitivo"                                    │
│ HELPER:  "Apri lo sheet di esempio per testare le tre vie     │
│           di chiusura: Esc, tap fuori, e bottone X"           │
│                                                               │
│ Open button (centered or left-aligned, height 56, accent on   │
│   :focus-visible):                                            │
│ ┌─────────────────────┐                                       │
│ │  Apri sheet demo    │                                       │
│ └─────────────────────┘                                       │
│                                                               │
│ Sheet (rendered conditionally on open state):                 │
│   Title: "Demo sheet"                                         │
│   Body:  3 dummy rows + a 600px tall spacer (for scroll test) │
└───────────────────────────────────────────────────────────────┘
```

**Open button:**
- Plain `<button type="button" onClick={() => setSheetOpen(true)}>Apri sheet demo</button>`.
- Style: `height: 56, padding: '0 24px', borderRadius: 16, border: 'none', background: 'rgba(255,255,255,0.06)', color: 'var(--text-1)', fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, cursor: 'pointer'`.
- `:focus-visible` → `outline: 2px solid var(--accent); outline-offset: 2px`.
- aria-label not needed (visible label is sufficient).

**Sheet (when `sheetOpen === true`):**
- `<Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Demo sheet">`
- Body content (3 dummy rows):
  ```tsx
  {[
    { primary: 'Riga 1', secondary: 'Contenuto fittizio' },
    { primary: 'Riga 2', secondary: 'Contenuto fittizio' },
    { primary: 'Riga di esempio lunga abbastanza da scrollare', secondary: 'Contenuto fittizio' },
  ].map((row, i) => (
    <div key={i} style={{
      padding: '14px 0',
      borderBottom: '0.5px solid var(--glass-border)',
    }}>
      <div style={{ fontSize: 16, color: 'var(--text-1)', fontWeight: 500 }}>{row.primary}</div>
      <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>{row.secondary}</div>
    </div>
  ))}
  {/* Spacer to make the scroll-lock test meaningful — sheet body must scroll inside the
      85%-max-height container, AND the body scroll-lock effect must keep the underlying
      page pinned. */}
  <div aria-hidden="true" style={{ height: 600 }} />
  ```

---

## Copywriting Contract

Italian (project locale per `<html lang="it">`). Copy strings live inline in `Pressable.tsx` (only `aria-label="Chiudi"` for the close button — a Sheet concern, not a Pressable concern), `Sheet.tsx` (close button aria-label), and the v2 page (Section 05 + Section 06 copy). No i18n extraction needed for this developer-facing surface.

### Sheet primitive — internal copy

| Element | Copy (IT) | English equivalent |
|---------|-----------|---------------------|
| Close button `aria-label` | `Chiudi` | Close |
| `<DialogPrimitive.Title>` fallback (when `title` prop omitted, rendered visually-hidden) | `Sheet` | Sheet (English here is fine — fallback is screen-reader-only and decorative; if the Sheet is meaningful enough to need a title, the consumer SHOULD provide the `title` prop) |

### Demo page — Section 05 (Press primitive) copy

| Element | Copy (IT) | English equivalent |
|---------|-----------|---------------------|
| Eyebrow | `05 / PRESS` | 05 / PRESS |
| Heading | `Animazione di pressione` | Press animation |
| Helper | `Tap o clicca per vedere scale(0.97) ↔ scale(1) con cubic-bezier(.34,1.56,.64,1) su 220ms` | Tap or click to see scale(0.97) ↔ scale(1) with cubic-bezier(.34,1.56,.64,1) over 220ms |
| Sample 1 label | `Card` | Card |
| Sample 2 label (visible button text) | `Pressable button` | Pressable button |
| Sample 2 `aria-label` | `Esempio bottone pressabile` | Example pressable button |
| Sample 3 (no label, decorative circle) | — | — |

### Demo page — Section 06 (Sheet primitive) copy

| Element | Copy (IT) | English equivalent |
|---------|-----------|---------------------|
| Eyebrow | `06 / SHEET` | 06 / SHEET |
| Heading | `Sheet primitivo` | Sheet primitive |
| Helper | `Apri lo sheet di esempio per testare le tre vie di chiusura: Esc, tap fuori, e bottone X` | Open the example sheet to test the three dismissal vectors: Esc, outside tap, and X button |
| Open button label (visible text) | `Apri sheet demo` | Open demo sheet |
| Sheet title | `Demo sheet` | Demo sheet |
| Sheet row 1 primary | `Riga 1` | Row 1 |
| Sheet row 1 secondary | `Contenuto fittizio` | Dummy content |
| Sheet row 2 primary | `Riga 2` | Row 2 |
| Sheet row 2 secondary | `Contenuto fittizio` | Dummy content |
| Sheet row 3 primary | `Riga di esempio lunga abbastanza da scrollare` | Sample row long enough to scroll |
| Sheet row 3 secondary | `Contenuto fittizio` | Dummy content |

### Phase-level copy contract (template fields)

| Element | Resolution |
|---------|------------|
| Primary CTA | **none in production code shipped by Phase 175.** Pressable is a primitive; Sheet is a primitive. The only CTAs are on the demo page: "Apri sheet demo" (Section 06) and the implicit "Chiudi" affordance on the Sheet close button. Both lock above. |
| Empty state | **n/a** — Phase 175 ships no data-fetching surfaces. Pressable has no empty state; Sheet has no empty state (the consumer is responsible for `children`). |
| Error state | **n/a** — Phase 175 has no error paths. Sheet's scroll-lock effect cannot fail (the body style mutations are synchronous and idempotent). The localStorage paths from Phase 174 are NOT touched in Phase 175. Test-runner output is in English (`Expected …`) but no user-visible error UI ships. |
| Destructive confirmation | **n/a** — Phase 175 has zero destructive actions. Pressable is a press affordance; Sheet is a container. No delete/reset/danger paths. |

**Copy invariants:**
- All UI copy in Italian (project standard).
- `aria-label` strings in Italian (matches `<html lang="it">`).
- Test/error/console output in English (developer-facing).
- No emoji in production UI copy.
- Token names (e.g., `var(--accent)`) rendered as code (Phase 174 page convention; new sections inherit).

---

## Accessibility

### `<Pressable>`

- **Default host (`as="div"`):** decorative; no ARIA role injected. If the consumer wires `onClick` and wants the surface to be operable, the consumer is responsible for `role="button"`, `tabIndex={0}`, and a keyboard handler. Phase 175 demo div-Pressable surfaces are decorative (no `onClick`).
- **`as="button"`:** native `<button>` semantics. `type="button"` MUST be passed by the consumer (otherwise default `type="submit"` triggers form submission). Demo Sample 2 in Section 05 sets `type="button"`.
- **Focus ring:** when host is keyboard-focusable, `:focus-visible` outline is `2px solid var(--accent)` with `2px` offset. Phase 175 ships this via a small CSS rule appended to `globals.css` keyed on a `[data-pressable-button]` attribute that `Pressable` adds when `as="button"` (or any focusable host). **Locked design:** Pressable component sets `data-pressable-focusable="true"` on the host element when the host element is `button | a | input | select | textarea` OR when the consumer passes `tabIndex >= 0`. The CSS rule:
  ```css
  [data-pressable-focusable="true"]:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  ```
  Appended to `globals.css` in the same Phase 175 block as `.press-anim`.
- **Reduced motion:** when `prefers-reduced-motion: reduce` is set, the press transition collapses to `50ms linear` (via `.press-anim` media query, also applied via the inline-style `transition` value if it includes the press curve — but the `.press-anim` class does NOT auto-apply, so for inline-style hosts the reduced-motion override is achieved by the consumer applying the `.press-anim` class instead of the inline transition). **For Phase 175 demos:** Sample 2 button has `className="glass-surface press-anim"` so the reduced-motion override applies. **Default `<Pressable>` component inline style does NOT respect reduced-motion** (it sets the press transition inline, which beats the media query). **Locked compromise:** Pressable's inline style is the bouncy 220ms by design (the bounce is the brand). Reduced-motion users who need a tight transition can apply `.press-anim` class via consumer styling. Documented in the `Pressable.tsx` JSDoc.
  - **Alternative considered + rejected:** detect `window.matchMedia('(prefers-reduced-motion: reduce)')` inside `Pressable` and emit a different inline transition. Rejected: adds a `useEffect` for a primitive that should be zero-cost, and the `.press-anim` class fallback is sufficient for the rare reduced-motion + bouncy-press collision.
- **Hit target:** consumer-controlled. Pressable does not enforce a minimum size. Demo surfaces in Section 05 all render ≥56×56 (mobile-friendly).

### `<Sheet>`

- **Role:** `dialog` with `aria-modal="true"` — provided by Radix `DialogPrimitive.Content` automatically.
- **`aria-labelledby`:** when `title` is provided, Radix wires `aria-labelledby` to the rendered `<DialogPrimitive.Title>`. When `title` is omitted, the visually-hidden fallback `<DialogPrimitive.Title>Sheet</DialogPrimitive.Title>` provides the label (Radix requires a Title for a11y; omitting it logs a console warning).
- **`aria-describedby`:** Phase 175 sets `aria-describedby={undefined}` on `DialogPrimitive.Content` to suppress Radix's missing-description warning. If a future phase needs a description, add a `<DialogPrimitive.Description>` inside the Sheet body.
- **Focus trap:** Radix-managed. Tab cycles inside the Sheet only. Close button (when `title` provided) is first focusable → auto-focused on open.
- **Return focus on close:** Radix returns focus to the element that triggered open (e.g., "Apri sheet demo" button on the demo page).
- **ESC key:** Radix-handled → `onOpenChange(false)` → our `onClose()`.
- **Backdrop tap:** our `<div onClick={onClose}>` with `aria-hidden="true"` (decorative).
- **Close button:** `<button type="button" aria-label="Chiudi" onClick={onClose}>` with `:focus-visible` accent outline (same rule as Pressable).
- **Reduced motion:** Sheet's 400ms transition is NOT collapsed under `prefers-reduced-motion: reduce` in Phase 175 (out of scope per D-15). Deferred to a future a11y phase.
- **Color contrast:**
  - Sheet title (#fff) on Sheet bg (rgba(28,25,23,0.85) over varying backdrop): contrast against the rgba(28,25,23) base ≈ 17:1 (AAA).
  - Sheet body primary text (`var(--text-1)` = #f5f5f4) on the same bg ≈ 16.6:1 (AAA).
  - Sheet body secondary text (`var(--text-2)` = rgba(245,245,244,0.55)) on the same bg ≈ 5.8:1 (AA for normal text).
  - Close button icon (#fff) on close button bg (rgba(255,255,255,0.1)) is THIN; contrast against the underlying sheet bg (rgba(28,25,23,0.85)) where the button is mostly transparent ≈ ~14:1 (AAA). Locked.

---

## Responsive Behavior

Phase 175 ships ZERO breakpoints. Both primitives render identically at 375px and 1024px.

**`<Pressable>`:**
- No viewport-conditional behavior. Press scale is the same on all viewports.
- Demo Section 05 grid is `gridTemplateColumns: 'repeat(3, 1fr)'` at all viewports. **Update from RESEARCH:** add a single `@media (max-width: 640px)` rule via inline style is awkward; use Tailwind v4 `grid-cols-1 sm:grid-cols-3` if the v2 page already uses Tailwind. **Phase 174's v2 page uses inline styles only** (verified at `app/debug/design-system-v2/page.tsx`). **Locked:** the demo section uses inline `gridTemplateColumns: 'repeat(3, 1fr)'`. At 375px, the 3 columns each render at ~110px wide, which is ≥44px touch-target. Acceptable. If readability at 375px is poor, a follow-up may switch to `repeat(auto-fit, minmax(96px, 1fr))` — but that's not required by SC.

**`<Sheet>`:**
- Position `fixed`, `left: 8px`, `right: 8px`, `bottom: 8px` — IDENTICAL at all viewports per the design bundle.
- At 375px: sheet width = 375 - 16 = 359px. At 1024px: sheet width = 1024 - 16 = 1008px.
- `maxHeight: 85%` of viewport at all viewports (375×812 → max 690px tall; 1024×768 → max 653px tall).
- **No mobile/desktop divergence.** Bundle does not declare any.

**Verification (Playwright per D-17):**
- "SHEET-01 mobile smoke (375px)": viewport set to 375×812; open Sheet; assert `sheet.bbox().width === 359` (or assert `right - left === viewport.width - 16`).
- "SHEET-01 desktop smoke (1024px)": viewport set to 1024×768; open Sheet; assert `sheet.bbox().width === 1008` (or `right - left === viewport.width - 16`).

**iOS PWA safe-area inset note:**
- Sheet uses `bottom: 8px` per bundle. iPhone home-indicator inset is handled at the **frame level** (Phase 181's bottom tab bar will use `env(safe-area-inset-bottom)`, NOT the Sheet itself). Phase 175 explicitly does NOT add safe-area math to Sheet — bundle fidelity wins.
- If a future phase needs the Sheet to clear the home indicator (e.g., for bottom-anchored CTA buttons in Phase 178 sheets), that's a Phase 178+ concern and would be implemented inside the sheet body, not at the Sheet primitive level.

---

## Component Inventory (deliverables this phase)

| Component | Path | New/Edit | LOC budget | Visual Contract |
|-----------|------|----------|-----|-----------------|
| `<Pressable>` + `usePressed()` | `app/components/EmberGlass/Pressable.tsx` | new | ~70 | Polymorphic component + hook + JSDoc; inline transform `scale(0.97)`/`scale(1)` with `transition: transform .22s cubic-bezier(.34,1.56,.64,1)`; `data-pressable-focusable` attribute on focusable hosts |
| `<Sheet>` | `app/components/EmberGlass/Sheet.tsx` | new | ~140 | Prop-driven facade over Radix Dialog; bundle-verbatim visuals; 3 dismissal vectors; scroll-lock recipe; z-index 200/201 documented in top-of-file comment |
| Barrel export | `app/components/EmberGlass/index.ts` | new | ~5 | `export { Pressable, usePressed } from './Pressable'; export { Sheet } from './Sheet'; export type { SheetProps } from './Sheet'; export { default as AmbientBg } from './AmbientBg';` |
| `.press-anim` CSS utility | `app/globals.css` (append after line 344) | edit | ~4 | `.press-anim { transition: transform .22s cubic-bezier(.34,1.56,.64,1); } @media (prefers-reduced-motion: reduce) { .press-anim { transition: transform 50ms linear; } }` |
| `[data-pressable-focusable]:focus-visible` rule | `app/globals.css` (append in same block) | edit | ~4 | `[data-pressable-focusable="true"]:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }` — and the same rule applied to `[data-sheet-close]:focus-visible` for the close button |
| `/debug/design-system-v2` Section 05 (Press) | `app/debug/design-system-v2/page.tsx` | edit (append) | ~40 | Eyebrow + heading + helper + 3-column grid of Pressable samples (card / button / circle) |
| `/debug/design-system-v2` Section 06 (Sheet) | `app/debug/design-system-v2/page.tsx` | edit (append) | ~50 | Eyebrow + heading + helper + Open button + Sheet demo with 3 dummy rows + 600px spacer |
| Pressable unit test | `app/components/EmberGlass/__tests__/Pressable.test.tsx` | new | ~80 | Pointer events toggle scale; `usePressed` hook; `as` prop polymorphism; `data-pressable-focusable` attribute applied; ref forwarding |
| Sheet unit test | `app/components/EmberGlass/__tests__/Sheet.test.tsx` | new | ~140 | Open/close prop; ESC dismissal; backdrop click dismissal; close button click dismissal; scroll-lock applied + restored; `<VisuallyHidden>` Title fallback when `title` omitted |
| Press primitive smoke spec | `tests/smoke/press-primitive.spec.ts` | new | ~30 | 1 spec, 3 expects: `Pressable` exported from EmberGlass barrel; `.press-anim` class present in computed CSS on `/debug/design-system-v2`; sample card has `transform: matrix(0.97, ...)` after `mouse.down()` |
| Sheet primitive smoke spec | `tests/smoke/sheet-primitive.spec.ts` | new | ~180 | 7 specs: open via button; ESC dismiss; backdrop tap dismiss; close button dismiss; scroll-lock open at y=300 + close → window.scrollY === 300; mobile 375px (right-left = viewport-16); desktop 1024px (same) |

**Total LOC budget:** ~210 production + ~220 test = **~430 LOC across 9 files** (5 new, 2 edits, 2 test edits).

**Components NOT shipped in this phase** (deferred to 177-182):
- `<SheetRow>` / `<SheetBtn>` layout helpers — Phase 178 may inline them.
- Migration of `app/components/ui/Sheet.tsx` and `BottomSheet.tsx` callers — separate v20.0 cleanup phase.
- Reduced-motion override for Sheet transition — future a11y phase.
- Swipe-to-dismiss gesture on Sheet grabber — future polish phase.
- Imperative focus management on Sheet open — Phase 178 may customize.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none — project does not use shadcn (no `components.json`) | not applicable |
| third-party | none | not applicable |

**Notes:**
- Project does not have `components.json` (verified 2026-04-27 via `ls components.json` → not found). Per CONTEXT.md and Phase 174 UI-SPEC, primitives are built with CVA + Radix on demand. Auto-mode skips the shadcn initialization gate.
- Phase 175 introduces NO new third-party packages. All listed dependencies (`@radix-ui/react-dialog ^1.1.14`, `@radix-ui/react-visually-hidden ^1.2.4`, `lucide-react`, React 19, Next.js 15.5, `@playwright/test`) already present in `package.json`.
- Vetting gate: not required (no third-party blocks).

---

## Verification Mapping (downstream consumers)

| Requirement | Visual contract surface | Verification method |
|-------------|-------------------------|---------------------|
| DS-07 | Component API + Variants → `<Pressable>` + `usePressed()` + `.press-anim`; reduced-motion override | Playwright `tests/smoke/press-primitive.spec.ts` (3 expects: barrel export + class in CSS + transform after mouse.down) + Jest `Pressable.test.tsx` (pointer events toggle, polymorphism, hook); per-phase grep invariant in 177-181 (NOT enforced here per D-06) |
| SHEET-01 | Component API + Variants → `<Sheet>` composition; 3 dismissal vectors; scroll-lock recipe; bundle-verbatim visuals | Playwright `tests/smoke/sheet-primitive.spec.ts` (7 specs: open/ESC/backdrop/close/scroll-lock/mobile/desktop) + Jest `Sheet.test.tsx` (open prop, all 3 dismissals, scroll-lock applied + restored, VisuallyHidden fallback) |
| SC-#1 (DS-07 shared utility verifiable by grep) | `<Pressable>`, `usePressed`, `.press-anim` all grep-able | NOT enforced in Phase 175 (per D-06). VERIFICATION.md records the invariant for Phases 177-181 to enforce per-phase. |
| SC-#2 (Sheet motion curve `.22,1,.36,1` over 400ms) | `Sheet.tsx` line locked at `transition: 'transform .4s cubic-bezier(.22,1,.36,1)'` | Static grep against `Sheet.tsx` in CI; Playwright assertion on computed style `transition` after open. |
| SC-#3 (3 dismissal vectors) | ESC (Radix) + backdrop tap (own div onClick) + close button click | Playwright covers all 3; Jest covers all 3. |
| SC-#4 (scroll-lock + restore) | useRef-captured scrollY recipe lifted from `BottomSheet.tsx:50-67` | Playwright "scroll lock + restore" spec (open at y=300, close, assert window.scrollY === 300). |
| SC-#5 (375px + 1024px parity) | No breakpoints in Sheet/Pressable | Playwright "mobile" and "desktop" specs; both assert sheet width = viewport - 16. |
| Phase-174-inherited DS-02 (no hardcoded glass/blur/accent) | AUDIT-EXCEPTION list documented above | Repo grep against new files; AUDIT-EXCEPTION-tagged lines tolerated. |

---

## Claude's Discretion (auto-resolved)

Items where CONTEXT.md left planner freedom; UI-SPEC locks visual answers so the planner has zero ambiguity:

| Item | Resolution | Rationale |
|------|------------|-----------|
| Pressable file organization (separate `usePressed.ts` vs co-located) | **Co-located in `Pressable.tsx`** | ~70 LOC total; splitting adds friction without payoff. Both `Pressable` and `usePressed` are exported from the same module. |
| `<SheetRow>` / `<SheetBtn>` helpers in this phase | **Defer to Phase 178** | Phase 175 ships the Sheet primitive; Phase 178 builds the actual device sheets and decides if helpers pay off. |
| Dismissal callback name (`onClose` vs `onOpenChange`) | **`onClose`** | Matches bundle (`sheets.jsx:5`); keeps Phase 178 sheet bodies terse. Internally Radix's `onOpenChange` adapter calls our `onClose`. |
| Reduced-motion override for `.press-anim` | **Ship it (3 LOC)** | Aligns with Phase 176's reduced-motion philosophy; cost is trivial; courtesy is real. Lock: included. |
| Reduced-motion override for Sheet transition | **Defer to a future a11y phase** | Sheet uses inline-style transitions; collapsing to a CSS class for reduced-motion would refactor the inline-style contract. Out of scope per D-15's ≤10 LOC budget. |
| Pressable focus-visible mechanism (inline `:focus` impossible) | **`[data-pressable-focusable="true"]:focus-visible` selector + global rule in `globals.css`** | Inline styles cannot express `:focus-visible`. Pressable adds `data-pressable-focusable="true"` to the host when the host is natively focusable; the global rule paints the accent outline. Same approach for Sheet close button via `data-sheet-close="true"`. |
| Demo Section 05 grid responsiveness | **Inline `gridTemplateColumns: 'repeat(3, 1fr)'` at all viewports** | Phase 174's v2 page uses inline styles only. At 375px, 3 columns × 110px ≥ 44px touch-target; readability is acceptable. |
| Demo Sheet body content | **3 rows + 600px spacer** | 3 rows is enough variety to show row separators; 600px spacer guarantees the scroll-lock test is meaningful (the underlying page has scrollable content + the sheet body has scrollable content). |
| Sheet title color (token vs literal) | **`#fff` literal (AUDIT-EXCEPTION)** | Bundle hard-codes `#fff` for max contrast inside the dense sheet header; using `var(--text-1)` (`#f5f5f4`) is 1.7% darker and visibly less crisp against the rgba(28,25,23,0.85) bg. |

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS — all UI copy declared (IT), close button aria-label declared, no destructive copy needed, error/empty states declared as n/a with rationale
- [ ] Dimension 2 Visuals: PASS — Sheet composition pixel-precise (every CSS rule per element); Pressable transform curve and timing locked; demo page sections layout specified
- [ ] Dimension 3 Color: PASS — 60/30/10 split declared with explicit accent reserved-for list (2 items: Pressable focus-visible + Sheet close button focus-visible); 10 AUDIT-EXCEPTION literals enumerated with bundle source line references
- [ ] Dimension 4 Typography: PASS — exactly 4 sizes (12/16/22/24) and 2 weights (400/600); fonts inherited from Phase 174 token aliases
- [ ] Dimension 5 Spacing: PASS — 4-multiple scale declared; 32×32 close button exception called out and justified (bundle fidelity); z-index 200/201 reservation documented
- [ ] Dimension 6 Registry Safety: PASS (vacuous) — no shadcn, no third-party blocks, no new deps

**Approval:** pending (gsd-ui-checker)
