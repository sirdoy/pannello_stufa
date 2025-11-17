# E2E Testing - Pannello Stufa

Test End-to-End per verificare UI/UX dell'applicazione con Playwright.

## 📦 Setup

```bash
# Playwright è già installato
npm install
```

## 🚀 Esecuzione Test

### Test E2E Completo

```bash
# 1. Attiva TEST_MODE in .env.local
TEST_MODE=true

# 2. Avvia dev server
npm run dev

# 3. Esegui test (in altra finestra terminale)
npm run test:e2e
```

### Test Playwright Base

```bash
npm run test:playwright
```

## 🎯 Test Inclusi

### test-e2e.mjs (Test Completo)

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

## 📸 Screenshot

Gli screenshot vengono:
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

### "Screenshot non vengono cancellati"

Normal behavior se il test fallisce. Puoi cancellarli manualmente:

```bash
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

**Ultima modifica**: 2025-11-17
**Versione**: 1.14.1
