# Specifica Tecnica: Scheduler Stufa Thermorossi

**Documento per il team HA Proxy** | Data: 2026-03-25

## Obiettivo

Migrare il sistema di schedulazione della stufa da Firebase Realtime Database a Home Assistant. Questo documento descrive il funzionamento completo dell'attuale sistema per permettere la replica lato HA.

---

## 1. Panoramica del Sistema

Lo scheduler gestisce l'accensione e lo spegnimento automatico della stufa Thermorossi basandosi su intervalli orari settimanali. Il sistema supporta:

- **3 modalita operative**: Manuale, Automatico, Semi-Manuale
- **Multi-schedule**: Piu programmazioni salvate, una sola attiva alla volta
- **PID automation**: Regolazione automatica della potenza basata sulla temperatura ambiente (feedback loop con Netatmo)
- **Safety checks**: Blocco accensione se manutenzione richiesta, doppia verifica stato prima di inviare comandi
- **Notifiche**: Push notification per ogni azione automatica, spegnimento imprevisto, allarmi

### Flusso Operativo

```
GitHub Actions (cron ogni 5 min)
    |
    v
GET /api/scheduler/check?secret=xxx
    |
    v
1. Leggi modalita scheduler da Firebase (schedules-v2/mode)
2. Se MANUALE -> skip tutto
3. Se SEMI-MANUALE e non scaduto -> skip
4. Se SEMI-MANUALE scaduto -> torna in automatico
5. Calcola giorno/ora corrente (timezone Europe/Rome)
6. Leggi intervalli attivi da Firebase
7. Trova intervallo corrente (match su ora)
8. Leggi stato stufa da Thermorossi proxy
9. Esegui azione (accendi/spegni/regola livelli)
10. Esegui PID automation (se abilitato)
11. Task collaterali (manutenzione, Netatmo, weather, token cleanup)
```

---

## 2. Struttura Dati (attualmente Firebase RTDB)

### 2.1 Albero Completo

```
schedules-v2/
├── activeScheduleId: string          # ID della programmazione attiva
├── mode/                             # Stato operativo dello scheduler
│   ├── enabled: boolean              # true = automatico, false = manuale
│   ├── semiManual: boolean           # true = override temporaneo manuale
│   ├── semiManualActivatedAt: string # ISO 8601 timestamp attivazione
│   ├── returnToAutoAt: string        # ISO 8601 timestamp ritorno automatico
│   └── lastUpdated: string           # ISO 8601 ultimo aggiornamento
└── schedules/                        # Contenitore multi-schedule
    └── {scheduleId}/                 # Es: "inverno-1709312400000"
        ├── name: string              # Nome leggibile ("Inverno", "Weekend")
        ├── enabled: boolean          # Flag abilitazione schedule
        ├── createdAt: string         # ISO 8601
        ├── updatedAt: string         # ISO 8601
        └── slots/                    # 7 giorni della settimana
            ├── Lunedi: ScheduleInterval[]
            ├── Martedi: ScheduleInterval[]
            ├── Mercoledi: ScheduleInterval[]
            ├── Giovedi: ScheduleInterval[]
            ├── Venerdi: ScheduleInterval[]
            ├── Sabato: ScheduleInterval[]
            └── Domenica: ScheduleInterval[]
```

**Nota**: I nomi dei giorni sono in italiano con accenti rimossi nei path Firebase (Lunedi, Martedi, ecc.) ma visualizzati con accenti nella UI.

### 2.2 Tipo ScheduleInterval

```typescript
interface ScheduleInterval {
  start: string;  // "HH:MM" formato 24h, step 15 minuti (es: "08:00", "08:15")
  end: string;    // "HH:MM" formato 24h (es: "17:00")
  power: number;  // 1-5 (livello potenza stufa)
  fan: number;    // 1-6 (livello ventola)
}
```

**Vincoli**:
- Durata minima intervallo: 15 minuti
- Gli intervalli NON si sovrappongono (la UI gestisce overlap automaticamente)
- Gli intervalli sono ordinati per orario crescente
- Un giorno puo avere 0 o piu intervalli

### 2.3 Esempio Dati Reali

```json
{
  "schedules-v2": {
    "activeScheduleId": "inverno-1709312400000",
    "mode": {
      "enabled": true,
      "semiManual": false,
      "lastUpdated": "2026-03-25T08:30:00.000Z"
    },
    "schedules": {
      "inverno-1709312400000": {
        "name": "Inverno",
        "enabled": true,
        "createdAt": "2026-01-01T00:00:00.000Z",
        "updatedAt": "2026-03-25T08:30:00.000Z",
        "slots": {
          "Lunedi": [
            { "start": "06:30", "end": "08:30", "power": 4, "fan": 5 },
            { "start": "16:00", "end": "22:00", "power": 3, "fan": 4 }
          ],
          "Martedi": [
            { "start": "06:30", "end": "08:30", "power": 4, "fan": 5 },
            { "start": "16:00", "end": "22:00", "power": 3, "fan": 4 }
          ],
          "Sabato": [
            { "start": "08:00", "end": "23:00", "power": 3, "fan": 3 }
          ],
          "Domenica": []
        }
      }
    }
  }
}
```

---

## 3. Modalita Operative

### 3.1 Manuale (`enabled: false`)

- Il cron ogni 5 minuti controlla `schedules-v2/mode` e trova `enabled: false`
- **NON esegue nessuna azione automatica** sulla stufa
- L'utente controlla la stufa manualmente dalla UI
- Il cron continua a eseguire task collaterali (health check proxy, ecc.)

### 3.2 Automatico (`enabled: true, semiManual: false`)

- Il cron trova un intervallo attivo per giorno/ora corrente
- **Se c'e un intervallo attivo e la stufa e spenta** -> invia comando `ignite` + `setPower(interval.power)`
- **Se c'e un intervallo attivo e la stufa e accesa** -> verifica e aggiorna power/fan se diversi
- **Se NON c'e un intervallo attivo e la stufa e accesa** -> invia comando `shutdown`
- **Se NON c'e un intervallo attivo e la stufa e spenta** -> nessuna azione

### 3.3 Semi-Manuale (`enabled: true, semiManual: true`)

Modalita override temporaneo. L'utente vuole controllare manualmente la stufa durante un periodo programmato.

**Attivazione**: L'utente preme "Semi-Manuale" nella UI. Il sistema:
1. Calcola il prossimo cambio schedulato (start o end del prossimo intervallo)
2. Imposta `returnToAutoAt` a quel timestamp
3. Imposta `semiManual: true`

**Comportamento cron**:
```
if (semiManual && now < returnToAutoAt) -> SKIP (non fare nulla)
if (semiManual && now >= returnToAutoAt) -> clear semiManual, torna in automatico
```

**Caso d'uso**: La stufa e programmata per spegnersi alle 22:00, ma l'utente vuole tenerla accesa un po' di piu. Attiva semi-manuale, lo scheduler non la spegne. Al prossimo start schedulato (es: 06:30 del giorno dopo), lo scheduler riprende il controllo automatico.

---

## 4. Logica Cron (ogni 5 minuti)

### 4.1 Match Intervallo

Il cron usa timezone `Europe/Rome` per determinare giorno e ora:

```typescript
// Calcolo ora corrente in timezone Rome
const formatter = new Intl.DateTimeFormat('it-IT', {
  timeZone: 'Europe/Rome',
  weekday: 'long',      // -> "lunedi"
  hour: '2-digit',      // -> "16"
  minute: '2-digit',    // -> "30"
  hour12: false
});

// Capitalizza il giorno: "lunedi" -> "Lunedi"
const giorno = capitalize(dayPart);
const currentMinutes = parseInt(hour) * 60 + parseInt(minute);

// Match: currentMinutes >= startMin && currentMinutes < endMin
const active = intervals.find(({ start, end }) => {
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  return currentMinutes >= startMin && currentMinutes < endMin;
});
```

**IMPORTANTE**: Il match e `>=` per start e `<` per end. Quindi alle 22:00 un intervallo che finisce alle 22:00 NON e piu attivo (la stufa verra spenta).

### 4.2 Safety Checks Prima dell'Accensione

1. **Status fetch**: Se il proxy Thermorossi non risponde, l'accensione viene SALTATA per sicurezza
2. **Double-check**: Prima di inviare `ignite`, il cron ri-verifica lo stato della stufa per evitare race condition
3. **Manutenzione**: Se `canIgnite()` ritorna `false` (ore di utilizzo raggiunte), l'accensione viene BLOCCATA
4. **Stato alarm**: Se la stufa e in stato `alarm`, non viene tentata nessuna accensione

### 4.3 Comandi Inviati alla Stufa

Tramite il proxy Thermorossi (attualmente `lib/stove/thermorossiProxy.ts`):

| Azione | Funzione Proxy | Endpoint HA | Body |
|--------|---------------|-------------|------|
| Accensione | `sendIgnit()` | `POST /api/v1/thermorossi/command/ignite` | `{}` (empty) |
| Spegnimento | `sendShutdown()` | `POST /api/v1/thermorossi/command/shutdown` | `{}` (empty) |
| Set potenza | `setPower(level)` | `POST /api/v1/thermorossi/command/power` | `{ "value": 1-5 }` |
| Set ventola | `setFan(level)` | `POST /api/v1/thermorossi/command/fan` | `{ "value": 1-6 }` |
| Leggi stato | `getStatus()` | `GET /api/v1/thermorossi/status` | - |
| Health check | `getHealth()` | `GET /api/v1/thermorossi/health` | - |

**Tutti i comandi POST ritornano 202 Accepted** con:
```json
{
  "command": "ignite",
  "status": "accepted",
  "previous_state": "off",
  "suggested_poll_delay_s": 15,
  "poll_endpoint": "/api/v1/thermorossi/status"
}
```

### 4.4 Sequenza Accensione Completa

```
1. getStatus() -> verifica stato attuale
2. Se stove_state in ['off', 'standby', 'cleaning']:
   a. getStatus() di conferma (double-check)
   b. Se ancora spenta:
      - sendIgnit()
      - setPower(interval.power)
      - updateStoveState(Firebase) -> salva stato locale
      - sendNotification("Stufa accesa alle HH:MM (P3, V4)")
      - trackIgnitionInterval() -> per rilevamento spegnimento imprevisto
```

### 4.5 Sequenza Regolazione Livelli (stufa gia accesa)

```
1. Se currentPowerLevel != interval.power E PID boost NON attivo:
   - setPower(interval.power)
   - updateStoveState(Firebase)

2. Se currentFanLevel != interval.fan:
   - setFan(interval.fan)
   - updateStoveState(Firebase)
```

**Nota PID**: Se il PID automation e attivo e sta gestendo la potenza, lo scheduler NON sovrascrive il livello di potenza. Il PID ha priorita sul valore schedulato.

---

## 5. PID Automation (opzionale)

Sistema di feedback-loop che regola la potenza della stufa in base alla temperatura ambiente rilevata dal termostato Netatmo.

### 5.1 Come Funziona

```
Ogni 5 minuti (nel cron):
1. Leggi configurazione PID da Firebase (users/{userId}/pidAutomation)
2. Leggi temperatura stanza target da cache Netatmo
3. Calcola errore: setpoint - temperatura_misurata
4. Applica algoritmo PID: output = Kp*error + Ki*integral + Kd*derivative
5. Il risultato e il livello potenza target (1-5, clamped)
6. Se diverso da potenza attuale -> setPower(target)
```

### 5.2 Configurazione PID (Firebase)

```
users/{adminUserId}/pidAutomation/
├── enabled: boolean
├── kp: number          # Proporzionale (default: 0.5)
├── ki: number          # Integrativo (default: 0.1)
├── kd: number          # Derivativo (default: 0.05)
├── manualSetpoint: number  # Temperatura target in C (default: 20)
└── targetRoomId: string    # ID stanza Netatmo da monitorare
```

### 5.3 Stato PID (persistito tra esecuzioni)

```
{environmentPath}/pidAutomation/
├── state/
│   ├── integral: number     # Accumulatore integrale
│   ├── prevError: number    # Errore precedente (per derivativo)
│   ├── initialized: boolean
│   ├── lastRun: number      # Timestamp ultima esecuzione
│   └── lastCleanup: number  # Timestamp ultimo cleanup log
└── boost/
    ├── active: boolean      # PID sta sovrascrivendo la potenza schedulata
    ├── powerLevel: number   # Potenza impostata dal PID
    ├── scheduledPower: number # Potenza che lo scheduler avrebbe impostato
    └── appliedAt: number    # Timestamp
```

### 5.4 Interazione PID-Scheduler

- Il PID si attiva SOLO quando: stufa in stato `working` + modalita automatica (no semi-manuale)
- Il PID PUO sovrascrivere la potenza schedulata (es: schedule dice P3, PID mette P4 perche fa freddo)
- Quando non c'e intervallo attivo, il boost PID viene azzerato
- Quando il PID concorda con lo schedule, il boost viene disattivato

---

## 6. API CRUD Schedules

### 6.1 Elenco Schedules

```
GET /api/schedules
Authorization: Bearer {auth0_token}

Response:
{
  "schedules": [
    {
      "id": "inverno-1709312400000",
      "name": "Inverno",
      "enabled": true,
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-03-25T08:30:00.000Z",
      "intervalCount": 14
    }
  ],
  "activeScheduleId": "inverno-1709312400000"
}
```

### 6.2 Creazione Schedule

```
POST /api/schedules
Authorization: Bearer {auth0_token}
Body: { "name": "Estate", "copyFromId": "inverno-1709312400000" }

Response:
{
  "schedule": {
    "id": "estate-1709398800000",
    "name": "Estate",
    "enabled": true,
    "slots": { ... copiati da inverno ... }
  }
}
```

L'ID viene generato come: `{nome-normalizzato}-{Date.now()}`

### 6.3 Selezione Schedule Attiva

```
POST /api/schedules/active
Authorization: Bearer {auth0_token}
Body: { "scheduleId": "estate-1709398800000" }
```

**Atomico**: Verifica che lo schedule esista prima di aggiornare `activeScheduleId`.

### 6.4 Operazioni Singolo Schedule

```
GET    /api/schedules/{id}  -> Schedule completo con slots
PUT    /api/schedules/{id}  -> Aggiorna nome/slots/enabled
DELETE /api/schedules/{id}  -> Elimina (non puo eliminare l'attivo o l'ultimo)
```

### 6.5 Aggiornamento Scheduler (operazioni)

```
POST /api/scheduler/update
Authorization: Bearer {auth0_token}
Body: { "operation": "...", "data": {...} }
```

| Operazione | Data | Effetto |
|-----------|------|---------|
| `saveSchedule` | `{ day: "Lunedi", schedule: ScheduleInterval[] }` | Salva intervalli per un giorno nello schedule attivo |
| `setSchedulerMode` | `{ enabled: boolean }` | Abilita/disabilita automatico |
| `setSemiManualMode` | `{ returnToAutoAt: "ISO8601" }` | Attiva semi-manuale con scadenza |
| `clearSemiManualMode` | `{}` | Disattiva semi-manuale, torna in automatico |

---

## 7. Notifiche (lato cron)

Il cron invia push notification tramite FCM per:

| Evento | Trigger | Cooldown |
|--------|---------|----------|
| Accensione automatica | Ogni `sendIgnit()` dallo scheduler | Nessuno |
| Spegnimento automatico | Ogni `sendShutdown()` dallo scheduler | Nessuno |
| Stove working | Stufa entra in stato `working` | 30 minuti |
| Spegnimento imprevisto | Stufa si spegne durante intervallo attivo (dopo essere stata accesa dallo scheduler) | 1 ora |
| Allarme stufa | `stove_state === 'alarm'` | 1 ora |
| Manutenzione | Ore utilizzo raggiungono soglie (75%, 90%, 100%) | Basato su livello |

---

## 8. Task Collaterali del Cron

Questi task vengono eseguiti nel cron `/api/scheduler/check` in modo fire-and-forget (non bloccano il flusso principale):

| Task | Frequenza | Descrizione |
|------|-----------|-------------|
| Health check Netatmo proxy | Ogni esecuzione | Salva stato health in Firebase |
| Health check Thermorossi proxy | Ogni esecuzione | Salva stato health in Firebase |
| Tracking ore manutenzione | Ogni esecuzione | Conta ore di funzionamento stufa |
| Calibrazione valvole Netatmo | Ogni 12 ore | Invia comando calibrazione a Netatmo |
| Refresh meteo | Ogni 30 minuti | Aggiorna cache dati meteo Open-Meteo |
| Cleanup token FCM | Ogni 7 giorni | Rimuove token push notification scaduti |
| Cron execution log | Ogni esecuzione | Registra esecuzione cron con durata e stato |

---

## 9. Cosa Deve Implementare HA

### 9.1 Storage (sostituisce Firebase RTDB)

HA deve persistere:
- **Schedules**: La struttura dati in sezione 2 (multi-schedule con slots settimanali)
- **Mode**: Stato operativo (enabled/semiManual/returnToAutoAt)
- **ActiveScheduleId**: Quale schedule e attivo
- **PID state**: integral/prevError/lastRun (se si vuole mantenere PID automation)

### 9.2 API Endpoints Richiesti

**Lettura**:
- `GET /api/v1/scheduler/mode` -> SchedulerMode
- `GET /api/v1/scheduler/schedules` -> lista schedule con metadata
- `GET /api/v1/scheduler/schedules/{id}` -> schedule completo con slots
- `GET /api/v1/scheduler/schedules/active` -> activeScheduleId
- `GET /api/v1/scheduler/next-action` -> prossima azione schedulata (timestamp + tipo)

**Scrittura**:
- `POST /api/v1/scheduler/mode` -> `{ enabled, semiManual?, returnToAutoAt? }`
- `POST /api/v1/scheduler/schedules` -> crea schedule
- `PUT /api/v1/scheduler/schedules/{id}` -> aggiorna schedule
- `DELETE /api/v1/scheduler/schedules/{id}` -> elimina schedule
- `POST /api/v1/scheduler/schedules/active` -> `{ scheduleId }` imposta attivo
- `PUT /api/v1/scheduler/schedules/{id}/slots/{day}` -> salva intervalli giorno

### 9.3 Cron Engine

HA deve eseguire ogni 5 minuti la logica descritta in sezione 4. Il flusso decisionale critico e:

```
LEGGI mode
  |
  +--> enabled=false -> NOOP (manuale)
  |
  +--> semiManual=true AND now < returnToAutoAt -> NOOP (semi-manuale attivo)
  |
  +--> semiManual=true AND now >= returnToAutoAt -> CLEAR semiManual
  |
  v
TROVA intervallo corrente per giorno/ora (timezone Europe/Rome!)
  |
  +--> Nessun intervallo + stufa accesa -> SHUTDOWN
  |
  +--> Nessun intervallo + stufa spenta -> NOOP
  |
  +--> Intervallo attivo + stufa spenta -> SAFETY CHECKS -> IGNITE + SET POWER
  |
  +--> Intervallo attivo + stufa accesa -> ADJUST LEVELS (power/fan se diversi)
```

### 9.4 Timezone

**CRITICO**: Tutti gli orari degli intervalli sono in formato `HH:MM` **local time Europe/Rome**. Il confronto con l'ora corrente DEVE essere fatto in timezone `Europe/Rome`, non UTC. Questo e importante per la gestione DST (CET/CEST).

### 9.5 Stati Stufa Rilevanti per il Cron

```typescript
type StoveState = 'off' | 'igniting' | 'working' | 'standby' | 'cleaning' | 'alarm' | 'modulating';

// "Accesa" = working | igniting | modulating
// "Spenta" = off | standby | cleaning | alarm
```

---

## 10. Flusso Dati Attuale vs Proposto

### Attuale (Firebase)

```
UI (browser) ---> Firebase RTDB (schedules-v2/) <--- Cron (Vercel)
     |                                                    |
     |  onValue listener (real-time sync)                 |  adminDbGet/adminDbSet
     |                                                    |
     +--- POST /api/scheduler/update -----> Firebase      |
     +--- GET /api/schedules -----------> Firebase        |
                                                          v
                                              Thermorossi Proxy (HA)
```

### Proposto (HA)

```
UI (browser) ---> Next.js API Routes ---> HA Proxy (scheduler endpoints)
     |                                         |
     |  useAdaptivePolling (60s)               |  Storage HA (SQLite/DB?)
     |                                         |
     +--- POST /api/scheduler/update --> HA    |
     +--- GET /api/schedules ---------> HA     |
                                               |
                                    Cron engine interno HA
                                               |
                                               v
                                    Thermorossi commands (diretto)
```

**Vantaggio**: Il cron non deve piu fare una chiamata HTTP esterna per i comandi stufa - HA puo invocarli direttamente internamente.

---

## 11. Calcolo Prossima Azione Schedulata

Usato dalla UI per mostrare "Prossima accensione: Lunedi 06:30" e per calcolare il `returnToAutoAt` del semi-manuale.

**Algoritmo**:
1. Prendi ora corrente in Europe/Rome
2. Cerca negli intervalli di OGGI se c'e un start o end futuro
3. Se siamo DENTRO un intervallo -> prossimo cambio = end (action: shutdown)
4. Se c'e un intervallo successivo oggi -> prossimo cambio = start (action: ignite)
5. Se non c'e niente oggi -> cerca nei prossimi 7 giorni il primo intervallo
6. Ritorna `{ timestamp: ISO8601, action: 'ignite'|'shutdown', power?, fan? }`

---

## 12. Vincoli e Note Importanti

1. **Single-user system**: C'e un solo `ADMIN_USER_ID`. Tutte le notifiche e configurazioni PID sono per questo utente.
2. **Idempotenza cron**: Il cron puo essere eseguito piu volte senza effetti collaterali. La double-check prima dell'accensione previene duplicati.
3. **Graceful degradation**: Se il proxy Thermorossi non risponde, il cron NON tenta accensione (safety first).
4. **Real-time sync**: Attualmente la UI usa Firebase `onValue` listener per aggiornamenti in tempo reale. Con HA, si passera a polling (useAdaptivePolling 60s).
5. **Giorni senza intervalli**: Un giorno senza array (o con array vuoto) e valido - significa "stufa spenta tutto il giorno".
6. **Step 15 minuti**: La UI permette di impostare orari con granularita 15 minuti (00, 15, 30, 45).
