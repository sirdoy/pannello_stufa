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

```
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

## Scheduler Cron (`/api/scheduler/check`)

Chiamato ogni minuto per automazione stufa.

```bash
GET /api/scheduler/check?secret=<CRON_SECRET>
```

**Workflow**:
1. Verifica CRON_SECRET
2. Salva `cronHealth/lastCall`
3. Check mode (manual/auto/semi-manual)
4. Se auto: esegue azioni schedule con `source='scheduler'`
5. Track usage: `trackUsageHours(status)`

**CRITICO**: Tracking ore è server-side, non client-side.

---

## External APIs Pattern

### Directory Structure

```
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

## Netatmo Credentials

### Environment Detection

| Environment | Credentials | Firebase Path |
|-------------|-------------|---------------|
| localhost | `*_DEV` vars | `dev/netatmo/` |
| Production | Base vars | `netatmo/` |

### Usage

```javascript
// Server-side
import { getNetatmoCredentials } from '@/lib/netatmoCredentials';
const { clientId, clientSecret, redirectUri } = getNetatmoCredentials();

// Client-side
import { getNetatmoCredentialsClient } from '@/lib/netatmoCredentials';
const { clientId, redirectUri } = getNetatmoCredentialsClient();
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

## Auth0 (`/auth/*`)

Auth0 v4 gestisce route automaticamente via middleware.

| Route | Funzione |
|-------|----------|
| `/auth/login` | Login redirect |
| `/auth/logout` | Logout |
| `/auth/callback` | OAuth callback |
| `/auth/profile` | User profile |

**Setup**:

```javascript
// lib/auth0.js
import { Auth0Client } from '@auth0/nextjs-auth0/server';
export const auth0 = new Auth0Client({ /* config */ });

// middleware.js
import { auth0 } from '@/lib/auth0';
export default auth0.middleware();
```

**Migrazione v3→v4**: Route `/api/auth/*` → `/auth/*`

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

**Last Updated**: 2026-01-21
