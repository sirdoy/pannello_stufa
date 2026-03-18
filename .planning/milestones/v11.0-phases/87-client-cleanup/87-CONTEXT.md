# Phase 87: Client Cleanup - Context

**Gathered:** 2026-03-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Delete old Fritz!Box and Netatmo client modules after migration verified. Clean up any stale references to pre-migration env vars, credentials, and setup instructions.

**Reality check:** Both `fritzboxClient.ts` (Phase 85) and `netatmoProxy.ts` (Phase 86) were migrated **in-place** — their internals now call `haGet`/`haPost` from `haClient.ts`, but the files themselves still exist as provider-specific convenience wrapper modules. Routes import from these wrappers. The "old" modules ARE the current modules — they cannot be deleted without breaking all Fritz!Box and Netatmo routes.

**Adjusted scope:** The cleanup work is:
1. Verify no dead exports/functions remain in migrated wrapper files
2. Update documentation that still references old env vars and setup procedures
3. Confirm `envValidator.ts` no longer checks removed env vars
4. Delete any truly orphaned files (if found)
5. Ensure all tests pass after cleanup

</domain>

<decisions>
## Implementation Decisions

### Cleanup scope
- Do NOT delete `lib/fritzbox/fritzboxClient.ts` or `lib/netatmoProxy.ts` — they are active provider-specific wrappers needed by 27+ route files
- Focus on: documentation cleanup, dead export verification, stale reference removal
- Run knip on affected files to detect unused exports (established pattern from v5.1)
- If knip finds dead exports in wrapper files, remove them

### Documentation updates
- Update `docs/deployment.md` — remove NETATMO_PROXY_URL/NETATMO_PROXY_API_KEY references, document HA_API_URL/HA_API_KEY
- Update `docs/setup/netatmo-setup.md` — remove old proxy setup instructions, update to shared HA proxy config
- Update `docs/api-routes.md` — remove old env var references
- Update `docs/camera-proxy-requirements.md` — remove stale proxy URL references
- Verify `.env.example` is accurate (confirmed: already updated in Phase 86)

### Dead code verification
- Check `lib/fritzbox/fritzboxErrors.ts` for JWT-specific error factories that are no longer reachable
- Check `lib/fritzbox/index.ts` barrel for exports that no longer exist in fritzboxClient.ts
- Check `lib/envValidator.ts` for any remaining checks on removed env vars
- Run `npx knip --include exports` on affected modules

### Claude's Discretion
- Whether to consolidate documentation files or just update in-place
- Exact wording of updated setup instructions
- Whether to add a note about the migration history in docs or keep docs clean

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Shared transport (Phase 84)
- `lib/haClient.ts` — Shared `haGet<T>` and `haPost<T>` with X-API-Key auth
- `types/haClient.ts` — `RFC9457ProblemDetail` and `HaRequestOptions` types

### Migrated client files (still in use)
- `lib/fritzbox/fritzboxClient.ts` — Fritz!Box convenience wrappers (migrated Phase 85, uses haGet)
- `lib/fritzbox/index.ts` — Barrel exports for Fritz!Box module
- `lib/fritzbox/fritzboxErrors.ts` — Fritz!Box error factories (may have dead JWT-related methods)
- `lib/netatmoProxy.ts` — Netatmo convenience wrappers (migrated Phase 86, uses haGet/haPost)
- `types/netatmoProxy.ts` — Netatmo proxy response types

### Documentation to update
- `docs/deployment.md` — Still references old env vars
- `docs/setup/netatmo-setup.md` — Still references old proxy setup
- `docs/api-routes.md` — Still references old env vars
- `docs/camera-proxy-requirements.md` — Still references old proxy URL
- `docs/api/README.md` — HA proxy API overview (reference for updated docs)

### Env validation
- `lib/envValidator.ts` — Must not reference removed env vars

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `knip` — Dead code analysis tool, already configured (used extensively in v5.1 Phase 48)
- `docs/api/README.md` — Already has correct HA proxy documentation (written Phase 84)

### Established Patterns
- In-place migration: Both Phase 85 and 86 rewrote internals while keeping public API stable
- Documentation follows Markdown format in `docs/` directory
- `.env.example` tracks environment variable placeholders

### Integration Points
- 10 Fritz!Box route files import from `lib/fritzbox/index.ts`
- 20 Netatmo route files import from `lib/netatmoProxy.ts`
- `lib/envValidator.ts` validates env vars at startup
- `lib/healthMonitoring.ts` may reference provider-specific health checks

</code_context>

<specifics>
## Specific Ideas

No specific requirements — straightforward cleanup of stale documentation and dead code verification after in-place migrations in Phases 85-86.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 87-client-cleanup*
*Context gathered: 2026-03-17*
