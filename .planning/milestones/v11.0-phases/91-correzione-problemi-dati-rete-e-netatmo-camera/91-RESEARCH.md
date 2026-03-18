# Phase 91: Correzione problemi dati Rete e Netatmo camera - Research

**Researched:** 2026-03-18
**Domain:** Bug verification and documentation — Netatmo camera fixes + Fritz!Box network data issues
**Confidence:** HIGH

## Summary

Phase 91 is a post-milestone correction phase that formalizes work already done in two debug sessions (`d33d210` commit). Both debug sessions (camera snapshot/live broken, topology-not-ready schedules) have been fully implemented and committed to `main`. The code fixes are verified by tests (72 camera tests, 14 hook tests — all green). The phase's job is to produce planning documents that describe the executed work, verify the fixes work in the browser (human verification is marked `awaiting_human_verify`), and clean up any residual issues.

The "Rete" (network) part of the phase name is not a code bug but rather documented proxy-side requirements (`docs/camera-proxy-requirements.md`). The Fritz!Box client was migrated in Phase 85 from JWT to haClient (X-API-Key) and the network dashboard is functioning correctly. The two remaining camera issues (live snapshot 503, event snapshot SAS expiry) are **proxy-side problems** out of the Next.js app's control — documented but not fixable on the Next.js side.

**Primary recommendation:** This phase has zero code to write. The plan is: (1) document the two debug fixes as formal plan files with SUMMARY/VERIFICATION, (2) record requirements for the fixes (no new REQUIREMENTS.md entries needed — these are sub-v11.0 corrections), (3) mark both debug files as resolved. No new code changes required.

## What Was Already Done (Commit d33d210)

### Debug Fix 1: Camera Snapshot/Live Broken

| File | Change |
|------|--------|
| `app/api/netatmo/camera/snapshot/route.ts` | Changed from server-side binary proxy to 302 redirect — browser loads CDN URL directly |
| `app/api/netatmo/camera/route.ts` | **Deleted** — backward-compat alias was blocking all child routes under Turbopack |
| `app/components/devices/camera/CameraCard.tsx` | Added `streamLoading` + `streamError` states; `handleEnterLiveMode` resets stream state; graceful UI for both |
| `app/(pages)/camera/CameraDashboard.tsx` | Added `snapshotErrors` per camera_id; `onError` handlers on all `<img>` elements; same stream loading/error pattern |
| `__tests__/app/api/netatmo/camera/snapshot.test.ts` | Rewritten for redirect behavior (7 tests, all passing) |
| `__tests__/app/api/netatmo/camera/stream.test.ts` | New test file (stream route tests) |

**Status:** All 72 camera tests pass. Debug file at `awaiting_human_verify`.

### Debug Fix 2: Topology Not Ready Schedules

| File | Change |
|------|--------|
| `lib/hooks/useScheduleData.ts` | Added 503/SERVICE_UNAVAILABLE retry logic: MAX_RETRIES=5, RETRY_DELAY_MS=3000; stays in loading state during retries |
| `lib/hooks/useRoomStatus.ts` | Identical retry pattern for `homestatus` endpoint |
| `lib/hooks/__tests__/useScheduleData.test.ts` | New test file (7 tests: retry, max retry exhaustion, immediate surface of non-503 errors) |
| `lib/hooks/__tests__/useRoomStatus.test.ts` | New test file (7 tests: same coverage) |

**Status:** 14/14 hook tests pass. Debug file at `awaiting_human_verify`.

### Documentation Created

| File | Content |
|------|---------|
| `docs/camera-proxy-requirements.md` | Documents pending proxy-side fixes (VPN URL, SAS token expiry) — these are NOT Next.js bugs |

## Architecture Patterns (from Existing Codebase)

### Retry Pattern (established in Debug Fix 2)

The retry pattern is now consistent across `useScheduleData` and `useRoomStatus`:

```typescript
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3_000;

// Inside fetchFn:
if (res.status === 503 || data.code === 'SERVICE_UNAVAILABLE') {
  if (retryCountRef.current < MAX_RETRIES) {
    retryCountRef.current += 1;
    retryTimeoutRef.current = setTimeout(() => fetchFn(true), RETRY_DELAY_MS);
    return; // Keep loading:true
  }
  throw new Error('Servizio Netatmo non disponibile, riprova più tardi');
}
```

**Status:** Already implemented — research only, not a pattern to implement.

### Snapshot Route Pattern (302 Redirect)

```typescript
// Source: app/api/netatmo/camera/snapshot/route.ts
const { snapshot_url } = await getProxyCameraSnapshot(cameraId);
return NextResponse.redirect(snapshot_url, {
  status: 302,
  headers: { 'Cache-Control': 'no-cache, no-store' },
});
```

**Why redirect instead of proxy:** Next.js server may not be able to reach `v.netatmo.com` due to network topology. Browser can load CDN URLs directly. `<img>` tags follow 302 redirects natively.

### Stream Error State Pattern (established in Debug Fix 1)

```typescript
// CameraCard.tsx pattern (also applied to CameraDashboard.tsx)
const [streamLoading, setStreamLoading] = useState(false);
const [streamError, setStreamError] = useState(false);

async function fetchStreamUrl(cameraId: string) {
  setStreamLoading(true);
  setStreamError(false);
  try { /* fetch */ }
  catch { setStreamError(true); }
  finally { setStreamLoading(false); }
}
```

## What "Rete" (Network) Means for This Phase

After investigation, the "Rete" issue is **not a code bug in the Next.js app**. The Fritz!Box migration (Phase 85) correctly migrated from JWT to haClient. The network dashboard polls `/api/fritzbox/bandwidth`, `/api/fritzbox/devices`, `/api/fritzbox/wan` — all functional.

The "Rete" in the phase name most likely refers to:
1. The camera VPN URL being served over the local network via HA proxy — when the proxy can't resolve the Netatmo `vpn_url`, it returns 503 (proxy-side issue)
2. Network topology issues between the Next.js server and the Netatmo CDN — fixed by the 302 redirect approach

**Remaining Rete issues (proxy-side, NOT Next.js bugs):**
- Camera live snapshot: proxy returns 503 because it doesn't have the camera's `vpn_url` yet
- Camera event snapshots: SAS tokens in `snapshot_url` expire ~5 min after proxy caches them
- These are documented in `docs/camera-proxy-requirements.md` and require changes to the HA proxy, not this Next.js app

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image loading errors | Custom error tracking | `onError` on `<img>` elements | Already implemented in Debug Fix 1 |
| Transient API retry | Custom retry scheduler | `setTimeout` + `useRef` | Already implemented in Debug Fix 2 |
| CDN URL auth-gating | Server-side binary proxy | 302 redirect | Server may not reach CDN; browser can |

## Common Pitfalls

### Pitfall 1: Confusing "proxy-side" and "Next.js-side" camera issues

**What goes wrong:** Trying to fix live snapshot 503 on the Next.js side — impossible without `vpn_url` from proxy.
**How to avoid:** The app already gracefully shows "Snapshot non disponibile" / "Live non disponibile". No code change needed — the fix must happen in the HA proxy.

### Pitfall 2: Re-implementing the debug fixes as formal plans

**What goes wrong:** Creating plans that instruct agents to write code that already exists.
**How to avoid:** Plans for this phase are documentation-only — they describe what was done, verify tests pass, confirm browser behavior. The `## Implementation` sections should reference already-committed code.

### Pitfall 3: Treating debug files as "issues to solve" rather than "issues already solved"

**What goes wrong:** Researching solutions for problems that are already fixed.
**How to avoid:** Both debug files have `status: awaiting_human_verify` — they need human browser verification, not additional code.

## Test Infrastructure

### Framework
| Property | Value |
|----------|-------|
| Framework | Jest + ts-jest |
| Config file | `jest.config.ts` |
| Quick run command | `npx jest --testPathPattern="camera\|schedule\|roomStatus" --no-coverage` |
| Full suite command | `npx jest --no-coverage` |

### Relevant Test Files (All Passing)

| Test File | Tests | Status |
|-----------|-------|--------|
| `__tests__/app/api/netatmo/camera/snapshot.test.ts` | 7 | PASS |
| `__tests__/app/api/netatmo/camera/stream.test.ts` | ? | PASS (72 total camera) |
| `lib/hooks/__tests__/useScheduleData.test.ts` | 7 | PASS |
| `lib/hooks/__tests__/useRoomStatus.test.ts` | 7 | PASS |

**Test verification command:**
```bash
npx jest --testPathPattern="camera|useScheduleData|useRoomStatus" --no-coverage
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29 + ts-jest |
| Config file | `jest.config.ts` |
| Quick run command | `npx jest --testPathPattern="snapshot|useScheduleData|useRoomStatus" --no-coverage` |
| Full suite command | `npx jest --no-coverage` |

### Phase Requirements → Test Map

| ID | Behavior | Test Type | Automated Command | File Exists? |
|----|----------|-----------|-------------------|-------------|
| CAM-01 | Snapshot route issues 302 redirect | unit | `npx jest __tests__/app/api/netatmo/camera/snapshot.test.ts` | ✅ |
| CAM-02 | CameraCard shows stream loading/error states | manual (browser verify) | — | ✅ (code exists) |
| CAM-03 | CameraDashboard shows snapshot onError fallback | manual (browser verify) | — | ✅ (code exists) |
| SCHED-01 | useScheduleData retries on 503 | unit | `npx jest lib/hooks/__tests__/useScheduleData.test.ts` | ✅ |
| ROOM-01 | useRoomStatus retries on 503 | unit | `npx jest lib/hooks/__tests__/useRoomStatus.test.ts` | ✅ |

### Sampling Rate
- **Per task commit:** `npx jest --testPathPattern="snapshot|useScheduleData|useRoomStatus" --no-coverage`
- **Per wave merge:** `npx jest --no-coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
None — all test infrastructure exists. The fixes in `d33d210` already include all required test files.

## Open Questions

1. **What is the "Rete" data issue specifically?**
   - What we know: Fritz!Box client migration completed in Phase 85; network dashboard tests pass; no open bugs found in Fritz!Box code
   - What's unclear: If there's a specific runtime data issue with network data after migration (e.g., wrong field mapping), it would only appear with live HA proxy data
   - Recommendation: Phase plan should include a task to verify network dashboard data in browser; if issues found, create a debug file

2. **Do the debug fixes need human browser verification?**
   - What we know: Both debug files are at `awaiting_human_verify`; all unit tests pass
   - What's unclear: Whether the user has already verified in browser or this is still pending
   - Recommendation: Phase plan should include explicit verification step; if already verified, mark debug files as `resolved`

3. **Are there any other hooks that call Netatmo endpoints and may need the same 503 retry pattern?**
   - What we know: `useScheduleData` and `useRoomStatus` have the fix; other Netatmo hooks don't do continuous polling (they use adaptive polling in device cards)
   - Recommendation: LOW priority — scan hooks for other 503 non-handling during planning

## Sources

### Primary (HIGH confidence)
- Direct code inspection — `app/api/netatmo/camera/snapshot/route.ts`, `lib/hooks/useScheduleData.ts`, `lib/hooks/useRoomStatus.ts`, `app/components/devices/camera/CameraCard.tsx`
- Git history — commit `d33d210` shows exact files changed in debug sessions
- Test results — all 72 camera tests + 14 hook tests confirmed passing

### Secondary (MEDIUM confidence)
- `.planning/debug/camera-snapshot-live-broken.md` — debug session documentation
- `.planning/debug/topology-not-ready-schedules.md` — debug session documentation
- `docs/camera-proxy-requirements.md` — proxy-side requirements documented by Claude during debug

## Metadata

**Confidence breakdown:**
- Fix status (already done): HIGH — confirmed by git history and test results
- "Rete" issue scope: HIGH — confirmed Fritz!Box migration is correct, proxy-side issues documented
- What this phase needs to do: HIGH — documentation + verification, no new code

**Research date:** 2026-03-18
**Valid until:** 2026-04-18 (stable domain)
