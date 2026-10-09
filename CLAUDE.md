# CLAUDE.md - Pannello Stufa (frontend)

**Next.js 16 PWA** | React 19 · TypeScript · Tailwind 4 · login proprio (utenti sul Pi) · Firebase · Vercel
Frontend del sistema domotico: il backend è `../backend` (FastAPI su Raspberry Pi). Workspace:
[../CLAUDE.md](../CLAUDE.md).
Device: stufa Thermorossi, Netatmo (termostato, valvole, camera), Hue, Sonos, Fritz!Box (rete, telefonia), IKEA
Dirigera, Tuya, Raspberry Pi.

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
npm run lint
```

## Rules

1. **NEVER** break existing functionality
2. **NO** version bumps: `lib/version.ts` is an archive, releases are identified by the build commit (M36)
3. **PREFER** editing existing files over creating new
4. **ALWAYS** run `npm run build` right before a commit (and only then: never during development or verification);
   a failing build blocks the commit and push. Enforced by the workspace hook
   `../.claude/hooks/fe-build-before-commit.sh`. Adding/removing npm packages (`npm install <pkg>`,
   `npm uninstall <pkg>`) is allowed autonomously; commit `package.json` + `package-lock.json` together
5. **ALWAYS** create/update unit tests
6. **USE** design system → EmberGlass, sempre e su ogni pagina (regola `../.claude/rules/design-system.md`, M72):
   testata `PageHeader`, superfici/azioni/testo/stato dai componenti di `app/components/EmberGlass/` e
   `app/components/ui/` (stesso stile); niente markup o colori a mano se esiste un componente, se manca lo si
   aggiunge al design system. Preview `/debug/design-system-v2`
7. A task finito: test scoped, commit e push **senza chiedere** (push su `main` = deploy Vercel), poi verifica in
   produzione — regola `../.claude/rules/task-closing.md`
8. **USE** scoped test subsets in verification — NEVER `npm test` alone from agents or PLAN.md `<verify><automated>`
   blocks. Prefer `npm test -- <specific paths>` or the scoped scripts: `test:changed`, `test:quick`, `test:unit`,
   `test:api`, `test:components`, `test:pages`. The full suite is reserved for release gates and CI (`test:ci`).
9. Il contratto API vive in `../docs/api/` (root del workspace, fuori da questo repo): leggerlo da lì, cambi al
   contratto partono dal backend. **NEVER** edit `types/automations.contract.ts` by hand: è copia identica di
   `../docs/api/automations.types.ts` (`cp ../docs/api/automations.types.ts types/automations.contract.ts`).
10. **NEVER** call the backend from client components: il browser usa solo route Next; `lib/haClient.ts` è server-only.

## Backend integration

| Cosa | Dove |
|------|------|
| REST client (server-only, `X-API-Key`, timeout 15s, RFC 9457 → `ApiError`) | `lib/haClient.ts` (`haGet/haPost/haPut/haPatch/haDelete`) |
| Adapter per provider | `lib/<provider>/*Proxy.ts`, `*WsAdapter.ts` |
| Route proxy (1:1 con backend `/api/v1/...`, sessione via `withAuthAndErrorHandler`) | `app/api/v1/<provider>/**/route.ts`; `app/api/{rooms,registry,raspi,tuya}` |
| Tipi contratto | `types/*Proxy.ts`, `types/websocket.ts`, `types/automations.ts` (← `types/automations.contract.ts` ← `../docs/api/automations.types.ts`) |
| WebSocket | `app/components/ClientProviders.tsx` → `${NEXT_PUBLIC_WS_URL}/ws/live?token=` (token 60s da `/api/ws-token` a ogni connessione, `lib/ws/wsUrl.ts`), `lib/hooks/useWebSocketManager.ts`, `app/context/WebSocketContext.ts`; polling HTTP come fallback |
| Login utenti (Fase 8) | `/auth/login` → `app/api/auth/session` → backend `/auth/session/*`; cookie cifrato `ps_session` (`lib/auth/sessionCookie.ts`), refresh in `middleware.ts`; server `lib/auth/session.ts` (`authSession.getSession()`), client `lib/auth/useUser.tsx` (`useUser()`); `session.user.sub` = legacy Auth0 sub (account migrati) o `user:<id>` |
| Backend JWT (solo gestione API key) | `lib/auth/authProxy.ts`, `app/api/auth/api-keys` |
| Env | `HA_API_URL`, `HA_API_KEY`, `HA_ADMIN_USER`, `HA_ADMIN_PASSWORD`, `NEXT_PUBLIC_WS_URL`, `SESSION_SECRET` |

**Aggiungere un endpoint backend al frontend**: leggere `../docs/api` → tipo in `types/` → funzione in
`lib/<provider>/*Proxy.ts` → route `app/api/v1/...` (`export const dynamic = 'force-dynamic'`) → hook/componente → test.
Nuovo topic WS: aggiornare `Topic` + `TopicDataMap` in `types/websocket.ts` (fonte: `../docs/api/websocket.md`).

**Scheduler stufa e manutenzione** stanno sul Pi (ROADMAP D2): `lib/scheduler/*` e `lib/maintenance/maintenanceService.ts`
chiamano le route `app/api/v1/thermorossi/{schedules,scheduler,maintenance}` (proxy `lib/stove/schedulerProxy.ts`,
tipi `types/thermorossiScheduler.ts`). Il cron esterno `/api/scheduler/check` non c'è più (ROADMAP V12: calibrazione
valvole sul Pi, meteo alla lettura); il banner della pagina stufa guarda il battito del motore sul Pi
(`SchedulerEngineBanner`).

**Notifiche push** (ROADMAP M48): Web Push standard (VAPID) inviate **dal Pi** a ogni dispositivo iscritto, niente
FCM. Browser: `lib/push/pushClient.ts` (iscrizione via `/sw.js`, scelta sì/no per dispositivo in `localStorage`),
domanda al primo avvio `app/components/NotificationOptInPrompt.tsx`, impostazioni `/settings/notifications`, proxy
`app/api/v1/notifications/**`. Un solo service worker sullo scope `/` (`app/sw.ts`): mai registrarne un secondo, era
la causa delle push mai arrivate. L'iscrizione non dipende dalla sessione. Dettagli:
[docs/systems/notifications.md](docs/systems/notifications.md).

**Firebase** (RTDB) resta per: log/errori, rate limiter, cache. I dati live dei device vengono dal backend.

## Docs

**Full Index**: [docs/INDEX.md](docs/INDEX.md) · **API contract**: [../docs/api/README.md](../docs/api/README.md)

| Quick Ref | Link |
|-----------|------|
| Architecture | [docs/architecture.md](docs/architecture.md) |
| API Routes | [docs/api-routes.md](docs/api-routes.md) |
| Design System | [docs/design-system.md](docs/design-system.md) |
| Firebase | [docs/firebase.md](docs/firebase.md) |
| Testing | [docs/testing.md](docs/testing.md) |
| Troubleshooting | [docs/troubleshooting.md](docs/troubleshooting.md) |

⚠️ `architecture.md`, `api-routes.md`, `firebase.md`, `testing.md`, `design-system.md` contengono parti pre-migrazione
(`/api/stove/*`, OAuth Netatmo/Hue in Firebase, `jest.config.js`, Ember Noir): in caso di conflitto vince il codice.

## Patterns

```typescript
// Firebase: Filter undefined
await update(ref(db, 'path'), filterUndefined({ field: value }));

// API Routes
export const dynamic = 'force-dynamic';

// Client Components
'use client';

// UI: shared page header + variants only (M72)
<PageHeader title="Rete" backHref="/altro" />
<Heading level={2} variant="ember">Title</Heading>

// React Compiler (reactCompiler: true): a value read from outside React (localStorage, Notification.permission)
// in render is memoized as constant → keep it in useState and set it again after a change (M48)
const [state, setState] = useState(initial); /* after toggle: */ setState(readDeviceState());

// Client fetch catch: a navigation cancels in-flight requests with
// "TypeError: Failed to fetch" (not AbortError) → skip logging (ROADMAP M55)
} catch (err) { if (isFetchInterrupted(err)) return; console.error(...); }  // lib/utils/fetchInterruption.ts
```

## Concepts

| Term | Meaning |
|------|---------|
| Multi-Device | Centralized registry, Self-Contained Pattern |
| EmberGlass | Unico design system, dark-only: `app/components/EmberGlass/` (PageHeader, GlassCard, CardHead, Sheet, cards/, sheets/) + `app/components/ui/` (componenti di base con lo stesso stile: Button, Card, Heading, Text, Badge, Banner, Tabs, DataTable…) |
| Scheduler | Manual / Automatic / Semi-Manual modes (sul Pi) |
| Maintenance | Ore di lavoro contate sul Pi, accensione bloccata se needsCleaning |

---

**v20.0 Ember Glass** | versione = commit della build (semver fermo a 1.77.0, M36) | GSD in `.planning/`
