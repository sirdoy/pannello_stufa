# Firebase

Firebase Realtime Database: schema, operazioni e sicurezza.

## Overview

Dati gestiti:
- **Scheduler**: Pianificazioni settimanali
- **Maintenance**: Tracking ore stufa
- **Logs/Errors**: Storico azioni e errori
- **Users**: FCM tokens, preferenze notifiche
- **External APIs**: OAuth tokens (Netatmo, Hue)

---

## Environment Separation

Development usa namespace `dev/`:

```javascript
import { getEnvironmentPath } from '@/lib/environmentHelper';

// Production: 'netatmo/refresh_token'
// Development: 'dev/netatmo/refresh_token'
const path = getEnvironmentPath('netatmo/refresh_token');
```

---

## Schema

```
firebase-root/
├── dev/                       # Development namespace
├── stoveScheduler/
│   ├── monday..sunday/        # [{start, end, power, fan}]
│   └── mode/                  # enabled, semiManual, returnToAutoAt
├── maintenance/               # currentHours, targetHours, needsCleaning, etc.
├── cronHealth/lastCall        # ISO UTC string
├── log/{logId}/               # action, device, timestamp, source, user
├── errors/{errorId}/          # errorCode, severity, resolved, timestamp
├── changelog/{version}/       # version, date, type, changes
├── users/{userId}/
│   ├── fcmTokens/             # FCM tokens per device
│   └── notificationPreferences/
├── devicePreferences/{userId}/ # stove, thermostat, lights, sonos
├── netatmo/                   # refresh_token, home_id, topology, etc.
└── hue/                       # refresh_token, username, bridge_ip
```

---

## Operazioni Comuni

### Read

```javascript
import { ref, get, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';

// Single read
const snapshot = await get(ref(db, 'maintenance'));
const data = snapshot.val();

// Realtime listener (con cleanup!)
useEffect(() => {
  const unsubscribe = onValue(ref(db, 'cronHealth/lastCall'), (snap) => {
    setTimestamp(snap.val());
  });
  return () => unsubscribe();
}, []);
```

### Write

```javascript
import { ref, set, update, push } from 'firebase/database';

// Update (partial, atomico)
await update(ref(db, 'maintenance'), {
  currentHours: 25.5,
  lastUpdatedAt: new Date().toISOString()
});

// Push (auto-generated key)
const newRef = push(ref(db, 'log'));
await set(newRef, { action: 'IGNITE', timestamp: Date.now() });
```

### Filter Undefined (CRITICO)

Firebase **non accetta** `undefined`:

```javascript
function filterUndefined(obj) {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (value !== undefined && value !== null) acc[key] = value;
    return acc;
  }, {});
}

await update(ref(db, 'path'), filterUndefined({ field: maybeUndefined }));
```

### Transactions (Atomic Read-Modify-Write)

```javascript
import { ref, runTransaction } from 'firebase/database';

await runTransaction(ref(db, 'maintenance'), (current) => {
  if (!current) return current;
  return {
    ...current,
    currentHours: current.currentHours + elapsed,
    lastUpdatedAt: new Date().toISOString()
  };
});
```

---

## Security

### Architettura

- **Auth**: Auth0 (NO Firebase Authentication)
- **Client SDK**: Read operations
- **Admin SDK**: Write operations (bypassa rules)
- **Rules**: Block ALL client writes, allow specific reads

### Dati Pubblici (Client Read)

| Path | Scopo |
|------|-------|
| `cronHealth/lastCall` | Banner monitoring |
| `stoveScheduler/*` | UI scheduler |
| `maintenance` | Card manutenzione |
| `log`, `errors` | Storico |
| `changelog` | Version check |
| `netatmo/currentStatus, topology` | ThermostatCard |
| `hue/lights, groups` | LightsCard |

### Dati Privati (Admin SDK Only)

| Path | Sensibilità |
|------|-------------|
| `netatmo/refresh_token` | CRITICA |
| `hue/refresh_token, username, clientkey` | CRITICA |
| `users/{userId}/fcmTokens` | ALTA |
| `users/{userId}/notificationPreferences` | MEDIA |
| `devicePreferences/{userId}` | MEDIA |
| `dev/*` | MEDIA |

### Deploy Rules

```bash
firebase deploy --only database
```

Verifica nel **Rules Playground**:
- `cronHealth/lastCall` READ → ALLOW
- `users/*/fcmTokens` READ → DENY

---

## Best Practices

1. **`dynamic = 'force-dynamic'`** per routes con Firebase
2. **NO Edge Runtime** (SDK incompatibile)
3. **Sempre cleanup listeners** (`return () => unsubscribe()`)
4. **Usa `update()`** per writes atomiche (no race conditions)
5. **`filterUndefined()`** per oggetti dinamici
6. **Transactions** per read-modify-write

---

## Troubleshooting

| Problema | Causa | Fix |
|----------|-------|-----|
| PERMISSION_DENIED (API) | Admin SDK non configurato | Verifica env vars |
| Client non legge | Rules non deployed | `firebase deploy --only database` |
| Write fallisce | `undefined` in payload | Usa `filterUndefined()` |

---

## See Also

- [Systems](./systems/) - Maintenance, monitoring, notifications
- [API Routes](./api-routes.md) - Endpoint implementations
