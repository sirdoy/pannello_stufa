# Sandbox Mode

Sistema completo di testing locale per sviluppo senza chiamate reali alla stufa.

## 📋 Overview

Sandbox Mode è un ambiente di simulazione disponibile **SOLO in localhost** che permette di:

- ✅ Testare tutte le funzionalità senza chiamate reali all'API Thermorossi
- ✅ Simulare tutti gli stati della stufa (OFF, START, WORK, CLEAN, FINAL, ERROR)
- ✅ Modificare potenza e ventola istantaneamente
- ✅ Simulare ore di lavoro e manutenzione
- ✅ Testare errori e scenari edge case
- ✅ Verificare comportamento UI senza hardware reale

## 🚀 Quick Start

### 1. Abilitare Sandbox Mode

#### Metodo A: Via Variabile d'Ambiente (Consigliato per test E2E)

```bash
# Avvia l'app con sandbox attivo
SANDBOX_MODE=true npm run dev

# Oppure per test Playwright
SANDBOX_MODE=true npx playwright test
```

La variabile d'ambiente `SANDBOX_MODE=true` attiva automaticamente la sandbox senza bisogno di toggle UI.

#### Metodo B: Via UI Toggle (Per sviluppo manuale)

1. Avvia l'app in locale: `npm run dev`
2. Vai alla homepage (<http://localhost:3000>)
3. Troverai un toggle **🧪 Sandbox Mode** in alto
4. Attiva il toggle
5. La pagina si ricaricherà e vedrai il pannello di controllo sandbox

### 2. Utilizzare il Pannello Sandbox

Il pannello sandbox ti permette di:

#### Stato Stufa

- Clicca sui bottoni per cambiare stato istantaneamente
- Gli stati disponibili sono: OFF, START, WORK, CLEAN, FINAL, ERROR
- Ogni stato ha un colore distintivo

#### Controlli Potenza e Ventola

- Usa gli slider per impostare potenza (1-5) e ventola (0-5)
- Clicca "Set" per applicare i valori
- I valori si aggiornano immediatamente

#### Temperatura

- Imposta la temperatura simulata (0-100°C)
- Utile per testare interfacce dipendenti dalla temperatura

#### Manutenzione

- **Ore lavorate**: Imposta manualmente le ore simulate
- **Progress bar**: Visualizza progresso verso soglia manutenzione (150h)
- **Reset**: Azzera ore e flag manutenzione
- Quando >= 150h, `needsCleaning=true` e accensione bloccata

#### Simulazione Errori

- Seleziona un errore specifico da simulare:
  - `AL01`: Temperatura troppo alta
  - `AL02`: Pressione insufficiente
  - `AL03`: Accensione fallita
  - `AL04`: Inceppamento pellet
  - `AL05`: Pulizia necessaria
- Il sistema di notifiche errori funzionerà normalmente

#### Impostazioni Simulazione

- **Progressione automatica stati**: OFF→START→WORK, CLEAN→FINAL→OFF
- **Simula ritardi realistici**: Aggiunge delay alle transizioni
- **Genera errori casuali**: Per stress testing (non consigliato)

#### Storico Azioni

- Clicca "Mostra History" per vedere tutte le azioni sandbox
- Ogni azione include timestamp e parametri
- Utile per debugging

#### Test Scheduler ⏰

Sezione dedicata per testare modalità scheduler e transizioni automatiche.

**Visual Mode Badges**:

- 🔧 **MANUAL**: Scheduler disattivato
- ⏰ **AUTO**: Modalità automatica attiva
- ⚙️ **SEMI-MANUAL**: Override temporaneo attivo

**Quick Test Setup**:

1. **Toggle Scheduler**: Attiva/disattiva modalità automatica
2. **Crea Intervallo Test**:
   - Imposta orario inizio/fine
   - Seleziona potenza (1-5) e ventola (1-6)
   - L'intervallo viene creato per il giorno corrente
   - Lo scheduler si attiva automaticamente se non già attivo
3. **Clear Intervallo**: Rimuove l'intervallo di test

**Test Transizione Semi-Manual**:

1. Crea un intervallo di test
2. Metti la stufa in stato WORK
3. Vai sulla StoveCard e modifica Fan o Power
4. Dovresti vedere:
   - Badge blu preventivo "ℹ️ La modifica attiverà la modalità Semi-Manuale"
   - Toast giallo "⚙️ Modalità cambiata in Semi-Manuale"
   - Badge modalità cambia da ⏰ AUTO a ⚙️ SEMI-MANUAL
   - Pulsante "↩️ Torna in Automatico" appare

**Controlli**:

- **Clear Semi-Manual**: Ritorna in modalità automatica (visibile solo in semi-manual)
- **Clear**: Cancella l'intervallo di test creato

## 🏗️ Architettura

### Intercettazione Chiamate API

Tutte le chiamate alla stufa passano attraverso wrapper functions in `lib/stoveApi.js`:

```javascript
// Esempio: getStoveStatus()
export async function getStoveStatus() {
  // 1. Check se siamo in localhost
  if (isLocalEnvironment()) {
    const sandboxEnabled = await isSandboxEnabled();

    // 2. Se sandbox attivo, usa dati simulati
    if (sandboxEnabled) {
      const state = await getSandboxStoveState();
      return {
        status: state.status,
        fan: state.fan,
        power: state.power,
        temperature: state.temperature,
        isSandbox: true, // Flag per UI
      };
    }
  }

  // 3. Altrimenti, chiamata API reale
  const response = await fetchWithTimeout(STUFA_API.getStatus);
  const data = await response.json();
  return { ...data, isSandbox: false };
}
```

### Schema Firebase

Tutti i dati sandbox sono salvati in Firebase Realtime Database sotto `sandbox/`:

```text
sandbox/
├── enabled: boolean              # Sandbox attivo/disattivo
├── stoveState/
│   ├── status: string           # OFF|START|WORK|CLEAN|FINAL|ERROR
│   ├── fan: number              # 0-5
│   ├── power: number            # 1-5
│   ├── temperature: number      # °C
│   └── lastUpdate: string       # ISO timestamp
├── maintenance/
│   ├── hoursWorked: number      # Ore simulate
│   ├── maxHours: number         # Soglia (default 150)
│   ├── needsCleaning: boolean   # Flag pulizia
│   └── lastUpdatedAt: string    # ISO timestamp o null
├── error: object|null           # Errore corrente simulato
│   ├── code: string             # Es: "AL01"
│   └── description: string      # Descrizione
├── settings/
│   ├── autoProgressStates: bool # Progressione automatica
│   ├── simulateDelay: bool      # Simula ritardi
│   └── randomErrors: bool       # Errori casuali
└── history: array               # Storico azioni (max 100)
    └── [
          {
            action: string,
            details: object,
            timestamp: string
          }
        ]
```

### Componenti

#### `SandboxToggle` (`app/components/sandbox/SandboxToggle.js`)

- Toggle per abilitare/disabilitare sandbox
- Visibile SOLO in localhost
- Include SandboxPanel quando abilitato

#### `SandboxPanel` (`app/components/sandbox/SandboxPanel.js`)

- Pannello di controllo completo
- Gestisce tutti i parametri simulati
- Mostra storico azioni

#### `sandboxService` (`lib/sandboxService.js`)

- Service layer per operazioni sandbox
- Gestisce stato Firebase
- Implementa logica simulazione

## 🔧 API Reference

### Verifica Ambiente

```javascript
import { isLocalEnvironment, isSandboxEnabled } from '@/lib/sandboxService';

// Check se siamo in localhost
if (isLocalEnvironment()) {
  // Check se sandbox è attivo (controlla sia SANDBOX_MODE env var che Firebase)
  const enabled = await isSandboxEnabled();
}
```

**Nota**: `isSandboxEnabled()` verifica:

1. Prima la variabile d'ambiente `SANDBOX_MODE` (priorità per test automatici)
2. Poi il flag Firebase `sandbox/enabled` (per toggle UI manuale)

### Toggle Sandbox

```javascript
import { toggleSandbox } from '@/lib/sandboxService';

// Abilita/disabilita sandbox
await toggleSandbox(true);  // Abilita
await toggleSandbox(false); // Disabilita
```

### Gestione Stato

```javascript
import {
  getSandboxStoveState,
  updateSandboxStoveState,
  STOVE_STATES,
} from '@/lib/sandboxService';

// Leggi stato corrente
const state = await getSandboxStoveState();
console.log(state.status); // 'WORK'

// Aggiorna stato
await updateSandboxStoveState({
  status: STOVE_STATES.OFF,
  fan: 0,
  power: 0,
});
```

### Comandi Stufa

```javascript
import {
  sandboxIgnite,
  sandboxShutdown,
  sandboxSetPower,
  sandboxSetFan,
} from '@/lib/sandboxService';

// Accendi (con progressione START->WORK se autoProgress attivo)
await sandboxIgnite(4); // power=4

// Spegni (con progressione CLEAN->FINAL->OFF se autoProgress attivo)
await sandboxShutdown();

// Imposta potenza/ventola
await sandboxSetPower(3);
await sandboxSetFan(2);
```

### Ore Manutenzione

```javascript
import {
  getSandboxMaintenance,
  updateSandboxMaintenanceHours,
  resetSandboxMaintenance,
} from '@/lib/sandboxService';

// Leggi stato manutenzione
const maintenance = await getSandboxMaintenance();
console.log(maintenance.hoursWorked); // 120
console.log(maintenance.needsCleaning); // false

// Imposta ore manualmente
await updateSandboxMaintenanceHours(155);
// Ora needsCleaning = true (>= 150h)

// Reset manutenzione
await resetSandboxMaintenance();
// hoursWorked = 0, needsCleaning = false
```

### Errori

```javascript
import { setSandboxError, SANDBOX_ERRORS } from '@/lib/sandboxService';

// Imposta errore
await setSandboxError('HIGH_TEMP');
// Stato diventa ERROR, error = { code: 'AL01', description: '...' }

// Rimuovi errore
await setSandboxError('NONE');
```

### Settings e History

```javascript
import {
  getSandboxSettings,
  updateSandboxSettings,
  getSandboxHistory,
  resetSandbox,
} from '@/lib/sandboxService';

// Leggi settings
const settings = await getSandboxSettings();

// Aggiorna settings
await updateSandboxSettings({
  autoProgressStates: true,
  simulateDelay: false,
});

// Leggi storico
const history = await getSandboxHistory();

// Reset completo
await resetSandbox();
```

## 🧪 Testing Workflows

### Test Ciclo Completo Stufa

1. Stato iniziale: OFF
2. Abilita "Progressione automatica stati"
3. Clicca "START"
4. Dopo 3s → automaticamente passa a WORK
5. Imposta potenza e ventola
6. Clicca "CLEAN"
7. Dopo 2s → FINAL
8. Dopo 2s → OFF

### Test Manutenzione

1. Imposta ore: 120
2. Verifica progress bar ~80%
3. Imposta ore: 135
4. Verifica progress bar ~90%
5. Imposta ore: 150+
6. Verifica flag "Pulizia richiesta"
7. Prova ad accendere → bloccato
8. Clicca "Reset" → accensione OK

### Test Errori

1. Clicca errore "AL01: Temperatura troppo alta"
2. Stato diventa ERROR
3. Verifica badge errore in StoveCard
4. Verifica notifica browser (se permessi attivi)
5. Controlla log errori in `/errors`
6. Clicca "Nessun errore" per rimuovere

### Test Scheduler con Sandbox

1. Abilita sandbox
2. Configura scheduler per accensione automatica
3. Verifica azioni scheduler funzionano
4. Verifica semi-manual mode override

## 🎨 UI Indicators

### Badge Sandbox in StoveCard

Quando sandbox è attivo, StoveCard mostra un badge viola "🧪 SANDBOX" in alto a sinistra:

```jsx
{sandboxMode && (
  <div className="absolute -top-2 -left-2 z-10">
    <div className="relative">
      <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-lg animate-pulse"></div>
      <div className="relative bg-gradient-to-br from-purple-500 to-pink-600 text-white px-4 py-2 rounded-full">
        <span className="text-xs font-bold">🧪 SANDBOX</span>
      </div>
    </div>
  </div>
)}
```

### Data Response Flag

Tutte le chiamate API in sandbox mode includono `isSandbox: true`:

```javascript
const status = await getStoveStatus();
console.log(status.isSandbox); // true in sandbox, false altrimenti
```

## 🔒 Security

### Restrizioni

- ✅ Sandbox disponibile **SOLO** in `localhost`
- ✅ Check sia client-side che server-side
- ✅ Nessun rischio di attivazione in production
- ✅ Dati sandbox isolati in Firebase path dedicato

### Verifica Ambiente (Guard)

```javascript
// Client-side
export function isLocalEnvironment() {
  if (typeof window === 'undefined') {
    return process.env.NODE_ENV === 'development';
  }
  return window.location.hostname === 'localhost' ||
         window.location.hostname === '127.0.0.1';
}

// Tutte le funzioni sandbox verificano:
if (!isLocalEnvironment()) {
  throw new Error('Sandbox disponibile solo in localhost');
}
```

## 📝 Best Practices

### Durante Sviluppo

1. **Usa sandbox per feature nuove**: Testa nuove UI senza hardware
2. **Testa edge cases**: Simula errori rari
3. **Verifica manutenzione**: Testa soglie senza attendere 150h reali
4. **Controlla history**: Debugging rapido azioni
5. **Disabilita prima di commit**: Non committare con sandbox attivo

### Prima di Production Deploy

```bash
# 1. Disabilita sandbox
# 2. Test con API reale (se possibile)
npm run build
# 3. Verifica che sandbox non sia incluso in bundle production
# 4. Deploy
```

### Testing CI/CD

I test automatici dovrebbero:

- Verificare che sandbox funzioni in development
- Verificare che sandbox sia disabilitato in production
- Testare wrapper functions con e senza sandbox

```javascript
// Esempio test
describe('stoveApi in production', () => {
  it('should never use sandbox in production', () => {
    process.env.NODE_ENV = 'production';
    expect(isLocalEnvironment()).toBe(false);
  });
});
```

### Test E2E con Playwright

Per eseguire test E2E completi senza chiamate reali alle API:

```bash
# Attiva sandbox via variabile d'ambiente
SANDBOX_MODE=true npx playwright test

# Oppure con npm script
SANDBOX_MODE=true npm run test:e2e
```

Questo attiverà automaticamente la sandbox mode all'avvio dell'app, permettendo di testare tutte le funzionalità UI
senza hardware reale.

## 🐛 Troubleshooting

### Sandbox non compare

**Problema**: Toggle sandbox non visibile in localhost

**Soluzione**:

1. Verifica URL: deve essere `localhost` o `127.0.0.1`
2. Controlla console per errori
3. Verifica Firebase connesso

### Chiamate API ancora reali

**Problema**: Anche con sandbox attivo, chiamate vanno a API reale

**Soluzione**:

1. Ricarica pagina dopo aver attivato sandbox
2. Verifica badge "🧪 SANDBOX" in StoveCard
3. Controlla `isSandbox` in response API
4. Verifica Firebase path `sandbox/enabled = true`

### Ore manutenzione non si aggiornano

**Problema**: Modifico ore ma non cambiano

**Soluzione**:

1. Il tracking ore sul Pi NON aggiorna ore in sandbox
2. Devi usare il pannello sandbox per modificare ore manualmente
3. Sandbox ha tracking separato da produzione

### History non si salva

**Problema**: Azioni non appaiono in history

**Soluzione**:

1. Verifica permessi Firebase
2. History tiene max 100 azioni (FIFO)
3. Reset sandbox cancella history

## 🔗 Files Correlati

- `lib/sandboxService.js` - Service layer completo
- `lib/stoveApi.js` - Wrapper functions con intercettazione
- `app/components/sandbox/SandboxToggle.js` - Toggle UI
- `app/components/sandbox/SandboxPanel.js` - Pannello controllo
- `app/api/stove/*/route.js` - API routes aggiornate
- `__tests__/sandboxService.test.js` - Unit tests
- `__tests__/stoveApi.sandbox.test.js` - Integration tests

## 📚 See Also

- [Quick Start](./quick-start.md) - Setup progetto
- [Architecture](./architecture.md) - Architettura multi-device
- [API Routes](./api-routes.md) - Documentazione API
- [Testing](./testing.md) - Unit tests e coverage

---

**Last Updated**: 2025-10-22
**Version**: 1.9.0
