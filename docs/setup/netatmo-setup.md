# Netatmo Setup Guide

## 🎯 Dual Credentials Setup (Development + Production)

### Why Two Netatmo Apps?

To enable seamless local development and production deployment, you need **TWO separate Netatmo OAuth applications**:
- **Development App**: Used on `localhost` (credentials with `_DEV` suffix)
- **Production App**: Used on production URL (base credentials)

This allows you to:
- Test locally without affecting production OAuth flow
- Have separate rate limits for dev/prod
- Maintain environment isolation

---

## 📝 Registering Netatmo Applications

### Step 1: Register Development App

1. Go to [Netatmo Dev Portal](https://dev.netatmo.com/apps/)
2. Click "**Create**"
3. Fill in application details:
   - **App Name**: `Pannello Stufa (Development)`
   - **Redirect URI**: `http://localhost:3001/api/netatmo/callback`
   - **Scopes**: Select `read_thermostat`, `write_thermostat`
4. **Save** and copy credentials:
   - **Client ID** → Save as `NEXT_PUBLIC_NETATMO_CLIENT_ID`
   - **Client Secret** → Save as `NETATMO_CLIENT_SECRET`

### Step 2: Register Production App

1. Go to [Netatmo Dev Portal](https://dev.netatmo.com/apps/)
2. Click "**Create**" (second app)
3. Fill in application details:
   - **App Name**: `Pannello Stufa`
   - **Redirect URI**: `https://your-app.vercel.app/api/netatmo/callback` (replace with actual domain)
   - **Scopes**: Select `read_thermostat`, `write_thermostat`
4. **Save** and copy credentials:
   - **Client ID** → Save as `NEXT_PUBLIC_NETATMO_CLIENT_ID`
   - **Client Secret** → Save as `NETATMO_CLIENT_SECRET`

---

## 🔧 Local Environment Setup (.env.local)

Create or update `.env.local` with **both** credential sets:

```bash
# ==========================================
# NETATMO DEVELOPMENT CREDENTIALS (localhost)
# ==========================================
NEXT_PUBLIC_NETATMO_CLIENT_ID=67ed0a6f059e1fb36100ad45
NETATMO_CLIENT_SECRET=bZHgsdv5Uoo74uzM5eK4dJ1WA6bpWipSH
NEXT_PUBLIC_NETATMO_REDIRECT_URI_DEV=http://localhost:3001/api/netatmo/callback

# ==========================================
# NETATMO PRODUCTION CREDENTIALS
# ==========================================
NEXT_PUBLIC_NETATMO_CLIENT_ID=your-prod-client-id
NETATMO_CLIENT_SECRET=your-prod-client-secret
NEXT_PUBLIC_NETATMO_REDIRECT_URI=https://your-app.vercel.app/api/netatmo/callback
```

**Important**: Both sets of credentials should be in `.env.local` for fallback support during local testing.

---

## ☁️ Vercel Environment Variables

Add **ONLY production credentials** (no `_DEV` suffix) to Vercel:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add the following variables:

```bash
NEXT_PUBLIC_NETATMO_CLIENT_ID=your-prod-client-id
NETATMO_CLIENT_SECRET=your-prod-client-secret
NEXT_PUBLIC_NETATMO_REDIRECT_URI=https://your-app.vercel.app/api/netatmo/callback
```

**Do NOT add** `_DEV` credentials to Vercel. They're localhost-only.

---

## ✅ Verification

### Test Localhost (Development Credentials)

1. Start dev server:
   ```bash
   npm run dev
   ```

2. Visit `http://localhost:3001/thermostat`

3. Click "**Connetti con Netatmo**"

4. **Check browser network tab**:
   - OAuth URL should use `client_id` from `_DEV` credentials
   - Redirect URI should be `http://localhost:3001/api/netatmo/callback`

5. Complete OAuth flow

6. **Check Firebase Console**:
   - Token saved to `dev/netatmo/refresh_token`

### Test Production

1. Deploy to Vercel:
   ```bash
   git push origin main
   ```

2. Visit production URL `/thermostat`

3. Click "**Connetti con Netatmo**"

4. **Check OAuth URL**:
   - Should use production `client_id` (no `_DEV` suffix)
   - Redirect URI should match production domain

5. Complete OAuth flow

6. **Check Firebase Console**:
   - Token saved to `netatmo/refresh_token` (no `dev/` prefix)

---

## 🐛 Troubleshooting

### Error: "Missing NETATMO_CLIENT_ID"

**Cause**: You're on localhost but development credentials are not configured.

**Solutions**:
1. Add `_DEV` credentials to `.env.local` (recommended)
2. System will fallback to production credentials (warning logged)

### Error: "Redirect URI mismatch"

**Cause**: Redirect URI in Netatmo app doesn't match environment.

**Check**:
- Localhost app has `http://localhost:3001/api/netatmo/callback`
- Production app has `https://your-actual-domain.vercel.app/api/netatmo/callback`
- No trailing slashes

### OAuth works on localhost but not production

**Cause**: Vercel missing production credentials or redirect URI mismatch.

**Fix**:
1. Verify Vercel has all 3 production variables (no `_DEV` suffix)
2. Check production app redirect URI matches deployment URL exactly
3. Redeploy after updating Vercel environment variables

### Warning: "Development credentials not found"

**Cause**: System falling back to production credentials on localhost.

**Action**: Not an error, but for proper dev/prod separation:
1. Create development app in Netatmo portal
2. Add `_DEV` credentials to `.env.local`

---

## 🔄 Re-authentication After Migration

If you updated from single to dual credentials:

1. **Clear old tokens**:
   - Visit `/thermostat`
   - Disconnect from Netatmo (if connected)

2. **Reconnect**:
   - Click "Connetti con Netatmo"
   - Complete OAuth flow with new credentials

3. **Verify**:
   - Check Firebase Console for new token path
   - Test temperature read/write

---

## Setup Completato

✅ Endpoint API creati
✅ Componenti UI implementati
✅ Gestione stati (connesso/non connesso)
✅ Dual credentials support (development + production)

## Flusso di Test

### 1. Accedi alla pagina Netatmo
```
http://localhost:3001/netatmo
```

**Comportamento atteso:**
- Se NON connesso → Mostra `NetatmoAuthCard` con pulsante "Connetti con Netatmo"
- Se connesso → Mostra dashboard con stanze

### 2. Click "Connetti con Netatmo"

**Cosa succede:**
1. Redirect a `https://api.netatmo.com/oauth2/authorize` con:
   - `client_id=67ed0a6f059e1fb36100ad45`
   - `redirect_uri=http://localhost:3001/api/netatmo/callback`
   - `scope=read_thermostat write_thermostat`

2. Netatmo chiede login e autorizzazione

3. Dopo autorizzazione, redirect a:
   ```
   http://localhost:3001/api/netatmo/callback?code=XXXX&state=random_state
   ```

### 3. Callback Processing

**File:** `app/api/netatmo/callback/route.js`

**Operazioni:**
1. Riceve `code` da URL
2. Scambia code per refresh_token via POST a Netatmo
3. Salva `refresh_token` in Firebase: `netatmo/refresh_token`
4. Redirect a `/netatmo/authorized`

### 4. Pagina Authorized

**File:** `app/netatmo/authorized/page.js`

**Operazioni:**
1. Mostra messaggio "✅ Connesso con successo!"
2. Wait 2.5s totali
3. Redirect a `/netatmo`

### 5. Dashboard Netatmo

**File:** `app/netatmo/page.js`

**Operazioni:**
1. Chiama `GET /api/netatmo/homesdata`
2. Se ha `refresh_token` → scarica topologia → salva in Firebase
3. Mostra stanze, temperature, controlli

---

## Debug: Errori Comuni

### ❌ "Nessun refresh token trovato"
**Causa:** Token non salvato in Firebase
**Soluzione:**
- Verifica callback ha salvato token
- Check Firebase console: `netatmo/refresh_token`

### ❌ "home_id non trovato"
**Causa:** Prima chiamata a homesdata non completata
**Soluzione:**
- Refresh pagina per richiamare homesdata
- Check Firebase console: `netatmo/home_id`

### ❌ "Invalid client"
**Causa:** CLIENT_ID o CLIENT_SECRET errati
**Soluzione:**
- Verifica `.env.local`
- Check Netatmo Developer console

### ❌ "Invalid redirect_uri"
**Causa:** redirect_uri non registrato su Netatmo
**Soluzione:**
- Vai a https://dev.netatmo.com/apps
- Aggiungi `http://localhost:3001/api/netatmo/callback` ai redirect_uri

---

## Check Manuale Firebase

```javascript
// Firebase Console → Realtime Database
netatmo/
  ├── refresh_token: "XXXXXXXXXX"  // ✅ Deve esistere dopo OAuth
  ├── home_id: "XXXXXXXXXX"        // ✅ Deve esistere dopo homesdata
  └── topology/                     // ✅ Deve esistere dopo homesdata
      ├── home_name: "Casa"
      ├── rooms: [...]
      └── modules: [...]
```

---

## Test Completo Passo-Passo

1. **Reset Firebase** (opzionale - per test da zero):
   ```
   Firebase Console → netatmo/ → Delete
   ```

2. **Apri browser**:
   ```
   http://localhost:3001/netatmo
   ```

3. **Aspettati**: Card "Connetti Netatmo"

4. **Click "Connetti con Netatmo"**

5. **Aspettati**: Redirect a Netatmo login

6. **Login su Netatmo** (se non già loggato)

7. **Autorizza app**

8. **Aspettati**:
   - Redirect a `/netatmo/authorized`
   - Messaggio "✅ Connesso con successo!"
   - Auto-redirect a `/netatmo` dopo 2.5s

9. **Aspettati** (su `/netatmo`):
   - Skeleton loader (breve)
   - Dashboard con stanze
   - Temperature real-time
   - Pulsanti controllo

---

## Variabili Ambiente Attuali

```env
NEXT_PUBLIC_NETATMO_CLIENT_ID=67ed0a6f059e1fb36100ad45
NEXT_PUBLIC_NETATMO_REDIRECT_URI=http://localhost:3001/api/netatmo/callback
NETATMO_CLIENT_ID=67ed0a6f059e1fb36100ad45
NETATMO_CLIENT_SECRET=bZHgsdv5Uoo74uzM5eK4dJ1WA6bpWipSH
NETATMO_REDIRECT_URI=http://localhost:3001/api/netatmo/callback
```

**IMPORTANTE**:
- Per production, cambia porta da 3001 a 3000 (o dominio reale)
- Aggiungi redirect_uri su Netatmo Developer console

---

## Features Avanzate

### Battery Status Display

L'API `/api/netatmo/homestatus` ora restituisce informazioni complete sulle batterie di tutti i dispositivi:

**Response Fields:**
```javascript
{
  rooms: [...],
  modules: [
    {
      id: "09:00:00:xx:xx:xx",
      name: "Valvola Soggiorno",
      type: "NRV",                    // NRV = valve, NATherm1 = thermostat
      reachable: true,
      battery_state: "full",          // "full", "high", "medium", "low", "very_low"
      battery_level: 3213,            // Raw voltage value
      rf_strength: 82,                // Radio signal strength
      room_id: "123456"
    }
  ],
  lowBatteryModules: [...],           // Modules with low/very_low battery
  hasLowBattery: false,               // Quick check flag
  hasCriticalBattery: false,          // Any very_low battery?
}
```

**UI Indicators:**
- Warning banner in ThermostatCard when `hasLowBattery` is true
- Error banner when `hasCriticalBattery` is true
- Battery info box showing count of low battery devices

### Daily Automatic Valve Calibration

Il cron job dello scheduler calibra automaticamente le valvole ogni **24 ore**:

**Firebase Path:** `netatmo/lastAutoCalibration` (timestamp)

**How it works:**
1. Il cron `/api/scheduler/check` controlla `lastAutoCalibration`
2. Se sono passate 24+ ore, chiama `/api/netatmo/calibrate`
3. La calibrazione forza le valvole a ri-calibrarsi
4. Timestamp aggiornato in Firebase

**Manual Calibration:**
```javascript
POST /api/netatmo/calibrate
// Requires Auth0 authentication
// Returns: { success: true }
```

### Stove-Valve Integration (Living Room Sync)

Quando la stufa si accende, la valvola del salotto viene impostata a 16C per evitare riscaldamento doppio.

**Firebase Schema:**
```javascript
netatmo/stoveSync: {
  enabled: boolean,           // Se attivo
  livingRoomId: "123456",     // Room ID della stanza "salotto"
  livingRoomName: "Salotto",  // Nome per display
  stoveTemperature: 16,       // Temperatura quando stufa ON
  stoveMode: boolean,         // True quando stufa ON
  originalSetpoint: 20.5,     // Setpoint salvato per restore
  lastSyncAt: timestamp,
  lastSyncAction: "stove_on" | "stove_off"
}
```

**API Endpoint:**
```javascript
// Get config and available rooms
GET /api/netatmo/stove-sync
// Returns: { config, availableRooms }

// Enable sync for a room
POST /api/netatmo/stove-sync
{ action: "enable", roomId: "123456", roomName: "Salotto", stoveTemperature: 16 }

// Disable sync
POST /api/netatmo/stove-sync
{ action: "disable" }

// Manual sync trigger
POST /api/netatmo/stove-sync
{ action: "sync", stoveIsOn: true }
```

**Automatic Integration:**
Il cron job `/api/scheduler/check` chiama automaticamente `syncLivingRoomWithStove()` quando:
- Stufa si accende (ignite) → Salotto a 16C
- Stufa si spegne (shutdown) → Salotto torna a schedule

**UI Indicator:**
Quando `stoveSync` e' attivo, la ThermostatCard mostra un badge "STUFA" sulla stanza del salotto.
