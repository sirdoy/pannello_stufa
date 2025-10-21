# Test Flusso Connessione Netatmo

## Setup Completato

✅ Endpoint API creati
✅ Componenti UI implementati
✅ Gestione stati (connesso/non connesso)
✅ Variabili ambiente configurate

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
