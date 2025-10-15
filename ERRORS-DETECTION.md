# Sistema di Rilevamento Errori Stufa

## Overview
Sistema autonomo per rilevamento, monitoraggio e visualizzazione errori della stufa Thermorossi in tempo reale.

## Funzionalità Implementate

### 1. Rilevamento Automatico
- **Polling**: Ogni 5 secondi, StovePanel interroga `/api/stove/status`
- **Parametri monitorati**:
  - `Error` (codice errore 0-N)
  - `ErrorDescription` (descrizione testuale dall'API)
  - `StatusDescription` (stato operativo stufa)

### 2. Database Errori Conosciuti

**File**: `lib/errorMonitor.js`

**Codici Errore Implementati** (23 errori):

#### Errori di Accensione
- **1**: Mancata accensione
- **2**: Errore candeletta
- **3**: Pellet esaurito (CRITICAL)

#### Errori di Temperatura
- **4**: Temperatura fumi eccessiva (CRITICAL)
- **5**: Errore sonda temperatura fumi
- **6**: Errore termocoppia
- **7**: Temperatura ambiente non raggiunta (WARNING)

#### Errori di Pressione/Tiraggio
- **8**: Errore depressione (CRITICAL)
- **9**: Mancanza tiraggio
- **10**: Errore ventilatore fumi (CRITICAL)

#### Errori Meccanici
- **11**: Errore motoriduttore carico pellet
- **12**: Errore ventilatore ambiente (WARNING)

#### Errori di Sicurezza
- **13**: Allarme sicurezza termica (CRITICAL)
- **14**: Errore porta aperta (WARNING)
- **15**: Black-out durante funzionamento

#### Altri
- **20**: Errore comunicazione scheda
- **30**: Errore sensore temperatura ambiente (WARNING)
- **40**: Surriscaldamento H2O - solo modelli idro (CRITICAL)

### 3. Livelli di Severità

```javascript
ERROR_SEVERITY = {
  INFO: 'info',        // Nessun errore
  WARNING: 'warning',  // Attenzione richiesta
  ERROR: 'error',      // Errore da risolvere
  CRITICAL: 'critical' // Richiede intervento immediato
}
```

### 4. Visualizzazione Errori

#### A. Badge Errore (Status Display)
**Posizione**: Card "Stato Stufa", angolo superiore destro

**Caratteristiche**:
- Badge rosso pulsante con blur effect
- Testo: "⚠️ ERR {codice}"
- Animazione `animate-pulse` per massima visibilità
- Appare SOLO quando `errorCode !== 0`

**Codice**:
```jsx
{errorCode !== 0 && (
  <div className="absolute -top-2 -right-2 animate-pulse">
    <div className="relative">
      <div className="absolute inset-0 bg-primary-500 rounded-full blur-md opacity-75"></div>
      <div className="relative bg-primary-600 text-white px-3 py-1.5 rounded-full border-2 border-white shadow-lg">
        <span className="text-xs font-bold">⚠️ ERR {errorCode}</span>
      </div>
    </div>
  </div>
)}
```

#### B. Error Alert Banner (Homepage)
**Posizione**: Top della pagina, sopra tutte le card

**Contenuto**:
- Titolo: "Allarme Stufa - Codice {X}"
- Descrizione errore (da API o database)
- 💡 **Suggerimento** risoluzione in box glassmorphism
- Pulsante "📋 Vedi Storico Errori"
- Icona variabile per severità:
  - CRITICAL: 🚨
  - ERROR: ⚠️
  - WARNING: ⚡
  - INFO: ℹ️

**Esempio Output**:
```
🚨 Allarme Stufa - Codice 3
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Pellet esaurito

💡 Suggerimento:
Ricaricare il serbatoio pellet e riprovare

[📋 Vedi Storico Errori]
```

#### C. Pagina Storico Errori (`/errors`)
**Funzionalità**:
- Lista completa errori da Firebase
- Filtri: Tutti / Attivi / Risolti
- Paginazione (20 errori per pagina)
- Metadata: data/ora, stato stufa, durata
- Pulsante "Segna come Risolto"

### 5. Logging e Persistenza

#### Firebase Schema
```
errors/
└── {errorId}/
    ├── errorCode: number
    ├── errorDescription: string
    ├── severity: 'info'|'warning'|'error'|'critical'
    ├── timestamp: number (ms)
    ├── resolved: boolean
    ├── resolvedAt: number (ms) [opzionale]
    ├── status: string [opzionale]
    └── source: 'status_monitor'
```

#### Funzioni errorMonitor.js
```javascript
// Log errore su Firebase
await logError(errorCode, errorDescription, {
  status: 'WORK',
  source: 'status_monitor'
});

// Recupera errori recenti (default 50)
const errors = await getRecentErrors(100);

// Recupera solo errori attivi
const activeErrors = await getActiveErrors();

// Marca errore come risolto
await resolveError(errorId);

// Info errore da codice
const errorInfo = getErrorInfo(3);
// => { description: 'Pellet esaurito', severity: 'critical', suggestion: '...' }

// Check se errore è critico
const isCritical = isCriticalError(3); // => true
```

### 6. Notifiche Browser

**Trigger**: Nuovo errore rilevato (cambio codice errore)

**Condizioni**:
```javascript
// Invia notifica SE:
// 1. Errore è cambiato rispetto al precedente
// 2. Nuovo errore !== 0 (errore attivo)
if (shouldNotify(newErrorCode, previousErrorCode)) {
  await sendErrorNotification(newErrorCode, newErrorDescription);
}
```

**Notifica**:
- Titolo: "🚨 Allarme Stufa" (o ⚠️ per non-critical)
- Body: Descrizione errore
- Tag: `stove-error-{code}` (evita duplicati)
- `requireInteraction: true` per errori CRITICAL

**Permessi**: Richiesti automaticamente al primo errore

### 7. Data Flow

```
Polling ogni 5s
    ↓
GET /api/stove/status
    ↓
Parse: { Error, ErrorDescription, StatusDescription }
    ↓
Update state: errorCode, errorDescription
    ↓
If Error !== 0:
    ├─→ Log su Firebase (errori attivi)
    ├─→ Check shouldNotify()
    ├─→ Invia browser notification
    └─→ Mostra ErrorAlert + Badge
```

## Testing

### Test Manuale (quando stufa in errore)
1. Aprire homepage pannello
2. Attendere polling (max 5s)
3. Verificare:
   - ✅ Badge rosso pulsante in Status Display
   - ✅ Banner ErrorAlert con suggerimento
   - ✅ Notifica browser (se permesso concesso)
   - ✅ Log in Firebase: `/errors/{errorId}`

### Verifica API Diretta
```bash
# Check status corrente
curl http://localhost:3000/api/stove/status | python3 -m json.tool

# Output esempio con errore:
{
  "Error": 3,
  "ErrorDescription": "Pellet esaurito",
  "Status": 5,
  "StatusDescription": "ERROR",
  "Success": true
}
```

### Test Storico Errori
1. Navigare a `/errors`
2. Verificare errori loggati
3. Testare filtri (Tutti/Attivi/Risolti)
4. Testare pulsante "Segna come Risolto"

## Espansione Futura

### Aggiungere Nuovi Codici Errore
**File**: `lib/errorMonitor.js`

```javascript
export const ERROR_CODES = {
  // ... esistenti
  50: {
    description: 'Nuovo errore da definire',
    severity: ERROR_SEVERITY.ERROR,
    suggestion: 'Azioni consigliate per risoluzione'
  },
};
```

### Aggiungere Azioni Automatiche
```javascript
// Esempio: spegnimento automatico per errori critici
if (isCriticalError(errorCode)) {
  await fetch('/api/stove/shutdown', {
    method: 'POST',
    body: JSON.stringify({ source: 'error_monitor' })
  });
}
```

## Troubleshooting

### Badge errore non appare
1. **Check errorCode state**: Deve essere !== 0
2. **Verifica API**: `curl http://localhost:3000/api/stove/status`
3. **Check polling**: Console log ogni 5s
4. **Cache browser**: Hard refresh (Cmd+Shift+R)

### Notifiche non funzionano
1. **Permessi browser**: Settings > Notifications > Allow localhost
2. **Check supporto**: `'Notification' in window` deve essere true
3. **Verifica shouldNotify()**: Errore deve cambiare per trigger

### Errori non loggati su Firebase
1. **Verifica Firebase config**: `.env.local` deve essere corretto
2. **Check Firebase rules**: write access su `/errors/`
3. **Console errors**: Verificare log console per errori Firebase SDK

### Suggerimenti non appaiono
1. **Check ERROR_CODES**: Codice errore deve avere campo `suggestion`
2. **Prop showSuggestion**: Default true, verificare se override
3. **Errori sconosciuti**: Usano template generico senza suggestion

## Best Practices

1. **Severità appropriate**:
   - CRITICAL: Solo per errori che richiedono intervento immediato o spegnimento
   - ERROR: Errori che impediscono funzionamento normale
   - WARNING: Attenzioni che non bloccano operatività

2. **Suggerimenti chiari**:
   - Azioni concrete e verificabili
   - Step-by-step quando possibile
   - Indicare quando serve assistenza tecnica

3. **Testing regolare**:
   - Testare ogni nuovo codice errore aggiunto
   - Verificare notifiche in diversi browser
   - Controllare log Firebase per integrità dati

4. **Monitoraggio**:
   - Analizzare storico errori per pattern ricorrenti
   - Identificare errori più frequenti per miglioramenti UI
   - Verificare risoluzione errori (tempo medio)

---

**Last Updated**: 2025-10-15
**Version**: 1.5.6
