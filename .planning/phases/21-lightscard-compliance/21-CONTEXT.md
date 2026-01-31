# Phase 21: LightsCard Compliance - Context

**Gathered:** 2026-01-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace all raw HTML elements in LightsCard with design system components. Convert the raw `<input type="range">` to Slider, raw scene `<button>` elements to Button, and organize adaptive styling patterns. This is a compliance phase — no new features, just design system alignment.

</domain>

<decisions>
## Implementation Decisions

### Brightness Slider
- Replace raw `<input type="range">` with design system Slider component
- Use CSS variables approach for color theming — Slider respects CSS custom properties set by parent container
- Trust design system Slider for touch support — Radix-based component handles touch events properly

### Scene Buttons
- Migrate raw `<button>` elements to Button component
- Scene buttons currently have card-like appearance with icon above text

### Adaptive Styling
- Card dynamically calculates light colors at runtime and generates dynamic CSS (gradients, shadows, borders)
- Three contrast modes exist: light (bright background), dark (dark background), default (static styling)
- Button components receive variant and className overrides for contrast adjustments
- Brightness panel follows same adaptive approach as main control area

### Brightness Panel Layout
- Verify ControlButton + Slider spacing follows design system grid
- ControlButtons already design system components (from Phase 15)
- Layout: header row (icon + label + value), slider, +/- buttons row

### Claude's Discretion
- Slider local-state-during-drag pattern — choose cleanest approach preserving current UX (likely wrap with local state, onChangeEnd triggers API)
- Slider value display — decide based on what design system Slider already supports
- Scene button variant — pick variant (ghost/subtle/outline) matching current visual appearance
- Scene button layout — decide stacked vs horizontal based on what looks best while staying Button-compliant
- Dynamic color handling — balance CVA compliance with runtime flexibility (likely CVA for structural variants + style prop for runtime colors)
- Contrast mode implementation — decide if CVA variants add value or complexity for the 3 modes
- Button contrast approach — minimize changes while achieving compliance
- Brightness panel abstraction — decide if layout should become reusable component based on pattern reuse elsewhere

</decisions>

<specifics>
## Specific Ideas

- Current slider uses `localBrightness` state during drag to avoid API calls on every pixel movement — preserve this UX
- Scene buttons are in horizontal scrolling container with fixed width (w-32 sm:w-36)
- adaptiveClasses object (lines 761-809) defines heading, text, badge, button, slider, panel classes for each contrast mode
- getLuminance and getContrastMode functions calculate perceived brightness to determine if light or dark UI needed
- Runtime color calculation happens in getRoomControlStyle() and getRoomLightColors()

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 21-lightscard-compliance*
*Context gathered: 2026-01-31*
