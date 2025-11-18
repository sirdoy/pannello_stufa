# E2E Tests - UI/UX Suite

Test Playwright per verifica solidità e uniformità UI/UX.

## 📁 File

| File | Descrizione | Test |
|------|-------------|------|
| `contrast.spec.js` | WCAG AA contrast | 15+ tests × 12 configs |
| `component-uniformity.spec.js` | Design consistency | 20+ tests × 12 configs |
| `responsive.spec.js` | Responsive design | 15+ tests × 12 configs |
| `dark-mode.spec.js` | Dark mode & glass | 12+ tests × 12 configs |
| `accessibility.spec.js` | ARIA & keyboard | 18+ tests × 12 configs |
| `utils/contrast.js` | WCAG calculator | Utility functions |

**Total**: ~80 test cases × 12 browser configurations = **~960 test runs**

## 🚀 Quick Run

```bash
# Run all tests
npm run test:e2e

# Interactive mode
npm run test:e2e:ui

# View report
npm run test:e2e:report
```

## 📊 Test Matrix

12 configurations tested:

- **Browsers**: Chromium, Firefox, WebKit
- **Devices**: Desktop, Mobile (iPhone/Pixel), Tablet (iPad)
- **Themes**: Light, Dark

## ✅ What's Covered

- ✅ WCAG AA contrast (4.5:1 normal, 3:1 large text)
- ✅ Component uniformity (Button, Card, Banner, Typography)
- ✅ Responsive breakpoints (375px, 768px, 1920px)
- ✅ Dark mode + Liquid glass effect
- ✅ ARIA labels, roles, keyboard navigation
- ✅ Semantic HTML, heading hierarchy

## 📖 Full Documentation

See [docs/ui-ux-testing.md](../docs/ui-ux-testing.md) for complete guide.
