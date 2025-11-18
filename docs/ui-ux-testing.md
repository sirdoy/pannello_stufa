# UI/UX Testing Guide - Playwright

Suite completa di test Playwright per verificare solidità, uniformità e accessibilità dell'UI/UX.

## 🎯 Obiettivi

Questa suite di test E2E garantisce:

1. **Contrasto WCAG AA**: Tutti i testi sono leggibili
2. **Uniformità Componenti**: Design system coerente
3. **Responsive Design**: Funziona su tutti i dispositivi
4. **Dark Mode**: Tema scuro perfettamente integrato
5. **Accessibilità**: ARIA compliant e keyboard navigation

## 📁 Struttura File

```
e2e/
├── utils/
│   └── contrast.js          # WCAG contrast calculator
├── contrast.spec.js         # Test contrasto colori
├── component-uniformity.spec.js  # Test uniformità design
├── responsive.spec.js       # Test responsive
├── dark-mode.spec.js        # Test dark mode
└── accessibility.spec.js    # Test accessibilità ARIA

playwright.config.js         # Configurazione Playwright
```

## 🚀 Quick Start

```bash
# Installa browser (prima volta)
npx playwright install --with-deps

# Esegui tutti i test
npm run test:e2e

# Esegui con UI interattiva
npm run test:e2e:ui

# Debug mode
npm run test:e2e:debug

# Visualizza report
npm run test:e2e:report
```

## 🎨 Test Contrasto Colori (WCAG AA)

**File**: `e2e/contrast.spec.js`

### Cosa testa

- ✅ Testo normale: minimo 4.5:1 contrast ratio
- ✅ Testo grande (headings): minimo 3:1 contrast ratio
- ✅ Tutti gli elementi testuali (button, card, banner, link, label)
- ✅ Light mode e dark mode
- ✅ Elementi critici (badge, errori, warning)

### Utility Contrast

```javascript
import { testElementContrast } from './utils/contrast.js';

const result = await testElementContrast(element, { isLargeText: false });

// result = {
//   ratio: 5.2,              // Contrast ratio
//   passes: true,            // WCAG AA pass
//   color: 'rgb(0, 0, 0)',
//   backgroundColor: 'rgb(255, 255, 255)'
// }
```

### Esempio Output

```
✓ Button "Accendi Stufa" passes contrast - Ratio: 7.2:1
✗ Card text "Status" fails contrast - Ratio: 3.8:1 (need 4.5:1)
  Color: rgb(100, 100, 100)
  Background: rgb(255, 255, 255)
```

## 🧩 Test Uniformità Componenti

**File**: `e2e/component-uniformity.spec.js`

### Cosa testa

**Button Uniformity**
- ✅ Border radius consistente (max 2-3 variazioni)
- ✅ Padding uniforme
- ✅ Hover states presenti
- ✅ Primary buttons styling coerente

**Card Uniformity**
- ✅ Liquid glass effect su tutte le card
- ✅ Border radius uniforme
- ✅ Padding consistente
- ✅ Shadow o border per profondità

**Banner Uniformity**
- ✅ Struttura consistente
- ✅ Warning banners con colori gialli
- ✅ Error banners con colori rossi

**Typography**
- ✅ Font family uniforme per headings
- ✅ Font size consistente per body text (max 2 variazioni)
- ✅ Line height uniforme

**Spacing**
- ✅ Gap consistente tra card
- ✅ Padding sezioni uniforme

## 📱 Test Responsive Design

**File**: `e2e/responsive.spec.js`

### Viewport Testati

- **Mobile**: 375px (iPhone SE)
- **Tablet**: 768px (iPad)
- **Desktop**: 1920px (Full HD)

### Cosa testa

**Mobile (375px)**
- ✅ Card stack verticalmente
- ✅ Navigation accessibile
- ✅ Button touch-friendly (min 44x44px)
- ✅ Testo senza overflow
- ✅ Card width appropriato (300-400px)

**Tablet (768px)**
- ✅ Layout adattivo (1-2 colonne)
- ✅ Navigation fully visible
- ✅ Margin appropriato

**Desktop (1920px)**
- ✅ Utilizzo spazio orizzontale
- ✅ Content centered con max-width
- ✅ Navigation espansa
- ✅ Hover states funzionanti

**Breakpoint Transitions**
- ✅ Layout si adatta senza scroll orizzontale
- ✅ Stesso numero di card su tutti i viewport
- ✅ Immagini scalano correttamente

## 🌓 Test Dark Mode & Liquid Glass

**File**: `e2e/dark-mode.spec.js`

### Cosa testa

**Theme Switching**
- ✅ Light mode default con background chiaro
- ✅ Dark mode con background scuro
- ✅ Theme toggle button su `/settings/theme`
- ✅ Tutte le card hanno dark background consistente

**Liquid Glass Effect**
- ✅ Backdrop-filter blur presente
- ✅ Background semi-trasparente (rgba alpha < 1)
- ✅ Border o shadow per depth
- ✅ Glass effect su button
- ✅ Effect persiste durante scroll

**Visual Consistency**
- ✅ Layout preservato durante theme change
- ✅ Interactive elements non si rompono
- ✅ Tutte le pagine supportano dark mode
- ✅ Glass effect consistente su tutte le pagine

## ♿ Test Accessibilità (ARIA)

**File**: `e2e/accessibility.spec.js`

### Cosa testa

**ARIA Labels & Roles**
- ✅ Button con accessible name (text, aria-label, title)
- ✅ Link con testo descrittivo
- ✅ Form input con label associato
- ✅ Immagini con alt text
- ✅ Status message con role="status" o role="alert"
- ✅ Navigation con landmark `<nav>`
- ✅ Main content con `<main>`

**Keyboard Navigation**
- ✅ Tab order logico (top→bottom, left→right)
- ✅ No keyboard traps
- ✅ Button attivabili con Enter
- ✅ Focus visibile (outline, box-shadow, border)
- ✅ Modal trap focus quando aperto
- ✅ Skip to main content link (nice-to-have)

**Semantic HTML**
- ✅ Heading hierarchy corretto (h1 → h2 → h3, no skip)
- ✅ Liste con `<ul>`/`<ol>` + `<li>`
- ✅ Button con `<button>`, non `<div role="button">`

**Screen Reader Support**
- ✅ Live regions con aria-live="polite" o "assertive"
- ✅ Icone con aria-label o aria-hidden
- ✅ Form error announced con role="alert"

## 🔧 Configurazione Playwright

**File**: `playwright.config.js`

### Browser Matrix

12 configurazioni totali:

| Browser  | Device  | Theme | Viewport       |
|----------|---------|-------|----------------|
| Chromium | Desktop | Light | 1280×720       |
| Chromium | Desktop | Dark  | 1280×720       |
| Firefox  | Desktop | Light | 1280×720       |
| Firefox  | Desktop | Dark  | 1280×720       |
| WebKit   | Desktop | Light | 1280×720       |
| WebKit   | Desktop | Dark  | 1280×720       |
| Chromium | Mobile  | Light | 375×667 (Pixel 5) |
| Chromium | Mobile  | Dark  | 375×667        |
| WebKit   | Mobile  | Light | 375×812 (iPhone 12) |
| WebKit   | Mobile  | Dark  | 375×812        |
| WebKit   | Tablet  | Light | 1024×1366 (iPad Pro) |
| WebKit   | Tablet  | Dark  | 1024×1366      |

### Opzioni

- **Timeout**: 30 secondi per test
- **Retries**: 2 in CI, 0 in locale
- **Screenshot**: Solo su failure
- **Video**: Solo su failure
- **Trace**: Solo su retry

## 📊 Report

### HTML Report

Dopo l'esecuzione:

```bash
npm run test:e2e:report
```

Include:
- ✅ Test passed/failed per browser
- 📸 Screenshot su failure
- 🎬 Video replay su failure
- 📊 Timeline esecuzione
- 🔍 Trace viewer per debug

### JSON Report

Disponibile in `playwright-report/results.json`

## 🐛 Troubleshooting

### Test falliscono per timeout

```javascript
// In playwright.config.js
timeout: 60 * 1000  // Aumenta a 60s
```

### Browser non installati

```bash
npx playwright install --with-deps chromium firefox webkit
```

### Contrasto fallisce ma sembra corretto

Verifica il background ereditato:

```javascript
// La utility risale il DOM per trovare il primo background non trasparente
const backgroundColor = await element.evaluate(el => {
  let current = el;
  let bg = window.getComputedStyle(current).backgroundColor;

  while (bg === 'rgba(0, 0, 0, 0)' && current.parentElement) {
    current = current.parentElement;
    bg = window.getComputedStyle(current).backgroundColor;
  }

  return bg;
});
```

### Dark mode non si applica

```javascript
// Verifica emulateMedia in beforeEach
await page.emulateMedia({ colorScheme: 'dark' });
await page.waitForTimeout(500); // Attendi theme application
```

## 🎯 Best Practices

### Quando eseguire

✅ **Sempre prima di commit**
- Modifiche UI/styling
- Nuovi componenti
- Refactoring CSS

✅ **Prima di ogni release**
- Full test suite
- Tutti i browser
- Screenshot comparison

✅ **Durante development**
- UI mode (`npm run test:e2e:ui`) per iterare velocemente
- Debug mode per investigare failure

### Writing New Tests

```javascript
test('Card has consistent border radius', async ({ page }) => {
  await page.goto('/');
  const cards = page.locator('[class*="glass"]');

  const borderRadii = new Set();
  const count = await cards.count();

  for (let i = 0; i < count; i++) {
    const radius = await cards.nth(i).evaluate(el =>
      window.getComputedStyle(el).borderRadius
    );
    borderRadii.add(radius);
  }

  expect(borderRadii.size).toBeLessThanOrEqual(2);
});
```

## 🚀 CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload Report
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## 📈 Metrics & Goals

### Current Coverage

- **Contrast**: 100% text elements
- **Components**: Button, Card, Banner, Typography
- **Responsive**: Mobile, Tablet, Desktop
- **Dark Mode**: All pages
- **Accessibility**: ARIA, Keyboard, Semantic HTML

### Success Criteria

- ✅ 100% WCAG AA compliance
- ✅ <3 border radius variations
- ✅ <2 font size variations
- ✅ No horizontal scroll on any viewport
- ✅ All buttons min 44px on mobile
- ✅ All headings follow hierarchy
- ✅ Zero keyboard traps

## 📚 Resources

- [Playwright Docs](https://playwright.dev)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

---

**Last Updated**: 2025-11-17
**Playwright Version**: 1.56.1
**Test Files**: 5 (contrast, uniformity, responsive, dark-mode, accessibility)
**Total Test Cases**: ~80 tests across 12 browser configurations
