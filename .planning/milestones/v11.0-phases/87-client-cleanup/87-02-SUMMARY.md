---
phase: 87
plan: 02
subsystem: docs
tags: [documentation, env-vars, netatmo, ha-proxy]
dependency_graph:
  requires: [86-02]
  provides: [API-10 docs complete]
  affects: [docs/deployment.md, docs/setup/netatmo-setup.md, docs/api-routes.md, docs/camera-proxy-requirements.md]
tech_stack:
  added: []
  patterns: []
key_files:
  created: []
  modified:
    - docs/deployment.md
    - docs/setup/netatmo-setup.md
    - docs/api-routes.md
    - docs/camera-proxy-requirements.md
decisions:
  - "No structural changes — env var name replacements and section header renames only"
  - "camera-proxy-requirements.md only needed one line change (line 8); rest of file is accurate bug-tracking content"
metrics:
  duration: 4 minutes
  completed: 2026-03-17T16:06:00Z
  tasks_completed: 2
  files_modified: 4
---

# Phase 87 Plan 02: Docs Env Var Cleanup Summary

**One-liner:** Replace all NETATMO_PROXY_URL/NETATMO_PROXY_API_KEY references in four docs files with HA_API_URL/HA_API_KEY to match the v10.0 proxy migration.

## Tasks Completed

| # | Name | Commit | Files |
|---|------|--------|-------|
| 1 | Update deployment.md — replace Netatmo Proxy section with HA Proxy | 9081a00 | docs/deployment.md |
| 2 | Update netatmo-setup.md, api-routes.md, and camera-proxy-requirements.md | dc70aee | docs/setup/netatmo-setup.md, docs/api-routes.md, docs/camera-proxy-requirements.md |

## What Was Done

Four documentation files retained stale NETATMO_PROXY_URL / NETATMO_PROXY_API_KEY references after Phases 85-86 migrated the code to the shared HA proxy (haClient.ts). This plan performed surgical text replacements:

- **docs/deployment.md**: Section comment and two env vars updated
- **docs/setup/netatmo-setup.md**: Quick setup block, architecture diagram, and troubleshooting table (4 references) updated
- **docs/api-routes.md**: "Netatmo Proxy" section renamed to "HA Proxy (Netatmo + Fritz!Box)" and env vars updated
- **docs/camera-proxy-requirements.md**: Single line 8 reference updated

## Verification

```
grep -r "NETATMO_PROXY_URL|NETATMO_PROXY_API_KEY" docs/ → NO_STALE_REFS
grep -r "HA_API_URL" docs/deployment.md docs/setup/netatmo-setup.md docs/api-routes.md docs/camera-proxy-requirements.md → matches in all four files
```

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- docs/deployment.md: confirmed (HA_API_URL present, NETATMO_PROXY_URL absent)
- docs/setup/netatmo-setup.md: confirmed (HA_API_URL present, NETATMO_PROXY_URL absent)
- docs/api-routes.md: confirmed (HA_API_URL present, NETATMO_PROXY_URL absent)
- docs/camera-proxy-requirements.md: confirmed (HA_API_URL present, NETATMO_PROXY_URL absent)
- Commit 9081a00: present
- Commit dc70aee: present
