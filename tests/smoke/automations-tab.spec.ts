import { test, expect } from '../fixtures';
import { type ConsoleMessage, type Page } from '@playwright/test';
import { waitForHydration } from '../helpers/hydration';
import type { AutomationRule } from '@/types/automations';

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
 * Auth: reuses the per-worker login session from tests/fixtures.ts (Phase 51 pattern,
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
 *
 * WR-05 (REVIEW iteration 2): rules typed as Partial<AutomationRule>[]
 * (was: object[]). Catches fixture overrides that drop required fields
 * (e.g. forgetting `actions: []`) at compile time instead of crashing
 * AutomationRow.tsx at `rule.actions.length` during the smoke run.
 */
async function mockAutomationsApi(
  page: Page,
  opts: { rules?: Partial<AutomationRule>[] } = {}
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
    await page.goto('/automazioni');
    await page.waitForLoadState('domcontentloaded');
    await waitForHydration(page);

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
    await page.goto('/automazioni');
    await page.waitForLoadState('domcontentloaded');
    await waitForHydration(page);

    // Anchor on the full empty-state sentence to avoid false matches on
    // hypothetical strings like "Nessuna automazione attiva" elsewhere.
    await expect(page.getByText(/Nessuna automazione\. Tocca/)).toBeVisible({ timeout: 10000 });

    cleanup();
    expect(errors).toEqual([]);
  });
});

test.describe('AUTO-02: Editor open + 4 tabs', () => {
  test('Nuova opens Sheet titled "Nuova automazione" with 4 tabs', async ({ page }) => {
    await mockAutomationsApi(page, { rules: [] });
    await page.goto('/automazioni');
    await page.waitForLoadState('domcontentloaded');
    await waitForHydration(page);

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
    await page.goto('/automazioni');
    await page.waitForLoadState('domcontentloaded');
    await waitForHydration(page);

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
    await page.goto('/automazioni');
    await page.waitForLoadState('domcontentloaded');
    await waitForHydration(page);

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
    await page.goto('/automazioni');
    await page.waitForLoadState('domcontentloaded');
    await waitForHydration(page);

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
    await page.goto('/automazioni');
    await page.waitForLoadState('domcontentloaded');
    await waitForHydration(page);

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
    await page.goto('/automazioni');
    await page.waitForLoadState('domcontentloaded');
    await waitForHydration(page);

    await page.getByRole('button', { name: 'Nuova automazione' }).click();

    // Footer save button uses isNew === true label "Crea automazione".
    await expect(
      page.getByRole('button', { name: 'Crea automazione' })
    ).toBeDisabled();
  });

  test('Crea automazione enabled with name + 1 action (D-14)', async ({ page }) => {
    await mockAutomationsApi(page, { rules: [] });
    await page.goto('/automazioni');
    await page.waitForLoadState('domcontentloaded');
    await waitForHydration(page);

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
    await page.goto('/automazioni');
    await page.waitForLoadState('domcontentloaded');
    await waitForHydration(page);

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
    await page.goto('/automazioni');
    await page.waitForLoadState('domcontentloaded');
    await waitForHydration(page);

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
    await page.goto('/automazioni');
    await page.waitForLoadState('domcontentloaded');
    await waitForHydration(page);

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
    await page.goto('/automazioni');
    await page.waitForLoadState('domcontentloaded');
    await waitForHydration(page);

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
    await page.goto('/automazioni');
    await page.waitForLoadState('domcontentloaded');
    await waitForHydration(page);

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
  await page.goto('/automazioni');
  await page.waitForLoadState('domcontentloaded');
  await waitForHydration(page);

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
