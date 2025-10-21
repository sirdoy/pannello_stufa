# Firebase

Schema Firebase Realtime Database e best practices.

## Overview

Firebase Realtime Database è utilizzato per:
- **Scheduler**: Configurazione pianificazioni settimanali
- **Maintenance**: Tracking ore utilizzo stufa
- **Logs**: Storico azioni utente
- **Errors**: Storico errori stufa
- **Versioning**: Changelog e versione corrente
- **Cron Health**: Monitoring affidabilità cronjob
- **External APIs**: OAuth tokens e configurazioni
- **Push Notifications**: FCM tokens e preferenze utente

## Schema Completo

```
firebase-root/
├── stoveScheduler/
│   ├── monday/              # Array [{start, end, power, fan}]
│   ├── tuesday/
│   ├── wednesday/
│   ├── thursday/
│   ├── friday/
│   ├── saturday/
│   ├── sunday/
│   └── mode/
│       ├── enabled          # boolean
│       ├── semiManual       # boolean
│       └── returnToAutoAt   # ISO string UTC
│
├── maintenance/
│   ├── currentHours         # float (4 decimali)
│   ├── targetHours          # float (default 50)
│   ├── lastCleanedAt        # ISO string UTC | null
│   ├── needsCleaning        # boolean
│   ├── lastUpdatedAt        # ISO string UTC | null
│   └── lastNotificationLevel # 80|90|100 (evita spam notifiche)
│
├── cronHealth/
│   └── lastCall             # ISO string UTC
│
├── log/
│   └── {logId}/
│       ├── action           # string (es. 'IGNITE')
│       ├── device           # string (es. 'stove')
│       ├── value            # string | null
│       ├── timestamp        # number (Unix ms)
│       ├── source           # 'manual' | 'scheduler'
│       └── user/
│           ├── sub          # Auth0 user ID
│           ├── name
│           └── email
│
├── errors/
│   └── {errorId}/
│       ├── errorCode        # number (0 = no error)
│       ├── errorDescription # string
│       ├── severity         # 'INFO'|'WARNING'|'ERROR'|'CRITICAL'
│       ├── timestamp        # number (Unix ms)
│       ├── resolved         # boolean
│       ├── resolvedAt       # number (Unix ms) [opzionale]
│       ├── status           # string (status stufa)
│       └── source           # string (es. 'status_monitor')
│
├── changelog/
│   └── {version}/           # "1_1_0" (dots → underscores)
│       ├── version          # string "1.1.0"
│       ├── date             # string "2025-01-15"
│       ├── type             # 'major'|'minor'|'patch'
│       ├── changes          # array of strings
│       └── timestamp        # number (Unix ms)
│
├── users/
│   └── {userId}/            # Auth0 user ID (es. auth0|xxx)
│       ├── fcmTokens/
│       │   └── {tokenHash}/
│       │       ├── token        # FCM token
│       │       ├── createdAt    # number (Unix ms)
│       │       ├── platform     # 'ios'|'other'
│       │       └── isPWA        # boolean
│       └── notificationPreferences/
│           ├── errors/
│           │   ├── enabled      # boolean
│           │   └── severityLevels/
│           │       ├── info     # boolean (default false)
│           │       ├── warning  # boolean (default true)
│           │       ├── error    # boolean (default true)
│           │       └── critical # boolean (default true)
│           ├── scheduler/
│           │   ├── enabled      # boolean
│           │   ├── ignition     # boolean
│           │   └── shutdown     # boolean
│           └── maintenance/
│               ├── enabled      # boolean
│               ├── threshold80  # boolean
│               ├── threshold90  # boolean
│               └── threshold100 # boolean
│
└── [external-api]/          # Pattern per API esterne
    ├── refresh_token        # OAuth refresh token
    ├── [config]/            # API config (es. home_id, device_id)
    ├── [data]/              # Cache dati fetched
    │   └── updated_at       # timestamp last fetch
    └── [automation]/        # Custom automations (opzionale)
```

## Scheduler Schema

Configurazione pianificazioni settimanali per dispositivi.

### Day Intervals

```javascript
// stoveScheduler/monday (example)
[
  {
    start: "08:00",  // HH:MM format
    end: "12:00",
    power: 4,        // 1-5
    fan: 3           // 1-6
  },
  {
    start: "18:00",
    end: "23:00",
    power: 5,
    fan: 4
  }
]
```

**Constraints**:
- Array di intervalli per ogni giorno
- `start` e `end` in formato "HH:MM" (24h)
- No overlapping intervals
- Ordinati cronologicamente

### Mode Configuration

```javascript
// stoveScheduler/mode
{
  enabled: true,           // Scheduler on/off
  semiManual: false,       // Override temporaneo
  returnToAutoAt: null     // ISO UTC string | null
}
```

**Mode States**:
- **Manual**: `enabled: false`
- **Automatic**: `enabled: true, semiManual: false`
- **Semi-Manual**: `enabled: true, semiManual: true, returnToAutoAt: <timestamp>`

Vedi [Systems - Scheduler](./systems/scheduler.md) per logica completa.

## Maintenance Schema

Tracking ore utilizzo e gestione pulizia periodica.

```javascript
// maintenance/
{
  currentHours: 23.4567,        // float 4 decimali
  targetHours: 50.0,            // float
  lastCleanedAt: "2025-01-15T10:30:00.000Z",  // ISO UTC | null
  needsCleaning: false,         // boolean
  lastUpdatedAt: "2025-01-20T15:45:00.000Z",  // ISO UTC | null
  lastNotificationLevel: 80     // 80|90|100 | null
}
```

**Fields**:
- `currentHours` - Ore utilizzo attuali (4 decimali precisione)
- `targetHours` - Soglia pulizia configurabile
- `lastCleanedAt` - Timestamp ultima pulizia (null se mai pulita)
- `needsCleaning` - Flag blocco accensione
- `lastUpdatedAt` - Timestamp ultimo aggiornamento tracking (CRITICO per calcolo elapsed)
- `lastNotificationLevel` - Evita spam notifiche duplicate

**Lifecycle `lastUpdatedAt`** (IMPORTANTE):
1. **Init**: `null` (NO timestamp inizializzazione)
2. **Primo WORK**: Inizializza timestamp senza aggiungere ore
3. **Tracking continuo**: Calcola elapsed, aggiorna entrambi
4. **Config change**: NON tocca `lastUpdatedAt` (evita ore fantasma)

Vedi [Systems - Maintenance](./systems/maintenance.md) per dettagli completi.

## Log Schema

Storico azioni utente con supporto multi-device.

```javascript
// log/{logId}
{
  action: "IGNITE",
  device: "stove",              // from DEVICE_TYPES
  value: "P4",                  // optional
  timestamp: 1705320000000,     // Unix ms
  source: "manual",             // 'manual' | 'scheduler'
  user: {
    sub: "auth0|123456",
    name: "Federico Manfredi",
    email: "user@example.com"
  }
}
```

**Device Filtering**: UI supporta filtri per dispositivo (Tutti, Stufa, Termostato, Luci, Sonos).

**Implementazione**: `lib/logService.js`, `app/log/page.js`

## Errors Schema

Storico errori dispositivi con severità e risoluzione.

```javascript
// errors/{errorId}
{
  errorCode: 10,                    // 0 = no error
  errorDescription: "Allarme sicurezza fusibile termico",
  severity: "CRITICAL",             // INFO|WARNING|ERROR|CRITICAL
  timestamp: 1705320000000,         // Unix ms
  resolved: false,
  resolvedAt: null,                 // Unix ms | null
  status: "COOL",                   // Status device quando errore verificato
  source: "status_monitor"          // Origine rilevamento
}
```

**Auto-resolve**: Errori con `errorCode: 0` sono auto-risolti.

Vedi [Systems - Errors](./systems/errors.md) per database completo codici errore.

## Changelog Schema

Versioni app con semantic versioning.

```javascript
// changelog/1_4_0  (dots → underscores)
{
  version: "1.4.0",
  date: "2025-01-15",
  type: "minor",                // major|minor|patch
  changes: [
    "Aggiunta feature X",
    "Fix bug Y"
  ],
  timestamp: 1705320000000      // Unix ms
}
```

**Version Key**: Dots replaced with underscores (Firebase key constraint).

**Sync**: Usa `syncVersionHistoryToFirebase()` per push da `lib/version.js`.

Vedi [Versioning](./versioning.md) per workflow completo.

## Cron Health Schema

Monitoring affidabilità cronjob scheduler.

```javascript
// cronHealth/lastCall
"2025-01-20T15:45:30.123Z"  // ISO UTC string
```

**Update**: Salvato ad ogni chiamata `/api/scheduler/check`.

**Monitor**: Client-side Firebase listener + check ogni 30s.

Vedi [Systems - Monitoring](./systems/monitoring.md) per dettagli.

## Users Schema

Dati utente per FCM tokens e preferenze notifiche.

### FCM Tokens

```javascript
// users/{userId}/fcmTokens/{tokenHash}
{
  token: "fcm-token-string",
  createdAt: 1705320000000,     // Unix ms
  platform: "ios",              // 'ios' | 'other'
  isPWA: true                   // boolean
}
```

**Token Hash**: SHA-256 hash del token FCM (per evitare duplicati).

### Notification Preferences

```javascript
// users/{userId}/notificationPreferences
{
  errors: {
    enabled: true,
    severityLevels: {
      info: false,      // Default off (rumore)
      warning: true,
      error: true,
      critical: true
    }
  },
  scheduler: {
    enabled: true,
    ignition: true,     // Notifica accensione auto
    shutdown: true      // Notifica spegnimento auto
  },
  maintenance: {
    enabled: true,
    threshold80: true,  // Promemoria 80%
    threshold90: true,  // Attenzione 90%
    threshold100: true  // Urgente 100%
  }
}
```

Vedi [Systems - Notifications](./systems/notifications.md) per gestione completa.

## External APIs Pattern

Schema generico per integrazioni API esterne.

```javascript
// [external-api]/
{
  refresh_token: "oauth-refresh-token",  // OAuth token persistente

  // Config (esempio Netatmo)
  home_id: "xxx",
  device_id: "xxx",

  // Cache dati
  topology: { /* cached data */ },
  status: { /* cached data */ },
  updated_at: 1705320000000,

  // Automations (opzionale)
  automations: {
    rule1: { /* custom automation */ }
  }
}
```

**Esempio completo**: `netatmo/` per Netatmo Energy API.

Vedi [API Routes - External APIs Pattern](./api-routes.md#external-apis-pattern) per implementazione.

## Firebase Operations

### Initialization

```javascript
// lib/firebase.js
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  // ...
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db, db as database };  // Dual export pattern
```

**IMPORTANTE**:
- ✅ Client SDK only (NO Edge runtime)
- ✅ Dual export per compatibilità
- ❌ NO Firebase Admin SDK client-side

### Read Operations

```javascript
import { ref, get, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';

// Single read
const snapshot = await get(ref(db, 'maintenance'));
const data = snapshot.val();

// Realtime listener
const unsubscribe = onValue(ref(db, 'cronHealth/lastCall'), (snapshot) => {
  const timestamp = snapshot.val();
  // Handle update
});

// Cleanup
return () => unsubscribe();
```

### Write Operations

```javascript
import { ref, set, update, push } from 'firebase/database';
import { db } from '@/lib/firebase';

// Set (overwrite)
await set(ref(db, 'maintenance/needsCleaning'), true);

// Update (partial)
await update(ref(db, 'maintenance'), {
  currentHours: 25.5,
  lastUpdatedAt: new Date().toISOString()
});

// Push (auto-generated key)
const newLogRef = push(ref(db, 'log'));
await set(newLogRef, {
  action: 'IGNITE',
  timestamp: Date.now(),
  // ...
});
```

### Undefined Values (CRITICO)

**Firebase Realtime Database NON accetta valori `undefined`**.

```javascript
// ❌ WRONG - Firebase error
await update(ref(db, 'maintenance'), {
  currentHours: 25.5,
  lastCleanedAt: undefined  // ERROR!
});

// ✅ CORRECT - Filter undefined
function filterUndefined(obj) {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (value !== undefined && value !== null) {
      acc[key] = value;
    }
    return acc;
  }, {});
}

await update(ref(db, 'maintenance'), filterUndefined({
  currentHours: 25.5,
  lastCleanedAt: undefined  // Filtered out
}));
```

**Helper Pattern**: Applicare sempre `filterUndefined()` quando:
- API esterne con campi opzionali
- Parsing oggetti complessi
- Form/input utente
- Campi timestamp event-driven

### Null Initialization Pattern

**Pattern `null` initialization** per campi popolati da eventi futuri.

```javascript
// ✅ CORRECT - Init with null
await set(ref(db, 'maintenance'), {
  currentHours: 0,
  targetHours: 50,
  lastCleanedAt: null,      // Popolato dopo prima pulizia
  needsCleaning: false,
  lastUpdatedAt: null       // Popolato al primo evento WORK
});

// ❌ WRONG - Init with current timestamp
await set(ref(db, 'maintenance'), {
  // ...
  lastUpdatedAt: new Date().toISOString()  // Causerebbe ore fantasma!
});
```

**Motivazione**:
- Previene "dati fantasma" in calcoli elapsed time
- Distingue "mai inizializzato" da "inizializzato ma zero"
- Evita tracking errato prima del primo evento reale

**Esempio**: `lastUpdatedAt` inizia `null`, settato solo al primo status WORK.

### Transactions (Atomic Operations)

```javascript
import { ref, runTransaction } from 'firebase/database';
import { db } from '@/lib/firebase';

await runTransaction(ref(db, 'maintenance/currentHours'), (currentValue) => {
  if (currentValue === null) return 0;
  return currentValue + 0.5;  // Increment atomically
});
```

**Use Cases**:
- Contatori
- Operazioni atomiche multiple
- Race conditions prevention

## Best Practices

### 1. Dynamic Rendering

Force dynamic per routes con Firebase.

```javascript
// app/api/[endpoint]/route.js
export const dynamic = 'force-dynamic';
```

### 2. NO Edge Runtime

Firebase Client SDK incompatibile con Edge runtime.

```javascript
// ✅ CORRECT
export const dynamic = 'force-dynamic';

// ❌ WRONG
export const runtime = 'edge';
```

### 3. Error Handling

```javascript
try {
  const snapshot = await get(ref(db, 'maintenance'));
  if (!snapshot.exists()) {
    // Handle missing data
    return defaultData;
  }
  return snapshot.val();
} catch (error) {
  console.error('Firebase error:', error);
  // Handle error
}
```

### 4. Listeners Cleanup

Sempre cleanup listeners per evitare memory leaks.

```javascript
useEffect(() => {
  const unsubscribe = onValue(ref(db, 'path'), (snapshot) => {
    // Handle update
  });

  return () => unsubscribe();  // Cleanup!
}, []);
```

### 5. Batch Operations

Usa `update()` per multiple writes atomiche.

```javascript
// ✅ CORRECT - Single atomic operation
await update(ref(db, 'maintenance'), {
  currentHours: 25.5,
  lastUpdatedAt: new Date().toISOString(),
  needsCleaning: false
});

// ❌ WRONG - Multiple operations (race conditions)
await set(ref(db, 'maintenance/currentHours'), 25.5);
await set(ref(db, 'maintenance/lastUpdatedAt'), new Date().toISOString());
await set(ref(db, 'maintenance/needsCleaning'), false);
```

## See Also

- [Systems](./systems/) - Sistemi che usano Firebase (maintenance, monitoring, etc.)
- [API Routes](./api-routes.md) - API routes con Firebase operations
- [Versioning](./versioning.md) - Changelog sync Firebase

---

**Last Updated**: 2025-10-21
