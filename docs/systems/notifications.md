# 🔔 Guida Setup Notifiche Push

Sistema completo di notifiche push per Pannello Stufa, con supporto iOS (iPhone/iPad) tramite PWA.

## 📋 Panoramica

Il sistema invia notifiche push per:
- **Errori stufa** - Quando si verifica un errore (warning/error/critical)
- **Scheduler** - Quando lo scheduler esegue azioni automatiche (accensione/spegnimento)
- **Manutenzione** - Promemoria a 80%, 90%, 100% ore utilizzo

## 🚀 Setup Iniziale

### 1. Configurare Firebase Cloud Messaging

#### 1.1 Generare VAPID Key

1. Vai su [Firebase Console](https://console.firebase.google.com/)
2. Seleziona il tuo progetto
3. Vai su **Project Settings** (⚙️ in alto a sinistra)
4. Tab **Cloud Messaging**
5. Sezione **Web Push certificates**
6. Clicca **Generate key pair**
7. Copia la chiave generata

#### 1.2 Ottenere Firebase Admin SDK Credentials

1. Sempre in **Project Settings**
2. Tab **Service Accounts**
3. Clicca **Generate new private key**
4. Scarica il file JSON
5. Estrai i seguenti valori:
   - `project_id`
   - `client_email`
   - `private_key`

### 2. Configurare Environment Variables

Aggiorna il tuo `.env.local` con:

```env
# Firebase Cloud Messaging (Push Notifications)
NEXT_PUBLIC_FIREBASE_VAPID_KEY=BNxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Firebase Admin SDK (Server-side push notifications)
FIREBASE_ADMIN_PROJECT_ID=your-project-id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"

# Admin User ID for scheduler/maintenance notifications
# Ottieni da Auth0: user.sub (es: auth0|xxx)
# Per trovarlo: login → DevTools → Application → IndexedDB → @@auth0spajs@@::xxx → body.decodedToken.user.sub
ADMIN_USER_ID=auth0|your-user-id
```

**⚠️ IMPORTANTE**:
- `FIREBASE_ADMIN_PRIVATE_KEY` deve mantenere i caratteri `\n` per i line breaks
- Usa virgolette doppie `"` per wrappare la chiave

### 3. Configurare Service Worker

Il file `public/firebase-messaging-sw.js` contiene placeholder che devono essere sostituiti con i tuoi valori Firebase.

**Metodo Manuale:**

Apri `public/firebase-messaging-sw.js` e sostituisci:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",                    // Da .env: NEXT_PUBLIC_FIREBASE_API_KEY
  authDomain: "YOUR_AUTH_DOMAIN",            // Da .env: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  projectId: "YOUR_PROJECT_ID",              // Da .env: NEXT_PUBLIC_FIREBASE_PROJECT_ID
  storageBucket: "YOUR_STORAGE_BUCKET",      // Da .env: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",  // Da .env: NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  appId: "YOUR_APP_ID",                      // Da .env: NEXT_PUBLIC_FIREBASE_APP_ID
};
```

**Metodo Automatico (opzionale):**

Crea uno script `scripts/update-sw-config.js`:

```javascript
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const swPath = './public/firebase-messaging-sw.js';
let swContent = fs.readFileSync(swPath, 'utf8');

swContent = swContent
  .replace('YOUR_API_KEY', process.env.NEXT_PUBLIC_FIREBASE_API_KEY)
  .replace('YOUR_AUTH_DOMAIN', process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN)
  .replace('YOUR_PROJECT_ID', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID)
  .replace('YOUR_STORAGE_BUCKET', process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET)
  .replace('YOUR_MESSAGING_SENDER_ID', process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID)
  .replace('YOUR_APP_ID', process.env.NEXT_PUBLIC_FIREBASE_APP_ID);

fs.writeFileSync(swPath, swContent);
console.log('✅ Service worker config updated');
```

Aggiungi a `package.json`:

```json
{
  "scripts": {
    "update-sw": "node scripts/update-sw-config.js",
    "prebuild": "npm run update-sw"
  }
}
```

### 4. Build & Deploy

```bash
npm run build
npm run start
```

## 📱 Configurazione iOS (iPhone/iPad)

### Requisiti iOS

- **iOS 16.4 o superiore** (rilasciato Marzo 2023)
- **Safari browser** (necessario per installazione PWA)
- **App installata come PWA** (Add to Home Screen)
- **Connessione HTTPS** (in production)

### Installazione PWA su iOS

1. **Apri l'app in Safari** (non Chrome/Firefox!)
   - Vai su `https://tuodominio.com`

2. **Tocca il pulsante Condividi** (quadrato con freccia in alto)
   - Si trova nella barra inferiore di Safari

3. **Scorri in basso e tocca "Aggiungi a Home"**
   - Conferma il nome dell'app
   - Tocca "Aggiungi"

4. **Apri l'app dalla schermata Home**
   - L'icona apparirà sulla Home Screen
   - Aprila toccando l'icona (NON da Safari)

5. **Abilita notifiche nell'app**
   - Vai su ⚙️ → Notifiche
   - Tocca "Attiva Notifiche"
   - Conferma permesso quando richiesto

### ⚠️ Troubleshooting iOS

**Problema**: "Devi aggiungere l'app alla schermata Home"
- ✅ Assicurati di aver seguito tutti i passaggi sopra
- ✅ Apri l'app dall'icona Home Screen, non da Safari

**Problema**: "Notifiche non supportate"
- ✅ Verifica iOS version: Settings → General → About
- ✅ Deve essere iOS 16.4+

**Problema**: Permesso notifiche negato
- ✅ Settings → Notifications → Nome App → Consenti notifiche
- ✅ Se non vedi l'app, reinstallala (rimuovi da Home → aggiungi nuovamente)

**Problema**: Notifiche non arrivano
- ✅ Verifica connessione internet
- ✅ Verifica che l'app sia installata come PWA
- ✅ Controlla Firebase Console → Cloud Messaging per errori

## ⚙️ Gestione Preferenze Notifiche

### Panoramica

Sistema di personalizzazione notifiche con toggle switches organizzati per categoria.
Le preferenze sono salvate su Firebase per utente e applicate automaticamente.

### Accesso Pannello

1. Login all'app
2. Vai su `/settings/notifications`
3. Sezione "⚙️ Gestione Notifiche" (visibile solo se notifiche attive)

### Categorie Preferenze

#### 1. Errori Stufa 🚨

**Master Toggle**: Abilita/disabilita tutte le notifiche errori

**Sotto-opzioni** (se abilitato):
- **ℹ️ INFO** - Notifiche informative (default: OFF)
- **⚠️ WARNING** - Avvisi che richiedono attenzione (default: ON)
- **❌ ERROR** - Errori funzionamento (default: ON)
- **🚨 CRITICAL** - Errori critici immediati (default: ON)

**Esempio**: Disattivare WARNING per ridurre rumore, mantenere solo ERROR e CRITICAL.

#### 2. Scheduler Automatico ⏰

**Master Toggle**: Abilita/disabilita tutte le notifiche scheduler

**Sotto-opzioni** (se abilitato):
- **🔥 Accensione automatica** - Notifica quando scheduler accende stufa (default: ON)
- **🌙 Spegnimento automatico** - Notifica quando scheduler spegne stufa (default: ON)

**Esempio**: Disattivare accensione per ricevere solo notifica spegnimento.

#### 3. Manutenzione 🔧

**Master Toggle**: Abilita/disabilita tutte le notifiche manutenzione

**Sotto-opzioni** (se abilitato):
- **ℹ️ Promemoria 80%** - Notifica al raggiungimento 80% ore (default: ON)
- **⚠️ Attenzione 90%** - Notifica al raggiungimento 90% ore (default: ON)
- **🚨 Urgente 100%** - Notifica critica manutenzione richiesta (default: ON)

**Esempio**: Disattivare 80% per ricevere solo promemoria critici (90%, 100%).

#### 4. Termostato Netatmo 🌡️

**Master Toggle**: Abilita/disabilita tutte le notifiche Netatmo (default: OFF)

**Sotto-opzioni** (se abilitato):
- **❄️ Temperatura bassa** - Notifica quando temperatura scende (default: OFF)
- **🔥 Temperatura alta** - Notifica quando temperatura sale (default: OFF)
- **✅ Temperatura raggiunta** - Notifica quando target raggiunto (default: OFF)
- **📡 Connessione persa** - Notifica quando termostato non risponde (default: ON)

#### 5. Philips Hue 💡

**Master Toggle**: Abilita/disabilita tutte le notifiche Hue (default: OFF)

**Sotto-opzioni** (se abilitato):
- **🎨 Scena attivata** - Notifica quando una scena viene attivata (default: OFF)
- **📡 Connessione persa** - Notifica quando bridge non risponde (default: ON)

#### 6. Sistema ⚙️

**Master Toggle**: Abilita/disabilita notifiche di sistema (default: ON)

**Sotto-opzioni** (se abilitato):
- **🆕 Aggiornamenti** - Notifica nuove versioni disponibili (default: ON)
- **🔄 Sincronizzazione offline** - Notifica comandi offline eseguiti (default: ON)

### Salvataggio Preferenze

- **Automatico**: Ogni toggle viene salvato immediatamente su Firebase
- **Feedback**: Banner verde "✅ Salvato!" conferma aggiornamento
- **Persistenza**: Preferenze mantengono tra sessioni e dispositivi

### Ripristino Defaults

Pulsante "↻ Ripristina Predefinite" in fondo al pannello:
- Conferma richiesta prima del reset
- Ripristina tutte le preferenze ai valori default
- Salvataggio automatico

### Schema Firebase

```
users/{userId}/notificationPreferences/
  errors/
    enabled: true
    severityLevels/
      info: false
      warning: true
      error: true
      critical: true
  scheduler/
    enabled: true
    ignition: true
    shutdown: true
  maintenance/
    enabled: true
    threshold80: true
    threshold90: true
    threshold100: true
  netatmo/
    enabled: false
    temperatureLow: false
    temperatureHigh: false
    setpointReached: false
    connectionLost: true
  hue/
    enabled: false
    sceneActivated: false
    connectionLost: true
  system/
    enabled: true
    updates: true
    offlineSync: true
```

### API Functions

**Service**: `lib/notificationPreferencesService.js`

```javascript
// Get preferences
const prefs = await getUserPreferences(userId);

// Update section
await updatePreferenceSection(userId, 'errors', {
  enabled: true,
  severityLevels: { critical: true, error: false }
});

// Check if should send
const shouldSend = await shouldSendErrorNotification(userId, 'critical');
if (shouldSend) {
  // Send notification
}
```

### Comportamento Fail-Safe

Se si verifica un errore durante il check delle preferenze:
- **Notifiche vengono inviate comunque** (safety-first)
- Log warning in console
- Garantisce che notifiche critiche non vengano mai perse

### Best Practices

1. **Inizia con defaults**: Usa le preferenze predefinite per una settimana
2. **Monitora rumore**: Se troppe notifiche, disattiva INFO e WARNING
3. **Priorita critico**: Mantieni sempre CRITICAL e threshold100 attivi
4. **Test after changes**: Usa "Invia Test" dopo modifiche preferenze

## 🎯 Sistema Trigger Notifiche

Sistema centralizzato per triggerare notifiche da qualsiasi parte dell'app.
Verifica automaticamente le preferenze utente prima dell'invio.

### File

- `lib/notificationTriggers.js` - Definizioni tipi e client-side trigger
- `lib/notificationTriggersServer.js` - Server-side trigger per API routes
- `app/api/notifications/trigger/route.js` - API endpoint

### Utilizzo Client-Side

```javascript
import {
  triggerNotification,
  triggerStoveError,
  triggerNetatmoAlert,
  triggerGenericNotification
} from '@/lib/notificationTriggers';

// Trigger specifico per tipo
await triggerStoveError('critical', {
  errorCode: 'E01',
  description: 'Errore critico',
});

// Trigger Netatmo
await triggerNetatmoAlert('temperature_low', {
  temperature: 15,
  room: 'Soggiorno',
});

// Trigger generico (bypassa preferenze)
await triggerGenericNotification('Titolo', 'Messaggio', {
  url: '/custom-page',
});
```

### Utilizzo Server-Side (API Routes)

```javascript
import {
  triggerNotificationServer,
  triggerStoveErrorServer,
  triggerSchedulerActionServer,
  triggerNotificationToAdmin,
} from '@/lib/notificationTriggersServer';

// In una API route
export const POST = async (request) => {
  // ... logica

  // Trigger notifica con verifica preferenze
  await triggerStoveErrorServer(userId, 'critical', {
    errorCode: 'E01',
    description: 'Surriscaldamento',
  });

  // Trigger a admin
  await triggerNotificationToAdmin('maintenance_100', {
    message: 'Manutenzione urgente richiesta',
  });
};
```

### Tipi di Notifica Disponibili

| ID | Categoria | Descrizione |
|----|-----------|-------------|
| `stove_error_info` | errors | Errore informativo |
| `stove_error_warning` | errors | Avviso stufa |
| `stove_error_error` | errors | Errore stufa |
| `stove_error_critical` | errors | Errore critico |
| `scheduler_ignition` | scheduler | Accensione automatica |
| `scheduler_shutdown` | scheduler | Spegnimento automatico |
| `maintenance_80` | maintenance | Promemoria 80% |
| `maintenance_90` | maintenance | Attenzione 90% |
| `maintenance_100` | maintenance | Urgente 100% |
| `netatmo_temperature_low` | netatmo | Temperatura bassa |
| `netatmo_temperature_high` | netatmo | Temperatura alta |
| `netatmo_setpoint_reached` | netatmo | Target raggiunto |
| `netatmo_connection_lost` | netatmo | Connessione persa |
| `hue_scene_activated` | hue | Scena attivata |
| `hue_connection_lost` | hue | Bridge disconnesso |
| `system_update` | system | Aggiornamento disponibile |
| `system_offline_commands_synced` | system | Comandi sincronizzati |
| `generic` | generic | Notifica generica |

### API Endpoint

**POST `/api/notifications/trigger`**

```json
{
  "typeId": "stove_error_critical",
  "data": {
    "errorCode": "E01",
    "description": "Errore critico"
  }
}
```

**Response (inviata)**:
```json
{
  "success": true,
  "sent": true,
  "typeId": "stove_error_critical",
  "sentTo": 2,
  "failed": 0
}
```

**Response (skippata per preferenze)**:
```json
{
  "success": true,
  "sent": false,
  "reason": "Category 'errors' disabled",
  "message": "Notifica non inviata (preferenze utente)"
}
```

### Aggiungere Nuovi Tipi

1. Aggiungi definizione in `lib/notificationTriggers.js` → `NOTIFICATION_TYPES`
2. Aggiungi configurazione UI in `lib/notificationPreferencesService.js` → `NOTIFICATION_CATEGORIES_CONFIG`
3. Aggiorna `DEFAULT_PREFERENCES` con i nuovi defaults
4. Aggiorna sezione valida in `updatePreferenceSection()`

## 🧪 Testing

### Test Notifica Manuale

1. Login all'app
2. Vai su `/settings/notifications`
3. Attiva notifiche (se non già fatto)
4. Clicca "Invia Test"
5. Dovresti ricevere una notifica di test

### Test Eventi Automatici

**Test Errore Stufa:**
1. Simula un errore nella stufa
2. Dovresti ricevere notifica immediata

**Test Scheduler:**
1. Configura uno scheduler che si attiva tra 1-2 minuti
2. Attendi l'esecuzione automatica
3. Dovresti ricevere notifica accensione/spegnimento

**Test Manutenzione:**
1. Vai su `/stove/maintenance`
2. Imposta target hours molto basso (es. 1h)
3. Attendi che raggiunga 80%
4. Dovresti ricevere notifica promemoria

### Verifica Firebase Console

1. Vai su [Firebase Console](https://console.firebase.google.com/)
2. Seleziona progetto
3. **Cloud Messaging** → Guarda metriche invii
4. **Realtime Database** → Verifica nodo `users/{userId}/fcmTokens`

## 🔧 API Routes

### POST `/api/notifications/test`

Invia notifica di test all'utente corrente.

**Auth**: Richiede login (session cookie)

**Response**:
```json
{
  "success": true,
  "sentTo": 2,
  "failed": 0
}
```

### POST `/api/notifications/send`

Invia notifica generica (uso interno/admin).

**Auth**: Richiede `ADMIN_SECRET` in header `x-admin-secret` o body

**Body**:
```json
{
  "userId": "auth0|xxx",
  "notification": {
    "title": "Titolo",
    "body": "Messaggio",
    "icon": "/icons/icon-192.png",
    "priority": "high|normal",
    "data": {
      "type": "custom",
      "url": "/custom-page"
    }
  }
}
```

**Example cURL**:
```bash
curl -X POST https://tuodominio.com/api/notifications/send \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: your-admin-secret" \
  -d '{
    "userId": "auth0|xxx",
    "notification": {
      "title": "Test",
      "body": "Messaggio test"
    }
  }'
```

## 📊 Schema Firebase

```
users/
  {userId}/
    fcmTokens/
      {token}/
        token: "fcm-token-string"
        createdAt: "2025-01-15T10:30:00.000Z"
        lastUsed: "2025-01-15T10:30:00.000Z"
        userAgent: "Mozilla/5.0..."
        platform: "ios|other"
        isPWA: true|false

maintenance/
  lastNotificationLevel: 80|90|100  # Ultimo threshold notificato
  currentHours: 45.2
  targetHours: 50
  needsCleaning: false
```

## 🔐 Sicurezza

- **VAPID Key**: Public, safe da esporre client-side
- **Firebase Admin SDK**: PRIVATE, solo server-side
- **ADMIN_SECRET**: PRIVATE, per proteggere `/api/notifications/send`
- **ADMIN_USER_ID**: Chi riceve notifiche scheduler/manutenzione

**⚠️ Non committare mai**:
- `.env.local`
- File JSON credentials Firebase Admin
- Chiavi private in generale

## 🐛 Debug

### Enable verbose logging

Client-side (`notificationService.js`):
```javascript
console.log('FCM token:', token);
```

Server-side (`firebaseAdmin.js`):
```javascript
console.log('Sending notification:', notification);
```

### Check Service Worker

1. Open DevTools
2. Application → Service Workers
3. Verifica che `firebase-messaging-sw.js` sia registrato
4. Clicca "Update" per force reload

### Check FCM Token

```javascript
// Browser console
const { getFCMToken } = await import('./lib/notificationService');
const token = await getFCMToken('your-user-id');
console.log('Token:', token);
```

## 📚 Risorse

- [Firebase Cloud Messaging Docs](https://firebase.google.com/docs/cloud-messaging)
- [Web Push Notifications MDN](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [iOS PWA Guide](https://developer.apple.com/documentation/webkit/delivering_notifications_in_safari)
- [next-pwa Documentation](https://github.com/shadowwalker/next-pwa)

## 🆘 Support

Per problemi o domande:
1. Verifica i log browser console
2. Verifica Firebase Console → Cloud Messaging
3. Controlla .env.local configurazione
4. Verifica che HTTPS sia attivo (production)
5. Controlla versione iOS (16.4+)

---

**Last Updated**: 2026-01-21
**Version**: 1.70.0+ (con sistema trigger notifiche centralizzato)
