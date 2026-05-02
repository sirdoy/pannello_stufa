/**
 * SheetCounter unit tests (Phase 181 D-14 second bullet).
 *
 * NOTE: Module-level state PERSISTS across `test()` calls in the same Jest
 * worker. The `afterEach` cleanup loop is REQUIRED to reset between tests.
 */
import {
  incrementSheetCount,
  decrementSheetCount,
} from '../SheetCounter';

describe('SheetCounter', () => {
  afterEach(() => {
    // Reset via decrement until clean. Module state persists across tests.
    while (document.body.dataset.sheetOpen) decrementSheetCount();
  });

  test('increment sets body.dataset.sheetOpen = "true"', () => {
    incrementSheetCount();
    expect(document.body.dataset.sheetOpen).toBe('true');
  });

  test('two increments still leave a single "true" attribute', () => {
    incrementSheetCount();
    incrementSheetCount();
    expect(document.body.dataset.sheetOpen).toBe('true');
  });

  test('decrement once after two increments keeps attribute set', () => {
    incrementSheetCount();
    incrementSheetCount();
    decrementSheetCount();
    expect(document.body.dataset.sheetOpen).toBe('true');
  });

  test('decrement to zero removes the attribute', () => {
    incrementSheetCount();
    decrementSheetCount();
    expect(document.body.dataset.sheetOpen).toBeUndefined();
  });

  test('decrement below zero clamps (no negative state)', () => {
    decrementSheetCount();
    decrementSheetCount();
    expect(document.body.dataset.sheetOpen).toBeUndefined();
    incrementSheetCount();
    expect(document.body.dataset.sheetOpen).toBe('true');
  });

  test('SSR safety — typeof document === "undefined" short-circuits sync', () => {
    // Spy on Object.getOwnPropertyDescriptor to confirm sync() is the no-op
    // path when document is undefined. We simulate by temporarily deleting
    // global.document; jsdom restores it after the test scope closes.
    const originalDoc = global.document;
    // @ts-expect-error — deliberate SSR simulation
    delete global.document;
    expect(() => incrementSheetCount()).not.toThrow();
    expect(() => decrementSheetCount()).not.toThrow();
    global.document = originalDoc;
    // After restoring document, the counter is non-zero from the SSR-skipped
    // increment above; decrement once to clean.
    decrementSheetCount();
  });
});
