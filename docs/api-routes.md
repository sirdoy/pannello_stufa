# API Routes

Documentazione API routes e pattern integrazione API esterne.

## Stove Control API (`/api/stove/*`)

API proxy per controllo stufa Thermorossi Cloud.

### Endpoints

| Endpoint | Method | Body | Returns | Note |
|----------|--------|------|---------|------|
| `/status` | GET | - | `{ status, error, ... }` | Status + errori |
| `/getFan` | GET | - | `{ fanLevel }` | Fan 1-6 |
| `/getPower` | GET | - | `{ powerLevel }` | Power 0-5 (UI: 1-5) |
| `/ignite` | POST | `{source: 'manual'\|'scheduler'}` | `{ success }` | Accensione |
| `/shutdown` | POST | `{source: 'manual'\|'scheduler'}` | `{ success }` | Spegnimento |
| `/setFan` | POST | `{level: 1-6, source}` | `{ success }` | Imposta ventola |
| `/setPower` | POST | `{level: 1-5, source}` | `{ success }` | Imposta potenza |

### Parametro `source`

Discrimina tra comandi manuali e scheduler per gestione semi-manual mode.

```javascript
// Comando manuale homepage
await fetch('/api/stove/ignite', {
  method: 'POST',
  body: JSON.stringify({ source: 'manual' }),
});
// → Attiva semi-manual se scheduler enabled

// Comando da scheduler cron
await fetch('/api/stove/ignite', {
  method: 'POST',
  body: JSON.stringify({ source: 'scheduler' }),
});
// → NON attiva semi-manual
```

**Regole**:
- `source: 'manual'` → Attiva semi-manual mode
- `source: 'scheduler'` → NON attiva semi-manual mode

### Ignite Endpoint

**Blocco Manutenzione**: Accensione bloccata se `needsCleaning=true`.

```javascript
// app/api/stove/ignite/route.js
import { canIgnite } from '@/lib/maintenanceService';

export async function POST(request) {
  const { source } = await request.json();

  // Check maintenance
  const allowed = await canIgnite();
  if (!allowed) {
    return NextResponse.json(
      { error: 'Manutenzione richiesta' },
      { status: 403 }
    );
  }

  // Proceed with ignition
  // ...
}
```

**Implementazione**: `app/api/stove/ignite/route.js`

### Shutdown Endpoint

**Sempre Permesso**: Spegnimento sempre consentito, anche con manutenzione richiesta.

```javascript
// app/api/stove/shutdown/route.js

export async function POST(request) {
  // NO maintenance check - shutdown always allowed
  // Proceed with shutdown
  // ...
}
```

**Implementazione**: `app/api/stove/shutdown/route.js`

### SetFan / SetPower Endpoints

**Prerequisiti**:
- Stufa deve essere accesa (status = WORK)
- `source: 'manual'` attiva semi-manual SOLO se stufa ON

**Implementazione**: `app/api/stove/setFan/route.js`, `app/api/stove/setPower/route.js`

## Scheduler API (`/api/scheduler/check`)

Endpoint chiamato da cronjob ogni minuto per gestione scheduler automatico.

### Request

```bash
GET /api/scheduler/check?secret=<CRON_SECRET>
```

**Authentication**: Query param `secret` deve corrispondere a `process.env.CRON_SECRET`.

### Workflow

```
1. Verify CRON_SECRET (401 if invalid)
2. Save cronHealth/lastCall timestamp (ISO UTC)
3. Check mode (manual/auto/semi-manual)
4. If auto: fetch schedule + execute actions (source='scheduler')
   ├─ IGNITE: Check maintenance (canIgnite) → skip if needsCleaning
   └─ SHUTDOWN/SetFan/SetPower: NO maintenance check
5. If scheduled change → clear semi-manual
6. Track usage: trackUsageHours(currentStatus)
```

**Implementazione**: `app/api/scheduler/check/route.js`

### Maintenance Tracking

**CRITICO**: Tracking ore utilizzo è **server-side via cron**, non client-side.

```javascript
import { trackUsageHours } from '@/lib/maintenanceService';

// In scheduler check endpoint
const statusRes = await fetch('http://localhost:3000/api/stove/status');
const { status } = await statusRes.json();

await trackUsageHours(status);
```

**Perché server-side**: Client-side tracking funziona SOLO se app aperta. Server-side cron funziona H24.

Vedi [Systems - Maintenance](./systems/maintenance.md) per dettagli completi.

### Cron Health Monitoring

Salva timestamp Firebase ad ogni chiamata per monitoring affidabilità cronjob.

```javascript
import { ref, set } from 'firebase/database';
import { db } from '@/lib/firebase';

// Save timestamp
await set(ref(db, 'cronHealth/lastCall'), new Date().toISOString());
```

Vedi [Systems - Monitoring](./systems/monitoring.md) per dettagli completi.

## External APIs Pattern

Pattern generico per integrare API esterne (OAuth, REST, etc.).

### Struttura Directory

```
app/api/[external-api]/
├── callback/route.js        # OAuth callback (se necessario)
├── [endpoint]/route.js      # Endpoint API specifici

lib/[external-api]/
├── api.js                   # API wrapper
├── service.js               # State management + Firebase (opzionale)
└── tokenHelper.js           # Token management (se OAuth required)
```

**Esempi implementati**:
- `netatmo/` - Termostato Netatmo (OAuth 2.0)
- `hue/` - Luci Philips Hue (Local API)

### OAuth 2.0 Pattern

Pattern completo per API con OAuth 2.0 e refresh token.

#### Token Helper Pattern

```javascript
// lib/[external-api]/tokenHelper.js

import { ref, get, set, remove } from 'firebase/database';
import { db } from '@/lib/firebase';

export async function getValidAccessToken() {
  // 1. Fetch refresh_token from Firebase
  const tokenRef = ref(db, '[external-api]/refresh_token');
  const snapshot = await get(tokenRef);

  if (!snapshot.exists()) {
    return {
      error: 'NOT_CONNECTED',
      message: 'No refresh token found',
      reconnect: true,
    };
  }

  const refreshToken = snapshot.val();

  // 2. Exchange refresh_token for access_token
  const response = await fetch('https://api.example.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: process.env.EXTERNAL_API_CLIENT_ID,
      client_secret: process.env.EXTERNAL_API_CLIENT_SECRET,
    }),
  });

  if (!response.ok) {
    // Token expired/invalid - clear Firebase
    await remove(tokenRef);
    return {
      error: 'TOKEN_EXPIRED',
      message: 'Refresh token expired',
      reconnect: true,
    };
  }

  const data = await response.json();

  // 3. If new refresh_token returned → save to Firebase
  if (data.refresh_token && data.refresh_token !== refreshToken) {
    await set(tokenRef, data.refresh_token);
  }

  // 4. Return access_token
  return {
    accessToken: data.access_token,
    error: null,
  };
}
```

**Vantaggi**:
- ✅ Zero config client-side
- ✅ Sessione permanente (refresh token in Firebase)
- ✅ Auto-refresh automatico
- ✅ Flag `reconnect` per UI feedback

#### API Wrapper Pattern

```javascript
// lib/[external-api]/api.js

import { getValidAccessToken } from './tokenHelper';

export async function fetchData() {
  // Get valid access token (auto-refresh)
  const { accessToken, error, reconnect } = await getValidAccessToken();

  if (error) {
    return { error, reconnect };
  }

  // Make API call
  const response = await fetch('https://api.example.com/data', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    return { error: 'API_ERROR', message: response.statusText };
  }

  const data = await response.json();
  return { data, error: null };
}
```

#### API Route Pattern

```javascript
// app/api/[external-api]/data/route.js

import { NextResponse } from 'next/server';
import { fetchData } from '@/lib/[external-api]/api';

export async function GET() {
  const result = await fetchData();

  if (result.error) {
    return NextResponse.json(result, { status: 500 });
  }

  return NextResponse.json(result);
}
```

#### Client Reconnect Pattern

```javascript
// Client component
const fetchData = async () => {
  const response = await fetch('/api/external-api/data');
  const data = await response.json();

  if (data.reconnect) {
    // Token expired/missing - show auth UI
    setConnected(false);
    return;
  }

  // Process data
  setData(data.data);
};
```

**Implementazione completa**: Vedi `lib/netatmo/` per esempio OAuth 2.0 con auto-refresh.

### OAuth Callback Pattern

```javascript
// app/api/[external-api]/callback/route.js

import { NextResponse } from 'next/server';
import { ref, set } from 'firebase/database';
import { db } from '@/lib/firebase';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect('/error');
  }

  // Exchange code for tokens
  const response = await fetch('https://api.example.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code,
      client_id: process.env.EXTERNAL_API_CLIENT_ID,
      client_secret: process.env.EXTERNAL_API_CLIENT_SECRET,
      redirect_uri: process.env.EXTERNAL_API_REDIRECT_URI,
    }),
  });

  const data = await response.json();

  // Save refresh_token to Firebase
  await set(ref(db, '[external-api]/refresh_token'), data.refresh_token);

  // Redirect to app
  return NextResponse.redirect('/');
}
```

### Local API Pattern (No OAuth)

Pattern per API locali senza autenticazione OAuth (es. Philips Hue Local API).

**Esempio**: Vedi `HUE-SETUP.md` per implementazione Hue Local API.

**Struttura**:
```
lib/hue/
├── api.js           # API wrapper con IP/API key
└── service.js       # State management (opzionale)
```

**Key Differences**:
- ✅ No OAuth flow
- ✅ API key statica in `.env`
- ✅ IP locale/mDNS discovery
- ❌ No token refresh logic

## Log Service API (`/api/log/add`)

Endpoint per logging azioni utente con supporto multi-device.

```javascript
// POST /api/log/add
{
  "action": "IGNITE",
  "device": "stove",  // from DEVICE_TYPES
  "value": "P4",
  "source": "manual",
  "metadata": { /* optional */ }
}
```

**Implementazione**: `app/api/log/add/route.js`

Vedi [Firebase - Log Schema](./firebase.md#log-schema) per struttura dati.

## Auth0 API (`/auth/*`)

Auth0 v4 gestisce automaticamente le route di autenticazione tramite middleware. Non è più necessario un handler API dedicato.

**Route disponibili** (gestite automaticamente):
- `/auth/login` - Login page redirect
- `/auth/logout` - Logout handler
- `/auth/callback` - OAuth callback
- `/auth/profile` - User profile endpoint
- `/auth/access-token` - Access token endpoint
- `/auth/backchannel-logout` - Backchannel logout handler

**Setup centralizzato**:

```javascript
// lib/auth0.js
import { Auth0Client } from '@auth0/nextjs-auth0/server';

export const auth0 = new Auth0Client({
  secret: process.env.AUTH0_SECRET,
  baseURL: process.env.AUTH0_BASE_URL,
  clientID: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
});
```

**Middleware integration**:

```javascript
// middleware.js
import { auth0 } from '@/lib/auth0';

export default auth0.middleware();

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png|offline|manifest.json|icons/|sw.js|firebase-messaging-sw.js|auth/*).*)',
  ],
};
```

**Note di Migrazione da v3**:
- `app/api/auth/[...auth0]/route.js` rimosso (non più necessario)
- Route cambiate: `/api/auth/*` → `/auth/*`
- Aggiornare configurazione Auth0 Dashboard con nuovi callback URLs

## Best Practices

### Dynamic Rendering

Forza rendering dinamico per routes con Firebase.

```javascript
// app/api/[endpoint]/route.js
export const dynamic = 'force-dynamic';
```

**IMPORTANTE**: NO Edge runtime con Firebase.

```javascript
// ✅ Correct
export const dynamic = 'force-dynamic';

// ❌ Wrong - Firebase not compatible
export const runtime = 'edge';
```

### Error Handling

Pattern error handling consistente con status codes semantici.

```javascript
export async function POST(request) {
  try {
    const body = await request.json();

    // Validation
    if (!body.level) {
      return NextResponse.json(
        { error: 'Missing level' },
        { status: 400 }  // Bad Request
      );
    }

    // Business logic error
    const allowed = await canIgnite();
    if (!allowed) {
      return NextResponse.json(
        { error: 'Manutenzione richiesta' },
        { status: 403 }  // Forbidden
      );
    }

    // Success
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
```

### Environment Variables

Pattern env vars per external APIs.

```env
# Public (client-side accessible)
NEXT_PUBLIC_[EXTERNAL_API]_CLIENT_ID=xxx
NEXT_PUBLIC_[EXTERNAL_API]_REDIRECT_URI=http://localhost:3000/api/[external-api]/callback

# Private (server-side only)
[EXTERNAL_API]_CLIENT_ID=xxx
[EXTERNAL_API]_CLIENT_SECRET=xxx
[EXTERNAL_API]_REDIRECT_URI=http://localhost:3000/api/[external-api]/callback
```

**⚠️ IMPORTANTE OAuth**: `REDIRECT_URI` deve:
- Corrispondere a porta/path corretto
- Essere registrato nella console developer API esterna
- HTTPS in production, HTTP solo per localhost

## See Also

- [Architecture](./architecture.md) - Multi-device architecture
- [Firebase](./firebase.md) - Firebase schema e operations
- [Systems](./systems/) - Scheduler, maintenance, monitoring
- [Setup Guides](./setup/) - External APIs setup (Netatmo, Hue, etc.)

---

**Last Updated**: 2025-10-21
