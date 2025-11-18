/**
 * Visual Inspection Test
 * Cattura screenshot della homepage in vari stati per ispezione manuale UI/UX
 */

const { test } = require('@playwright/test');

const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 720 },
  { name: 'large-desktop', width: 1920, height: 1080 }
];

const THEMES = ['light', 'dark'];

// Esegui solo su Chromium per velocità
test.use({
  browserName: 'chromium',
  launchOptions: {
    headless: false, // Modalità headed
    slowMo: 500 // Rallenta per vedere meglio
  }
});

test.describe('Visual Inspection - Homepage', () => {
  for (const viewport of VIEWPORTS) {
    for (const theme of THEMES) {
      test(`${viewport.name} - ${theme} - skeleton`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });

        // Imposta il tema prima di navigare
        await page.goto('http://localhost:3000');

        await page.evaluate((selectedTheme) => {
          localStorage.setItem('pannello-stufa-theme', selectedTheme);
          document.documentElement.classList.toggle('dark', selectedTheme === 'dark');
        }, theme);

        // Intercetta API per simulare loading
        await page.route('**/api/stove/status', async route => {
          await new Promise(resolve => setTimeout(resolve, 3000));
          await route.continue();
        });

        // Reload per trigger loading state
        await page.reload();

        // Aspetta skeleton (max 1s)
        try {
          await page.waitForSelector('[class*="animate-pulse"]', { timeout: 1000 });
        } catch (e) {
          // Se non trova skeleton, continua comunque
        }

        await page.screenshot({
          path: `visual-inspection/${viewport.name}-${theme}-skeleton.png`,
          fullPage: true
        });
      });

      test(`${viewport.name} - ${theme} - loaded`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });

        await page.goto('http://localhost:3000');

        await page.evaluate((selectedTheme) => {
          localStorage.setItem('pannello-stufa-theme', selectedTheme);
          document.documentElement.classList.toggle('dark', selectedTheme === 'dark');
        }, theme);

        await page.reload();

        // Aspetta caricamento completo
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000); // Extra wait per stabilità

        // Chiudi modal aggiornamento se presente
        const closeButton = page.locator('button:has-text("×"), button[aria-label="Close"]').first();
        try {
          await closeButton.click({ timeout: 2000 });
          await page.waitForTimeout(500); // Aspetta animazione chiusura
        } catch (e) {
          // Modal non presente o già chiuso
        }

        // Chiudi banner "Inizia ad usare" se presente
        const startButton = page.locator('button:has-text("Inizia ad usare")').first();
        try {
          await startButton.click({ timeout: 2000 });
          await page.waitForTimeout(500);
        } catch (e) {
          // Banner non presente
        }

        await page.screenshot({
          path: `visual-inspection/${viewport.name}-${theme}-loaded.png`,
          fullPage: true
        });
      });
    }
  }
});
