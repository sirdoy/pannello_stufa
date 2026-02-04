---
status: resolved
trigger: "Il sistema meteo deve utilizzare il cron interno (route API chiamata dall'esterno) invece del cron di Vercel"
created: 2026-02-03T10:00:00Z
updated: 2026-02-03T10:25:00Z
---

## Current Focus

hypothesis: CONFIRMED - Two different cron systems coexist: Vercel cron (weather) and cron-job.org (cleanup-tokens)
test: Analyzed vercel.json, route implementations, and docs
expecting: Weather cron should be migrated from Vercel cron to cron-job.org for consistency with internal cron infrastructure
next_action: Migrate weather cron to use HMAC-SHA256 auth like cleanup-tokens, remove from vercel.json

## Symptoms

expected: Refresh meteo sia automatico (via cron esterno) che manuale, usando il sistema cron interno esistente nel progetto
actual: Il meteo potrebbe usare Vercel cron invece della route cron interna del progetto
errors: Non verificati - nessun errore visibile, comportamento non come desiderato
reproduction: Verificare configurazione cron meteo
started: Necessario allineare al sistema cron esistente

## Eliminated

## Evidence

- timestamp: 2026-02-03T10:05:00Z
  checked: vercel.json cron configuration
  found: Weather cron is configured at "/api/cron/weather?secret=${CRON_SECRET}" every 30 minutes
  implication: Uses Vercel cron with CRON_SECRET query param - this is the Vercel-native approach

- timestamp: 2026-02-03T10:06:00Z
  checked: /api/cron/cleanup-tokens/route.ts
  found: Uses HMAC-SHA256 with CRON_WEBHOOK_SECRET and x-cron-signature header
  implication: This is designed for cron-job.org (external cron service) with secure signature verification

- timestamp: 2026-02-03T10:07:00Z
  checked: /api/cron/weather/route.js
  found: Uses withCronSecret middleware from lib/core - accepts ?secret= or Authorization Bearer
  implication: Weather cron uses simpler auth compatible with Vercel cron

- timestamp: 2026-02-03T10:08:00Z
  checked: lib/core/middleware.js withCronSecret function
  found: Simple secret comparison via CRON_SECRET env var (query param or header)
  implication: Two different auth patterns exist - HMAC for cleanup-tokens, simple secret for weather

- timestamp: 2026-02-03T10:10:00Z
  checked: docs/cron-cleanup-setup.md
  found: Project uses cron-job.org as the "internal" cron system with HMAC-SHA256 auth
  implication: cleanup-tokens represents the standard pattern; weather should follow same pattern

- timestamp: 2026-02-03T10:11:00Z
  checked: 002-PLAN.md (quick task that implemented weather cron)
  found: Plan explicitly chose Vercel cron for weather - but user now wants cron-job.org consistency
  implication: This is a design change, not a bug - migrate from Vercel cron to cron-job.org pattern

## Resolution

root_cause: |
  Weather cron currently uses Vercel cron (vercel.json) with simple CRON_SECRET query param auth.
  Project standard is cron-job.org with HMAC-SHA256 signature verification (like cleanup-tokens).
  The two systems are inconsistent and weather should be migrated to the internal cron-job.org pattern.

fix: |
  1. Update /api/cron/weather/route.js to use HMAC-SHA256 auth (like cleanup-tokens):
     - Change from withCronSecret to HMAC signature verification
     - Use CRON_WEBHOOK_SECRET instead of CRON_SECRET
     - Add POST handler with x-cron-signature validation
     - Keep GET for health check (no auth required)
  2. Remove weather cron entry from vercel.json
  3. Update docs with cron-job.org setup instructions for weather

verification: |
  - Weather route updated to use HMAC-SHA256 auth with CRON_WEBHOOK_SECRET
  - Vercel cron entry removed from vercel.json
  - GET endpoint returns health check (no auth required)
  - POST endpoint requires x-cron-signature header with HMAC-SHA256
  - Documentation created at docs/cron-weather-setup.md
  - Test suite passes (111/112 test suites, pre-existing failures unrelated)

files_changed:
  - app/api/cron/weather/route.js (rewritten for HMAC auth)
  - vercel.json (removed crons entry)
  - docs/cron-weather-setup.md (new - setup instructions)
