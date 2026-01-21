# Fritz!Box Setup Guide

> **STATUS**: 🔮 Future Implementation - Documentazione preparatoria

## Overview

Integrazione del router **AVM Fritz!Box** per monitoraggio rete domestica. A differenza di Netatmo (OAuth cloud), Fritz!Box usa **autenticazione locale** via TR-064 protocol.

---

## API Disponibili

| API | Accesso | FRITZ!OS | Uso |
|-----|---------|----------|-----|
| **TR-064** | ⚠️ Solo LAN | 6.0+ | Config router, stato rete, dispositivi |
| **Smart Home REST API** | Solo LAN | 8.20+ | Dispositivi DECT (termostati, prese) |
| **AHA HTTP Interface** | Solo LAN | 6.0+ | Legacy smart home |

### TR-064 Protocol

Protocollo basato su UPnP sviluppato dal Broadband Forum. Permette di:

- **WAN Management**: Stato connessione, IP esterno, velocità up/down
- **Home Network**: Dispositivi connessi, WiFi, DHCP, Wake-on-LAN
- **Telephony**: Chiamate, VoIP, segreteria, rubrica
- **Storage**: NAS integrato, SMB/FTP/WebDAV
- **System**: Configurazione, utenti, firmware

**Limitazione critica**: Funziona **SOLO dalla rete locale**.

### Smart Home REST API (FRITZ!OS 8.20+)

API moderna con specifica OpenAPI per dispositivi smart home:
- FRITZ!DECT 200/210 (prese intelligenti)
- FRITZ!DECT 300/301 (termostati)
- FRITZ!DECT 440 (interruttori)
- FRITZ!DECT 500 (lampadine)
- Comet DECT

---

## Dati Monitorabili

### Connessione Internet
```javascript
{
  connectionStatus: "Connected",
  externalIPAddress: "93.42.xxx.xxx",
  uptime: 1234567,              // secondi
  downloadRate: 234567890,       // bytes totali
  uploadRate: 12345678,
  currentDownloadSpeed: 45.2,    // Mbps
  currentUploadSpeed: 8.1
}
```

### Dispositivi di Rete
```javascript
{
  devices: [
    {
      name: "iPhone di Federico",
      macAddress: "AA:BB:CC:DD:EE:FF",
      ipAddress: "192.168.178.45",
      interfaceType: "802.11",   // WiFi
      active: true,
      leaseTimeRemaining: 3600
    }
  ],
  totalDevices: 15,
  activeDevices: 8
}
```

### WiFi Status
```javascript
{
  ssid: "FRITZ!Box 7590",
  channel: 36,
  standard: "ac",               // ax per WiFi 6
  guests: {
    enabled: true,
    ssid: "FRITZ!Box Gastzugang",
    activeClients: 2
  }
}
```

### DSL/Fibra Diagnostics
```javascript
{
  lineType: "VDSL",
  syncDownstream: 100000,       // kbps
  syncUpstream: 40000,
  snrDownstream: 12.5,          // dB
  snrUpstream: 13.2,
  attenuationDown: 18.0,        // dB
  crcErrors: 0
}
```

### Smart Home (se presente FRITZ!DECT)
```javascript
{
  devices: [
    {
      ain: "116570123456",       // Actor Identification Number
      name: "Presa Salotto",
      type: "FRITZ!DECT 200",
      present: true,
      state: "on",
      power: 45.2,              // Watt attuali
      energy: 12345,            // Wh totali
      temperature: 22.5
    }
  ]
}
```

---

## Problema: Accesso Remoto

Le API Fritz!Box funzionano **esclusivamente dalla rete locale**. Per l'accesso remoto esistono 3 strategie:

### Opzione 1: VPN Fritz!Box (Consigliata)

Il Fritz!Box supporta VPN integrata (WireGuard dal FRITZ!OS 7.50+, IPSec legacy).

**Pro:**
- Sicuro, crittografato
- Accesso completo alle API come in locale
- Nessun server aggiuntivo

**Contro:**
- Richiede configurazione VPN su ogni dispositivo
- Non ideale per PWA (l'utente deve attivare VPN manualmente)

**Setup:**
1. Fritz!Box → Internet → Permit Access → VPN
2. Crea connessione WireGuard
3. Importa configurazione su dispositivo

### Opzione 2: Proxy Locale con Firebase Bridge (Raccomandata per PWA)

Un dispositivo nella rete locale (Raspberry Pi, NAS, server) interroga il Fritz!Box e salva i dati su Firebase.

```
┌─────────────┐     TR-064      ┌─────────────┐
│  Fritz!Box  │ ◄────────────── │ Local Proxy │
└─────────────┘                 └──────┬──────┘
                                       │
                                       │ HTTPS
                                       ▼
                                ┌─────────────┐
                                │   Firebase  │
                                └──────┬──────┘
                                       │
                                       │ Real-time
                                       ▼
                                ┌─────────────┐
                                │   PWA App   │
                                └─────────────┘
```

**Pro:**
- Funziona ovunque senza VPN
- Pattern già usato per Thermorossi
- Real-time via Firebase

**Contro:**
- Richiede dispositivo sempre acceso in rete
- Setup iniziale più complesso

**Implementazione suggerita:**
- Script Node.js su Raspberry Pi
- Polling ogni 30-60 secondi
- Salvataggio su Firebase path `fritzbox/`

### Opzione 3: MyFRITZ! (Limitata)

Servizio cloud AVM per accesso remoto alla web UI.

**Pro:**
- Setup semplice
- Nessun hardware aggiuntivo

**Contro:**
- **NON espone le API TR-064**
- Solo accesso web UI (no integrazione app)
- Non utilizzabile per questa integrazione

---

## Librerie Node.js

### fritzbox-api (Raccomandata)

```bash
npm install fritzbox-api
```

```javascript
import { FritzBox } from 'fritzbox-api';

const fritzbox = new FritzBox({
  host: '192.168.178.1',        // o fritz.box
  user: 'admin',
  password: 'your-password'
});

// Login (ottiene Session ID)
await fritzbox.login();

// Esempio: lista dispositivi
const devices = await fritzbox.getDeviceList();
```

**Features:**
- Supporta FRITZ!OS 7.24+ (PBKDF2 auth)
- Retrocompatibile MD5 per OS precedenti
- Accesso a data.lua per qualsiasi pagina WebUI

### fritzapi (Per Smart Home)

```bash
npm install fritzapi
```

```javascript
import Fritz from 'fritzapi';

const fritz = new Fritz('user', 'password', 'fritz.box');

// Session ID
const sid = await fritz.getSessionID();

// Lista dispositivi smart home
const devices = await fritz.getDeviceListInfos();

// Controllo presa
await fritz.setSwitchOn('116570123456');  // AIN
const power = await fritz.getSwitchPower('116570123456');
```

**Features:**
- Ottimizzato per FRITZ!DECT
- Controllo prese, termostati, lampadine
- Monitoraggio consumi energia

### fritzbox.js (Alternativa)

```bash
npm install fritzbox.js
```

```javascript
import Fritzbox from 'fritzbox.js';

const box = new Fritzbox({
  host: 'fritz.box',
  password: 'your-password',
  username: 'admin'
});

const status = await box.getInternetConnectionStatus();
```

---

## Schema Firebase Proposto

```javascript
fritzbox/
├── connection/
│   ├── status: "Connected"
│   ├── externalIP: "93.42.xxx.xxx"
│   ├── uptime: 1234567
│   ├── downloadTotal: 234567890
│   ├── uploadTotal: 12345678
│   └── lastUpdate: 1705847000000
│
├── network/
│   ├── totalDevices: 15
│   ├── activeDevices: 8
│   └── devices/
│       ├── AA:BB:CC:DD:EE:FF/
│       │   ├── name: "iPhone di Federico"
│       │   ├── ip: "192.168.178.45"
│       │   ├── type: "wifi"
│       │   └── active: true
│       └── ...
│
├── wifi/
│   ├── ssid: "FRITZ!Box 7590"
│   ├── channel: 36
│   ├── standard: "ax"
│   └── guestEnabled: true
│
├── dsl/
│   ├── syncDown: 100000
│   ├── syncUp: 40000
│   ├── snrDown: 12.5
│   ├── snrUp: 13.2
│   └── crcErrors: 0
│
├── smarthome/                   // Se presente FRITZ!DECT
│   └── devices/
│       └── 116570123456/
│           ├── name: "Presa Salotto"
│           ├── state: "on"
│           ├── power: 45.2
│           └── energy: 12345
│
└── config/
    ├── host: "192.168.178.1"
    ├── pollingInterval: 30000   // ms
    └── lastPoll: 1705847000000
```

---

## Configurazione Fritz!Box

### Abilitare TR-064

1. Accedi a `http://fritz.box`
2. Vai a **Home Network → Network → Network Settings**
3. Scorri fino a **Access Settings in the Home Network**
4. Abilita:
   - ✅ **Allow access for applications**
   - ✅ **Transmit status information over UPnP**

### Creare Utente Dedicato (Consigliato)

1. Vai a **System → FRITZ!Box Users → Users**
2. Click **Add User**
3. Configura:
   - Username: `pannello-stufa`
   - Password: (generata sicura)
   - Permissions: ✅ **FRITZ!Box Settings** (minimo richiesto)
4. Salva credenziali per `.env.local`

---

## Environment Variables

```env
# Fritz!Box Configuration
FRITZBOX_HOST=192.168.178.1
FRITZBOX_USER=pannello-stufa
FRITZBOX_PASSWORD=your-secure-password

# Polling (for local proxy)
FRITZBOX_POLLING_INTERVAL=30000
```

---

## Implementazione Proposta

### Fase 1: Solo Locale

Integrazione base per monitoraggio quando l'utente è connesso alla stessa rete.

**Files da creare:**
```
lib/fritzbox/
├── client.js           # Client TR-064
├── api.js              # Wrapper API
└── types.js            # TypeScript types

app/api/fritzbox/
├── status/route.js     # GET stato connessione
├── devices/route.js    # GET dispositivi rete
└── wifi/route.js       # GET stato WiFi

components/fritzbox/
├── FritzBoxCard.jsx    # Card principale
├── NetworkDevices.jsx  # Lista dispositivi
└── ConnectionStatus.jsx # Stato connessione
```

**Limitazione**: Funziona solo da rete locale.

### Fase 2: Firebase Bridge (Accesso Remoto)

Script esterno su Raspberry Pi che fa polling e salva su Firebase.

**Files aggiuntivi:**
```
scripts/fritzbox-bridge/
├── index.js            # Entry point
├── poller.js           # Polling logic
└── firebase.js         # Firebase write
```

**Esecuzione:**
```bash
# Su Raspberry Pi
node scripts/fritzbox-bridge/index.js
# Oppure come servizio systemd
```

### Fase 3: Smart Home (Opzionale)

Se l'utente ha dispositivi FRITZ!DECT.

**Files aggiuntivi:**
```
app/api/fritzbox/
├── smarthome/route.js      # GET dispositivi
├── smarthome/[ain]/route.js # POST controllo
```

---

## UI Components

### FritzBoxCard (Dashboard)

```jsx
// Pattern: Self-contained card come altri dispositivi
<FritzBoxCard
  connectionStatus={status}
  activeDevices={8}
  totalDevices={15}
  downloadSpeed={45.2}
  uploadSpeed={8.1}
  isLocal={true}  // Indica se accesso locale o via Firebase
/>
```

### Indicatori Visivi

| Stato | Colore | Icona |
|-------|--------|-------|
| Connected | `text-emerald-400` | `<Wifi />` |
| Disconnected | `text-red-400` | `<WifiOff />` |
| Degraded | `text-amber-400` | `<AlertTriangle />` |
| Local Only | `text-blue-400` | Badge "LAN" |
| Via Firebase | `text-purple-400` | Badge "CLOUD" |

---

## Considerazioni di Sicurezza

### Credenziali

- **MAI** esporre password Fritz!Box al client
- Credenziali SOLO in variabili ambiente server-side
- Usare utente dedicato con permessi minimi

### Accesso Locale vs Remoto

- API route deve verificare se richiesta è dalla LAN
- Se remoto senza Firebase bridge → errore graceful
- Considerare rate limiting per prevenire abuse

### Firebase Security Rules

```javascript
{
  "rules": {
    "fritzbox": {
      ".read": true,           // Client può leggere
      ".write": false          // Solo Admin SDK (bridge)
    }
  }
}
```

---

## Troubleshooting

### Errore: "Connection refused"

**Causa:** TR-064 non abilitato o firewall blocca.

**Soluzione:**
1. Verifica impostazioni Fritz!Box (vedi sopra)
2. Testa da browser: `http://fritz.box:49000/tr64desc.xml`

### Errore: "Authentication failed"

**Causa:** Credenziali errate o utente senza permessi.

**Soluzione:**
1. Verifica username/password
2. Controlla permessi utente in Fritz!Box

### Errore: "Network unreachable" (da remoto)

**Causa:** Tentativo accesso TR-064 da fuori LAN.

**Soluzione:**
1. Implementare Firebase bridge (Opzione 2)
2. O usare VPN per connettersi alla rete

### Polling lento o timeout

**Causa:** Fritz!Box sovraccarico o rete lenta.

**Soluzione:**
1. Aumentare timeout: `FRITZBOX_TIMEOUT=10000`
2. Ridurre frequenza polling: `FRITZBOX_POLLING_INTERVAL=60000`

---

## Risorse Esterne

- [AVM Interfaces Documentation](https://fritz.com/en/pages/interfaces)
- [fritzbox-api (npm)](https://github.com/aoephtua/fritzbox-api)
- [fritzapi - Smart Home](https://github.com/andig/fritzapi)
- [FritzBox.js](https://fritzbox.js.org/)
- [Home Assistant Fritz!Box Integration](https://www.home-assistant.io/integrations/fritz/)
- [TR-064 Protocol Specification](https://avm.de/service/schnittstellen/)

---

## Checklist Implementazione

### Pre-requisiti
- [ ] Fritz!Box con FRITZ!OS 7.24+ (per PBKDF2)
- [ ] TR-064 abilitato nelle impostazioni
- [ ] Utente dedicato creato
- [ ] (Opzionale) Raspberry Pi per bridge remoto

### Fase 1: Locale
- [ ] Installare `fritzbox-api`
- [ ] Creare client wrapper (`lib/fritzbox/client.js`)
- [ ] API route `/api/fritzbox/status`
- [ ] Componente `FritzBoxCard`
- [ ] Aggiungere a device registry
- [ ] Test da rete locale

### Fase 2: Remoto
- [ ] Script bridge per Raspberry Pi
- [ ] Firebase schema setup
- [ ] Security rules Firebase
- [ ] Cron/polling automatico
- [ ] Fallback UI se dati stale

### Fase 3: Smart Home (Opzionale)
- [ ] Installare `fritzapi`
- [ ] API routes smart home
- [ ] Componenti FRITZ!DECT
- [ ] Integrazione con esistente Netatmo

---

**Documento creato:** 2026-01-21
**Ultimo aggiornamento:** 2026-01-21
**Status:** 🔮 Pianificazione futura
