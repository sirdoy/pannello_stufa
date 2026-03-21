# Phase 109: Cleanup - Context

**Gathered:** 2026-03-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Delete all legacy Hue infrastructure from the codebase. After Phase 108 completed the frontend hooks rewrite, no code path should reference the old CLIP v2 local client, remote/cloud API, connection strategy, OAuth token management, bridge discovery/pairing, or Firebase bridge credentials. All Hue communication now flows through the shared HomeAssistant proxy (hueProxy.ts + haGet/haPost).

</domain>

<decisions>
## Implementation Decisions

### Deletion scope
- Delete all files explicitly listed in CLEAN-01 through CLEAN-07
- Also delete routes that only exist to serve legacy flows: discover, pair, disconnect, remote/*, callback, test
- Delete associated test files for deleted modules (hueApiScenes.test.ts, hueRemoteTokenHelper.test.ts, hueLocalHelper.test.ts, discover/__tests__)
- Delete the disabled callback route (app/api/hue/callback/route.js.disabled)

### Import chain cleanup
- Delete all import references to deleted modules in remaining files
- Verify scheduler/check/route.ts no longer needs hueApi/hueConnectionStrategy imports (should already use proxy)
- Verify scenes/[id]/activate/route.ts and scenes/create/route.ts and scenes/[id]/route.ts — if these use hueApi, they must be deleted or migrated
- app/lights/page.tsx env var references must be removed

### Env var removal
- Remove HUE_CLIENT_SECRET, NEXT_PUBLIC_HUE_CLIENT_ID, NEXT_PUBLIC_HUE_APP_ID from .env.example
- Remove any references in app/lights/page.tsx or other files

### Documentation updates
- Update docs/setup/hue-setup.md to remove bridge pairing/OAuth setup instructions
- Replace with proxy-based setup instructions (just needs HA_BASE_URL + HA_API_KEY)
- Update docs/api/hue.md if it references legacy endpoints

### Claude's Discretion
- Order of file deletion (single sweep vs grouped by module)
- Whether to update CHANGELOG.md inline or leave for version bump
- How to handle any unexpected import chains discovered during deletion

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — CLEAN-01 through CLEAN-07 define exact deletion targets

### Proxy architecture (what replaces the deleted code)
- `docs/api/hue.md` — Current proxy API reference, endpoint paths, response shapes
- `lib/hue/hueProxy.ts` — The proxy client that replaces all deleted modules

### Setup documentation
- `docs/setup/hue-setup.md` — Needs updating to remove bridge pairing instructions

</canonical_refs>

<code_context>
## Existing Code Insights

### Files to delete (CLEAN-01 through CLEAN-07)
- `lib/hue/hueApi.ts` — CLIP v2 local client (CLEAN-01)
- `lib/hue/hueRemoteApi.ts` — v1 remote/cloud client (CLEAN-02)
- `lib/hue/hueConnectionStrategy.ts` — Connection strategy (CLEAN-03)
- `lib/hue/hueRemoteTokenHelper.ts` — OAuth token management (CLEAN-05)
- `lib/hue/hueLocalHelper.ts` — Firebase bridge credentials (CLEAN-06)

### Routes to delete (bridge discovery/pairing — CLEAN-04)
- `app/api/hue/discover/route.ts` + `__tests__/`
- `app/api/hue/pair/route.ts`
- `app/api/hue/disconnect/route.ts`
- `app/api/hue/remote/authorize/route.ts`
- `app/api/hue/remote/callback/route.ts`
- `app/api/hue/remote/pair/route.ts`
- `app/api/hue/remote/disconnect/route.ts`
- `app/api/hue/callback/route.js.disabled`
- `app/api/hue/test/route.ts`

### Test files to delete
- `lib/hue/__tests__/hueApiScenes.test.ts`
- `lib/hue/__tests__/hueRemoteTokenHelper.test.ts`
- `lib/hue/__tests__/hueLocalHelper.test.ts`

### Files that import from legacy modules (need cleanup)
- `app/api/scheduler/check/route.ts` — imports from hueApi/hueConnectionStrategy
- `app/api/hue/scenes/[id]/activate/route.ts` — imports from hueApi
- `app/api/hue/scenes/create/route.ts` — imports from hueApi
- `app/api/hue/scenes/[id]/route.ts` — imports from hueApi

### Integration Points
- `.env.example` — 3 env vars to remove (HUE_CLIENT_SECRET, NEXT_PUBLIC_HUE_CLIENT_ID, NEXT_PUBLIC_HUE_APP_ID)
- `app/lights/page.tsx` — env var references to remove

</code_context>

<specifics>
## Specific Ideas

No specific requirements — this is a clear-cut deletion phase with explicit targets from REQUIREMENTS.md.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 109-cleanup*
*Context gathered: 2026-03-21*
