---
status: partial
phase: 178-per-device-modal-sheets
source: ["178-VERIFICATION.md"]
started: 2026-04-29
updated: 2026-04-29
---

## Current Test

[awaiting human testing]

## Tests

### 1. StoveSheet end-to-end
expected: Open dashboard at `/`, tap StoveCard. StoveSheet opens with FlameViz hero, "In funzione"/"Spenta" cap, `{powerLevel}/5` readout (54px display), 2 SheetRows for Livello fiamma + Ventola, Orari/Manutenzione SheetBtn grid, primary Accendi/Spegni button. Click `+` on Livello fiamma stepper — verify (DevTools Network panel) the Thermorossi power-set request fires and the value increments by 1 in the UI.
result: [pending]

### 2. ClimateSheet end-to-end
expected: Tap ClimateCard → ClimateSheet opens with zone chip strip, RadialDial (`#5eafff`), Tipo SheetRow with InlineToggle, "Modalità globale" eyebrow, 4 mode pills (Auto/Manuale/Eco/Off). Click radial-dial-plus, wait 500ms — verify `/api/v1/netatmo/setroomthermpoint` POST fires with correct `{home_id, room_id, mode: 'manual', temp}` body. Confirm "Manuale" pill is UI-only and never fires `setHomeMode('manual')`.
result: [pending]

### 3. LightsSheet end-to-end
expected: Tap LightsCard → LightsSheet opens with Accese count card + Tutte on/Tutte off pills, 4 scene buttons with correct gradients, per-room sections with InlineToggles. Click "Tutte off" — verify Hue group action endpoint fires. Verify scene buttons reflect actual Hue catalog state (disabled with "Crea scena '{name}' su Hue" tooltip when name not in catalog).
result: [pending]

### 4. SonosSheet end-to-end
expected: Tap SonosCard → SonosSheet opens with group list (album-art tiles + PlayingBars when playing), volume strip (`#b080ff` accentColor), "Pausa/Riproduci ovunque" master button. Drag volume slider — verify single coalesced `/api/v1/sonos/zones/{groupId}/volume` PUT fires after 250ms. Click play/pause on a group row — verify it does NOT change selection AND fires the play/pause endpoint.
result: [pending]

### 5. PlugsSheet end-to-end + DASH-10 cross-check
expected: TuyaCard dashboard tile has zero toggle controls (DASH-10 cross-check). Tap TuyaCard → PlugsSheet opens with 2-col summary grid (Accese / Consumo, kW boundary at 1000W), per-plug list with `name + power` subtitle ONLY (no room segment per Pitfall 8 deferral), InlineToggle in `#ffb84a`. Click first plug toggle — verify `/api/tuya/plugs/{deviceId}/state` POST fires.
result: [pending]

### 6. Playwright smoke spec runs green
expected: `npm run test:e2e -- tests/smoke/dashboard-glass-cards.spec.ts -g "SHEET-0[2-6]"` exits 0. Existing DASH-* describe blocks still pass. Zero new console errors collected by `collectConsoleErrors`.
result: [pending]

## Summary

total: 6
passed: 0
issues: 0
pending: 6
skipped: 0
blocked: 0

## Gaps
