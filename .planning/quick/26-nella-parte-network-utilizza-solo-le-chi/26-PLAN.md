---
phase: quick-26
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/api/fritzbox/vendor-lookup/route.ts
  - app/api/fritzbox/vendor-lookup/__tests__/route.test.ts
  - app/api/fritzbox/category-override/route.ts
  - app/api/fritzbox/category-override/__tests__/route.test.ts
  - app/components/devices/network/hooks/useNetworkData.ts
  - app/network/page.tsx
  - app/debug/components/tabs/NetworkTab.tsx
autonomous: true
requirements: [QUICK-26]
must_haves:
  truths:
    - "All network API calls use /api/fritzbox/ namespace exclusively"
    - "Vendor lookup enrichment still works on NetworkCard polling"
    - "Category override still works on /network page device table"
    - "Debug NetworkTab shows correct /api/fritzbox/ URLs"
    - "No remaining references to /api/network/ namespace in client code"
  artifacts:
    - path: "app/api/fritzbox/vendor-lookup/route.ts"
      provides: "Vendor lookup endpoint under fritzbox namespace"
      contains: "withAuthAndErrorHandler"
    - path: "app/api/fritzbox/category-override/route.ts"
      provides: "Category override endpoint under fritzbox namespace"
      contains: "withAuthAndErrorHandler"
  key_links:
    - from: "app/components/devices/network/hooks/useNetworkData.ts"
      to: "/api/fritzbox/vendor-lookup"
      via: "fetch call for device enrichment"
      pattern: "fetch.*api/fritzbox/vendor-lookup"
    - from: "app/network/page.tsx"
      to: "/api/fritzbox/category-override"
      via: "fetch call for manual category change"
      pattern: "fetch.*api/fritzbox/category-override"
---

<objective>
Move vendor-lookup and category-override API routes from /api/network/ to /api/fritzbox/ namespace, and update all client-side callers.

Purpose: Consolidate all network-related API routes under the /api/fritzbox/ namespace for consistency.
Output: All network API calls use /api/fritzbox/ exclusively; /api/network/ directory removed.
</objective>

<execution_context>
@/Users/federicomanfredi/.claude/get-shit-done/workflows/execute-plan.md
@/Users/federicomanfredi/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@CLAUDE.md
@app/api/network/vendor-lookup/route.ts
@app/api/network/category-override/route.ts
@app/components/devices/network/hooks/useNetworkData.ts
@app/network/page.tsx
@app/debug/components/tabs/NetworkTab.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Move API routes from /api/network/ to /api/fritzbox/ namespace</name>
  <files>
    app/api/fritzbox/vendor-lookup/route.ts
    app/api/fritzbox/vendor-lookup/__tests__/route.test.ts
    app/api/fritzbox/category-override/route.ts
    app/api/fritzbox/category-override/__tests__/route.test.ts
  </files>
  <action>
    Use `git mv` to move API route files (preserves git history):

    1. `git mv app/api/network/vendor-lookup app/api/fritzbox/vendor-lookup`
    2. `git mv app/api/network/category-override app/api/fritzbox/category-override`
    3. Remove the now-empty `app/api/network/` directory if it remains

    The route handler code itself does NOT need changes - only the filesystem path changes (Next.js derives the route URL from the file path).

    Update the test files to reflect the new URL paths:
    - In `app/api/fritzbox/vendor-lookup/__tests__/route.test.ts`: change all occurrences of `/api/network/vendor-lookup` to `/api/fritzbox/vendor-lookup` in the describe block name and any Request URL strings
    - In `app/api/fritzbox/category-override/__tests__/route.test.ts`: change all occurrences of `/api/network/category-override` to `/api/fritzbox/category-override` in the describe block name and any Request URL strings
  </action>
  <verify>
    - `ls app/api/fritzbox/vendor-lookup/route.ts` exists
    - `ls app/api/fritzbox/category-override/route.ts` exists
    - `ls app/api/network/` should fail (directory removed)
    - `grep -r '/api/network/' app/api/` returns no results
  </verify>
  <done>
    vendor-lookup and category-override routes exist under app/api/fritzbox/ with tests, /api/network/ directory no longer exists
  </done>
</task>

<task type="auto">
  <name>Task 2: Update all client-side callers to use /api/fritzbox/ URLs</name>
  <files>
    app/components/devices/network/hooks/useNetworkData.ts
    app/network/page.tsx
    app/debug/components/tabs/NetworkTab.tsx
  </files>
  <action>
    Update fetch URLs in three files:

    1. **useNetworkData.ts** (line 87): Change `/api/network/vendor-lookup` to `/api/fritzbox/vendor-lookup`
       - Find: `fetch(\`/api/network/vendor-lookup?mac=${encodeURIComponent(device.mac)}\`)`
       - Replace with: `fetch(\`/api/fritzbox/vendor-lookup?mac=${encodeURIComponent(device.mac)}\`)`

    2. **app/network/page.tsx** (line 78): Change `/api/network/category-override` to `/api/fritzbox/category-override`
       - Find: `fetch('/api/network/category-override',`
       - Replace with: `fetch('/api/fritzbox/category-override',`

    3. **app/debug/components/tabs/NetworkTab.tsx**: Change ALL references to `/api/network/` to `/api/fritzbox/`:
       - Line 75: `/api/network/vendor-lookup?mac=AA:BB:CC:DD:EE:FF` -> `/api/fritzbox/vendor-lookup?mac=AA:BB:CC:DD:EE:FF` (all 4 occurrences on lines 75, 262, 266-268)
       - Line 76: `/api/network/category-override` -> `/api/fritzbox/category-override` (all 4 occurrences on lines 76, 277, 281-283)

    Do NOT change any logic, only the URL strings.
  </action>
  <verify>
    - `grep -r '/api/network/' app/components/ app/network/ app/debug/` returns no results
    - `grep -r '/api/fritzbox/vendor-lookup' app/components/devices/network/hooks/useNetworkData.ts` returns 1 result
    - `grep -r '/api/fritzbox/category-override' app/network/page.tsx` returns 1 result
    - `npm test -- --testPathPattern="useNetworkData|NetworkCard" --passWithNoTests` passes
  </verify>
  <done>
    All client-side code references /api/fritzbox/ namespace exclusively. Zero references to /api/network/ remain in the codebase (outside of node_modules).
  </done>
</task>

</tasks>

<verification>
1. `grep -rn '/api/network/' app/ lib/ --include='*.ts' --include='*.tsx'` returns ZERO results
2. `ls app/api/fritzbox/vendor-lookup/route.ts app/api/fritzbox/category-override/route.ts` both exist
3. `ls app/api/network/ 2>/dev/null` fails (directory gone)
4. `npm test -- --testPathPattern="vendor-lookup|category-override|useNetworkData" --passWithNoTests` all tests pass
</verification>

<success_criteria>
- All /api/network/ routes moved to /api/fritzbox/ namespace
- All client fetch calls updated to use /api/fritzbox/ URLs
- No remaining /api/network/ references in app code
- All existing tests pass with updated paths
</success_criteria>

<output>
After completion, create `.planning/quick/26-nella-parte-network-utilizza-solo-le-chi/26-SUMMARY.md`
</output>
