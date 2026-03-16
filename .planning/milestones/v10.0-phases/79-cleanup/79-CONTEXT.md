# Phase 79: Cleanup - Context

**Gathered:** 2026-03-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Delete all obsolete Netatmo OAuth/rate-limiting/caching infrastructure now that the local proxy handles authentication, rate limiting, and caching. Update documentation and tests to reflect proxy patterns. All Netatmo routes were migrated in Phases 75-78.

</domain>

<decisions>
## Implementation Decisions

### Dependent module fate
- `lib/netatmoStoveSync.ts` — dead code, delete entirely (proxy handles stove sync)
- `lib/netatmoApi.ts` — dead code, delete entirely (replaced by netatmoProxy.ts)
- `lib/coordinationOrchestrator.ts` — Claude's discretion: check if anything still references it, delete if dead, update if alive
- `lib/core/netatmoHelpers.ts` — Claude's discretion: same approach, delete if dead, update if alive

### NetatmoAuthCard + /netatmo page
- Delete `app/components/netatmo/NetatmoAuthCard.tsx` entirely — OAuth login UI is dead with proxy auth
- Delete `app/netatmo/page.tsx` entirely — the /netatmo route only showed the OAuth login card
- Remove OAuth fallback from `app/components/devices/thermostat/ThermostatCard.tsx` — delete getNetatmoAuthUrl import and any OAuth conditional rendering

### Documentation updates
- `docs/setup/netatmo-setup.md` — rewrite for proxy setup (NETATMO_PROXY_URL, NETATMO_API_KEY) replacing OAuth app creation instructions
- `docs/deployment.md` — update in place, replace OAuth env vars section with proxy env vars
- `.env.example` — remove 6 OAuth lines, add NETATMO_PROXY_URL and NETATMO_API_KEY entries
- `lib/envValidator.ts` — replace NETATMO_CLIENT_SECRET check with NETATMO_PROXY_URL and NETATMO_API_KEY validation

### Test strategy
- Delete all test files for deleted modules: netatmoTokenHelper, netatmoCredentials, netatmoRateLimiter, netatmoRateLimiterPersistent, netatmoApi
- coordinationOrchestrator tests: delete if module is dead, update if alive (same fate as module)
- netatmoHelpers tests: same fate as module (delete if dead, update if alive)
- Audit and fix surviving Netatmo tests for old OAuth mock patterns — update to proxy patterns
- Proactive audit, not just fix-what-breaks

### Claude's Discretion
- Determine whether coordinationOrchestrator.ts and netatmoHelpers.ts are dead or alive by checking import graph
- Handle lib/routes.ts cleanup (likely references /netatmo/callback)
- Handle lib/version.ts references to deleted modules
- Exact order of deletions to avoid intermediate broken states

</decisions>

<specifics>
## Specific Ideas

No specific requirements — straightforward deletion and update work guided by the requirements (CLEAN-01 through CLEAN-07).

</specifics>

<code_context>
## Existing Code Insights

### Files to Delete (confirmed dead)
- `lib/netatmoTokenHelper.ts` — OAuth token management (CLEAN-01)
- `lib/netatmoCredentials.ts` — OAuth credentials helper (CLEAN-02)
- `lib/netatmoRateLimiter.ts` — in-memory rate limiter (CLEAN-03)
- `lib/netatmoRateLimiterPersistent.ts` — Firebase RTDB rate limiter (CLEAN-03)
- `lib/netatmoCacheService.ts` — response caching (CLEAN-04)
- `app/api/netatmo/callback/route.ts` — OAuth callback route (CLEAN-05)
- `lib/netatmoStoveSync.ts` — old direct API stove sync
- `lib/netatmoApi.ts` — old direct Netatmo API client
- `app/components/netatmo/NetatmoAuthCard.tsx` — OAuth login UI
- `app/netatmo/page.tsx` — OAuth login page

### Files to Update
- `app/components/devices/thermostat/ThermostatCard.tsx` — remove OAuth fallback
- `lib/envValidator.ts` — replace NETATMO_CLIENT_SECRET with proxy vars
- `lib/routes.ts` — remove /netatmo/callback reference
- `.env.example` — swap OAuth vars for proxy vars
- `docs/setup/netatmo-setup.md` — rewrite for proxy
- `docs/deployment.md` — update env vars section

### Files for Claude to Determine Fate
- `lib/coordinationOrchestrator.ts` — check import graph
- `lib/core/netatmoHelpers.ts` — check import graph

### Test Files to Delete
- `__tests__/lib/netatmoTokenHelper.test.ts`
- `__tests__/lib/netatmoCredentials.test.ts`
- `__tests__/lib/netatmoRateLimiter.test.ts`
- `__tests__/lib/netatmoRateLimiterPersistent.test.ts`
- `__tests__/lib/netatmoApi.test.ts`
- `lib/__tests__/netatmoApi.test.ts`

### Established Patterns
- Proxy client: `lib/netatmoProxy.ts` with X-API-Key auth (Phase 75)
- Env vars: NETATMO_PROXY_URL, NETATMO_API_KEY already in use by proxy client
- Test mocking: proxy routes use fetch mocking, not OAuth token setup

### Integration Points
- ThermostatCard OAuth fallback removal must not break normal thermostat rendering
- envValidator changes must match what the app actually reads at runtime

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 79-cleanup*
*Context gathered: 2026-03-15*
