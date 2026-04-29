---
phase: 178
slug: per-device-modal-sheets
status: draft
shadcn_initialized: false
preset: none
created: 2026-04-29
---

# Phase 178 — UI Design Contract

> Visual and interaction contract for the **five per-device modal sheet bodies** (StoveSheet, ClimateSheet, LightsSheet, SonosSheet, PlugsSheet) and **six new sheet sub-primitives** (`SheetRow`, `Stepper`, `Slider`, `RadialDial`, `SheetBtn`, `QuickActionButton`). Auto-resolved from `178-CONTEXT.md` D-01..D-36 (locked), the design bundle (`.planning/inbox/ember-glass-design/project/components/sheets.jsx` lines 1–597 — primary visual source), Phase 175 `<Sheet>` primitive contract (consumed unmodified), Phase 174 token block, and Phase 177 dashboard-card sheet wiring (consumed unmodified). Verified by gsd-ui-checker downstream.

**Scope reminder:** Phase 178 ships ONLY (a) five `<*Sheet>` body components in `app/components/EmberGlass/sheets/`, (b) six sub-primitives in `app/components/EmberGlass/sheets/primitives/`, (c) one helper `findSceneByName` under `app/components/EmberGlass/sheets/lib/`, (d) one new commands hook `useThermostatCommands` at `app/components/devices/thermostat/hooks/useThermostatCommands.ts`, (e) per-card single-line swap of `<SheetPlaceholderBody>` → `<*Sheet>` in 5 cards (Stove, Climate, Lights, Sonos, Tuya), and (f) jest unit specs + 5 new Playwright describe blocks appended to `tests/playwright/dashboard-glass-cards.spec.ts`. **Out of scope** (per CONTEXT D-03, D-17, deferred): Camera/Network/Dirigera sheet bodies, `<SheetPlaceholderBody>` deletion, Stove "Temperatura obiettivo" slider, `<BigSlider>` primitive, drag/touch gestures on Sheet or RadialDial, reduced-motion overrides, new colors/fonts/tokens.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (manual — Ember Glass v2 token system, Phase 174) |
| Preset | not applicable (verified 2026-04-29: `components.json` does not exist; project uses Tailwind v4 + CVA convention with no shadcn) |
| Component library | Radix (`@radix-ui/react-dialog ^1.1.14` via Phase 175 `<Sheet>`) + custom EmberGlass primitives |
| Icon library | `lucide-react` (already a dep) — new icons in Phase 178: `<Calendar>`, `<AlertTriangle>` (StoveSheet `<SheetBtn>`), `<TriangleAlert>` (sheet error state), `<Volume2>` (SonosSheet volume label), `<Play>`/`<Pause>` (SonosSheet group rows), `<Power>` (StoveSheet primary action + SonosSheet master button), `<Music>` (SonosSheet idle row tile), `<Lightbulb>` (LightsSheet per-light tile), `<Plug>` (PlugsSheet per-plug tile), `<Minus>`/`<Plus>` (Stepper + RadialDial controls) |
| Display font | Outfit (`var(--font-display)`, Phase 174 token alias) |
| Body font | Inter (`var(--font-body)`, Phase 174 token alias) |
| Color space | OKLCH for `--accent`; rgba/hex literals for bundle-verbatim non-tokenized values (documented as AUDIT-EXCEPTION below) |
| Styling approach | **Inline `style={...}` objects with `var(--token)` references** (Phase 174 D-12 / Phase 175 D-08 / Phase 176 D-23 / Phase 177 D-02 mandate, locked). Tailwind v4 utility classes are FORBIDDEN inside sheet bodies and sub-primitives — bundle is the source of truth and bundle is inline-style. |

**Token consumption (Phase 174 — locked, do NOT redefine):**

| Token | Value | Where used in Phase 178 |
|-------|-------|-------------------------|
| `--accent` | `oklch(0.68 0.17 45)` (default copper, runtime-overridable) | StoveSheet hero gradient (`color-mix(in oklab, var(--accent) 25%, transparent)`), StoveSheet primary "Accendi stufa" button fill + glow, `<Slider>` default fill color, `<SheetBtn>`/`<Stepper>`/`<QuickActionButton>` `:focus-visible` outlines |
| `--text-1` | `#f5f5f4` | Sheet body primary text (sub-primitive labels, list-row primary text, mode-pill labels — but **inside Sheet header itself, pure white `#fff` is used per Phase 175 AUDIT-EXCEPTION carried into bodies**) |
| `--text-2` | `rgba(245, 245, 244, 0.55)` | Sheet body secondary text (subtitles in `<SheetRow>`, list-row secondary line, caps section labels, footnotes) |
| `--font-display` | Outfit | Numeric readouts (StoveSheet 54px temp, RadialDial 68px temp, summary-card 24/28px counts, Stepper 18px value, primary-action button labels) |
| `--font-body` | Inter | All other text (labels, subtitles, list rows, mode pills, scene buttons) |
| `--glass-border` | `rgba(255, 255, 255, 0.08)` | NOT used in sheet bodies (sheet container has its own AUDIT-EXCEPTION border `rgba(255,255,255,0.12)`); inner sheet rows use `rgba(255,255,255,0.06)` per bundle (AUDIT-EXCEPTION below) |

**Tokens NOT introduced or modified by Phase 178:** zero. All color/blur/border/radius/shadow values either consume Phase 174 tokens or carry forward bundle-verbatim AUDIT-EXCEPTIONs already documented in Phase 175 (Sheet primitive). No new tokens added.

**Detected existing UI (verified 2026-04-29):**
- `app/components/EmberGlass/Sheet.tsx` — Phase 175 primitive, consumed unmodified via `{ open, onClose, title }` prop API.
- `app/components/EmberGlass/InlineToggle.tsx` — Phase 177 primitive (44×26 iOS toggle); reused by ClimateSheet (Tipo row), LightsSheet (per-room rows), PlugsSheet (per-plug rows). `<InlineToggle on color onChange>` API consumed unchanged.
- `app/components/EmberGlass/PlayingBars.tsx` — Phase 177 primitive; reused inside SonosSheet group-row album-art tile when `g.playing === true`.
- `app/components/EmberGlass/FlameViz.tsx` — Phase 176 primitive; reused inside StoveSheet hero block. API: `<FlameViz on={isAccesa} intensity={powerLevel/5} />`.
- `app/components/EmberGlass/cards/{Stove,Climate,Lights,Sonos,Tuya}Card.tsx` — Phase 177 cards; each gets exactly **one** line edited (`<SheetPlaceholderBody phase="178" device="…" />` → `<*Sheet />`). The `useState<boolean>` for sheet open + `<GlassCard onOpen>` + `<Sheet open onClose title>` wrapper all stay verbatim from Phase 177.
- `app/components/EmberGlass/cards/SheetPlaceholderBody.tsx` — UNCHANGED. Still serves CameraCard, NetworkCard, DirigeraCard (out of scope this phase).
- `app/hooks/useDebounce.ts` — existing hook; reused by ClimateSheet (500ms setpoint debounce, ThermostatCard precedent) and SonosSheet (250ms volume debounce, v16.0 precedent).
- `lib/hooks/useRetryableCommand` — existing Phase 7.0 retry infrastructure; consumed by `useThermostatCommands` (the new hook) the same way `useStoveCommands`/`useLightsCommands` consume it.
- `lib/routes.ts` — `STOVE_ROUTES.scheduler` (`/stove/scheduler`) + `STOVE_ROUTES.maintenance` (`/stove/maintenance`) consumed by StoveSheet `<SheetBtn>` buttons.
- `app/components/devices/{stove,thermostat,lights,sonos,tuya}/hooks/use*Data.ts` + `use*Commands.ts` — existing data/command hooks consumed unchanged. Only `useThermostatCommands` is NEW (CONTEXT D-16).

---

## Spacing Scale

Declared values (multiples of 4 unless flagged as bundle-verbatim micro-affordance):

| Token | Value | Usage in Phase 178 |
|-------|-------|--------------------|
| 2 | 2px | StoveSheet pellet/temp footnote `marginTop: 4` (4 is the next bump); inner toggle thumb offset (inherited from `<InlineToggle>`); list-row secondary-line `marginTop: 1` (PlayingBars row) |
| 4 | 4px | StoveSheet hero footnote `marginTop: 4`; PlugsSheet summary-card display `marginTop: 4`; RadialDial label `marginTop: 4` |
| 6 | 6px | Zone-chip dot 6×6 in ClimateSheet; PlayingBars row container internal flex |
| 8 | 8px | Zone-chip-row inter-chip `gap: 8`; mode-pill grid `gap: 8`; Stepper inter-button `gap: 8`; LightsSheet per-room section `marginBottom: 8` |
| 9 | 9px | LightsSheet scene-button album-tile `borderRadius: 9`; SonosSheet scene/album-art-tile `borderRadius: 10` (rounded to 10 — see micro-affordance) |
| 10 | 10px | LightsSheet summary-grid `gap: 10`; sub-primitive icon-tile `borderRadius: 10`; Sheet primary-action button inner gap; StoveSheet `<SheetBtn>` 2-col grid `gap: 10` |
| 12 | 12px | SonosSheet group-row `gap: 12`; LightsSheet light-row `gap: 12`; PlugsSheet plug-row `gap: 12`; SheetRow `gap: 12`; LightsSheet zone-chip `borderRadius: 12`; mode-pill bottom `marginTop: 22` (rounded; see Sheet header inheritance) |
| 14 | 14px | SonosSheet group-row inner padding `12px 14px`; PlugsSheet plug-row inner padding `14px 16px` (asymmetric — bundle-verbatim); SheetRow vertical padding `14px 0`; mode-pill `padding: '14px 8px'`; mode-pill `borderRadius: 14`; scene-button `borderRadius: 14`; CameraCard preview `borderRadius` (Phase 177 carry-forward) |
| 16 | 16px | LightsSheet/PlugsSheet summary-card `borderRadius: 16`; SheetBtn outer padding `16px`; SheetBtn `borderRadius: 16`; SonosSheet master button `borderRadius: 16`; LightsSheet scene grid `gap: 10` (≠ 16 — see bundle); LightsSheet count-card padding `14px 18px`; PlugsSheet summary-card padding `16px 18px` |
| 18 | 18px | PlugsSheet summary 2-col `marginBottom: 18`; LightsSheet summary 3-col `marginBottom: 18`; PlugsSheet plug-list `borderRadius: 18`; SonosSheet group-list `borderRadius: 18`; StoveSheet primary button `borderRadius: 18`; StoveSheet primary-button `marginTop: 18`; **Sheet header `marginBottom: 18`** (Phase 175 carry-forward — sub-primitives align with this rhythm) |
| 20 | 20px | StoveSheet hero inner padding `24px 20px` (asymmetric — bundle-verbatim) |
| 22 | 22px | ClimateSheet "Modalità globale" label `marginTop: 22`; SonosSheet master button `marginTop: 22`; mode-pill grid `marginTop: 22` (post-zone-toggle rhythm) |
| 24 | 24px | StoveSheet hero `borderRadius: 24`; StoveSheet hero inner padding `24px 20px` (vertical 24); RadialDial post-control `marginTop: 14` (NOT 24 — bundle-verbatim) |

**Hero block (StoveSheet) verbatim from `sheets.jsx:71-79`:**
- `borderRadius: 24`, `padding: '24px 20px'`, internal `gap: 20` between FlameViz and status-stack column, `border: '0.5px solid rgba(255,255,255,0.06)'`.

**Bundle-verbatim micro-affordances (intentional non-multiples of 4 — DO NOT normalize):**
- `0.5px` — every sheet sub-container border (per bundle consistency: rows, lists, summary cards, sheet primary buttons). Sub-pixel hairline for retina.
- `9px` — LightsSheet scene-button album-art tile `borderRadius` (`sheets.jsx:260`). Bundle-verbatim — DO NOT round to 8 or 10.
- `10px` — SonosSheet album-art tile + LightsSheet light-tile `borderRadius` (`sheets.jsx:343, 280`). Bundle-verbatim.
- `5px` — Sheet grabber pill height (Phase 175 carry-forward).
- `1.5px` — `<PlayingBars>` inter-bar gap (Phase 177 carry-forward, not redefined here).
- `34×34` — SonosSheet group-row play/pause circle button (`sheets.jsx:361`). Bundle-verbatim. Below the 36px "Stepper" button size.
- `36×36` — Stepper minus/plus buttons; SonosSheet/LightsSheet/PlugsSheet list-tile (album-art / bulb / plug). Bundle-verbatim across all three lists.
- `44×44` — RadialDial ± buttons (`sheets.jsx:567-575`). Apple HIG-compliant.
- `36px-min` — Stepper value display `minWidth: 36, textAlign: 'center'` (`sheets.jsx:491`). Centered numeric readout.
- `54px` — StoveSheet primary temp display `fontSize: 54` (`sheets.jsx:85`). 22px superscript `°C`.
- `68px` — RadialDial center value `fontSize: 68` (`sheets.jsx:560`). 28px superscript `°`.
- `220×220` — RadialDial SVG `width/height` (`sheets.jsx:539`). 270° arc on a 92px-radius track.
- `92px` — RadialDial track radius (`r=92`).
- `140px` — `<Slider>` width (`sheets.jsx:508`). Custom range input.

**Touch target exceptions:**
- **SonosSheet group-row play/pause: 34×34** — bundle-verbatim. Below Apple HIG 44×44. Locked for bundle fidelity. (Sheet z-index 200/201 ensures the row is the only meaningful gesture target; mis-taps are unlikely.)
- **Stepper buttons: 36×36** — bundle-verbatim. Below 44×44 but consistent with internal sheet-row controls in iOS Settings. Locked.
- **RadialDial ± buttons: 44×44** — meets Apple HIG.
- **Sheet close button: 32×32** — Phase 175 carry-forward AUDIT-EXCEPTION; below 44×44; locked.
- **`<InlineToggle>`: 44×26** — Phase 177 carry-forward (iOS toggle dimension).

**Z-index reservations (Phase 175 carry-forward — Phase 178 introduces NO new z-indices):**
- 200 → Sheet backdrop
- 201 → Sheet container
- All Phase 178 sub-primitives stay BELOW 200 (no popovers, no tooltips, no dropdowns introduced this phase).

---

## Typography

**4 sizes for primary readouts/labels, 2 weights (regular + semibold) — bundle-verbatim, aligned with the Phase 174/175/177 typography budget. Total declared sizes in Phase 178 surfaces: {11, 12, 13, 14, 15, 18, 22, 24, 28, 54, 68}.** This exceeds the strict "3-4 sizes" guideline because sheet bodies render multiple distinct hierarchical levels — large numeric readouts (54/68/28/24), labels and rows (14/13/11), and superscript suffixes (22/14). Bundle copy is verbatim; sizes cannot be normalized further without breaking bundle fidelity. The 4 weights (`400 regular, 500 medium, 600 semibold, 700 bold`) match Phase 177's typographic ladder.

| Role | Size | Weight | Line Height | Family | Where |
|------|------|--------|-------------|--------|-------|
| Display Hero (StoveSheet temp) | 54px | 600 | 1 | `var(--font-display)` (Outfit) | `{temp}` in StoveSheet hero (`letter-spacing: -2`) |
| Display RadialDial | 68px | 600 | 1 | `var(--font-display)` (Outfit) | `{value}` in RadialDial center (`letter-spacing: -3`) |
| Display Summary | 28px | 600 | (default) | `var(--font-display)` (Outfit) | PlugsSheet summary-card values (`letter-spacing: -0.5`); LightsSheet "Spente" empty state shape (carried from Phase 177) |
| Display Mid | 24px | 600 | (default) | `var(--font-display)` (Outfit) | LightsSheet "Accese" count card value (`letter-spacing: -0.5`) |
| Sheet Title (header) | 22px | 600 | 1.2 | `var(--font-display)` (Outfit) | `<DialogPrimitive.Title>` rendered by Phase 175 Sheet primitive — color `#fff` (NOT `var(--text-1)`, bundle AUDIT-EXCEPTION carried from Phase 175) |
| Stepper Value | 18px | 600 | (default) | `var(--font-display)` (Outfit) | `<Stepper>` numeric value between ± buttons |
| Display Superscript Heavy | 28px | 400 | (default) | `var(--font-display)` (Outfit) | RadialDial `°` suffix (`opacity: 0.5`) |
| Display Superscript Medium | 22px | 400 | (default) | `var(--font-display)` (Outfit) | StoveSheet `°C` suffix (`opacity: 0.5`) |
| Display Superscript Small | 14px | (inherits) | (default) | `var(--font-body)` (Inter) | LightsSheet count-card `/{total}` suffix (`color: var(--text-2)`); PlugsSheet count-card `/{total}` suffix; PlugsSheet unit suffix `kW`/`W` (`marginLeft: 4`) |
| Master Action (StoveSheet primary) | 16px | 600 | 1 | `var(--font-display)` (Outfit) | StoveSheet "Accendi stufa"/"Spegni stufa" button label |
| Master Action (SonosSheet) | 15px | 600 | 1 | `var(--font-display)` (Outfit) | SonosSheet "Riproduci/Pausa ovunque" master button |
| Body | 14px | 500 | (default) | `var(--font-body)` (Inter) | `<SheetRow>` primary label; SonosSheet group-row name; LightsSheet/PlugsSheet list-row name; SheetBtn label; mode-pill text **(weight 600 in mode-pill, see Caption Heavy)** |
| Body Secondary | 13px | 600 | (default) | `var(--font-body)` (Inter) | ClimateSheet zone chip label (`whiteSpace: nowrap`); ClimateSheet mode-pill label; SonosSheet volume readout (`tabular-nums`); LightsSheet scene-button label; StoveSheet hero footnote `Obiettivo {N}°C · Pellet {N}%` |
| Caption | 12px | 500 | (default) | `var(--font-body)` (Inter) | `<SheetRow>` subtitle (`var(--text-2)`); QuickActionButton label (weight 600); RadialDial label (`var(--text-2)`) |
| Caps Eyebrow Heavy | 11px | 600 | (default) | `var(--font-body)` (Inter) | "Modalità globale" eyebrow (`textTransform: uppercase, letterSpacing: 1`); LightsSheet "Scene" eyebrow; SonosSheet "Volume · {name}" eyebrow; per-room section header in LightsSheet |
| Caps Mini | 11px | (inherits) | (default) | `var(--font-body)` (Inter) | Summary-card "Accese" / "Consumo" caps labels (`textTransform: uppercase, letterSpacing: 0.8`); SonosSheet group-row track line (no caps, just 11px `var(--text-2)`) |

**Superscript pattern:** primary numeric + smaller secondary unit/decoration. Three established sizes: `54+22` (StoveSheet hero), `68+28` (RadialDial), `24/28+14` (count cards).

**Font-variant-numeric `tabular-nums` applied on:**
- SonosSheet volume readout (`sheets.jsx:381`).
- PlugsSheet summary-card consumption value (`sheets.jsx:431`).

**Verification gate:** repo-wide grep against the new files (`app/components/EmberGlass/sheets/**/*.tsx`, `app/components/devices/thermostat/hooks/useThermostatCommands.ts`, plus the 5 single-line card swap edits) MUST show zero font sizes outside `{11, 12, 13, 14, 15, 16, 18, 22, 24, 28, 54, 68}` and zero font weights outside `{400, 500, 600}`. The `700 bold` weight from Phase 177 (LIVE pill) is NOT used in Phase 178.

---

## Color

Phase 178 dark-only palette inherited from Phase 174 tokens + Phase 175 sheet container AUDIT-EXCEPTIONs + per-device-class tones lifted verbatim from bundle `sheets.jsx`. Sheet body fills sit INSIDE the Phase 175 sheet container (`rgba(28, 25, 23, 0.85)` denser glass) so contrast is calibrated against that base, not the page background.

| Role | Value | Token | Usage |
|------|-------|-------|-------|
| Dominant (60%) | `rgba(28, 25, 23, 0.85)` (Phase 175 sheet container) | NOT a token (Phase 175 AUDIT-EXCEPTION carried) | Sheet body backdrop — every sub-primitive renders against this base |
| Secondary (30%) | `var(--text-1)` (`#f5f5f4`) primary text + `var(--text-2)` (`rgba(245, 245, 244, 0.55)`) secondary text | `--text-1` / `--text-2` | Sheet body labels, list-row text, subtitles, footnotes |
| Accent (10%) | `var(--accent)` (`oklch(0.68 0.17 45)` copper default — runtime-overridable) | `--accent` | StoveSheet hero gradient (`color-mix(in oklab, var(--accent) 25%, transparent)`); StoveSheet primary "Accendi stufa" button fill (when off → on); StoveSheet primary button glow `box-shadow: 0 0 30px color-mix(in oklab, var(--accent) 40%, transparent)`; `<Slider>` default fill color; `:focus-visible` outlines (sub-primitives consumed via inline-style `:focus` adapter via `[data-sheet-focusable]:focus-visible` rule) |
| Destructive (Stove off) | `#ff4d5c` (red ember) — bundle verbatim `sheets.jsx:120-123` | NOT a token (AUDIT-EXCEPTION) | StoveSheet "Spegni stufa" button border `0.5px solid rgba(255, 77, 92, 0.25)`, fill `rgba(255, 77, 92, 0.15)`, label color `#ff6676` |
| Destructive (maintenance lock) | `#ff4d5c` ember | NOT a token (AUDIT-EXCEPTION) | StoveSheet primary button disabled state border + label when `needsCleaning === true` (copy: `Manutenzione richiesta`). NOT a confirmation dialog — non-destructive disabled state. |

**Per-device-class tones (carried verbatim from bundle `sheets.jsx`, NOT user-themable — these are device-class identifiers exactly as in Phase 177 cards):**

| Device | Tone hex | Where in Phase 178 |
|--------|----------|---------------------|
| Stove | `var(--accent)` (only sheet themed by user accent) | Hero gradient + primary action button |
| Thermostat | `#5eafff` (azure) | ClimateSheet zone-chip selected state, RadialDial arc + glow + center label, mode-pill selected state, InlineToggle Tipo row color |
| Lights | `#f5c84a` (amber-yellow) | LightsSheet count-card tint (`rgba(245,200,74,0.1)` bg + `rgba(245,200,74,0.25)` border), bulb-tile on state (`rgba(245,200,74,0.18)` bg + `rgba(245,200,74,0.3)` border, `0 0 12px rgba(245,200,74,0.25)` glow, icon `#f5c84a`), `<InlineToggle color="#f5c84a">` per-light, QuickActionButton active state (`rgba(245,200,74,0.18)` bg + `#f5c84a` text), scene gradients (4 gradients listed below) |
| Sonos | `#b080ff` (violet) | SonosSheet selected-row tint `rgba(176,128,255,0.08)`, album-tile playing gradient `linear-gradient(135deg, #b080ff 0%, #5eafff 100%)`, master button tint (`rgba(176,128,255,0.15)` bg + `rgba(176,128,255,0.3)` border + `#b080ff` text), volume slider `accentColor: '#b080ff'`, PlayingBars tint (Phase 177 carry-forward) |
| Plugs (Tuya) | `#ffb84a` (warm amber) | PlugsSheet count-card tint (`rgba(255,184,74,0.08)` bg + `rgba(255,184,74,0.2)` border), plug-tile on state (`rgba(255,184,74,0.18)` bg + `rgba(255,184,74,0.3)` border, icon `#ffb84a`), `<InlineToggle color="#ffb84a">` per-plug |

**Tone is a device-class identifier, NOT user-themable.** Only StoveSheet binds to `var(--accent)`. The other 4 sheets keep their bundle hex across the 6 user accent presets (DS-03). This matches the Phase 177 contract for cards exactly.

**Status-dot colors (ClimateSheet zone-chip dots):**
- On: `#5eafff` (azure) with `boxShadow: 0 0 6px #5eafff` glow.
- Off: `rgba(255,255,255,0.25)` with `boxShadow: 'none'`.

**Scene gradients (LightsSheet — bundle verbatim `sheets.jsx:217-220`):**

| Scene name | Gradient | Italian copy |
|------------|----------|--------------|
| Rilassante | `linear-gradient(135deg, #ff8a5c, #b080ff)` | Rilassante |
| Concentrato | `linear-gradient(135deg, #fff3c4, #5eafff)` | Concentrato |
| Cena | `linear-gradient(135deg, #ffb84a, #ff8a5c)` | Cena |
| Notte | `linear-gradient(135deg, #2a3a6a, #b080ff)` | Notte |

**Disabled scene button state** (when `findSceneByName` returns null): `opacity: 0.5`, `cursor: 'not-allowed'`, `title="Crea scena '{name}' su Hue"` HTML tooltip, click is a no-op.

**Sheet-body row backgrounds (bundle verbatim — AUDIT-EXCEPTIONS carried in addition to Phase 175 sheet container exceptions):**

| Surface | Value | Source |
|---------|-------|--------|
| Generic list container (LightsSheet per-room, PlugsSheet plugs, SonosSheet groups) | `background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.06)'` | `sheets.jsx:272, 332, 439` |
| Inter-row divider inside list containers | `borderBottom: '0.5px solid rgba(255,255,255,0.06)'` | `sheets.jsx:276, 338, 443` |
| `<SheetRow>` divider | `borderBottom: '0.5px solid rgba(255,255,255,0.06)'` | `sheets.jsx:473` |
| Stepper button bg | `background: 'rgba(255,255,255,0.1)'` | `sheets.jsx:488, 495` |
| RadialDial ± button bg | `background: 'rgba(255,255,255,0.08)'` | `sheets.jsx:567, 572` |
| RadialDial track | `stroke: 'rgba(255,255,255,0.08)'` | `sheets.jsx:549` |
| `<SheetBtn>` bg | `background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.06)'` | `sheets.jsx:584-585` |
| `<QuickActionButton>` inactive bg | `background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.06)'` | `sheets.jsx:300-304` |
| Plug/sonos/light tile inactive bg | `background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)'` | `sheets.jsx:280-282, 346, 446-449` |
| Mode-pill inactive bg | `background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.06)'` | `sheets.jsx:187-189` |
| Mode-pill selected bg | `background: 'rgba(94,175,255,0.2)', border: '0.5px solid rgba(94,175,255,0.4)', color: '#5eafff'` | `sheets.jsx:187-189` |
| Zone-chip selected bg | `background: 'rgba(94,175,255,0.18)', border: '0.5px solid rgba(94,175,255,0.4)', color: '#5eafff'` | `sheets.jsx:154-156` |
| Zone-chip inactive bg | `background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.06)', color: 'var(--text-2)'` | `sheets.jsx:154-156` |
| StoveSheet primary "Accendi" button glow | `boxShadow: '0 0 30px color-mix(in oklab, var(--accent) 40%, transparent)'` | `sheets.jsx:122` |
| Album-art tile playing glow | `boxShadow: '0 0 16px rgba(176,128,255,0.35)'` | `sheets.jsx:348` |

**Accent reserved-for list (the 10% zone — Phase 178 surfaces):**

1. **StoveSheet hero gradient** — `linear-gradient(160deg, color-mix(in oklab, var(--accent) 25%, transparent) 0%, transparent 70%)` when `s.on === true`. When off, neutral `rgba(255,255,255,0.03)`.
2. **StoveSheet primary "Accendi stufa" button fill** — `background: var(--accent)`, `color: '#1a0f08'`, `boxShadow: '0 0 30px color-mix(in oklab, var(--accent) 40%, transparent)'`. Only when stove is OFF (and `needsCleaning === false`).
3. **`<Slider>` default fill color** — `color = 'var(--accent)'`. (`<Slider>` ships in this phase but is NOT consumed — SonosSheet uses a plain `<input type="range" accentColor: '#b080ff'>` per bundle. `<Slider>` is shipped for Phase 179 Rooms tab. See CONTEXT D-12.)
4. **`:focus-visible` outline on every interactive sheet sub-primitive button** — `outline: 2px solid var(--accent); outline-offset: 2px`. Applied via `[data-sheet-focusable="true"]:focus-visible` rule (mirrors Phase 175 `[data-pressable-focusable]` pattern). Sub-primitives that opt in: `<Stepper>` ± buttons, `<SheetBtn>`, `<QuickActionButton>`, `<RadialDial>` ± buttons, scene buttons, mode pills, zone chips, group-row play/pause buttons, master action buttons.

**Explicitly NOT accented in Phase 178:**
- Sheet container backdrop, container fill, header — Phase 175 carry-forward (no accent in Sheet primitive).
- ClimateSheet, LightsSheet, SonosSheet, PlugsSheet bodies — all device-class hex (`#5eafff`, `#f5c84a`, `#b080ff`, `#ffb84a`), zero accent.
- Stove "Spegni stufa" button — destructive red `#ff4d5c`, NOT accent.
- Sub-primitive idle backgrounds — all `rgba(255,255,255,0.05)` neutral, NOT accent.
- `<InlineToggle>` track on/off — color is the per-device tone (Phase 177 carry-forward), NOT accent.

**Documented AUDIT-EXCEPTIONS (DS-02 grep gate inheritance):**

The following hardcoded values appear in Phase 178 source files. They are lifted verbatim from `sheets.jsx` and are documented inline with `// AUDIT-EXCEPTION` comments next to each literal in the source. The Phase 174 grep gate (`grep -rEn '#[0-9a-fA-F]{3,8}\b\|blur\([0-9]+px\)' app/components/EmberGlass`) MUST tolerate these by tagging.

| File | Value | Bundle source | Why non-token |
|------|-------|---------------|---------------|
| `sheets/StoveSheet.tsx` | `rgba(255,255,255,0.03)` (hero off bg) | `sheets.jsx:76` | Hero-specific; not reused. |
| `sheets/StoveSheet.tsx` | `rgba(255,255,255,0.06)` (hero border) | `sheets.jsx:77` | Hero-specific; brighter than `--glass-border`. |
| `sheets/StoveSheet.tsx` | `rgba(255, 77, 92, 0.15)` / `rgba(255, 77, 92, 0.25)` / `#ff6676` | `sheets.jsx:119-123` | Stove-off destructive ember; NOT a token, bundle's only red. |
| `sheets/StoveSheet.tsx` | `#1a0f08` (primary button text on accent fill) | `sheets.jsx:120` | Bundle's near-black text on copper; NOT a token. |
| `sheets/ClimateSheet.tsx` | `#5eafff` and 4 derived rgba forms | `sheets.jsx:155-189` | Device-class identifier; bundle hex. Carried from Phase 177 ClimateCard tone. |
| `sheets/LightsSheet.tsx` | `#f5c84a` and 4 derived rgba forms | `sheets.jsx:280-289` | Device-class identifier; bundle hex. |
| `sheets/LightsSheet.tsx` | 4 scene gradient strings (`#ff8a5c, #b080ff` etc.) | `sheets.jsx:217-220` | Bundle's intentional non-token; scene gradients are the only place these hexes appear. |
| `sheets/SonosSheet.tsx` | `#b080ff`, `#5eafff`, `#fff`, `#1a0f08` | `sheets.jsx:340-394` | Sonos violet device-class + 100%-white play-active surface + Stove-style button text. |
| `sheets/PlugsSheet.tsx` | `#ffb84a` and 4 derived rgba forms | `sheets.jsx:419-460` | Device-class identifier; bundle hex. |
| `sheets/primitives/Stepper.tsx` | `rgba(255,255,255,0.1)` (button bg), `#fff` (icon color) | `sheets.jsx:488, 495` | Bundle-specific button surface; pure white icon color matches Sheet header AUDIT-EXCEPTION. |
| `sheets/primitives/SheetRow.tsx` | `rgba(255,255,255,0.06)` (border-bottom), `#fff` (label color) | `sheets.jsx:473, 477` | Inter-row divider; pure white label per Sheet header convention. |
| `sheets/primitives/SheetBtn.tsx` | `rgba(255,255,255,0.05)` (bg), `rgba(255,255,255,0.06)` (border), `#fff` (label) | `sheets.jsx:583-587` | Bundle's button surface inside sheets. |
| `sheets/primitives/RadialDial.tsx` | `rgba(255,255,255,0.08)` (track), `rgba(255,255,255,0.08)` (button bg), `#fff` (button icon + center value) | `sheets.jsx:549, 567-572` | Track stroke; button surface; pure white center value. |
| `sheets/primitives/QuickActionButton.tsx` | `rgba(245,200,74,0.18)` (active), `#f5c84a` (active text), `rgba(255,255,255,0.05)` (inactive), `rgba(245,200,74,0.3)` / `rgba(255,255,255,0.06)` (border), `#fff` (inactive text) | `sheets.jsx:299-306` | Bundle's `quickBtn` style helper, exported as a tiny presentational component. Lights-yellow exclusive. |
| `sheets/primitives/Slider.tsx` | (none — fill defaults to `var(--accent)`) | `sheets.jsx:502-513` | Token-driven; only the gradient shape is bundle-verbatim (`linear-gradient(to right, ...)`). |

All other visual values use Phase 174 tokens (`var(--accent)`, `var(--text-1)`, `var(--text-2)`, `var(--font-display)`, `var(--font-body)`).

---

## Component API + Variants

This is the **prescriptive contract** for sub-primitives consumed by every sheet body. Every prop, default, and behavior is non-negotiable.

### `<SheetRow>` (CONTEXT D-10)

```ts
// app/components/EmberGlass/sheets/primitives/SheetRow.tsx

export interface SheetRowProps {
  label: string;
  value?: string;       // optional 12px subtitle below the label
  children?: ReactNode; // optional right-side slot (toggle / stepper / value chip)
}

export function SheetRow(props: SheetRowProps): React.ReactElement;
```

**Visual contract (verbatim from `sheets.jsx:469-482`):**
- Outer: `marginTop: 18, padding: '14px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '0.5px solid rgba(255,255,255,0.06)', gap: 12`.
- Left column: `<div>` containing `label` (14px / 500 / `#fff`) + optional `value` (12px / `var(--text-2)` / `marginTop: 2`).
- Right slot: `children` rendered as-is.

**Used by:** StoveSheet (Livello fiamma row, Ventola row), ClimateSheet (Tipo row).

**Not used by:** LightsSheet, SonosSheet, PlugsSheet (those use list-container + custom rows directly).

**Test selector:** `data-testid="sheet-row"` on root, `data-testid="sheet-row-label"` on label, `data-testid="sheet-row-value"` on value (when present).

### `<Stepper>` (CONTEXT D-11)

```ts
// app/components/EmberGlass/sheets/primitives/Stepper.tsx

export interface StepperProps {
  value: number;
  min: number;
  max: number;
  onChange: (next: number) => void;  // emits a raw number; callers wrap to fit hook signatures
}

export function Stepper(props: StepperProps): React.ReactElement;
```

**Visual contract (verbatim from `sheets.jsx:484-500`):**
- Outer: `display: 'flex', alignItems: 'center', gap: 8`.
- Minus button: `width: 36, height: 36, borderRadius: 999, border: 'none', background: 'rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', data-sheet-focusable: 'true'`. Renders `<Minus size={14} strokeWidth={2.5}>` from `lucide-react`. `aria-label="Diminuisci"`. On click → `onChange(Math.max(min, value - 1))`.
- Display: `minWidth: 36, textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, color: '#fff'`.
- Plus button: same shape, renders `<Plus size={14} strokeWidth={2.5}>`. `aria-label="Aumenta"`. On click → `onChange(Math.min(max, value + 1))`.

**Stepper signature mismatch caveat (CONTEXT specifics):** Callers wrap `onChange` to fit the consuming hook signature. Example: `useStoveCommands.handlePowerChange` takes `{ target: { value: String(v) } }`, so StoveSheet does `onChange={(v) => handlePowerChange({ target: { value: String(v) } })}`. Document this in `Stepper.tsx` JSDoc so Phase 179 (Rooms tab) doesn't repeat the wrap mistake.

**No `<Pressable>` wrap** (CONTEXT D-24): `<Stepper>` buttons are bare `<button>`s with browser-native `:active` feedback. Press-anim is reserved for glass surfaces (Phase 175 SC-#1).

**Test selectors:** `data-testid="stepper"` on outer, `data-testid="stepper-minus"` on minus button, `data-testid="stepper-value"` on display, `data-testid="stepper-plus"` on plus button.

### `<Slider>` (CONTEXT D-12)

```ts
// app/components/EmberGlass/sheets/primitives/Slider.tsx

export interface SliderProps {
  value: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
  color?: string;  // CSS color (default 'var(--accent)')
}

export function Slider(props: SliderProps): React.ReactElement;
```

**Visual contract (verbatim from `sheets.jsx:502-513`):**
- Custom-styled `<input type="range">`.
- Width: `140px`, height: `6px`, `borderRadius: 999`, `outline: none`, `WebkitAppearance: 'none', appearance: 'none'`.
- Background: `linear-gradient(to right, ${color} 0%, ${color} ${pct*100}%, rgba(255,255,255,0.1) ${pct*100}%, rgba(255,255,255,0.1) 100%)` where `pct = (value - min) / (max - min)`.
- `onChange` adapter: `(e) => onChange(Number(e.target.value))`.

**Phase 178 consumption status:** **Slider is shipped but not used by any Phase 178 sheet body.** Per CONTEXT D-12, SonosSheet uses a plain `<input type="range" accentColor="#b080ff">` per bundle `sheets.jsx:374-380`. Slider is shipped now (~30 LOC) for Phase 179 Rooms tab consumption (lights brightness, etc.). Locked: ship.

**Test selector:** `data-testid="slider"`.

### `<RadialDial>` (CONTEXT D-13)

```ts
// app/components/EmberGlass/sheets/primitives/RadialDial.tsx

export interface RadialDialProps {
  value: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
  color: string;       // required — bundle hex per device class (#5eafff for thermostat)
  label: string;       // required — sublabel under center value
}

export function RadialDial(props: RadialDialProps): React.ReactElement;
```

**Visual contract (verbatim from `sheets.jsx:536-579`):**
- Outer container: `display: flex, flexDirection: column, alignItems: center, padding: '8px 0 16px', position: relative`.
- SVG: `width: 220, height: 220, transform: rotate(135deg)`. Two `<circle cx="110" cy="110" r="92" fill="none">`:
  - **Track:** `stroke="rgba(255,255,255,0.08)", strokeWidth=10, strokeLinecap="round", strokeDasharray="${circ * 0.75} ${circ}"` (270° arc; `circ = 2π · 92 ≈ 578`).
  - **Filled arc:** `stroke=${color}, strokeWidth=10, strokeLinecap="round", strokeDasharray="${circ * 0.75 * pct} ${circ}"` (`pct = (value - min) / (max - min)`); style `filter: drop-shadow(0 0 12px ${color}); transition: stroke-dasharray 0.3s`.
- Absolute-positioned center label container: `position: absolute, top: 0, bottom: 0, left: 0, right: 0, display: flex, flexDirection: column, alignItems: center, justifyContent: center`. Contains:
  - **Center value:** `<div style={{ fontFamily: 'var(--font-display)', fontSize: 68, fontWeight: 600, color: '#fff', lineHeight: 1, letterSpacing: -3 }}>{value}<span style={{ fontSize: 28, opacity: 0.5 }}>°</span></div>`.
  - **Sublabel:** `<div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>{label}</div>`.
- ± buttons row: `display: flex, gap: 12, marginTop: 14`. Each button `width: 44, height: 44, borderRadius: 999, border: 'none', background: 'rgba(255,255,255,0.08)', color: '#fff', cursor: 'pointer', data-sheet-focusable: 'true'`. Renders `<Minus size={18} strokeWidth={2.2}>` / `<Plus size={18} strokeWidth={2.2}>`. `aria-label`s: "Diminuisci temperatura", "Aumenta temperatura".

**No drag/touch on the arc** (CONTEXT D-13): only ± buttons drive `onChange`. Bundle does not implement arc drag; Phase 178 honors that.

**Test selectors:** `data-testid="radial-dial"`, `data-testid="radial-dial-value"`, `data-testid="radial-dial-label"`, `data-testid="radial-dial-minus"`, `data-testid="radial-dial-plus"`.

### `<SheetBtn>` (CONTEXT D-14)

```ts
// app/components/EmberGlass/sheets/primitives/SheetBtn.tsx

import { LucideIcon } from 'lucide-react';

export interface SheetBtnProps {
  Icon: LucideIcon;
  label: string;
  onClick?: () => void;
}

export function SheetBtn(props: SheetBtnProps): React.ReactElement;
```

**Visual contract (verbatim from `sheets.jsx:581-592`):**
- Outer: `<button>` with `padding: 16, borderRadius: 16, border: '0.5px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 10, color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer', data-sheet-focusable: 'true'`.
- Inner: `<Icon size={18} stroke="var(--text-2)">` followed by `{label}`.

**Used by:** StoveSheet (`<SheetBtn Icon={Calendar} label="Orari">`, `<SheetBtn Icon={AlertTriangle} label="Manutenzione">`) inside a 2-col `display: grid, gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 22` wrapper.

**Behavior** (CONTEXT specifics): "Orari" / "Manutenzione" buttons fire `onClose()` THEN `router.push('/stove/scheduler')` / `router.push('/stove/maintenance')`. Order matters — closing first lets the sheet exit animation complete (400ms cubic-bezier, Phase 175 D-08) before route change.

**Test selectors:** `data-testid="sheet-btn"`, `data-testid="sheet-btn-{label-slug}"` (e.g. `sheet-btn-orari`, `sheet-btn-manutenzione`).

### `<QuickActionButton>` (CONTEXT D-15)

```ts
// app/components/EmberGlass/sheets/primitives/QuickActionButton.tsx

export interface QuickActionButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
}

export function QuickActionButton(props: QuickActionButtonProps): React.ReactElement;
```

**Visual contract (verbatim from bundle `quickBtn` helper `sheets.jsx:299-306`):**
- Outer: `<button>` with `padding: '10px 14px', borderRadius: 12, border: '0.5px solid {borderColor}', background: {bgColor}, color: {textColor}, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', cursor: 'pointer', data-sheet-focusable: 'true'`.
- Color logic:
  - When `active === true`: `background: 'rgba(245,200,74,0.18)', color: '#f5c84a', borderColor: 'rgba(245,200,74,0.3)'`.
  - When `active === false`: `background: 'rgba(255,255,255,0.05)', color: '#fff', borderColor: 'rgba(255,255,255,0.06)'`.

**Used by:** LightsSheet ("Tutte on" — `active === (onCount === lights.length)`; "Tutte off" — `active === false`).

**Test selectors:** `data-testid="quick-action-button"`, `data-testid="quick-action-{label-slug}"` (e.g. `quick-action-tutte-on`, `quick-action-tutte-off`).

---

## Sheet Body Contracts (SHEET-02..06)

Five sheet bodies, one per requirement. Each is a body-only component with **no props** (CONTEXT D-04) — self-fetches via device data + command hooks. Each is a child of the Phase 175 `<Sheet>` primitive mounted by the corresponding Phase 177 dashboard card. The card-level edit is a single line: `<SheetPlaceholderBody phase="178" device="…" />` → `<*Sheet />`.

### `<StoveSheet>` (SHEET-02 — CONTEXT D-05)

**File:** `app/components/EmberGlass/sheets/StoveSheet.tsx`. `'use client'`.

**Data:** `useStoveData()` (existing) + `useStoveCommands()` (existing). Plan agent maps live field names against the hook implementation; UI-SPEC assumes:
- `s.on: boolean` (or `state` mapped to `'accesa' | 'spenta'`).
- `s.temp: number`.
- `s.target?: number` (may be absent — see Pellet pattern).
- `s.pelletPercent?: number`.
- `s.power: number` (1..5, the flame level).
- `s.fan: number` (1..5).
- `s.needsCleaning: boolean` (memory pattern).
- Commands: `handleIgnite`, `handleShutdown`, `handlePowerChange({ target: { value } })`, `handleFanChange({ target: { value } })`.

**Layout (top → bottom, all values bundle-verbatim from `sheets.jsx:69-129` minus the dropped setpoint slider):**

```
┌─ Hero (rounded 24, padding '24px 20px', conditional gradient bg, gap 20)
│  ┌─ <FlameViz on={isAccesa} intensity={powerLevel/5} />  (Phase 176 primitive)
│  └─ Status stack (flex 1, column)
│     ├─ "In funzione" / "Spenta" (12px caps, 1px tracking, var(--text-2))
│     ├─ {temp} (54px display 600 #fff, lineHeight 1, letterSpacing -2)
│     │       └ <span 22px opacity 0.5> °C </span>
│     └─ "Obiettivo {N}°C · Pellet {N}%" footnote (13px var(--text-2), marginTop 4)
│        — when target only: "Obiettivo {N}°C"
│        — when pelletPercent only: "Pellet {N}%"
│        — when neither: omit row entirely
│
│  Hero off-state bg: rgba(255,255,255,0.03)  AUDIT-EXCEPTION
│  Hero on-state bg: linear-gradient(160deg, color-mix(in oklab, var(--accent) 25%, transparent) 0%, transparent 70%)
│
├─ <SheetRow label="Livello fiamma" value={`${s.power}/5`}>
│  └─ <Stepper value={s.power} min={1} max={5}
│              onChange={(v) => handlePowerChange({ target: { value: String(v) } })} />
│
├─ <SheetRow label="Ventola" value={`${s.fan}/5`}>
│  └─ <Stepper value={s.fan} min={1} max={5}
│              onChange={(v) => handleFanChange({ target: { value: String(v) } })} />
│
├─ 2-col grid (gap 10, marginTop 22)
│  ├─ <SheetBtn Icon={Calendar} label="Orari"
│  │    onClick={() => { onClose(); router.push(STOVE_ROUTES.scheduler); }} />
│  └─ <SheetBtn Icon={AlertTriangle} label="Manutenzione"
│       onClick={() => { onClose(); router.push(STOVE_ROUTES.maintenance); }} />
│
└─ Primary action button (full width 100%, height 56, borderRadius 18, marginTop 18)
   ├─ When isAccesa:
   │   bg: 'rgba(255, 77, 92, 0.15)', color: '#ff6676',
   │   border: '0.5px solid rgba(255, 77, 92, 0.25)',
   │   fontSize 16 / 600 / Outfit + <Power size={18} strokeWidth={2.2}>
   │   label: "Spegni stufa"
   │   click: handleShutdown()
   │
   ├─ When NOT isAccesa AND NOT needsCleaning:
   │   bg: 'var(--accent)', color: '#1a0f08',
   │   boxShadow: '0 0 30px color-mix(in oklab, var(--accent) 40%, transparent)',
   │   border: 'none',
   │   label: "Accendi stufa", click: handleIgnite()
   │
   └─ When needsCleaning (locked maintenance state — disabled):
       Same shape as "Spegni stufa" red treatment;
       label: "Manutenzione richiesta",
       cursor: 'not-allowed', opacity: 0.6, click: no-op (button.disabled === true)
```

**`onClose` reference:** the Phase 177 `StoveCard.tsx` already owns the `setOpen(false)` callback and provides it via `onClose` to `<Sheet>`. StoveSheet body, being a body-only component (CONTEXT D-04), doesn't directly own `onClose`. **Resolution:** the SheetBtn's `onClick` for navigation needs `onClose`. **Lock:** StoveSheet receives `onClose` via `useContext`-style prop forwarding from the outer Sheet, OR the navigation buttons close-and-navigate via `router.push` alone (sheet auto-unmounts on route change because `StoveCard.tsx` is unmounted on navigation). **UI-SPEC default:** rely on `router.push` triggering auto-unmount; remove the explicit `onClose()` call. If page transitions don't unmount the card (e.g., shallow routing), the plan agent introduces a minimal prop-passing pattern. **Locked default:** `router.push` only.

**Italian copy (CONTEXT D-19, frozen):** `In funzione`, `Spenta`, `Obiettivo {N}°C · Pellet {N}%`, `Livello fiamma`, `Ventola`, `Orari`, `Manutenzione`, `Spegni stufa`, `Accendi stufa`, `Manutenzione richiesta`. Use middle-dot `·` (U+00B7).

**Test selectors:** `data-testid="stove-sheet"` (root), `stove-sheet-temp` (54px display), `stove-sheet-state` (12px caps), `stove-sheet-footnote` (13px footnote), `stove-sheet-power-stepper`, `stove-sheet-fan-stepper`, `sheet-btn-orari`, `sheet-btn-manutenzione`, `stove-sheet-primary-action`.

### `<ClimateSheet>` (SHEET-03 — CONTEXT D-06)

**File:** `app/components/EmberGlass/sheets/ClimateSheet.tsx`. `'use client'`.

**Data:** `useThermostatData()` (existing) + new `useThermostatCommands` (CONTEXT D-16). Hook merges `topology.rooms[]` + `status.rooms[]` + `mode` into a unified `zones[]: { id, name, current, target, on, kind }` (plan agent harvests merge logic from existing `ThermostatCard.tsx`).

**Local state:**
- `selectedRoomIdx: number` (default 0).
- `pendingTarget: number` (initialized from `zone.target`, written immediately on dial ± click).
- `useDebounce(pendingTarget, 500)` (CONTEXT specifics) — when debounced value changes, fire `setRoomSetpoint(zone.id, debouncedTarget)`.
- `pendingMode: HomeMode | null` (queued mode change; fired immediately on click via `setHomeMode`, no debounce — modes are discrete clicks).

**Layout (top → bottom, verbatim `sheets.jsx:131-196`):**

```
┌─ Zone selector chip row
│  display: flex, gap: 8, overflowX: auto, paddingBottom: 4,
│  margin: '0 -20px 18px', padding: '0 20px 4px'
│  (negative margin extends row to sheet edges; padding restores inset; bottom 18 separates from dial)
│
│  Per chip (one per zone):
│  ┌─ <button> with role="tab"
│  │  flexShrink: 0, padding '10px 14px', borderRadius 12, fontSize 13, fontWeight 600,
│  │  whiteSpace: nowrap, display flex, alignItems center, gap 6,
│  │  cursor pointer, data-sheet-focusable: true
│  │  ├─ Selected: bg 'rgba(94,175,255,0.18)', border '0.5px solid rgba(94,175,255,0.4)', color '#5eafff'
│  │  └─ Inactive: bg 'rgba(255,255,255,0.05)', border '0.5px solid rgba(255,255,255,0.06)', color 'var(--text-2)'
│  │
│  │  Inner: 6×6 dot
│  │   On:  bg '#5eafff', boxShadow '0 0 6px #5eafff'
│  │   Off: bg 'rgba(255,255,255,0.25)', no shadow
│  │  + zone.name
│  └─ onClick: setSelectedRoomIdx(i)
│
├─ <RadialDial value={pendingTarget} min={15} max={28} color="#5eafff"
│              label={`${zone.name} · attuale ${zone.current.toFixed(1)}°`}
│              onChange={(v) => setPendingTarget(v)} />
│
├─ <SheetRow
│    label="Tipo"
│    value={zone.kind === 'termostato' ? 'Termostato di stanza' : 'Termovalvola radiatore'}>
│  └─ <InlineToggle on={zone.on} color="#5eafff"
│                   onChange={(next) => setRoomMode(zone.id, next ? 'manual' : 'off')} />
│
├─ "Modalità globale" eyebrow (11px caps, 1 letter-spacing, marginTop 22, marginBottom 10, var(--text-2))
│
└─ Mode-pill grid: gridTemplateColumns 'repeat(4, 1fr)', gap 8
   Per pill:
   ┌─ <button data-sheet-focusable="true" role="radio">
   │  padding '14px 8px', borderRadius 14, fontSize 13, fontWeight 600
   │  ├─ Selected (mode === pillValue): bg 'rgba(94,175,255,0.2)',
   │  │   border '0.5px solid rgba(94,175,255,0.4)', color '#5eafff'
   │  └─ Inactive: bg 'rgba(255,255,255,0.05)',
   │      border '0.5px solid rgba(255,255,255,0.06)', color 'var(--text-2)'
   │  Label: 'Auto' | 'Manuale' | 'Eco' | 'Off'
   └─ onClick: setHomeMode(pillBackendValue)
       Where pillBackendValue mapping is:
       Auto → 'schedule'
       Manuale → 'manual'
       Eco → 'away'  (or 'eco' — plan agent confirms with Netatmo proxy schema)
       Off → 'hg'    (or 'off' — plan agent confirms)
```

**Italian copy (CONTEXT D-20, frozen):** `Modalità globale`, `Auto`, `Manuale`, `Eco`, `Off`, `Termostato di stanza`, `Termovalvola radiatore`, `{name} · attuale {N.N}°` (1-decimal precision for current temp).

**Test selectors:** `data-testid="climate-sheet"` (root), `climate-sheet-zone-chip-{i}` (per chip; selected via `aria-selected="true"`), `climate-sheet-radial`, `climate-sheet-radial-minus`, `climate-sheet-radial-plus`, `climate-sheet-tipo-toggle`, `climate-sheet-mode-{auto|manuale|eco|off}`.

### `<LightsSheet>` (SHEET-04 — CONTEXT D-07)

**File:** `app/components/EmberGlass/sheets/LightsSheet.tsx`. `'use client'`.

**Data:** `useLightsData()` (existing) + `useLightsCommands()` (existing).
- `lights[]: { name, room, on, groupId, …  }` — flat per-light list (plan agent verifies field names; bundle uses `light.room` for room grouping).
- `scenes[]: { id, name, …  }` — flat scene catalog (Hue) for `findSceneByName` lookup.
- `groups[]: { id, name, … }` — Hue groups; first group is the "primary group" used for scene activation (plan agent confirms).
- Commands: `handleAllLightsToggle(on: boolean)`, `handleSceneActivate(sceneId, groupId)`, `handleRoomToggle(groupId, on: boolean)`.

**Helper:** `findSceneByName(catalog, name): Scene | null` — case-insensitive match, first hit wins. Lives at `app/components/EmberGlass/sheets/lib/findSceneByName.ts`.

**Layout (top → bottom, verbatim `sheets.jsx:188-296`):**

```
┌─ Summary header (3-col grid '1fr auto auto', gap 10, marginBottom 18, alignItems center)
│  ├─ Count card
│  │  padding '14px 18px', borderRadius 16
│  │  bg: when onCount > 0 → 'rgba(245,200,74,0.1)', else 'rgba(255,255,255,0.04)'
│  │  border: when onCount > 0 → '0.5px solid rgba(245,200,74,0.25)',
│  │          else '0.5px solid rgba(255,255,255,0.06)'
│  │  ├─ "Accese" (11px caps, 0.8 letter-spacing, var(--text-2))
│  │  └─ {onCount} (24px display 600 #fff, marginTop 2, letterSpacing -0.5)
│  │      └ <span 14px var(--text-2) marginLeft 4>/ {lights.length}</span>
│  │
│  ├─ <QuickActionButton active={onCount === lights.length} label="Tutte on"
│  │                     onClick={() => handleAllLightsToggle(true)} />
│  │
│  └─ <QuickActionButton active={false} label="Tutte off"
│                        onClick={() => handleAllLightsToggle(false)} />
│
├─ "Scene" eyebrow (11px caps, 1 letter-spacing, var(--text-2), marginBottom 10)
│
├─ Scene grid (gridTemplateColumns 'repeat(2, 1fr)', gap 10)
│  Per scene (4 total — Rilassante, Concentrato, Cena, Notte):
│  ┌─ <button data-sheet-focusable="true">
│  │  padding 12, borderRadius 14, cursor pointer,
│  │  bg 'rgba(255,255,255,0.04)', border '0.5px solid rgba(255,255,255,0.06)',
│  │  display flex, alignItems center, gap 10, textAlign left
│  │  ├─ 28×28 album-tile, borderRadius 9, bg = scene.gradient
│  │  └─ Scene label (13px / 600 / #fff)
│  │  Disabled state (when findSceneByName(scenes, name) is null):
│  │    opacity 0.5, cursor 'not-allowed', title="Crea scena '{name}' su Hue"
│  │  Click (when found): handleSceneActivate(scene.id, primaryGroupId)
│  │  Click (when not found): no-op
│  └─ Italian labels: 'Rilassante' / 'Concentrato' / 'Cena' / 'Notte'
│
└─ Per-room sections (Object.entries(byRoom).map)
   Per room:
   ├─ "{ROOM_NAME}" eyebrow (11px caps, 1 letter-spacing, var(--text-2),
   │   marginTop 20, marginBottom 8, raw room name preserved — no transform)
   │
   └─ Room list container:
      bg 'rgba(255,255,255,0.04)', borderRadius 16,
      border '0.5px solid rgba(255,255,255,0.06)', overflow hidden
      Per row (light item):
      ├─ display flex, alignItems center, padding '12px 14px', gap 12
      ├─ borderBottom '0.5px solid rgba(255,255,255,0.06)' EXCEPT last row
      ├─ 32×32 bulb-tile, borderRadius 9, flexShrink 0
      │  ├─ On:  bg 'rgba(245,200,74,0.18)', border '0.5px solid rgba(245,200,74,0.3)',
      │  │       color '#f5c84a', boxShadow '0 0 12px rgba(245,200,74,0.25)'
      │  └─ Off: bg 'rgba(255,255,255,0.05)', border '0.5px solid rgba(255,255,255,0.06)',
      │          color 'rgba(255,255,255,0.3)', no shadow
      │  Inner: <Lightbulb size={15} strokeWidth={2}>
      ├─ Name (flex 1, fontSize 14, color #fff, fontWeight 500)
      └─ <InlineToggle on={l.on} color="#f5c84a"
                       onChange={(next) => handleRoomToggle(l.groupId, next)} />
```

**Italian copy (CONTEXT D-21, frozen):** `Accese`, `Tutte on`, `Tutte off`, `Scene`, `Rilassante`, `Concentrato`, `Cena`, `Notte`. Per-room section headers use the raw room name (no transformation). Tooltip on disabled scene buttons: `Crea scena '{name}' su Hue` (single-quoted scene name with U+0027).

**Test selectors:** `data-testid="lights-sheet"` (root), `lights-sheet-count` (24px display), `lights-sheet-tutte-on`, `lights-sheet-tutte-off`, `lights-sheet-scene-{rilassante|concentrato|cena|notte}` (with `data-disabled="true"` when scene not found in catalog), `lights-sheet-room-{room-slug}` (per room section), `lights-sheet-light-{light-name-slug}-toggle` (per light row toggle).

### `<SonosSheet>` (SHEET-05 — CONTEXT D-08)

**File:** `app/components/EmberGlass/sheets/SonosSheet.tsx`. `'use client'`.

**Data:** `useSonosFullData()` (existing) + `useSonosCommands()` (existing).
- `groups[]: { id, name, playing: boolean, track: string, artist: string, volume: number, coordinator: { uid: string } }` — plan agent confirms shape.
- Commands: `handlePlay(groupId)`, `handlePause(groupId)`, `handleSetVolume(speakerUid, volume)`.

**Local state:**
- `selectedIdx: number` (default 0).
- `pendingVolume: number` (initialized from `groups[selectedIdx].volume`).
- `useDebounce(pendingVolume, 250)` — when debounced value changes AND differs from current `groups[selectedIdx].volume`, fire `handleSetVolume(groups[selectedIdx].coordinator.uid, debouncedVolume)`.

**Layout (top → bottom, verbatim `sheets.jsx:308-398`):**

```
┌─ Group list container
│  bg 'rgba(255,255,255,0.04)', borderRadius 18,
│  border '0.5px solid rgba(255,255,255,0.06)', overflow hidden
│
│  Per group (g, i):
│  ├─ Row container <div onClick={() => setSelectedIdx(i)}>
│  │  display flex, alignItems center, padding '12px 14px', gap 12, cursor pointer,
│  │  borderBottom '0.5px solid rgba(255,255,255,0.06)' EXCEPT last,
│  │  bg: selectedIdx === i ? 'rgba(176,128,255,0.08)' : 'transparent'
│  │
│  ├─ 36×36 album-art tile, borderRadius 10, flexShrink 0
│  │  display flex, alignItems center, justifyContent center
│  │  ├─ Playing: bg 'linear-gradient(135deg, #b080ff 0%, #5eafff 100%)',
│  │  │           boxShadow '0 0 16px rgba(176,128,255,0.35)'
│  │  │           Inner: <PlayingBars />  (Phase 177 primitive)
│  │  └─ Not playing: bg 'rgba(255,255,255,0.06)', no shadow
│  │                   Inner: <Music size={14} stroke="rgba(255,255,255,0.35)">
│  │
│  ├─ Stack (flex 1, minWidth 0)
│  │  ├─ Name (14px / 600 / #fff)
│  │  └─ Track line (11px / var(--text-2) / marginTop 1,
│  │     whiteSpace nowrap, overflow hidden, textOverflow ellipsis)
│  │     Playing: `${g.track} · ${g.artist}`
│  │     Not playing: `Non in riproduzione`
│  │
│  └─ Play/pause button (34×34, borderRadius 999, border none, flexShrink 0,
│      cursor pointer, data-sheet-focusable: true)
│     Click: stopPropagation + setSelectedIdx(i) + (g.playing ? handlePause : handlePlay)(g.id)
│     ├─ Playing: bg '#fff', color '#1a0f08'
│     │           Inner: <Pause size={14} strokeWidth={2.4}>
│     └─ Not playing: bg 'rgba(255,255,255,0.08)', color '#fff'
│                      Inner: <Play size={14} strokeWidth={2.4}>
│
├─ "Volume · {selected.name}" eyebrow
│  (11px caps, 1 letter-spacing, var(--text-2), marginTop 20, marginBottom 10)
│
├─ Volume strip (display flex, alignItems center, gap 12)
│  ├─ <Volume2 size={16} stroke="rgba(255,255,255,0.5)" strokeWidth={2}>
│  ├─ <input type="range" min=0 max=100 value={pendingVolume}
│  │         onChange={(e) => setPendingVolume(Number(e.target.value))}
│  │         style={{ flex: 1, accentColor: '#b080ff' }} />
│  └─ Volume readout (13px / 600 / #fff / minWidth 32 /
│      textAlign right / fontVariantNumeric tabular-nums)
│     {pendingVolume}
│
└─ Master action button (full width 100%, height 52, borderRadius 16,
                        marginTop 22, fontFamily Outfit, fontSize 15, fontWeight 600,
                        bg 'rgba(176,128,255,0.15)', color '#b080ff',
                        border '0.5px solid rgba(176,128,255,0.3)',
                        display flex, alignItems center, justifyContent center, gap 10,
                        cursor pointer, data-sheet-focusable: true)
   Inner: <Power size={16} strokeWidth={2.2}> + label
   Label: groups.some(g => g.playing) ? 'Pausa ovunque' : 'Riproduci ovunque'
   Click: iterate groups[] with Promise.allSettled — if anyPlaying then pause-all,
          else play-all (one fire per group, partial failures show in NavbarConnectionStatus)
```

**Italian copy (CONTEXT D-22, frozen):** `Volume · {name}`, `Non in riproduzione`, `Pausa ovunque` (when any playing), `Riproduci ovunque` (else). Track line: `{track} · {artist}` (middle-dot separator).

**Test selectors:** `data-testid="sonos-sheet"` (root), `sonos-sheet-group-{i}` (per row, with `aria-selected="true"` when `selectedIdx === i`), `sonos-sheet-group-{i}-play-pause`, `sonos-sheet-volume-slider`, `sonos-sheet-volume-readout`, `sonos-sheet-master-action`.

### `<PlugsSheet>` (SHEET-06 — CONTEXT D-09)

**File:** `app/components/EmberGlass/sheets/PlugsSheet.tsx`. `'use client'`.

**Data:** `useTuyaData()` (existing) + `useTuyaCommands()` (existing).
- `plugs[]: { id, name, room, on: boolean, power: number }`.
- Commands: `togglePlug(deviceId, currentState)`.

**Layout (top → bottom, verbatim `sheets.jsx:401-465`):**

```
┌─ Summary 2-col grid (gap 10, marginBottom 18)
│  ├─ Left card (Accese)
│  │  padding '16px 18px', borderRadius 18,
│  │  bg 'rgba(255,184,74,0.08)', border '0.5px solid rgba(255,184,74,0.2)'
│  │  ├─ "Accese" (11px caps, 0.8 letter-spacing, var(--text-2))
│  │  └─ {onCount} (28px display 600 #fff, marginTop 4, letterSpacing -0.5)
│  │      └ <span 14px var(--text-2) marginLeft 4>/ {plugs.length}</span>
│  │
│  └─ Right card (Consumo)
│     padding '16px 18px', borderRadius 18,
│     bg 'rgba(255,255,255,0.04)', border '0.5px solid rgba(255,255,255,0.06)'
│     ├─ "Consumo" (11px caps, 0.8 letter-spacing, var(--text-2))
│     └─ {totalPower display} (28px display 600 #fff, marginTop 4, letterSpacing -0.5,
│         fontVariantNumeric tabular-nums)
│         When totalPower >= 1000: `(totalPower / 1000).toFixed(2)` + suffix `kW`
│         Else: `totalPower` + suffix `W`
│         Suffix: <span 14px var(--text-2) marginLeft 4>{kW|W}</span>
│
└─ Plug list container
   bg 'rgba(255,255,255,0.04)', borderRadius 18,
   border '0.5px solid rgba(255,255,255,0.06)', overflow hidden

   Per plug (p, i):
   ├─ Row: display flex, alignItems center, padding '14px 16px', gap 12,
   │       borderBottom '0.5px solid rgba(255,255,255,0.06)' EXCEPT last
   │
   ├─ 36×36 plug-tile, borderRadius 10, flexShrink 0,
   │  display flex, alignItems center, justifyContent center
   │  ├─ On:  bg 'rgba(255,184,74,0.18)', border '0.5px solid rgba(255,184,74,0.3)',
   │  │       color '#ffb84a'
   │  └─ Off: bg 'rgba(255,255,255,0.05)', border '0.5px solid rgba(255,255,255,0.06)',
   │          color 'rgba(255,255,255,0.3)'
   │  Inner: <Plug size={16} strokeWidth={2}>
   │
   ├─ Stack (flex 1, minWidth 0)
   │  ├─ Name (14px / 500 / #fff)
   │  └─ Subtitle (11px / var(--text-2) / marginTop 2)
   │     `{p.room}{p.on && p.power > 0 ? ` · ${p.power >= 1000 ? `${(p.power/1000).toFixed(1)}kW` : `${p.power}W`}` : ''}`
   │
   └─ <InlineToggle on={p.on} color="#ffb84a"
                    onChange={() => togglePlug(p.id, p.on)} />
```

**Italian copy (CONTEXT D-23, frozen):** `Accese`, `Consumo`. Power format: `≥1000W → "X.YkW"`, else `"NW"`. No unit suffix on the value itself; the unit lives in the suffix `<span>` (matches bundle).

**Test selectors:** `data-testid="plugs-sheet"` (root), `plugs-sheet-count`, `plugs-sheet-consumption`, `plugs-sheet-plug-{plug-name-slug}`, `plugs-sheet-plug-{plug-name-slug}-toggle`.

---

## State Contracts (loading / empty / error / refreshing)

| State | All Sheets | Visual contract |
|-------|------------|-----------------|
| **Loading (initial — `loading === true && data === null`)** | Per CONTEXT D-26 | Sheet body renders ONE full-width skeleton block (`bg-white/5 animate-pulse`, `borderRadius: var(--r-card)`, height ~360px StoveSheet / ~480px ClimateSheet / ~520px LightsSheet+SonosSheet+PlugsSheet — sized to roughly match the final layout). No per-row skeletons. Sheet open animation completes (Phase 175 400ms cubic-bezier) BEFORE the skeleton appears (the skeleton's CSS animation does not interfere — the sheet body simply renders the skeleton inside the already-visible Sheet container). |
| **Empty (data loaded, list empty)** | LightsSheet | Body still renders summary header + scene strip + 0 room sections. Count card shows `0/0` and uses the inactive (non-yellow) tint. |
| **Empty** | SonosSheet | Group list container renders but has 0 rows. Volume strip is hidden when `groups.length === 0`. Master button label: "Riproduci ovunque" (no groups playing). |
| **Empty** | PlugsSheet | Both summary cards render `0/0` and `0W`. Plug list container has 0 rows but renders an empty rounded container (consistent with other sheets when list is empty). |
| **Empty** | StoveSheet | Hero shows `Spenta` state with `s.temp` value (the hook always provides one); steppers are disabled when `s.power` / `s.fan` are missing — render `0/5` with both ± buttons disabled (`opacity: 0.5, cursor: not-allowed`). |
| **Empty** | ClimateSheet | When `zones.length === 0`, render a single centered 14px `var(--text-2)` row: `Nessuna zona configurata` (frozen Italian copy). RadialDial, SheetRow, mode pills all hidden. |
| **Error (no cached data, hook returned error)** | All sheets | Per CONTEXT D-27. Body renders centered stack: 32×32 lucide `<TriangleAlert>` icon + 14px `var(--text-1)` `Non raggiungibile. Riprova più tardi.` + 8px-margin secondary 12px `var(--text-2)` `{error.message}` (only when `error instanceof Error` per memory pattern). No retry button — closing and reopening the sheet retries naturally. |
| **Refreshing (background fetch with cached data)** | All sheets | Per CONTEXT specifics. NO visual change. Spinners are forbidden inside sheet bodies (Phase 177 D-27 carry-forward). Global indicator handled by `NavbarConnectionStatus` (Phase 17.0). |
| **Optimistic toggles + steppers** | All sheets | Per CONTEXT D-28. `<InlineToggle>` flips immediately; underlying command runs; if it fails, the toggle reverts on the next data tick. No explicit per-toggle pending state. Phase 7.0 retry infrastructure handles transient failures. |

---

## Interaction Contract

### Mounting + Sheet wiring

```tsx
// In Phase 177 StoveCard.tsx (existing — single line edit per CONTEXT D-35):
const [open, setOpen] = useState(false);
return (
  <>
    <GlassCard tone="var(--accent)" onOpen={() => setOpen(true)} data-testid="stove-card">
      ...
    </GlassCard>
    <Sheet open={open} onClose={() => setOpen(false)} title="Stufa">
-     <SheetPlaceholderBody phase="178" device="stove" />
+     <StoveSheet />
    </Sheet>
  </>
);
```

- **One single-line edit per affected card (5 cards: Stove, Climate, Lights, Sonos, Tuya).** No other changes to card files.
- DirigeraCard, CameraCard, NetworkCard: UNCHANGED (out of scope).
- WeatherCard, RaspiCard: UNCHANGED (no Sheet, Phase 177 D-11).

### Press behavior on sub-primitive buttons

Per CONTEXT D-24: sub-primitives (`<Stepper>` ± buttons, `<RadialDial>` ± buttons, `<SheetBtn>`, `<QuickActionButton>`, scene buttons, mode pills, zone chips, group play/pause buttons, master action buttons) are **bare `<button>`s** with browser-native `:active` feedback. They do NOT wrap in `<Pressable>`. Press feedback inside a sheet is the regular `:active` browser behavior; bundle does not animate them.

### Focus-visible outlines

Sub-primitive buttons opt-in via the `data-sheet-focusable="true"` attribute. The CSS rule lives in `app/globals.css` (Phase 175 already shipped the `[data-pressable-focusable]:focus-visible` rule; Phase 178 adds a sibling rule for `[data-sheet-focusable]`):

```css
[data-sheet-focusable="true"]:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
```

**Locked: ship the rule in Phase 178 globals.css append (~3 LOC).** This is the ONLY globals.css edit Phase 178 makes — no new tokens, no new utilities.

### Debounce timings (CONTEXT specifics)

| Surface | Debounce | Why |
|---------|----------|-----|
| ClimateSheet RadialDial setpoint write | 500ms | Matches existing ThermostatCard pattern; user can tap ± multiple times rapidly before commit |
| SonosSheet volume slider write | 250ms | v16.0 memory pattern; volume slider drags continuously; 250ms keeps UI responsive |
| LightsSheet/PlugsSheet `<InlineToggle>` writes | NONE | Discrete clicks; optimistic UI from Phase 7.0 retry infrastructure |
| StoveSheet Stepper writes | NONE | Discrete clicks; `useStoveCommands` already handles retry |
| ClimateSheet zone-chip click | NONE | Local state only (selectedRoomIdx); no command fired |
| ClimateSheet mode-pill click | NONE | Discrete click; immediate `setHomeMode` write |
| LightsSheet "Tutte on/off" | NONE | Discrete click; immediate `handleAllLightsToggle` write |
| LightsSheet scene-button click | NONE | Discrete click; immediate `handleSceneActivate` write (or no-op when scene not found) |
| SonosSheet group play/pause | NONE | Discrete click; immediate `handlePlay`/`handlePause` write |
| SonosSheet master action | NONE | Iterates groups via `Promise.allSettled` |

### Sheet exit animation timing

When a SheetBtn navigation fires (Stove "Orari" / "Manutenzione"), the order is:
1. `router.push('/stove/scheduler' | '/stove/maintenance')` fires.
2. Next.js client routing unmounts the dashboard and the StoveCard, which unmounts the Sheet.
3. The Sheet's `forceMount` outro animation does NOT play because the unmount is hard (component disappears). This is acceptable — the user is leaving the dashboard context, not closing back to it.

Locked: do NOT call `onClose()` before `router.push` (CONTEXT specifics suggest closing first, but the StoveSheet body component does not own `onClose`; passing it through would require prop-passing the body-only component, breaking CONTEXT D-04). The accepted UX cost is: navigation-on-Sheet-open shows a hard cut, not a soft fade. If a future a11y phase wants a smooth fade, it can add a `useTransition` wrapper.

### React Compiler discipline (CONTEXT D-33, D-34)

- **No `useMemo` or `useCallback`** introduced in any Phase 178 file. Pure-function components only.
- Inline event handler closures (`onChange={(v) => setPendingTarget(v)}`) are explicitly allowed.
- Plan must include `npx react-compiler-healthcheck` in `<verify><automated>` (mirror Phase 177 D-28).

### Reduced-motion fallback

**Out of scope for Phase 178 (per CONTEXT D-15 carry-forward and Phase 175 D-15 lockdown).** Sheet open/close transition (400ms cubic-bezier) is NOT collapsed under `prefers-reduced-motion: reduce`. RadialDial arc transition (`stroke-dasharray .3s`) is also NOT collapsed. The `.press-anim` reduced-motion override from Phase 175 inherits but does not affect sheet sub-primitives (which don't use `.press-anim`).

---

## Layout Contract

### Outer Sheet primitive (Phase 175 — UNCHANGED in Phase 178)

- `position: fixed, left: 8, right: 8, bottom: 8, zIndex: 201`.
- `borderRadius: 32, padding: '10px 20px 30px', maxHeight: '85%', overflowY: 'auto'`.
- Translates from `translateY(110%)` to `translateY(0)` over 400ms cubic-bezier(.22,1,.36,1).
- Backdrop `position: fixed, inset 0, zIndex: 200, blur(8px)`.

**No size variants.** All 5 sheet bodies render at the same outer dimensions.

### Sheet body sizing (per body)

The Sheet primitive caps body at 85% viewport height with internal `overflowY: auto`. Each sheet body's expected rendered height at 375px viewport:

| Sheet | Expected min height | Notes |
|-------|---------------------|-------|
| StoveSheet | ~360px | Hero (~120px) + 2 SheetRows (~140px) + button grid (~100px) + primary action (56px) |
| ClimateSheet | ~520px (tallest) | Zone chips (~50px) + RadialDial (220+44+30=294px) + SheetRow (60px) + Modalità label + 4-pill grid (~80px) — well under 85% × 812 = 690px iPhone 13 |
| LightsSheet | scrolls | Summary (~80px) + Scene grid (~120px) + per-room sections (variable) — overflowY scrolls |
| SonosSheet | ~480px | Group list (variable, ~50px per row) + Volume strip (~60px) + master button (52px) |
| PlugsSheet | scrolls | Summary (~110px) + Plug list (variable, ~64px per row) — overflowY scrolls |

**Critical:** ClimateSheet at 375px × 812px iPhone 13 viewport renders in 520px, well under the 690px `maxHeight: 85%` cap. No layout overflow expected.

### Sheet body internal grid

Each sheet body renders as a vertical stack inside the Sheet container's `padding: '10px 20px 30px'`. The `padding: 10px top` is consumed by the Phase 175 grabber + (optional) title row. Each Phase 178 body's first child sits below that — typically with `marginTop: 0` for hero blocks (StoveSheet) or `0` for zone chips (ClimateSheet, which has its own `margin: '0 -20px 18px'` to break the sheet padding).

### Responsive behavior

**Zero new breakpoints in Phase 178.** All 5 bodies render identically at 375px and 1024px (Phase 175 Sheet primitive carries this — `bottom: 8, left: 8, right: 8` at every viewport).

At 1024px: each sheet's content stretches to fill the wider container (1024 - 16 = 1008px). The internal grids (zone chips horizontal scroll, mode-pill 4-col grid, summary 3-col grid, scene 2-col grid, list rows full-width) all flex correctly.

**Verification (Playwright per CONTEXT D-30):**
- Each new describe block tests at the default Playwright viewport (1280×720) — sufficient to validate functional wiring. Mobile-only visual specs are deferred to a future visual regression phase.

---

## Copywriting Contract

All copy is **Italian** (project locale per `<html lang="it">`). Italian copy strings are FROZEN per CONTEXT D-18..D-23. Use middle-dot `·` (U+00B7) per the bundle convention.

### Sheet titles (CONTEXT D-18, set by the calling Phase 177 card — UI-SPEC documents for completeness)

| Card | Sheet title (passed via `<Sheet title="...">`) |
|------|------------------------------------------------|
| StoveCard | `Stufa` |
| ClimateCard | `Clima` |
| LightsCard | `Luci` |
| SonosCard | `Sonos` |
| TuyaCard | `Prese smart` |
| CameraCard | `Camera` (UNCHANGED — placeholder body) |
| NetworkCard | `Rete` (UNCHANGED — placeholder body) |
| DirigeraCard | `IKEA` (UNCHANGED — placeholder body) |

### StoveSheet (CONTEXT D-19)

| Element | Copy (IT) |
|---------|-----------|
| Hero state caps (on) | `In funzione` |
| Hero state caps (off) | `Spenta` |
| Hero footnote (both available) | `Obiettivo {N}°C · Pellet {N}%` |
| Hero footnote (target only) | `Obiettivo {N}°C` |
| Hero footnote (pellet only) | `Pellet {N}%` |
| Row 1 label | `Livello fiamma` |
| Row 1 value | `{N}/5` |
| Row 2 label | `Ventola` |
| Row 2 value | `{N}/5` |
| Sheet button 1 | `Orari` |
| Sheet button 2 | `Manutenzione` |
| Primary action (off → on) | `Accendi stufa` |
| Primary action (on → off) | `Spegni stufa` |
| Primary action (disabled) | `Manutenzione richiesta` |

### ClimateSheet (CONTEXT D-20)

| Element | Copy (IT) |
|---------|-----------|
| RadialDial sublabel | `{name} · attuale {N.N}°` (1-decimal precision) |
| Tipo row label | `Tipo` |
| Tipo row value (kind === 'termostato') | `Termostato di stanza` |
| Tipo row value (else) | `Termovalvola radiatore` |
| Modalità eyebrow | `Modalità globale` |
| Mode pills | `Auto` / `Manuale` / `Eco` / `Off` |
| Empty state | `Nessuna zona configurata` |

### LightsSheet (CONTEXT D-21)

| Element | Copy (IT) |
|---------|-----------|
| Count card eyebrow | `Accese` |
| Count card value | `{onCount}/ {total}` (with space before slash via `<span>` separator) |
| Quick action 1 | `Tutte on` |
| Quick action 2 | `Tutte off` |
| Scene eyebrow | `Scene` |
| Scene 1 | `Rilassante` |
| Scene 2 | `Concentrato` |
| Scene 3 | `Cena` |
| Scene 4 | `Notte` |
| Per-room section header | `{room}` (raw, no transformation) |
| Disabled scene tooltip | `Crea scena '{name}' su Hue` |

### SonosSheet (CONTEXT D-22)

| Element | Copy (IT) |
|---------|-----------|
| Group row playing line | `{track} · {artist}` |
| Group row idle line | `Non in riproduzione` |
| Volume eyebrow | `Volume · {selected.name}` |
| Master action (any playing) | `Pausa ovunque` |
| Master action (else) | `Riproduci ovunque` |

### PlugsSheet (CONTEXT D-23)

| Element | Copy (IT) |
|---------|-----------|
| Count card eyebrow | `Accese` |
| Count card value | `{onCount}/ {total}` |
| Consumption card eyebrow | `Consumo` |
| Consumption card value (≥1000W) | `{(power/1000).toFixed(2)}` + `kW` suffix |
| Consumption card value (<1000W) | `{power}` + `W` suffix |
| Plug subtitle (off or zero power) | `{room}` |
| Plug subtitle (on, power > 0) | `{room} · {(power/1000).toFixed(1)}kW` (≥1000) or `{room} · {power}W` |

### Cross-sheet (CONTEXT D-26, D-27)

| Element | Copy (IT) |
|---------|-----------|
| Loading state | (no text — single skeleton block) |
| Error primary | `Non raggiungibile. Riprova più tardi.` |
| Error secondary (when `error instanceof Error`) | `{error.message}` (passed through verbatim) |
| Refreshing state | (no text — silent) |

### Phase-level copy contract (template fields)

| Element | Resolution |
|---------|------------|
| Primary CTA | StoveSheet primary action button: `Accendi stufa` (off → on) / `Spegni stufa` (on → off). All other sheets have no single primary CTA — they expose multiple controls (steppers, toggles, sliders, scene grid). |
| Empty state | LightsSheet/PlugsSheet/SonosSheet: 0-row list rendered as empty rounded container (no explicit empty copy). ClimateSheet: `Nessuna zona configurata` (centered 14px `var(--text-2)`). StoveSheet: never empty (always shows at least state + temp). |
| Error state | All sheets: `Non raggiungibile. Riprova più tardi.` + `{error.message}`. No retry button. |
| Destructive confirmation | StoveSheet "Spegni stufa": **NO confirmation modal in Phase 178** — bundle does not implement one, and Phase 175 D-14 locked tap-to-dismiss only for sheet primitives. The red treatment + Power icon is the visual confirmation that this is the destructive variant. A future a11y/safety phase may add a long-press or two-tap confirmation. |

**Copy invariants:**
- All UI copy in Italian (project standard).
- Test/error/console output in English (developer-facing).
- No emoji in production UI copy.
- Use middle-dot `·` (U+00B7) per bundle.

---

## Component Inventory (deliverables this phase)

### New components

| File | Path | New/Edit | LOC budget | Visual contract |
|------|------|----------|------------|-----------------|
| `<StoveSheet>` | `app/components/EmberGlass/sheets/StoveSheet.tsx` | new | ~140 | Hero + 2 SheetRows + 2-col SheetBtn grid + primary action; setpoint slider DROPPED |
| `<ClimateSheet>` | `app/components/EmberGlass/sheets/ClimateSheet.tsx` | new | ~180 | Zone chips + RadialDial + Tipo SheetRow + Modalità mode-pill grid; uses new `useThermostatCommands` |
| `<LightsSheet>` | `app/components/EmberGlass/sheets/LightsSheet.tsx` | new | ~200 | Summary header + Scene grid + per-room sections; uses `findSceneByName` helper |
| `<SonosSheet>` | `app/components/EmberGlass/sheets/SonosSheet.tsx` | new | ~180 | Group list + volume strip + master action; `Promise.allSettled` for master action |
| `<PlugsSheet>` | `app/components/EmberGlass/sheets/PlugsSheet.tsx` | new | ~140 | Summary 2-col cards + plug list; Tuya only |
| `<SheetRow>` | `app/components/EmberGlass/sheets/primitives/SheetRow.tsx` | new | ~30 | label + value + right-slot child |
| `<Stepper>` | `app/components/EmberGlass/sheets/primitives/Stepper.tsx` | new | ~40 | 36×36 ± + 18px display; emits raw number |
| `<Slider>` | `app/components/EmberGlass/sheets/primitives/Slider.tsx` | new | ~30 | 140×6 custom range with two-stop gradient; UNUSED in Phase 178 (ships for Phase 179) |
| `<RadialDial>` | `app/components/EmberGlass/sheets/primitives/RadialDial.tsx` | new | ~80 | 220×220 SVG arc + center label + 44×44 ± buttons |
| `<SheetBtn>` | `app/components/EmberGlass/sheets/primitives/SheetBtn.tsx` | new | ~25 | Icon + label flat button |
| `<QuickActionButton>` | `app/components/EmberGlass/sheets/primitives/QuickActionButton.tsx` | new | ~25 | Yellow-active pill button |
| `findSceneByName` | `app/components/EmberGlass/sheets/lib/findSceneByName.ts` | new | ~15 | Case-insensitive scene name match in catalog |
| `useThermostatCommands` | `app/components/devices/thermostat/hooks/useThermostatCommands.ts` | new | ~80 | Wraps `setroomthermpoint` + `setthermmode` via `useRetryableCommand` |
| Sheets barrel | `app/components/EmberGlass/sheets/index.ts` | new | ~15 | Exports 5 bodies + 6 primitives + helper |
| EmberGlass barrel | `app/components/EmberGlass/index.ts` | edit (append) | ~13 | Re-export sheets barrel for Phase 179-181 consumption |
| globals.css append | `app/globals.css` | edit (append) | ~3 | `[data-sheet-focusable="true"]:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }` |

### Per-card edits (single-line each — CONTEXT D-35)

| Card | File | Change |
|------|------|--------|
| StoveCard | `app/components/EmberGlass/cards/StoveCard.tsx` | `<SheetPlaceholderBody phase="178" device="stove" />` → `<StoveSheet />` |
| ClimateCard | `app/components/EmberGlass/cards/ClimateCard.tsx` | `<SheetPlaceholderBody … />` → `<ClimateSheet />` |
| LightsCard | `app/components/EmberGlass/cards/LightsCard.tsx` | `<SheetPlaceholderBody … />` → `<LightsSheet />` |
| SonosCard | `app/components/EmberGlass/cards/SonosCard.tsx` | `<SheetPlaceholderBody … />` → `<SonosSheet />` |
| TuyaCard | `app/components/EmberGlass/cards/TuyaCard.tsx` | `<SheetPlaceholderBody … />` → `<PlugsSheet />` |
| DirigeraCard | UNCHANGED | placeholder stays — out of scope |
| CameraCard | UNCHANGED | placeholder stays — out of scope |
| NetworkCard | UNCHANGED | placeholder stays — out of scope |
| WeatherCard / RaspiCard | UNCHANGED | no Sheet — Phase 177 D-11 |

### New tests

| File | Path | New | LOC budget | Coverage |
|------|------|-----|------------|----------|
| StoveSheet jest | `app/components/EmberGlass/sheets/__tests__/StoveSheet.test.tsx` | new | ~150 | On/off/needsCleaning state rendering; Stepper +1 fires `handlePowerChange`; SheetBtn navigation; primary action fires `handleIgnite`/`handleShutdown` |
| ClimateSheet jest | `app/components/EmberGlass/sheets/__tests__/ClimateSheet.test.tsx` | new | ~180 | Zone chip selection updates RadialDial; debounced setpoint write fires `setRoomSetpoint`; mode-pill click fires `setHomeMode`; Tipo toggle fires `setRoomMode`; empty state renders |
| LightsSheet jest | `app/components/EmberGlass/sheets/__tests__/LightsSheet.test.tsx` | new | ~180 | Count card reflects onCount; "Tutte on/off" fires `handleAllLightsToggle`; scene-button click fires `handleSceneActivate`; disabled scene state when not in catalog; per-room InlineToggle fires `handleRoomToggle` |
| SonosSheet jest | `app/components/EmberGlass/sheets/__tests__/SonosSheet.test.tsx` | new | ~180 | Group selection state; play/pause buttons fire `handlePlay`/`handlePause` with `stopPropagation`; debounced volume fires `handleSetVolume`; master action iterates with `Promise.allSettled` |
| PlugsSheet jest | `app/components/EmberGlass/sheets/__tests__/PlugsSheet.test.tsx` | new | ~120 | Summary cards reflect counts + total power format; per-plug toggle fires `togglePlug`; kW/W formatting at 999/1000/1500 boundaries |
| SheetRow jest | `app/components/EmberGlass/sheets/primitives/__tests__/SheetRow.test.tsx` | new | ~50 | Label + value + right-slot rendering; missing value omits subtitle |
| Stepper jest | `app/components/EmberGlass/sheets/primitives/__tests__/Stepper.test.tsx` | new | ~80 | ± clicks emit clamped values; min/max boundaries |
| Slider jest | `app/components/EmberGlass/sheets/primitives/__tests__/Slider.test.tsx` | new | ~50 | Range input change fires onChange; default color is var(--accent) |
| RadialDial jest | `app/components/EmberGlass/sheets/primitives/__tests__/RadialDial.test.tsx` | new | ~80 | ± clicks emit clamped values; SVG arc dasharray reflects pct; center value + label render |
| SheetBtn jest | `app/components/EmberGlass/sheets/primitives/__tests__/SheetBtn.test.tsx` | new | ~50 | Icon + label render; click fires onClick |
| QuickActionButton jest | `app/components/EmberGlass/sheets/primitives/__tests__/QuickActionButton.test.tsx` | new | ~50 | Active state colors yellow; inactive state colors white; click fires onClick |
| findSceneByName jest | `app/components/EmberGlass/sheets/lib/__tests__/findSceneByName.test.ts` | new | ~30 | Case-insensitive match; first hit wins; null on miss |
| useThermostatCommands jest | `app/components/devices/thermostat/hooks/__tests__/useThermostatCommands.test.ts` | new | ~120 | `setRoomSetpoint` POSTs correct body; `setHomeMode` POSTs correct body; `setRoomMode` composition; useRetryableCommand integration |
| Playwright extension | `tests/playwright/dashboard-glass-cards.spec.ts` | edit (append 5 describe blocks) | ~250 | One describe per sheet (SHEET-02..06): open via card tap; assert mock route hit on key control; assert zero console errors via `collectConsoleErrors` |

**Total LOC budget:** ~1,330 production + ~1,520 test = **~2,850 LOC across 33 files** (28 new, 5 edits).

### Components NOT shipped (deferred per CONTEXT)

- `<BigSlider>` primitive — Phase 179 Rooms tab.
- `<CameraSheet>` body — pending CameraSheet requirement (no SHEET-* in v20.0).
- `<NetworkSheet>` body — pending NetworkSheet requirement (no SHEET-* in v20.0).
- `<DirigeraSheet>` body — pending Dirigera command proxy (no write API today).
- StoveSheet "Temperatura obiettivo" slider — pending Thermorossi setpoint endpoint OR Netatmo room-setpoint coupling.
- `<SheetPlaceholderBody>` deletion — cleanup phase fires once Camera/Network/Dirigera ship.
- Drag/touch on RadialDial arc — polish phase.
- Long-press / swipe-to-dismiss on Sheet — Phase 175 D-14 lockdown.
- Reduced-motion overrides for sheet/dial transitions — future a11y phase.
- Web Vitals telemetry on sheet open/close — out of v20.0 scope.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none — project does not use shadcn (verified 2026-04-29: no `components.json`) | not applicable |
| third-party | none | not applicable |

**Notes:**
- Project does not have `components.json`. Per CONTEXT.md and Phase 174/175/176/177 UI-SPEC precedent, primitives are built with CVA + Radix on demand. Auto-mode skips the shadcn initialization gate.
- Phase 178 introduces NO new third-party packages. All listed dependencies (`@radix-ui/react-dialog ^1.1.14`, `@radix-ui/react-visually-hidden ^1.2.4`, `lucide-react`, React 19, Next.js 15.5, `@playwright/test`) already present in `package.json`.
- Vetting gate: not required (no third-party blocks).

---

## Verification Mapping (downstream consumers)

| Requirement | Visual contract surface | Verification method |
|-------------|-------------------------|---------------------|
| **SHEET-02 (StoveSheet)** | "Sheet Body Contracts → StoveSheet" — hero + 2 SheetRows + SheetBtn grid + primary action | Jest `StoveSheet.test.tsx` (state rendering + handler wiring + needsCleaning lock) + Playwright "SHEET-02 StoveSheet wires command" describe (open card → assert temp readout → click +1 on Power Stepper → assert mocked Thermorossi power-change route hit) |
| **SHEET-03 (ClimateSheet)** | Zone chips + RadialDial + Tipo SheetRow + Modalità mode-pill grid | Jest `ClimateSheet.test.tsx` + Playwright "SHEET-03 ClimateSheet wires command" describe (open card → click +1 on RadialDial → wait 500ms debounce → assert `setroomthermpoint` route hit with target+1) |
| **SHEET-04 (LightsSheet)** | Summary 3-col + Scene grid + per-room sections + scene-by-name fallback | Jest `LightsSheet.test.tsx` (scene disabled state when not in catalog) + Playwright "SHEET-04 LightsSheet wires command" describe (open card → click "Tutte off" → assert all-off route batch fired) |
| **SHEET-05 (SonosSheet)** | Group list + volume strip + master action with `Promise.allSettled` | Jest `SonosSheet.test.tsx` (debounce + stopPropagation + master `Promise.allSettled` partial failure) + Playwright "SHEET-05 SonosSheet wires command" describe (open card → click play on first group → assert play route hit) |
| **SHEET-06 (PlugsSheet)** | Summary 2-col + plug list + per-plug toggle | Jest `PlugsSheet.test.tsx` (kW/W formatting boundaries + per-plug toggle) + Playwright "SHEET-06 PlugsSheet wires command" describe (open card → toggle a plug → assert `togglePlug` route hit) + assert NO toggle exists on the dashboard TuyaCard (DASH-10 / SHEET-06 cross-check) |
| **CONTEXT D-26 loading skeleton** | `loading === true && data === null` → single full-width skeleton block | Jest assertion: render with `loading=true, data=null` → expect a single `[role="presentation"]` skeleton element |
| **CONTEXT D-27 error state** | `error instanceof Error` → centered TriangleAlert + IT message + error.message | Jest assertion: render with `error=new Error('test')` → expect `Non raggiungibile. Riprova più tardi.` + `test` |
| **CONTEXT D-28 optimistic UI** | InlineToggle flips immediately, retries via Phase 7.0 infrastructure | Inherited from existing `useLightsCommands` / `useTuyaCommands` test coverage |
| **CONTEXT D-30 Playwright** | All 5 SHEET-* end-to-end specs in extended `dashboard-glass-cards.spec.ts` | 5 new describe blocks; reuse `collectConsoleErrors` + Auth0 + session-caching from Phase 97 |
| **CONTEXT D-33 React Compiler** | Zero `useMemo`/`useCallback` in new files | `npx react-compiler-healthcheck` in `<verify><automated>` (Phase 177 D-28 carry-forward); grep new files for `useMemo|useCallback` → expect zero hits |
| **Phase-174-inherited DS-02** | All hardcoded values inline-tagged with `// AUDIT-EXCEPTION` | Repo grep against new files; AUDIT-EXCEPTION-tagged lines tolerated; non-tagged hex/blur literals fail the gate |

---

## Claude's Discretion (auto-resolved)

Items where CONTEXT.md left planner freedom; UI-SPEC locks visual answers so the planner has zero ambiguity:

| Item | Resolution | Rationale |
|------|------------|-----------|
| `<SonosSheet>` master button concurrency | **`Promise.allSettled`** | Partial failure tolerance (memory: v16.0 batch pattern). One group failing must not abort the others. |
| `<RadialDial>` arc drag/touch | **Defer to a future polish phase** | Bundle does not implement it. ± buttons sufficient for v20.0. |
| `<Slider>` ship-or-defer | **Ship in Phase 178** (~30 LOC; bundle defines it; Phase 179 will consume) | Keeps Phase 179 diff smaller; cost trivial. |
| `findSceneByName` location | **`app/components/EmberGlass/sheets/lib/`** | Phase 178 self-contained and reviewable; can move to `app/components/devices/lights/utils/` later if Phase 179 wants it. |
| `useThermostatCommands` location | **`app/components/devices/thermostat/hooks/`** (new file) | Matches the convention from `useStoveCommands`/`useLightsCommands`/`useSonosCommands`/`useTuyaCommands`. NOT co-located in `EmberGlass/sheets/`. |
| `data-testid` density | **Per-component + per-test-meaningful-control** (mirror Phase 176 D-27 / Phase 177) | Stable selectors for Playwright reuse; explicit list above. |
| SonosSheet volume per-group vs per-speaker | **Per-group via group's coordinator speaker** | Matches bundle (single volume slider) and aligns with `useSonosCommands.handleSetVolume(uid, volume)` taking a speaker uid. |
| Sheet body component prop interface | **No props; self-fetch via hooks** (CONTEXT D-04 lock) | Single-line card swap; sheet bodies are independent of card-level state beyond `open` + `onClose` (which Phase 177 owns). |
| RadialDial setpoint debounce | **500ms `useDebounce`** (existing ThermostatCard pattern) | Avoids spamming the proxy on rapid ± clicks. |
| SonosSheet volume debounce | **250ms `useDebounce`** (memory: v16.0) | Volume drag is continuous; 250ms keeps UI responsive while throttling writes. |
| Mode-pill backend value mapping | **Plan agent confirms `schedule`/`manual`/`away`/`hg` against the live Netatmo proxy** | UI labels are Italian abstractions; backend values per Netatmo API. UI-SPEC defaults to those four; planner verifies. |
| SonosSheet "primary group" for scenes | **First room/group in the user's Hue catalog** | `useLightsData` exposes rooms/groups in order; planner verifies the first item is the right anchor. |
| StoveSheet pellet line graceful degradation | **Conditional render** — show "Pellet" only when field exists, "Obiettivo" only when target exists | Bundle assumes both; live hook may not. Plan agent verifies field availability. |
| StoveSheet "Orari"/"Manutenzione" navigation closure | **`router.push` only — accept hard cut on unmount** | Avoids prop-passing `onClose` through a body-only component. UX cost is acceptable; user is leaving the dashboard context. |
| globals.css `[data-sheet-focusable]:focus-visible` rule | **Ship the 3-LOC append** | Mirrors Phase 175 `[data-pressable-focusable]` pattern; gives keyboard users an accent ring on every sub-primitive button. |
| LightsSheet primary group resolution | **`groups[0].id` (first room in user's Hue catalog)** | Bundle scene-activate is single-target; first group is sane default. Plan agent verifies semantic. |
| Volume slider inputType | **Plain `<input type="range" accentColor="#b080ff">`** (NOT custom `<Slider>`) | Bundle `sheets.jsx:374-380` uses native range input. `<Slider>` is shipped for Phase 179 only. |

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS — all UI copy declared (IT) per CONTEXT D-18..D-23 (frozen); error/empty states declared with rationale; destructive "Spegni stufa" copy + visual treatment without confirmation modal documented
- [ ] Dimension 2 Visuals: PASS — every sheet body and sub-primitive is pixel-precise (every CSS rule per element, lifted verbatim from `sheets.jsx:1-597` line ranges cited); state matrix (loading/empty/error/refreshing) declared per sheet
- [ ] Dimension 3 Color: PASS — 60/30/10 split declared with explicit accent reserved-for list (4 items); 14+ AUDIT-EXCEPTION literals enumerated with bundle source line references; per-device-class tones (5 sheets) frozen and called out as not user-themable
- [ ] Dimension 4 Typography: PASS — 11 declared sizes (`{11,12,13,14,15,16,18,22,24,28,54,68}`) with rationale (bundle hierarchical depth); 3 weights (`{400,500,600}`); fonts inherited from Phase 174 token aliases; verification gate declared
- [ ] Dimension 5 Spacing: PASS — 4-multiple scale declared; bundle-verbatim micro-affordances (0.5px, 9px, 10px, 34×34, 36×36, 44×44) called out and justified per surface; z-index 200/201 reservation inherited from Phase 175 (no new z-indices in Phase 178)
- [ ] Dimension 6 Registry Safety: PASS (vacuous) — no shadcn, no third-party blocks, no new deps

**Approval:** pending (gsd-ui-checker)

---

*UI-SPEC drafted: 2026-04-29 by gsd-ui-researcher (auto mode).*
*Source: bundle `.planning/inbox/ember-glass-design/project/components/sheets.jsx:1-597` (PRIMARY) + Phase 174 token block + Phase 175 Sheet primitive contract + Phase 176 FlameViz + Phase 177 dashboard-card sheet wiring + CONTEXT.md D-01..D-36.*
