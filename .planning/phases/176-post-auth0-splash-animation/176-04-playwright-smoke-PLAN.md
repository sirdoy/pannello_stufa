---
phase: 176
plan: 04
plan_id: 176-04
slug: playwright-smoke
type: execute
wave: 4
depends_on:
  - 176-01
  - 176-02
  - 176-03
files_modified:
  - tests/smoke/splash.spec.ts
  - app/debug/design-system-v2/page.tsx
autonomous: true
requirements:
  - SPLASH-01
  - SPLASH-02
  - SPLASH-03
  - SPLASH-04
  - SPLASH-05
commit_strategy: per_task
must_haves:
  truths:
    - "Playwright spec at tests/smoke/splash.spec.ts contains 5 named tests covering SPLASH-01..05 (one test per requirement)."
    - "SPLASH-01 spec asserts splash-overlay visible within ~1500ms of dashboard landing post-Auth0 sign-in."
    - "SPLASH-02 spec asserts the animation timeline beats: flame scale(0.4) → scale(1) → splash unmounted by ~2300ms."
    - "SPLASH-03 spec runs with prefersReducedMotion: 'reduce' and asserts no scale transforms on flame or dashboard-wrapper, splash unmounts by ~400ms."
    - "SPLASH-04 spec navigates Home → Stanze → Automazioni → Home and asserts splash never re-mounts after first dismissal."
    - "SPLASH-05 spec captures network requests during the splash window and asserts ≥1 device API call (/api/(stove|thermostat|lights|network|sonos|dirigera|raspi|tuya)) fires before splash unmounts."
    - "Specs use the existing signIn() helper from tests/helpers/auth.helpers.ts and reuse the collectConsoleErrors helper convention from tests/smoke/page-loads.spec.ts."
    - "VersionEnforcer overlay (Phase 175 known blocker) is handled per Phase 175 spec strategy (see CONTEXT.md D-28 + RESEARCH §Pitfall 6)."
  artifacts:
    - path: tests/smoke/splash.spec.ts
      provides: "Playwright smoke spec covering all 5 SPLASH requirements end-to-end"
      contains: "SPLASH-01"
    - path: app/debug/design-system-v2/page.tsx
      provides: "Optional 'Replay splash' debug button (Claude's Discretion per CONTEXT.md + UI-SPEC) — clears sessionStorage and remounts splash via forceShow"
      contains: "Replay splash"
  key_links:
    - from: tests/smoke/splash.spec.ts
      to: tests/helpers/auth.helpers.ts
      via: "import { signIn } from '../helpers/auth.helpers';"
      pattern: "signIn"
    - from: tests/smoke/splash.spec.ts
      to: tests/helpers/test-context.ts
      via: "import { TEST_USER } from '../helpers/test-context';"
      pattern: "TEST_USER"
    - from: tests/smoke/splash.spec.ts
      to: app/components/EmberGlass/Splash.tsx
      via: "page.getByTestId('splash-overlay')"
      pattern: "splash-overlay"
    - from: app/debug/design-system-v2/page.tsx
      to: app/components/EmberGlass/SplashGate.tsx
      via: "<SplashGate forceShow> or sessionStorage.removeItem + forceRemount mechanism"
      pattern: "Replay splash"
---

<objective>
Ship the Playwright smoke spec at `tests/smoke/splash.spec.ts` that exercises all five SPLASH requirements end-to-end against the running app, plus an OPTIONAL "Replay splash" button on `/debug/design-system-v2` for visual regression iteration (Claude's Discretion per CONTEXT.md + UI-SPEC §"Claude's Discretion").

This is the phase's CROSS-CUTTING verification surface — it covers all five requirements via real-Auth0 sign-in, network capture, and timeline assertions. SC-#5 (fetches start during splash) is ONLY verifiable via Playwright network capture; no Jest-layer test can substitute.

Per CONTEXT.md D-27 (5 Playwright specs), D-28 (VersionEnforcer overlay handling), and the established Phase 51 (real-Auth0 helper) + Phase 97 (collectConsoleErrors helper) + Phase 175 (sheet-primitive.spec.ts pattern) conventions.

Output:
- New file `tests/smoke/splash.spec.ts` (~200 LOC; 5 named specs covering SPLASH-01..05)
- Modified `app/debug/design-system-v2/page.tsx` (Optional Replay button — lock: ship per UI-SPEC §"Claude's Discretion" "<SplashGate forceShow> test prop. Recommend yes")
</objective>

<implements_decisions>
## Truths (Implements Decisions)

This plan explicitly implements the following CONTEXT.md decisions (citations for the decision-coverage gate):

- D-27: 5 Playwright specs at `tests/smoke/splash.spec.ts` covering SPLASH-01 (visibility), SPLASH-02 (animation timeline), SPLASH-03 (reduced-motion), SPLASH-04 (no re-trigger on route change), SPLASH-05 (device API requests during splash window).
- D-28: VersionEnforcer overlay handling — `dismissVersionEnforcerIfPresent` helper co-located in the spec; documented blocker disposition per Phase 175 precedent if runtime fails.
- Claude's Discretion (per CONTEXT.md "Claude's Discretion" + UI-SPEC lock): `<SplashGate forceShow>` test prop exposed AND `/debug/design-system-v2` "Replay splash" debug button shipped (Italian copy `'Replay splash'` + helper `'Pulisce sessionStorage e ri-monta lo splash per il regression test visivo'`).

Note: This plan does not implement new D-NN decisions beyond D-27 and D-28; the other SPLASH-01..05 requirements are integration-tested here but their underlying decisions (D-01..D-26, D-29) are implemented in Plans 01-03.
</implements_decisions>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/STATE.md
@CLAUDE.md

@.planning/phases/176-post-auth0-splash-animation/176-CONTEXT.md
@.planning/phases/176-post-auth0-splash-animation/176-RESEARCH.md
@.planning/phases/176-post-auth0-splash-animation/176-PATTERNS.md
@.planning/phases/176-post-auth0-splash-animation/176-UI-SPEC.md

@.planning/phases/176-post-auth0-splash-animation/176-01-SUMMARY.md
@.planning/phases/176-post-auth0-splash-animation/176-02-SUMMARY.md
@.planning/phases/176-post-auth0-splash-animation/176-03-SUMMARY.md

@tests/smoke/sheet-primitive.spec.ts
@tests/smoke/page-loads.spec.ts
@tests/smoke/auth-flows.spec.ts
@tests/helpers/auth.helpers.ts
@tests/helpers/test-context.ts
@app/debug/design-system-v2/page.tsx
@app/components/EmberGlass/SplashGate.tsx

<interfaces>
<!-- signIn helper signature (from tests/helpers/auth.helpers.ts): -->

```ts
export async function signIn(page: Page, email: string, password: string): Promise<void>;
```

The helper navigates to `/auth/login`, completes the 2-step Auth0 Universal Login flow, and waits for redirect back to `http://localhost:3000/**`.

<!-- TEST_USER (from tests/helpers/test-context.ts): -->

```ts
export const TEST_USER = { email: <string>, password: <string> };
```

<!-- collectConsoleErrors helper (canonical from tests/smoke/page-loads.spec.ts:1-20): -->

```ts
function collectConsoleErrors(page: Page): { errors: string[]; cleanup: () => void } {
  const errors: string[] = [];
  const handler = (msg: ConsoleMessage) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (text.includes('Fix any of the following')) return; // axe a11y noise
      errors.push(text);
    }
  };
  page.on('console', handler);
  return { errors, cleanup: () => page.off('console', handler) };
}
```

<!-- SplashGate API (from Plan 03): -->

```ts
export interface SplashGateProps {
  children: ReactNode;
  forceShow?: boolean; // bypasses sessionStorage gate
}
```

<!-- Splash data-testids (from Plan 02): -->

- splash-overlay (root)
- splash-flame (88x96 wrapper)
- splash-wordmark
- splash-badge

<!-- SplashGate data-testid (from Plan 03): -->

- dashboard-wrapper
</interfaces>
</context>

<tasks>

<task type="auto" id="176-04-01">
  <name>Task 1: Add 'Replay splash' debug button to /debug/design-system-v2/page.tsx</name>
  <files>app/debug/design-system-v2/page.tsx</files>

  <read_first>
    - app/debug/design-system-v2/page.tsx (current file)
    - .planning/phases/176-post-auth0-splash-animation/176-CONTEXT.md "Claude's Discretion" §"Whether <SplashGate> exposes a forceShow test prop ... Recommend yes"
    - .planning/phases/176-post-auth0-splash-animation/176-UI-SPEC.md §"Claude's Discretion" row "<SplashGate forceShow> test prop" (lock: YES — ship it)
    - .planning/phases/176-post-auth0-splash-animation/176-UI-SPEC.md §"Copywriting Contract" "Optional debug copy" (Italian: 'Replay splash' button + helper text)
    - app/components/EmberGlass/SplashGate.tsx (Plan 03 output — confirms forceShow prop exists)
  </read_first>

  <action>
Add a "Replay splash" debug section to `/debug/design-system-v2/page.tsx`. This is OPTIONAL per CONTEXT.md but LOCKED to YES by UI-SPEC §"Claude's Discretion" — ship it.

The implementation MUST:
1. Be a client-side button (the page is a client component with `'use client'` already; verify before editing).
2. On click: clear `sessionStorage.removeItem('ember-glass-splash-shown')` AND force a remount of the splash. Two approaches are acceptable; choose the one that matches the file's existing patterns:

   **Approach A (preferred — uses forceShow prop):** Wrap a local `<SplashGate forceShow>` in a state-toggled section of the page. Click "Replay splash" → set local state `replayKey` to increment → render `<SplashGate key={replayKey} forceShow><div>{/* mini-dashboard placeholder */}</div></SplashGate>`. The `key` change forces remount. The user sees the splash play again WITHIN the design-system-v2 page (not the whole app). Note: this conflicts with the global SplashGate already mounted in ClientProviders. Mitigation: the inner SplashGate's `forceShow` flag bypasses sessionStorage for itself; the outer global SplashGate has already dismissed (sessionStorage flag is set), so the global one renders {children} only and does NOT show its own splash. The inner SplashGate adds its overlay at z-index 1000 — it will visually cover the page, which is the intended demo behavior.

   **Approach B (simpler — uses sessionStorage clear + reload):** On click: `sessionStorage.removeItem('ember-glass-splash-shown'); window.location.reload();` — full-page reload triggers the global SplashGate to re-mount the splash from cold. Simpler but less demo-friendly (whole page flashes).

Use Approach A. It demonstrates the `forceShow` prop in isolation and doesn't depend on a reload.

3. Use the locked Italian copy from UI-SPEC §"Copywriting Contract":
   - Button label: `'Replay splash'`
   - Helper text: `'Pulisce sessionStorage e ri-monta lo splash per il regression test visivo'`

4. Place the section logically — typically after the existing Sheet/Pressable demo sections (Phase 175) so design system entries are roughly chronological. Verify file structure before placing.

5. Use existing styling conventions on the page (likely Tailwind classes per UI-SPEC §"Design System" "Tool: none" — Tailwind v4 is the project default for non-EmberGlass surfaces; EmberGlass primitives use inline styles only). Match the surrounding section's patterns (button class names, heading levels, etc.).

EXAMPLE STRUCTURE (adapt to actual file conventions):

```tsx
{/* Phase 176 — Splash demo (Claude's Discretion: SplashGate forceShow visual regression) */}
<section className="border border-stone-800 rounded-lg p-6 my-8">
  <h2 className="text-2xl font-semibold mb-2">Section 07 — Splash (SPLASH-01..05)</h2>
  <p className="text-sm text-stone-400 mb-4">
    Pulisce sessionStorage e ri-monta lo splash per il regression test visivo.
  </p>
  <button
    type="button"
    onClick={() => {
      try { sessionStorage.removeItem('ember-glass-splash-shown'); } catch {}
      setReplayKey((k) => k + 1);
    }}
    className="px-4 py-2 rounded bg-stone-800 hover:bg-stone-700 transition-colors"
  >
    Replay splash
  </button>
  {replayKey > 0 && (
    <div key={replayKey} className="relative mt-4 border border-stone-700 rounded overflow-hidden" style={{ height: 480 }}>
      <SplashGate forceShow>
        <div className="p-4 text-stone-300">
          (Mini dashboard placeholder — splash plays over this content.)
        </div>
      </SplashGate>
    </div>
  )}
</section>
```

ADJUSTMENTS REQUIRED:
- Add `useState` + `import { SplashGate } from '@/app/components/EmberGlass';` to the page if not already imported.
- Initialize `const [replayKey, setReplayKey] = useState(0);` near the top of the component.
- The mini-dashboard container needs a positioned context so the inner SplashGate's `position: fixed` overlay covers ONLY that container. Issue: `position: fixed` covers the viewport, not a sub-region. RESOLUTION: For the demo, this is acceptable — the splash visually covers the whole page when triggered. UI-SPEC §"Claude's Discretion" anticipates this ("the inner SplashGate adds its overlay at z-index 1000 — it will visually cover the page, which is the intended demo behavior"). Do NOT attempt to reparent the splash to use `position: absolute` — that would diverge from the production behavior we're trying to demo.
- Prefer to wrap the demo in a `<details>` or guard with a small explanatory note so users don't trigger it accidentally.

Per CLAUDE.md rule 3: prefer editing the existing file over creating new. Per CLAUDE.md rule 1: never break existing functionality (the existing Section 05/06 demos must still work).

This task does NOT add a unit test — design-system-v2 is a demo/debug page, not a tested surface (consistent with Phase 174/175 demo additions). Verification is grep-based + visual smoke via the new Playwright spec in Task 2.
  </action>

  <verify>
    <automated>grep -q "Replay splash" app/debug/design-system-v2/page.tsx &amp;&amp; grep -q "SplashGate" app/debug/design-system-v2/page.tsx &amp;&amp; grep -q "forceShow" app/debug/design-system-v2/page.tsx &amp;&amp; grep -q "ember-glass-splash-shown" app/debug/design-system-v2/page.tsx</automated>
  </verify>

  <acceptance_criteria>
    - `grep -q "Replay splash" app/debug/design-system-v2/page.tsx` returns 0.
    - `grep -q "SplashGate" app/debug/design-system-v2/page.tsx` returns 0.
    - `grep -q "forceShow" app/debug/design-system-v2/page.tsx` returns 0.
    - `grep -q "'ember-glass-splash-shown'" app/debug/design-system-v2/page.tsx` returns 0 (the literal flag key).
    - `grep -q "sessionStorage.removeItem" app/debug/design-system-v2/page.tsx` returns 0.
    - The Italian helper copy (or a substring like "regression test visivo" or "Pulisce sessionStorage") is present: `grep -q "regression test visivo" app/debug/design-system-v2/page.tsx` returns 0.
    - Existing Phase 175 sections (Pressable demo, Sheet demo) still render — `grep -E "Section 0[56]" app/debug/design-system-v2/page.tsx` still finds matches if they existed pre-edit. (Adjust if the page uses different headings; the rule is "do not delete existing demo sections".)
  </acceptance_criteria>

  <done>The debug page has a 'Replay splash' button that clears sessionStorage and remounts the splash via SplashGate forceShow + key change. Italian copy matches UI-SPEC §"Copywriting Contract".</done>
</task>

<task type="auto" id="176-04-02">
  <name>Task 2: Create tests/smoke/splash.spec.ts with 5 specs covering SPLASH-01..05</name>
  <files>tests/smoke/splash.spec.ts</files>

  <read_first>
    - .planning/phases/176-post-auth0-splash-animation/176-CONTEXT.md D-27 (5 specs locked) + D-28 (VersionEnforcer handling)
    - .planning/phases/176-post-auth0-splash-animation/176-RESEARCH.md §"Playwright E2E Layer (5 specs in tests/smoke/splash.spec.ts)" + §"Pitfall 6: VersionEnforcer overlay blocks Playwright"
    - .planning/phases/176-post-auth0-splash-animation/176-PATTERNS.md "tests/smoke/splash.spec.ts" pattern block (full code excerpts for all 5 specs)
    - .planning/phases/176-post-auth0-splash-animation/176-UI-SPEC.md §"Verification Mapping" (one row per requirement showing the assertion shape)
    - tests/smoke/sheet-primitive.spec.ts (canonical waitForFunction-on-getComputedStyle pattern for animation-timing assertions)
    - tests/smoke/page-loads.spec.ts (canonical collectConsoleErrors helper)
    - tests/smoke/auth-flows.spec.ts (canonical real-Auth0 sign-in via signIn(page, ...))
    - tests/helpers/auth.helpers.ts (signIn helper — already read above)
    - tests/helpers/test-context.ts (TEST_USER)
    - .planning/phases/175-glass-primitives-press-animation-sheet/175-SUMMARY.md (how Phase 175 dealt with VersionEnforcer overlay — note: "Playwright runtime deferred due to pre-existing VersionEnforcer overlay")
  </read_first>

  <action>
Create `tests/smoke/splash.spec.ts` with 5 named tests, one per SPLASH requirement. Combine the three established patterns:
- `signIn()` real-Auth0 helper (from `tests/smoke/auth-flows.spec.ts`).
- `collectConsoleErrors` (from `tests/smoke/page-loads.spec.ts`).
- `waitForFunction(getComputedStyle)` for animation-timing assertions (from `tests/smoke/sheet-primitive.spec.ts`).

FILE STRUCTURE:

```ts
import { test, expect, type ConsoleMessage, type Page } from '@playwright/test';
import { signIn } from '../helpers/auth.helpers';
import { TEST_USER } from '../helpers/test-context';

/**
 * SPLASH-01..05 — post-Auth0 splash animation (Phase 176).
 *
 * Asserts:
 *   SPLASH-01: splash mounts within ~1500ms of dashboard landing post-Auth0.
 *   SPLASH-02: animation timeline beats (flame scale(0.4) → scale(1) → unmount).
 *   SPLASH-03: prefers-reduced-motion: reduce → opacity-only fade, no transform, ≤400ms.
 *   SPLASH-04: subsequent in-session route changes do NOT re-trigger the splash.
 *   SPLASH-05: ≥1 device API request fires while the splash is visible.
 *
 * Helpers reused:
 *   - signIn() — tests/helpers/auth.helpers.ts (Phase 51 pattern).
 *   - collectConsoleErrors() — tests/smoke/page-loads.spec.ts (Phase 97 pattern).
 *   - waitForFunction(getComputedStyle) — tests/smoke/sheet-primitive.spec.ts (Phase 175 pattern).
 *
 * VersionEnforcer overlay handling (CONTEXT.md D-28; RESEARCH §Pitfall 6):
 *   The pre-existing app-level version banner can intercept clicks. If it appears,
 *   dismiss it before measurement using the established Phase 175 strategy.
 */

function collectConsoleErrors(page: Page): { errors: string[]; cleanup: () => void } {
  const errors: string[] = [];
  const handler = (msg: ConsoleMessage) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (text.includes('Fix any of the following')) return; // axe a11y noise
      errors.push(text);
    }
  };
  page.on('console', handler);
  return { errors, cleanup: () => page.off('console', handler) };
}

/** Dismiss VersionEnforcer overlay if present (Phase 175 known blocker per D-28). */
async function dismissVersionEnforcerIfPresent(page: Page): Promise<void> {
  const overlay = page.locator('[data-version-enforcer], [data-testid="version-enforcer"]').first();
  if (await overlay.isVisible({ timeout: 500 }).catch(() => false)) {
    // Try the explicit dismiss button first.
    const dismiss = page.getByRole('button', { name: /aggiorna|ignora|chiudi|dismiss|reload/i }).first();
    if (await dismiss.isVisible({ timeout: 200 }).catch(() => false)) {
      await dismiss.click({ trial: false }).catch(() => undefined);
    } else {
      // Fall back to ESC.
      await page.keyboard.press('Escape').catch(() => undefined);
    }
  }
}

test.describe('SPLASH-01..05 — splash overlay', () => {
  // Force fresh sign-in for every test in this describe so sessionStorage starts clean.
  test.use({ storageState: { cookies: [], origins: [] } });

  test('SPLASH-01 splash appears within ~1.5s of dashboard landing post-Auth0', async ({ page }) => {
    const { errors, cleanup } = collectConsoleErrors(page);
    await signIn(page, TEST_USER.email, TEST_USER.password);
    await dismissVersionEnforcerIfPresent(page);
    await expect(page.getByTestId('splash-overlay')).toBeVisible({ timeout: 1500 });
    // Splash MUST dismiss within ~2.3s (2.1s phase 3 + jitter).
    await expect(page.getByTestId('splash-overlay')).toBeHidden({ timeout: 2300 });
    cleanup();
    expect(errors, `Console errors during splash: ${errors.join(', ')}`).toHaveLength(0);
  });

  test('SPLASH-02 sequence beats: flame scale(0.4) → scale(1) → unmount', async ({ page }) => {
    await signIn(page, TEST_USER.email, TEST_USER.password);
    await dismissVersionEnforcerIfPresent(page);

    // t≈100ms: flame at scale(0.4) (phase 0).
    // Note: inline-style transform is read directly (data-testid + style.transform substring),
    // matching the canonical sheet-primitive.spec.ts waitForFunction pattern.
    await page.waitForFunction(() => {
      const el = document.querySelector('[data-testid="splash-flame"]') as HTMLElement | null;
      return !!el && el.style.transform.includes('scale(0.4)');
    }, { timeout: 400 });

    // t≈800ms: flame at scale(1) (phase 1).
    await page.waitForFunction(() => {
      const el = document.querySelector('[data-testid="splash-flame"]') as HTMLElement | null;
      return !!el && el.style.transform.includes('scale(1)');
    }, { timeout: 1500 });

    // Eventually splash unmounts (phase 3).
    await expect(page.getByTestId('splash-overlay')).toBeHidden({ timeout: 2300 });
  });

  test.describe('SPLASH-03 reduced-motion', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('reduces to opacity-only fade with no transform on flame or dashboard-wrapper', async ({ browser }) => {
      const ctx = await browser.newContext({ reducedMotion: 'reduce' });
      const page = await ctx.newPage();
      try {
        await signIn(page, TEST_USER.email, TEST_USER.password);
        await dismissVersionEnforcerIfPresent(page);

        await expect(page.getByTestId('splash-overlay')).toBeVisible({ timeout: 1500 });

        // Flame must NOT have a non-identity transform under reduced-motion.
        const flameTransform = await page
          .getByTestId('splash-flame')
          .evaluate((el) => getComputedStyle(el).transform);
        expect(
          flameTransform === 'none' || flameTransform === 'matrix(1, 0, 0, 1, 0, 0)',
          `Reduced-motion: flame transform should be identity, got "${flameTransform}"`,
        ).toBeTruthy();

        // Dashboard-wrapper must NOT have a non-identity transform under reduced-motion.
        const wrapperTransform = await page
          .getByTestId('dashboard-wrapper')
          .evaluate((el) => getComputedStyle(el).transform);
        expect(
          wrapperTransform === 'none' || wrapperTransform === 'matrix(1, 0, 0, 1, 0, 0)',
          `Reduced-motion: dashboard-wrapper transform should be identity, got "${wrapperTransform}"`,
        ).toBeTruthy();

        // Splash MUST unmount by ~400ms (200ms fade + jitter).
        await expect(page.getByTestId('splash-overlay')).toBeHidden({ timeout: 600 });
      } finally {
        await ctx.close();
      }
    });
  });

  test('SPLASH-04 no re-trigger on in-session route change (Home → Stanze → Automazioni → Home)', async ({ page }) => {
    await signIn(page, TEST_USER.email, TEST_USER.password);
    await dismissVersionEnforcerIfPresent(page);

    // Wait for first splash to dismiss.
    await expect(page.getByTestId('splash-overlay')).toBeVisible({ timeout: 1500 });
    await expect(page.getByTestId('splash-overlay')).toBeHidden({ timeout: 2300 });

    // Navigate Home → Stanze.
    await page.goto('/stanze');
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('splash-overlay')).toBeHidden({ timeout: 200 });

    // Navigate Stanze → Automazioni.
    await page.goto('/automazioni');
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('splash-overlay')).toBeHidden({ timeout: 200 });

    // Navigate Automazioni → Home.
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('splash-overlay')).toBeHidden({ timeout: 200 });
  });

  test('SPLASH-05 ≥1 device API request fires during splash window', async ({ page }) => {
    const apiRequests: string[] = [];
    page.on('request', (req) => {
      const url = req.url();
      if (url.includes('/api/')) apiRequests.push(url);
    });

    await signIn(page, TEST_USER.email, TEST_USER.password);
    await dismissVersionEnforcerIfPresent(page);

    // Capture at the splash-visible moment.
    await expect(page.getByTestId('splash-overlay')).toBeVisible({ timeout: 1500 });
    // Wait for splash to dismiss; by then ≥1 device API call should have fired.
    await expect(page.getByTestId('splash-overlay')).toBeHidden({ timeout: 2300 });

    // Match any of the canonical device API namespaces (D-27).
    const deviceApiPattern = /\/api\/(stove|thermostat|lights|network|sonos|dirigera|raspi|tuya)/;
    const matched = apiRequests.filter((u) => deviceApiPattern.test(u));
    expect(
      matched.length,
      `SPLASH-05: expected ≥1 device API request during splash window. Captured: ${apiRequests.slice(0, 20).join(', ')}`,
    ).toBeGreaterThanOrEqual(1);
  });
});
```

KEY DECISIONS LOCKED:
- File path is `tests/smoke/splash.spec.ts` (NOT `tests/playwright/...` despite the typo in 176-VALIDATION.md — actual test directory is `tests/smoke/` per existing convention; PATTERNS.md confirms this).
- Use `page.getByTestId(...)` for all splash element selectors (data-testid attrs come from Plans 02/03).
- The `dismissVersionEnforcerIfPresent` helper is co-located in this spec (NOT extracted) since it's Phase 175/176-specific. Future phases can promote it to `tests/helpers/` if needed.
- Five distinct named tests (one per SPLASH requirement), all inside a single top-level `describe`.
- `test.use({ storageState: { cookies: [], origins: [] } })` ensures each test starts with NO cookies — forces fresh Auth0 sign-in. Without this, sessionStorage from prior tests could survive within the worker process and suppress the splash.

VersionEnforcer dismissal note: Phase 175's known issue is that the overlay was NOT successfully bypassed in the Phase 175 specs (175-03 SUMMARY records: "Playwright runtime deferred due to pre-existing VersionEnforcer overlay (specs authored correctly, blocker shared with Phase 174 accent-picker spec)"). The `dismissVersionEnforcerIfPresent` helper above is a best-effort attempt; if the overlay's selector or button text differs from `[data-version-enforcer]`/`[data-testid="version-enforcer"]`/«aggiorna|ignora|chiudi|dismiss|reload» (case-insensitive), the test will fall back to ESC. If the overlay still blocks, the executor must inspect the actual VersionEnforcer DOM (likely in `app/components/VersionEnforcer.tsx` or similar) and adjust the helper. This is a documented known-blocker risk per CONTEXT.md D-28 — escalate to the user only if the helper cannot be tuned to dismiss it.

Per CLAUDE.md rule 5: tests are the deliverable here. Per CLAUDE.md rule 8: this is a Playwright spec, not a Jest spec — `npm test` rules apply only to Jest. The verify command for this task uses `npx playwright test` directly.
  </action>

  <verify>
    <automated>grep -c "test\(" tests/smoke/splash.spec.ts | awk '$1 >= 5 { exit 0 } { exit 1 }' &amp;&amp; grep -q "SPLASH-01" tests/smoke/splash.spec.ts &amp;&amp; grep -q "SPLASH-02" tests/smoke/splash.spec.ts &amp;&amp; grep -q "SPLASH-03" tests/smoke/splash.spec.ts &amp;&amp; grep -q "SPLASH-04" tests/smoke/splash.spec.ts &amp;&amp; grep -q "SPLASH-05" tests/smoke/splash.spec.ts &amp;&amp; grep -q "from '../helpers/auth.helpers'" tests/smoke/splash.spec.ts &amp;&amp; grep -q "from '../helpers/test-context'" tests/smoke/splash.spec.ts &amp;&amp; grep -q "splash-overlay" tests/smoke/splash.spec.ts &amp;&amp; grep -q "dashboard-wrapper" tests/smoke/splash.spec.ts &amp;&amp; npx playwright test tests/smoke/splash.spec.ts --reporter=line 2>&amp;1 | tee /tmp/splash-pw.log | grep -qE 'passed|failed' || true</automated>
  </verify>

  <acceptance_criteria>
    - File `tests/smoke/splash.spec.ts` exists.
    - `grep -c '^\s*test(' tests/smoke/splash.spec.ts` (counting top-level `test(` calls) returns ≥ 5.
    - All 5 SPLASH ID strings appear in test names: `grep -q 'SPLASH-01' tests/smoke/splash.spec.ts` etc. for 02, 03, 04, 05.
    - Spec imports the Auth0 sign-in helper: `grep -q "import { signIn } from '../helpers/auth.helpers'" tests/smoke/splash.spec.ts` returns 0.
    - Spec imports the test user: `grep -q "import { TEST_USER } from '../helpers/test-context'" tests/smoke/splash.spec.ts` returns 0.
    - Spec uses splash-overlay selector: `grep -q 'splash-overlay' tests/smoke/splash.spec.ts` returns 0.
    - Spec uses dashboard-wrapper selector: `grep -q 'dashboard-wrapper' tests/smoke/splash.spec.ts` returns 0.
    - Spec uses splash-flame selector: `grep -q 'splash-flame' tests/smoke/splash.spec.ts` returns 0.
    - Spec contains a reduced-motion context creation: `grep -q "reducedMotion: 'reduce'" tests/smoke/splash.spec.ts` returns 0.
    - Spec contains a network-capture pattern for SPLASH-05: `grep -q "page.on('request'" tests/smoke/splash.spec.ts` returns 0.
    - Spec contains the device-API regex: `grep -q '/api/(stove|thermostat|lights|network|sonos|dirigera|raspi|tuya)/' tests/smoke/splash.spec.ts` returns 0.
    - Spec contains a VersionEnforcer dismissal helper or reference: `grep -qiE 'versionenforcer|version-enforcer|version_enforcer' tests/smoke/splash.spec.ts` returns 0.
    - Spec test outcome: `npx playwright test tests/smoke/splash.spec.ts --reporter=line` either (a) all 5 specs pass, OR (b) failures are isolated to the documented VersionEnforcer/Auth0-runtime blocker per CONTEXT.md D-28. Authoring correctness is the bar — full green E2E may require runtime fixes outside this plan's scope. The executor MUST log any runtime blocker in the SUMMARY.
  </acceptance_criteria>

  <done>tests/smoke/splash.spec.ts exists with 5 specs (one per SPLASH requirement), reuses signIn + TEST_USER + collectConsoleErrors + waitForFunction patterns, handles VersionEnforcer overlay best-effort, and all assertions are verifiable via grep + Playwright invocation. If runtime is blocked by VersionEnforcer or Auth0 environment, that blocker is documented in the SUMMARY with the same disposition Phase 175 used.</done>
</task>

<task type="checkpoint:human-verify" id="176-04-03" gate="blocking">
  <name>Task 3: Manual visual smoke + final phase verification</name>
  <files>(none — verification gate)</files>

  <what-built>
After Tasks 1–2 complete (and Plans 01–03 are merged):
- FlameViz primitive shipped (Plan 01).
- Splash + useReducedMotion shipped (Plan 02).
- SplashGate orchestrator shipped + wired into ClientProviders (Plan 03).
- Replay debug button on /debug/design-system-v2 (Task 1 of this plan).
- Playwright smoke spec at tests/smoke/splash.spec.ts (Task 2 of this plan).

Phase 176's runtime now plays a ~2s splash on session entry, persists per-tab via sessionStorage, honors prefers-reduced-motion, and validates via 5 Jest test files (FlameViz/Splash/SplashGate/AmbientBg-unchanged/Sheet-unchanged) + 1 Playwright spec.
  </what-built>

  <how-to-verify>
**A) Full Jest component suite (regression check):**

```bash
npm run test:components
```

Expectation: existing test count + 26 new tests (4 FlameViz + 13 Splash + 9 SplashGate). Zero regressions.

**B) Playwright spec (best-effort runtime):**

```bash
npx playwright test tests/smoke/splash.spec.ts --reporter=line
```

Expectation: 5 specs run. If VersionEnforcer or Auth0 environment blocks runtime, log the blocker per Phase 175 precedent. Spec authoring correctness is the bar.

**C) Manual visual smoke (browser, 5 minutes):**

1. Start the dev server (`npm run dev`) — port 3000.
2. Open Chrome incognito → http://localhost:3000.
3. Sign in via Auth0 (or with NEXT_PUBLIC_BYPASS_AUTH=true, the mock user kicks in).
4. After Auth0 redirect lands on /:
   - Splash overlay covers the viewport with the dark radial gradient.
   - Flame logo scales in (~600ms).
   - Wordmark "Home" fades in.
   - Caption "Connessione al gateway…" fades in (note the U+2026 ellipsis, NOT three dots).
   - "Autenticato · Auth0" badge appears at the bottom with a pulsing green dot (note the U+00B7 middle dot).
   - Splash fades out and the dashboard scales/fades in (~2.1s total wall time).
5. Navigate to /stanze, /automazioni, /. Splash MUST NOT re-appear.
6. Open DevTools → Application → Session Storage → http://localhost:3000. Key `ember-glass-splash-shown` is present with value `'true'`.
7. Open DevTools → Rendering → "Emulate CSS media feature prefers-reduced-motion" → "reduce". Clear sessionStorage. Reload. Splash collapses to a 200ms opacity-only fade with NO scale on flame or dashboard.
8. Navigate to /debug/design-system-v2 → click "Replay splash" → splash re-mounts in the demo region (visually covers the page; intended demo behavior).

**D) AUDIT-EXCEPTION grep gate (Phase 174 DS-02 inheritance):**

```bash
grep -E '#[0-9a-fA-F]{3,8}\b' app/components/EmberGlass/Splash.tsx app/components/EmberGlass/FlameViz.tsx | grep -v AUDIT-EXCEPTION
```

Expectation: ZERO output (every hex literal is AUDIT-EXCEPTION-tagged).

**E) Italian copy invariant:**

```bash
grep -F 'gateway...' app/components/EmberGlass/Splash.tsx
```

Expectation: ZERO output (NO three-period ellipsis; only U+2026).

**F) sessionStorage key consistency:**

```bash
grep -rn "'ember-glass-splash-shown'" app/components/EmberGlass/ app/debug/design-system-v2/ tests/smoke/splash.spec.ts
```

Expectation: 3+ matches (SplashGate definition + reads + design-system-v2 button + Playwright spec). All literal strings, no typos.

**G) ROADMAP + STATE updates (post-execution housekeeping by execute-phase):**

Verify .planning/ROADMAP.md Phase 176 entry has `[x]` checkmarks for all 4 plans after the phase completes.
  </how-to-verify>

  <resume-signal>Type "approved" when manual smoke + Jest suite + AUDIT-EXCEPTION grep all pass; or describe specific issues for gap-closure planning.</resume-signal>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Playwright test runner ↔ live app | Tests sign in via real Auth0 (Phase 51 pattern). Test credentials in `tests/helpers/test-context.ts` are project-managed; no new exposure. |
| Browser automation context ↔ sessionStorage | Each test starts with cleared cookies (`storageState: { cookies: [], origins: [] }`); sessionStorage state is per-context and discarded on context close. |
| Debug page ↔ sessionStorage | The "Replay splash" button calls `sessionStorage.removeItem('ember-glass-splash-shown')` — clears only one well-known UX flag, not auth tokens. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-176-04-01 | Information Disclosure | Test credentials exposed in repo via `tests/helpers/test-context.ts` | accept | Project convention from Phase 51; out of scope for Phase 176 to re-evaluate. Credentials are a dedicated test user, not a real customer account. |
| T-176-04-02 | Tampering | "Replay splash" button on /debug/design-system-v2 in production | accept | The /debug route is a developer surface; production-prod deployments may gate /debug entirely (existing project policy — verify in CLAUDE.md/docs if needed). The button only clears a UX flag and re-renders a splash; zero security impact. |
| T-176-04-03 | Denial of Service | Playwright spec runtime hangs on VersionEnforcer overlay | mitigate | Best-effort `dismissVersionEnforcerIfPresent` helper; if it fails, the test times out and reports a clear runtime blocker per CONTEXT.md D-28. Documented as a known risk with Phase 175 precedent. |
| T-176-04-04 | Tampering | Network capture in SPLASH-05 test could log sensitive request bodies | accept | Test only captures URLs (`req.url()`), not bodies/headers. URLs may contain query strings but not PII for our device API surface. Existing project test patterns. |

ASVS L1 controls applicable:
- V14.4 (no exposure of sensitive resources) — N/A (test artifacts).
- V8.3 (browser storage handling) — same as Plan 03; flag is non-sensitive.

No `high` severity threats. Phase explicitly declared minimal threat surface in planning_context.
</threat_model>

<verification>
After all 3 tasks complete:
1. `npm run test:components` — full Jest component suite green (existing baseline + 26 new Phase 176 tests).
2. `npx playwright test tests/smoke/splash.spec.ts --reporter=line` — best-effort runtime; document any VersionEnforcer/Auth0 blockers.
3. `grep -c "test(" tests/smoke/splash.spec.ts` returns ≥ 5.
4. `grep -q "Replay splash" app/debug/design-system-v2/page.tsx` returns 0.
5. AUDIT-EXCEPTION grep gate clean: `grep -E '#[0-9a-fA-F]{3,8}\b' app/components/EmberGlass/Splash.tsx app/components/EmberGlass/FlameViz.tsx | grep -v AUDIT-EXCEPTION | wc -l` returns `0`.
6. Italian copy invariant: `grep -F 'gateway...' app/components/EmberGlass/Splash.tsx` returns nothing (exit 1).
7. Manual visual smoke (Task 3 checkpoint) passes.
</verification>

<success_criteria>
- All 5 SPLASH requirements have a verifiable Playwright assertion in `tests/smoke/splash.spec.ts`.
- Spec reuses the signIn() helper, TEST_USER, collectConsoleErrors helper, and waitForFunction(getComputedStyle) patterns — no new helper duplication.
- VersionEnforcer overlay handling is in place (best-effort dismissal); blocker disposition documented in SUMMARY if runtime fails.
- /debug/design-system-v2 has a working "Replay splash" debug button per UI-SPEC §"Claude's Discretion".
- Manual visual smoke confirms the full splash sequence plays correctly with proper Italian Unicode copy.
- All previously-shipped Jest unit tests (FlameViz/Splash/SplashGate) remain green.
- The phase is functionally complete: a fresh Auth0 session shows the splash → splash dismisses → dashboard fetches were already in flight → subsequent route changes never re-trigger the splash → reduced-motion users get a 200ms fade.
</success_criteria>

<output>
After completion, create `.planning/phases/176-post-auth0-splash-animation/176-04-SUMMARY.md` per template. Document: 2 commits (Replay debug button; Playwright smoke spec); files created/modified; the disposition of the VersionEnforcer / Auth0 runtime blocker (resolved → green; or deferred → like Phase 175); any flaky-spec mitigations applied; cross-cutting requirement coverage table (SPLASH-01..05 → Jest test ID + Playwright test name); recommended follow-up if any spec was authored-but-not-runtime-verified.
</output>
