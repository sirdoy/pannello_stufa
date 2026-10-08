# Testing

Testing completo: Unit test (Jest) + E2E (Playwright).

## Quick Start

```bash
npm test                  # Unit tests
npm run test:coverage     # Con coverage report
npm run test:e2e          # E2E (build prod + Playwright)
npm run test:e2e:ui       # E2E con UI interattiva
```

---

## Unit Testing (Jest)

### Struttura

```text
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

### Suite

| Cartella | Contenuto |
|----------|-----------|
| `tests/smoke/` | caricamento pagine, dashboard EmberGlass, sheet, tab bar, stanze, automazioni, splash, design system |
| `tests/features/` | login e API key (route stubbate), pagine `/stove` e `/thermostat` in sola lettura |
| `tests/fixtures.ts` | `test` / `expect` da importare negli spec (mai da `@playwright/test`) |

I test girano contro il **Pi reale** (`HA_API_URL` di `.env.local`): nessun click che comanda device veri
(accendi/spegni, modalità), le azioni si verificano con `page.route()`.

### Comandi

```bash
npm run test:e2e                         # build prod + next start + suite (~1-2 min di test, 8 worker)
PW_SKIP_BUILD=1 npm run test:e2e         # riusa la build `.next` corrente (dopo un `npm run build`)
npx playwright test tests/smoke/x.spec.ts --repeat-each=3   # un file, ripetuto
npx playwright show-report               # report HTML (non si apre da solo)
```

### Configurazione (`playwright.config.ts`, da **M39**)

- **Server = build di produzione** (`npm run build && npm run start`), non `next dev`: con Turbopack + React
  Compiler il dev server impiega 60-90 s per compilare `/` e 10-20 s per ogni route, e i worker vanno in timeout.
  Se sulla porta 3000 gira già un server viene riusato: assicurarsi che sia una build aggiornata.
- **Login reale, un login per worker** (`tests/fixtures.ts`): il backend ruota il refresh token a ogni refresh e
  revoca la sessione se ne vede riusato uno vecchio (access token 15 min). Uno `storageState` unico condiviso da
  tutti i test si rompe appena la suite supera i 15 min (401 a cascata); per worker la sessione viene risalvata
  dopo ogni test con il token ruotato.
- `BYPASS_AUTH` / `TEST_MODE` sono forzati a `false` per runner e server, anche se `.env.local` li abilita per lo
  sviluppo locale: altrimenti niente login reale e `/api/ws-token` risponde 401 sulla build prod.
- `E2E_ALLOW_DEBUG_PAGES=true` (solo nel webServer Playwright, mai su Vercel) serve le pagine `/debug/*`, che il
  middleware blocca in produzione.
- `serviceWorkers: 'block'`: il service worker della PWA fa crashare il renderer di `chromium-headless-shell`.
- Worker di default (metà dei core): 4 worker sono risultati più lenti, non più stabili. Il collo di bottiglia è
  il Pi: run ravvicinati in serie lo rallentano (login dei worker in timeout), lasciare qualche minuto tra un run
  completo e l'altro.

### Diagnosi di un errore di rete in console

Molte smoke falliscono su qualunque `console.error`, e Chromium scrive solo
`Failed to load resource: the server responded with a status of 429` senza URL. Per sapere quale richiesta è,
aggiungere temporaneamente un listener nella fixture `context` di `tests/fixtures.ts` e leggere l'output del run
(solo status e pathname, mai header o corpo):

```ts
context.on('response', (r) => {
  if (r.status() >= 400) console.log(`DIAG ${r.status()} ${new URL(r.url()).pathname}`);
});
```

Il backend limita solo le route `/auth/*` (slowapi, bucket = digest del Bearer): un `429` nelle smoke viene da lì,
di solito `/api/ws-token` (60/min per sessione, una chiamata a ogni caricamento di pagina). Da **M63**: i worker
fanno login nello stesso secondo con lo stesso utente e ricevevano lo stesso JWT, quindi un solo bucket per tutti;
ora ogni access token ha un `jti` casuale. Conferma sul Pi:
`journalctl -u homeassistant.service --since '10 min ago' | grep -c '" 429'`.

### Account di test

Login dal form `/auth/login` con l'account `test` sul Pi (`E2E_TEST_USER_EMAIL` / `E2E_TEST_USER_PASSWORD` in
`.env.local`), non admin: le pagine admin-only (es. `/settings/api-keys`) vanno stubbate con `page.route()`.
Regole sui segreti: `../.claude/rules/playwright-secrets.md`.

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

- **Server Components**: Non testabili con Jest (usa E2E)
- **Firebase**: Completamente mockato (no real DB)

---

## Workflow

1. **Development**: `npm run test:watch`
2. **Pre-commit**: `npm test`
3. **Pre-push**: `npm run test:coverage`
4. **CI/CD**: `npm run test:ci`
