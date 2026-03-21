---
phase: 109-cleanup
plan: "02"
subsystem: docs
tags: [documentation, hue, cleanup, proxy-architecture]
dependency_graph:
  requires: [109-01]
  provides: [accurate-hue-docs]
  affects: [docs/setup/hue-setup.md, docs/api/hue.md]
tech_stack:
  added: []
  patterns: [proxy-only-setup-docs]
key_files:
  created: []
  modified:
    - docs/setup/hue-setup.md
    - docs/api/hue.md
decisions:
  - "docs/setup/hue-setup.md rewritten for proxy-only setup — HA_BASE_URL + HA_API_KEY, no OAuth, no frontend pairing"
  - "docs/api/hue.md Quick Reference trimmed to 10 rows (POST/PUT/DELETE planned scene CRUD removed)"
  - "All 'JWT Bearer or API Key' auth notes updated to 'API Key' only (proxy uses X-API-Key)"
  - "Bridge Setup Guide link corrected from HUE_SETUP.md to docs/setup/hue-setup.md"
metrics:
  duration: "8m"
  completed: "2026-03-21"
  tasks: 2
  files: 2
---

# Phase 109 Plan 02: Hue Documentation Cleanup Summary

Updated Hue documentation to reflect proxy-only architecture — rewrote setup guide (removing OAuth/bridge pairing/HueConnectionStrategy), removed 3 planned scene CRUD endpoints from API reference, and updated all authentication notes from JWT+API-Key to API-Key only.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Rewrite hue-setup.md for proxy-only setup | 305a093 | docs/setup/hue-setup.md |
| 2 | Update hue.md — remove deleted endpoints and legacy bridge section | 9cc3d1d | docs/api/hue.md |

## Changes Made

### docs/setup/hue-setup.md

Complete rewrite replacing the old 473-line guide (covering Local API, Remote API/OAuth 2.0, Hybrid Mode, HueConnectionStrategy, Firebase schema) with a 131-line proxy-centric guide:

- Overview: proxy handles Bridge connectivity on the Pi; Next.js needs only `HA_BASE_URL` and `HA_API_KEY`
- Bridge provisioning section (curl to Bridge, .secrets.toml, systemctl restart homeassistant.service) — preserved as accurate for proxy architecture
- Troubleshooting: Bridge not found, link button timeout, invalid username — adapted for proxy context
- Removed: all OAuth 2.0 setup, `HUE_CLIENT_SECRET`, `NEXT_PUBLIC_HUE_CLIENT_ID`, `NEXT_PUBLIC_HUE_APP_ID`, `HueConnectionStrategy`, Remote API, Firebase schema, frontend pairing UI instructions

### docs/api/hue.md

Targeted edits to bring documentation in line with actual endpoint inventory:

- Removed 3 rows from Quick Reference table: `POST /scenes (planned)`, `PUT /scenes/{scene_id} (planned)`, `DELETE /scenes/{scene_id} (planned)` — Quick Reference now has 10 rows matching actual endpoints
- Removed 3 TOC entries for the same planned endpoints
- Note: the full planned section bodies were already removed in Plan 01 (docs/api/hue.md had M status from that work)
- Updated Bridge Setup Guide intro link from `../HUE_SETUP.md` to `../setup/hue-setup.md`
- Updated intro paragraph: removed "JWT Bearer token or" — proxy uses X-API-Key only
- Updated all 10 per-endpoint authentication notes from "Required (JWT Bearer or API Key)" to "Required (API Key)"

## Deviations from Plan

None — plan executed exactly as written. Note: the planned scene CRUD full bodies were already removed in Plan 01, so this plan's Task 2 cleaned up the remaining table rows, TOC entries, and auth notes.

## Verification

All plan acceptance criteria met:

- `grep "OAuth" docs/setup/hue-setup.md` → 0 matches
- `grep "HUE_CLIENT_SECRET\|NEXT_PUBLIC_HUE_CLIENT_ID\|HueConnectionStrategy\|Remote API" docs/setup/hue-setup.md` → 0 matches
- `grep "HA_BASE_URL" docs/setup/hue-setup.md` → 1 match
- `grep "HA_API_KEY" docs/setup/hue-setup.md` → 1 match
- `grep "homeassistant" docs/setup/hue-setup.md` → 3 matches (proxy overview + curl devicetype + systemctl)
- `grep "POST.*scenes.*planned\|PUT.*scenes.*planned\|DELETE.*scenes.*planned" docs/api/hue.md` → 0 matches
- `grep "HUE_SETUP.md" docs/api/hue.md` → 0 matches
- `grep "hue-setup.md" docs/api/hue.md` → 1 match
- `grep "JWT Bearer" docs/api/hue.md` → 0 matches
- Quick Reference table has 10 data rows

## Self-Check: PASSED
