---
status: complete
phase: 65-device-history-timeline
source: 65-01-SUMMARY.md, 65-02-SUMMARY.md, 65-03-SUMMARY.md
started: 2026-02-16T18:00:00Z
updated: 2026-02-16T18:15:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Device History Timeline Section Visible
expected: On the /network page, scrolling below the bandwidth chart, you see a new "Cronologia Dispositivi" section inside an elevated card with a time range selector (1h/24h/7d) and a device filter dropdown.
result: pass

### 2. Timeline Shows Date-Grouped Events
expected: Events in the timeline are grouped by date. Each date group has a sticky Italian-locale header (e.g., "giovedì, 15 febbraio 2024"). Events within each group are sorted newest first.
result: skipped
reason: No events logged yet — feature just deployed, no historical data

### 3. Event Item Display
expected: Each event in the timeline shows a colored dot (green for connected), the device name, a status badge ("Connesso" or "Disconnesso"), the device IP in monospace, the absolute time (HH:mm:ss), and a relative time in Italian (e.g., "3 ore fa").
result: skipped
reason: No events logged yet

### 4. Time Range Selector
expected: Clicking the 1h, 24h, or 7d buttons in the timeline header changes the time range. The timeline re-fetches and shows only events within the selected window. Default is 24h.
result: skipped
reason: No events to verify re-fetch visually (API calls work but return empty)

### 5. Device Filter Dropdown
expected: The dropdown shows "Tutti i dispositivi" by default (all events). Selecting a specific device name filters the timeline to show only that device's events. Selecting "Tutti i dispositivi" again shows all events.
result: skipped
reason: No events to test filtering

### 6. Empty State
expected: When no events exist for the selected time range / device filter, the timeline shows "Nessun evento nel periodo selezionato" centered text instead of event entries.
result: pass

### 7. Event Detection on Device State Change
expected: When a device connects or disconnects from the network, a new event appears in the timeline on the next refresh. The devices endpoint detects state changes and logs events automatically.
result: skipped
reason: Cannot test without physically disconnecting a device

## Summary

total: 7
passed: 2
issues: 0
pending: 0
skipped: 5

## Gaps

[none yet]
