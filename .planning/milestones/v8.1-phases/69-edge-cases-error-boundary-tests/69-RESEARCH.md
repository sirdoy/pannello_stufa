# Phase 69: Edge Cases, Error Boundary & Tests - Research

**Researched:** 2026-02-18
**Domain:** Flexbox layout edge cases, React error boundaries, Jest unit testing for pure column-assignment logic
**Confidence:** HIGH

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| EDGE-01 | Layout works correctly with 1 visible card (full-width or left-aligned) | With parity split, 1 card → leftColumn=[{card,flatIndex:0}], rightColumn=[]. The right `flex flex-col flex-1 min-w-0` div renders empty. `flex-1` gives it equal width to the left column even with no content. Empty flex children in a `flex flex-row` parent still take their `flex-1` share, creating a half-width blank column. Fix: conditionally omit or hide the right column when it is empty, OR replace `flex-1` with `flex-none` and `w-full` on the single column, OR detect rightColumn.length===0 and render a single full-width column instead. |
| EDGE-02 | Layout works correctly with odd number of visible cards (3, 5) | With 3 cards: leftColumn=[0,2], rightColumn=[1]. With 5: leftColumn=[0,2,4], rightColumn=[1,3]. After the right column's last card (card 1 in the 3-card case), the column ends — no blank space artifact from the flex column itself (it collapses naturally to the height of its content). Odd counts do NOT produce blank space in the right column because `flex flex-col` does not add trailing space. The only visual artifact could come from the column container being `flex-1` (equal-width) while having fewer items — but that is width equality, not vertical space. No fix needed unless a false bottom border/background appears. |
| EDGE-03 | Error boundary fallback has minimum height to prevent column collapse | `ErrorFallback` currently renders `<Card variant="elevated" className="p-6">` with centered content. Card has `p-5 sm:p-6` from its `padding: true` default; the extra `className="p-6"` overrides on mobile. The fallback will have natural height driven by its text+icon+button content (~180px typical). However, if the error message is very short or the browser renders the content compactly, the column holding a single error fallback could appear visually small compared to a healthy card in the opposite column. Fix: add `min-h-[160px]` (or `min-h-40`) to the `ErrorFallback` wrapper so the fallback always occupies a meaningful height and the column does not look collapsed. |
</phase_requirements>

---

## Summary

Phase 69 addresses three edge cases in the flexbox masonry layout built in Phase 68, plus adds unit tests for the column-assignment logic. The core implementation in `app/page.tsx` correctly handles many-card scenarios but has a measurable defect for the 1-card case (EDGE-01): when only one card is visible, the `flex-row` layout places an empty `flex-1` right column beside the card's column, causing a visual half-width gap on the right side.

The odd-count case (EDGE-02) is not defective — `flex flex-col` columns simply end after their last item, leaving no trailing blank space inside the column div. The only concern is whether the equal-width constraint from `flex-1` looks odd when one column has more cards than the other (e.g., left=3 cards, right=2 cards), but that is the intended masonry aesthetic.

For EDGE-03, the `ErrorFallback` currently has no explicit `min-h` class. Adding one ensures that a column containing only an error fallback does not appear visually collapsed compared to its neighbor.

For the unit tests (Success Criterion 4), the column assignment logic is a pure function of the `visibleCards` array and the `i % 2` split. This logic can be extracted and tested independently of Next.js server rendering — no React render is needed to assert column membership. The test file goes in `app/__tests__/` or alongside `page.tsx`.

**Primary recommendation:** (1) Fix EDGE-01 by conditionally rendering a single full-width column when `rightColumn.length === 0`. (2) Add `min-h-[160px]` to `ErrorFallback` for EDGE-03. (3) Write unit tests that call the column-split logic directly (extract to a helper or test via the pure array logic inline) covering counts 0, 1, 2, 3, 5, 6.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tailwind CSS | v4 | `min-h-[160px]` or `min-h-40` utility, conditional class toggling | Already installed, zero new deps |
| React | 19 (Next.js 15.5) | JSX rendering | Already in use |
| Jest + @testing-library/react | Already installed | Unit tests for column assignment | Existing test infrastructure |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None | — | — | Zero new dependencies required |

**Installation:** No new packages. All libraries already present.

---

## Architecture Patterns

### Recommended Project Structure

```
app/
├── page.tsx                              ← Fix EDGE-01 (conditional right column) + EDGE-02 verification
├── components/ErrorBoundary/
│   └── ErrorFallback.tsx                 ← Add min-h for EDGE-03
└── __tests__/
    └── dashboardColumnAssignment.test.ts ← New test file for EDGE unit tests
```

No new source files except the test file.

### Pattern 1: Conditional Right Column (EDGE-01 fix)

**What:** When `rightColumn.length === 0`, render the left column as a single full-width div instead of inside a `flex-row` with an empty second column.

**When to use:** Always active — the masonry layout must handle any card count ≥ 0.

**Example:**
```tsx
// app/page.tsx — desktop masonry block
<div className="hidden sm:flex sm:flex-row gap-8 lg:gap-10">
  <div className={`flex flex-col gap-8 lg:gap-10 ${rightColumn.length === 0 ? 'w-full' : 'flex-1 min-w-0'}`}>
    {leftColumn.map(({ card, flatIndex }) => renderCard(card, flatIndex))}
  </div>
  {rightColumn.length > 0 && (
    <div className="flex flex-col gap-8 lg:gap-10 flex-1 min-w-0">
      {rightColumn.map(({ card, flatIndex }) => renderCard(card, flatIndex))}
    </div>
  )}
</div>
```

**Alternative — always render both columns, but override flex on left when right is empty:**
```tsx
<div className="hidden sm:flex sm:flex-row gap-8 lg:gap-10">
  <div className={`flex flex-col gap-8 lg:gap-10 min-w-0 ${rightColumn.length === 0 ? 'w-full' : 'flex-1'}`}>
    {leftColumn.map(...)}
  </div>
  {rightColumn.length > 0 && (
    <div className="flex flex-col gap-8 lg:gap-10 flex-1 min-w-0">
      {rightColumn.map(...)}
    </div>
  )}
</div>
```

**The key insight:** `flex-1` on both columns produces equal widths even when one column is empty. Removing the right column from the DOM entirely (conditional render) is simpler and more correct than CSS-only solutions.

### Pattern 2: Min-Height on Error Fallback (EDGE-03 fix)

**What:** Add `min-h-[160px]` to the `<Card>` in `ErrorFallback` to ensure the fallback always occupies meaningful vertical space.

**When to use:** Always — prevents column collapse when a card throws and only the fallback remains.

**Example:**
```tsx
// app/components/ErrorBoundary/ErrorFallback.tsx
export default function ErrorFallback({ ... }) {
  return (
    <Card variant="elevated" className="p-6 min-h-[160px]">
      <div className="flex flex-col items-center justify-center space-y-4 text-center h-full">
        ...
      </div>
    </Card>
  );
}
```

Adding `h-full` to the inner div ensures the centered content uses the full card height when `min-h` kicks in.

### Pattern 3: Testing Pure Column-Assignment Logic

**What:** The column assignment is pure array logic (`i % 2 === 0` → left, else right). It does not require React rendering to test. Extract the logic or test it as a standalone function.

**Two approaches:**

**Option A — Extract helper function (preferred):**
```typescript
// app/lib/utils/dashboardColumns.ts  (new utility)
export type CardEntry = { id: string; [key: string]: unknown };

export function splitIntoColumns<T>(
  cards: T[]
): { left: Array<{ card: T; flatIndex: number }>; right: Array<{ card: T; flatIndex: number }> } {
  const left: Array<{ card: T; flatIndex: number }> = [];
  const right: Array<{ card: T; flatIndex: number }> = [];
  cards.forEach((card, i) => {
    if (i % 2 === 0) left.push({ card, flatIndex: i });
    else right.push({ card, flatIndex: i });
  });
  return { left, right };
}
```

Then test `splitIntoColumns` directly:
```typescript
// app/__tests__/dashboardColumnAssignment.test.ts
import { splitIntoColumns } from '@/lib/utils/dashboardColumns';

describe('splitIntoColumns', () => {
  it('0 cards: both columns empty', () => { ... });
  it('1 card: left=[card0], right=[]', () => { ... });
  // etc.
});
```

**Option B — Inline logic, test by importing page.tsx internals (NOT recommended):**
Next.js server components (`app/page.tsx`) use `async function`, `auth0.getSession()`, and other server APIs that are not easily mockable in Jest. Testing page.tsx directly would require mocking auth0, getUnifiedDeviceConfigAdmin, all card components, etc. — significant overhead.

**Recommendation: Use Option A.** Extract `splitIntoColumns` to a utility, test that utility. The utility is a pure TypeScript function with zero dependencies — trivial to test, high coverage value.

**Option C — Inline array computation test (no extract needed):**
If extracting a utility is considered overkill for 5 lines of code, the test can replicate the logic inline:
```typescript
function splitCards(cards: Array<{ id: string }>) {
  const left: Array<{ card: { id: string }; flatIndex: number }> = [];
  const right: Array<{ card: { id: string }; flatIndex: number }> = [];
  cards.forEach((card, i) => {
    if (i % 2 === 0) left.push({ card, flatIndex: i });
    else right.push({ card, flatIndex: i });
  });
  return { left, right };
}
```

This is pragmatic but means the test doesn't actually import from `page.tsx` — it tests a local reimplementation. If the actual code changes (e.g., someone changes the split logic), the test would still pass. Option A (extract + import) is tighter coupling.

**Decision for planner:** Given that `app/page.tsx` is a server component that requires extensive mocking to import in Jest, **extract the split logic to a utility and test that utility**. This satisfies the success criterion ("Unit tests cover column assignment for 0, 1, 2, 3, 5, 6 counts") without the complexity of server component testing.

### Pattern 4: Test Coverage for Edge Counts

Required counts per Success Criterion 4: **0, 1, 2, 3, 5, 6** visible cards.

For each count, assert:
1. `left.length` and `right.length` are correct
2. `left` contains the expected flatIndices (0, 2, 4...)
3. `right` contains the expected flatIndices (1, 3, 5...)
4. `right.length === 0` when `count === 1` (EDGE-01 precondition)
5. `left.length === right.length + 1` for odd counts (EDGE-02 shape)

```typescript
describe('Column assignment edge cases', () => {
  describe('0 cards', () => {
    it('both columns empty', () => {
      const { left, right } = splitIntoColumns([]);
      expect(left).toHaveLength(0);
      expect(right).toHaveLength(0);
    });
  });

  describe('1 card', () => {
    it('left has 1 card, right is empty', () => {
      const cards = [{ id: 'stove' }];
      const { left, right } = splitIntoColumns(cards);
      expect(left).toHaveLength(1);
      expect(right).toHaveLength(0);
      expect(left[0]!.flatIndex).toBe(0);
    });
  });

  describe('2 cards', () => {
    it('left=[0], right=[1]', () => {
      const cards = [{ id: 'stove' }, { id: 'thermostat' }];
      const { left, right } = splitIntoColumns(cards);
      expect(left[0]!.flatIndex).toBe(0);
      expect(right[0]!.flatIndex).toBe(1);
    });
  });

  describe('3 cards (odd)', () => {
    it('left=[0,2], right=[1], left has 1 more than right', () => {
      const cards = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
      const { left, right } = splitIntoColumns(cards);
      expect(left).toHaveLength(2);
      expect(right).toHaveLength(1);
      expect(left.map(e => e.flatIndex)).toEqual([0, 2]);
      expect(right.map(e => e.flatIndex)).toEqual([1]);
    });
  });

  describe('5 cards (odd)', () => {
    it('left=[0,2,4], right=[1,3]', () => {
      const cards = Array.from({ length: 5 }, (_, i) => ({ id: String(i) }));
      const { left, right } = splitIntoColumns(cards);
      expect(left.map(e => e.flatIndex)).toEqual([0, 2, 4]);
      expect(right.map(e => e.flatIndex)).toEqual([1, 3]);
    });
  });

  describe('6 cards (even)', () => {
    it('left=[0,2,4], right=[1,3,5], equal column sizes', () => {
      const cards = Array.from({ length: 6 }, (_, i) => ({ id: String(i) }));
      const { left, right } = splitIntoColumns(cards);
      expect(left).toHaveLength(3);
      expect(right).toHaveLength(3);
      expect(left.map(e => e.flatIndex)).toEqual([0, 2, 4]);
      expect(right.map(e => e.flatIndex)).toEqual([1, 3, 5]);
    });
  });
});
```

### Anti-Patterns to Avoid

- **Testing `app/page.tsx` directly in Jest:** The file uses `async` server functions (`auth0.getSession`, `getUnifiedDeviceConfigAdmin`) that require elaborate mocking. Testing the pure column-split utility is the right level of abstraction.
- **CSS-only fix for EDGE-01 (empty column):** Using `empty:hidden` on the right column div is tempting but unreliable — `empty:` in Tailwind v4 applies when the element has no children, but an empty `flex flex-col` div technically has no children. However, `empty:hidden` is Tailwind v3+ and may work in v4. The explicit conditional render `{rightColumn.length > 0 && <div>...}` is more explicit and readable.
- **Using `height: auto → auto` CSS transition for EDGE-03:** Already documented in Phase 68 research as non-animatable. The min-height approach does not involve transitions.
- **Omitting flatIndex assertions in tests:** The flatIndex is what drives stagger animation delay. Tests must verify flatIndex values, not just column membership.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Column assignment | Custom CSS column counter | Pure `i % 2` array split | Already done in Phase 68 — extract to utility |
| Min-height enforcement | JS ResizeObserver | `min-h-[160px]` Tailwind utility | JSDOM cannot measure computed heights; CSS utility is simpler |
| Server component testing | Mock everything in page.tsx | Extract and test pure utility | Server component testing is complex and fragile |

---

## Common Pitfalls

### Pitfall 1: EDGE-01 — Empty Right Column Still Takes `flex-1` Width

**What goes wrong:** With 1 visible card, `rightColumn = []`. The desktop layout renders two `flex-1` divs — left gets the card, right renders as an empty div that still occupies ~50% of the container width. The dashboard looks like the card only fills half the screen.

**Why it happens:** `flex-1` (shorthand for `flex: 1 1 0%`) makes each child take equal shares of the flex container, regardless of content. An empty flex child still claims its share.

**How to avoid:** Conditional render: only render the right column div when `rightColumn.length > 0`. When `rightColumn` is empty, give the left column `w-full` instead of `flex-1`.

**Warning signs:** On a fresh account with only 1 card visible, the card renders at 50% viewport width instead of full width (or some responsive fraction).

**JSDOM test limitation:** JSDOM does not compute CSS layout, so `flex-1` width behavior cannot be observed in Jest. This must be verified visually in the browser OR by asserting DOM structure: when `rightColumn.length === 0`, the right column div must not be in the DOM.

---

### Pitfall 2: EDGE-02 — False Assumption That Odd Cards Create Visual Blank Space

**What goes wrong:** A developer might think 3 cards (left=2, right=1) creates a visual "hole" at the bottom of the right column. This is NOT the case with `flex flex-col`.

**Why it DOESN'T happen:** A `flex flex-col` div's height is determined by its children. With 1 child in the right column and 2 in the left, the right column div is shorter. The `flex-row` outer container does not force the shorter column to match the height of the taller one (no `align-items: stretch` on the child divs themselves because they are `flex-col` containers, not grid tracks). Result: right column ends at the bottom of its last card; no blank space appears.

**Verification:** Unit tests confirm the column split is correct. Visual confirmation requires browser inspection to ensure no background/border on the columns makes the empty trailing space visible.

**Warning signs:** If the column divs have a `bg-*` background or `border` class, the shorter column's background would be visible below its last card. Current code has no background on column divs — only on the cards themselves.

---

### Pitfall 3: EDGE-03 — `ErrorFallback` Height Is Not Zero, But May Be Small

**What goes wrong:** The `ErrorFallback` currently renders a `Card` with `p-6` and content (icon + heading + text + button). Its natural height in a real browser is ~180-220px. However, JSDOM renders all elements with 0 height (no CSS engine), so tests cannot verify this. The concern is whether a minimal error message produces a card small enough to make the column look "collapsed."

**How to avoid:** Add `min-h-[160px]` (or `min-h-40` = 10rem = 160px) to the `ErrorFallback` `Card`. This guarantees a minimum visual size even if error messages are very short. The `h-full` addition to the inner flex div ensures the centering works within the imposed minimum height.

**Why 160px:** It's close to the estimated natural height of the error fallback content (icon=40px, heading=24px, text=20px, button=36px, spacing≈40px ≈ 160px). This value prevents a near-zero collapse without over-constraining the layout.

---

### Pitfall 4: Extracting `splitIntoColumns` Utility Changes Import Graph

**What goes wrong:** If `app/page.tsx` currently inlines the split logic and the plan calls for extracting it to `lib/utils/dashboardColumns.ts`, the page.tsx import must be updated. This is a two-file change (utility + page.tsx), not one.

**How to avoid:** Plan must list both files as modified. Test file imports the new utility. Page.tsx imports the utility (or keeps the logic inline — the test can replicate the logic without a formal extract).

**Alternative:** If the planner prefers minimal page.tsx changes, keep the logic inline in page.tsx and write tests that replicate the algorithm (Option C from Pattern 3 above). The downside: test does not actually guard the production code path.

---

### Pitfall 5: `renderCard` Returns `null` for Unknown Card IDs

**What goes wrong:** The column assignment handles card objects from `visibleCards`. `renderCard` has a guard: `if (!CardComponent) return null`. The column assignment test should use known card IDs (or verify that the assignment itself — not the render — is correct).

**Why it matters:** If a test passes a card ID not in `CARD_COMPONENTS` registry, `renderCard` returns null. But `splitIntoColumns` doesn't call `renderCard` — it only splits the array. Unit tests for `splitIntoColumns` don't need to worry about this.

---

## Code Examples

### Current page.tsx desktop block (Phase 68 output)
```tsx
// Source: app/page.tsx lines 103-110
<div className="hidden sm:flex sm:flex-row gap-8 lg:gap-10">
  <div className="flex flex-col gap-8 lg:gap-10 flex-1 min-w-0">
    {leftColumn.map(({ card, flatIndex }) => renderCard(card, flatIndex))}
  </div>
  <div className="flex flex-col gap-8 lg:gap-10 flex-1 min-w-0">
    {rightColumn.map(({ card, flatIndex }) => renderCard(card, flatIndex))}
  </div>
</div>
```

### Fixed desktop block (EDGE-01)
```tsx
<div className="hidden sm:flex sm:flex-row gap-8 lg:gap-10">
  <div className={`flex flex-col gap-8 lg:gap-10 min-w-0 ${rightColumn.length === 0 ? 'w-full' : 'flex-1'}`}>
    {leftColumn.map(({ card, flatIndex }) => renderCard(card, flatIndex))}
  </div>
  {rightColumn.length > 0 && (
    <div className="flex flex-col gap-8 lg:gap-10 flex-1 min-w-0">
      {rightColumn.map(({ card, flatIndex }) => renderCard(card, flatIndex))}
    </div>
  )}
</div>
```

### ErrorFallback with min-h (EDGE-03)
```tsx
// Source: app/components/ErrorBoundary/ErrorFallback.tsx
export default function ErrorFallback({...}: ErrorFallbackProps) {
  return (
    <Card variant="elevated" className="p-6 min-h-[160px]">
      <div className="flex flex-col items-center justify-center space-y-4 text-center h-full">
        <div className="text-4xl mb-4">{deviceIcon}</div>
        <Heading level={3} variant="ember">Errore: {deviceName}</Heading>
        <Text variant="secondary">{errorMessage}</Text>
        <Button variant="ember" onClick={resetErrorBoundary}>Riprova</Button>
      </div>
    </Card>
  );
}
```

### Column assignment utility (for testing)
```typescript
// lib/utils/dashboardColumns.ts (new file if extracting)
export function splitIntoColumns<T>(cards: T[]): {
  left: Array<{ card: T; flatIndex: number }>;
  right: Array<{ card: T; flatIndex: number }>;
} {
  const left: Array<{ card: T; flatIndex: number }> = [];
  const right: Array<{ card: T; flatIndex: number }> = [];
  cards.forEach((card, i) => {
    if (i % 2 === 0) left.push({ card, flatIndex: i });
    else right.push({ card, flatIndex: i });
  });
  return { left, right };
}
```

### Test file location options
```
Option A (new utility): lib/utils/__tests__/dashboardColumns.test.ts
Option B (inline logic): app/__tests__/dashboardColumnAssignment.test.ts
```

Note: `app/__tests__/` dir does not currently exist — create it. The test file itself is a `.test.ts` (not `.tsx`) since it tests pure TypeScript, no JSX needed.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| CSS Grid (equal rows) | Two-column flex masonry | Phase 68 | Eliminates vertical gaps |
| No edge case handling | Conditional column rendering for 1-card case | Phase 69 | Prevents half-width card layout |
| No min-height on fallback | `min-h-[160px]` on ErrorFallback | Phase 69 | Prevents column collapse on error |
| No unit tests for column logic | Extracted utility + tests | Phase 69 | Regression protection for card count edge cases |

---

## Open Questions

1. **Extract `splitIntoColumns` utility or replicate inline in tests?**
   - What we know: Testing `app/page.tsx` directly requires mocking auth0, Firebase, and all card components — high overhead
   - What's unclear: Whether the team prefers an extracted utility (cleaner, testable, reusable) vs. inlining the algorithm in the test (simpler, no source file changes beyond page.tsx)
   - Recommendation: **Extract to `lib/utils/dashboardColumns.ts`** — it's 8 lines, has zero deps, and makes the test directly guard the production code path. Import it in page.tsx to replace the inline forEach.

2. **Is EDGE-02 (odd card counts) truly a no-op fix?**
   - What we know: `flex flex-col` columns collapse to their content height — no trailing blank space inside the column container
   - What's unclear: Whether the column divs themselves have any visible background or border that would make the shorter column's "extra space" visible
   - Recommendation: Verify in code that column divs have no `bg-*` or `border` class. Current code has neither — EDGE-02 requires only a test assertion, no code fix.

3. **Min-height value for EDGE-03**
   - What we know: ErrorFallback natural height ≈ 160-220px in a real browser; JSDOM cannot measure this
   - What's unclear: Whether 160px is the right floor value (too small? too large relative to the smallest real card?)
   - Recommendation: Use `min-h-[160px]` (10rem). This is conservative and matches the estimated natural content height. Can be adjusted visually after implementation.

4. **Test file location**
   - What we know: `app/__tests__/` does not yet exist; `lib/utils/__tests__/` may or may not exist
   - What's unclear: Which location the team prefers for layout-related utility tests
   - Recommendation: If extracting to `lib/utils/`, place tests in `lib/utils/__tests__/dashboardColumns.test.ts`. If keeping logic inline and testing via page.tsx fixture, `app/__tests__/` is appropriate.

---

## Sources

### Primary (HIGH confidence)
- `app/page.tsx` (Phase 68 output, lines 59-110) — Current parity split implementation, column structure, CARD_COMPONENTS registry
- `app/components/ErrorBoundary/ErrorFallback.tsx` — Current ErrorFallback, no min-h
- `app/components/ui/Card.tsx` — Card variants, `padding: true` = `p-5 sm:p-6`, `rounded-2xl overflow-hidden`
- `app/components/ErrorBoundary/DeviceCardErrorBoundary.tsx` — Error boundary wrapper, ValidationError bypass
- `app/components/ui/__tests__/Grid.test.tsx` — Established testing pattern (render + `toHaveClass`)
- `jest.config.ts` — Test environment: jsdom, moduleNameMapper for `@/`, testMatch pattern
- `jest.setup.ts` — Firebase mock, Auth0 mock, Next.js navigation mock already present
- CSS flexbox spec: `flex-1` behavior with empty containers, `flex flex-col` height collapsing behavior

### Secondary (MEDIUM confidence)
- Tailwind CSS v4 docs (inferred from codebase): `min-h-[160px]`, `w-full`, `flex-1`, `h-full` — all standard utilities present in v4
- React error boundary testing patterns: `react-error-boundary` `FallbackProps` interface tested via standard render()

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- EDGE-01 defect identification: HIGH — `flex-1` on empty container is well-known CSS behavior; confirmed by reading the current page.tsx structure
- EDGE-02 non-defect assessment: HIGH — `flex flex-col` height collapsing is well-known; no background classes on column divs confirmed by reading page.tsx
- EDGE-03 min-height approach: HIGH — Tailwind `min-h-[160px]` is standard; value is an estimate (MEDIUM confidence on exact value)
- Test approach (extract utility): HIGH — Pure TypeScript function, zero dependencies, trivially testable
- flatIndex preservation in tests: HIGH — directly verified from Phase 68 implementation

**Research date:** 2026-02-18
**Valid until:** 2026-03-18 (stable Tailwind/React APIs; layout code changes would invalidate)
