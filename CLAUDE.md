# CLAUDE.md - Pannello Stufa

**Next.js 15.5 PWA** per controllo remoto stufa pellet Thermorossi via cloud API + multi-device smart home control (Netatmo, Philips Hue).

---

## Quick Start

```bash
npm install              # Installa dipendenze
cp .env.example .env.local   # Configura environment
npm run dev              # http://localhost:3000
```

**Setup Completo**: [docs/quick-start.md](docs/quick-start.md)

---

## Stack Tecnologico

| Layer | Tecnologie |
|-------|-----------|
| **Frontend** | Next.js 15.5, React 19, Tailwind CSS 4.1 |
| **Backend** | Next.js API Routes, Firebase Admin SDK |
| **Database** | Firebase Realtime Database |
| **Auth** | Auth0 v4 |
| **PWA** | Serwist v9, Service Worker, iOS support |
| **External APIs** | Thermorossi Cloud, Netatmo OAuth 2.0, Philips Hue |
| **Notifications** | Firebase Cloud Messaging (FCM) |

**Architettura Dettagliata**: [docs/architecture.md](docs/architecture.md)

---

## Commands

```bash
# Development
npm run dev              # Dev server
npm test                 # Run tests
npm run test:watch       # Watch mode

# Sandbox Mode (no real API calls)
SANDBOX_MODE=true TEST_MODE=true npm run dev
```

**NEVER run by Claude**: `npm run build`, `npm install`

---

## Documentation Index

### Core

| File | Contenuto |
|------|-----------|
| [quick-start.md](docs/quick-start.md) | Setup, installazione, environment |
| [architecture.md](docs/architecture.md) | Multi-device pattern, folder structure |
| [troubleshooting.md](docs/troubleshooting.md) | Problemi comuni e soluzioni |

### Development

| File | Contenuto |
|------|-----------|
| [api-routes.md](docs/api-routes.md) | Stove API, Scheduler, OAuth patterns |
| [patterns.md](docs/patterns.md) | Code patterns riutilizzabili |
| [data-flow.md](docs/data-flow.md) | Polling, cron, OAuth flow |

### UI & Design

| File | Contenuto |
|------|-----------|
| [design-system.md](docs/design-system.md) | **Ember Noir v2** - Colors, typography, components |
| [ui-components.md](docs/ui-components.md) | Card, Button, Banner, Toast, etc. |
| [ui-modal.md](docs/ui-modal.md) | Modal component patterns |
| [page-transitions.md](docs/page-transitions.md) | View Transitions API, animations |
| [ios18-liquid-glass.md](docs/ios18-liquid-glass.md) | Liquid glass styling |
| [components/navigation.md](docs/components/navigation.md) | Navigation components |

### Firebase

| File | Contenuto |
|------|-----------|
| [firebase.md](docs/firebase.md) | Schema, operations, best practices |
| [firebase-security.md](docs/firebase-security.md) | Security Rules, Admin SDK |

### Systems

| File | Contenuto |
|------|-----------|
| [systems/maintenance.md](docs/systems/maintenance.md) | Tracking ore utilizzo H24 |
| [systems/monitoring.md](docs/systems/monitoring.md) | Cron health monitoring |
| [systems/errors.md](docs/systems/errors.md) | Error detection & logging |
| [systems/notifications.md](docs/systems/notifications.md) | FCM push notifications |

### External Integrations

| File | Contenuto |
|------|-----------|
| [setup/netatmo-setup.md](docs/setup/netatmo-setup.md) | Netatmo OAuth 2.0 setup |
| [setup/hue-setup.md](docs/setup/hue-setup.md) | Philips Hue Local API |
| [setup/fritzbox-setup.md](docs/setup/fritzbox-setup.md) | 🔮 Fritz!Box TR-064 (Future) |

### PWA

| File | Contenuto |
|------|-----------|
| [pwa.md](docs/pwa.md) | Serwist, offline, Background Sync, iOS |

### Testing & Deployment

| File | Contenuto |
|------|-----------|
| [testing.md](docs/testing.md) | Unit tests, coverage |
| [E2E-TESTING.md](docs/E2E-TESTING.md) | End-to-end testing |
| [visual-screenshots.md](docs/visual-screenshots.md) | Screenshot testing |
| [sandbox.md](docs/sandbox.md) | Sandbox mode |
| [versioning.md](docs/versioning.md) | Semantic versioning |
| [deployment.md](docs/deployment.md) | Deploy workflow |

### Reference

| File | Contenuto |
|------|-----------|
| [stove-status-mapping.md](docs/stove-status-mapping.md) | Thermorossi status codes |
| [netatmo-fixes-2025-12-28.md](docs/netatmo-fixes-2025-12-28.md) | Netatmo integration fixes |
| [multi-schedule-migration.md](docs/multi-schedule-migration.md) | Multi-schedule migration |
| [component-consolidation-report.md](docs/component-consolidation-report.md) | Component cleanup report |

### Archives (Research & Plans)

| Folder | Contenuto |
|--------|-----------|
| [research/](docs/research/) | ResearchPacks per features implementate |
| [plans/](docs/plans/) | Implementation Plans |
| [reports/](docs/reports/) | Quality analysis, workflow reports |
| [security/](docs/security/) | Security audits e fixes |
| [rollback/](docs/rollback/) | Configuration backups |

---

## Task Priorities

1. **NEVER** break existing functionality
2. **WAIT** for user confirmation before updating version (`lib/version.js`, `package.json`, `CHANGELOG.md`) - do NOT auto-update
3. **PREFER** editing existing files over creating new ones
4. **MAINTAIN** coding patterns -> [docs/patterns.md](docs/patterns.md)
5. **NEVER** execute `npm run build` or `npm install`
6. **ALWAYS** create/update unit tests -> [docs/testing.md](docs/testing.md)
7. **UPDATE DOCS** in `docs/`, not in CLAUDE.md
8. **USE DESIGN SYSTEM** - Reference `/debug/design-system` for UI
9. **NEVER** commit without explicit user request - wait for "fai commit" or similar
10. **NEVER** push to remote - user handles all pushes manually

---

## Critical Patterns (Quick Reference)

### Firebase: Filter Undefined

```javascript
await update(ref(db, 'path'), filterUndefined({ field: value }));
```

### API Routes: Force Dynamic

```javascript
export const dynamic = 'force-dynamic';
```

### Client Components

```javascript
'use client';
import { useState } from 'react';
```

### UI Components: Use Variants

```jsx
// CORRECT
<Heading level={2} variant="ember">Title</Heading>
<Text variant="secondary">Description</Text>

// WRONG - Never use color classes on UI components
<h2 className="text-slate-400">Title</h2>
```

**More patterns**: [docs/patterns.md](docs/patterns.md)

---

## Key Concepts

### Multi-Device Architecture
Registry centralizzato per dispositivi. Self-Contained Pattern: ogni card include tutte le sue info.
-> [docs/architecture.md](docs/architecture.md)

### Ember Noir Design System
Dark-first UI con accenti warm (ember/copper). Variants per tutti i componenti.
-> [docs/design-system.md](docs/design-system.md)

### Scheduler Modes
- **Manual**: `enabled: false`
- **Automatic**: `enabled: true, semiManual: false`
- **Semi-Manual**: `enabled: true, semiManual: true`
-> [docs/api-routes.md](docs/api-routes.md)

### Maintenance Tracking (Server-Side H24)
Tracking ore via cron (funziona anche app chiusa). Blocco accensione se `needsCleaning=true`.
-> [docs/systems/maintenance.md](docs/systems/maintenance.md)

### OAuth 2.0 Pattern
Auto-refresh tokens salvati in Firebase.
-> [docs/api-routes.md](docs/api-routes.md)

### Firebase Security
- `.read = true`: Client SDK (real-time)
- `.write = false`: Solo Admin SDK
-> [docs/firebase-security.md](docs/firebase-security.md)

---

## Environment Variables

```env
# Firebase Client
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_DATABASE_URL=
NEXT_PUBLIC_FIREBASE_VAPID_KEY=

# Firebase Admin
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=

# Auth0
AUTH0_SECRET=
AUTH0_BASE_URL=
AUTH0_CLIENT_ID=
AUTH0_CLIENT_SECRET=

# Netatmo
NEXT_PUBLIC_NETATMO_CLIENT_ID=
NETATMO_CLIENT_SECRET=

# Scheduler
CRON_SECRET=

# Admin
ADMIN_USER_ID=auth0|xxx
```

---

## Need Help?

1. **Quick issue?** -> [docs/troubleshooting.md](docs/troubleshooting.md)
2. **Setup problem?** -> [docs/quick-start.md](docs/quick-start.md)
3. **API question?** -> [docs/api-routes.md](docs/api-routes.md)
4. **UI question?** -> [docs/ui-components.md](docs/ui-components.md)
5. **Test failing?** -> [docs/testing.md](docs/testing.md)

---

**Version**: 1.72.8
**Last Updated**: 2026-01-21

