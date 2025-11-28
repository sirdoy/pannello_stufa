# Firebase Security Rules

Documentazione completa delle regole di sicurezza Firebase Realtime Database.

## 🏗️ Architettura Sicurezza

### Setup Corrente

- **Autenticazione**: Auth0 (NO Firebase Authentication)
- **Client SDK**: Read operations su dati pubblici + private (usato da lib services)
- **Admin SDK**: Write operations critiche (usato da API routes - bypassa security rules)
- **Security Rules**: Bloccano TUTTI i write client-side, permettono read pubblici
- **Pattern**: Client SDK per READ, Admin SDK inline nelle API routes per WRITE

### Perché NON Usiamo Firebase Authentication?

1. **Auth0 è già configurato** - Provider principale con utenti esistenti
2. **Separazione concerns** - Auth0 = identità, Firebase = database
3. **Admin SDK bypassa rules** - Perfetto per server-side operations
4. **Semplicità** - Un solo provider auth da gestire

## 📝 Regole di Sicurezza

### File: `database.rules.json`

```json
{
  "rules": {
    ".read": false,
    ".write": false,
    // ... vedi file completo
  }
}
```

### Principi Base

1. **Default Deny All**
   - `.read: false` e `.write: false` globale
   - Explicit allow solo dove necessario

2. **Public Read-Only Data**
   - Dati necessari per UI client-side
   - ZERO permessi di scrittura
   - Esempi: scheduler, maintenance, logs, errors

3. **Private Data Protection**
   - OAuth tokens (`netatmo/refresh_token`, `hue/refresh_token`)
   - User tokens (`users/{userId}/fcmTokens`)
   - User preferences (`notificationPreferences`, `devicePreferences`)
   - Accesso solo via Admin SDK (server-side)

4. **Admin SDK Bypass**
   - Firebase Admin SDK ignora completamente le rules
   - Operazioni sicure perché:
     - Girano su server (API routes)
     - Verificano Auth0 session
     - Validano input utente

## 🔒 Dati Pubblici (Client Read)

### cronHealth/lastCall
- **Scopo**: Monitoring salute cronjob
- **UI**: Banner warning se cron non attivo
- **Read**: ✅ (necessario per polling 30s)
- **Write**: ❌ (solo cron via Admin SDK)

### stoveScheduler/*
- **Scopo**: Visualizzazione pianificazione settimanale
- **UI**: Pagina `/stove/scheduler`, mode badge
- **Read**: ✅ (necessario per sync UI)
- **Write**: ❌ (solo API `/api/stove/*`)

### maintenance
- **Scopo**: Ore utilizzo stufa e soglia pulizia
- **UI**: Card manutenzione, blocco accensione
- **Read**: ✅ (necessario per UI)
- **Write**: ❌ (solo cron tracking via Admin SDK)

### log
- **Scopo**: Storico azioni utente
- **UI**: Pagina `/log` con filtri
- **Read**: ✅ (necessario per visualizzazione)
- **Write**: ❌ (solo API routes via Admin SDK)
- **Index**: `timestamp`, `device`, `source` (performance query)

### errors
- **Scopo**: Storico errori stufa
- **UI**: Pagina `/errors` con severità
- **Read**: ✅ (necessario per visualizzazione)
- **Write**: ❌ (solo error monitor via Admin SDK)
- **Index**: `timestamp`, `severity`, `resolved`

### changelog
- **Scopo**: Version history per update check
- **UI**: Modal version enforcement, `/changelog`
- **Read**: ✅ (necessario per version check)
- **Write**: ❌ (solo sync manuale via script)

### netatmo/currentStatus, topology, deviceConfig
- **Scopo**: Status termostato e rooms per UI
- **Read**: ✅ (necessario per ThermostatCard)
- **Write**: ❌ (solo API Netatmo via Admin SDK)

### hue/lights, groups
- **Scopo**: Status luci per UI
- **Read**: ✅ (necessario per LightsCard)
- **Write**: ❌ (solo API Hue via Admin SDK)

## 🔐 Dati Privati (Admin SDK Only)

### users/{userId}/fcmTokens
- **Contenuto**: Firebase Cloud Messaging tokens
- **Sensibilità**: ALTA - permetterebbe invio notifiche push non autorizzate
- **Accesso**: SOLO via `/api/notifications/*` (Admin SDK)
- **Client**: ❌ DENY (né read né write)

### users/{userId}/notificationPreferences
- **Contenuto**: Preferenze notifiche (errori, scheduler, maintenance)
- **Sensibilità**: MEDIA - dati privati utente
- **Accesso**: SOLO via `/api/notifications/preferences` (Admin SDK)
- **Client**: ❌ DENY

### devicePreferences/{userId}
- **Contenuto**: Dispositivi abilitati/disabilitati
- **Sensibilità**: MEDIA - preferenze private utente
- **Accesso**: SOLO via `/api/devices/preferences` (Admin SDK)
- **Client**: ❌ DENY

### netatmo/refresh_token
- **Contenuto**: OAuth 2.0 refresh token Netatmo
- **Sensibilità**: CRITICA - accesso completo account Netatmo
- **Accesso**: SOLO via API Netatmo routes (Admin SDK)
- **Client**: ❌ DENY

### netatmo/home_id, device_id
- **Contenuto**: Config privata account Netatmo
- **Sensibilità**: MEDIA - identifica installazione specifica
- **Accesso**: SOLO via API Netatmo routes
- **Client**: ❌ DENY

### hue/refresh_token
- **Contenuto**: OAuth 2.0 refresh token Philips Hue
- **Sensibilità**: CRITICA - accesso completo bridge Hue
- **Accesso**: SOLO via API Hue routes (Admin SDK)
- **Client**: ❌ DENY

### hue/username, bridge_ip, clientkey
- **Contenuto**: Credenziali Local API Hue
- **Sensibilità**: ALTA - controllo completo luci
- **Accesso**: SOLO via API Hue routes
- **Client**: ❌ DENY

### dev/*
- **Contenuto**: Namespace development (mirror production)
- **Scopo**: Testing locale senza impattare production
- **Accesso**: SOLO server-side (Admin SDK)
- **Client**: ❌ DENY (evita leak dati test)

## 🚀 Deploy Regole

### Via Firebase Console

1. [Firebase Console](https://console.firebase.google.com/)
2. **Realtime Database** → **Rules**
3. Copia contenuto `database.rules.json`
4. **Publish**

### Via Firebase CLI

```bash
# Install (se necessario)
npm install -g firebase-tools

# Login
firebase login

# Init project (prima volta)
firebase init database

# Deploy
firebase deploy --only database
```

### Verifica Deploy

Dopo deploy, testa nel **Rules Playground**:

```javascript
// ✅ DEVE PASSARE
Location: /cronHealth/lastCall
Type: read
Expected: ALLOW

// ❌ DEVE FALLIRE
Location: /users/auth0|123/fcmTokens
Type: read
Expected: DENY
```

## 🧪 Testing

### Manual Testing

1. **Console Playground**
   - Firebase Console → Realtime Database → Rules → Playground
   - Testa vari path e operazioni

2. **Browser DevTools**
   - Apri app in browser
   - Monitora Network tab per chiamate Firebase
   - Verifica che solo READ su path autorizzati

3. **Attempt Unauthorized Write**
   ```javascript
   // In browser console - DEVE FALLIRE
   import { ref, set } from 'firebase/database';
   import { db } from '@/lib/firebase';

   await set(ref(db, 'users/test/fcmTokens/abc'), { token: 'test' });
   // Expected: PERMISSION_DENIED error
   ```

### Automated Testing

```bash
# Firebase Emulator
firebase emulators:start

# Run tests against emulator
npm run test:security
```

### Security Checklist

- [ ] Deploy rules su Firebase Console/CLI
- [ ] Verificare nel Playground (5+ test cases)
- [ ] Testare read operations da browser (DevTools)
- [ ] Verificare write operations falliscono (client-side)
- [ ] Confermare Admin SDK funziona (API routes)
- [ ] Monitorare Firebase Usage per accessi anomali

## 🔍 Monitoring

### Firebase Console

**Realtime Database** → **Usage**:
- Monitorare read/write operations
- Alert su spike anomali
- Verificare source IP connections

### Application Logs

```javascript
// API routes - log failed auth attempts
console.error('🚨 Unauthorized access attempt:', {
  userId: session?.user?.sub || 'anonymous',
  path: request.url,
  timestamp: new Date().toISOString(),
});
```

## 🆘 Troubleshooting

### "Permission Denied" in Production

**Sintomo**: API routes falliscono con PERMISSION_DENIED

**Causa**: Admin SDK credentials non configurate

**Fix**:
```bash
# Verifica env vars
echo $FIREBASE_ADMIN_PROJECT_ID
echo $FIREBASE_ADMIN_CLIENT_EMAIL
# (NON stampare PRIVATE_KEY per sicurezza)

# In Vercel/hosting
# Dashboard → Settings → Environment Variables
# Aggiungi FIREBASE_ADMIN_* vars
```

### Client Non Può Leggere Dati Pubblici

**Sintomo**: CronHealthBanner non carica, scheduler UI vuota

**Causa**: Rules troppo restrittive o non deployed

**Fix**:
```bash
# Verifica rules deployed
firebase deploy --only database

# Test nel Playground
Location: /cronHealth/lastCall
Type: read
Expected: ALLOW ✅
```

### Admin SDK Non Bypassa Rules

**Sintomo**: API routes falliscono anche con credenziali corrette

**Causa**: Stai usando Client SDK invece di Admin SDK nelle API routes

**Fix**:
```javascript
// ❌ WRONG - usa Client SDK
import { ref, set } from 'firebase/database';
import { db } from '@/lib/firebase';

// ✅ CORRECT - usa Admin SDK
import { getDatabase } from 'firebase-admin/database';
const db = getDatabase();
const ref = db.ref('path');
await ref.set(data);
```

**NOTA**: Nel progetto corrente, alcune API routes usano Client SDK ma girano server-side (Node.js). Questo funziona perché le rules permettono quelle operazioni. Se cambi rules, considera migrare a Admin SDK.

## 📚 Best Practices

### 1. Principle of Least Privilege

Solo dati **strettamente necessari** per UI client-side sono pubblici.

```javascript
// ❌ BAD - espone troppo
"netatmo": {
  ".read": true  // Include refresh_token!
}

// ✅ GOOD - specific paths
"netatmo": {
  "currentStatus": { ".read": true },
  "topology": { ".read": true }
  // refresh_token rimane deny
}
```

### 2. Index per Performance

Aggiungi `.indexOn` per query filtrate:

```json
"log": {
  ".indexOn": ["timestamp", "device"],
  // Permette query efficienti come:
  // ref('log').orderByChild('device').equalTo('stove')
}
```

### 3. Validation Rules (Future)

Quando/se migri a Firebase Authentication:

```json
"users": {
  "$userId": {
    ".read": "auth != null && auth.uid === $userId",
    ".write": "auth != null && auth.uid === $userId"
  }
}
```

### 4. Regular Security Audits

- **Mensile**: Review Firebase Usage dashboard
- **Trimestrale**: Audit rules vs. actual app usage
- **Ad-hoc**: Dopo ogni major feature che tocca Firebase

### 5. Documenta Eccezioni

Ogni `.read: true` deve avere `.info` che spiega perché necessario.

```json
"cronHealth/lastCall": {
  ".read": true,
  ".info": "Public read necessario per CronHealthBanner polling 30s"
}
```

## 🔄 Evoluzione Futura

### Opzione 1: Migrare a Firebase Authentication

**Vantaggi**:
- Validation rules più granulari
- User-specific access nativo

**Svantaggi**:
- Duplica auth (Auth0 + Firebase)
- Richiede sync utenti
- Complessità aumentata

**Quando considerare**:
- App multi-tenant
- Necessità auth offline
- Migrazione da Auth0

### Opzione 2: Mantieni Admin SDK Pattern (RACCOMANDATO)

**Vantaggi**:
- Semplicità architetturale
- Un solo auth provider
- Massimo controllo server-side

**Svantaggi**:
- Tutte le operations via API routes
- Latenza leggermente superiore

**Best fit**:
- App single-tenant (uso personale)
- Strong control requirements
- Setup corrente ✅

## 📞 Riferimenti

- [Firebase Security Rules Docs](https://firebase.google.com/docs/database/security)
- [Admin SDK Docs](https://firebase.google.com/docs/admin/setup)
- [Auth0 Integration Patterns](https://auth0.com/docs/quickstart)
- Progetto: `/docs/firebase.md` - Schema database completo

---

**Last Updated**: 2025-11-28
**Security Rules Version**: 1.0.0
