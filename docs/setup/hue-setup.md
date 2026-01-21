# Philips Hue Setup Guide

Guida completa per configurare l'integrazione Philips Hue con **Local API (CLIP v2)** e **Remote API (Cloud)**.

## 🎯 Panoramica

Questa integrazione supporta **entrambe** le modalità di connessione:

### 🏠 Local API (Stesso Network)
- Comunicazione diretta con il bridge sulla rete locale
- Latenza minima, nessun rate limit
- **Richiede**: Stesso network Wi-Fi del bridge

### 🌐 Remote API (Ovunque)
- Comunicazione via cloud Philips Hue
- Funziona da qualsiasi luogo
- **Richiede**: OAuth 2.0 (Hue Developer Account)

### 🔄 Hybrid Mode (Automatico)
- **Default consigliato**: Configura entrambe le connessioni
- Usa Local API quando possibile (più veloce)
- Fallback automatico a Remote API quando sei fuori casa
- Zero configurazione manuale per lo switch

**💡 Nota**: Il sistema usa `HueConnectionStrategy` per selezionare automaticamente la modalità migliore.

---

## 📋 Prerequisiti

- Bridge Philips Hue connesso alla stessa rete Wi-Fi
- Luci Hue funzionanti nell'app ufficiale
- Accesso fisico al bridge (per premere il pulsante di pairing)

**Nessun account developer richiesto!**

---

## 1️⃣ Pairing con il Bridge

### Metodo 1: UI Automatica (Raccomandato)

1. Avvia l'app:
   ```bash
   npm run dev
   ```

2. Vai su `http://localhost:3000`

3. Nella card **"💡 Luci"**, clicca su **"Connetti Bridge Hue"**

4. L'app cercherà automaticamente i bridge sulla rete

5. **Premi il pulsante fisico sul bridge entro 30 secondi**
   - Il pulsante è rotondo, al centro del bridge
   - Premi una volta, si accenderà una luce

6. Attendi la conferma: "✅ Pairing completato!"

7. Le tue luci e stanze appariranno automaticamente

### Metodo 2: Manuale (API Diretta)

Se preferisci usare le API manualmente:

**Step 1: Discovery del bridge**
```bash
curl http://localhost:3000/api/hue/discover
```

Risposta:
```json
{
  "success": true,
  "bridges": [
    {
      "id": "001788fffe123456",
      "internalipaddress": "192.168.1.100"
    }
  ]
}
```

**Step 2: Pairing (premi il pulsante prima!)**
```bash
curl -X POST http://localhost:3000/api/hue/pair \
  -H "Content-Type: application/json" \
  -d '{
    "bridgeIp": "192.168.1.100",
    "bridgeId": "001788fffe123456"
  }'
```

Risposta (successo):
```json
{
  "success": true,
  "username": "generated-application-key"
}
```

Risposta (pulsante non premuto):
```json
{
  "error": "LINK_BUTTON_NOT_PRESSED",
  "message": "Premi il pulsante sul bridge entro 30 secondi"
}
```

---

## 2️⃣ Firebase Setup

### Schema Database Firebase

L'integrazione Hue salva le credenziali in Firebase sotto il path `hue/`:

```
hue/
├── bridge_ip              # IP locale del bridge (es. 192.168.1.100)
├── username               # Application key generata dal pairing
├── clientkey              # Client key (opzionale, per streaming)
├── bridge_id              # ID univoco del bridge
├── connected              # boolean
├── connected_at           # ISO timestamp
└── updated_at             # ISO timestamp
```

### Regole di Sicurezza Firebase

**IMPORTANTE**: Per la Local API, i dati sono più sensibili (contengono credenziali dirette).

```json
{
  "rules": {
    "hue": {
      ".read": false,    // Solo Admin SDK (server-side)
      ".write": false    // Solo Admin SDK (server-side)
    }
  }
}
```

**Perché `.read = false`?**
- Le credenziali Local API non devono essere esposte al client
- Le API routes server-side usano Firebase Admin SDK (bypass rules)
- Il client non ha bisogno di leggere direttamente da Firebase

---

## 3️⃣ Environment Variables

**Nessuna variabile d'ambiente richiesta!**

La Local API non necessita di OAuth credentials. Tutto viene salvato in Firebase dopo il pairing.

**Opzionale** (per sviluppo):
```bash
# .env.local (opzionale)
# Nessuna configurazione Hue necessaria per Local API
```

---

## 4️⃣ API Endpoints Disponibili

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/hue/status` | GET | Connection status |
| `/api/hue/discover` | GET | Discover bridges on network |
| `/api/hue/pair` | POST | Pair with bridge (button press) |
| `/api/hue/lights` | GET | Get all lights |
| `/api/hue/lights/[id]` | GET/PUT | Control single light |
| `/api/hue/rooms` | GET | Get all rooms/zones |
| `/api/hue/rooms/[id]` | GET/PUT | Control room lights |
| `/api/hue/scenes` | GET | Get all scenes |
| `/api/hue/scenes/[id]/activate` | PUT | Activate scene |
| `/api/hue/disconnect` | POST | Disconnect and clear data |

---

## 5️⃣ Controllo Luci - Esempi

### Accendi/Spegni Stanza

```bash
# Accendi
curl -X PUT http://localhost:3000/api/hue/rooms/ROOM_ID \
  -H "Content-Type: application/json" \
  -d '{"on": {"on": true}}'

# Spegni
curl -X PUT http://localhost:3000/api/hue/rooms/ROOM_ID \
  -H "Content-Type: application/json" \
  -d '{"on": {"on": false}}'
```

### Modifica Luminosità

```bash
curl -X PUT http://localhost:3000/api/hue/rooms/ROOM_ID \
  -H "Content-Type: application/json" \
  -d '{"dimming": {"brightness": 75}}'
```

Range: 1-100%

### Attiva Scena

```bash
curl -X PUT http://localhost:3000/api/hue/scenes/SCENE_ID/activate
```

---

## 6️⃣ Troubleshooting

### Errore: "Nessun bridge trovato"

**Causa**: Bridge non raggiungibile sulla rete.

**Soluzione**:
1. Verifica che il bridge sia acceso (luce blu)
2. Verifica che sia connesso alla stessa rete Wi-Fi
3. Prova a riavviare il bridge (stacca/riattacca alimentazione)
4. Controlla firewall del PC/router

### Errore: "LINK_BUTTON_NOT_PRESSED"

**Causa**: Pulsante bridge non premuto entro 30 secondi.

**Soluzione**:
1. Premi il pulsante fisico sul bridge
2. Riprova il pairing entro 30 secondi
3. Se continua a fallire, riavvia il bridge

### Errore: "Connection timeout"

**Causa**: Bridge IP cambiato o non raggiungibile.

**Soluzione**:
1. Verifica IP del bridge:
   ```bash
   curl https://discovery.meethue.com
   ```
2. Se l'IP è cambiato, disconnetti e riconnetti
3. Considera di assegnare IP statico al bridge nel router

### Luci non si caricano

**Causa**: Possibili problemi di rete o configurazione.

**Soluzione**:
1. Verifica status:
   ```bash
   curl http://localhost:3000/api/hue/status
   ```
2. Se `connected: false`, rieffettua il pairing
3. Controlla console browser per errori

### Errore: "Unauthorized" o certificato SSL

**Causa**: Il bridge usa certificato self-signed per HTTPS.

**Soluzione**:
- In Node.js, l'app usa già `rejectUnauthorized: false`
- Se usi curl manualmente, aggiungi `-k` flag

---

## 7️⃣ Production Deployment

### Limitazioni

⚠️ **IMPORTANTE**: La Local API funziona solo sulla stessa rete del bridge.

Per deployment in production hai 2 opzioni:

#### Opzione A: Solo Locale (Corrente)

**Pro**:
- Setup già completo
- Nessuna configurazione aggiuntiva

**Contro**:
- Non funziona da remoto

**Use case**: App usata solo a casa, stessa rete del bridge.

#### Opzione B: VPN verso Casa

**Setup**:
1. Configura VPN verso la tua rete domestica (es. WireGuard, Tailscale)
2. Connettiti alla VPN quando sei fuori casa
3. L'app funzionerà come se fossi a casa

#### Opzione C: Upgrade a Remote API (Futuro)

Vedi sezione [Future: Remote API Support](#future-remote-api-support).

---

## 8️⃣ Bridge IP Statico (Raccomandato)

Per evitare che l'IP del bridge cambi:

1. **Trova MAC address del bridge**:
   - App Philips Hue → Settings → Bridge → MAC Address

2. **Configura DHCP Reservation nel router**:
   - Accedi al router (es. 192.168.1.1)
   - Cerca "DHCP Reservation" o "Static IP"
   - Assegna IP fisso al MAC del bridge (es. 192.168.1.100)

3. **Riavvia bridge** (opzionale)

Ora il bridge avrà sempre lo stesso IP.

---

## 9️⃣ Remote API Setup (Implementato)

**Architettura Strategy Pattern**

Il sistema usa **Strategy Pattern** per gestire automaticamente Local e Remote API:

```
HueConnectionStrategy
├── HueApi (Local)         → https://{bridge_ip}/clip/v2/*
└── HueRemoteApi (Remote)  → https://api.meethue.com/bridge/*
```

### Come Funziona

1. **Verifica Local**: Controlla se il bridge è raggiungibile sulla rete locale
2. **Fallback Remote**: Se non raggiungibile, usa la Remote API (cloud)
3. **Automatic Switch**: Nessuna configurazione manuale necessaria

### Setup Remote API (OAuth 2.0)

#### Step 1: Registra App su Hue Developer Portal

1. Vai su [Philips Hue Developer Portal](https://developers.meethue.com/)
2. Crea account developer (gratuito)
3. Crea nuova app:
   - **App Name**: `Pannello Stufa` (o nome a piacere)
   - **Callback URL**: `https://your-domain.com/api/hue/remote/callback`
   - Per development: `http://localhost:3000/api/hue/remote/callback`

4. Ottieni **Client ID** e **Client Secret**

#### Step 2: Configura Environment Variables

```bash
# .env.local
NEXT_PUBLIC_HUE_CLIENT_ID=your-client-id
HUE_CLIENT_SECRET=your-client-secret
```

#### Step 3: Autorizza l'App

1. Nell'app, vai alla sezione Hue
2. Clicca "Connetti Remoto" (apparirà dopo aver configurato le env vars)
3. Sarai reindirizzato al login Philips Hue
4. Autorizza l'app
5. Verrai riportato all'app con la connessione attiva

### API Endpoints Remote

| Endpoint | Descrizione |
|----------|-------------|
| `GET /api/hue/remote/authorize` | Inizia OAuth flow |
| `GET /api/hue/remote/callback` | Callback OAuth |
| `POST /api/hue/remote/disconnect` | Disconnetti Remote API |

### Connection Modes

Il sistema traccia la modalità di connessione in Firebase:

- `local`: Solo Local API configurata
- `remote`: Solo Remote API configurata
- `hybrid`: Entrambe configurate, Local preferita con fallback Remote automatico

---

## ✅ Checklist Setup

### Prima Configurazione

- [ ] Bridge Hue acceso e connesso alla rete
- [ ] Accesso fisico al bridge disponibile
- [ ] App in esecuzione (`npm run dev`)
- [ ] Pairing completato con successo
- [ ] Luci e stanze visualizzate nell'app

### Opzionale (Performance)

- [ ] IP statico assegnato al bridge nel router
- [ ] Firebase Rules configurate (`.read/.write = false`)

### Production (Se Applicabile)

- [ ] VPN configurata per accesso remoto
- [ ] Backup configurazione Firebase
- [ ] Monitoring bridge status attivo

---

## 📚 Risorse Utili

- [Philips Hue Local API (CLIP v2) Docs](https://developers.meethue.com/develop/hue-api-v2/)
- [Bridge Discovery Service](https://discovery.meethue.com)
- [Hue API GitHub Examples](https://github.com/PhilipsHue)

---

## 🔧 Architettura Tecnica

### Strategy Pattern Flow

```
Client (LightsCard)
    ↓
API Route (/api/hue/*)
    ↓
HueConnectionStrategy.getProvider()
    ↓
┌─────────────────────────────────────┐
│ 1. Check local bridge reachability  │
│    (2s timeout HTTPS request)       │
└─────────────────────────────────────┘
    ↓                    ↓
 Reachable           Not Reachable
    ↓                    ↓
HueApi (Local)    HueRemoteApi (Cloud)
    ↓                    ↓
https://{bridge_ip}   https://api.meethue.com
    ↓                    ↓
Hue Bridge          Philips Cloud → Bridge
```

### Pairing Flow

```
1. GET /api/hue/discover
     ↓ (Philips Discovery Service)
   Bridge IP + ID

2. User presses button on bridge (30s window)

3. POST /api/hue/pair
     ↓ POST https://{bridge_ip}/api
   Username + Clientkey generated
     ↓
   Saved to Firebase (hueLocalHelper)

4. Future requests use saved credentials
```

### Security Model

- **Credentials storage**: Firebase (Admin SDK only)
- **Client exposure**: Zero (client never sees bridge credentials)
- **HTTPS**: Bridge uses self-signed cert (bypassed server-side)
- **Auth**: Auth0 protects all API routes
- **Network**: Bridge must be on same LAN

---

**Last Updated**: 2026-01-21
**Integration Version**: 1.72.0 (Hue Local + Remote API)
**API Version**: Local API v2 (CLIP v2) + Remote API v1 (Cloud)
**Architecture**: Strategy Pattern with automatic Local/Remote fallback
