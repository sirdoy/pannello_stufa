# Testing

Testing completo: Unit test (Jest) + E2E (Playwright).

## Quick Start

```bash
npm test                  # Unit tests
npm run test:coverage     # Con coverage report
npm run test:e2e          # E2E tests (con cleanup)
npm run test:e2e:ui       # E2E con UI interattiva
```

---

## Unit Testing (Jest)

### Struttura

```
├── lib/__tests__/              # Utility functions
├── app/components/ui/__tests__/ # Componenti UI
├── app/hooks/__tests__/        # Custom hooks
└── app/context/__tests__/      # Context providers
```

**Status**: 145+ test funzionanti | Coverage target: 70%

### Best Practices

```javascript
// Naming: describe + test pattern
describe('ComponentName', () => {
  describe('Feature', () => {
    test('should do X when Y', () => {
      // Arrange
      const user = userEvent.setup();
      render(<Component />);

      // Act
      await user.click(screen.getByRole('button'));

      // Assert
      expect(mockFn).toHaveBeenCalled();
    });
  });
});
```

### Mocking

```javascript
// Firebase (già mockato in jest.setup.js)
jest.mock('@/lib/firebase', () => ({
  getDatabase: jest.fn(),
  ref: jest.fn(),
}));

// Environment
process.env.NEXT_PUBLIC_API_KEY = 'test-key';
```

### Hook Testing

```javascript
import { renderHook, waitFor } from '@testing-library/react';

const { result } = renderHook(() => useMyHook());
await waitFor(() => expect(result.current.loaded).toBe(true));
```

### Context Testing

```javascript
const wrapper = ({ children }) => <Provider>{children}</Provider>;
const { result } = renderHook(() => useContext(), { wrapper });
```

---

## E2E Testing (Playwright)

### Test Suite

| Suite | File | Verifica |
|-------|------|----------|
| Contrasto WCAG | `contrast.spec.js` | 4.5:1 min, accessibilità |
| Uniformità | `component-uniformity.spec.js` | Stili consistenti |
| Responsive | `responsive.spec.js` | Mobile/Tablet/Desktop |
| Dark Mode | `dark-mode.spec.js` | Temi + Liquid Glass |
| Accessibilità | `accessibility.spec.js` | ARIA, keyboard nav |

### Comandi

```bash
npm run test:e2e          # Run + cleanup automatico
npm run test:e2e:headed   # Con browser visibile
npm run test:e2e:debug    # Step-by-step
npm run test:e2e:report   # Report HTML
npm run test:e2e:clean    # Pulizia manuale
```

### TEST_MODE

Bypassa Auth0 per test automatici:

```env
# .env.local (solo testing!)
TEST_MODE=true
```

**IMPORTANTE**: Riportare a `false` dopo i test!

### Theme Testing

```javascript
await page.addInitScript((theme) => {
  localStorage.setItem('user-theme', theme);
}, 'dark');
```

### Performance Target

- DOM Interactive: < 2000ms

---

## Coverage

```bash
npm run test:coverage
# Report: coverage/lcov-report/index.html
```

Threshold in `jest.config.js`: 70% (branches, functions, lines, statements)

---

## Troubleshooting

| Problema | Soluzione |
|----------|-----------|
| Cannot find module | Verifica alias in `jest.config.js` |
| localStorage undefined | Già mockata in `jest.setup.js` |
| Firebase errors | Già mockato globalmente |
| Test lenti | Aumenta timeout: `test('...', async () => {}, 10000)` |
| TEST_MODE non funziona | Riavvia dev server |

---

## Aggiungere Test

### Template Componente

```javascript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Component from '../Component';

describe('Component', () => {
  test('renders', () => {
    render(<Component />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  test('handles click', async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    render(<Component onClick={onClick} />);
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalled();
  });
});
```

### Template E2E

```javascript
// In test-e2e.mjs
await testPageWithTheme(context, 'http://localhost:3000/new-page', 'newpage', 'dark');
```

---

## Limitazioni Note

- **VersionContext**: 7 test con limitazioni JSDOM (`window.location`)
- **Server Components**: Non testabili con Jest (usa E2E)
- **Firebase**: Completamente mockato (no real DB)

---

## Workflow

1. **Development**: `npm run test:watch`
2. **Pre-commit**: `npm test`
3. **Pre-push**: `npm run test:coverage`
4. **CI/CD**: `npm run test:ci`
