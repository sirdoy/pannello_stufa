# Troubleshooting

Soluzioni problemi comuni e debug tools.

## Build Errors

### Firebase Initialization Error

**Error**: `Firebase not supported in Edge runtime`

**Solution**: Force dynamic rendering.

```javascript
// app/api/[endpoint]/route.js
export const dynamic = 'force-dynamic';

// ❌ Remove if present
export const runtime = 'edge';
```

**Root Cause**: Firebase Client SDK non compatibile con Edge runtime.

### Missing 'use client' Directive

**Error**: `You're importing a component that needs useState. It only works in a Client Component...`

**Solution**: Add `'use client';` come PRIMA riga del file.

```javascript
'use client';  // PRIMA riga, prima degli import

import { useState } from 'react';
```

**Find Files Missing Directive**:
```bash
find app -name "*.js" -exec grep -l "useState\|useEffect" {} \; | \
  xargs -I {} sh -c 'if [ "$(head -1 "{}" | grep -c "use client")" -eq 0 ]; then echo "{}"; fi'
```

## Version System

### Modal "Aggiorna App" Sempre Visibile

**Symptoms**: ForceUpdateModal appare sempre anche dopo reload.

**Checks**:
1. **Environment**: Modal disabilitata su localhost (by design)
   ```javascript
   // Verify in browser console
   window.location.hostname
   // Should be production domain, not localhost
   ```

2. **Firebase Sync**: Verifica versione Firebase aggiornata
   ```bash
   # Sync changelog to Firebase
   node -e "require('./lib/changelogService').syncVersionHistoryToFirebase(require('./lib/version').VERSION_HISTORY)"
   ```

3. **Version Comparison**: Check versions match
   ```javascript
   // Browser console
   console.log('Local:', APP_VERSION);
   console.log('Firebase:', latestVersion);
   ```

4. **Cache**: Hard refresh
   ```
   Ctrl+Shift+R (Windows/Linux)
   Cmd+Shift+R (Mac)
   ```

### Badge "NEW" Non Appare

**Symptoms**: Badge nuovo changelog non visibile.

**Checks**:
1. **localStorage**: Clear last seen version
   ```javascript
   // Browser console
   localStorage.removeItem('lastSeenVersion');
   ```

2. **Version Comparison**: Verify APP_VERSION > lastSeenVersion
   ```javascript
   // Browser console
   console.log('APP_VERSION:', '1.5.0');
   console.log('lastSeen:', localStorage.getItem('lastSeenVersion'));
   ```

### Changelog Ordering Wrong

**Symptoms**: Versioni non in ordine semantico (1.4.2 dopo 1.4.10).

**Solution**: Applica sempre `sortVersions()` dopo fetch Firebase.

```javascript
// ❌ WRONG
const versions = Object.values(snapshot.val());
setVersions(versions);  // Ordine Firebase (solo data)

// ✅ CORRECT
const versions = Object.values(snapshot.val());
const sorted = sortVersions(versions);
setVersions(sorted);  // Ordine semantico corretto
```

**Implementation**: `app/changelog/page.js:45-65`

## Scheduler

### Scheduler Non Esegue Azioni

**Symptoms**: Scheduler in auto ma non accende/spegne stufa.

**Checks**:
1. **Mode**: Verifica mode Firebase
   ```javascript
   // Firebase console: stoveScheduler/mode
   {
     enabled: true,        // DEVE essere true
     semiManual: false,    // DEVE essere false
     returnToAutoAt: null
   }
   ```

2. **Cron Running**: Verifica cron attivo
   ```
   Check CronHealthBanner in app
   - Se visibile → cron inattivo >5min
   - Se nascosto → cron OK
   ```

3. **Schedule Valid**: Verifica intervalli Firebase
   ```javascript
   // Firebase console: stoveScheduler/monday (esempio)
   [
     { start: "08:00", end: "12:00", power: 4, fan: 3 }
   ]
   ```

4. **API Logs**: Check server logs
   ```bash
   # Check cron endpoint logs
   tail -f logs/scheduler.log
   ```

### Semi-Manual Non Si Disattiva

**Symptoms**: Semi-manual attivo anche dopo orario returnToAutoAt.

**Checks**:
1. **returnToAutoAt**: Verifica timestamp futuro
   ```javascript
   // Firebase: stoveScheduler/mode/returnToAutoAt
   "2025-01-20T18:30:00.000Z"  // Deve essere futuro
   ```

2. **Cron Execution**: Verifica cron chiama endpoint
   ```bash
   # Check if cron running
   # Should call /api/scheduler/check every minute
   ```

3. **Manual Clear**: Force clear via API
   ```javascript
   // Firebase console: stoveScheduler/mode
   {
     semiManual: false,
     returnToAutoAt: null
   }
   ```

## Maintenance

### Ore Non Incrementano

**Symptoms**: currentHours non aumenta con stufa accesa.

**Checks**:
1. **Cron Running**: Verifica CronHealthBanner
   ```
   Se banner visibile → cron inattivo
   ```

2. **lastUpdatedAt**: Deve essere ISO UTC string
   ```javascript
   // Firebase: maintenance/lastUpdatedAt
   "2025-01-20T15:45:00.000Z"  // ✅ Correct
   null                         // ❌ Will init on first WORK
   undefined                    // ❌ Error
   ```

3. **Status WORK**: Tracking solo quando status = 'WORK'
   ```javascript
   // Check current status
   fetch('/api/stove/status').then(r => r.json()).then(d => console.log(d.status));
   ```

4. **Elapsed Time**: Almeno 30 secondi tra update
   ```
   Check: now - lastUpdatedAt >= 30 seconds
   ```

### Ore Fantasma (Incrementa Senza Stufa Accesa)

**Symptoms**: currentHours aumenta con stufa spenta.

**Root Causes**:
1. **lastUpdatedAt Init Errato**: Inizializzato con timestamp invece di null
   ```javascript
   // ❌ WRONG init
   lastUpdatedAt: new Date().toISOString()

   // ✅ CORRECT init
   lastUpdatedAt: null
   ```

2. **updateTargetHours Tocca lastUpdatedAt**: Config change aggiorna lastUpdatedAt
   ```javascript
   // ❌ WRONG - causes phantom hours
   await update(ref(db, 'maintenance'), {
     targetHours: newValue,
     lastUpdatedAt: new Date().toISOString()  // BAD!
   });

   // ✅ CORRECT - don't touch lastUpdatedAt
   await update(ref(db, 'maintenance'), {
     targetHours: newValue
   });
   ```

**Fix**: Reset `lastUpdatedAt = null` in Firebase. Prossimo evento WORK lo inizializzerà correttamente.

### Notifiche Manutenzione Duplicate

**Symptoms**: Stessa notifica 80%/90%/100% inviata multiple volte.

**Check**: `lastNotificationLevel` in Firebase
```javascript
// Firebase: maintenance/lastNotificationLevel
80  // ✅ Correct - sent threshold 80, won't resend
null  // ❌ Will send again
```

**Fix**: Verifica che `lastNotificationLevel` sia settato dopo ogni invio.

## Firebase

### Undefined Values Error

**Error**: `Firebase error: First argument contains undefined in property`

**Root Cause**: Firebase non accetta `undefined` in write operations.

**Solution**: Filter undefined values
```javascript
function filterUndefined(obj) {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (value !== undefined && value !== null) {
      acc[key] = value;
    }
    return acc;
  }, {});
}

// Use it
await update(ref(db, 'path'), filterUndefined({
  field1: 'value',
  field2: undefined  // Will be filtered out
}));
```

### Listener Memory Leaks

**Symptoms**: App slows down over time, multiple Firebase listeners.

**Root Cause**: Missing cleanup in useEffect.

**Solution**: Always cleanup listeners
```javascript
// ❌ WRONG - memory leak
useEffect(() => {
  onValue(ref(db, 'path'), (snapshot) => {
    setData(snapshot.val());
  });
}, []);

// ✅ CORRECT - cleanup
useEffect(() => {
  const unsubscribe = onValue(ref(db, 'path'), (snapshot) => {
    setData(snapshot.val());
  });

  return () => unsubscribe();  // Cleanup!
}, []);
```

## Push Notifications

### Notifiche Non Ricevute (iOS)

**Checks**:
1. **iOS Version**: Richiede iOS 16.4+ (Marzo 2023)
   ```
   Settings → General → About → iOS Version
   ```

2. **PWA Installation**: App DEVE essere installata come PWA
   ```
   Safari → Share → Add to Home Screen
   ```

3. **Permissions**: Verifica permessi notifiche
   ```
   Settings → Your App → Notifications → Allow Notifications
   ```

4. **FCM Token**: Verifica token salvato Firebase
   ```javascript
   // Firebase: users/{userId}/fcmTokens
   // Should have at least one token with platform: 'ios', isPWA: true
   ```

5. **Service Worker**: Verifica registration
   ```javascript
   // Browser console
   navigator.serviceWorker.getRegistrations().then(console.log);
   ```

### Notifiche Non Ricevute (Android/Desktop)

**Checks**:
1. **Browser Support**: Chrome, Firefox, Edge (Safari NO)

2. **HTTPS**: Richiede HTTPS in production (localhost OK HTTP)

3. **Permissions**: Check browser permissions
   ```javascript
   // Browser console
   console.log(Notification.permission);
   // Should be 'granted'
   ```

4. **FCM Token**: Verifica token
   ```javascript
   // Firebase: users/{userId}/fcmTokens
   ```

### Notifiche Duplicate

**Symptoms**: Stessa notifica ricevuta multiple volte.

**Root Causes**:
1. **Multiple FCM Tokens**: Stesso device registrato più volte
   ```javascript
   // Check Firebase: users/{userId}/fcmTokens
   // Should have unique tokens
   ```

2. **No Anti-Spam Flag**: Missing lastNotificationLevel
   ```javascript
   // For maintenance notifications
   // Check: maintenance/lastNotificationLevel is set
   ```

**Fix**: Delete duplicate tokens from Firebase.

## Cron Health

### Banner Sempre Visibile

**Symptoms**: "Scheduler Inattivo" sempre mostrato.

**Checks**:
1. **Cron Service**: Verifica cron running
   ```bash
   # Check cron status
   crontab -l
   # OR check external service (cron-job.org, etc.)
   ```

2. **CRON_SECRET**: Verifica env var corretta
   ```bash
   echo $CRON_SECRET
   # Must match URL secret parameter
   ```

3. **Firebase Timestamp**: Verifica lastCall salvato
   ```javascript
   // Firebase console: cronHealth/lastCall
   "2025-01-20T15:45:30.123Z"  // Should update every minute
   ```

4. **Client Time Sync**: Verifica system clock
   ```javascript
   // Browser console
   console.log(new Date().toISOString());
   // Compare with real time
   ```

### Banner Mai Visibile (Cron Fermo)

**Symptoms**: Banner non appare anche con cron inattivo.

**Checks**:
1. **Firebase Listener**: Verifica listener setup
   ```javascript
   // Check in CronHealthBanner.js
   // Should have onValue() listener
   ```

2. **Check Interval**: Verifica setInterval running
   ```javascript
   // Should check every 30s
   const interval = setInterval(checkHealth, 30000);
   ```

3. **Threshold**: Verifica soglia 5 minuti
   ```javascript
   const elapsed = (Date.now() - lastCallTime) / 60000;
   if (elapsed > 5) {  // 5 minutes threshold
     setIsInactive(true);
   }
   ```

## Testing

### Tests Failing: localStorage

**Error**: `localStorage is not defined`

**Solution**: Mock localStorage in test setup
```javascript
// jest.setup.js
global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
```

### Tests Failing: matchMedia

**Error**: `window.matchMedia is not a function`

**Solution**: Mock matchMedia
```javascript
// jest.setup.js
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
```

### Tests Failing: Date Mocking

**Error**: Tests con timestamp non deterministici.

**Solution**: Use jest.useFakeTimers()
```javascript
// ✅ CORRECT pattern
beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2025-01-20T15:00:00.000Z'));
});

afterEach(() => {
  jest.useRealTimers();
});

// ❌ AVOID: jest.spyOn(global, 'Date') - unstable
```

Vedi [Testing Documentation](../README-TESTING.md) per dettagli.

## Debug Tools

### React DevTools

Inspect component state/props:
```
Install: React Developer Tools (Chrome/Firefox extension)
Usage: F12 → Components tab
```

### Firebase Console

Monitor data real-time:
```
https://console.firebase.google.com
→ Realtime Database
→ Data tab
```

### Network Inspector

Debug API calls:
```
F12 → Network tab
Filter: Fetch/XHR
Check: Request/Response
```

### Console Logging

Quick debug pattern:
```javascript
console.log('[DEBUG] Variable:', variable);
console.table(arrayOfObjects);
console.error('[ERROR] Message:', error);
```

## See Also

- [Testing](../README-TESTING.md) - Testing troubleshooting
- [Setup Guides](./setup/) - External APIs troubleshooting
- [Systems](./systems/) - Systems-specific troubleshooting

---

**Last Updated**: 2025-10-21
