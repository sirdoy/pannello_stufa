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

## Authentication (login proprio)

### Link Menu → Homepage (Mobile)

**Sintomo**: Click su link redirect sempre a homepage invece della pagina richiesta.

**Causa**: Middleware non preserva URL destinazione.

**Fix**: `middleware.ts` imposta `returnTo` nel redirect a `/auth/login`; il form (`app/auth/login/page.tsx`)
naviga a `safeReturnTo(returnTo)` dopo il login.

### Redirect Loop (Mobile Production)

**Sintomo**: Login OK ma navigazione causa re-login continuo.

**Causa**: Cookie session non persiste (secret errata o cookie non impostato correttamente).

**Fix**: verificare `SESSION_SECRET` (>= 32 caratteri) configurato su Vercel; le opzioni cookie
(`httpOnly`, `sameSite: 'lax'`, `secure` in produzione) sono in `sessionCookieOptions()`
(`lib/auth/sessionCookie.ts`) e non sono configurabili via env.

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
