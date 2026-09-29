# API Routes

API endpoints e pattern per integrazioni esterne.

## Stove Control (`/api/stove/*`)

Proxy per Thermorossi Cloud API.

| Endpoint | Method | Body | Returns | Note |
|----------|--------|------|---------|------|
| `/status` | GET | - | `{ status, error }` | Status + errori |
| `/getFan` | GET | - | `{ fanLevel }` | Fan 1-6 |
| `/getPower` | GET | - | `{ powerLevel }` | Power 0-5 |
| `/ignite` | POST | `{source}` | `{ success }` | **Bloccato se needsCleaning** |
| `/shutdown` | POST | `{source}` | `{ success }` | Sempre permesso |
| `/setFan` | POST | `{level: 1-6, source}` | `{ success }` | Richiede stufa ON |
| `/setPower` | POST | `{level: 1-5, source}` | `{ success }` | Richiede stufa ON |

### Source Parameter

| Value | Effetto |
|-------|---------|
| `'manual'` | Attiva semi-manual mode |
| `'scheduler'` | NON attiva semi-manual |

---

## Schedule Management (`/api/schedules/*`)

Multi-schedule CRUD con selezione attiva singola.

### Firebase Structure

```text
/schedules-v2
  /schedules/{id}     # name, enabled, slots, timestamps
  /activeScheduleId   # ID schedule attiva
  /mode               # enabled, semiManual, returnToAutoAt
```

### Endpoints

| Endpoint | Method | Body | Returns |
|----------|--------|------|---------|
| `/api/schedules` | GET | - | Lista metadata |
| `/api/schedules` | POST | `{name, copyFromId?}` | Crea schedule |
| `/api/schedules/[id]` | GET | - | Schedule completa |
| `/api/schedules/[id]` | PUT | `{name?, slots?, enabled?}` | Aggiorna |
| `/api/schedules/[id]` | DELETE | - | Elimina |
| `/api/schedules/active` | GET | - | `{activeScheduleId}` |
| `/api/schedules/active` | POST | `{scheduleId}` | Imposta attiva |

### Validazioni

- ❌ Delete schedule attiva → 400
- ❌ Delete ultima schedule → 400
- ❌ Nome duplicato → 400

---

## Scheduler stufa

Scheduler, manutenzione e notifiche della stufa girano sul Pi (ROADMAP D2); il vecchio cron esterno
`/api/scheduler/check` è stato rimosso (ROADMAP V12). I suoi compiti residui: calibrazione valvole sul Pi (V9),
meteo aggiornato alla lettura in `/api/weather/forecast` (V10), pulizia token FCM dopo eventi stufa e
registrazione token (V11).

---

## External APIs Pattern

### Directory Structure

```text
app/api/[api]/
├── callback/route.js     # OAuth callback
├── [endpoint]/route.js   # Endpoints specifici

lib/[api]/
├── api.js                # API wrapper
├── tokenHelper.js        # Token management
└── service.js            # State (opzionale)
```

### OAuth 2.0 Token Helper

```javascript
// lib/[api]/tokenHelper.js
export async function getValidAccessToken() {
  // 1. Get refresh_token da Firebase
  // 2. Exchange per access_token
  // 3. Se nuovo refresh_token → salva Firebase
  // 4. Return { accessToken, error, reconnect }
}
```

**Pattern key**:

- `reconnect: true` → UI mostra auth flow
- Auto-refresh trasparente
- Firebase per sessione persistente

**Implementazione completa**: `lib/netatmo/tokenHelper.js`

### OAuth Callback

```javascript
// app/api/[api]/callback/route.js
export async function GET(request) {
  const code = searchParams.get('code');
  // Exchange code → tokens
  // Save refresh_token to Firebase
  // Redirect to app
}
```

---

## HA Proxy (Netatmo + Fritz!Box)

All Netatmo and Fritz!Box API calls go through a shared HomeAssistant proxy. Configure via env vars:

```bash
HA_API_URL=http://your-homeassistant-host:port
HA_API_KEY=your-ha-api-key
```

**Setup completo**: [setup/netatmo-setup.md](./setup/netatmo-setup.md)

---

## Log Service (`/api/log/add`)

```javascript
POST /api/log/add
{
  "action": "IGNITE",
  "device": "stove",
  "value": "P4",
  "source": "manual"
}
```

---

## Login proprio (`/auth/*`)

Login first-party (Fase 8): utenti sulla tabella `users` del DB SQLite sul Pi, sessione cookie
cifrata `ps_session` (`lib/auth/sessionCookie.ts`, AES-GCM, chiave da `SESSION_SECRET`).

| Route | Funzione |
|-------|----------|
| `/auth/login` | Form email/password (`app/auth/login/page.tsx`) |
| `POST /api/auth/session` | Login: chiama backend `/auth/session/login`, imposta il cookie |
| `/auth/logout` | Logout |
| `GET /auth/profile` | User profile (usato da `useUser`) |

**Setup**:

```typescript
// Server: lib/auth/session.ts
import { authSession } from '@/lib/auth/session';
const session = await authSession.getSession();

// Client: lib/auth/useUser.tsx
import { useUser } from '@/lib/auth/useUser';
const { user, error, isLoading } = useUser();
```

Refresh del token in `middleware.ts`. Gestione utenti: pagina `/settings/users`, creazione via
`scripts/create_user.py` sul Pi.

---

## Best Practices

### Dynamic Rendering

```javascript
export const dynamic = 'force-dynamic';  // ✅ Required con Firebase
// export const runtime = 'edge';        // ❌ NO - Firebase incompatibile
```

### Error Handling

| Status | Uso |
|--------|-----|
| 400 | Validation error |
| 401 | Auth failed |
| 403 | Maintenance block / forbidden |
| 500 | Server error |

### Environment Variables

```env
# Public (client)
NEXT_PUBLIC_[API]_CLIENT_ID=xxx
NEXT_PUBLIC_[API]_REDIRECT_URI=http://localhost:3000/api/[api]/callback

# Private (server)
[API]_CLIENT_SECRET=xxx
```

**⚠️ REDIRECT_URI**: Deve corrispondere a console developer API esterna.

---

## See Also

- [Firebase](./firebase.md) - Schema e operations
- [Setup Guides](./setup/) - Netatmo, Hue, FritzBox
- [Systems](./systems/) - Maintenance, monitoring

---

**Last Updated**: 2026-02-04
