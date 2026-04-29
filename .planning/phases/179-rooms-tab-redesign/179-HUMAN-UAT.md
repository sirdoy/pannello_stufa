---
status: partial
phase: 179-rooms-tab-redesign
source: ["179-VERIFICATION.md"]
started: 2026-04-29
updated: 2026-04-29
---

## Current Test

[awaiting human testing]

## Tests

### 1. Page chrome and safe-area
expected: Navigate to `/stanze` on a mobile-width viewport (375×812, e.g. iPhone 13 simulator in Chrome DevTools) after Auth0 login. Verify the page shows a 70px top safe-area that does not overlap with any future nav bar. The page subtitle "{N} stanze" appears in uppercase caps and the display title "Stanze" at 30px is visible at the top of the page.
result: [pending]

### 2. 6 RoomCards in 2-col grid with correct room tones
expected: Verify 6 RoomCards are arranged in a 2-column grid: Soggiorno (accent tone `var(--accent)`), Cucina (`#f5c84a`), Camera (`#b080ff`), Studio (`#5eafff`), Bagno (`#6aa86a`), Ingresso (`#ffb84a`). Each card shows the room name, an icon, and an "{activeCount}/{total} attivi" badge. No card is missing or empty.
result: [pending]

### 3. Count badge tinting per room tone
expected: For each RoomCard where activeCount > 0, verify the count badge in the top-right corner tints to that room's designated tone color. Cards with activeCount = 0 should show the badge in a neutral color (not tinted). Tap Soggiorno and Cucina to compare — their badges should use the respective `var(--accent)` and `#f5c84a` tints.
result: [pending]

### 4. Chip grid — 3-col layout, max 6 chips, "+N" overflow
expected: Each RoomCard shows a 3-column × 2-row chip grid (max 6 DeviceChips). When a room has more than 6 devices, a "+N" overflow chip appears in the 6th position. Verify Soggiorno (stove + lights + sonos + TV + shade + camera = potentially >6) shows the "+N" overflow chip. Verify Bagno (fewer devices) shows all chips without overflow. Each chip uses `color-mix(in oklab, {tone} 20%, transparent)` tinting for its background border.
result: [pending]

### 5. Sheet open animation (Phase 175 motion contract)
expected: Tap any RoomCard. Verify the RoomSheet slides in from the bottom using the Phase 175 animation contract: cubic-bezier(.22,1,.36,1) easing, 400ms duration. The sheet should feel smooth and native — not abrupt or linear. On iOS Safari (optional), verify the animation plays without jank and the touch latency from tap to sheet start is under 100ms.
result: [pending]

### 6. Summary header gradient tinting
expected: Inside the open RoomSheet, verify the summary header uses a tone-tinted gradient: `linear-gradient(130deg, color-mix(in oklab, {roomTone} 16%, transparent) 0%, transparent 60%)`. The tint should be visible but subtle. Soggiorno (accent) should show a warm ember tint; Camera (purple `#b080ff`) should show a cool purple tint.
result: [pending]

### 7. Frozen Italian copy in summary header
expected: The summary header shows the exact frozen Italian copy from D-48: "{activeCount} di {total} attivi" (e.g. "3 di 6 attivi") and "{N} categorie di dispositivi" (e.g. "4 categorie di dispositivi"). No English text should appear. Verify the count updates correctly as route-mocked data provides fixture values.
result: [pending]

### 8. Per-category section labels in Italian (CATEGORY_ORDER)
expected: Inside RoomSheet, verify per-category sections are rendered in CATEGORY_ORDER with the frozen Italian labels: Stufa / Termostato / Termovalvole / Luci / Prese / Audio / TV / Telecamera / Tapparelle / Sensori. Soggiorno should show at least Stufa, Luci, Audio, and TV sections. Verify the labels match the bundle exactly — no English labels (e.g. not "Thermostat" or "Lights").
result: [pending]

### 9. DeviceCard structure — icon tile, name, status line
expected: Each DeviceCard inside RoomSheet has: a 40×40 icon tile (tone-tinted when device.on = true, plain/muted when off), the device name at 15px 600 weight, and a status line reading "Attivo · {value}" or "Inattivo · {value}". Verify Soggiorno stove shows "Attivo · Livello 3" (or similar active state from fixture). Verify a light that is off shows "Inattivo · —".
result: [pending]

### 10. Type-specific body — StoveBody
expected: The Stove DeviceCard in Soggiorno's RoomSheet shows: 3 stat chips (Target / Fiamma / Ventola) with their respective values from fixture (powerLevel 3, fanLevel 2), and a ControlRow with 3 buttons: "Meno" / "Power" / "Più". Verify the Power button is visually prominent (filled variant). The "Più" button should be tappable and show a visual press animation (scale 0.97 per Phase 175 SC-#1).
result: [pending]

### 11. Type-specific body — ThermoBody (Termostato / Termovalvola)
expected: The Thermostat DeviceCard for Soggiorno (NATherm1, room_id r1, temperature 21.3°C, setpoint 21°C) shows: DualTempReadout with "21.3°" current and "21°" target separated by a ChevronRight arrow, and 4 buttons: "−0.5°" / "+0.5°" (unicode minus `−`) / "Eco" / "Auto". Tapping "+0.5°" should update the target display (or show debounce state for 500ms before commit). The Valve (NRV Camera) should show the same body layout.
result: [pending]

### 12. Type-specific body — LightBody
expected: The Light DeviceCard in Soggiorno shows: a Luminosità (brightness) slider that is interactive (tap to seek, 250ms debounce, dispatches `handleBrightnessChange` for the group) and a Temperatura (color-temp) slider that is visibly disabled — cursor shows as `not-allowed`, opacity is 0.45, the thumb still renders but does not respond to tap. Verify the disabled state is visually distinct from the active slider.
result: [pending]

### 13. Type-specific body — SonosBody + interactive volume
expected: The Sonos DeviceCard in Soggiorno (group g1, PLAYING, "Lofi Beats · ChilledCow", volume 32) shows: a track line "Lofi Beats · ChilledCow", a "Volume" labeled SliderRow at 32%, and three transport buttons: SkipBack / Play-Pause (showing Pause icon since PLAYING) / SkipForward. Tap the volume slider — verify a seek position snap and 250ms debounce before any API call. Tap Play-Pause — verify the icon toggles.
result: [pending]

### 14. Type-specific body — TvBody + HDMI buttons (static)
expected: The TV DeviceCard in Soggiorno (EXTRA_DEVICES static mock) shows: "Sorgente" and "Volume" labels, and 3 HDMI buttons: "HDMI 1" (filled — currently selected source), "HDMI 2" (outlined), "App" (outlined). Tapping an HDMI button renders a visual press animation but does NOT fire any real API call (no proxy for TV commands in Phase 179 — static/no-op). Verify no console error on tap.
result: [pending]

### 15. Sheet dismissal — Esc, backdrop, close button
expected: With RoomSheet open, verify three dismissal methods all work: (1) Press Escape key — sheet closes with outro animation. (2) Tap the backdrop/overlay behind the sheet — sheet closes. (3) Tap the close button (X) inside the sheet header — sheet closes. After each dismissal, verify the page returns to the 6-card grid without scrolling to top or losing position.
result: [pending]

### 16. Body scroll-lock and /rooms cross-check
expected: With RoomSheet open, scroll the underlying page content (swipe behind the sheet on mobile or use keyboard on desktop). Verify body scroll is locked (page does not move). Close the sheet — verify scroll position is restored to exactly where it was before the sheet opened (Phase 175 scroll-lock pattern: useRef-captured scrollY restored on sheet close). Then visit `/rooms` (legacy v15.0 admin page) and verify it is UNTOUCHED — the Device Registry CRUD UI still renders with DataTable + FormModal, no visual regression.
result: [pending]

## Summary

total: 16
passed: 0
issues: 0
pending: 16
skipped: 0
blocked: 0

## Gaps
