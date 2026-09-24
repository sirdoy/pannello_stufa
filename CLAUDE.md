# CLAUDE.md - Pannello Stufa (frontend)

**Next.js 16 PWA** | React 19 · TypeScript · Tailwind 4 · Auth0 · Firebase · Vercel
Frontend del sistema domotico: il backend è `../backend` (FastAPI su Raspberry Pi). Workspace: [../CLAUDE.md](../CLAUDE.md).
Device: stufa Thermorossi, Netatmo (termostato, valvole, camera), Hue, Sonos, Fritz!Box (rete, telefonia), IKEA Dirigera, Tuya, Raspberry Pi.

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
2. **WAIT** for user confirmation before version updates
3. **PREFER** editing existing files over creating new
4. **NEVER** execute `npm run build` or `npm install`
5. **ALWAYS** create/update unit tests
6. **USE** design system → EmberGlass (`app/components/EmberGlass/`), preview `/debug/design-system-v2`
7. **NEVER** commit/push without explicit request (push su `main` = deploy Vercel)
8. **USE** scoped test subsets in verification — NEVER `npm test` alone from agents or PLAN.md `<verify><automated>` blocks. Prefer `npm test -- <specific paths>` or the scoped scripts: `test:changed`, `test:quick`, `test:unit`, `test:api`, `test:components`, `test:pages`. The full suite is reserved for release gates and CI (`test:ci`).
9. **NEVER** edit `docs/api/` by hand: è una copia di `../backend/docs/api/` (fonte di verità del contratto). Cambi al contratto partono dal backend, poi `rsync -a --delete ../backend/docs/api/ docs/api/`.
10. **NEVER** call the backend from client components: il browser usa solo route Next; `lib/haClient.ts` è server-only.

## Backend integration

| Cosa | Dove |
|------|------|
| REST client (server-only, `X-API-Key`, timeout 15s, RFC 9457 → `ApiError`) | `lib/haClient.ts` (`haGet/haPost/haPut/haPatch/haDelete`) |
| Adapter per provider | `lib/<provider>/*Proxy.ts`, `*WsAdapter.ts` |
| Route proxy (1:1 con backend `/api/v1/...`, Auth0 via `withAuthAndErrorHandler`) | `app/api/v1/<provider>/**/route.ts`; `app/api/{rooms,registry,raspi,tuya}` |
| Tipi contratto | `types/*Proxy.ts`, `types/websocket.ts`, `types/automations.ts` (← `docs/api/automations.types.ts`) |
| WebSocket | `app/components/ClientProviders.tsx` → `${NEXT_PUBLIC_WS_URL}/ws/live?api_key=`, `lib/hooks/useWebSocketManager.ts`, `app/context/WebSocketContext.ts`; polling HTTP come fallback |
| Backend JWT (solo gestione API key) | `lib/auth/authProxy.ts`, `app/api/auth/api-keys` |
| Env | `HA_API_URL`, `HA_API_KEY`, `HA_ADMIN_USER`, `HA_ADMIN_PASSWORD`, `NEXT_PUBLIC_WS_URL`, `NEXT_PUBLIC_WS_API_KEY` |

**Aggiungere un endpoint backend al frontend**: sync `docs/api` → tipo in `types/` → funzione in
`lib/<provider>/*Proxy.ts` → route `app/api/v1/...` (`export const dynamic = 'force-dynamic'`) → hook/componente → test.
Nuovo topic WS: aggiornare `Topic` + `TopicDataMap` in `types/websocket.ts` (fonte: `docs/api/websocket.md`).

**Firebase** (RTDB + FCM) resta per: scheduler stufa (`lib/scheduler/`, cron GitHub → `/api/scheduler/check`),
manutenzione, log/errori, changelog, preferenze e token FCM utenti, rate limiter, cache. I dati live dei device vengono dal backend.

## Docs

**Full Index**: [docs/INDEX.md](docs/INDEX.md) · **API contract**: [docs/api/README.md](docs/api/README.md)

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

// UI: Variants only
<Heading variant="ember">Title</Heading>
```

## Concepts

| Term | Meaning |
|------|---------|
| Multi-Device | Centralized registry, Self-Contained Pattern |
| EmberGlass | UI attuale (GlassCard, CardHead, Sheet, cards/, sheets/), dark-only. `app/components/ui` = legacy Ember Noir in dismissione |
| Scheduler | Manual / Automatic / Semi-Manual modes (Firebase) |
| Maintenance | H24 tracking, blocks ignite if needsCleaning |

---

**v20.0 Ember Glass** (app 1.77.0) | GSD in `.planning/`
