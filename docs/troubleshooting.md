# Troubleshooting

Soluzioni rapide per problemi comuni.

---

## Build & Runtime

| Error | Causa | Fix |
|-------|-------|-----|
| `Firebase not supported in Edge runtime` | Edge runtime incompatibile | `export const dynamic = 'force-dynamic';` (no edge) |
| `needs useState...Client Component` | Missing directive | `'use client';` come PRIMA riga |
| `undefined in Firebase write` | Firebase rifiuta undefined | Usa `filterUndefined(obj)` |

---

## Authentication (Auth0)

### Link Menu → Homepage (Mobile)

**Sintomo**: Click su link redirect sempre a homepage invece della pagina richiesta.

**Causa**: Middleware non preserva URL destinazione.

**Fix** (v1.10.1):
```javascript
// middleware.js - Auth0 v4 gestisce automaticamente
import { auth0 } from '@/lib/auth0';
export default auth0.middleware();
```

### Redirect Loop (Mobile Production)

**Sintomo**: Login OK ma navigazione causa re-login continuo.

**Causa**: Cookie session non persiste su mobile.

**Fix**:
```env
AUTH0_COOKIE_SAME_SITE=lax
AUTH0_SESSION_ROLLING=true
AUTH0_SESSION_ROLLING_DURATION=86400
```

**Verifica Auth0 Dashboard**: Callback URLs devono includere `/auth/callback` (v4 usa `/auth/*` non `/api/auth/*`).

---

## Version System

| Problema | Check | Fix |
|----------|-------|-----|
| ForceUpdateModal sempre visibile | `window.location.hostname` (dev?) | Modal disabilitata su localhost |
| Badge NEW non appare | `localStorage.getItem('lastSeenVersion')` | `localStorage.removeItem('lastSeenVersion')` |
| Versioni ordine sbagliato | Ordine Firebase (date) | Applica `sortVersions()` dopo fetch |

---

## Scheduler

### Non Esegue Azioni

**Checklist**:
1. Mode: `stoveScheduler/mode.enabled = true`, `semiManual = false`
2. Cron: CronHealthBanner nascosto = OK
3. Schedule: Intervalli validi in Firebase
4. API: Logs server

### Semi-Manual Non Si Disattiva

**Check**: `returnToAutoAt` deve essere timestamp futuro.

**Force clear**:
```javascript
// Firebase: stoveScheduler/mode
{ semiManual: false, returnToAutoAt: null }
```

---

## Maintenance

| Problema | Causa | Fix |
|----------|-------|-----|
| Ore non incrementano | Cron inattivo o status ≠ WORK | Verifica CronHealthBanner |
| Ore fantasma (stufa spenta) | `lastUpdatedAt` init errato | Reset `lastUpdatedAt = null` |
| Notifiche duplicate | `lastNotificationLevel` non settato | Verifica dopo ogni invio |

**Regola tracking**: Incrementa solo quando `status = 'WORK'` e `elapsed >= 30s`.

---

## Firebase

### Listener Memory Leaks

```javascript
// ❌ LEAK
useEffect(() => {
  onValue(ref(db, 'path'), (snap) => setData(snap.val()));
}, []);

// ✅ CORRECT
useEffect(() => {
  const unsub = onValue(ref(db, 'path'), (snap) => setData(snap.val()));
  return () => unsub();  // Cleanup!
}, []);
```

---

## Push Notifications

### iOS Non Riceve

| Check | Requisito |
|-------|-----------|
| iOS Version | 16.4+ |
| PWA | Deve essere installata (Safari → Add to Home Screen) |
| Permissions | Settings → App → Notifications → Allow |
| FCM Token | `users/{userId}/fcmTokens` con `platform: 'ios'` |

### Android/Desktop Non Riceve

| Check | Requisito |
|-------|-----------|
| Browser | Chrome, Firefox, Edge (NO Safari) |
| HTTPS | Richiesto (localhost OK con HTTP) |
| Permission | `Notification.permission === 'granted'` |

### Notifiche Duplicate

**Causa**: Token FCM duplicati o `lastNotificationLevel` mancante.

**Fix**: Elimina token duplicati da Firebase.

---

## PWA

### Shortcuts iOS Non Funzionano

**Checklist**:
1. Manifest: URL corretti, `type: "image/png"` nelle icons, max 4 shortcuts
2. Meta tags: `apple-mobile-web-app-capable`, `apple-mobile-web-app-title`
3. Reinstalla: Rimuovi PWA → Safari → Add to Home Screen

### Service Worker Cache

**Sintomo**: Pagine non si aggiornano, redirect cachati.

**Fix**: Navigation requests con `NetworkFirst`:
```javascript
// next.config.mjs - runtimeCaching
{
  urlPattern: ({ request }) => request.mode === 'navigate',
  handler: 'NetworkFirst',
  options: { cacheName: 'pages-cache', networkTimeoutSeconds: 10 }
}
```

**Force update SW**:
```javascript
navigator.serviceWorker.getRegistrations()
  .then(regs => regs.forEach(r => r.unregister()))
  .then(() => location.reload())
```

---

## Cron Health

| Problema | Check | Fix |
|----------|-------|-----|
| Banner sempre visibile | `cronHealth/lastCall` aggiornato? CRON_SECRET corretto? | Verifica cron service |
| Banner mai visibile (cron fermo) | Listener setup? Threshold 5 min? | Verifica `CronHealthBanner.js` |

---

## Testing

| Error | Fix |
|-------|-----|
| `localStorage is not defined` | Mock in `jest.setup.js` |
| `matchMedia is not a function` | Mock `window.matchMedia` |
| Timestamp non deterministici | `jest.useFakeTimers()` + `jest.setSystemTime()` |

---

## Debug Tools

| Tool | Uso |
|------|-----|
| React DevTools | F12 → Components (state/props) |
| Firebase Console | Realtime Database → Data |
| Network Inspector | F12 → Network → Fetch/XHR |

---

## See Also

- [Setup Guides](./setup/) - External APIs
- [Systems](./systems/) - Systems-specific issues
- [Testing](./testing.md) - Test troubleshooting

---

**Last Updated**: 2026-01-21
