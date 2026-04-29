---
phase: 178
plan: 10
type: execute
wave: 4
depends_on: ['178-09']
files_modified:
  - tests/smoke/dashboard-glass-cards.spec.ts
autonomous: true
requirements: [SHEET-02, SHEET-03, SHEET-04, SHEET-05, SHEET-06]
tags: [ember-glass, sheets, playwright, smoke]
must_haves:
  truths:
    - "tests/smoke/dashboard-glass-cards.spec.ts (Phase 177 spec) is EXTENDED — no new spec file (D-31)"
    - "5 new test.describe blocks appended (one per SHEET-02..06) using existing collectConsoleErrors + dismissVersionEnforcerIfPresent + dismissWhatsNewModalIfPresent helpers"
    - "Each describe asserts: card tap opens its Sheet, the corresponding *-sheet root testid is visible, AT LEAST ONE wired control fires the matching API endpoint via page.route() mock"
    - "All 5 new describes use the existing Phase 177 beforeEach setup (Auth0 + VersionEnforcer dismissal)"
    - "Zero console errors in any of the 5 new scenarios"
    - "The grep -E \"SHEET-0[2-6]\" tests/smoke/dashboard-glass-cards.spec.ts produces 5 matches (one describe per requirement)"
  artifacts:
    - path: tests/smoke/dashboard-glass-cards.spec.ts
      provides: "End-to-end smoke coverage for SHEET-02..SHEET-06 wiring"
  key_links:
    - from: tests/smoke/dashboard-glass-cards.spec.ts
      to: app/components/EmberGlass/sheets/StoveSheet.tsx
      via: "page.getByTestId('stove-card').click() → assert stove-sheet visible → click power stepper-plus → assert mocked /api/v1/thermorossi/settings/power POST"
      pattern: "data-testid=\\\"stove-sheet\\\""
user_setup: []
---

<objective>
**EXTEND** the Phase 177 Playwright smoke spec at `tests/smoke/dashboard-glass-cards.spec.ts` (NOT `tests/playwright/...` — Pitfall 3) with **5 new `test.describe` blocks**, one per SHEET-02..06 requirement. Each describe:
1. Mocks the relevant device API endpoint via `page.route()`.
2. Opens the dashboard, taps the device card, asserts the sheet's root `data-testid` is visible.
3. Interacts with one wired control (Stepper +1 / RadialDial +1 / Tutte off / play / toggle).
4. Asserts the mocked endpoint received the expected request.
5. Asserts zero console errors via `collectConsoleErrors`.

D-31 forbids creating a new spec file. The extension reuses verbatim:
- `collectConsoleErrors` (line 30-42).
- `dismissVersionEnforcerIfPresent` (line 50-67).
- `dismissWhatsNewModalIfPresent` (line 80-94).
- The `beforeEach` setup pattern from line 134-180.

**Per-sheet test plan:**

| Requirement | Card → Sheet | Mocked endpoint | Control clicked | Assertion |
|---|---|---|---|---|
| SHEET-02 | stove-card → stove-sheet | `POST /api/v1/thermorossi/settings/power` (or whichever endpoint useStoveCommands.handlePowerChange hits — verify in code) | `stove-sheet-power-stepper` → `stepper-plus` | Mocked request received with new power value (3+1=4) |
| SHEET-03 | climate-card → climate-sheet | `POST /api/v1/netatmo/setroomthermpoint` | `radial-dial-plus` (advance debounce 500ms) | Mocked request received with `temp: target+1` |
| SHEET-04 | lights-card → lights-sheet | `POST /api/v1/hue/groups/{id}/action` (or whichever URL handleAllLightsToggle hits) | `quick-action-tutte-off` | Mocked request received |
| SHEET-05 | sonos-card → sonos-sheet | `POST /api/v1/sonos/zones/{groupId}/play` (or pause) | `sonos-sheet-group-0-play-pause` | Mocked request received |
| SHEET-06 | tuya-card → plugs-sheet | `POST /api/tuya/plugs/{deviceId}/state` | First plug's InlineToggle | Mocked request received |

**Mocking strategy:** use `page.route(pattern, route => route.fulfill({ status: 202, body: JSON.stringify({...}) }))` and capture requests via a separate `page.on('request', ...)` listener filtered by URL pattern. The Phase 177 spec lines 134-180 shows the existing beforeEach pattern; mirror that.

Purpose: End-to-end runtime verification that all 5 sheets wire their controls to real API endpoints.
Output: 1 file edit (~250 LOC appended); 5 new describe blocks.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/ROADMAP.md
@.planning/phases/178-per-device-modal-sheets/178-CONTEXT.md
@.planning/phases/178-per-device-modal-sheets/178-UI-SPEC.md
@.planning/phases/178-per-device-modal-sheets/178-PATTERNS.md
@.planning/phases/178-per-device-modal-sheets/178-RESEARCH.md
@tests/smoke/dashboard-glass-cards.spec.ts

<interfaces>
<!-- Phase 177 spec (verified — read tests/smoke/dashboard-glass-cards.spec.ts lines 1-253): -->
<!--   import { test, expect, type ConsoleMessage, type Page } from '@playwright/test'; -->
<!--   function collectConsoleErrors(page) -> { errors, cleanup }     (lines 30-42) -->
<!--   async function dismissVersionEnforcerIfPresent(page)            (lines 50-67) -->
<!--   async function dismissWhatsNewModalIfPresent(page)              (lines 80-94) -->
<!--   const INTERACTIVE_CARDS: [{ testId, title }, ...]               (lines 97-...) -->
<!--   test.describe('DASH-01..DASH-12 — equal-size dashboard glass cards', () => { -->
<!--     test.beforeEach({ page }) — Auth0 + VersionEnforcer dismissal + WhatsNew dismissal -->
<!--     test('DASH-01 grid is 2-col with 1:1 children') -->
<!--     test('DASH-02..DASH-10 per-card content shape') -->
<!--     for (const card of INTERACTIVE_CARDS) { -->
<!--       test(`DASH-11 tap → sheet opens (${card.title})`) -->
<!--     } -->
<!--     test(`DASH-11 ${testId} does NOT open a sheet` × 2 (Weather + Raspi)) -->
<!--     test('DASH-12 stagger animationDelay increments by 100ms') -->
<!--   }); -->
<!-- -->
<!-- 5 new describes are APPENDED below the existing closing }. -->
<!-- -->
<!-- Endpoint URLs to verify (read each command hook to confirm exact path): -->
<!--   useStoveCommands.handlePowerChange → POST /api/v1/thermorossi/settings/power -->
<!--                                          (or whichever — read the file) -->
<!--   useThermostatCommands.setRoomSetpoint → POST /api/v1/netatmo/setroomthermpoint -->
<!--   useLightsCommands.handleAllLightsToggle → likely batches per group; URL TBD by reading hook -->
<!--   useSonosCommands.handlePlay → POST /api/v1/sonos/zones/{groupId}/play -->
<!--                                  (or PUT — read the file) -->
<!--   useTuyaCommands.togglePlug → POST /api/tuya/plugs/{deviceId}/state -->
<!--                                 (read the file for exact path) -->
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Append SHEET-02 (Stove) + SHEET-03 (Climate) describe blocks</name>
  <files>
    tests/smoke/dashboard-glass-cards.spec.ts
  </files>
  <read_first>
    - tests/smoke/dashboard-glass-cards.spec.ts (FULL FILE — find the closing `});` of the Phase 177 describe block; new describes append AFTER it)
    - app/components/devices/stove/hooks/useStoveCommands.ts (find the exact URL handlePowerChange hits — search for `fetch(` or `execute(` with the route)
    - app/components/devices/thermostat/hooks/useThermostatCommands.ts (Plan 178-03 — `NETATMO_ROUTES.setRoomThermpoint` constant)
    - lib/routes.ts (`NETATMO_ROUTES.setRoomThermpoint`, `STOVE_ROUTES.setPower` — confirm exact strings)
    - .planning/phases/178-per-device-modal-sheets/178-CONTEXT.md (D-30, D-31 — extension contract)
    - .planning/phases/178-per-device-modal-sheets/178-PATTERNS.md (lines 552-579 — Playwright extension pattern)
  </read_first>
  <behavior>
    Two new describe blocks appended to the spec file:

    1. **`SHEET-02 StoveSheet wires command`** — opens stove-card, asserts stove-sheet visible, clicks Stepper plus on the power row, asserts the mocked Thermorossi power-change route was hit AT LEAST ONCE.

    2. **`SHEET-03 ClimateSheet wires command`** — opens climate-card, asserts climate-sheet visible, clicks RadialDial plus, advances 500ms (debounce), asserts mocked /setroomthermpoint route was hit at least once.

    Each describe:
    - Has its own `test.beforeEach` that sets up the `page.route` mock + the existing `dismissVersionEnforcer` + `dismissWhatsNewModal` calls (mirror Phase 177 beforeEach).
    - Uses `collectConsoleErrors` and asserts zero errors at end.
    - Uses `await expect(dialog).toBeVisible({ timeout: 2000 })` after the card click.

    The mocked routes return 202 + minimal JSON body. Each test captures the matching request URL via a `page.on('request')` listener that pushes matching URLs to a local array. After clicking the control, the test asserts the array length is ≥ 1 (the request was made).
  </behavior>
  <action>
**Read the full spec first** to find the closing `});` line of the existing Phase 177 describe block. Use the **Edit** tool to APPEND the new describes after it (on a new line, with leading blank line for separation).

**Verify exact endpoint URLs first by reading the source hooks:**

```bash
grep -nE "(fetch|execute)\\(|api/v1/thermorossi/settings/power" app/components/devices/stove/hooks/useStoveCommands.ts
```

The plan author **assumes** the URL is `/api/v1/thermorossi/settings/power` based on Phase 13.0 lockdown but the executor MUST grep to confirm. If it's a different path (e.g. `/api/v1/thermorossi/commands/setpower`), use the exact verified path in the `page.route()` glob.

**Append code (after Phase 177's closing `});`)**:

```typescript

// ============================================================================
// Phase 178 — SHEET-02..SHEET-06 wiring smoke tests (extends Phase 177 spec).
// Each describe asserts that tapping a dashboard card opens its real sheet body
// and that an interactive control fires the expected API endpoint via page.route mock.
// Reuses collectConsoleErrors + dismissVersionEnforcerIfPresent + dismissWhatsNewModalIfPresent.
// ============================================================================

test.describe('SHEET-02 StoveSheet wires command', () => {
  let powerRequests: string[];

  test.beforeEach(async ({ page }) => {
    powerRequests = [];
    // Mock the Thermorossi power-set endpoint (verify exact path in useStoveCommands).
    await page.route('**/api/v1/thermorossi/settings/power', (route) =>
      route.fulfill({
        status: 202,
        contentType: 'application/json',
        body: JSON.stringify({ suggested_poll_delay_s: 1 }),
      }),
    );
    page.on('request', (req) => {
      if (req.url().includes('/api/v1/thermorossi/settings/power')) {
        powerRequests.push(req.url());
      }
    });
    await page.goto('/');
    await dismissVersionEnforcerIfPresent(page);
    await dismissWhatsNewModalIfPresent(page);
  });

  test('clicking + on power stepper fires Thermorossi setPower command', async ({ page }) => {
    const { errors, cleanup } = collectConsoleErrors(page);
    await page.getByTestId('stove-card').click();
    const sheet = page.getByTestId('stove-sheet');
    await expect(sheet).toBeVisible({ timeout: 2000 });
    const powerWrap = sheet.getByTestId('stove-sheet-power-stepper');
    await powerWrap.getByTestId('stepper-plus').click();
    // Wait for the request to land (the handler may post asynchronously).
    await expect.poll(() => powerRequests.length).toBeGreaterThanOrEqual(1);
    cleanup();
    expect(errors).toEqual([]);
  });
});

test.describe('SHEET-03 ClimateSheet wires command', () => {
  let setpointRequests: Array<{ url: string; body: string }>;

  test.beforeEach(async ({ page }) => {
    setpointRequests = [];
    await page.route('**/api/v1/netatmo/setroomthermpoint', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'ok' }),
      }),
    );
    page.on('request', (req) => {
      if (req.url().includes('/api/v1/netatmo/setroomthermpoint')) {
        setpointRequests.push({ url: req.url(), body: req.postData() ?? '' });
      }
    });
    await page.goto('/');
    await dismissVersionEnforcerIfPresent(page);
    await dismissWhatsNewModalIfPresent(page);
  });

  test('clicking + on RadialDial fires setroomthermpoint after debounce', async ({ page }) => {
    const { errors, cleanup } = collectConsoleErrors(page);
    await page.getByTestId('climate-card').click();
    const sheet = page.getByTestId('climate-sheet');
    await expect(sheet).toBeVisible({ timeout: 2000 });
    await sheet.getByTestId('radial-dial-plus').click();
    // 500ms debounce in ClimateSheet — wait at least that long.
    await page.waitForTimeout(700);
    await expect.poll(() => setpointRequests.length).toBeGreaterThanOrEqual(1);
    cleanup();
    expect(errors).toEqual([]);
  });
});
```

**Note on `page.goto('/')`**: the Phase 177 spec already calls this in its beforeEach. The new describes have their own `beforeEach` because each describe needs its own route mock setup. The Phase 177 describe-level setup is NOT shared with sibling describes — that's why each new describe re-runs `goto` + the dismissal helpers. This is the correct pattern (verified by reading lines 134-180 of the existing spec).

**Note on Auth0 / session caching**: the Phase 177 spec relies on Playwright's `storageState` (configured in `playwright.config.ts`) to skip Auth0 login. The new describes inherit this configuration — no per-describe Auth0 setup needed.

**Note on data-testid='climate-card' / 'stove-card'**: these are set by the Phase 177 cards (verified — `data-testid="stove-card"` etc.). The Phase 177 INTERACTIVE_CARDS array (lines 97-106) is the source of truth for testid names. The new describes target these same testids.
  </action>
  <verify>
    <automated>npm run test:e2e -- tests/smoke/dashboard-glass-cards.spec.ts -g "SHEET-0[23]"</automated>
  </verify>
  <acceptance_criteria>
    - File `tests/smoke/dashboard-glass-cards.spec.ts` contains the string `SHEET-02 StoveSheet wires command`.
    - File contains `SHEET-03 ClimateSheet wires command`.
    - File contains `await page.route('**/api/v1/thermorossi/settings/power'`.
    - File contains `await page.route('**/api/v1/netatmo/setroomthermpoint'`.
    - File contains `dismissVersionEnforcerIfPresent` AND `dismissWhatsNewModalIfPresent` inside both new describes' beforeEach.
    - File contains `expect.poll(() => powerRequests.length).toBeGreaterThanOrEqual(1)` (or equivalent assertion).
    - File contains `collectConsoleErrors` inside the new tests.
    - The 2 new describes pass under `npm run test:e2e -- tests/smoke/dashboard-glass-cards.spec.ts -g "SHEET-0[23]"`.
    - Existing Phase 177 describe block UNCHANGED (`grep -c "DASH-01..DASH-12 — equal-size"` still returns 1 match).
  </acceptance_criteria>
  <done>
    SHEET-02 + SHEET-03 describes appended; both green at runtime; Phase 177 describe untouched.
  </done>
</task>

<task type="auto">
  <name>Task 2: Append SHEET-04 (Lights) + SHEET-05 (Sonos) + SHEET-06 (Plugs) describe blocks</name>
  <files>
    tests/smoke/dashboard-glass-cards.spec.ts
  </files>
  <read_first>
    - tests/smoke/dashboard-glass-cards.spec.ts (FULL FILE — including the SHEET-02/03 describes appended in Task 1)
    - app/components/devices/lights/hooks/useLightsCommands.ts (find URL pattern for handleAllLightsToggle — likely PUT /api/v1/hue/groups/{id}/action)
    - app/components/devices/sonos/hooks/useSonosCommands.ts (find URL pattern for handlePlay — likely POST /api/v1/sonos/zones/{groupId}/play)
    - app/components/devices/tuya/hooks/useTuyaCommands.ts (find URL pattern for togglePlug — likely POST /api/tuya/plugs/{id}/state)
    - .planning/phases/178-per-device-modal-sheets/178-CONTEXT.md (D-30 — describe contract)
    - Task 1's appended code in this same plan (mirror the structure)
  </read_first>
  <behavior>
    Three additional describe blocks appended:

    1. **`SHEET-04 LightsSheet wires command`** — opens lights-card, asserts lights-sheet visible, clicks `quick-action-tutte-off`, asserts the mocked Hue endpoint was hit. Note: `handleAllLightsToggle` may iterate multiple groups internally; the test asserts AT LEAST ONE matching request.

    2. **`SHEET-05 SonosSheet wires command`** — opens sonos-card, asserts sonos-sheet visible, clicks the play button on the first group row, asserts the mocked Sonos play endpoint was hit.

    3. **`SHEET-06 PlugsSheet wires command`** — opens tuya-card, asserts plugs-sheet visible, clicks the InlineToggle on the first plug row, asserts the mocked Tuya state endpoint was hit. ALSO asserts that the dashboard TuyaCard itself (visible BEFORE opening the sheet) does NOT contain any toggle — `expect(page.getByTestId('tuya-card').locator('[role="switch"]')).toHaveCount(0)` (DASH-10 cross-check per UI-SPEC §"Verification Mapping → SHEET-06").
  </behavior>
  <action>
APPEND three more describes after the SHEET-03 describe (with leading blank line):

```typescript

test.describe('SHEET-04 LightsSheet wires command', () => {
  let hueRequests: string[];

  test.beforeEach(async ({ page }) => {
    hueRequests = [];
    // Hue group action (verify exact path/method in useLightsCommands).
    await page.route('**/api/v1/hue/groups/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      }),
    );
    page.on('request', (req) => {
      if (req.url().match(/\/api\/v1\/hue\/groups\//)) {
        hueRequests.push(req.url());
      }
    });
    await page.goto('/');
    await dismissVersionEnforcerIfPresent(page);
    await dismissWhatsNewModalIfPresent(page);
  });

  test('clicking Tutte off fires hue group action', async ({ page }) => {
    const { errors, cleanup } = collectConsoleErrors(page);
    await page.getByTestId('lights-card').click();
    const sheet = page.getByTestId('lights-sheet');
    await expect(sheet).toBeVisible({ timeout: 2000 });
    await sheet.getByTestId('quick-action-tutte-off').click();
    await expect.poll(() => hueRequests.length).toBeGreaterThanOrEqual(1);
    cleanup();
    expect(errors).toEqual([]);
  });
});

test.describe('SHEET-05 SonosSheet wires command', () => {
  let sonosRequests: string[];

  test.beforeEach(async ({ page }) => {
    sonosRequests = [];
    // Sonos zone play/pause (verify exact path/method).
    await page.route('**/api/v1/sonos/zones/**/play', (route) =>
      route.fulfill({ status: 200, body: JSON.stringify({ ok: true }) }),
    );
    await page.route('**/api/v1/sonos/zones/**/pause', (route) =>
      route.fulfill({ status: 200, body: JSON.stringify({ ok: true }) }),
    );
    page.on('request', (req) => {
      const u = req.url();
      if (u.includes('/api/v1/sonos/zones/') && (u.endsWith('/play') || u.endsWith('/pause'))) {
        sonosRequests.push(u);
      }
    });
    await page.goto('/');
    await dismissVersionEnforcerIfPresent(page);
    await dismissWhatsNewModalIfPresent(page);
  });

  test('clicking play on first group row fires sonos zones play/pause endpoint', async ({ page }) => {
    const { errors, cleanup } = collectConsoleErrors(page);
    await page.getByTestId('sonos-card').click();
    const sheet = page.getByTestId('sonos-sheet');
    await expect(sheet).toBeVisible({ timeout: 2000 });
    await sheet.getByTestId('sonos-sheet-group-0-play-pause').click();
    await expect.poll(() => sonosRequests.length).toBeGreaterThanOrEqual(1);
    cleanup();
    expect(errors).toEqual([]);
  });
});

test.describe('SHEET-06 PlugsSheet wires command', () => {
  let tuyaRequests: string[];

  test.beforeEach(async ({ page }) => {
    tuyaRequests = [];
    await page.route('**/api/tuya/plugs/**/state', (route) =>
      route.fulfill({ status: 200, body: JSON.stringify({ ok: true }) }),
    );
    page.on('request', (req) => {
      if (req.url().includes('/api/tuya/plugs/') && req.url().endsWith('/state')) {
        tuyaRequests.push(req.url());
      }
    });
    await page.goto('/');
    await dismissVersionEnforcerIfPresent(page);
    await dismissWhatsNewModalIfPresent(page);
  });

  test('TuyaCard dashboard tile has NO toggle (DASH-10 / SHEET-06 cross-check)', async ({ page }) => {
    const { errors, cleanup } = collectConsoleErrors(page);
    const card = page.getByTestId('tuya-card');
    await expect(card).toBeVisible();
    // DASH-10: dashboard card is report-only — no inline toggles.
    await expect(card.locator('[role="switch"]')).toHaveCount(0);
    cleanup();
    expect(errors).toEqual([]);
  });

  test('clicking a plug toggle inside the sheet fires tuya state endpoint', async ({ page }) => {
    const { errors, cleanup } = collectConsoleErrors(page);
    await page.getByTestId('tuya-card').click();
    const sheet = page.getByTestId('plugs-sheet');
    await expect(sheet).toBeVisible({ timeout: 2000 });
    // Find ANY toggle in the plug list — the first plug's wrapper testid follows the pattern
    // `plugs-sheet-plug-{slug}-toggle`. Use a regex locator to grab the first match.
    const firstToggleWrap = sheet.locator('[data-testid$="-toggle"]').first();
    const toggleControl = firstToggleWrap.locator('button, input[type="checkbox"], [role="switch"]').first();
    await toggleControl.click();
    await expect.poll(() => tuyaRequests.length).toBeGreaterThanOrEqual(1);
    cleanup();
    expect(errors).toEqual([]);
  });
});
```

**Important** — verify each `page.route()` URL pattern by greping the corresponding command hook for the actual fetch URL. If a pattern doesn't match (e.g. `/api/v1/sonos/zones/...` is actually `/api/v1/sonos/groups/...`), update the route + capture filter accordingly. The Playwright glob `**/api/...` matches any host, but the path must be exact.

After appending all 3 describes, run the entire SHEET-* group:

```bash
npm run test:e2e -- tests/smoke/dashboard-glass-cards.spec.ts -g "SHEET-0[2-6]"
```

5 describes should be discovered; all pass.
  </action>
  <verify>
    <automated>npm run test:e2e -- tests/smoke/dashboard-glass-cards.spec.ts -g "SHEET-0[2-6]"</automated>
  </verify>
  <acceptance_criteria>
    - File `tests/smoke/dashboard-glass-cards.spec.ts` contains:
      - `SHEET-04 LightsSheet wires command`.
      - `SHEET-05 SonosSheet wires command`.
      - `SHEET-06 PlugsSheet wires command`.
      - `DASH-10 / SHEET-06 cross-check` (or similar phrase asserting `tuya-card.locator('[role="switch"]')` has count 0).
    - `grep -cE "test\\.describe\\\\('SHEET-0[2-6]" tests/smoke/dashboard-glass-cards.spec.ts` returns 5.
    - `npm run test:e2e -- tests/smoke/dashboard-glass-cards.spec.ts -g "SHEET-0[2-6]"` exits 0 — all 5 SHEET-* describes pass.
    - `npm run test:e2e -- tests/smoke/dashboard-glass-cards.spec.ts -g "DASH-"` still passes (Phase 177 describes UNCHANGED).
    - Zero console errors in any scenario (each test asserts `expect(errors).toEqual([])`).
  </acceptance_criteria>
  <done>
    All 5 SHEET-* describes ship; full spec runs green; Phase 177 DASH-* tests still green; zero console errors.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Playwright client → mocked API endpoints | Test-only — no real network calls; `page.route()` intercepts |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-178-10-01 | Tampering | Mocked endpoint pattern misses real request | mitigate | Each describe captures requests via `page.on('request')` and asserts ≥1 hit. If patterns mismatch, the assertion fails loudly. Acceptance criteria asserts each describe is GREEN — runtime verification. |
| T-178-10-02 | Information Disclosure | Test storageState may contain stale Auth0 tokens | accept | Phase 51 + 97 already established the storageState + session-caching pattern. The Phase 178 extension reuses it without modification. |
</threat_model>

<verification>
```bash
npm run test:e2e -- tests/smoke/dashboard-glass-cards.spec.ts
```

All Phase 177 (`DASH-*`) describes + 5 new Phase 178 (`SHEET-0[2-6]`) describes pass; zero console errors; spec runs in <120s.
</verification>

<success_criteria>
- [ ] tests/smoke/dashboard-glass-cards.spec.ts extended with 5 new describe blocks (SHEET-02..06).
- [ ] Each describe mocks the relevant API endpoint via `page.route` + captures requests.
- [ ] Each describe opens the matching card, asserts the sheet is visible, clicks one wired control, asserts the mock was hit.
- [ ] Phase 177 DASH-01..DASH-12 describes UNCHANGED; existing tests still pass.
- [ ] SHEET-06 describe includes a DASH-10 cross-check asserting `tuya-card` has no toggle.
- [ ] Zero console errors in any new scenario.
- [ ] No new spec file created (D-31).
</success_criteria>

<output>
After completion, create `.planning/phases/178-per-device-modal-sheets/178-10-SUMMARY.md`.
</output>
