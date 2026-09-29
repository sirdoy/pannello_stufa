import type { Page } from '@playwright/test';

/**
 * Wait until React has hydrated the app shell.
 *
 * `domcontentloaded` only means the server HTML is parsed: a click before
 * hydration hits an element without handlers and is silently lost. React
 * attaches a `__reactFiber$…` key to every DOM node it hydrates, so `<main>`
 * (rendered by the root layout) carrying one means handlers are live.
 */
export async function waitForHydration(page: Page, timeout = 15000): Promise<void> {
  await page.waitForFunction(
    () => {
      const main = document.querySelector('main');
      return !!main && Object.keys(main).some((key) => key.startsWith('__reactFiber$'));
    },
    undefined,
    { timeout }
  );
}
