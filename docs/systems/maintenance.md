# Sistema Manutenzione Stufa

Sistema autonomo H24 per tracking ore utilizzo e gestione pulizia periodica.

## Overview

Il sistema di manutenzione traccia automaticamente le ore di utilizzo della stufa e gestisce il ciclo di pulizia periodica.

**Caratteristiche**:

- ✅ Tracking automatico server-side (cron ogni minuto)
- ✅ Funziona H24, anche con app chiusa
- ✅ Blocco automatico **solo accensione** quando pulizia richiesta
- ✅ Spegnimento sempre permesso
- ✅ Barra progresso visiva con colori dinamici
- ✅ Animazione shimmer quando ≥80%
- ✅ Notifiche push a soglie 80%, 90%, 100%

## Firebase Schema

```javascript
// maintenance/
{
  currentHours: 23.4567,        // float 4 decimali
  targetHours: 50.0,            // float configurabile
  lastCleanedAt: "2025-01-15T10:30:00.000Z",  // ISO UTC | null
  needsCleaning: false,         // boolean
  lastUpdatedAt: "2025-01-20T15:45:00.000Z",  // ISO UTC | null
  lastNotificationLevel: 80     // 80|90|100 | null
}
```

**Fields**:

- `currentHours` - Ore utilizzo attuali (4 decimali precisione)
- `targetHours` - Soglia pulizia configurabile (default 50h)
- `lastCleanedAt` - Timestamp ultima pulizia (null se mai pulita)
- `needsCleaning` - Flag blocco accensione
- `lastUpdatedAt` - Timestamp ultimo aggiornamento (CRITICO per calcolo elapsed)
- `lastNotificationLevel` - Ultima soglia notifica inviata (evita spam)

Vedi [Firebase - Maintenance Schema](../firebase.md#maintenance-schema) per dettagli.

## Lifecycle `lastUpdatedAt` (CRITICO)

**Perché importante**: Previene "ore fantasma" da timestamp init errati.

### Stati del Lifecycle

1. **Init** (nuovo sistema)

   ```javascript
   {
     currentHours: 0,
     targetHours: 50,
     lastCleanedAt: null,
     needsCleaning: false,
     lastUpdatedAt: null  // NULL, non timestamp corrente!
   }
   ```

2. **Primo evento WORK**

   ```javascript
   // trackUsageHours() vede lastUpdatedAt === null
   // → Inizializza timestamp senza aggiungere ore
   {
     lastUpdatedAt: "2025-01-20T15:00:00.000Z"
     // currentHours rimane 0
   }
   ```

3. **Tracking continuo**

   ```javascript
   // trackUsageHours() ogni minuto calcola elapsed
   const elapsed = (now - lastUpdatedAt) / 60000; // ms to minutes
   if (elapsed >= 0.5) {  // Almeno 30 secondi
     currentHours += elapsed / 60;  // minutes to hours
     lastUpdatedAt = now;
   }
   ```

4. **Config change** (updateTargetHours)

   ```javascript
   // updateTargetHours() NON tocca lastUpdatedAt
   await update(ref(db, 'maintenance'), {
     targetHours: newValue
     // lastUpdatedAt: UNCHANGED!
   });
   ```

**Motivazione**: Se `updateTargetHours()` aggiornasse `lastUpdatedAt`, il prossimo `trackUsageHours()` calcolerebbe
elapsed time errato (tempo dall'update config invece che dall'ultimo tracking).

## Service Functions (`lib/maintenanceService.js`)

### `getMaintenanceData()`

Recupera dati manutenzione (init default se non esiste).

```javascript
import { getMaintenanceData } from '@/lib/maintenanceService';

const data = await getMaintenanceData();
// {
//   currentHours: 23.4567,
//   targetHours: 50,
//   lastCleanedAt: "2025-01-15T10:30:00.000Z",
//   needsCleaning: false,
//   lastUpdatedAt: "2025-01-20T15:45:00.000Z",
//   lastNotificationLevel: null
// }
```

**Auto-init**: Se nodo Firebase non esiste, crea con defaults.

### `updateTargetHours(hours)`

Aggiorna ore target configurazione.

```javascript
import { updateTargetHours } from '@/lib/maintenanceService';

await updateTargetHours(60);  // Nuova soglia: 60 ore
```

**IMPORTANTE**: NON tocca `lastUpdatedAt` (evita ore fantasma).

### `trackUsageHours(status)` (CRITICO)

**Tracking automatico ogni minuto sul Pi** (ROADMAP D2; prima era nel cron `/api/scheduler/check`, rimosso in V12).

```javascript
import { trackUsageHours } from '@/lib/maintenanceService';

// Logica storica (ora sul Pi)
const statusRes = await fetch('http://localhost:3000/api/stove/status');
const { status } = await statusRes.json();

await trackUsageHours(status);
```

**Logica**:

1. Check `status === 'WORK' || status === 'MODULATION'` → se no, skip (entrambi sono working states)
2. Se `lastUpdatedAt === null` → inizializza timestamp, skip tracking
3. Calcola `elapsed = now - lastUpdatedAt` (minuti)
4. Se `elapsed < 0.5` minuti → skip (troppo presto)
5. Update Firebase **via Transaction** (concurrency-safe):

   ```javascript
   await runTransaction(ref(db, 'maintenance'), (current) => {
     if (!current) return current;

     const elapsed = calculateElapsed(current.lastUpdatedAt);
     const newHours = (current.currentHours || 0) + elapsed;

     return {
       ...current,
       currentHours: newHours,
       lastUpdatedAt: now,
       needsCleaning: newHours >= current.targetHours
     };
   });
   ```

**Auto-recovery**: Se cron salta chiamate, prossima esecuzione recupera minuti persi automaticamente (elapsed time based).

**Concurrency Safe**: Usa Firebase Transactions per garantire data integrity anche con multiple cron instances
(Cloud Functions scalabili).

**⚠️ CRITICO**: Tracking DEVE essere server-side via cron. Client-side tracking funziona SOLO se app aperta.

### `confirmCleaning(user)`

Reset contatore dopo pulizia + log Firebase.

```javascript
import { confirmCleaning } from '@/lib/maintenanceService';

// Con user Auth0
await confirmCleaning({
  sub: 'auth0|123456',
  name: 'Federico Manfredi',
  email: 'user@example.com'
});
```

**Operazioni**:

1. Reset `currentHours = 0`
2. Set `lastCleanedAt = now` (ISO UTC)
3. Set `needsCleaning = false`
4. Set `lastUpdatedAt = null` (restart tracking lifecycle)
5. Reset `lastNotificationLevel = null`
6. Log azione Firebase (`log/`)

### `canIgnite()`

Verifica se accensione consentita (blocco se needsCleaning).

```javascript
import { canIgnite } from '@/lib/maintenanceService';

// In /api/stove/ignite
const allowed = await canIgnite();
if (!allowed) {
  return NextResponse.json(
    { error: 'Manutenzione richiesta' },
    { status: 403 }
  );
}
```

**Return**: `true` se accensione OK, `false` se manutenzione richiesta.

### `getMaintenanceStatus()`

Status completo per UI (percentage, remaining, near limit).

```javascript
import { getMaintenanceStatus } from '@/lib/maintenanceService';

const status = await getMaintenanceStatus();
// {
//   percentage: 46.9,
//   remainingHours: 26.5,
//   isNearLimit: false,
//   needsCleaning: false
// }
```

**Fields**:

- `percentage` - Percentuale completamento (0-100+)
- `remainingHours` - Ore rimanenti prima pulizia
- `isNearLimit` - `true` se ≥80% (trigger warnings)
- `needsCleaning` - Flag blocco accensione

## UI Components

### MaintenanceBar

Barra progresso integrata in card "Stato Stufa" con collapse/expand intelligente.

**Features**:

- Auto-expand SOLO prima volta quando percentage ≥80%
- localStorage persistence preferenza utente
- Colori dinamici: verde (0-59%) → giallo (60-79%) → arancione (80-99%) → rosso (100%+)
- Animazione shimmer quando ≥80%

**Implementazione**: `app/components/MaintenanceBar.js:89-180`

**Pattern Collapse**:

```javascript
const [isExpanded, setIsExpanded] = useState(false);

useEffect(() => {
  const savedState = localStorage.getItem('maintenanceBarExpanded');

  if (savedState === 'true') {
    setIsExpanded(true);
  } else if (savedState === 'false') {
    setIsExpanded(false);
  } else if (percentage >= 80 && !needsCleaning) {
    // Auto-expand SOLO prima volta quando ≥80%
    setIsExpanded(true);
  }
}, [percentage, needsCleaning]);

const handleToggle = () => {
  const newState = !isExpanded;
  setIsExpanded(newState);
  localStorage.setItem('maintenanceBarExpanded', newState);
};
```

**CSS Modules**: `app/components/MaintenanceBar.module.css` per animazione shimmer.

### Banner Pulizia

Card bloccante quando `needsCleaning=true` con conferma pulizia.

**Pattern**:

```jsx
{needsCleaning && (
  <Banner
    liquid
    variant="error"
    icon="🧹"
    title="Manutenzione Richiesta"
    description="La stufa necessita di pulizia. L'accensione è bloccata fino alla conferma della manutenzione."
    actions={
      <Button
        liquid
        variant="primary"
        onClick={handleConfirmCleaning}
      >
        Conferma Pulizia
      </Button>
    }
  />
)}
```

**Implementazione**: Integrato in `app/page.js` (StoveCard area).

## Tracking Server-Side

**Perché server-side**: Client-side tracking funziona SOLO se app aperta. Server-side cron funziona H24.

### Implementazione

Il tracking gira sul Pi (ROADMAP D2), H24 e indipendente dall'app aperta; il vecchio cron Vercel
`/api/scheduler/check` è stato rimosso (ROADMAP V12).

## Push Notifications

Sistema notifiche push per soglie manutenzione.

### Soglie Notifiche

- **80%** - Promemoria: "Manutenzione consigliata tra breve"
- **90%** - Attenzione: "Manutenzione necessaria presto"
- **100%** - Urgente: "Manutenzione richiesta - accensione bloccata"

**Implementazione**: `lib/maintenanceService.js:trackUsageHours()`

```javascript
// Check notification thresholds
if (currentHours >= targetHours && lastNotificationLevel !== 100) {
  await sendMaintenanceNotification(100);
  await update(ref(db, 'maintenance'), { lastNotificationLevel: 100 });
}
else if (currentHours >= targetHours * 0.9 && lastNotificationLevel !== 90) {
  await sendMaintenanceNotification(90);
  await update(ref(db, 'maintenance'), { lastNotificationLevel: 90 });
}
else if (currentHours >= targetHours * 0.8 && lastNotificationLevel !== 80) {
  await sendMaintenanceNotification(80);
  await update(ref(db, 'maintenance'), { lastNotificationLevel: 80 });
}
```

**Anti-spam**: `lastNotificationLevel` previene notifiche duplicate.

Vedi [Systems - Notifications](./notifications.md) per setup completo.

## User Preferences

Preferenze utente per notifiche manutenzione.

```javascript
// users/{userId}/notificationPreferences/maintenance
{
  enabled: true,
  threshold80: true,   // Promemoria 80%
  threshold90: true,   // Attenzione 90%
  threshold100: true   // Urgente 100%
}
```

**Check prima invio**:

```javascript
import { shouldSendMaintenanceNotification } from '@/lib/notificationPreferencesService';

const shouldSend = await shouldSendMaintenanceNotification(userId, 80);
if (shouldSend) {
  await sendMaintenanceNotification(80);
}
```

Vedi [Systems - Notifications](./notifications.md#preferenze-utente) per dettagli.

## Integration Points

### Ignite Endpoint

Blocco accensione se manutenzione richiesta.

```javascript
// app/api/stove/ignite/route.js
import { canIgnite } from '@/lib/maintenanceService';

export async function POST(request) {
  const allowed = await canIgnite();
  if (!allowed) {
    return NextResponse.json(
      { error: 'Manutenzione richiesta' },
      { status: 403 }
    );
  }
  // Proceed with ignition
}
```

### Shutdown Endpoint

Spegnimento sempre permesso (NO maintenance check).

```javascript
// app/api/stove/shutdown/route.js

export async function POST(request) {
  // NO canIgnite() check - shutdown always allowed
  // Proceed with shutdown
}
```

### Scheduler Cron

Blocco accensione schedulata se manutenzione richiesta.

```javascript
// Motore scheduler sul Pi (logica equivalente)

// Se azione è IGNITE
if (action === 'IGNITE') {
  const allowed = await canIgnite();
  if (!allowed) {
    console.log('Scheduled ignition blocked: maintenance required');
    continue;  // Skip action
  }
}

// SHUTDOWN/SetFan/SetPower sempre permessi (NO check)
```

## Configuration Page

Pagina `/maintenance` per configurazione ore target e conferma pulizia.

**Features**:

- Input configurazione `targetHours`
- Display status corrente (percentage, remaining, last cleaned)
- Pulsante conferma pulizia (con modal conferma)
- Pulsante reset (admin only, con modal conferma)

**Implementazione**: `app/maintenance/page.js`

**Modal Conferma Pattern**: Vedi [Patterns - Confirmation Modal](../patterns.md#confirmation-modal-pattern).

## Testing

### Unit Tests

```javascript
// lib/__tests__/maintenanceService.test.js

describe('maintenanceService', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-01-20T15:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('trackUsageHours - primo WORK inizializza lastUpdatedAt', async () => {
    // Mock Firebase con lastUpdatedAt: null
    // Call trackUsageHours('WORK')
    // Verify lastUpdatedAt settato, currentHours unchanged
  });

  test('trackUsageHours - tracking continuo aggiunge ore', async () => {
    // Mock Firebase con lastUpdatedAt: "2025-01-20T14:00:00.000Z"
    // Advance time 1 hour
    // Call trackUsageHours('WORK')
    // Verify currentHours += 1, lastUpdatedAt updated
  });

  // ... altri test
});
```

Vedi [Testing](../testing.md) per pattern completi.

### Manual Testing

1. **Reset system**: Delete `maintenance/` node in Firebase
2. **Start tracking**: Ignite stufa → cron starts tracking
3. **Verify tracking**: Check `currentHours` increasing ogni minuto
4. **Test blocco**: Set `needsCleaning: true` → verify ignition blocked
5. **Confirm cleaning**: Click confirm → verify reset

## Troubleshooting

### Ore non incrementano

**Check**:

1. Cron running? → Vedi [Systems - Monitoring](./monitoring.md)
2. `lastUpdatedAt` settato? → Deve essere ISO UTC string, non null
3. Status WORK? → Tracking solo quando status = 'WORK'
4. Elapsed time? → Almeno 30 secondi tra update

### Ore fantasma (currentHours incrementa senza stufa accesa)

**Cause**:

1. `lastUpdatedAt` init errato → Deve essere `null`, non timestamp corrente
2. `updateTargetHours()` aggiorna `lastUpdatedAt` → NON deve toccarlo

**Fix**: Reset `lastUpdatedAt = null` e lascia che primo evento WORK lo inizializzi.

### Notifiche duplicate

**Check**: `lastNotificationLevel` in Firebase. Deve essere settato dopo invio per evitare spam.

## See Also

- [Firebase - Maintenance Schema](../firebase.md#maintenance-schema)
- [API Routes - Scheduler](../api-routes.md#scheduler-api)
- [Systems - Notifications](./notifications.md)
- [Patterns - Collapse/Expand](../patterns.md#collapseexpand-components-with-localstorage)

---

**Last Updated**: 2025-11-25
