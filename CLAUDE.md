# CLAUDE.md - Pannello Stufa

**Next.js 15.5 PWA** | Thermorossi stove, Netatmo thermostat, Philips Hue

## Commands

```bash
npm run dev             # localhost:3000
npm test                # Run full suite (release gates only — see rule 8)
npm run test:changed    # Tests for files touched vs HEAD
npm run test:quick      # --bail fast iteration
npm run test:unit       # lib + hooks + utils (no jsdom component render)
npm run test:api        # API route tests
npm run test:components # UI component tests
npm run test:pages      # Pages / route tests
```

## Rules

1. **NEVER** break existing functionality
2. **WAIT** for user confirmation before version updates
3. **PREFER** editing existing files over creating new
4. **NEVER** execute `npm run build` or `npm install`
5. **ALWAYS** create/update unit tests
6. **USE** design system → `/debug/design-system`
7. **NEVER** commit/push without explicit request
8. **USE** scoped test subsets in verification — NEVER `npm test` alone from agents or PLAN.md `<verify><automated>` blocks. Prefer `npm test -- <specific paths>` or the scoped scripts: `test:changed`, `test:quick`, `test:unit`, `test:api`, `test:components`, `test:pages`. The full suite is reserved for release gates and CI (`test:ci`).

## Docs

**Full Index**: [docs/INDEX.md](docs/INDEX.md)

| Quick Ref | Link |
|-----------|------|
| Architecture | [docs/architecture.md](docs/architecture.md) |
| API Routes | [docs/api-routes.md](docs/api-routes.md) |
| Design System | [docs/design-system.md](docs/design-system.md) |
| Firebase | [docs/firebase.md](docs/firebase.md) |
| Testing | [docs/testing.md](docs/testing.md) |
| Troubleshooting | [docs/troubleshooting.md](docs/troubleshooting.md) |

## Patterns

```javascript
// Firebase: Filter undefined
await update(ref(db, 'path'), filterUndefined({ field: value }));

// API Routes
export const dynamic = 'force-dynamic';

// Client Components
'use client';

// UI: Variants only
<Heading variant="ember">Title</Heading>
```

## Concepts

| Term | Meaning |
|------|---------|
| Multi-Device | Centralized registry, Self-Contained Pattern |
| Ember Noir | Dark-first UI, ember/copper accents |
| Scheduler | Manual / Automatic / Semi-Manual modes |
| Maintenance | H24 tracking, blocks ignite if needsCleaning |

---

**v17.0** | 2026-03-28
