# Notifiche push

Dal 2026-10-02 (ROADMAP **M48**) le push sono **Web Push standard (VAPID) inviate dal Raspberry Pi**: niente
Firebase Cloud Messaging, niente webhook Vercel. Contratto: [../../../docs/api/notifications.md](../../../docs/api/notifications.md).

## Flusso

```text
Pi (engine stufa, manutenzione, sensori Dirigera)
  └─ api/notifications/sender.py ──Web Push cifrato (aes128gcm, VAPID)──> push service del browser
                                                                         (FCM per Chrome/Android, Apple per iOS)
                                                                            └─> app/sw.ts `push` → showNotification
Browser ──/api/v1/notifications/** (route Next, sessione)──> Pi /api/v1/notifications/** (iscrizioni in SQLite)
```

| Pezzo | Dove |
|-------|------|
| Iscrizione, permesso, scelta per dispositivo | `lib/push/pushClient.ts` (`enablePush`, `disablePush`, `syncPush`) |
| Domanda al primo avvio | `app/components/NotificationOptInPrompt.tsx` (montato in `ClientProviders`) |
| Impostazioni (on/off, prova, dispositivi, cronologia) | `app/settings/notifications/page.tsx` |
| Service worker | `app/sw.ts`: `push`, `notificationclick`, `pushsubscriptionchange` |
| Route proxy | `app/api/v1/notifications/**` → `lib/push/notificationsProxy.ts` |
| Tipi | `types/notificationsProxy.ts` |

## Regole

- **Un solo service worker sullo scope `/`**: `/sw.js` di Serwist. Fino a M48 `PWAInitializer` registrava anche
  `/firebase-messaging-sw.js` sullo stesso scope: le due registrazioni si sostituivano a ogni caricamento e le push
  FCM non arrivavano mai. Non registrare altri worker su `/`; `pushClient` chiama `register('/sw.js')`, che
  sostituisce anche un vecchio worker rimasto sui telefoni.
- **L'iscrizione è del dispositivo, non della sessione**: logout o sessione scaduta non disiscrivono. Solo il toggle
  in impostazioni, "Rimuovi" o il browser (permesso revocato, 404/410 dal push service) la tolgono.
- **Scelta salvata per dispositivo** in `localStorage` (`push-notifications-choice` = `enabled`/`disabled`): la
  domanda del primo avvio compare solo se la chiave manca, il permesso non è `denied` e il dispositivo può ricevere.
- **Auto-riparazione**: a ogni avvio con sessione, se la scelta è `enabled` e il permesso c'è, `syncPush` rifà
  l'upsert dell'iscrizione sul Pi (stesso endpoint = stessa riga).
- **Rinnovo da sloggati**: su `pushsubscriptionchange` il worker chiama `POST /api/v1/notifications/subscriptions/rotate`,
  route pubblica (in `PUBLIC_PATHS` di `middleware.ts`); il Pi accetta solo un `old_endpoint` già registrato.
  Se il browser non passa la vecchia iscrizione, il worker usa l'endpoint salvato da `pushClient` nella cache
  `push-meta`.
- **iOS**: push solo dalla PWA installata nella schermata Home (iOS 16.4+); da Safari la pagina spiega come
  installarla.
- In sviluppo (`npm run dev`) Serwist è disattivato: niente `/sw.js`, niente push in locale.
