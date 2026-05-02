/**
 * Phase 181 — body[data-sheet-open] counter.
 *
 * Module-level mutable counter that toggles `document.body.dataset.sheetOpen`
 * for cross-cutting CSS selectors (e.g. `body[data-sheet-open="true"] [data-bottom-tab="true"]`
 * in globals.css). Counter-based so stacked sheets (Phase 178 device sheets +
 * Phase 180 automation editor) keep the bar hidden until the LAST sheet closes.
 *
 * Why NOT sniff Radix's `data-scroll-locked` attribute: that's a private
 * implementation detail of `react-remove-scroll-bar` set by ANY Radix component
 * using RemoveScroll (Tooltip, Popover with modal, etc.) — would cause
 * false-positive bar-hide if Phase 182 adds an unrelated Radix Tooltip.
 * Custom counter is < 30 LOC and trivially testable.
 *
 * SSR-guarded via `typeof document === 'undefined'` early return.
 * Decrement clamps at 0 to defend against React 19 error-boundary edge cases.
 *
 * Consumed by: app/components/EmberGlass/Sheet.tsx (additive useEffect).
 * Selector hook used by: app/globals.css (Phase 181 hide rules).
 *
 * NOT re-exported from app/components/EmberGlass/index.ts — internal contract only.
 */

let count = 0;

function sync(): void {
  if (typeof document === 'undefined') return;
  if (count > 0) {
    document.body.dataset.sheetOpen = 'true';
  } else {
    delete document.body.dataset.sheetOpen;
  }
}

export function incrementSheetCount(): void {
  count += 1;
  sync();
}

export function decrementSheetCount(): void {
  count = Math.max(0, count - 1);
  sync();
}
