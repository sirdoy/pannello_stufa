# Pannello Stufa - Sistema Notifiche Push

## What This Is

Sistema completo e affidabile di notifiche push per la PWA "Pannello Stufa" (smart home control: stufa Thermorossi, termostato Netatmo, luci Philips Hue). Risolve il problema critico della persistenza dei dispositivi registrati dopo chiusura del browser e implementa gestione robusta dei token FCM con monitoring, preferenze utente e testing avanzato.

## Core Value

I dispositivi vengono riconosciuti automaticamente dopo il riavvio del browser e le notifiche arrivano sempre (100% delivery rate per dispositivi registrati).

## Requirements

### Validated

Capacità già implementate nel sistema esistente:

- ✓ Firebase Cloud Messaging (FCM) integrato per push notifications — existing
- ✓ Token storage in Firebase Realtime Database (`users/[userId]/fcmTokens`) — existing
- ✓ Supporto multi-platform (Android, iOS, Web) — existing
- ✓ Notifiche per eventi scheduler e alert errori — existing
- ✓ API send notification (`sendPushNotification()`, `sendNotificationToUser()`) — existing
- ✓ Supporto multi-device per utente — existing

### Active

#### Fase 1: Reliability (Sistema affidabile)

- [ ] **TOKEN-01**: Token FCM persiste automaticamente dopo chiusura browser
- [ ] **TOKEN-02**: Sistema verifica validità token all'avvio app e lo rigenera se necessario
- [ ] **TOKEN-03**: Token invalidati vengono automaticamente rimossi dal database
- [ ] **TOKEN-04**: Cleanup automatico token più vecchi di 90 giorni
- [ ] **TOKEN-05**: Retry automatico su errori FCM transitori (max 3 tentativi con backoff)

- [ ] **UI-01**: Feedback visivo durante registrazione dispositivo (loading, success, error)
- [ ] **UI-02**: Messaggio chiaro quando permessi notifiche negati
- [ ] **UI-03**: Indicatore stato registrazione dispositivo visibile in settings
- [ ] **UI-04**: Possibilità di ri-registrare dispositivo manualmente

- [ ] **MONITOR-01**: Dashboard stato notifiche con dispositivi attivi in real-time
- [ ] **MONITOR-02**: Log errori FCM con timestamp, tipo errore e dispositivo coinvolto
- [ ] **MONITOR-03**: Metriche delivery rate (notifiche inviate vs consegnate)
- [ ] **MONITOR-04**: Alert automatico quando delivery rate < 90%

- [ ] **ERROR-01**: Gestione permessi negati con istruzioni per abilitarli
- [ ] **ERROR-02**: Fallback graceful quando FCM non disponibile
- [ ] **ERROR-03**: Queue offline per notifiche programmate (invio quando online)

#### Fase 2: Features (Nuove funzionalità)

- [ ] **PREF-01**: Utente può disabilitare/abilitare notifiche globalmente
- [ ] **PREF-02**: Utente può scegliere tipologie notifiche da ricevere (scheduler, errori, manutenzione)
- [ ] **PREF-03**: Preferenze sincronizzate tra tutti i dispositivi dell'utente
- [ ] **PREF-04**: Preferenze notifiche per orario (silenzia notifiche di notte)

- [ ] **TEST-01**: Pannello admin per inviare notifica di test
- [ ] **TEST-02**: Selezione dispositivo target per test (singolo dispositivo o tutti)
- [ ] **TEST-03**: Template notifiche predefiniti per testing rapido
- [ ] **TEST-04**: Verifica immediata consegna con feedback visivo

- [ ] **HIST-01**: Cronologia notifiche inviate (ultimi 30 giorni)
- [ ] **HIST-02**: Stato consegna per ogni notifica (sent, delivered, failed)
- [ ] **HIST-03**: Filtri cronologia per tipo, dispositivo, stato
- [ ] **HIST-04**: Export cronologia in CSV per analisi

### Out of Scope

- Notifiche email — Solo push notifications, no email
- Notifiche SMS — Costo elevato, non core value
- Notifiche programmate dall'utente — Scheduler già gestisce timing automatico
- Ricche media notifications (immagini/video) — Complessità non giustificata per v1
- Notifiche con azioni interattive — Possibile future enhancement
- Supporto altri provider (OneSignal, Pusher) — Firebase FCM sufficient e già integrato

## Context

**Codebase esistente:**
- Next.js 15.5 PWA con App Router
- Firebase Realtime Database per storage
- Auth0 per autenticazione
- Service Worker (Serwist) per offline capability
- Multi-device smart home control (stufa, termostato, luci, camera)

**Problema principale identificato:**
Dopo chiusura completa del browser, il dispositivo non viene più riconosciuto come registrato anche se il token è salvato in Firebase. L'app non mostra prompt di registrazione ma le notifiche non arrivano. Problema colpisce tutti i dispositivi/browser.

**Debito tecnico noto:**
- `cleanupOldTokens()` in `lib/notificationService.js` disabilitato (linee 480-483)
- Token FCM accumulano in Firebase senza cleanup (> 90 giorni)
- Nessun monitoring per delivery rate o errori FCM
- Gestione errori minimale nel flusso di registrazione

**Architettura esistente:**
- Token storage: `users/[userId]/fcmTokens` in Firebase Realtime Database
- Admin SDK: `lib/firebaseAdmin.js` per invio notifiche
- Client SDK: Firebase 12.8.0 per registrazione token
- VAPID key configurato per web push
- Multi-platform: Android (priority, sound, vibration), iOS (APNS alert, badge), Web (icon, badge, vibration)

## Constraints

- **Platform**: PWA deve funzionare su iOS e Android (Safari, Chrome, Firefox)
- **Provider**: Mantenere Firebase FCM (no switch provider)
- **Breaking changes**: Accettabili — utenti possono re-registrare dispositivi
- **Backwards compatibility**: Non richiesta per token format
- **Tech stack**: Next.js 15.5, Firebase 12.8.0, React 19.2.0
- **Node runtime**: Firebase Admin SDK richiede Node.js runtime (no Edge)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Sviluppo a fasi (Reliability → Features) | Fix problema critico prima, poi features — ship incrementale | — Pending |
| Breaking changes OK | Permette refactoring completo senza vincoli legacy | — Pending |
| Firebase FCM retained | Già integrato, multi-platform support, affidabile | — Pending |
| Auto-cleanup token 90+ giorni | Previene crescita unbounded, migliora delivery rate | — Pending |

---
*Last updated: 2026-01-23 after initialization*
