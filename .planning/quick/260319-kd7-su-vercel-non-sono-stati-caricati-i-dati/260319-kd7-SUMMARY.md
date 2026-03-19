---
quick_id: 260319-kd7
status: complete
date: 2026-03-19
---

# Quick Task 260319-kd7: Fix Vercel env vars for HA proxy connection

## Problem

Vercel production deployment was missing `HA_API_URL` and `HA_API_KEY` environment variables required by `lib/haClient.ts`. Instead, old naming (`NETATMO_PROXY_URL`, `NETATMO_PROXY_API_KEY`) was set, along with 5 obsolete Netatmo OAuth vars from pre-v10.0.

## Changes

### Added (Vercel Production)
- `HA_API_URL` — HA proxy base URL
- `HA_API_KEY` — HA proxy API key for X-API-Key auth

### Removed (Vercel — all environments)
- `NETATMO_PROXY_URL` — old naming, replaced by HA_API_URL
- `NETATMO_PROXY_API_KEY` — old naming, replaced by HA_API_KEY
- `NETATMO_CLIENT_ID` — obsolete OAuth (removed in v10.0)
- `NETATMO_CLIENT_SECRET` — obsolete OAuth (removed in v10.0)
- `NETATMO_REDIRECT_URI` — obsolete OAuth (removed in v10.0)
- `NEXT_PUBLIC_NETATMO_CLIENT_ID` — obsolete OAuth (removed in v10.0)
- `NEXT_PUBLIC_NETATMO_REDIRECT_URI` — obsolete OAuth (removed in v10.0)

## Impact

All HA proxy-dependent services (Netatmo, Fritz!Box, Thermorossi, Raspberry Pi) will now work on Vercel production after the next deployment.

## Note

No code changes — this was a Vercel dashboard/CLI configuration fix. A redeploy is needed for the new env vars to take effect.
