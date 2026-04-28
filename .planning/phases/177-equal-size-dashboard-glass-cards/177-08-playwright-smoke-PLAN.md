---
phase: 177
plan: 08
type: execute
wave: 4
depends_on: ['177-07']
files_modified:
  - tests/smoke/dashboard-glass-cards.spec.ts
autonomous: true
requirements: [DASH-01, DASH-02, DASH-03, DASH-04, DASH-05, DASH-06, DASH-07, DASH-08, DASH-09, DASH-10, DASH-11, DASH-12]
tags: [ember-glass, dashboard, playwright, smoke]
must_haves:
  truths:
    - "Playwright smoke spec asserts the dashboard renders a 2-col grid with 1:1 children"
    - "Spec asserts each interactive card opens a Sheet on tap; Weather + Raspi do NOT"
    - "Spec asserts stagger animationDelay increments by 100ms"
    - "Spec asserts zero console errors during dashboard mount"
    - "Spec MUST mock/dismiss VersionEnforcer in test.beforeEach so it does not block runtime"
  artifacts:
    - path: tests/smoke/dashboard-glass-cards.spec.ts
      provides: "End-to-end smoke coverage for DASH-01..DASH-12"
  key_links:
    - from: tests/smoke/dashboard-glass-cards.spec.ts
      to: app/components/DashboardCards.tsx
      via: "page.goto('/')"
      pattern: "page.goto"
---

<objective>
Ship the Playwright smoke spec that verifies the entire DASH-01..DASH-12 surface end-to-end at `/`. Reuses the `collectConsoleErrors` helper from `tests/smoke/page-loads.spec.ts` and the **`dismissVersionEnforcerIfPresent` helper from `tests/smoke/splash.spec.ts`** (the established VersionEnforcer mitigation analog — see Phase 175 D-28).

This is the final Phase 177 deliverable — proves the full integration works in a real browser.

**HARD REQUIREMENT (no soft-OR fallback):** The spec MUST include `test.beforeEach()` that calls `dismissVersionEnforcerIfPresent` (the same pattern as `tests/smoke/splash.spec.ts` and `tests/smoke/sheet-primitive.spec.ts`) so VersionEnforcer's blocking modal does NOT prevent runtime. Acceptance is `npx playwright test ... exits 0` — runtime must succeed, not merely "be authored correctly".

If the canonical app uses an HTTP-route-based version check (e.g. `/api/version`), additionally use `page.route('/api/version', (route) => route.fulfill({ status: 200, body: JSON.stringify({ version: APP_VERSION }) }))` in `beforeEach` to short-circuit the check before the modal can mount. The current implementation reads from Firebase RTDB (see `app/context/VersionContext.tsx`), so the `dismissVersionEnforcerIfPresent` DOM-side dismissal is the canonical analog — copy it verbatim.

Purpose: End-to-end verification that the new dashboard ships without regressions.
Output: 1 new Playwright spec file with 5+ test cases, all green at runtime.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/phases/177-equal-size-dashboard-glass-cards/177-CONTEXT.md
@.planning/phases/177-equal-size-dashboard-glass-cards/177-PATTERNS.md
@.planning/phases/177-equal-size-dashboard-glass-cards/177-UI-SPEC.md
@.planning/phases/177-equal-size-dashboard-glass-cards/177-VALIDATION.md
@.planning/phases/177-07-SUMMARY.md
@CLAUDE.md
@tests/smoke/page-loads.spec.ts
@tests/smoke/sheet-primitive.spec.ts
@tests/smoke/press-primitive.spec.ts
@tests/smoke/splash.spec.ts

<interfaces>
<!-- Playwright helpers established in earlier phases -->
- `collectConsoleErrors(page)` — analog at `tests/smoke/page-loads.spec.ts:7-20` and `tests/smoke/splash.spec.ts:35-43`
- `dismissVersionEnforcerIfPresent(page)` — VersionEnforcer/ForceUpdateModal dismissal helper, defined in `tests/smoke/splash.spec.ts:60-80`. Copy verbatim into the new spec OR import from a shared helper module if one exists.
- Auth pattern — `tests/smoke/auth-flows.spec.ts` (real Auth0 + session caching from Phase 51)
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Author Playwright smoke spec covering DASH-01..DASH-12 with hard VersionEnforcer mitigation</name>
  <files>
    tests/smoke/dashboard-glass-cards.spec.ts
  </files>
  <read_first>
    - tests/smoke/page-loads.spec.ts (lines 1-32 — `collectConsoleErrors` helper + dashboard navigation pattern)
    - tests/smoke/sheet-primitive.spec.ts (full file — VersionEnforcer-aware navigation; copy the pattern that lets `/debug/design-system-v2` actually load)
    - tests/smoke/splash.spec.ts (full file — **specifically lines 35-80 for `collectConsoleErrors` and `dismissVersionEnforcerIfPresent`** — this is the canonical analog for Phase 177's smoke spec to copy)
    - tests/smoke/press-primitive.spec.ts (full file — `data-testid` selector + getComputedStyle assertions)
    - .planning/phases/177-equal-size-dashboard-glass-cards/177-PATTERNS.md (section "Tests: Playwright smoke spec")
    - .planning/phases/177-equal-size-dashboard-glass-cards/177-UI-SPEC.md (Component Inventory data-testid table)
  </read_first>
  <behavior>
    The spec contains a single `test.describe('DASH-01..DASH-12 — equal-size dashboard glass cards', ...)` block with these tests:

    1. **DASH-01 grid is 2-col with 1:1 children** — Navigate to `/`. Locate `.grid.grid-cols-2`. Assert visible. For each `[data-testid$="-card"]` inside the grid, measure `getBoundingClientRect()` and assert `Math.abs(width - height) < 1`.

    2. **DASH-02..DASH-10 per-card content shape** — For each of the 10 card testids (`stove-card`, `climate-card`, `lights-card`, `sonos-card`, `weather-card`, `camera-card`, `network-card`, `raspi-card`, `tuya-card`, `dirigera-card`), assert presence in the DOM. For Stove, additionally assert `[data-testid="stove-temp"]` is present. For Sonos, additionally assert `[data-testid="playing-bars"]` is present IFF a group is playing (otherwise dim dot — skip the assertion).

    3. **DASH-11 tap → sheet open (interactive card)** — Click `[data-testid="stove-card"]`. Assert `[role="dialog"]` becomes visible AND the dialog title text is `Stufa`. Repeat for `lights-card` → `Luci`.

    4. **DASH-11 Weather + Raspi do NOT open a sheet** — Click `[data-testid="weather-card"]`. Wait briefly. Assert `[role="dialog"]` is NOT visible. Repeat for `raspi-card`.

    5. **DASH-12 stagger animationDelay increments by 100ms** — Locate all `.animate-spring-in` wrapper divs. Read each `style.animationDelay`. Assert `delays[i] === '${i * 100}ms'`.

    6. **Zero console errors during dashboard mount** — Use `collectConsoleErrors` around the navigation; assert `errors.length === 0` after the grid is visible.

    **Test setup (HARD REQUIREMENT — no soft-OR):**
    - `test.beforeEach` MUST navigate to `/`, then call `await dismissVersionEnforcerIfPresent(page)` (copy the helper verbatim from `tests/smoke/splash.spec.ts:60-80`).
    - Additionally, `test.beforeEach` MUST install `await page.route('/api/version', ...)` BEFORE `page.goto('/')` to short-circuit any HTTP-based version check (no-op if app uses Firebase but defensive — mirrors the route-mock idiom in MSW/Playwright).
    - Auth: real Auth0 sign-in via the established session-caching pattern (Phase 51) OR BYPASS_AUTH if the test infra uses it. Match the pattern in `tests/smoke/page-loads.spec.ts` for dashboard navigation.
  </behavior>
  <action>
1. Read `tests/smoke/page-loads.spec.ts` lines 1-32 to copy the `collectConsoleErrors` helper verbatim.
2. Read `tests/smoke/splash.spec.ts` lines 35-80 to copy `dismissVersionEnforcerIfPresent` verbatim — this IS the analog the checker requires (see W5 fix).
3. Read `tests/smoke/sheet-primitive.spec.ts` to confirm how prior smoke specs handle pre-navigation hooks; mirror.

4. Create `tests/smoke/dashboard-glass-cards.spec.ts`:
```ts
import { test, expect, type Page, type ConsoleMessage } from '@playwright/test';

// VERBATIM copy of helper from tests/smoke/page-loads.spec.ts:7-20 (and splash.spec.ts:35-43).
function collectConsoleErrors(page: Page): { errors: string[]; cleanup: () => void } {
  const errors: string[] = [];
  const handler = (msg: ConsoleMessage) => {
    if (msg.type() === 'error') errors.push(msg.text());
  };
  page.on('console', handler);
  return { errors, cleanup: () => page.off('console', handler) };
}

// VERBATIM copy of helper from tests/smoke/splash.spec.ts:60-80 — VersionEnforcer mitigation
// per CONTEXT.md D-28 / Phase 175 D-17. This is the established analog the checker requires
// (W5 hard requirement: no soft-OR fallback — mock or dismiss must succeed before tests run).
async function dismissVersionEnforcerIfPresent(page: Page): Promise<void> {
  const overlay = page
    .locator('text=/Aggiornamento Disponibile/i, [data-version-enforcer], [data-testid="version-enforcer"]')
    .first();
  if (await overlay.isVisible({ timeout: 500 }).catch(() => false)) {
    const dismiss = page
      .getByRole('button', { name: /aggiorna|ricarica|reload|chiudi|ignora|dismiss/i })
      .first();
    if (await dismiss.isVisible({ timeout: 200 }).catch(() => false)) {
      await dismiss.click({ trial: false }).catch(() => undefined);
    } else {
      await page.keyboard.press('Escape').catch(() => undefined);
    }
  }
}

const INTERACTIVE_CARDS = [
  { testId: 'stove-card', title: 'Stufa' },
  { testId: 'climate-card', title: 'Clima' },
  { testId: 'lights-card', title: 'Luci' },
  { testId: 'sonos-card', title: 'Sonos' },
  { testId: 'camera-card', title: 'Camera' },
  { testId: 'network-card', title: 'Rete' },
  { testId: 'tuya-card', title: 'Prese smart' },
  { testId: 'dirigera-card', title: 'IKEA' },
];
const READ_ONLY_CARDS = ['weather-card', 'raspi-card'];

test.describe('DASH-01..DASH-12 — equal-size dashboard glass cards', () => {

  // HARD MITIGATION (W5 fix): mock/dismiss VersionEnforcer before every test so it does
  // NOT block runtime. The route-mock is defensive (no-op if Firebase-based check); the
  // dismissal helper handles the DOM-side modal that VersionContext.tsx may mount.
  test.beforeEach(async ({ page }) => {
    // Defensive route-mock — short-circuits any HTTP-based version check before goto.
    await page.route('**/api/version*', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ version: '99.99.99' }) })
    );
    await page.goto('/');
    await dismissVersionEnforcerIfPresent(page);
  });

  test('DASH-01 grid is 2-col with 1:1 children', async ({ page }) => {
    const { errors, cleanup } = collectConsoleErrors(page);
    const grid = page.locator('.grid.grid-cols-2').first();
    await expect(grid).toBeVisible();
    const sizes = await grid.locator('[data-testid$="-card"]').evaluateAll((els) =>
      els.map((el) => {
        const r = (el as HTMLElement).getBoundingClientRect();
        return { w: r.width, h: r.height };
      })
    );
    expect(sizes.length).toBeGreaterThan(0);
    sizes.forEach(({ w, h }) => expect(Math.abs(w - h)).toBeLessThan(1));
    cleanup();
    expect(errors).toHaveLength(0);
  });

  test('DASH-02..DASH-10 per-card content shape', async ({ page }) => {
    for (const id of ['stove-card', 'weather-card', 'raspi-card']) {
      await expect(page.getByTestId(id)).toBeVisible();
    }
    await expect(page.getByTestId('stove-temp')).toBeVisible();
  });

  test('DASH-11 tap → sheet opens (Stove)', async ({ page }) => {
    await page.getByTestId('stove-card').click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Stufa', { exact: true }).first()).toBeVisible();
  });

  test('DASH-11 tap → sheet opens (Lights)', async ({ page }) => {
    await page.getByTestId('lights-card').click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Luci', { exact: true }).first()).toBeVisible();
  });

  test('DASH-11 Weather does NOT open a sheet', async ({ page }) => {
    await page.getByTestId('weather-card').click();
    await page.waitForTimeout(300);
    await expect(page.getByRole('dialog')).toBeHidden();
  });

  test('DASH-11 Raspi does NOT open a sheet', async ({ page }) => {
    await page.getByTestId('raspi-card').click();
    await page.waitForTimeout(300);
    await expect(page.getByRole('dialog')).toBeHidden();
  });

  test('DASH-12 stagger animationDelay increments by 100ms', async ({ page }) => {
    const delays = await page.locator('.animate-spring-in').evaluateAll((els) =>
      els.map((el) => (el as HTMLElement).style.animationDelay)
    );
    expect(delays.length).toBeGreaterThan(0);
    delays.forEach((d, i) => {
      expect(d).toBe(`${i * 100}ms`);
    });
  });
});
```

**Important integration adjustments:**
- If the project's smoke specs use a global auth setup (`fixtures/authState.json` etc.), inherit it via the existing playwright config. Don't reinvent auth.
- If `getByTestId('stove-card')` is not visible because device-config has stove disabled in the test user, ensure the test user has stove enabled (preferred) — the smoke spec must run end-to-end without skipping core assertions.
  </action>
  <verify>
    <automated>npx playwright test tests/smoke/dashboard-glass-cards.spec.ts --reporter=list</automated>
  </verify>
  <acceptance_criteria>
    - File exists: `test -f tests/smoke/dashboard-glass-cards.spec.ts`
    - `grep -q "collectConsoleErrors" tests/smoke/dashboard-glass-cards.spec.ts`
    - `grep -q "dismissVersionEnforcerIfPresent" tests/smoke/dashboard-glass-cards.spec.ts` (W5 — VersionEnforcer mitigation present)
    - `grep -q "test.beforeEach" tests/smoke/dashboard-glass-cards.spec.ts` (W5 — beforeEach hook present)
    - `grep -q "page.route" tests/smoke/dashboard-glass-cards.spec.ts` (W5 — defensive route-mock present)
    - `grep -q "api/version" tests/smoke/dashboard-glass-cards.spec.ts` (W5 — version endpoint mocked)
    - `grep -q "grid.grid-cols-2" tests/smoke/dashboard-glass-cards.spec.ts`
    - `grep -q "stagger" tests/smoke/dashboard-glass-cards.spec.ts` OR `grep -q "animationDelay" tests/smoke/dashboard-glass-cards.spec.ts`
    - `grep -q "Stufa" tests/smoke/dashboard-glass-cards.spec.ts`
    - `grep -q "weather-card" tests/smoke/dashboard-glass-cards.spec.ts`
    - `grep -q "raspi-card" tests/smoke/dashboard-glass-cards.spec.ts`
    - `grep -q "toBeHidden\|toHaveCount(0)" tests/smoke/dashboard-glass-cards.spec.ts` (Weather/Raspi negative assertion)
    - `grep -c "test('DASH-" tests/smoke/dashboard-glass-cards.spec.ts` returns at least `5`
    - `npx tsc --noEmit` exits 0
    - **HARD GATE (W5 fix):** `npx playwright test tests/smoke/dashboard-glass-cards.spec.ts --reporter=list` exits 0. The "spec MUST AT LEAST be authored correctly" soft-OR clause is REMOVED — runtime must pass.
  </acceptance_criteria>
  <done>
    Playwright smoke spec covering all of DASH-01, DASH-02..DASH-10 presence, DASH-11 (positive + negative), and DASH-12 stagger ships in `tests/smoke/`. Console-error assertion present. **VersionEnforcer mitigation in beforeEach (W5):** route-mock + dismissal helper. Spec exits 0 at runtime — no soft-OR fallback.
  </done>
</task>

<task type="auto">
  <name>Task 2: Final verification — full Phase 177 React Compiler grep gate + scoped jest run</name>
  <files>
    .planning/phases/177-equal-size-dashboard-glass-cards/177-08-SUMMARY.md
  </files>
  <read_first>
    - .planning/phases/177-VALIDATION.md (Manual-Only Verifications row for React Compiler)
    - All 7 prior plan SUMMARYs (177-01 through 177-07) — review final-state file inventories
  </read_first>
  <behavior>
    - Confirm zero `useMemo` / `useCallback` introductions across ALL Phase 177 files. Per VALIDATION.md row 2 — `react-compiler-healthcheck` CLI is not installed; substitute is grep-based.
    - Confirm full scoped jest suite green: every `EmberGlass` + `DashboardCards` + `useWeatherSummary` test passes.
    - Author the closing SUMMARY.md tying together all 8 plans.
  </behavior>
  <action>
1. Run the React Compiler grep gate (substitute for `react-compiler-healthcheck` per VALIDATION.md):
```bash
grep -RE "useMemo|useCallback" \
  app/components/EmberGlass/ \
  app/components/devices/weather/hooks/useWeatherSummary.ts \
  app/components/DashboardCards.tsx \
  | grep -v '__tests__/' | grep -v '^Binary'
```
This MUST return zero matches in production code (test files may use them; the grep filter excludes `__tests__/`).

2. Run the full Phase 177 jest scope:
```bash
npm run test:components -- --testPathPattern='EmberGlass|DashboardCards' && \
npm run test:unit -- --testPathPattern='useWeatherSummary'
```
Both must exit 0.

3. Run `npx tsc --noEmit` and confirm exit 0.

4. Author `.planning/phases/177-equal-size-dashboard-glass-cards/177-08-SUMMARY.md` with sections:
   - **What shipped**: list of 8 plan summary file paths (177-01-SUMMARY.md through 177-08-SUMMARY.md).
   - **Files created** (count + path list, ~25 source files + 16 jest specs + 1 playwright spec).
   - **Files modified** (DashboardCards.tsx, EmberGlass/index.ts, unifiedDeviceConfigService.ts, DashboardCards.test.tsx, globals.css).
   - **Requirement coverage**: DASH-01 through DASH-12 each mapped to plans where they landed.
   - **Landmines resolved**: A-01 (stove temp = power_level, no °C unit), A-02 (Dirigera empty list), A-03 (Sonos visibility flip), A-04 (sonosBar keyframes added), A-05 (mode uppercase), A-06 (bare img for camera).
   - **Deferred / orphan items**: `lib/utils/dashboardColumns.ts` (orphaned utility — cleanup phase will delete after Phase 178); `SheetPlaceholderBody` is itself orphan-eligible after Phase 178 swaps in real sheet bodies.
   - **React Compiler verification**: paste grep gate output (`0 matches`).
   - **Jest pass output**: paste final test summary line(s).
   - **Playwright runtime**: paste exit code + summary from `npx playwright test tests/smoke/dashboard-glass-cards.spec.ts` (must be exit 0 per W5 hard gate).
   - **Manual verifications still owed** per VALIDATION.md: visible stagger on fresh load, 1:1 footprint at 360x800 viewport.
  </action>
  <verify>
    <automated>grep -RE "useMemo|useCallback" app/components/EmberGlass/ app/components/devices/weather/hooks/useWeatherSummary.ts app/components/DashboardCards.tsx | grep -v '__tests__/' ; npm run test:components -- --testPathPattern='EmberGlass|DashboardCards'</automated>
  </verify>
  <acceptance_criteria>
    - File exists: `test -f .planning/phases/177-equal-size-dashboard-glass-cards/177-08-SUMMARY.md`
    - SUMMARY contains all 8 plan references: `grep -c "177-0[1-8]-SUMMARY" .planning/phases/177-equal-size-dashboard-glass-cards/177-08-SUMMARY.md` returns at least `8`
    - SUMMARY references all 6 landmine resolutions: `grep -c "A-0[1-6]" .planning/phases/177-equal-size-dashboard-glass-cards/177-08-SUMMARY.md` returns at least `6`
    - React Compiler grep gate: `grep -RE "useMemo|useCallback" app/components/EmberGlass/ app/components/DashboardCards.tsx | grep -v '__tests__/' | wc -l` returns `0`
    - `npx tsc --noEmit` exits 0
    - `npm run test:components -- --testPathPattern='EmberGlass|DashboardCards'` exits 0
    - `npm run test:unit -- --testPathPattern='useWeatherSummary'` exits 0
    - `npx playwright test tests/smoke/dashboard-glass-cards.spec.ts` exits 0 (W5 hard gate)
  </acceptance_criteria>
  <done>
    Final SUMMARY documents the entire phase, RC grep gate is clean, scoped jest is green, tsc is green, Playwright smoke spec exits 0.
  </done>
</task>

</tasks>

<threat_model>
| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-177-08 | (none) | Playwright spec | accept | Test file only — no runtime production code introduced. |
</threat_model>

<verification>
- `tests/smoke/dashboard-glass-cards.spec.ts` exists with 5+ DASH-* test cases
- VersionEnforcer mitigation present (beforeEach + route-mock + dismissal helper) — W5 hard gate
- React Compiler grep gate: zero matches across all Phase 177 production files
- `npm run test:components -- --testPathPattern='EmberGlass|DashboardCards'` green
- `npm run test:unit -- --testPathPattern='useWeatherSummary'` green
- `npx tsc --noEmit` exits 0
- `npx playwright test tests/smoke/dashboard-glass-cards.spec.ts` exits 0
- 177-08-SUMMARY.md ties together all 8 plans
</verification>

<success_criteria>
- DASH-01..DASH-12 all covered by at least one Playwright assertion that runs successfully
- React Compiler discipline holds (zero useMemo/useCallback in new production code)
- Phase 177 closes with a single SUMMARY referencing all 8 plans
</success_criteria>

<output>
The 177-08-SUMMARY.md authored in Task 2 IS the phase-closing summary. It must reference all 8 plan SUMMARYs, all 6 landmines (A-01..A-06), the RC grep gate result, the jest pass output, AND the Playwright runtime exit code.
</output>
