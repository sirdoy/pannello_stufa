# E2E Testing - Pannello Stufa

Test End-to-End per verificare UI/UX dell'applicazione con Playwright.

## 📦 Setup

```bash
# Playwright è già installato
npm install

# Installa browser Playwright (prima volta)
npx playwright install --with-deps
```

## 🚀 Esecuzione Test

### Test UI/UX Completi (Nuovi - Playwright Suite)

```bash
# Esegui tutti i test UI/UX (con cleanup automatico artifacts)
npm run test:e2e

# Esegui con UI interattiva
npm run test:e2e:ui

# Esegui in modalità headed (vedi browser, con cleanup automatico)
npm run test:e2e:headed

# Debug mode (step-by-step)
npm run test:e2e:debug

# Visualizza report HTML
npm run test:e2e:report

# Pulizia manuale artifacts (se necessario)
npm run test:e2e:clean
```

**Cleanup Automatico**: I comandi `test:e2e` e `test:e2e:headed` eseguono automaticamente la pulizia degli artifacts generati (report, screenshots, cache) al termine dei test.

### Test E2E Legacy (con TEST_MODE)

```bash
# 1. Attiva TEST_MODE in .env.local
TEST_MODE=true

# 2. Avvia dev server
npm run dev

# 3. Esegui test legacy (in altra finestra terminale)
npm run test:playwright
```

## 🎯 Test Inclusi

### 🆕 Suite UI/UX Playwright (e2e/*.spec.js)

#### 🎨 Contrasto Colori (WCAG AA) - `e2e/contrast.spec.js`

- ✅ Contrasto minimo 4.5:1 per testo normale
- ✅ Contrasto minimo 3:1 per testo grande (headings)
- ✅ Verifica su tutti gli elementi testuali (button, card, banner, link)
- ✅ Test sia in light mode che dark mode
- ✅ Verifica elementi critici (badge, form label, messaggi errore)
- ✅ Utility WCAG contrast calculator in `e2e/utils/contrast.js`

#### 🧩 Uniformità Componenti - `e2e/component-uniformity.spec.js`

- ✅ **Button**: border radius, padding, stati hover consistenti
- ✅ **Card**: liquid glass effect, border radius, padding, shadow/border
- ✅ **Banner**: struttura uniforme, colori distintivi per warning/error
- ✅ **Typography**: font family, font size, line height consistenti
- ✅ **Spacing**: gap tra card, padding sezioni uniforme

#### 📱 Responsive Design - `e2e/responsive.spec.js`

- ✅ **Mobile (375px)**: card stack verticale, button touch-friendly (min 44px)
- ✅ **Tablet (768px)**: layout adattivo, navigation visibile
- ✅ **Desktop (1920px)**: utilizzo spazio orizzontale, content max-width
- ✅ **Breakpoint transitions**: nessun scroll orizzontale
- ✅ **Media**: immagini scalano correttamente, SVG visibili

#### 🌓 Dark Mode & Liquid Glass - `e2e/dark-mode.spec.js`

- ✅ Light/dark mode applicati correttamente
- ✅ Theme toggle su settings page
- ✅ Backdrop-filter blur su tutte le card
- ✅ Background semi-trasparenti (rgba con alpha < 1)
- ✅ Shadow o border per profondità
- ✅ Glass effect persiste durante scroll
- ✅ Layout preservato durante cambio tema
- ✅ Tutte le pagine supportano dark mode

#### ♿ Accessibilità (ARIA) - `e2e/accessibility.spec.js`

- ✅ **ARIA labels**: button, link, form input con label
- ✅ **Immagini** con alt text
- ✅ **Status message** con role="status" o role="alert"
- ✅ **Landmark navigation** (`<nav>`) e main (`<main>`)
- ✅ **Keyboard navigation**: tab order logico, no keyboard trap
- ✅ **Focus** visibile su elementi interattivi
- ✅ **Modal** trap focus quando aperto
- ✅ **Heading hierarchy** (h1 → h2 → h3, no skip)
- ✅ **Semantic HTML**: liste con `<ul>/<ol>`, button con `<button>`
- ✅ **Live regions** con aria-live
- ✅ **Icone** con text alternative o aria-hidden

**Totale**: 12 progetti di test (3 browser × 2 device × 2 theme)

### test-e2e.mjs (Test Completo Legacy)

**10 test automatici:**

1. ✅ Homepage - Dark Mode
2. ✅ Homepage - Light Mode
3. ✅ Scheduler - Dark Mode
4. ✅ Scheduler - Light Mode
5. ✅ Maintenance - Dark Mode
6. ✅ Maintenance - Light Mode
7. ✅ Log Page
8. ✅ Changelog Page
9. ✅ Mobile Responsive (Dark + Light)
10. ✅ Performance Metrics

**Funzionalità testate:**
- ✅ Modal changelog handling automatico
- ✅ Light/Dark theme switching
- ✅ Responsive design (375x812 mobile, 1920x1080 desktop)
- ✅ Navigation tra pagine
- ✅ Performance < 2s DOM Interactive

###  test-playwright.mjs (Test Base)

**6 test base:**
- Navigazione homepage
- Screenshot (homepage, desktop, mobile)
- Verifica elementi UI (navbar, cards)
- Test responsive
- Navigazione pagine (scheduler, maintenance, log, changelog)
- Performance metrics

## 🔧 Configurazione TEST_MODE

Il `TEST_MODE` bypassa l'autenticazione Auth0 per permettere i test automatici.

**⚠️ IMPORTANTE**: `TEST_MODE` deve essere **sempre `false` in produzione**!

### Middleware Bypass

`middleware.js`:
```javascript
export async function middleware(req) {
  const res = NextResponse.next();

  // Bypass authentication in test mode
  if (process.env.TEST_MODE === 'true') {
    return res;
  }

  // ... normal Auth0 check
}
```

### Attivazione

`.env.local`:
```env
# Test Mode (Playwright - bypass Auth0)
TEST_MODE=true  # Solo per testing!
```

**Dopo i test, ripristinare sempre:**
```env
TEST_MODE=false
```

## 📸 Screenshot & Artifacts

### Cleanup Automatico

I test Playwright generano diversi artifacts che vengono **automaticamente puliti** al termine dell'esecuzione:

1. **playwright-report/**: Report HTML interattivi
2. **test-results/**: Screenshot, videos, trace files
3. **playwright/.cache/**: Browser binaries cache

Il cleanup avviene automaticamente quando esegui:
- `npm run test:e2e`
- `npm run test:e2e:headed`

### Screenshot Legacy

Gli screenshot legacy (test-e2e.mjs) vengono:
1. ✅ Generati automaticamente durante i test
2. ✅ Salvati temporaneamente per analisi
3. ✅ **Cancellati automaticamente** alla fine dei test

**File generati (temporanei):**
- `test-dark-homepage.png`
- `test-light-homepage.png`
- `test-dark-scheduler.png`
- `test-light-scheduler.png`
- `test-dark-maintenance.png`
- `test-light-maintenance.png`
- `test-dark-log.png`
- `test-dark-changelog.png`
- `test-dark-mobile.png`
- `test-light-mobile.png`

## 🎨 Theme Testing

I test verificano entrambi i temi (light/dark) usando localStorage:

```javascript
// Imposta tema prima del caricamento pagina
await page.addInitScript((theme) => {
  localStorage.setItem('user-theme', theme);
}, 'dark');

// Forza classe CSS dark mode
await page.evaluate(() => {
  document.documentElement.classList.add('dark');
});
```

Questo bypassa la necessità di autenticazione per la pagina `/settings/theme`.

## ⚡ Performance Metrics

I test misurano automaticamente:
- **DOM Interactive**: Tempo fino a DOM interattivo
- **DOM Content Loaded**: Tempo caricamento DOM
- **Load Complete**: Tempo caricamento completo

**Target**: DOM Interactive < 2000ms ✅

## 🐛 Troubleshooting

### "TEST_MODE non funziona"

```bash
# 1. Verifica .env.local
cat .env.local | grep TEST_MODE
# Deve essere: TEST_MODE=true

# 2. Riavvia server dev
pkill node
npm run dev

# 3. Riesegui test
npm run test:e2e
```

### "Modal changelog blocca i test"

I test gestiscono automaticamente la modal. Se persiste:

```javascript
// test-e2e.mjs include già:
async function dismissModal(page) {
  const closeBtn = page.locator('button:has-text("Inizia ad usare")');
  if (await closeBtn.isVisible({ timeout: 2000 })) {
    await closeBtn.click();
  }
}
```

### "Artifacts non vengono cancellati"

Il cleanup automatico viene eseguito sempre, anche se i test falliscono. Se necessario puoi pulire manualmente:

```bash
# Pulizia automatica con npm script
npm run test:e2e:clean

# Oppure manualmente
rm -rf playwright-report test-results playwright/.cache
rm -f test-*.png screenshot-*.png manual-*.png
```

## 📊 Output Esempio

```
🎭 Pannello Stufa - E2E Test Suite
==================================================

🌙 TEST 1: Homepage - Dark Mode
   ✓ Titolo corretto
   ✓ Navbar presente
   ✓ Device cards: 30

☀️ TEST 2: Homepage - Light Mode
   ✓ Screenshot light mode

⏰ TEST 3: Scheduler - Dark Mode
   ✓ Scheduler dark mode

⏰ TEST 4: Scheduler - Light Mode
   ✓ Scheduler light mode

🔧 TEST 5: Maintenance - Dark Mode
   ✓ Maintenance dark mode

🔧 TEST 6: Maintenance - Light Mode
   ✓ Maintenance light mode

📋 TEST 7: Log Page
   ✓ Log page dark mode

📝 TEST 8: Changelog Page
   ✓ Changelog page dark mode

📱 TEST 9: Mobile Responsive
   ✓ Mobile dark mode (375x812)
   ✓ Mobile light mode (375x812)

⚡ TEST 10: Performance Metrics
   ✓ DOM Interactive: 178ms
   ✓ DOM Content Loaded: 0ms
   ✓ Load Complete: 0ms
   ✓ Performance eccellente (<2s)

==================================================
📊 RISULTATI FINALI
==================================================
✅ Test passati: 13
❌ Test falliti: 0
📸 Screenshot generati: 10
==================================================

🎉 TUTTI I TEST COMPLETATI CON SUCCESSO!

🧹 Pulizia screenshot...
✅ Pulizia completata
```

## 🔐 Sicurezza

**IMPORTANTE**: Non committare mai `.env.local` con `TEST_MODE=true`!

Il file `.env.local` è già nel `.gitignore`, ma verifica sempre:

```bash
# Verifica che TEST_MODE=false prima di commit
grep TEST_MODE .env.local
# Output atteso: TEST_MODE=false
```

## 📝 Best Practices

1. ✅ **Sempre** ripristinare `TEST_MODE=false` dopo i test
2. ✅ **Riavviare** il server dev dopo modifiche a `.env.local`
3. ✅ **Verificare** che gli screenshot siano cancellati
4. ✅ **Testare** prima di commit importanti
5. ✅ **Documentare** nuovi test aggiunti

## 🆕 Aggiungere Nuovi Test

Esempio per testare una nuova pagina:

```javascript
// In test-e2e.mjs

console.log('\n📄 TEST X: New Page');

await testPageWithTheme(
  darkContext,
  'http://localhost:3000/new-page',
  'newpage',
  'dark'
);

console.log('   ✓ New page dark mode');
testsPassed++;
```

## 📚 Risorse

- [Playwright Docs](https://playwright.dev/docs/intro)
- [Testing Best Practices](https://playwright.dev/docs/best-practices)
- [Selectors](https://playwright.dev/docs/selectors)

---

**Ultima modifica**: 2025-11-18
**Versione**: 1.15.1
