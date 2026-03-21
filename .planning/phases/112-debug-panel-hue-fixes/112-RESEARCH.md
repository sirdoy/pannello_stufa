# Phase 112: Debug Panel Hue Fixes - Research

**Researched:** 2026-03-21
**Domain:** Debug panel UI — HueTab component (two locations)
**Confidence:** HIGH

## Summary

Phase 112 is a targeted bug-fix phase with precisely defined scope. The v14.0 milestone audit (`MILESTONE-AUDIT.md`) documented three tech-debt items in the debug panel's `HueTab` component. These items were intentionally deferred from the migration phases because they affect `/debug` only — not production user flows, which are all correct and tested.

The three issues are: (1) the "Activate Scene" card calls the deleted route `/api/hue/scenes/${sceneId}/activate` instead of the new path `/api/hue/groups/${groupId}/scenes/${sceneId}`; (2) "Control Light" and "Control Room" cards call `callPostEndpoint` which issues `method: 'POST'` but the routes `/api/hue/lights/[id]` and `/api/hue/rooms/[id]` only export `PUT` handlers, returning 405; (3) the display `url` label for "Activate Scene" is still `/api/hue/scenes/[id]/activate` (stale).

Both HueTab files are identical byte-for-byte (`app/debug/components/tabs/HueTab.tsx` and `app/debug/api/components/tabs/HueTab.tsx`). Both must be updated identically. The `ApiTab` utility component (`PostEndpointCard`) hard-codes `method: 'POST'` — the fix requires adding a `callPutEndpoint` helper (or a `method` parameter) in `HueTab`, not modifying the shared `ApiTab` component.

**Primary recommendation:** Add `callPutEndpoint` function to HueTab (mirror of `callPostEndpoint` with `method: 'PUT'`), fix the scene activation `onExecute` to pass both `groupId` and `sceneId`, update the stale `url` display label, and update both HueTab files identically.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React `useState`/`useEffect` | 18.x (project standard) | Local state and side effects in HueTab | Already used in both HueTab files |
| `fetch` API | Browser native | HTTP calls to Next.js API routes | Already used in `callPostEndpoint` |

No new dependencies required. This phase touches only existing components.

## Architecture Patterns

### Recommended Project Structure

No structural changes. Both files are at:

```
app/debug/components/tabs/HueTab.tsx          # /debug page
app/debug/api/components/tabs/HueTab.tsx      # /debug/api page
```

### Pattern 1: PUT vs POST method dispatch in HueTab

**What:** The `callPostEndpoint` function always uses `method: 'POST'`. Light and room control routes export `PUT` only. The fix is to add a `callPutEndpoint` function that mirrors `callPostEndpoint` with `method: 'PUT'`.

**When to use:** Any route that only handles PUT (lights/[id], rooms/[id]).

**Example — current broken pattern:**
```typescript
// WRONG: sends POST, route only accepts PUT → 405
onExecute={(values) =>
  callPostEndpoint('controlLight', `/api/hue/lights/${values.lightId}`, {
    on: values.on === 'true',
    brightness: values.brightness,
  })
}
```

**Example — correct pattern after fix:**
```typescript
// CORRECT: sends PUT
onExecute={(values) =>
  callPutEndpoint('controlLight', `/api/hue/lights/${values.lightId}`, {
    on: values.on === 'true',
    brightness: values.brightness,
  })
}
```

**callPutEndpoint implementation:**
```typescript
const callPutEndpoint = async (name: string, url: string, body: any) => {
  setLoadingPost((prev) => ({ ...prev, [name]: true }));
  const startTime = Date.now();
  try {
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    const timing = Date.now() - startTime;
    setTimings((prev) => ({ ...prev, [name]: timing }));
    setPostResponses((prev) => ({ ...prev, [name]: data }));
    if (res.ok) {
      setTimeout(fetchAllGetEndpoints, 1000);
    }
  } catch (error) {
    setPostResponses((prev) => ({ ...prev, [name]: { error: error instanceof Error ? error.message : String(error) } }));
  } finally {
    setLoadingPost((prev) => ({ ...prev, [name]: false }));
  }
};
```

### Pattern 2: Scene activation — new path requires groupId

**What:** The deleted route was `/api/hue/scenes/${sceneId}/activate` (no groupId). The new route is `POST /api/hue/groups/${groupId}/scenes/${sceneId}`. The debug card must collect both `groupId` and `sceneId` from the user.

**Current broken state (line 227-236 in both files):**
```typescript
// url label is stale
url="/api/hue/scenes/[id]/activate"
// onExecute calls deleted route
onExecute={(values) => callPostEndpoint('activateScene', `/api/hue/scenes/${values.sceneId}/activate`, {})}
// params only has sceneId — missing groupId
params={[{ name: 'sceneId', label: 'Scene ID', type: 'text', defaultValue: '' }]}
```

**After fix:**
```typescript
url="/api/hue/groups/[groupId]/scenes/[sceneId]"
params={[
  { name: 'groupId', label: 'Group ID', type: 'text', defaultValue: '' },
  { name: 'sceneId', label: 'Scene ID', type: 'text', defaultValue: '' },
]}
onExecute={(values) =>
  callPostEndpoint('activateScene', `/api/hue/groups/${values.groupId}/scenes/${values.sceneId}`, {})
}
```

Scene activation correctly remains `POST` (route exports `POST` at `/api/hue/groups/[groupId]/scenes/[sceneId]/route.ts`).

### Pattern 3: Keep both HueTab files in sync

**What:** The two HueTab files are currently byte-for-byte identical. Both must receive the same changes. One is rendered at `/debug` (imports from `@/app/debug/components/ApiTab`) and the other at `/debug/api` (imports from `../ApiTab` — relative). Import paths differ; all other code is identical.

**Approach:** Edit both files with the same logical changes. The import statement at line 4 must NOT be changed — it is correct in each file for its location.

### Anti-Patterns to Avoid

- **Modifying `PostEndpointCard` in `ApiTab.tsx` to accept a `method` prop:** This touches a shared component used across all debug tabs. Not necessary — adding `callPutEndpoint` to `HueTab` is simpler and scoped.
- **Creating a new `PutEndpointCard` component in `ApiTab.tsx`:** Same concern. The `PostEndpointCard` badge says "POST" which would then be misleading for PUT callers. The cleanest solution is keeping the dispatch logic in `HueTab` itself.
- **Changing only one of the two HueTab files:** Both files must be updated or the two debug pages diverge.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PUT fetch call | Custom abstraction layer | Copy `callPostEndpoint`, change `method` to `'PUT'` | Existing pattern in file; minimal change |
| Route URL for scene activation | Guessing the path | Read from `app/api/hue/groups/[groupId]/scenes/[sceneId]/route.ts` | Route is confirmed: `POST` handler exports at that path |

## Common Pitfalls

### Pitfall 1: Forgetting the second HueTab file

**What goes wrong:** Developer edits `app/debug/components/tabs/HueTab.tsx` and forgets `app/debug/api/components/tabs/HueTab.tsx`.
**Why it happens:** Two separate debug surfaces (`/debug` and `/debug/api`) each have their own copy.
**How to avoid:** The plan must list both file paths explicitly as separate edit tasks.
**Warning signs:** After fix, `/debug` works but `/debug/api` still shows 405 / stale URL.

### Pitfall 2: Treating scene activation as PUT

**What goes wrong:** Developer looks at the "POST Endpoints" heading in HueTab and wonders whether scene activation should become PUT (since other control routes are PUT).
**Why it happens:** Light control = PUT, room control = PUT, scene activation = POST. This is correct — the route at `/api/hue/groups/[groupId]/scenes/[sceneId]/route.ts` exports only `POST`.
**How to avoid:** Check the actual route file — confirmed POST.

### Pitfall 3: Changing the import path in either HueTab

**What goes wrong:** Normalising the import to an absolute path `@/app/debug/components/ApiTab` in both files — this breaks the `debug/api` version which is in a different subdirectory.
**Why it happens:** The files look identical and the developer tries to normalise them.
**How to avoid:** Leave imports unchanged; they are already correct for each file's location.

### Pitfall 4: Not updating the `url` display label

**What goes wrong:** The `onExecute` is fixed but the `url="/api/hue/scenes/[id]/activate"` label on the card still shows the old path.
**Why it happens:** The label is a separate prop from the actual URL in `onExecute`.
**How to avoid:** The audit itemised this as a separate item: "HueTab display URL labels stale (line 227 still shows /api/hue/scenes/[id]/activate)".

## Code Examples

### Correct route method verification

```typescript
// Source: app/api/hue/lights/[id]/route.ts
export const PUT = withAuthAndErrorHandler(async (request, context) => { ... }, 'Hue/Light/Update');
// No POST export → POST returns 405

// Source: app/api/hue/rooms/[id]/route.ts
export const PUT = withAuthAndErrorHandler(async (request, context) => { ... }, 'Hue/Room/Update');
// No POST export → POST returns 405

// Source: app/api/hue/groups/[groupId]/scenes/[sceneId]/route.ts
export const POST = withAuthAndErrorHandler(async (_request, context) => { ... }, 'Hue/Scene/Activate');
// No PUT export — scene activation is POST
```

### Full change summary per file

Three logical changes, applied to both files:

1. **Add `callPutEndpoint`** — copy of `callPostEndpoint` with `method: 'PUT'` instead of `'POST'`
2. **"Control Light" card** — change `callPostEndpoint` → `callPutEndpoint` in `onExecute`
3. **"Control Room" card** — change `callPostEndpoint` → `callPutEndpoint` in `onExecute`
4. **"Activate Scene" card** — three sub-changes:
   - `url` prop: `/api/hue/scenes/[id]/activate` → `/api/hue/groups/[groupId]/scenes/[sceneId]`
   - `params` array: add `groupId` field before `sceneId`
   - `onExecute`: path `/api/hue/scenes/${values.sceneId}/activate` → `/api/hue/groups/${values.groupId}/scenes/${values.sceneId}`

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest + React Testing Library |
| Config file | `jest.config.ts` |
| Quick run command | `npm test -- --testPathPattern="HueTab" --watchAll=false` |
| Full suite command | `npm test -- --watchAll=false` |

### Phase Requirements → Test Map

No formal REQ-IDs are assigned to this phase. The behaviors to validate:

| Behavior | Test Type | Automated Command | File Exists? |
|----------|-----------|-------------------|-------------|
| Control Light calls PUT not POST | unit | `npm test -- --testPathPattern="HueTab" --watchAll=false` | ❌ Wave 0 |
| Control Room calls PUT not POST | unit | `npm test -- --testPathPattern="HueTab" --watchAll=false` | ❌ Wave 0 |
| Activate Scene uses correct path with groupId+sceneId | unit | `npm test -- --testPathPattern="HueTab" --watchAll=false` | ❌ Wave 0 |
| Stale URL label is gone | snapshot/unit | `npm test -- --testPathPattern="HueTab" --watchAll=false` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npm test -- --testPathPattern="HueTab" --watchAll=false`
- **Per wave merge:** `npm test -- --watchAll=false`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `app/debug/components/tabs/__tests__/HueTab.test.tsx` — unit tests for method dispatch + URL correctness
- [ ] `app/debug/api/components/tabs/__tests__/HueTab.test.tsx` — same tests for the api-path copy

Note: No existing HueTab tests found anywhere in the project. Both test files are new.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `/api/hue/scenes/${sceneId}/activate` (PUT) | `POST /api/hue/groups/${groupId}/scenes/${sceneId}` | Phase 109/110 | Debug panel not updated during that cleanup |
| Light/room control via POST | Light/room control via PUT | Phase 107 (routes created PUT-only) | Debug panel never received the correct method |

## Open Questions

None. All three bugs are precisely documented in the audit with exact file paths and line numbers. No ambiguity in what the correct state should be.

## Sources

### Primary (HIGH confidence)

- `app/debug/components/tabs/HueTab.tsx` — source of all three bugs, read directly
- `app/debug/api/components/tabs/HueTab.tsx` — identical copy, confirmed byte-for-byte identical via diff
- `app/api/hue/lights/[id]/route.ts` — confirms `PUT` only (no `POST` export)
- `app/api/hue/rooms/[id]/route.ts` — confirms `PUT` only (no `POST` export)
- `app/api/hue/groups/[groupId]/scenes/[sceneId]/route.ts` — confirms `POST`, path pattern, requires both `groupId` and `sceneId`
- `.planning/v14.0-MILESTONE-AUDIT.md` — itemised all three bugs with line numbers

## Metadata

**Confidence breakdown:**
- Bug identification: HIGH — audit itemises exact file + line, confirmed by reading source
- Fix approach: HIGH — routes read directly, method requirements confirmed, no external dependencies
- Test gap: HIGH — confirmed no existing HueTab tests

**Research date:** 2026-03-21
**Valid until:** Indefinite (bug fix phase, no external API dependencies)
