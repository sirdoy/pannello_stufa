---
phase: 11
plan: 03
subsystem: tooling
tags: [eslint, tailwindcss, design-tokens, semantic-tokens]

dependency_graph:
  requires:
    - 11-01 (cn utility for CVA)
  provides:
    - ESLint design token enforcement
    - Semantic token aliases
    - Light/dark mode token system
  affects:
    - 12-* (button component uses semantic tokens)
    - 13-* (form components use semantic tokens)

tech_stack:
  added:
    - eslint-plugin-tailwindcss@4.0.0-beta.0
  patterns:
    - Semantic token aliases (bg-primary -> slate-950)
    - ESLint warn mode for gradual enforcement
    - Native ESLint flat config (no FlatCompat)

files:
  key_files:
    created: []
    modified:
      - eslint.config.mjs
      - package.json
      - app/globals.css

decisions:
  - decision: "Use eslint-plugin-tailwindcss v4 beta"
    rationale: "Stable v3.x requires Tailwind v3.4, incompatible with project's Tailwind v4.1.18"
    timestamp: 2026-01-28
  - decision: "Use native eslint-config-next flat config"
    rationale: "FlatCompat caused circular reference error in ESLint 9 + Next.js 16"
    timestamp: 2026-01-28
  - decision: "Set config: {} for tailwindcss plugin"
    rationale: "Tailwind v4 uses CSS @theme directive, not tailwind.config.js"
    timestamp: 2026-01-28
  - decision: "Start with warn mode, not error"
    rationale: "Allow gradual cleanup of existing arbitrary values"
    timestamp: 2026-01-28

metrics:
  duration: ~12 minutes
  completed: 2026-01-28
---

# Phase 11 Plan 03: ESLint Token Enforcement & Semantic Tokens Summary

ESLint with tailwindcss plugin enforces design tokens via no-arbitrary-value rule; semantic token aliases (bg-primary, text-primary, etc.) map intentions to specific values for consistent theming.

## What Was Built

### 1. ESLint Configuration for Design Token Enforcement

**File:** `eslint.config.mjs`

```javascript
import nextConfig from "eslint-config-next";
import tailwindcss from "eslint-plugin-tailwindcss";

const eslintConfig = [
  ...nextConfig,
  {
    plugins: { tailwindcss },
    settings: { tailwindcss: { config: {} } },
    rules: {
      "tailwindcss/no-arbitrary-value": ["warn", {
        ignoredProperties: ["content", "grid-template-*", "animation", "box-shadow"]
      }],
      "tailwindcss/classnames-order": "warn",
      // ... more rules
    },
  },
];
```

**Key Features:**
- `no-arbitrary-value`: Warns on `bg-[#ff0000]` style arbitrary colors
- `classnames-order`: Enforces consistent Tailwind class ordering
- `no-custom-classname: "off"`: Allows custom classes from globals.css

### 2. Semantic Design Token Aliases

**File:** `app/globals.css` (in @theme block)

| Category | Token | Dark Mode | Light Mode |
|----------|-------|-----------|------------|
| Background | `--color-bg-primary` | slate-950 | slate-50 |
| Background | `--color-bg-secondary` | slate-900 | slate-100 |
| Background | `--color-bg-surface` | slate-850 | slate-200 |
| Background | `--color-bg-elevated` | slate-800 | white |
| Text | `--color-text-primary` | slate-100 | slate-900 |
| Text | `--color-text-secondary` | slate-200 | slate-800 |
| Text | `--color-text-muted` | slate-400 | slate-600 |
| Border | `--color-border-default` | rgba(255,255,255,0.06) | rgba(0,0,0,0.06) |
| Accent | `--color-accent-primary` | ember-500 | ember-500 |
| Interactive | `--color-interactive-hover` | rgba(255,255,255,0.06) | rgba(0,0,0,0.04) |
| Focus | `--color-focus-ring` | rgba(ember,0.5) | rgba(ember,0.5) |
| Overlay | `--color-overlay-backdrop` | rgba(stone,0.8) | rgba(stone,0.9) |

### 3. Fixed Pre-existing Issues

- **ESLint circular reference bug**: FlatCompat + Next.js caused "circular structure to JSON" error
- **Next.js 16 lint command**: `next lint` doesn't exist in v16, updated to `eslint .`
- **Tailwind v4 config path**: Added `config: {}` to skip tailwind.config.js lookup

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| eslint-plugin-tailwindcss v4 beta | Only version supporting Tailwind v4 |
| Native eslint-config-next | FlatCompat caused circular reference |
| Warn mode not error | Gradual cleanup of existing code |
| Semantic token naming | `bg-primary` clearer than `bg-slate-950` |

## Usage Examples

### Before (arbitrary values - now warned)
```jsx
<div className="bg-[#0c0a09] text-[#f5f5f4]">
```

### After (semantic tokens)
```jsx
<div className="bg-bg-primary text-text-primary">
```

### Component Pattern
```jsx
// Use semantic tokens for design intent
<Card className="bg-bg-surface border-border-default">
  <Heading className="text-text-primary">Title</Heading>
  <p className="text-text-muted">Description</p>
</Card>
```

## Verification

```bash
# ESLint plugin installed
npm ls eslint-plugin-tailwindcss
# pannello-stufa@1.77.0
# └── eslint-plugin-tailwindcss@4.0.0-beta.0

# Lint runs without errors
npm run lint  # No output = success

# Arbitrary values warned
# bg-[#ff0000] -> "Arbitrary value detected" warning
```

## Commits

| Hash | Type | Description |
|------|------|-------------|
| 8c95d1a | chore | Install eslint-plugin-tailwindcss v4 beta |
| 11ad296 | feat | Configure ESLint for design token enforcement |
| 4c5b1f9 | feat | Add semantic design token aliases |

## Next Phase Readiness

**Phase 12 (Button Component)** can now:
- Use semantic tokens (`bg-accent-primary`, `text-text-primary`)
- Get ESLint warnings if using arbitrary colors
- Leverage cn() from 11-01 with semantic classes

**Patterns Established:**
- Semantic token naming: `{purpose}-{variant}` (bg-primary, text-muted)
- Light mode overrides: Same token name, different value
- ESLint enforcement: Warn mode for gradual adoption
