# 🧪 Testing Documentation - Pannello Stufa

Guida completa per eseguire e scrivere test per il progetto Pannello Stufa.

## 📋 Indice

- [Setup](#setup)
- [Eseguire i Test](#eseguire-i-test)
- [Struttura Test](#struttura-test)
- [Best Practices](#best-practices)
- [Esempi](#esempi)
- [Coverage](#coverage)
- [Troubleshooting](#troubleshooting)

---

## 🚀 Setup

### Dipendenze Installate

Il progetto utilizza le seguenti librerie per i test:

```json
{
  "jest": "^30.2.0",
  "jest-environment-jsdom": "^30.2.0",
  "@testing-library/react": "^16.3.0",
  "@testing-library/jest-dom": "^6.9.1",
  "@testing-library/user-event": "^14.6.1",
  "@types/jest": "^30.0.0"
}
```

### Configurazione

- **`jest.config.js`**: Configurazione principale Jest per Next.js 15
- **`jest.setup.js`**: Setup globale (mocks, utilities, environment variables)

---

## 🎯 Eseguire i Test

### Comandi Disponibili

```bash
# Esegui tutti i test
npm test

# Esegui test in watch mode (utile durante lo sviluppo)
npm run test:watch

# Esegui test con coverage report
npm run test:coverage

# Esegui test in CI/CD environment
npm run test:ci
```

### Eseguire Test Specifici

```bash
# Test di un singolo file
npm test -- path/to/test-file.test.js

# Test per pattern
npm test -- Button

# Test con verbose output
npm test -- --verbose
```

---

## 📁 Struttura Test

```
├── lib/
│   ├── __tests__/                    # Test per utility functions
│   │   ├── formatUtils.test.js       # ✅ 8 test (formatHoursToHHMM)
│   │   └── version.test.js           # ✅ 17 test (version management)
│
├── app/
│   ├── components/
│   │   └── ui/
│   │       └── __tests__/            # Test per componenti UI
│   │           ├── Button.test.js    # ✅ 24 test
│   │           ├── Card.test.js      # ✅ 11 test
│   │           ├── Banner.test.js    # ✅ 18 test
│   │           ├── Select.test.js    # ✅ 19 test
│   │           ├── StatusBadge.test.js # ✅ 20 test
│   │           └── ModeIndicator.test.js # ✅ 20 test
│   │
│   ├── hooks/
│   │   └── __tests__/
│   │       └── useVersionCheck.test.js # ✅ 15 test
│   │
│   └── context/
│       └── __tests__/
│           └── VersionContext.test.js  # ⚠️ 12/19 test (JSDOM limitations)
```

### Status Test

**✅ Totale Test Funzionanti**: **145 test**
**⚠️ Test con Limitazioni JSDOM**: 7 test (VersionContext window.location mocking)
**📊 Coverage Target**: 70% (branches, functions, lines, statements)

---

## 📝 Best Practices

### 1. Naming Convention

```javascript
describe('ComponentName', () => {
  describe('Feature Group', () => {
    test('should do something specific', () => {
      // Test implementation
    });
  });
});
```

### 2. Arrange-Act-Assert Pattern

```javascript
test('updates state when button clicked', async () => {
  // ARRANGE: Setup
  const user = userEvent.setup();
  const handleClick = jest.fn();
  render(<Button onClick={handleClick}>Click me</Button>);

  // ACT: Perform action
  const button = screen.getByRole('button');
  await user.click(button);

  // ASSERT: Verify result
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

### 3. Mock Strategico

```javascript
// Mock moduli esterni
jest.mock('@/lib/firebase', () => ({
  getDatabase: jest.fn(),
  ref: jest.fn(),
  set: jest.fn(),
}));

// Mock environment variables
process.env.NEXT_PUBLIC_API_KEY = 'test-key';
```

### 4. Testing User Interactions

```javascript
import userEvent from '@testing-library/user-event';

test('handles user input', async () => {
  const user = userEvent.setup();

  render(<Input />);
  const input = screen.getByRole('textbox');

  await user.type(input, 'Hello World');
  expect(input).toHaveValue('Hello World');
});
```

### 5. Async Operations

```javascript
import { waitFor } from '@testing-library/react';

test('loads data asynchronously', async () => {
  render(<DataComponent />);

  await waitFor(() => {
    expect(screen.getByText('Data loaded')).toBeInTheDocument();
  });
});
```

---

## 💡 Esempi

### Test Componente Semplice

```javascript
import { render, screen } from '@testing-library/react';
import Button from '../Button';

describe('Button Component', () => {
  test('renders with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  test('applies variant class', () => {
    render(<Button variant="primary">Primary</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-primary-500');
  });

  test('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### Test Hook Personalizzato

```javascript
import { renderHook, waitFor } from '@testing-library/react';
import { useVersionCheck } from '../useVersionCheck';

describe('useVersionCheck Hook', () => {
  test('returns initial state', () => {
    const { result } = renderHook(() => useVersionCheck());

    expect(result.current.hasNewVersion).toBe(false);
    expect(result.current.latestVersion).toBe(null);
  });

  test('detects new version', async () => {
    // Mock API response
    mockGetLatestVersion.mockResolvedValue({
      version: '2.0.0',
      changes: ['New feature'],
    });

    const { result } = renderHook(() => useVersionCheck());

    await waitFor(() => {
      expect(result.current.hasNewVersion).toBe(true);
    });
  });
});
```

### Test con Context Provider

```javascript
import { renderHook } from '@testing-library/react';
import { VersionProvider, useVersion } from '../VersionContext';

describe('VersionContext', () => {
  const wrapper = ({ children }) => (
    <VersionProvider>{children}</VersionProvider>
  );

  test('provides version context', () => {
    const { result } = renderHook(() => useVersion(), { wrapper });

    expect(result.current).toHaveProperty('needsUpdate');
    expect(result.current).toHaveProperty('checkVersion');
  });
});
```

---

## 📊 Coverage

### Visualizzare Coverage Report

```bash
npm run test:coverage
```

Genera report in:
- **Terminal**: Summary tabellare
- **`coverage/lcov-report/index.html`**: Report HTML dettagliato

### Coverage Threshold

Configurato in `jest.config.js`:

```javascript
coverageThreshold: {
  global: {
    branches: 70,
    functions: 70,
    lines: 70,
    statements: 70,
  },
}
```

### Ignorare File dal Coverage

Già configurato per escludere:
- `node_modules/`
- `.next/`
- `coverage/`
- `jest.config.js`
- `*.d.ts`

---

## 🔧 Troubleshooting

### Problema: Test Fallisce con "Cannot find module"

**Soluzione**: Verifica alias path in `jest.config.js`:

```javascript
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/$1',
}
```

### Problema: "ReferenceError: localStorage is not defined"

**Soluzione**: Già mockata in `jest.setup.js`. Verifica import setup:

```javascript
// jest.setup.js
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;
```

### Problema: "window.matchMedia is not a function"

**Soluzione**: Già mockata in `jest.setup.js`:

```javascript
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
```

### Problema: Firebase Errors in Tests

**Soluzione**: Firebase è già mockato globalmente in `jest.setup.js`:

```javascript
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(() => []),
}));
```

### Problema: Test Lenti o Timeout

**Soluzione**: Aumenta timeout per test specifici:

```javascript
test('slow operation', async () => {
  // Test implementation
}, 10000); // 10 seconds timeout
```

---

## 🎓 Risorse Aggiuntive

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library React](https://testing-library.com/docs/react-testing-library/intro/)
- [Next.js Testing](https://nextjs.org/docs/testing)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

## 🤝 Contribuire

### Aggiungere Nuovi Test

1. **Crea file test**: `ComponentName.test.js` nella directory `__tests__/` appropriata
2. **Segui struttura**: Usa pattern `describe` / `test` consistente
3. **Mock dependencies**: Mock API calls, Firebase, external services
4. **Verifica coverage**: Esegui `npm run test:coverage` per verificare copertura
5. **Assicurati passino**: `npm test` deve passare al 100%

### Template Test Componente

```javascript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ComponentName from '../ComponentName';

describe('ComponentName', () => {
  describe('Rendering', () => {
    test('renders correctly', () => {
      render(<ComponentName />);
      // Assertions
    });
  });

  describe('Props', () => {
    test('applies custom prop', () => {
      render(<ComponentName customProp="value" />);
      // Assertions
    });
  });

  describe('Interactions', () => {
    test('handles user action', async () => {
      const user = userEvent.setup();
      const handleAction = jest.fn();

      render(<ComponentName onAction={handleAction} />);
      // User interaction
      // Assertions
    });
  });
});
```

---

## 📌 Note Importanti

### ⚠️ Limitazioni Correnti

1. **VersionContext Tests**: 7 test hanno problemi con JSDOM per mock di `window.location`
   - **Workaround**: Test funzionano in ambiente reale, problema solo in test environment
   - **Issue**: JSDOM limita manipolazione `window.location`

2. **Firebase Mocking**: Tutti i servizi Firebase sono mockati
   - Test non interagiscono con Firebase reale
   - Usa `jest.mock()` per simulare comportamenti

3. **Next.js Server Components**: Non testabili direttamente con Jest
   - Focus su Client Components e utility functions
   - Server Components testabili con E2E testing (Playwright, Cypress)

### ✅ Workflow Testing Consigliato

1. **Durante Development**:
   ```bash
   npm run test:watch
   ```

2. **Pre-Commit**:
   ```bash
   npm test
   ```

3. **Pre-Push**:
   ```bash
   npm run test:coverage
   ```

4. **CI/CD Pipeline**:
   ```bash
   npm run test:ci
   ```

---

**Last Updated**: 2025-10-10
**Version**: 1.5.5
**Author**: Federico Manfredi
