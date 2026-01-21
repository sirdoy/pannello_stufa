# CLAUDE.md - Pannello Stufa

**Next.js 15.5 PWA** | Thermorossi stove, Netatmo thermostat, Philips Hue

## Commands

```bash
npm run dev    # localhost:3000
npm test       # Run tests
```

## Rules

1. **NEVER** break existing functionality
2. **WAIT** for user confirmation before version updates
3. **PREFER** editing existing files over creating new
4. **NEVER** execute `npm run build` or `npm install`
5. **ALWAYS** create/update unit tests
6. **USE** design system → `/debug/design-system`
7. **NEVER** commit/push without explicit request

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

**v1.76.0** | 2026-01-21
