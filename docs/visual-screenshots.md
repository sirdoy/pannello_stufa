# Visual Screenshots - Bypass Auth0

Come catturare screenshot dell'applicazione bypassando Auth0 per testing visivo.

## 🎯 Problema

Gli screenshot Playwright mostrano la pagina di login Auth0 invece dell'applicazione perché il middleware richiede autenticazione.

## ✅ Soluzione: TEST_MODE

Il middleware ha già un bypass integrato tramite la variabile `TEST_MODE=true`.

### Middleware Implementation

```javascript
// middleware.js
export async function middleware(req) {
  const res = NextResponse.next();

  // Bypass authentication in test mode (Playwright)
  if (process.env.TEST_MODE === 'true') {
    return res;
  }

  const session = await getSession(req, res);
  // ... auth logic
}
```

## 📸 Come Catturare Screenshot

### 1. Avvia Dev Server con TEST_MODE

```bash
# IMPORTANTE: Usa sia SANDBOX_MODE che TEST_MODE
SANDBOX_MODE=true TEST_MODE=true npm run dev
```

**Perché entrambe le variabili?**
- `TEST_MODE=true` - Bypassa Auth0 nel middleware
- `SANDBOX_MODE=true` - Usa dati fake per stufa (no chiamate API reali)

### 2. Esegui Screenshot Playwright

```bash
# Screenshot singolo (desktop light)
SANDBOX_MODE=true TEST_MODE=true npx playwright test e2e/visual-inspection.spec.js --grep "desktop - light - loaded" --project=chromium-desktop-light

# Screenshot tutti i device
SANDBOX_MODE=true TEST_MODE=true npx playwright test e2e/visual-inspection.spec.js --grep "loaded"

# Screenshot dark mode
SANDBOX_MODE=true TEST_MODE=true npx playwright test e2e/visual-inspection.spec.js --grep "desktop - dark - loaded"
```

## 📁 Output Screenshots

Gli screenshot vengono salvati in:

```
visual-inspection/
├── desktop-light-loaded.png      # Desktop 1280x720 light
├── desktop-dark-loaded.png       # Desktop 1280x720 dark
├── large-desktop-light-loaded.png # Desktop 1920x1080 light
├── large-desktop-dark-loaded.png  # Desktop 1920x1080 dark
├── mobile-light-loaded.png        # Mobile 375x667 light
├── mobile-dark-loaded.png         # Mobile 375x667 dark
├── tablet-light-loaded.png        # Tablet 768x1024 light
└── tablet-dark-loaded.png         # Tablet 768x1024 dark
```

## 🔍 Verifica Screenshot

Dopo l'esecuzione, leggi lo screenshot per verificare:

```bash
# Da CLI
open visual-inspection/desktop-light-loaded.png

# Da codice (Claude)
Read file: /path/to/visual-inspection/desktop-light-loaded.png
```

### ✅ Screenshot Corretto

Devi vedere:
- Homepage con device cards (Stufa, Termostato, Luci)
- Sandbox Mode badge (viola in alto)
- Status dei dispositivi
- **NO pagina login Auth0**

### ❌ Screenshot Errato

Se vedi:
- "Internal Server Error" - Server non avviato con TEST_MODE
- Pagina login Auth0 - TEST_MODE non impostato
- Schermata bianca - Server non pronto (aspetta 10s)

## 🚨 Troubleshooting

### Server non bypassa Auth0

```bash
# Verifica variabile environment
echo $TEST_MODE  # Deve stampare: true

# Riavvia server con log
TEST_MODE=true SANDBOX_MODE=true npm run dev

# Verifica in browser
curl http://localhost:3000  # Deve tornare HTML, non redirect
```

### Screenshot vuoto o errore

```bash
# Aspetta che server sia pronto
sleep 10 && curl http://localhost:3000

# Verifica status code
curl -I http://localhost:3000  # Deve essere 200 OK
```

### Test Playwright fallisce

```bash
# Kill processi zombie
pkill -f "next dev"

# Riavvia tutto pulito
SANDBOX_MODE=true TEST_MODE=true npm run dev &
sleep 10
SANDBOX_MODE=true TEST_MODE=true npx playwright test e2e/visual-inspection.spec.js
```

## 📝 Note Importanti

1. **TEST_MODE solo per testing locale** - Non usare in production!
2. **Sempre combinare con SANDBOX_MODE** - Evita chiamate API reali
3. **Server deve essere già avviato** - Playwright non avvia automaticamente
4. **Aspetta 10 secondi dopo avvio** - Server Next.js ha bisogno di tempo

## 🔗 File Correlati

- `middleware.js` - Implementazione bypass Auth0
- `e2e/visual-inspection.spec.js` - Test screenshot Playwright
- `playwright.config.js` - Configurazione browser/viewport
- `docs/sandbox.md` - Documentazione Sandbox Mode

---

**Last Updated**: 2025-11-25
**Verified Working**: ✅ TEST_MODE bypassa correttamente Auth0
