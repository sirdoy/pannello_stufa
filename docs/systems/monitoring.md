# Sistema Monitoring Cronjob

Sistema per monitoraggio affidabilità cronjob scheduler in tempo reale.

## Overview

Monitora automaticamente l'affidabilità del cronjob scheduler salvando timestamp Firebase ad ogni esecuzione e mostrando alert se il cron diventa inattivo.

**Features**:
- ✅ Salvataggio timestamp Firebase ad ogni chiamata cron
- ✅ Firebase listener realtime client-side
- ✅ Alert automatico se cron inattivo >5 minuti
- ✅ Auto-hide quando cron riprende
- ✅ Check ogni 30s client-side

## Firebase Schema

```javascript
// cronHealth/lastCall
"2025-01-20T15:45:30.123Z"  // ISO UTC string
```

**Update**: Salvato all'inizio di ogni chiamata `/api/scheduler/check`.

Vedi [Firebase - Cron Health Schema](../firebase.md#cron-health-schema).

## Server-Side Implementation

### Timestamp Save

Salva timestamp Firebase ad ogni chiamata cron endpoint.

```javascript
// app/api/scheduler/check/route.js

import { ref, set } from 'firebase/database';
import { db } from '@/lib/firebase';

export async function GET(request) {
  // 1. Verify CRON_SECRET
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Save timestamp (PRIMO step - prima di tutto)
  await set(ref(db, 'cronHealth/lastCall'), new Date().toISOString());

  // 3. Resto logica scheduler...
  // ...
}
```

**IMPORTANTE**: Timestamp salvato PRIMA di eseguire logica scheduler per garantire update anche se scheduler fail.

## Client-Side Monitoring

### CronHealthBanner Component

Componente con Firebase realtime listener + check ogni 30s.

**Implementazione**: `app/components/CronHealthBanner.js:25-85`

```javascript
'use client';

import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';
import Banner from './ui/Banner';

export default function CronHealthBanner({ variant = 'banner' }) {
  const [isInactive, setIsInactive] = useState(false);
  const [lastCall, setLastCall] = useState(null);

  // Firebase realtime listener
  useEffect(() => {
    const cronRef = ref(db, 'cronHealth/lastCall');

    const unsubscribe = onValue(cronRef, (snapshot) => {
      if (snapshot.exists()) {
        setLastCall(snapshot.val());
      }
    });

    return () => unsubscribe();
  }, []);

  // Check ogni 30s se cron inattivo
  useEffect(() => {
    const checkHealth = () => {
      if (!lastCall) return;

      const lastCallTime = new Date(lastCall).getTime();
      const now = Date.now();
      const elapsed = (now - lastCallTime) / 1000 / 60; // minuti

      if (elapsed > 5) {
        setIsInactive(true);
      } else {
        setIsInactive(false);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000); // 30s
    return () => clearInterval(interval);
  }, [lastCall]);

  if (!isInactive) return null;

  // Render banner/inline variant
  if (variant === 'inline') {
    return (
      <div className="text-sm text-warning-600">
        ⚠️ Scheduler potrebbe essere inattivo
      </div>
    );
  }

  return (
    <Banner
      liquid
      variant="warning"
      icon="⚠️"
      title="Scheduler Inattivo"
      description="Il cronjob scheduler non risponde da oltre 5 minuti. La pianificazione automatica potrebbe non funzionare."
    />
  );
}
```

### Pattern Firebase Listener

```javascript
// Realtime listener setup
useEffect(() => {
  const unsubscribe = onValue(ref(db, 'cronHealth/lastCall'), (snapshot) => {
    if (snapshot.exists()) {
      setLastCall(snapshot.val());
    }
  });

  // Cleanup listener
  return () => unsubscribe();
}, []);
```

**Vantaggi**:
- ✅ Update realtime quando cron esegue
- ✅ Zero polling client-side per timestamp
- ✅ Efficiente (solo eventi change)

### Check Interval

```javascript
// Check health ogni 30s
useEffect(() => {
  const checkHealth = () => {
    if (!lastCall) return;

    const elapsed = (Date.now() - new Date(lastCall).getTime()) / 60000;

    setIsInactive(elapsed > 5);  // Inattivo se >5 minuti
  };

  checkHealth();  // Check immediato
  const interval = setInterval(checkHealth, 30000);

  return () => clearInterval(interval);
}, [lastCall]);
```

**Threshold**: 5 minuti (cron ogni 1 minuto = 5 chiamate mancate).

## UI Variants

### Banner Variant (Default)

Banner standalone per pagine senza context.

```jsx
<CronHealthBanner variant="banner" />
```

**Output**: Full `<Banner>` component con titolo, descrizione, icona.

### Inline Variant

Variante compatta per integrazione in card esistenti.

```jsx
<CronHealthBanner variant="inline" />
```

**Output**: Single line warning text.

**Implementazione**: Integrato in card "Stato Stufa" (`app/page.js`).

## Integration Points

### HomePage (StoveCard)

```jsx
// app/page.js - StoveCard area

<Card liquid className="p-6">
  <h2>🔥 Stato Stufa</h2>

  {/* Cron health inline variant */}
  <CronHealthBanner variant="inline" />

  {/* Resto card content */}
</Card>
```

### Scheduler Page

```jsx
// app/scheduler/page.js

export default function SchedulerPage() {
  return (
    <>
      {/* Cron health banner variant */}
      <CronHealthBanner variant="banner" />

      {/* Resto pagina */}
    </>
  );
}
```

## Cronjob Configuration

### Cron Setup

**Frequency**: Ogni minuto

```bash
# crontab
* * * * * curl -s "https://your-app.com/api/scheduler/check?secret=YOUR_SECRET" > /dev/null
```

**Alternative**: Servizi esterni (cron-job.org, EasyCron, etc.)

### Environment Variable

```env
CRON_SECRET=your-random-secret-here
```

**Generate secret**:
```bash
openssl rand -base64 32
```

### Endpoint Protection

```javascript
// app/api/scheduler/check/route.js

const secret = searchParams.get('secret');

if (secret !== process.env.CRON_SECRET) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

## Testing

### Manual Testing

1. **Setup**: Configura cron per chiamare endpoint ogni minuto
2. **Verify active**: Check banner NOT visible quando cron running
3. **Stop cron**: Disabilita cron temporaneamente
4. **Wait 5+ minuti**: Banner dovrebbe apparire
5. **Restart cron**: Banner dovrebbe nascondersi dopo prima chiamata

### Unit Tests

```javascript
// app/components/__tests__/CronHealthBanner.test.js

describe('CronHealthBanner', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('mostra banner se cron inattivo >5 minuti', () => {
    // Mock Firebase con lastCall 6 minuti fa
    // Render component
    // Verify banner visible
  });

  test('nasconde banner se cron attivo', () => {
    // Mock Firebase con lastCall 2 minuti fa
    // Render component
    // Verify banner hidden
  });
});
```

## Troubleshooting

### Banner sempre visibile

**Check**:
1. Cron running? → Verify cron service active
2. CRON_SECRET corretto? → Check env var matches cron URL
3. Firebase timestamp salvato? → Check `cronHealth/lastCall` in Firebase console
4. Client-side time sync? → Verify system clock corretto

### Banner mai visibile anche con cron fermo

**Check**:
1. Firebase listener? → Verify `onValue` setup corretto
2. Check interval? → Verify `setInterval(checkHealth, 30000)` running
3. Threshold? → Verify `elapsed > 5` calculation

### Firebase listener non aggiorna

**Check**:
1. Listener cleanup? → Verify `return () => unsubscribe()` in useEffect
2. Firebase permissions? → Check database rules
3. Network? → Check browser console errors

## See Also

- [API Routes - Scheduler](../api-routes.md#scheduler-api)
- [Firebase - Cron Health Schema](../firebase.md#cron-health-schema)
- [Patterns - Firebase Listeners](../patterns.md#firebase-realtime-listeners)

---

**Last Updated**: 2025-10-21
