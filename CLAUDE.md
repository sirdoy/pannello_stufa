# CLAUDE.md - Pannello Stufa Documentation Index

**Next.js 15 PWA** per controllo remoto stufa pellet Thermorossi via cloud API + multi-device smart home control (termostato Netatmo, luci Philips Hue).

> **Documentazione Modulare**: Questo file è un indice. Consulta i file tematici in `docs/` per approfondimenti.

## 🚀 Quick Links

- **[Quick Start](docs/quick-start.md)** - Setup progetto, installazione, primi passi
- **[Troubleshooting](docs/troubleshooting.md)** - Problemi comuni e soluzioni
- **[Testing](docs/testing.md)** - Unit tests, coverage, best practices

## 📖 Core Documentation

### Architecture & Code Organization

- **[Architecture](docs/architecture.md)** - Multi-device architecture, device registry, homepage layout
- **[API Routes](docs/api-routes.md)** - Stove control, scheduler, external APIs patterns (OAuth 2.0)
- **[Firebase](docs/firebase.md)** - Realtime Database schema, operations, best practices
- **[Data Flow](docs/data-flow.md)** - Polling, cron, OAuth, notifications flow

### UI & Design

- **[UI Components](docs/ui-components.md)** - Card, Button, Banner, Toast, Select, Input, liquid glass pattern
- **[Design System](docs/design-system.md)** - Palette colori, typography, spacing, styling hierarchy
- **[Patterns](docs/patterns.md)** - Dropdown/modal, collapse/expand, immediate feedback UX, Firebase listeners, polling

### Systems

- **[Maintenance](docs/systems/maintenance.md)** - Sistema tracking ore utilizzo stufa H24
- **[Monitoring](docs/systems/monitoring.md)** - Monitoring affidabilità cronjob scheduler
- **[Errors](docs/systems/errors.md)** - Rilevamento e notifica errori stufa
- **[Notifications](docs/systems/notifications.md)** - Push notifications sistema completo (FCM, iOS PWA)

### Development Workflows

- **[Sandbox Mode](docs/sandbox.md)** - Testing locale senza chiamate reali alla stufa (SOLO localhost)
- **[Testing](docs/testing.md)** - Unit tests, coverage, best practices
- **[E2E Testing](E2E-TESTING.md)** - Playwright E2E tests per UI/UX (light/dark mode, responsive)
- **[UI/UX Testing](docs/ui-ux-testing.md)** - Suite completa test Playwright (contrast WCAG AA, uniformità, accessibilità)
- **[Versioning](docs/versioning.md)** - Semantic versioning, changelog, version enforcement
- **[Deployment](docs/deployment.md)** - Deploy workflow, environment config, production checklist

### External Integrations

- **[Netatmo Setup](docs/setup/netatmo-setup.md)** - Termostato Netatmo Energy API (OAuth 2.0)
- **[Philips Hue Setup](docs/setup/hue-setup.md)** - Luci Philips Hue Local API

## 🛠️ Stack Tecnologico

- **Next.js 15.5.4**: App Router, Server/Client Components, API Routes
- **React 19.2**: Hooks, Suspense, modern async patterns
- **Tailwind CSS 3**: Utility-first + liquid glass iOS 18 style
- **WebGL**: Effetti UI animati (frost patterns, texture overlays) tramite shader GLSL ottimizzati
- **Firebase Realtime DB**: Scheduler, logs, versioning, push tokens
- **Auth0**: Autenticazione sicura
- **Thermorossi Cloud API**: Controllo stufa
- **Netatmo Energy API**: Termostato multi-room
- **Philips Hue Local API**: Luci smart
- **Firebase Cloud Messaging**: Push notifications multi-device
- **next-pwa**: Service Worker, offline support

## 📁 Struttura Progetto

```
pannello-stufa/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── stove/                # Stove control (status, ignite, shutdown, setFan, setPower)
│   │   ├── scheduler/check/      # Cron endpoint + maintenance tracking
│   │   ├── netatmo/              # Termostato API (OAuth 2.0)
│   │   ├── hue/                  # Luci API (Local)
│   │   ├── notifications/        # Push notifications (test, send)
│   │   └── auth/[...auth0]/      # Auth0 handler
│   ├── components/
│   │   ├── ui/                   # Card, Button, Banner, Toast, Select, Input, etc.
│   │   └── devices/              # Device-specific components
│   │       ├── stove/            # StoveCard
│   │       ├── thermostat/       # ThermostatCard
│   │       └── lights/           # LightsCard
│   ├── context/                  # VersionContext, ThemeContext
│   ├── hooks/                    # useVersionCheck, useTheme
│   ├── page.js                   # Homepage (multi-device grid)
│   ├── scheduler/page.js         # Pianificazione settimanale
│   ├── maintenance/page.js       # Configurazione manutenzione
│   ├── log/page.js              # Storico azioni
│   ├── errors/page.js           # Storico errori stufa
│   ├── changelog/page.js        # Versioni app
│   ├── settings/
│   │   ├── notifications/       # Gestione notifiche push
│   │   ├── devices/             # Gestione dispositivi abilitati
│   │   └── theme/               # Tema dark/light mode
│
├── lib/                          # Business Logic
│   ├── devices/                  # Device registry (DEVICE_CONFIG)
│   ├── stoveApi.js              # Thermorossi API wrapper
│   ├── schedulerService.js      # Scheduler logic
│   ├── maintenanceService.js    # Maintenance tracking
│   ├── errorMonitor.js          # Error detection
│   ├── logService.js            # User action logging
│   ├── firebase.js              # Firebase Client SDK
│   ├── firebaseAdmin.js         # Firebase Admin SDK (push notifications)
│   ├── notificationService.js   # FCM client-side
│   ├── notificationPreferencesService.js  # Notification preferences
│   ├── devicePreferencesService.js        # Device enable/disable preferences
│   ├── themeService.js          # Theme dark/light persistence (Firebase + localStorage)
│   ├── version.js               # APP_VERSION, VERSION_HISTORY
│   ├── changelogService.js      # Changelog sync Firebase
│   ├── netatmo/                 # Netatmo integration (OAuth)
│   └── hue/                     # Hue integration (Local API)
│
├── docs/                         # 📚 Documentazione modulare
│   ├── quick-start.md
│   ├── architecture.md
│   ├── api-routes.md
│   ├── firebase.md
│   ├── ui-components.md
│   ├── design-system.md
│   ├── patterns.md
│   ├── data-flow.md
│   ├── versioning.md
│   ├── testing.md
│   ├── troubleshooting.md
│   ├── deployment.md
│   ├── systems/                 # Sistemi integrati
│   │   ├── maintenance.md
│   │   ├── monitoring.md
│   │   ├── errors.md
│   │   └── notifications.md
│   └── setup/                   # Setup guide esterne
│       ├── netatmo-setup.md
│       └── hue-setup.md
│
├── public/
│   ├── firebase-messaging-sw.js  # FCM service worker
│   ├── manifest.json             # PWA manifest
│   └── icons/                    # PWA icons
│
└── __tests__/                    # Jest + Testing Library
```

## ⚡ Quick Commands

```bash
# Development
npm run dev              # Dev server (localhost:3000)
npm run build            # Production build
npm run start            # Production server

# Testing
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report

# Firebase Sync
node -e "require('./lib/changelogService').syncVersionHistoryToFirebase(require('./lib/version').VERSION_HISTORY)"

# Debugging
find app -name "*.js" -exec grep -l "useState" {} \;  # Find client components
```

## 🎯 Task Priorities

1. 🔴 **NEVER** break existing functionality
2. 🟠 **ALWAYS** update version after changes (`lib/version.js`, `package.json`, `CHANGELOG.md`)
3. 🟡 **PREFER** editing existing files over creating new ones
4. 🟢 **MAINTAIN** coding patterns (vedi [Architecture](docs/architecture.md), [Patterns](docs/patterns.md))
5. 🔵 **TEST** `npm run build` before commit
6. ⚡ **ALWAYS** create/update unit tests ([Testing](docs/testing.md))

## 🔑 Critical Concepts

### Multi-Device Architecture

Registry centralizzato per gestione dispositivi (stufa, termostato, luci, etc.).

```javascript
// lib/devices/deviceTypes.js
export const DEVICE_TYPES = {
  STOVE: 'stove',
  THERMOSTAT: 'thermostat',
  LIGHTS: 'lights',
};

export const DEVICE_CONFIG = {
  [DEVICE_TYPES.STOVE]: {
    id: 'stove',
    name: 'Stufa',
    icon: '🔥',
    enabled: true,
    // ...
  },
};
```

**Self-Contained Pattern**: Ogni device card include **tutte** le sue informazioni (banner, status, controls) **dentro** la card principale per coerenza architetturale.

📖 **Dettagli**: [Architecture](docs/architecture.md)

### Liquid Glass Style (iOS 18) + Dark Mode

Pattern UI unificato con supporto dark mode completo.

```jsx
<Card liquid className="p-6">Content</Card>
<Button liquid variant="primary">Azione</Button>
```

**Dark Mode**: Tema scuro con glass effect ottimizzato
- **Attivazione**: Settings → Tema (🎨)
- **Storage**: Firebase sync multi-device + localStorage fallback
- **Zero flash**: Script blocking pre-hydration
- **Palette**: Glass scuro (`bg-white/[0.05]`) + gradiente neutral-900

📖 **Dettagli**: [UI Components - Dark Mode](docs/ui-components.md#-dark-mode)

### Scheduler Modes

- **Manual** 🔧: Controllo manuale completo
- **Automatic** ⏰: Pianificazione settimanale
- **Semi-Manual** ⚙️: Override temporaneo (ritorna auto al prossimo cambio scheduler)

📖 **Dettagli**: [API Routes - Scheduler](docs/api-routes.md#scheduler-api)

### Maintenance Tracking (Server-Side H24)

Tracking ore utilizzo **server-side via cron** (funziona anche app chiusa).

```javascript
// Chiamato ogni minuto da /api/scheduler/check
await trackUsageHours(currentStatus);
```

- ✅ Blocco **solo accensione** se `needsCleaning=true`
- ✅ Spegnimento sempre permesso
- ✅ Notifiche push a 80%, 90%, 100%

📖 **Dettagli**: [Systems - Maintenance](docs/systems/maintenance.md)

### OAuth 2.0 Pattern

Pattern riutilizzabile per API esterne con auto-refresh token.

```javascript
const { accessToken, error, reconnect } = await getValidAccessToken();
if (reconnect) {
  // Show auth UI
}
```

📖 **Dettagli**: [API Routes - OAuth Pattern](docs/api-routes.md#oauth-20-pattern)

### Push Notifications (FCM + iOS PWA)

Sistema completo notifiche push con supporto iOS 16.4+ PWA.

- Errori stufa (severità configurabile)
- Azioni scheduler (accensione/spegnimento auto)
- Soglie manutenzione (80%, 90%, 100%)
- Preferenze utente per ogni tipo notifica

📖 **Dettagli**: [Systems - Notifications](docs/systems/notifications.md)

### Version Enforcement

- **Production**: Modal bloccante se versione locale < Firebase
- **Development**: Disabled su localhost
- **Polling**: Integrato in StoveCard (check ogni 5s)

📖 **Dettagli**: [Versioning](docs/versioning.md)

## 🚨 Critical Best Practices

### Firebase Operations

```javascript
// ❌ WRONG - undefined not allowed
await update(ref(db, 'path'), { field: undefined });

// ✅ CORRECT - filter undefined
await update(ref(db, 'path'), filterUndefined({ field: undefined }));
```

```javascript
// ❌ WRONG - causes phantom hours
maintenance: {
  lastUpdatedAt: new Date().toISOString()  // Init with timestamp
}

// ✅ CORRECT - init with null
maintenance: {
  lastUpdatedAt: null  // Will be set on first WORK event
}
```

📖 **Dettagli**: [Firebase - Best Practices](docs/firebase.md#best-practices)

### API Routes

```javascript
// ✅ CORRECT - force dynamic with Firebase
export const dynamic = 'force-dynamic';

// ❌ WRONG - Firebase not compatible
export const runtime = 'edge';
```

📖 **Dettagli**: [API Routes - Best Practices](docs/api-routes.md#best-practices)

### Client Components

```javascript
'use client';  // ✅ PRIMA riga, prima degli import

import { useState } from 'react';
```

### Styling Hierarchy

1. **Tailwind Inline** (~95% codice) - Preferenza primaria
2. **CSS Modules** (animazioni) - `Component.module.css` stessa directory
3. **globals.css** (SOLO base) - Mantieni minimo (~13 righe)

📖 **Dettagli**: [Design System](docs/design-system.md)

## 🔗 Environment Variables

```env
# Firebase (Client)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_DATABASE_URL=
NEXT_PUBLIC_FIREBASE_VAPID_KEY=

# Firebase (Admin - for push notifications)
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=

# Auth0
AUTH0_SECRET=
AUTH0_BASE_URL=
AUTH0_CLIENT_ID=
AUTH0_CLIENT_SECRET=

# External APIs
NEXT_PUBLIC_NETATMO_CLIENT_ID=
NETATMO_CLIENT_SECRET=

# Scheduler
CRON_SECRET=

# Admin
ADMIN_USER_ID=auth0|xxx
```

📖 **Dettagli**: [Quick Start - Environment Setup](docs/quick-start.md#3-environment-setup)

## 📚 Documentation Map

### Getting Started
- [Quick Start](docs/quick-start.md) - Setup, installation, first steps
- [Architecture](docs/architecture.md) - Project structure, multi-device pattern

### Development
- [UI Components](docs/ui-components.md) - Component library
- [Design System](docs/design-system.md) - Colors, typography, styling
- [Patterns](docs/patterns.md) - Reusable code patterns
- [API Routes](docs/api-routes.md) - API documentation
- [Firebase](docs/firebase.md) - Database schema
- [Data Flow](docs/data-flow.md) - Data flows

### Systems
- [Maintenance](docs/systems/maintenance.md) - Ore utilizzo tracking
- [Monitoring](docs/systems/monitoring.md) - Cron health monitoring
- [Errors](docs/systems/errors.md) - Error detection & logging
- [Notifications](docs/systems/notifications.md) - Push notifications

### External Integrations
- [Netatmo Setup](docs/setup/netatmo-setup.md) - Termostato integration
- [Hue Setup](docs/setup/hue-setup.md) - Luci integration

### Operations
- [Sandbox Mode](docs/sandbox.md) - Testing locale senza chiamate reali
- [Versioning](docs/versioning.md) - Version management workflow
- [Testing](docs/testing.md) - Unit tests, coverage
- [Deployment](docs/deployment.md) - Deploy checklist
- [Troubleshooting](docs/troubleshooting.md) - Common issues

## 🆘 Need Help?

1. **Quick issue?** → [Troubleshooting](docs/troubleshooting.md)
2. **Setup problem?** → [Quick Start](docs/quick-start.md)
3. **API question?** → [API Routes](docs/api-routes.md)
4. **UI question?** → [UI Components](docs/ui-components.md)
5. **Test failing?** → [Testing](docs/testing.md)

---

**Last Updated**: 2025-11-17
**Version**: 1.15.0 (minor: E2E Testing Suite Playwright Completa)
**Author**: Federico Manfredi
