# Quick Task 260505-otx — Sheet-Open Perf Slowdown — Research

**Researched:** 2026-05-06
**Domain:** Frontend perf (Radix Dialog + heavy `backdrop-filter` + duplicate hook subscriptions)
**Confidence:** HIGH on root causes, MEDIUM on relative cost ranking (no profile data; ranked by mechanism)

## Summary

The "vertiginous" slowdown when a Sheet opens is **caused by stacking expensive paint costs and duplicating data subscriptions, not by Radix or React itself**. Three independent issues compound on every open:

1. **Two stacked, viewport-sized `backdrop-filter: blur(...)` layers animate from `none` → blur in 300–400 ms.** The Sheet backdrop blurs at 8 px and the Sheet container blurs at 40 px with `saturate(200%)`, both `position: fixed; inset: 0` (or full-bleed). Browsers must allocate compositor textures for everything *behind* both layers and re-rasterize them every frame of the transition. Mobile Safari and lower-end Android Chrome melt under this. [VERIFIED: app/components/EmberGlass/Sheet.tsx:90-93,121-122]
2. **The Sheet body re-mounts the same data hook the host card already mounts**, doubling polling subscriptions and WS subscribers on every open. `<StoveCard>` calls `useStoveData(...)` and `<StoveSheet>` (rendered inside the Sheet) calls `useStoveData(...)` again. Same pattern for Sonos, Climate, Lights, Tuya. [VERIFIED: app/components/EmberGlass/cards/StoveCard.tsx:42 + app/components/EmberGlass/sheets/StoveSheet.tsx:44]
3. **AmbientBg renders three full-viewport `filter: blur(60–80px)` blobs animating with infinite `transform/scale` keyframes.** When the Sheet opens, those blobs are still painting *behind* the new backdrop-filter layers — i.e. each animation frame re-rasterizes a triple-blurred stack. They're gated by `<html data-ambient="on">`; if the user has ambient enabled, this dominates everything else. [VERIFIED: app/components/EmberGlass/AmbientBg.tsx:43-93 + app/globals.css:347-358]

**Primary recommendation:** Drop the backdrop's animated `backdrop-filter` (or shrink it to ≤ 4 px and don't transition it), and stop mounting device-data hooks inside the sheet body when the parent card already owns the subscription. Either fix alone delivers a step-change; doing both restores buttery animation. AmbientBg should pause its keyframes while a sheet is open if the user has `data-ambient="on"`.

---

## Sheet variants in this repo (and which actually run)

| File | Status | Used by |
|------|--------|---------|
| `app/components/EmberGlass/Sheet.tsx` | **Production** — Radix Dialog facade | All 10 dashboard cards (StoveCard, ClimateCard, LightsCard, SonosCard, TuyaCard, NetworkCard, CameraCard, DirigeraCard, RaspiCard, WeatherCard) and `RoomSheet` |
| `app/components/ui/Sheet.tsx` | Legacy CVA Radix wrapper | Only `app/debug/design-system/page.tsx` (debug only) |
| `app/components/ui/BottomSheet.tsx` | Legacy portal-based | `IntervalBottomSheet` (scheduler), `ManualOverrideSheet` (thermostat schedule), debug page |

The slowdown the user is reporting is overwhelmingly likely on the **EmberGlass `Sheet`** (it's what every dashboard card opens). This is the only Sheet ranked below.

`[VERIFIED: grep across app/]`

---

## Ranked root causes

### #1 (HIGH confidence) — Two stacked, animated `backdrop-filter` layers

**Where:** `app/components/EmberGlass/Sheet.tsx`

```tsx
// Backdrop (z=200, full viewport):
backdropFilter: open ? 'blur(8px)' : 'none',
WebkitBackdropFilter: open ? 'blur(8px)' : 'none',
transition: 'background .3s, backdrop-filter .3s',     // ← animates blur
```
[VERIFIED: app/components/EmberGlass/Sheet.tsx:91-93]

```tsx
// Container (z=201, fills viewport bottom 8 px → top 15%):
backdropFilter: 'blur(40px) saturate(200%)',
WebkitBackdropFilter: 'blur(40px) saturate(200%)',
```
[VERIFIED: app/components/EmberGlass/Sheet.tsx:121-122]

**Why this is expensive:**
- `backdrop-filter` forces the browser to *re-rasterize the layer behind the element on every frame* the filter changes, on every frame of the slide-in transform on the container, and on every paint-affecting change to anything underneath.
- `transition: backdrop-filter .3s` means the browser cannot keep a cached blur — it must compute 60+ filtered frames per open.
- `saturate(200%)` on a 40 px blur is roughly the most expensive composite filter combo Chrome ships. The bundle uses these values, but the bundle was a static design demo, not a polling app with 10 live cards underneath.
- On the dashboard there are 10 `GlassCard`s, each with their own `backdrop-filter: blur(20px)` (`app/globals.css:593`) and `glass-surface` utility uses `blur(var(--glass-blur)) saturate(180%)` (`app/globals.css:331`). The Sheet's backdrop has to filter *those filtered surfaces*, which the compositor cannot trivially fast-path.

**Tell-tale symptom:** slowdown only on open/close (during the 300–400 ms transition) and persistent jank if anything underneath continues animating (FlameViz, ambient blobs, shimmer skeletons).

### #2 (HIGH confidence) — Duplicate device-data hooks on Sheet open

Every device card mounts the data hook AND the device sheet body re-mounts the same hook:

| Card | Card hook | Sheet body | Sheet's own hook |
|------|-----------|------------|------------------|
| StoveCard | `useStoveData(...)` [StoveCard.tsx:42] | `<StoveSheet>` | `useStoveData(...)` again [StoveSheet.tsx:44] |
| ClimateCard | `useThermostatData()` [ClimateCard.tsx:56] | `<ClimateSheet>` | `useThermostatData()` again [ClimateSheet.tsx, top of fn] |
| LightsCard | `useLightsData()` [LightsCard.tsx:47] | `<LightsSheet>` | `useLightsData()` again |
| SonosCard | `useSonosFullData()` [SonosCard.tsx:38] | `<SonosSheet>` | `useSonosFullData()` again [SonosSheet.tsx:55] |
| TuyaCard | `useTuyaData()` [TuyaCard.tsx:38] | `<PlugsSheet>` | `useTuyaData()` again |

**What that costs on every open:**
- Each `use*Data` hook subscribes to the WebSocket via `useWebSocketContext()` AND registers a `useAdaptivePolling` interval (60 s when WS down). Mounting a second copy registers a second WS subscriber, fires a second initial `fetch()` on mount, and queues a second polling interval. [VERIFIED: app/components/devices/stove/hooks/useStoveData.ts:109,193,298 + app/components/devices/sonos/hooks/useSonosFullData.ts:116,236,244]
- `useSonosFullData.fetchData` (lines 119-208) issues **N+1 fan-out fetches**: 1 `/devices` + 1 `/zones` + per-zone `playback`+`volume`+`eq`+`home-theater`+`play-mode`+`sleep-timer`. **One Sonos sheet open = ~20 simultaneous network requests** on top of whatever the SonosCard already fired.
- Each new mount creates new `useState` slots → first paint of the sheet is followed by a re-render storm as the second copy of the data lands.

**Tell-tale symptom:** the lag spike is *worst* on first open per session and on Sonos (heaviest payload), and the network panel shows duplicated requests synchronized with the sheet open.

### #3 (HIGH confidence — IF ambient is enabled) — AmbientBg blobs paint behind the Sheet's backdrop-filter

`AmbientBg.tsx` renders three `position: fixed` blobs with `filter: blur(60px|70px|80px)` and infinite `animation: ambientA/B/C 14–22s` running continuous `transform/scale` keyframes. [VERIFIED: app/components/EmberGlass/AmbientBg.tsx:43-93 + app/globals.css:347-358]

When the Sheet opens, those blobs sit at z-index 0 below the backdrop (z 200) and container (z 201). Both Sheet layers apply `backdrop-filter`, so on every frame the browser must:
1. Re-paint the moving blobs (already a 60–80 px blur each).
2. Re-blur that already-blurred image at 8 px (backdrop) and at 40 px + `saturate(200%)` (container).

Three full-viewport blurs in series = compositor textures the size of the screen × 3, all updating every frame.

It's only active when `<html data-ambient="on">` is set. The codebase already has a reduced-motion gate (`globals.css:407`) but no "sheet is open" gate.

### #4 (MEDIUM confidence) — `position: fixed` body trick on every open

`useEffect` toggles `document.body.style.{position,top,width,overflow}` on every open and reads `window.scrollY` synchronously. [VERIFIED: app/components/EmberGlass/Sheet.tsx:49-65]

This forces a synchronous reflow of the entire document on open and on close (changing `position` on `<body>` re-roots layout for every fixed/sticky element). Cheap in isolation; expensive when stacked with the blur cost above. Not the dominant factor, but worth noting because closing the sheet also slides every fixed/sticky element back, triggering one more layout pass right when the slide-out animation runs.

### #5 (LOW confidence) — `body[data-sheet-open="true"]` cascade animations

`globals.css:382-405` adds `transform: translate(...) translate...` transitions on `[data-bottom-tab="true"]` and `[data-ws-chip="true"]` keyed to `body[data-sheet-open]`. Two extra animated elements is negligible, but the rules combine on desktop (`translate(-50%, 140%)`) and could surprise downstream debugging. Mention only because it's part of the open-time cascade; not a perf cause on its own.

### #6 (LOW confidence) — Sheet container has `overflowY: auto` + `maxHeight: 85%` and ALL device-card content lives inside it

The Sheet container scrolls internally. When `<StoveSheet>` / `<SonosSheet>` mounts a 250-300 line tree on every open, layout cost is O(content). Sonos zones with track artwork would be the worst case. Not in itself a perf bug, but it amplifies #1 because the slide-in transition runs while the new content is still laying out.

---

## What is *not* a problem (verified, can rule out)

- **`forceMount`** is correctly *not* used. The Sheet author already removed it (with a clear comment) because Radix's modal `hideOthers` would otherwise leave the page inert. Content unmounts on close. [VERIFIED: app/components/EmberGlass/Sheet.tsx:74-78,98-103] Good.
- **Polling does NOT compound during the open**: the Sheet body mounts a *second* hook copy on open and unmounts it on close, but each copy still polls only at 60 s. So the steady state while the sheet is open is "2× polling rate", not "polling speed-up". The user's reported slowdown is an *open-event* spike, not steady-state. Polling duplication is real but secondary to the blur cost during the animation.
- **React Compiler 1.0** is enabled (memory v9.0); it does not interact badly with Radix Dialog and does not cause this. Confirmed by the `RC-clean (D-33)` discipline notes inside the sheets.
- **`useAdaptivePolling` does not run more often when the sheet opens** — the visibility gate keeps it at 60 s. Not an interaction here. [VERIFIED: lib/hooks/useAdaptivePolling.ts:1-80]
- **ESC handler / keydown listener leakage** — clean up is correct in BottomSheet (handlers removed on close). Sheet (Radix) handles ESC internally. No leak.

---

## Recommended fixes (cheapest first)

### Fix A — De-fang the backdrop-filter (smallest diff, biggest win)
**File:** `app/components/EmberGlass/Sheet.tsx`

1. Drop the animated transition on `backdrop-filter`. Keep `background` transitioning (cheap), let the blur snap on instantly:
   ```tsx
   transition: 'background .3s',                 // remove backdrop-filter from transition
   ```
2. Reduce backdrop blur to 4 px, drop `saturate` from the container, or drop the container's backdrop-filter entirely and replace with a solid `rgba(28,25,23,0.92)` (it already has the fallback at `globals.css:340-345`):
   ```tsx
   // backdrop layer
   backdropFilter: open ? 'blur(4px)' : 'none',  // 8 → 4
   // container — option A: drop backdrop-filter, use opaque background
   background: 'rgba(28, 25, 23, 0.92)',
   // (delete backdropFilter / WebkitBackdropFilter on container)
   ```
   The visual fallback path is already documented as acceptable in `globals.css:340-345`.

Either change alone removes the per-frame re-rasterization cost. **Expect** the slide-in jank to disappear immediately.

### Fix B — Stop double-mounting device hooks inside Sheet bodies
**Pattern:** make `<*Sheet />` accept the data + commands as props from the parent card; do not call `use*Data` again inside the sheet.

Two equally viable shapes:
1. Lift the hook to the card and pass through:
   ```tsx
   // Card
   const stove = useStoveData(...);
   const cmds  = useStoveCommands(...);
   ...
   <Sheet open={open} onClose={...} title="Stufa">
     <StoveSheet stove={stove} cmds={cmds} />
   </Sheet>
   ```
2. Or wrap the data hook in a small context provider scoped to the card so both card and sheet read the same instance:
   ```tsx
   <StoveDataProvider>
     <StoveCardInner />
     <Sheet ...><StoveSheet/></Sheet>
   </StoveDataProvider>
   ```

This eliminates the duplicate fetch fan-out (especially severe for Sonos), the duplicate WS subscription, and the second polling interval. **Expect** initial-open latency to drop sharply and network panel to halve.

> Note: there is a doc comment in StoveSheet that says "self-fetches via `useStoveData` + `useStoveCommands` (D-04 — sheet bodies take no props)". That decision was deliberate during Phase 178 to keep sheets prop-less. Reversing it is a Phase 178 contract change — call it out in the plan and make it intentional. The contract was a design constraint, not a perf decision.

### Fix C — Pause AmbientBg keyframes when a sheet is open
**File:** `app/globals.css` — append a rule next to the existing `body[data-sheet-open="true"]` cascade (`globals.css:380-405`):
```css
body[data-sheet-open="true"] .ember-ambient-blob {
  animation-play-state: paused;
}
```
This kills the per-frame triple-blur cost without removing the visual. It piggy-backs on the `data-sheet-open` attribute that `SheetCounter` already sets when at least one sheet is open. [VERIFIED: app/components/EmberGlass/SheetCounter.ts]

### Fix D (optional) — defer the `document.body.style` write to next frame
Not strictly needed if A+B+C land. If you want to remove the synchronous reflow at open time, wrap the body-style writes in a `requestAnimationFrame` so they happen after the slide-in starts:
```tsx
useEffect(() => {
  if (!open) return;
  let raf = requestAnimationFrame(() => { /* ...style writes... */ });
  return () => { cancelAnimationFrame(raf); /* ...cleanup... */ };
}, [open]);
```
Marginal win; leave for later if profile shows residual jank.

---

## Pitfalls when fixing

1. **Do not add `forceMount` back.** The current author left a clear note (Sheet.tsx:98-103): Radix `DialogContent` with `forceMount` calls `hideOthers()` which sets `aria-hidden + pointer-events:none` on the rest of the page on initial mount and never unwinds. Past contributor already paid for that lesson.
2. **`Sheet open={false}` still mounts the children once** because the JSX inside `<DialogPrimitive.Portal>` is constructed unconditionally before Radix decides to render. With Portal unmounted-when-closed, child *components* are not mounted, but inline JSX expressions run. So `<StoveSheet />` does NOT mount when `open=false` — confirmed Radix Portal behavior. (This means Fix B is genuinely fixing duplicated mounts during open, not a phantom.)
3. **Don't switch to `will-change: backdrop-filter`.** Counter-intuitively this often makes things worse in Chrome by promoting an extra compositor layer per Sheet that has to be re-blurred every frame. Ship Fix A's "no transition on filter" path instead.
4. **Do not use `backdrop-blur-3xl` from Tailwind on the sheet bodies either** — the legacy `app/components/ui/Sheet.tsx:62` and `BottomSheet.tsx:112` both do this; if any callsite still uses those, perf will degrade similarly. Audit if migrating.
5. **CSS Containment caveat:** adding `contain: layout style paint` on the Sheet container can isolate paint cost but breaks `position: fixed` children that overflow the container in some browsers. Test before applying.
6. **iOS Safari `-webkit-backdrop-filter`** — keeping the prefixed property is correct; do not remove it. iOS still requires it.
7. **Verify with DevTools "Layers" panel** before/after. The sign of success is: open the sheet → only 1 compositor layer with a backdrop-filter (or zero if Fix A drops the container's filter) instead of 2 stacking and animating.

---

## Suggested verification steps (post-fix)

1. Chrome DevTools → Performance tab → record open + close one sheet on the dashboard. Before fix: long purple/green "Composite Layers" bars during the 400 ms slide. After Fix A: bars collapse to <16 ms.
2. Network panel → open Sonos sheet. Before Fix B: ~20 requests fire on open (duplicate fan-out). After: same set as the card alone, no duplicates.
3. Throttle CPU 4× and re-test on `/` — slide should still feel smooth.
4. `npm run test:components -- app/components/EmberGlass/__tests__/Sheet.test.tsx` to confirm no regression in scroll-lock/escape/click-outside contracts.
5. Add a Playwright trace (if budgeted) opening each card sheet sequentially to record timing — there's already an established pattern in `e2e/` per memory v12.0.

---

## Sources

- `app/components/EmberGlass/Sheet.tsx` — primary suspect
- `app/components/EmberGlass/AmbientBg.tsx` — background blur factor
- `app/globals.css:331-358` — `glass-surface` blur, ambient keyframes, sheet-open cascade
- `app/components/EmberGlass/cards/{Stove,Sonos,Climate,Lights,Tuya}Card.tsx` — duplicate hook callers (parents)
- `app/components/EmberGlass/sheets/{Stove,Sonos,Climate,Lights,Plugs}Sheet.tsx` — duplicate hook callers (children)
- `app/components/devices/{stove,sonos,thermostat,lights,tuya}/hooks/use*Data.ts` — polling + WS subscription cost per mount
- `lib/hooks/useAdaptivePolling.ts` — confirms 60 s interval, no compound effect on sheet open
- MDN / web.dev: `backdrop-filter` performance — re-raster on filter change [CITED]
- Radix UI Dialog: `forceMount` + modal `hideOthers` interaction [CITED — repo author note in Sheet.tsx:98-103]

## Confidence breakdown
- Backdrop-filter as #1 cause: HIGH (mechanism is well known, code matches the smell, two stacked filtered layers is rare and severe)
- Duplicate hook subscription: HIGH (verified by direct read of card + sheet pairs)
- AmbientBg compounding: HIGH if `data-ambient="on"`, otherwise N/A — confirm with user
- Body-style reflow: MEDIUM
- All other items: LOW
