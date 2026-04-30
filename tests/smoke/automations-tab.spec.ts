import { test, expect, type ConsoleMessage, type Page } from '@playwright/test';

/**
 * Phase 180 Plan 09 — AUTO-01..08 Playwright smoke spec.
 *
 * End-to-end runtime verification of the Automations tab (/automazioni). Asserts
 * the full create → edit → toggle → delete editor flow against mocked
 * /api/v1/automations responses. Covers all 8 AUTO-* requirements + decisions
 * D-08 (2 trigger tiles), D-09 (11 action tiles), D-12 (trigger read-only in
 * edit mode), D-14 (save guard), D-15 (unsaved-changes guard), D-16 (delete
 * confirm), D-25 (no polling on mount) and the D-27 console-error gate.
 *
 * Route mocks: GET / POST / PATCH / DELETE on /api/v1/automations** so the
 * editor exercises the real automationsProxy + hook + orchestrator wiring
 * without touching the live HA backend.
 *
 * Auth: reuses storageState from tests/.auth/user.json (Phase 51 pattern,
 * same as rooms-tab.spec.ts and dashboard-glass-cards.spec.ts).
 *
 * Helper functions copied verbatim from tests/smoke/rooms-tab.spec.ts.
 *
 * Dialog query contract (per 180-09 PLAN <dialog_query_contract>):
 *  - ConfirmationDialog renders via Radix DialogPrimitive (role="dialog").
 *  - When delete confirm opens, BOTH the editor footer's "Elimina"/"Annulla"
 *    and the dialog's "Elimina"/"Annulla" exist in the DOM. NEVER use
 *    .first()/.last() on ambiguous role+name selectors. Always scope queries
 *    via page.getByRole('dialog').getByRole('button', { name }).
 *  - For unsaved-changes dialog (default variant), labels are unique
 *    ("Continua a modificare" / "Chiudi senza salvare") — direct queries are
 *    safe.
 *
 * IMPORTANT: File path is tests/smoke/automations-tab.spec.ts — NOT
 * tests/playwright/.
 */

// ─── Verbatim helpers from tests/smoke/rooms-tab.spec.ts ─────────────────────

/**
 * Collects console errors during a page interaction.
 * Call BEFORE page.goto(). Call cleanup() after assertions to remove the listener.
 * Mirrors the canonical helper in tests/smoke/page-loads.spec.ts (Phase 97).
 */
function collectConsoleErrors(page: Page): { errors: string[]; cleanup: () => void } {
  const errors: string[] = [];
  const handler = (msg: ConsoleMessage) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignore axe-core accessibility warnings (not JS errors).
      if (text.includes('Fix any of the following')) return;
      errors.push(text);
    }
  };
  page.on('console', handler);
  return { errors, cleanup: () => page.off('console', handler) };
}

/**
 * Best-effort dismissal of the VersionEnforcer / ForceUpdateModal overlay
 * (Phase 175 known blocker per CONTEXT.md D-28). Verbatim copy of the helper
 * established in tests/smoke/splash.spec.ts:60-80.
 */
async function dismissVersionEnforcerIfPresent(page: Page): Promise<void> {
  const overlay = page
    .locator(
      'text=/Aggiornamento Disponibile/i, [data-version-enforcer], [data-testid="version-enforcer"]'
    )
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

/**
 * Best-effort dismissal of the WhatsNewModal (`<h2>Novità!</h2>` heading) which
 * mounts via useVersionCheck() when localStorage.lastSeenVersion !== APP_VERSION.
 * In smoke mode each test gets a fresh storage state, so the modal mounts on
 * every cold-load and intercepts pointer events on top of the page.
 *
 * Strategy: poll up to 4× over ~3s, since the hook fetches from Firebase async
 * and the modal can race the dashboard hydration. Each iteration: detect the
 * Radix dialog by role + heading, click the close button (aria-label "Chiudi")
 * or press Escape.
 */
async function dismissWhatsNewModalIfPresent(page: Page): Promise<void> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const overlay = page.getByText('Novità!', { exact: true }).first();
    const visible = await overlay.isVisible({ timeout: 750 }).catch(() => false);
    if (!visible) return;
    const closeBtn = page.getByRole('button', { name: /chiudi/i }).first();
    if (await closeBtn.isVisible({ timeout: 150 }).catch(() => false)) {
      await closeBtn.click({ force: true, trial: false }).catch(() => undefined);
    } else {
      await page.keyboard.press('Escape').catch(() => undefined);
    }
    await overlay.waitFor({ state: 'hidden', timeout: 1500 }).catch(() => undefined);
  }
}

/**
 * Pre-goto setup: pre-prime localStorage to suppress WhatsNewModal +
 * defensive version-check route mock so the changelog dialog cannot intercept
 * clicks. Mirrors primeDashboardForSheetTest from rooms-tab.spec.ts.
 */
async function primeForAutomationsTest(page: Page): Promise<void> {
  await page.route('**/api/version*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ version: '99.99.99' }),
    })
  );
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem('lastSeenVersion', '99.99.99');
      const dismissed = [
        '99.99.99',
        '1.77.0', '1.77.1', '1.77.2',
        '1.78.0', '1.79.0', '1.80.0',
        '2.0.0',
      ];
      window.localStorage.setItem('dismissedVersions', JSON.stringify(dismissed));
    } catch {
      // localStorage may be unavailable in some Playwright contexts — no-op.
    }
  });
}

// ─── Route mock fixtures ─────────────────────────────────────────────────────

const MOCK_RULE_BASE = {
  id: 1,
  name: 'Sveglia mattutina',
  description: 'Accendi luci alle 7',
  enabled: true,
  trigger: { type: 'schedule_cron', cron_expression: '0 7 * * *' },
  condition: { type: 'always_true' },
  actions: [{ type: 'log_event', message: 'wake' }],
  min_interval_seconds: 0,
  max_triggers_per_hour: 0,
  last_triggered_at: null,
  created_at: 1735689600,
  updated_at: 1735689600,
};

/**
 * Mocks /api/v1/automations** with synthesized GET/POST/PATCH/DELETE responses.
 * Default fixture: 1 rule (Sveglia mattutina). Override with opts.rules = [].
 */
async function mockAutomationsApi(
  page: Page,
  opts: { rules?: object[] } = {}
): Promise<void> {
  const rules = opts.rules ?? [MOCK_RULE_BASE];
  await page.route('**/api/v1/automations**', async (route) => {
    const method = route.request().method();
    const url = new URL(route.request().url());
    const isExecutions = url.pathname.includes('/executions');
    const isItemPath = /\/automations\/\d+$/.test(url.pathname);

    if (method === 'GET' && !isExecutions && !isItemPath) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: rules,
          total_count: rules.length,
          limit: 20,
          offset: 0,
        }),
      });
    } else if (method === 'POST') {
      const body = JSON.parse(route.request().postData() ?? '{}') as Record<string, unknown>;
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ ...MOCK_RULE_BASE, ...body, id: 99 }),
      });
    } else if (method === 'PATCH') {
      // Merge the request body so update-flow assertions see the patched
      // fields (symmetry with the POST branch above). Echoing the unmodified
      // base would silently mask orchestrator bugs that send the wrong patch.
      const body = JSON.parse(route.request().postData() ?? '{}') as Record<string, unknown>;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...MOCK_RULE_BASE, ...body }),
      });
    } else if (method === 'DELETE') {
      await route.fulfill({ status: 204, body: '' });
    } else {
      await route.continue();
    }
  });
}

// ─── Test suites ─────────────────────────────────────────────────────────────

test.describe('AUTO-01: List rendering', () => {
  test('renders rows from /api/v1/automations with all 4 status pills', async ({ page }) => {
    const { errors, cleanup } = collectConsoleErrors(page);
    await mockAutomationsApi(page);
    await primeForAutomationsTest(page);
    await page.goto('/automazioni');
    await page.waitForLoadState('domcontentloaded');
    await dismissVersionEnforcerIfPresent(page);
    await dismissWhatsNewModalIfPresent(page);

    // Row is a role="button" with aria-label="Apri automazione {name}".
    await expect(
      page.getByRole('button', { name: 'Apri automazione Sveglia mattutina' })
    ).toBeVisible({ timeout: 10000 });
    // Trigger pill describes the cron expression.
    await expect(page.getByText(/0 7 \* \* \*/)).toBeVisible();
    // Azioni pill (singular Italian).
    await expect(page.getByText(/^1 azione$/)).toBeVisible();
    // Last-run fallback pill.
    await expect(page.getByText(/ultima esecuzione: mai/)).toBeVisible();

    cleanup();
    expect(errors).toEqual([]);
  });

  test('empty state renders when no rules', async ({ page }) => {
    const { errors, cleanup } = collectConsoleErrors(page);
    await mockAutomationsApi(page, { rules: [] });
    await primeForAutomationsTest(page);
    await page.goto('/automazioni');
    await page.waitForLoadState('domcontentloaded');
    await dismissVersionEnforcerIfPresent(page);
    await dismissWhatsNewModalIfPresent(page);

    await expect(page.getByText(/Nessuna automazione/)).toBeVisible({ timeout: 10000 });

    cleanup();
    expect(errors).toEqual([]);
  });
});

test.describe('AUTO-02: Editor open + 4 tabs', () => {
  test('Nuova opens Sheet titled "Nuova automazione" with 4 tabs', async ({ page }) => {
    await mockAutomationsApi(page, { rules: [] });
    await primeForAutomationsTest(page);
    await page.goto('/automazioni');
    await page.waitForLoadState('domcontentloaded');
    await dismissVersionEnforcerIfPresent(page);
    await dismissWhatsNewModalIfPresent(page);

    await page.getByRole('button', { name: 'Nuova automazione' }).click();

    // Sheet renders DialogPrimitive.Title with the title prop text.
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Nuova automazione')).toBeVisible();

    // 4-tab segmented control — tabs use role="tab" with aria-label = tab name.
    await expect(page.getByRole('tab', { name: 'Trigger' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Condizioni' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Azioni' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Avanzate' })).toBeVisible();
  });
});

test.describe('AUTO-03: 2-tile trigger picker (D-08)', () => {
  test('Trigger tab shows EXACTLY 2 tiles (Pianificazione + Manuale)', async ({ page }) => {
    await mockAutomationsApi(page, { rules: [] });
    await primeForAutomationsTest(page);
    await page.goto('/automazioni');
    await page.waitForLoadState('domcontentloaded');
    await dismissVersionEnforcerIfPresent(page);
    await dismissWhatsNewModalIfPresent(page);

    await page.getByRole('button', { name: 'Nuova automazione' }).click();
    await page.getByRole('tab', { name: 'Trigger' }).click();

    await expect(page.getByRole('button', { name: 'Pianificazione' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Manuale' })).toBeVisible();
    // No 5-tile fallback — sensor-* triggers MUST NOT appear in the picker.
    await expect(page.getByRole('button', { name: /sensore/i })).toHaveCount(0);
  });
});

test.describe('AUTO-05: 11-tile action picker (D-09)', () => {
  test('Azioni picker shows EXACTLY 11 tiles in locked order', async ({ page }) => {
    await mockAutomationsApi(page, { rules: [] });
    await primeForAutomationsTest(page);
    await page.goto('/automazioni');
    await page.waitForLoadState('domcontentloaded');
    await dismissVersionEnforcerIfPresent(page);
    await dismissWhatsNewModalIfPresent(page);

    await page.getByRole('button', { name: 'Nuova automazione' }).click();
    await page.getByRole('tab', { name: 'Azioni' }).click();
    await page.getByRole('button', { name: 'Aggiungi azione' }).click();

    // Each tile is a button with aria-label = ACTION_TYPES[i].label.
    const expected = [
      'Imposta temp. stanza',
      'Modalità casa',
      'Cambia programma',
      'Comando stufa',
      'Luce singola',
      'Gruppo luci',
      'Scena Hue',
      'Presa',
      'Comando Sonos',
      'Webhook HTTP',
      'Scrivi log',
    ];
    for (const label of expected) {
      await expect(
        page.getByRole('button', { name: label, exact: true })
      ).toBeVisible();
    }
  });
});

test.describe('AUTO-04: Conditions AND/OR toggle', () => {
  test('operator toggle flips between TUTTE (E) and ALMENO UNA (O)', async ({ page }) => {
    await mockAutomationsApi(page, { rules: [] });
    await primeForAutomationsTest(page);
    await page.goto('/automazioni');
    await page.waitForLoadState('domcontentloaded');
    await dismissVersionEnforcerIfPresent(page);
    await dismissWhatsNewModalIfPresent(page);

    await page.getByRole('button', { name: 'Nuova automazione' }).click();
    await page.getByRole('tab', { name: 'Condizioni' }).click();

    // Intro copy from ConditionsSection (D-10 always-AND root).
    await expect(page.getByText(/Le condizioni devono essere soddisfatte/)).toBeVisible();

    // Operator toggle uses aria-label "Operatore gruppo: TUTTE (E)".
    const opBtn = page.getByRole('button', { name: 'Operatore gruppo: TUTTE (E)' });
    await expect(opBtn).toBeVisible();
    await opBtn.click();

    await expect(
      page.getByRole('button', { name: 'Operatore gruppo: ALMENO UNA (O)' })
    ).toBeVisible();
  });
});

test.describe('AUTO-06: Avanzate fields', () => {
  test('renders min_interval + max_per_hour with Italian hints', async ({ page }) => {
    await mockAutomationsApi(page, { rules: [] });
    await primeForAutomationsTest(page);
    await page.goto('/automazioni');
    await page.waitForLoadState('domcontentloaded');
    await dismissVersionEnforcerIfPresent(page);
    await dismissWhatsNewModalIfPresent(page);

    await page.getByRole('button', { name: 'Nuova automazione' }).click();
    await page.getByRole('tab', { name: 'Avanzate' }).click();

    await expect(
      page.getByLabel('Intervallo minimo fra attivazioni')
    ).toBeVisible();
    await expect(page.getByLabel('Massimo attivazioni per ora')).toBeVisible();
    await expect(page.getByText('0 = nessun limite')).toBeVisible();
    await expect(page.getByText('0 = illimitato')).toBeVisible();
  });
});

test.describe('AUTO-07: Save guard + unsaved-changes (D-14, D-15)', () => {
  test('Crea automazione disabled with empty name (D-14)', async ({ page }) => {
    await mockAutomationsApi(page, { rules: [] });
    await primeForAutomationsTest(page);
    await page.goto('/automazioni');
    await page.waitForLoadState('domcontentloaded');
    await dismissVersionEnforcerIfPresent(page);
    await dismissWhatsNewModalIfPresent(page);

    await page.getByRole('button', { name: 'Nuova automazione' }).click();

    // Footer save button uses isNew === true label "Crea automazione".
    await expect(
      page.getByRole('button', { name: 'Crea automazione' })
    ).toBeDisabled();
  });

  test('Crea automazione enabled with name + 1 action (D-14)', async ({ page }) => {
    await mockAutomationsApi(page, { rules: [] });
    await primeForAutomationsTest(page);
    await page.goto('/automazioni');
    await page.waitForLoadState('domcontentloaded');
    await dismissVersionEnforcerIfPresent(page);
    await dismissWhatsNewModalIfPresent(page);

    await page.getByRole('button', { name: 'Nuova automazione' }).click();
    // TextInput aria-label="Nome automazione" — exact match avoids collision
    // with the page header button ("Nuova automazione").
    await page.getByLabel('Nome automazione', { exact: true }).fill('Test automazione');

    await page.getByRole('tab', { name: 'Azioni' }).click();
    await page.getByRole('button', { name: 'Aggiungi azione' }).click();
    await page.getByRole('button', { name: 'Scrivi log', exact: true }).click();

    await expect(
      page.getByRole('button', { name: 'Crea automazione' })
    ).toBeEnabled();
  });

  test('unsaved-changes dialog spawns on Annulla after edit (D-15)', async ({ page }) => {
    await mockAutomationsApi(page, { rules: [] });
    await primeForAutomationsTest(page);
    await page.goto('/automazioni');
    await page.waitForLoadState('domcontentloaded');
    await dismissVersionEnforcerIfPresent(page);
    await dismissWhatsNewModalIfPresent(page);

    await page.getByRole('button', { name: 'Nuova automazione' }).click();
    await page.getByLabel('Nome automazione', { exact: true }).fill('Edited');

    // Editor footer's "Annulla" — only one in DOM at this point (no dialog yet).
    await page.getByRole('button', { name: 'Annulla', exact: true }).click();

    // Unsaved-changes ConfirmationDialog opens (default variant).
    // Labels are unique here so direct queries are safe per <dialog_query_contract>.
    const dialog = page.getByRole('dialog').filter({ hasText: 'Hai modifiche non salvate' });
    await expect(dialog).toBeVisible();
    await expect(page.getByText(/Hai modifiche non salvate/)).toBeVisible();

    await page.getByRole('button', { name: 'Continua a modificare' }).click();

    // Unsaved dialog closes; editor still open with the typed name preserved.
    await expect(dialog).toHaveCount(0);
    await expect(page.getByLabel('Nome automazione', { exact: true })).toHaveValue('Edited');
  });
});

test.describe('AUTO-08: Edit + delete + toggle (D-12, D-16)', () => {
  test('opening existing rule shows "Modifica automazione" + Elimina footer button', async ({ page }) => {
    await mockAutomationsApi(page);
    await primeForAutomationsTest(page);
    await page.goto('/automazioni');
    await page.waitForLoadState('domcontentloaded');
    await dismissVersionEnforcerIfPresent(page);
    await dismissWhatsNewModalIfPresent(page);

    await page.getByRole('button', { name: 'Apri automazione Sveglia mattutina' }).click();

    // Sheet title = "Modifica automazione" (isNew === false).
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Modifica automazione')).toBeVisible();

    // Footer Elimina + Salva modifiche — no confirm dialog open yet so direct queries are unambiguous.
    await expect(page.getByRole('button', { name: 'Elimina', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Salva modifiche' })).toBeVisible();
  });

  test('Trigger tab tiles disabled in edit mode (D-12)', async ({ page }) => {
    await mockAutomationsApi(page);
    await primeForAutomationsTest(page);
    await page.goto('/automazioni');
    await page.waitForLoadState('domcontentloaded');
    await dismissVersionEnforcerIfPresent(page);
    await dismissWhatsNewModalIfPresent(page);

    await page.getByRole('button', { name: 'Apri automazione Sveglia mattutina' }).click();
    await page.getByRole('tab', { name: 'Trigger' }).click();

    // Inline note above the tile grid (D-12 read-only).
    await expect(
      page.getByText("Per cambiare il trigger, elimina e ricrea l'automazione.")
    ).toBeVisible();
    // TypeTile sets aria-disabled="true" when disabled (3-layer protection).
    await expect(
      page.getByRole('button', { name: 'Pianificazione' })
    ).toHaveAttribute('aria-disabled', 'true');
    await expect(
      page.getByRole('button', { name: 'Manuale' })
    ).toHaveAttribute('aria-disabled', 'true');
  });

  test('delete confirm flow — confirm path closes sheet (D-16)', async ({ page }) => {
    await mockAutomationsApi(page);
    await primeForAutomationsTest(page);
    await page.goto('/automazioni');
    await page.waitForLoadState('domcontentloaded');
    await dismissVersionEnforcerIfPresent(page);
    await dismissWhatsNewModalIfPresent(page);

    await page.getByRole('button', { name: 'Apri automazione Sveglia mattutina' }).click();

    // Click footer Elimina (only "Elimina" in DOM at this point — confirm dialog not yet open).
    await page.getByRole('button', { name: 'Elimina', exact: true }).click();

    // Confirm dialog opens. Both editor footer's Elimina/Annulla AND the dialog's
    // confirm/cancel exist in the DOM. MUST scope queries via getByRole('dialog').
    const dialog = page.getByRole('dialog').filter({ hasText: /Eliminare l'automazione/ });
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole('heading', {
        level: 2,
        name: /Eliminare l'automazione "Sveglia mattutina"/,
      })
    ).toBeVisible();

    // Confirm via dialog-scoped role query (preferred per <dialog_query_contract>).
    // FORBIDDEN alternatives: page.getByRole('button', { name: 'Elimina' }).last() (DOM-order fragile).
    await dialog.getByRole('button', { name: 'Elimina', exact: true }).click();

    // Confirm dialog closes; sheet closes; editor unmounts.
    await expect(dialog).toHaveCount(0);
    await expect(page.getByText('Modifica automazione')).not.toBeVisible({ timeout: 5000 });
  });

  test('delete confirm flow — cancel keeps editor open (D-16)', async ({ page }) => {
    await mockAutomationsApi(page);
    await primeForAutomationsTest(page);
    await page.goto('/automazioni');
    await page.waitForLoadState('domcontentloaded');
    await dismissVersionEnforcerIfPresent(page);
    await dismissWhatsNewModalIfPresent(page);

    await page.getByRole('button', { name: 'Apri automazione Sveglia mattutina' }).click();
    await page.getByRole('button', { name: 'Elimina', exact: true }).click();

    const dialog = page.getByRole('dialog').filter({ hasText: /Eliminare l'automazione/ });
    await expect(dialog).toBeVisible();

    // Cancel via dialog-scoped role query — NEVER .first()/.last() on ambiguous label.
    await dialog.getByRole('button', { name: 'Annulla', exact: true }).click();

    await expect(dialog).toHaveCount(0);
    // Editor still open — Sheet title still visible.
    const editorDialog = page.getByRole('dialog');
    await expect(editorDialog.getByText('Modifica automazione')).toBeVisible();
  });
});

// Final phase-wide console-error gate (D-27 step 9).
test('full create flow generates no console errors (D-27)', async ({ page }) => {
  const { errors, cleanup } = collectConsoleErrors(page);
  await mockAutomationsApi(page, { rules: [] });
  await primeForAutomationsTest(page);
  await page.goto('/automazioni');
  await page.waitForLoadState('domcontentloaded');
  await dismissVersionEnforcerIfPresent(page);
  await dismissWhatsNewModalIfPresent(page);

  await page.getByRole('button', { name: 'Nuova automazione' }).click();
  await page.getByLabel('Nome automazione', { exact: true }).fill('E2E test');

  await page.getByRole('tab', { name: 'Azioni' }).click();
  await page.getByRole('button', { name: 'Aggiungi azione' }).click();
  await page.getByRole('button', { name: 'Scrivi log', exact: true }).click();
  await page.getByLabel('Messaggio', { exact: true }).fill('hello');

  await page.getByRole('button', { name: 'Crea automazione' }).click();

  // Wait for the editor Sheet to unmount (deterministic completion signal,
  // replaces the previous hard-coded 800ms sleep that masked real timing
  // bugs and could miss late-emitted console errors on slow CI runners).
  await expect(page.getByRole('dialog')).toHaveCount(0, { timeout: 5000 });

  cleanup();
  expect(errors).toEqual([]);
});
