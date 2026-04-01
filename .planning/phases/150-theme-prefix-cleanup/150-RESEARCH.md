# Phase 150: Theme Prefix Cleanup - Research

**Researched:** 2026-04-01
**Domain:** Tailwind CSS class cleanup — mechanical string removal, no new patterns introduced
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Strip the `dark:` prefix from every Tailwind class, keeping the utility value (e.g., `dark:bg-slate-800` becomes `bg-slate-800`). The dark value IS the only value now.
- **D-02:** 19 files affected with ~110 total `dark:` occurrences — mechanical find-and-replace per file.
- **D-03:** Delete entire `html:not(.dark)` rule blocks — these are light-mode overrides with no purpose in a dark-only app (carried forward from Phase 149 decision).
- **D-04:** 159 files affected — the majority are component files using `[html:not(.dark)_&]:` Tailwind arbitrary selector syntax in className strings.
- **D-05:** Split work across plans by file category for coherent review:
  - Plan 1: UI components (`app/components/ui/`) — highest concentration of `html:not(.dark)` selectors
  - Plan 2: Device components (`app/components/devices/`) — all device card families
  - Plan 3: Pages and routes (`app/`, page-level files) — includes stove, network, lights, debug pages
  - Plan 4: Remaining files — scheduler components, lib/, debug panels, settings, misc
  - Plan 5: Design system page cleanup (THEME-10) + final verification grep
- **D-06:** Each plan should end with a verification grep confirming zero remaining occurrences in its file scope.
- **D-07:** Remove any theme toggle UI or light-mode example sections from `/debug/design-system/page.tsx`.
- **D-08:** Keep all dark-only component demos — just remove light-mode variants and toggle functionality.

### Claude's Discretion
- Exact plan count and file grouping within categories (5 plans is a suggestion, may be 3-6 based on file counts)
- Order of plans within the phase
- Whether to combine small categories into fewer plans for efficiency
- How to handle edge cases where `dark:` appears in comments or string literals (likely just remove if theme-related)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| THEME-06 | All `dark:` Tailwind prefixes removed from ~19 files (hardcode dark-only values) | 19 files confirmed, 117 occurrences verified by grep |
| THEME-07 | All `[html:not(.dark)_&]:` selectors removed from components | 160 files confirmed, 1052 occurrences verified by grep |
| THEME-10 | Design system page updated to reflect dark-only (remove theme toggle showcase) | 3 specific Banner blocks + scattered dark:/html:not(.dark) instances identified |
</phase_requirements>

## Summary

Phase 150 is a pure mechanical cleanup phase — no new patterns, no library research required. Phase 149 removed the CSS-layer `html:not(.dark)` blocks from `globals.css` and stripped the ThemeContext/ThemeProvider machinery. What remains are two categories of class-level conditionals that agents can remove through targeted string operations:

1. **`dark:` prefixes in className strings** — 117 occurrences across 19 files. The transformation is: for every `dark:X` class, remove the `dark:` prefix while also removing its light-mode counterpart from the same className (the bare value that `dark:X` was overriding). The dark value becomes the sole value.

2. **`[html:not(.dark)_&]:` arbitrary selectors** — 1052 occurrences across 160 files. The transformation is simpler: delete the entire prefixed class. The non-prefixed dark-mode value on the same element is what remains.

The design system page (`/debug/design-system/page.tsx`) requires additional semantic cleanup under THEME-10: three Banner blocks recommend outdated patterns (`dark:` override pattern, `html:not(.dark)` avoidance, and "test both themes" with a link to `/settings/theme`) must be removed or updated to reflect dark-only reality.

**Primary recommendation:** Split across 5 plans by file category. Each plan is independently executable with no cross-plan dependencies. The planner can parallelize plans 1-4 (independent file scopes) and sequence plan 5 last (verification + design system cleanup).

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tailwind CSS | (project's existing version) | CSS utility classes being edited | Already installed — no new dependencies |

### Supporting
None — this phase requires no new libraries. All work is string manipulation of existing className values.

### Alternatives Considered
None — the transformation rules are locked (D-01 through D-04). No library choices required.

**Installation:** None required.

## Architecture Patterns

### File Categories and Actual Counts (verified by grep)

```
Scope of work (160 files for html:not(.dark), 19 files for dark:):

app/components/ui/         — 48 files with html:not(.dark)  (heaviest: Skeleton 36, Banner 29, Button 21)
app/components/devices/    — 35 files with html:not(.dark)  (heaviest: stoveStatusUtils 62, ThermostatCard 25)
app/components/ (other)    — 27 files with html:not(.dark)  (heaviest: Navbar 25, PidAutomationPanel 36, RoomCard 20)
app/debug/                 — 17 files with html:not(.dark)
app/ page files            — 20 files with html:not(.dark)  (stove, thermostat, lights, network, etc.)
app/stove/ (page comps)    —  6 files with html:not(.dark)
lib/                       —  1 file with html:not(.dark) (version.ts — also has dark: prefixes)
components/ (root)         —  1 file (DeviceListItem.tsx)
app/globals.css            —  0 (already clean from Phase 149)
```

### Transformation Rule 1: `dark:` prefix removal

```tsx
// Before: both light and dark variants present
className="bg-white dark:bg-slate-800 text-black dark:text-white"

// After: only the dark value remains
className="bg-slate-800 text-white"
```

The light-mode counterpart (the bare value the dark: was overriding) is also removed. The dark: value IS the definitive value.

### Transformation Rule 2: `[html:not(.dark)_&]:` selector removal

```tsx
// Before: arbitrary selector class prefixing a light-mode override
className="[html:not(.dark)_&]:bg-white [html:not(.dark)_&]:text-black bg-slate-800 text-white"

// After: only the dark-safe value remains (the non-prefixed class)
className="bg-slate-800 text-white"
```

Delete the entire `[html:not(.dark)_&]:X` token. The remaining non-prefixed classes are the correct dark values.

### Edge Cases to Handle

**Case A: Only `dark:` variant, no explicit light value**
```tsx
// Before
className="dark:bg-slate-800"
// After
className="bg-slate-800"
```
Keep the value, just strip the prefix.

**Case B: `dark:` in a comment or string description**
```tsx
// In version.ts: className strings that describe classes
```
Remove if it is an actual Tailwind class being applied. If in a JSDoc comment describing the old pattern, remove or update the comment.

**Case C: `html:not(.dark)` appearing in `stovePageTheme.ts` and `stoveStatusUtils.ts`**
These are `.ts` utility files that build className strings (not `.tsx` with JSX). The same transformation applies — they build class strings that get passed to JSX. The `[html:not(.dark)_&]:` prefix is in a string literal, so it's a simple string replacement.

**Case D: `[html:not(.dark)_&]:` where no dark-mode counterpart exists**
```tsx
// Before: only a light override, dark side implicit (from base styles)
className="[html:not(.dark)_&]:border-slate-200"
// After: just delete — the base style (whatever applies in dark) is correct
```

### Design System Page Cleanup (THEME-10)

Three specific Banner blocks at lines ~2909-2926 need to be updated/removed:

1. **"Use Light-First + dark: Override"** (warning) — this guidance is now wrong. Should be removed or replaced with "Use dark values directly — no dark: prefix needed."
2. **"AVOID [html:not(.dark)_&]"** (warning) — this guidance is now irrelevant. Remove.
3. **"Test Both Themes"** (ember) — references `/settings/theme` which no longer exists. Remove or replace with dark-only guidance.

Additional instances in the design-system page (from grep: 13 `dark:` instances, 1 `html:not(.dark)` instance) are treated identically to all other files.

### Anti-Patterns to Avoid

- **Do not convert `dark:` to the light value** — the dark value IS the only value. The light value is dead.
- **Do not keep `[html:not(.dark)_&]:` classes** — delete them entirely, they are light-mode overrides.
- **Do not touch non-theme classes** — only remove `dark:` prefixed tokens and `[html:not(.dark)_&]:` prefixed tokens.
- **Do not remove whole className attributes** — only remove the specific tokens that carry the patterns.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Finding all occurrences | Custom script | `grep -r "dark:" --include="*.tsx"` | Already verified counts; simple grep is sufficient per file |
| String replacement | Regex engine | Per-file Read + Edit tool operations | 160 files — agents handle file-by-file with Read/Edit, not scripts |

**Key insight:** This is a Read-then-Edit phase. No new code is created. Each agent reads a file, identifies the pattern tokens, and removes them. The transformation rules are deterministic with no ambiguity.

## Runtime State Inventory

Step 2.5: SKIPPED — this is not a rename/refactor of identifiers. The patterns being removed (`dark:` and `[html:not(.dark)_&]:`) are purely CSS class strings with no runtime state, database storage, or OS registration.

## Common Pitfalls

### Pitfall 1: Removing the Wrong Value in `dark:` Pairs
**What goes wrong:** Agent removes the dark: class but keeps the light-mode counterpart, leaving a light-colored element in a dark app.
**Why it happens:** Transformation is "strip prefix" rather than "strip prefix AND remove its counterpart."
**How to avoid:** For every `dark:X` token removed, also remove the corresponding light-mode token for the same property. E.g., `text-black dark:text-white` → `text-white` (not just `text-black`).
**Warning signs:** After cleanup, elements appear with `text-black` or `bg-white` in a dark app.

### Pitfall 2: Missing Occurrences in `.ts` Utility Files
**What goes wrong:** Agent focuses only on `.tsx` files and skips `stoveStatusUtils.ts`, `stovePageTheme.ts`, `version.ts`, `lib/scheduler/schedulerStats.ts`.
**Why it happens:** The patterns appear in string literals inside pure TypeScript files that build className objects.
**How to avoid:** Treat `.ts` files in scope identically to `.tsx` files — they build className strings that are applied in JSX.
**Warning signs:** Verification grep still shows hits in `.ts` files after plan completes.

### Pitfall 3: Leaving Orphan Light-Mode Values After Selector Removal
**What goes wrong:** For `[html:not(.dark)_&]:bg-white bg-slate-800`, agent removes the selector-prefixed class but also accidentally removes `bg-slate-800`.
**Why it happens:** Overly aggressive removal, or confusion about which is the "real" value.
**How to avoid:** Only remove the `[html:not(.dark)_&]:X` token. Leave the non-prefixed dark values untouched.

### Pitfall 4: Missing the Design System Page Semantic Cleanup
**What goes wrong:** Agent removes the `dark:` class tokens from design-system/page.tsx mechanically but does not update the three stale Banner blocks that advise using `dark:` and testing "both themes."
**Why it happens:** The Banner text content is not a Tailwind class — it's prose describing old patterns. Pattern-matching on `dark:` won't catch it.
**How to avoid:** THEME-10 cleanup is separate from the mechanical class removal. The design system page needs both: class cleanup AND content cleanup of the three Banner blocks.

### Pitfall 5: Verification Grep Matches in worktrees
**What goes wrong:** Post-plan verification grep returns hits from `.claude/worktrees/` directory.
**Why it happens:** There is a worktree (`agent-a1b27081`) that contains a full copy of the codebase with the same patterns.
**How to avoid:** Always exclude `.claude/worktrees` from verification greps: `grep -r "dark:" --include="*.tsx" . | grep -v ".claude/worktrees"`.

## Code Examples

### Verification Grep (end of each plan)
```bash
# Verify dark: cleared in a specific directory
grep -r "dark:" --include="*.tsx" --include="*.ts" app/components/ui/ | grep -v ".claude/worktrees" | wc -l
# Expected: 0

# Verify html:not(.dark) cleared in a specific directory
grep -r "html:not(.dark)" --include="*.tsx" --include="*.ts" app/components/ui/ | grep -v ".claude/worktrees" | wc -l
# Expected: 0
```

### Final Phase Verification (Plan 5)
```bash
# THEME-06: Zero dark: prefixes in codebase
grep -r "dark:" --include="*.tsx" --include="*.ts" --include="*.css" . | grep -v "node_modules" | grep -v ".next" | grep -v ".planning" | grep -v ".claude/worktrees" | wc -l

# THEME-07: Zero html:not(.dark) selectors in codebase
grep -r "html:not(.dark)" --include="*.tsx" --include="*.ts" --include="*.css" . | grep -v "node_modules" | grep -v ".next" | grep -v ".planning" | grep -v ".claude/worktrees" | wc -l

# Both must output: 0
```

### Heavy Files — Spot Check
The files with the highest occurrence counts are the most complex to edit correctly:

- `stoveStatusUtils.ts` (62 occurrences) — builds className objects for stove states
- `PidAutomationPanel.tsx` (36) — complex UI with many styled sections
- `Skeleton.tsx` (36) — design system component with many variants
- `Banner.tsx` (29) — design system component
- `stovePageTheme.ts` (29) — builds className strings for stove page theming
- `StatusBadge.tsx` (18 dark: + 7 html:not(.dark)) — double pattern

## State of the Art

| Old Pattern | Current Pattern | Reason |
|-------------|-----------------|--------|
| `bg-white dark:bg-slate-800` | `bg-slate-800` | App is dark-only since Phase 149 |
| `[html:not(.dark)_&]:bg-white bg-slate-800` | `bg-slate-800` | html:not(.dark) blocks removed in Phase 149 |
| `dark:text-slate-200` | `text-slate-200` | No light mode to switch to |

**Deprecated/outdated (to be removed from design-system page):**
- "Use Light-First + dark: Override" guidance: wrong for dark-only app
- "Test Both Themes" with `/settings/theme` link: settings/theme deleted in Phase 149
- "AVOID [html:not(.dark)_&]" warning: irrelevant since the pattern itself is being deleted

## Open Questions

1. **`toggleState` in design-system/page.tsx (line 95)**
   - What we know: `const [toggleState, setToggleState] = useState<boolean>(false)` is used for a Toggle component demo (not a theme toggle)
   - What's unclear: Whether this is a theme toggle or a UI component demo
   - Recommendation: From context (line 1200, 1995), this is a UI demo state for Toggle/Checkbox/Switch components — leave it alone. It is NOT a theme toggle.

2. **`globals.css` is already clean**
   - What we know: grep confirms 0 `html:not(.dark)` occurrences in globals.css
   - What's unclear: Nothing — Phase 149 completed this correctly
   - Recommendation: No CSS file work needed in Phase 150.

## Environment Availability

Step 2.6: SKIPPED — Phase 150 is purely code/string editing with no external service dependencies. The only tool required is the standard file read/edit toolchain already available.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (jest.config.ts) |
| Config file | jest.config.ts |
| Quick run command | `npm test -- --testPathPattern="Button\|Banner\|StatusBadge\|OfflineBanner" --passWithNoTests` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| THEME-06 | Zero `dark:` prefixes remain in tsx/ts/css | grep verification | `grep -r "dark:" --include="*.tsx" --include="*.ts" app/ lib/ \| grep -v ".claude/worktrees" \| wc -l` → must be 0 | manual-grep |
| THEME-07 | Zero `[html:not(.dark)_&]:` selectors remain | grep verification | `grep -r "html:not(.dark)" --include="*.tsx" --include="*.ts" app/ lib/ components/ \| grep -v ".claude/worktrees" \| wc -l` → must be 0 | manual-grep |
| THEME-10 | Design system page has no theme toggle UI or light-mode examples | manual visual check + unit test | `npm test -- --testPathPattern="design-system" --passWithNoTests` | ❌ no test exists |

**Note on test coverage:** THEME-06 and THEME-07 are verified by grep count (fastest, most reliable). THEME-10 has no automated test — the design system page is a server component without a test file. Visual verification at `/debug/design-system` after cleanup is the gate.

### Sampling Rate
- **Per task commit:** `grep -r "dark:" app/components/ui/ | grep -v ".claude/worktrees" | wc -l` (quick scope check)
- **Per wave merge:** Full grep across all directories (see Phase Verification Grep above)
- **Phase gate:** Both grep counts must be 0 before `/gsd:verify-work`

### Wave 0 Gaps
None — no new test files are needed. This phase does not add functionality; it removes dead CSS patterns. Verification is grep-based, not behavior-based.

## Sources

### Primary (HIGH confidence)
- Direct codebase grep — all counts verified live against the working tree
- `.planning/phases/150-theme-prefix-cleanup/150-CONTEXT.md` — decisions D-01 through D-08
- `.planning/phases/149-theme-removal-core/149-CONTEXT.md` — confirms globals.css is clean, html:not(.dark) blocks deleted at CSS layer

### Secondary (MEDIUM confidence)
- `.planning/REQUIREMENTS.md` — THEME-06, THEME-07, THEME-10 requirement text

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Scope (file counts, occurrence counts): HIGH — verified by live grep
- Transformation rules: HIGH — locked decisions from CONTEXT.md, confirmed by Phase 149 pattern
- Design system page changes: HIGH — line numbers verified by grep + Read
- Pitfalls: HIGH — derived from actual file inspection and transformation logic

**Research date:** 2026-04-01
**Valid until:** 2026-05-01 (stable codebase, no expected churn in affected files)
