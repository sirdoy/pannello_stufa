# Phase 174: Ember Glass Tokens & Foundations - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-27
**Phase:** 174-ember-glass-tokens-foundations
**Mode:** `--auto --chain` — all questions auto-resolved with recommended defaults grounded in REQUIREMENTS.md, ROADMAP.md success criteria, and the inbox design bundle.
**Areas discussed:** Token surface, Coexistence with Ember Noir, Accent picker location, Ambient glow default, Body font swap, Backdrop fallback strategy, Hue preset count

---

## Token Surface — Where do the new CSS variables live?

| Option | Description | Selected |
|--------|-------------|----------|
| `app/globals.css` `:root` block | Add new `/* EMBER GLASS TOKENS */` block after existing `@theme` | ✓ |
| New `app/styles/tokens.css` | Separate file imported into `globals.css` | |
| Tailwind `@theme` extension | Declare as Tailwind theme tokens | |

**Auto-selected:** `globals.css :root` block — recommended because `globals.css` is the canonical token surface and Tailwind v4 already loads it; adding a sibling `:root` block keeps token discovery simple and avoids new build wiring.

---

## Legacy Ember Noir Tokens — Coexistence policy

| Option | Description | Selected |
|--------|-------------|----------|
| Additive — keep all legacy tokens | New glass tokens ship alongside; migrate components phase-by-phase | ✓ |
| Replace immediately | Rename/remove `--color-ember-*` etc. now | |
| Namespaced parallel set | Move legacy under `--legacy-*` prefix | |

**Auto-selected:** Additive — recommended because removing legacy tokens before components are migrated would break unmigrated surfaces. v20.0 ships token plumbing first, then phase-by-phase migration, then a final cleanup.

---

## Hardcoded-value Audit Scope (DS-02)

| Option | Description | Selected |
|--------|-------------|----------|
| Audit applies to NEW glass surfaces only | Existing components keep hardcoded values until migrated | ✓ |
| Audit applies repo-wide immediately | Block until every existing component is detokenized | |

**Auto-selected:** New surfaces only — recommended because repo-wide enforcement would require the entire v20.0 redesign to land in a single phase, defeating the phase split.

---

## Accent Picker Location

| Option | Description | Selected |
|--------|-------------|----------|
| New `/debug/design-system-v2` page + link from `/debug` index | Sibling to existing Ember Noir `/debug/design-system` | ✓ |
| Replace `/debug/design-system` | Tear down existing page | |
| Production navbar dropdown | End-user-facing accent picker | |

**Auto-selected:** New `/debug/design-system-v2` — recommended because DS-03 specifies "developer toolbar in `/debug`" and keeping the legacy reference page intact preserves Ember Noir docs while v20.0 components migrate.

---

## Hue Preset Count

| Option | Description | Selected |
|--------|-------------|----------|
| 6 presets per ROADMAP success criterion #2 (copper, rose, violet, blue, green, amber) | Matches the locked acceptance | ✓ |
| 7 presets from design bundle (adds Coral) | Matches the inbox `app.jsx` exactly | |

**Auto-selected:** 6 — recommended because ROADMAP success criterion #2 explicitly enumerates the 6 hues and that is the locked acceptance test. The bundle's 7th hue (Coral) is dropped.

---

## Body Font

| Option | Description | Selected |
|--------|-------------|----------|
| Replace `Space_Grotesk` with `Inter` | DS-04 explicitly names Inter | ✓ |
| Keep `Space_Grotesk` and alias `--font-body` | No font swap | |

**Auto-selected:** Replace with Inter — recommended because DS-04 requires Inter explicitly; preserving Space_Grotesk would fail the acceptance criterion.

---

## Ambient Glow Default State

| Option | Description | Selected |
|--------|-------------|----------|
| OFF on first visit (user opts in via toolbar) | Avoid burning paint frames for users who never see the toolbar | ✓ |
| ON by default | Maximizes visual presence of the new design language | |

**Auto-selected:** OFF — recommended because ambient gradients animate continuously and produce a measurable paint cost; the design bundle exposes it as a deliberate user choice.

---

## Backdrop-Filter Fallback

| Option | Description | Selected |
|--------|-------------|----------|
| `@supports not` → solid translucent background (`rgba(28,25,23,0.92)`) | DS-06 mandates graceful fallback | ✓ |
| Detect via JS, swap class | Runtime detection | |
| Skip fallback (require modern browsers) | Browser support is now wide | |

**Auto-selected:** `@supports not` solid translucent — recommended because DS-06 mandates graceful degradation and `@supports` is the platform-native, zero-JS solution.

---

## Persistence Pre-Paint Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Inline `<script>` in `app/layout.tsx` reading localStorage before paint | Same pattern phase 149 used for theme | ✓ |
| Read in client `useEffect` (accept brief flash) | Simpler, but flashes on every load | |

**Auto-selected:** Inline pre-paint script — recommended because the codebase already uses this pattern (phase 149) and it eliminates the accent flash that would otherwise be visible on every navigation.

---

## Reference Page Scope (this phase)

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal token-demo page (token grid + picker + ambient toggle + 1 demo glass card) | Just enough to verify tokens work end-to-end | ✓ |
| Full design-system reference page (DSREF-01..DSREF-04) | Ship complete reference now | |

**Auto-selected:** Minimal token-demo — recommended because DSREF-01..DSREF-04 are scoped to a later v20.0 phase; phase 174 ships token plumbing only.

## Claude's Discretion

- Exact React component file structure for `/debug/design-system-v2`
- Whether the inline pre-paint script lives inline in `layout.tsx` or extracts to a helper
- Path for the `<AmbientBg>` provider component (suggestion: `app/components/EmberGlass/AmbientBg.tsx`)

## Deferred Ideas

- Production-facing accent picker (out of v20.0 scope)
- Legacy Ember Noir token removal (final v20.0 cleanup phase)
- Light-mode token variants (Ember Glass is dark-first)
- Container-query / responsive token variations (not requested)
- Card press animation utility (DS-07 → Phase 175)
- Full design-system reference page (DSREF-01..DSREF-04 → later v20.0 phase)
- Migration of legacy components to glass tokens (phase-by-phase across v20.0)
