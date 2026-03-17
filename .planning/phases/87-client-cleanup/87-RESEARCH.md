# Phase 87: Client Cleanup - Research

**Researched:** 2026-03-17
**Domain:** Documentation cleanup, dead code verification, stale env var reference removal
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Do NOT delete `lib/fritzbox/fritzboxClient.ts` or `lib/netatmoProxy.ts` — they are active provider-specific wrappers needed by 27+ route files
- Focus on: documentation cleanup, dead export verification, stale reference removal
- Run knip on affected files to detect unused exports (established pattern from v5.1)
- If knip finds dead exports in wrapper files, remove them
- Update `docs/deployment.md` — remove NETATMO_PROXY_URL/NETATMO_PROXY_API_KEY references, document HA_API_URL/HA_API_KEY
- Update `docs/setup/netatmo-setup.md` — remove old proxy setup instructions, update to shared HA proxy config
- Update `docs/api-routes.md` — remove old env var references
- Update `docs/camera-proxy-requirements.md` — remove stale proxy URL references
- Verify `.env.example` is accurate (confirmed: already updated in Phase 86)
- Check `lib/fritzbox/fritzboxErrors.ts` for JWT-specific error factories that are no longer reachable
- Check `lib/fritzbox/index.ts` barrel for exports that no longer exist in fritzboxClient.ts
- Check `lib/envValidator.ts` for any remaining checks on removed env vars
- Run `npx knip --include exports` on affected modules

### Claude's Discretion
- Whether to consolidate documentation files or just update in-place
- Exact wording of updated setup instructions
- Whether to add a note about the migration history in docs or keep docs clean

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| API-10 | Old client modules deleted after migration verified | Research confirms neither fritzboxClient.ts nor netatmoProxy.ts can be deleted (they are still active wrappers). "Deletion" in practice means: removing dead exports within those files, cleaning stale references in docs, and verifying envValidator has no old env var checks. All other API-10 sub-goals are met by documentation and dead-code cleanup. |
</phase_requirements>

---

## Summary

Phase 87 is a documentation and dead-code cleanup phase following the in-place migrations in Phases 85 (Fritz!Box) and 86 (Netatmo). Neither `fritzboxClient.ts` nor `netatmoProxy.ts` was deleted — their internal implementations were rewritten to delegate to `haGet`/`haPost` from `haClient.ts`, but the files remain as active provider-specific wrappers.

The actual work divides into three areas: (1) documentation updates to remove stale `NETATMO_PROXY_URL` / `NETATMO_PROXY_API_KEY` env var references from four `docs/` files; (2) dead export verification in the Fritz!Box lib module using knip; (3) a final verification pass (tsc + tests) to confirm nothing broke. The envValidator is already clean — it references `HA_API_URL` and `HA_API_KEY` throughout, and tests confirm this.

**Primary recommendation:** Split into two plans — Plan 1 updates all four documentation files; Plan 2 runs knip analysis and removes any dead exports found in `lib/fritzbox/fritzboxErrors.ts` or `lib/fritzbox/index.ts`.

---

## Standard Stack

### Core (already in project — no new installs needed)
| Tool | Purpose | Status |
|------|---------|--------|
| knip | Dead export detection | Already installed, used in Phase 48 |
| tsc (via `npx tsc --noEmit`) | Type-check after changes | Standard check |
| Jest | Test suite verification | `npm test` |

**Installation:** None required — all tools already in the project.

---

## Architecture Patterns

### Current State of Each File

**`lib/envValidator.ts`** — ALREADY CLEAN
- `validateHealthMonitoringEnv()`: lists `HA_API_URL` and `HA_API_KEY` as optional vars
- `validateNetatmoEnv()`: checks `HA_API_URL` and `HA_API_KEY` only
- Tests in `__tests__/lib/envValidator.test.ts` confirm no old env var references
- No action needed

**`lib/fritzbox/fritzboxClient.ts`** — ACTIVE, CLEAN
- 6 exported functions, all used by Fritz!Box routes
- No JWT login code, no old credentials
- No action needed

**`lib/fritzbox/fritzboxErrors.ts`** — VERIFY NEEDED
- Exports `FRITZBOX_ERROR_CODES` object with three fields
- All three fields re-export from `@/lib/core/apiErrors` (`TR064_NOT_ENABLED`, `FRITZBOX_TIMEOUT`, `FRITZBOX_NOT_CONFIGURED`)
- No JWT-specific error factories found — this file is already clean post-migration
- The export is used by `lib/fritzbox/index.ts` barrel

**`lib/fritzbox/index.ts`** — VERIFY NEEDED
- Barrel exports: `fritzboxClient`, `getCachedData`, `invalidateCache`, `CACHE_TTL_MS`, `checkRateLimitFritzBox`, `FRITZBOX_RATE_LIMIT`, `FRITZBOX_ERROR_CODES`, `logDeviceEvent`, `getDeviceEvents`, `getDeviceStates`, `updateDeviceStates`
- These are all live exports from their respective modules
- Knip should confirm whether any of these are unused across the codebase

**`lib/netatmoProxy.ts`** — ACTIVE, CLEAN
- 14 exported wrapper functions
- Uses `haGet`/`haPost` throughout (except binary endpoint which reads env vars directly)
- Binary endpoint already reads `HA_API_URL`/`HA_API_KEY` — no old vars

**`.env.example`** — ALREADY CLEAN
- Lines 32-33: `HA_API_URL` and `HA_API_KEY` only — confirmed correct

### Documentation Files Requiring Updates

**`docs/deployment.md`** — STALE
- Line 33-34: `NETATMO_PROXY_URL` and `NETATMO_PROXY_API_KEY` listed under "# Netatmo Proxy" section
- Must be replaced with `HA_API_URL` and `HA_API_KEY` under a "# HA Proxy" section

**`docs/setup/netatmo-setup.md`** — STALE
- Lines 9-13: Quick Setup section instructs adding `NETATMO_PROXY_URL` and `NETATMO_PROXY_API_KEY` to `.env.local`
- Lines 24-26: Architecture diagram shows `App → NETATMO_PROXY_URL (local network) → Netatmo Cloud`
- Lines 57-64: Troubleshooting table references `NETATMO_PROXY_URL missing` and `NETATMO_PROXY_API_KEY missing` errors
- Must update all three locations to use `HA_API_URL` / `HA_API_KEY`

**`docs/api-routes.md`** — STALE
- Lines 144-154: "Netatmo Proxy" section with `NETATMO_PROXY_URL` and `NETATMO_PROXY_API_KEY` code block
- This section should be updated to reference `HA_API_URL`/`HA_API_KEY` and point to the correct setup guide

**`docs/camera-proxy-requirements.md`** — PARTIALLY STALE
- Line 8: References "The Netatmo proxy (`NETATMO_PROXY_URL`)"
- This is an issue-tracking file describing current/pending proxy-side camera bugs
- The reference to the old env var name should be updated, but the file's content otherwise remains valid (it documents proxy-side work that still needs to happen)

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| Dead export detection | Custom grep scripts | `npx knip --include exports` |
| Type safety after changes | Manual review | `npx tsc --noEmit` |

---

## Common Pitfalls

### Pitfall 1: Over-updating docs/camera-proxy-requirements.md
**What goes wrong:** Rewriting the camera-proxy-requirements.md file as if it's general docs — it's a bug-tracking file that remains valid except for the env var name on line 8.
**How to avoid:** Update only the `NETATMO_PROXY_URL` name reference; leave the bug descriptions and options intact.

### Pitfall 2: Assuming knip finds nothing and skipping the verification
**What goes wrong:** Skipping the knip run because the files look clean; leaving a dead export or barrel entry undetected.
**How to avoid:** Always run `npx knip --include exports` — even if fritzboxErrors.ts looks clean, barrel entries in index.ts may be unused.

### Pitfall 3: Breaking envValidator tests by changing something unrelated
**What goes wrong:** Touching envValidator.ts when it's already clean, potentially introducing a regression.
**How to avoid:** Do not touch `lib/envValidator.ts` — it is confirmed clean. Only update docs.

### Pitfall 4: .planning files containing old env var names
**What goes wrong:** Historical .planning files (old SUMMARY.md, PLAN.md files from v10.0) still reference `NETATMO_PROXY_URL`. These should NOT be updated — they are historical records.
**How to avoid:** Only update files in `docs/` — not `.planning/` subdirectories.

---

## Code Examples

### Correct env var names post-migration
```bash
# .env.local (current — already in .env.example)
HA_API_URL=https://your-ha-proxy-host
HA_API_KEY=your-ha-api-key
```

### Replacement pattern for netatmo-setup.md Quick Setup section
```bash
# Configure HA proxy credentials in .env.local:
HA_API_URL=http://your-homeassistant-host:port
HA_API_KEY=your-proxy-api-key
```

### Architecture diagram update for netatmo-setup.md
```
# Old:
App → NETATMO_PROXY_URL (local network) → Netatmo Cloud

# New:
App → HA_API_URL/api/v1/netatmo (local network) → Netatmo Cloud
```

### Knip command for dead export analysis
```bash
npx knip --include exports
```

---

## State of the Art

| Old Reference | Current State | Changed | Notes |
|---------------|---------------|---------|-------|
| `NETATMO_PROXY_URL` | `HA_API_URL` | Phase 86 | Docs not yet updated |
| `NETATMO_PROXY_API_KEY` | `HA_API_KEY` | Phase 86 | Docs not yet updated |
| JWT login in fritzboxClient | Deleted | Phase 85 | No remnants found |
| netatmoProxyGet/netatmoProxyPost | Deleted | Phase 86 | Replaced by haGet/haPost |

---

## Open Questions

1. **Does knip flag any exports in lib/fritzbox/index.ts or fritzboxErrors.ts as unused?**
   - What we know: All exports look active based on code inspection
   - What's unclear: Whether any barrel export has zero usages across the codebase
   - Recommendation: Run knip as the first task of Plan 2; if nothing found, Plan 2 is trivially fast (tsc + tests only)

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest |
| Config file | `jest.config.ts` |
| Quick run command | `npm test -- --testPathPattern="envValidator|netatmoProxy|fritzbox" --no-coverage` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| API-10 | envValidator references HA_API_URL/HA_API_KEY only | unit | `npm test -- --testPathPattern="envValidator" --no-coverage` | ✅ `__tests__/lib/envValidator.test.ts` |
| API-10 | netatmoProxy sends X-API-Key header | unit | `npm test -- --testPathPattern="netatmoProxy" --no-coverage` | ✅ `__tests__/lib/netatmoProxy.test.ts` |
| API-10 | tsc passes after documentation/dead code changes | type check | `npx tsc --noEmit` | N/A |

### Sampling Rate
- **Per task commit:** `npm test -- --testPathPattern="envValidator|netatmoProxy" --no-coverage`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
None — existing test infrastructure covers all phase requirements.

---

## Sources

### Primary (HIGH confidence)
- Direct file inspection: `lib/envValidator.ts`, `lib/fritzbox/fritzboxClient.ts`, `lib/fritzbox/fritzboxErrors.ts`, `lib/fritzbox/index.ts`, `lib/netatmoProxy.ts` — confirmed current state
- Direct file inspection: `docs/deployment.md`, `docs/setup/netatmo-setup.md`, `docs/api-routes.md`, `docs/camera-proxy-requirements.md` — confirmed stale env var locations
- Direct file inspection: `.env.example` — confirmed already clean (HA_API_URL/HA_API_KEY only)
- Direct file inspection: `__tests__/lib/envValidator.test.ts` — confirmed tests already reference new env vars

### Secondary (MEDIUM confidence)
- grep scan for `NETATMO_PROXY_URL|NETATMO_PROXY_API_KEY` across all .ts/.tsx/.md files — confirmed no live code references, only docs and historical .planning files

---

## Metadata

**Confidence breakdown:**
- Cleanup scope: HIGH — all files inspected directly; no ambiguity about what needs updating
- Documentation content: HIGH — exact line locations identified for all four doc files
- Dead code: HIGH — fritzboxErrors.ts and index.ts look clean, but knip confirmation is the correct verification step

**Research date:** 2026-03-17
**Valid until:** 2026-04-17 (stable domain — no external library dependencies)
