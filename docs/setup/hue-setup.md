# Philips Hue Setup Guide

Guida per configurare l'integrazione Philips Hue con l'architettura **proxy HomeAssistant**.

## Panoramica

L'integrazione Hue comunica esclusivamente tramite il proxy HomeAssistant in esecuzione sul Raspberry Pi (`192.168.178.50`). Il proxy gestisce la connettività al bridge Hue, il polling e la cache — l'app Next.js richiede solo due variabili d'ambiente: `HA_BASE_URL` e `HA_API_KEY`.

**Nessun pairing dal browser, nessun account developer Hue richiesto.**

---

## Prerequisiti

- Bridge Philips Hue collegato alla LAN locale
- Proxy HomeAssistant in esecuzione sul Raspberry Pi (`192.168.178.50`)
- Bridge già associato al proxy (`HUE_USERNAME` configurato in `.secrets.toml` sul Pi)

---

## Variabili d'ambiente

L'app Next.js non richiede variabili Hue specifiche. Le due variabili d'ambiente necessarie sono già configurate in `.env.local` per tutte le integrazioni proxy:

```bash
# .env.local
HA_BASE_URL=https://pdupun8zpr7exw43.myfritz.net
HA_API_KEY=your-api-key
```

Nessun'altra variabile Hue è necessaria nell'app Next.js.

---

## Provisioning del Bridge sul Pi (solo se il bridge è nuovo o ri-associato)

Se il bridge è già configurato e funzionante, salta questa sezione. Segui questi passi solo quando aggiungi un bridge nuovo o devi ripetere l'associazione.

### Step 1: Ottieni HUE_USERNAME tramite il pulsante link

Premi il pulsante fisico sul bridge Hue, poi entro 30 secondi esegui:

```bash
curl -X POST http://<BRIDGE_IP>/api \
  -H "Content-Type: application/json" \
  -d '{"devicetype": "homeassistant#pi5"}'
```

**Risposta (successo):**

```json
[{"success": {"username": "aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890abcd"}}]
```

**Risposta (pulsante non premuto o finestra di 30s scaduta):**

```json
[{"error": {"type": 101, "address": "", "description": "link button not pressed"}}]
```

Se vedi la risposta di errore, premi di nuovo il pulsante e riesegui immediatamente il comando.

### Step 2: Configura `.secrets.toml`

Aggiungi le credenziali al file secrets del Pi in `/home/pi/HomeAssistant/.secrets.toml`:

```toml
HUE_BRIDGE_HOST = "192.168.178.162"
HUE_USERNAME = "aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890abcd"
```

Sostituisci con l'IP effettivo del bridge e lo username ottenuto nel Step 1.

### Step 3: Riavvia il servizio

```bash
ssh pi@192.168.178.50
sudo systemctl restart homeassistant.service
```

### Step 4: Verifica la connettività

```bash
curl YOUR_BASE_URL/api/v1/hue/health \
  -H "X-API-Key: YOUR_API_KEY"
```

Risposta attesa quando funziona correttamente:

```json
{
  "connected": true,
  "data_freshness": "LIVE",
  ...
}
```

---

## Troubleshooting

### Bridge non trovato in rete

**Causa**: Bridge non raggiungibile sulla LAN.

**Soluzione**:
1. Verifica l'IP del bridge nell'app Hue: Settings > My Hue system > My Bridge > About
2. Conferma che il bridge sia nella stessa subnet LAN del Pi
3. Controlla che `HUE_BRIDGE_HOST` in `.secrets.toml` sia corretto

### Timeout del pulsante link

**Causa**: La finestra di associazione è esattamente 30 secondi dal momento in cui si preme il pulsante.

**Soluzione**:
1. Premi di nuovo il pulsante e riesegui il comando curl immediatamente — non aspettare
2. Il LED del bridge pulsa durante la finestra di associazione

### Username non valido o scaduto

**Causa**: Credenziali non aggiornate nel proxy.

**Soluzione**:
1. Ripeti il processo di provisioning — crea un nuovo username (i vecchi rimangono validi)
2. Aggiorna `.secrets.toml` con il nuovo username
3. Se `GET /api/v1/hue/health` ritorna 503, controlla i log: `sudo journalctl -u homeassistant.service -n 50`

---

**Ultimo aggiornamento**: 2026-03-21
**Architettura**: Proxy HomeAssistant (CLIP v1)
