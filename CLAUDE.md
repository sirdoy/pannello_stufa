# CLAUDE.md - Pannello Stufa

**Next.js 15 PWA** per controllo remoto stufa pellet Thermorossi via cloud API + multi-device smart home control (termostato Netatmo, luci Philips Hue).

> **📚 Documentazione Modulare**: Questo file è un **indice**. Tutte le informazioni dettagliate sono in `docs/`.

---

## 📌 Meta-Documentation (IMPORTANTE!)

**Come mantenere questa struttura di documentazione:**

### 🎯 Principi Base

1. **CLAUDE.md = Indice SOLO**
   - Massimo 200 righe
   - Link ai file `docs/` per approfondimenti
   - Nessuna duplicazione di contenuti
   - Solo informazioni essenziali per orientarsi

2. **docs/ = Documentazione Dettagliata**
   - Un file per ogni argomento specifico
   - Approfondimenti, esempi, best practices
   - Mantieni file < 500 righe (suddividi se troppo grande)

3. **Quando Aggiungere Nuova Documentazione**
   ```
   ❌ SBAGLIATO: Aggiungere dettagli in CLAUDE.md
   ✅ CORRETTO:
      1. Creare/aggiornare file in docs/
      2. Aggiungere solo link in CLAUDE.md
   ```

4. **Struttura Cartelle docs/**
   ```
   docs/
   ├── *.md                    # Guide generali (architecture, api-routes, etc.)
   ├── systems/                # Sistemi integrati (maintenance, notifications, etc.)
   └── setup/                  # Setup guide esterne (netatmo, hue)
   ```

### 📝 Workflow Aggiornamento Documentazione

```bash
# 1. Feature/fix implementata
# 2. Aggiorna file specifico in docs/
vim docs/api-routes.md

# 3. Se nuovo concetto importante, aggiungi link in CLAUDE.md sezione "Documentation Map"
# 4. CLAUDE.md rimane snello (solo indice)
```

### 🔍 Come Claude Deve Usare la Documentazione

**Prima di rispondere a domande complesse:**
1. Consulta CLAUDE.md per orientarti
2. Leggi il file specifico in `docs/` per i dettagli
3. Non ripetere informazioni già documentate, dai solo il link

**Esempio:**
```
User: "Come funziona il maintenance tracking?"
Claude: "Il sistema di maintenance tracking funziona H24 server-side.
        Dettagli completi: docs/systems/maintenance.md"
```

---

## 🚀 Quick Start

```bash
npm install              # Installa dipendenze
cp .env.example .env.local   # Configura environment
npm run dev              # http://localhost:3000
```

📖 **Setup Completo**: [docs/quick-start.md](docs/quick-start.md)

---

## 🛠️ Stack Tecnologico

- **Next.js 15.5** - App Router, Server/Client Components, API Routes
- **React 19** - Hooks, Suspense, modern patterns
- **Tailwind CSS 4.1** - CSS-first config with @theme directive + liquid glass iOS 18 style
- **Firebase** - Realtime DB + Admin SDK (Client/Server separation)
- **Auth0** - Autenticazione
- **PWA** - next-pwa, Service Worker, offline support
- **External APIs** - Thermorossi (stufa), Netatmo (termostato), Philips Hue (luci)
- **FCM** - Push notifications multi-device

📖 **Architettura Dettagliata**: [docs/architecture.md](docs/architecture.md)

---

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

# Sandbox Mode (localhost only)
SANDBOX_MODE=true TEST_MODE=true npm run dev

# Firebase Sync
node -e "require('./lib/changelogService').syncVersionHistoryToFirebase(require('./lib/version').VERSION_HISTORY)"
```

📖 **Comandi Avanzati**: [docs/quick-start.md#commands](docs/quick-start.md)

---

## 📖 Documentation Map

### 🎯 Getting Started
- **[Quick Start](docs/quick-start.md)** - Setup, installazione, primi passi
- **[Architecture](docs/architecture.md)** - Struttura progetto, multi-device pattern
- **[Troubleshooting](docs/troubleshooting.md)** - Problemi comuni e soluzioni

### 💻 Development
- **[API Routes](docs/api-routes.md)** - Stove control, scheduler, OAuth 2.0 patterns
- **[UI Components](docs/ui-components.md)** - Card, Button, Banner, Toast, liquid glass
- **[Design System](docs/design-system.md)** - Colors, typography, styling hierarchy
- **[Page Transitions](docs/page-transitions.md)** - Cinematographic transitions, View Transitions API, 6 animation styles
- **[Patterns](docs/patterns.md)** - Reusable code patterns (dropdowns, modals, etc.)
- **[Data Flow](docs/data-flow.md)** - Polling, cron, OAuth, notifications flow

### 🔥 Firebase
- **[Firebase](docs/firebase.md)** - Realtime Database schema, operations
- **[Firebase Security](docs/firebase-security.md)** - Security Rules, Admin SDK, Client/Server separation

### 🏠 Systems
- **[Maintenance](docs/systems/maintenance.md)** - Tracking ore utilizzo stufa H24
- **[Monitoring](docs/systems/monitoring.md)** - Cron health monitoring
- **[Errors](docs/systems/errors.md)** - Error detection & logging
- **[Notifications](docs/systems/notifications.md)** - Push notifications (FCM, iOS PWA)

### 🔌 External Integrations
- **[Netatmo Setup](docs/setup/netatmo-setup.md)** - Termostato Netatmo OAuth 2.0
- **[Hue Setup](docs/setup/hue-setup.md)** - Luci Philips Hue Local API

### 🧪 Testing & Deployment
- **[Testing](docs/testing.md)** - Unit tests, coverage, best practices
- **[UI/UX Testing](docs/ui-ux-testing.md)** - Playwright E2E, WCAG AA compliance
- **[Visual Screenshots](docs/visual-screenshots.md)** - Screenshot testing bypass Auth0
- **[Sandbox Mode](docs/sandbox.md)** - Testing locale senza chiamate reali
- **[Versioning](docs/versioning.md)** - Semantic versioning, changelog
- **[Deployment](docs/deployment.md)** - Deploy workflow, checklist

---

## 🎯 Task Priorities (Per Claude)

1. 🔴 **NEVER** break existing functionality
2. 🟠 **ALWAYS** update version after changes (`lib/version.js`, `package.json`, `CHANGELOG.md`)
3. 🟡 **PREFER** editing existing files over creating new ones
4. 🟢 **MAINTAIN** coding patterns → [docs/patterns.md](docs/patterns.md)
5. 🔵 **NEVER** execute `npm run build` - strictly user-only command
6. 🔵 **NEVER** execute `npm install` - strictly user-only command (ask user to run it)
7. ⚡ **ALWAYS** create/update unit tests → [docs/testing.md](docs/testing.md)
8. 📚 **UPDATE DOCS** when adding features (in `docs/`, not in CLAUDE.md)

---

## 🔑 Critical Concepts (Quick Reference)

Questi sono i concetti chiave del progetto. **Per dettagli completi, consulta i file linkati**.

### Multi-Device Architecture
Registry centralizzato per dispositivi (stufa, termostato, luci). **Self-Contained Pattern**: ogni card include tutte le sue info.
→ [docs/architecture.md](docs/architecture.md)

### Liquid Glass + Dark Mode
Pattern UI iOS 18 con dark mode completo (Firebase sync + localStorage).
→ [docs/ui-components.md](docs/ui-components.md), [docs/design-system.md](docs/design-system.md)

### Scheduler Modes
Manual (🔧), Automatic (⏰), Semi-Manual (⚙️ override temporaneo).
→ [docs/api-routes.md](docs/api-routes.md)

### Maintenance Tracking (Server-Side H24)
Tracking ore utilizzo via cron (funziona anche app chiusa). Blocco accensione se `needsCleaning=true`.
→ [docs/systems/maintenance.md](docs/systems/maintenance.md)

### OAuth 2.0 Pattern
Pattern riutilizzabile per API esterne con auto-refresh token.
→ [docs/api-routes.md](docs/api-routes.md)

### Firebase Security (Client/Server Separation)
- `.read = true`: Client SDK (real-time listeners)
- `.write = false`: Solo Admin SDK server-side
→ [docs/firebase-security.md](docs/firebase-security.md)

### Push Notifications (FCM + iOS PWA)
Errori stufa, azioni scheduler, soglie manutenzione. Preferenze utente configurabili.
→ [docs/systems/notifications.md](docs/systems/notifications.md)

### Version Enforcement
Modal bloccante in production se versione locale < Firebase. Polling integrato in StoveCard.
→ [docs/versioning.md](docs/versioning.md)

---

## 🚨 Critical Best Practices (Quick)

```javascript
// ✅ Firebase: filter undefined
await update(ref(db, 'path'), filterUndefined({ field: undefined }));

// ✅ API Routes: force dynamic
export const dynamic = 'force-dynamic';

// ✅ Client Components: 'use client' PRIMA riga
'use client';
import { useState } from 'react';
```

📖 **Best Practices Complete**: [docs/firebase.md](docs/firebase.md), [docs/api-routes.md](docs/api-routes.md), [docs/patterns.md](docs/patterns.md)

---

## 🔗 Environment Variables

```env
# Firebase Client SDK
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_DATABASE_URL=
NEXT_PUBLIC_FIREBASE_VAPID_KEY=

# Firebase Admin SDK
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

📖 **Setup Completo**: [docs/quick-start.md#environment-setup](docs/quick-start.md)

---

## 🆘 Need Help?

1. **Quick issue?** → [docs/troubleshooting.md](docs/troubleshooting.md)
2. **Setup problem?** → [docs/quick-start.md](docs/quick-start.md)
3. **API question?** → [docs/api-routes.md](docs/api-routes.md)
4. **UI question?** → [docs/ui-components.md](docs/ui-components.md)
5. **Test failing?** → [docs/testing.md](docs/testing.md)

---

**Version**: 1.51.0
**Last Updated**: 2026-01-16
**Author**: Federico Manfredi
