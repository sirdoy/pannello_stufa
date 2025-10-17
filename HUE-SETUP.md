# Philips Hue Setup Guide

Guida completa per configurare l'integrazione Philips Hue con OAuth 2.0.

## 📋 Prerequisiti

- Account Philips Hue esistente
- Bridge Hue connesso e configurato
- Luci Hue funzionanti nell'app ufficiale

## 1️⃣ Registrazione Applicazione Hue

### Step 1: Accedi al Portale Developer
1. Vai su [Philips Hue Developer Portal](https://developers.meethue.com/)
2. Clicca su **"Get Started"** o **"Sign In"**
3. Accedi con il tuo account Philips Hue

### Step 2: Crea una Nuova Applicazione
1. Clicca su **"My Apps"** nel menu
2. Clicca su **"Create New App"**
3. Compila il form:
   - **App Name**: `Pannello Stufa Smart Home`
   - **App Description**: `Home automation control panel`
   - **Callback URL**:
     - Development: `http://localhost:3000/api/hue/callback`
     - Production: `https://your-domain.com/api/hue/callback`
4. Clicca su **"Save"**

### Step 3: Ottieni le Credenziali
Dopo la creazione, vedrai:
- **App ID** (Client ID)
- **Client Secret**
- **Callback URL**

**⚠️ IMPORTANTE**: Salva il **Client Secret** subito, non sarà più visibile!

## 2️⃣ Configurazione Environment Variables

### Crea/Aggiorna `.env.local`

```bash
# Philips Hue OAuth 2.0 - Remote API
NEXT_PUBLIC_HUE_CLIENT_ID=your_app_id_here
NEXT_PUBLIC_HUE_REDIRECT_URI=http://localhost:3000/api/hue/callback

# Server-side only (NO NEXT_PUBLIC prefix)
HUE_CLIENT_ID=your_app_id_here
HUE_CLIENT_SECRET=your_client_secret_here
HUE_REDIRECT_URI=http://localhost:3000/api/hue/callback
```

### Variabili d'Ambiente Spiegate

| Variable | Scope | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_HUE_CLIENT_ID` | Client | App ID pubblico per OAuth flow |
| `NEXT_PUBLIC_HUE_REDIRECT_URI` | Client | URL callback dopo auth |
| `HUE_CLIENT_ID` | Server | App ID per token exchange |
| `HUE_CLIENT_SECRET` | Server | ⚠️ SECRET - Mai esporre al client |
| `HUE_REDIRECT_URI` | Server | Deve corrispondere a quello registrato |

### 🔒 Security Best Practices

✅ **DO**:
- Mantieni `HUE_CLIENT_SECRET` solo server-side (NO `NEXT_PUBLIC_`)
- Usa `.env.local` per development (git-ignored)
- Usa variabili d'ambiente su Vercel/hosting per production

❌ **DON'T**:
- ❌ Non committare `.env.local` su git
- ❌ Non aggiungere `NEXT_PUBLIC_` a `HUE_CLIENT_SECRET`
- ❌ Non condividere il Client Secret

## 3️⃣ Firebase Setup

### Schema Database Firebase
L'integrazione Hue salva i token in Firebase sotto il path `hue/`:

```
hue/
├── refresh_token          # OAuth refresh token (persistente)
├── username               # Hue username (opzionale)
├── connected              # boolean
├── connected_at           # ISO timestamp
└── updated_at             # ISO timestamp
```

### Regole di Sicurezza Firebase
Aggiungi queste regole al tuo Firebase Realtime Database:

```json
{
  "rules": {
    "hue": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

## 4️⃣ Production Deployment

### Aggiorna Callback URL su Hue Developer Portal

1. Vai su [Philips Hue Developer Portal](https://developers.meethue.com/)
2. Apri la tua app
3. Modifica **Callback URL** aggiungendo:
   ```
   https://your-production-domain.com/api/hue/callback
   ```
4. Salva le modifiche

### Configura Variabili su Vercel/Hosting

```bash
# Production environment
NEXT_PUBLIC_HUE_CLIENT_ID=your_app_id
NEXT_PUBLIC_HUE_REDIRECT_URI=https://your-domain.com/api/hue/callback
HUE_CLIENT_ID=your_app_id
HUE_CLIENT_SECRET=your_client_secret
HUE_REDIRECT_URI=https://your-domain.com/api/hue/callback
```

**⚠️ IMPORTANTE**:
- `REDIRECT_URI` deve usare **HTTPS** in production
- Deve corrispondere **esattamente** a quello configurato su Hue Developer Portal

## 5️⃣ Test della Connessione

### Development (localhost:3000)

1. Avvia il server:
   ```bash
   npm run dev
   ```

2. Vai su: `http://localhost:3000`

3. Nella card **"💡 Luci"**, clicca su **"Connetti Philips Hue"**

4. Verrai reindirizzato alla pagina di login Philips Hue

5. Autorizza l'applicazione

6. Dopo il redirect, dovresti vedere le tue stanze e luci

### Verifica Connessione Manuale

```bash
# Check status
curl http://localhost:3000/api/hue/status

# Expected response (connected):
{
  "connected": true,
  "username": "hue_user",
  "connected_at": "2024-01-01T12:00:00.000Z"
}

# Expected response (not connected):
{
  "connected": false
}
```

## 6️⃣ Troubleshooting

### Errore: "Invalid redirect_uri"
**Causa**: L'URL di callback non corrisponde a quello registrato.

**Soluzione**:
1. Verifica che `HUE_REDIRECT_URI` sia identico a quello su Hue Developer Portal
2. Controlla schema (http vs https) e porta (`:3000`)
3. Non dimenticare `/api/hue/callback` alla fine

### Errore: "Invalid client_id"
**Causa**: Client ID errato o non valido.

**Soluzione**:
1. Copia nuovamente l'App ID dal Hue Developer Portal
2. Verifica che sia impostato sia come `NEXT_PUBLIC_HUE_CLIENT_ID` che `HUE_CLIENT_ID`

### Errore: "Invalid client_secret"
**Causa**: Client Secret errato.

**Soluzione**:
1. Rigenerare il Client Secret sul Hue Developer Portal (⚠️ invalida quello vecchio!)
2. Aggiornare `HUE_CLIENT_SECRET` in `.env.local`
3. Riavviare il server

### Errore: "Token expired" / reconnect=true
**Causa**: Refresh token scaduto o invalidato.

**Soluzione**:
1. Disconnetti e riconnetti dall'app
2. Oppure elimina il nodo `hue/` da Firebase e riconnetti

### Luci non si caricano
**Causa**: Possibili problemi di rete o scope OAuth.

**Soluzione**:
1. Verifica che il Bridge Hue sia online
2. Verifica che lo scope OAuth includa `lights`
3. Controlla la console browser per errori API

## 7️⃣ API Endpoints Disponibili

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/hue/status` | GET | Connection status |
| `/api/hue/lights` | GET | Get all lights |
| `/api/hue/lights/[id]` | GET/PUT | Control single light |
| `/api/hue/rooms` | GET | Get all rooms/zones |
| `/api/hue/rooms/[id]` | GET/PUT | Control room lights |
| `/api/hue/scenes` | GET | Get all scenes |
| `/api/hue/scenes/[id]/activate` | PUT | Activate scene |
| `/api/hue/callback` | GET | OAuth callback |

## 8️⃣ Scopes OAuth

L'app richiede lo scope `lights` per:
- ✅ Leggere stato luci
- ✅ Controllare luci (on/off, brightness, color)
- ✅ Leggere stanze/zone
- ✅ Controllare luci per stanza
- ✅ Leggere e attivare scene

### Altri Scopes Disponibili (opzionali)
- `sensors` - Sensori di movimento, temperatura
- `groups` - Gruppi personalizzati
- `scenes` - Scene avanzate (già incluso in `lights`)

## 📚 Risorse Utili

- [Philips Hue Developer Portal](https://developers.meethue.com/)
- [Hue API v2 Documentation](https://developers.meethue.com/develop/hue-api-v2/)
- [OAuth 2.0 Flow Guide](https://developers.meethue.com/develop/hue-api-v2/getting-started/)
- [Remote API Reference](https://developers.meethue.com/develop/hue-api-v2/api-reference/)

## ✅ Checklist Configurazione

- [ ] Account Philips Hue Developer creato
- [ ] App registrata su Developer Portal
- [ ] Client ID e Client Secret salvati
- [ ] Callback URL configurato correttamente
- [ ] Variabili d'ambiente impostate in `.env.local`
- [ ] Server di sviluppo riavviato
- [ ] Connessione testata e funzionante
- [ ] Luci e stanze visualizzate correttamente
- [ ] (Production) Callback URL HTTPS configurato
- [ ] (Production) Variabili d'ambiente su hosting configurate

---

**Last Updated**: 2024-01-17
**Integration Version**: 1.0.0
**API Version**: Hue Remote API v2
