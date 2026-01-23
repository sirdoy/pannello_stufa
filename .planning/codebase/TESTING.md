# Testing Patterns

**Analysis Date:** 2026-01-23

## Test Framework

**Runner:**
- Jest 30.2.0
- Config: `jest.config.js` (Next.js configured Jest)
- Environment: `jest-environment-jsdom` for component testing
- Node environment: `@jest-environment node` comment for server-side tests

**Assertion Library:**
- Jest built-in matchers
- Testing Library assertions via `@testing-library/jest-dom`
- Custom matchers: `toBeInTheDocument()`, `toHaveClass()`, `toBeDisabled()`

**Run Commands:**
```bash
npm test                  # Run all tests matching pattern
npm run test:watch       # Watch mode (re-run on file changes)
npm run test:coverage    # Run with coverage report (70% threshold)
npm run test:ci          # CI mode: maxWorkers=2, coverage, no watch
```

## Test File Organization

**Location:**
- Co-located in `__tests__` folders next to source code
- Naming pattern: `[SourceFile].test.js` (e.g., `Button.test.js` for `Button.js`)
- Directory structure mirrors source: `app/components/ui/__tests__/Button.test.js`

**Naming Convention:**
```
app/
├── components/
│   ├── ui/
│   │   ├── Button.js
│   │   └── __tests__/
│   │       └── Button.test.js          # Tests for Button.js
│   ├── navigation/
│   │   ├── Navbar.js
│   │   └── __tests__/
│   │       └── DropdownComponents.test.js
├── hooks/
│   ├── useVersionCheck.js
│   └── __tests__/
│       └── useVersionCheck.test.js
├── context/
│   ├── VersionContext.js
│   └── __tests__/
│       └── VersionContext.test.js
lib/
├── core/
│   ├── apiResponse.js
│   ├── apiErrors.js
│   └── __tests__/
│       ├── apiResponse.test.js
│       ├── apiErrors.test.js
│       └── requestParser.test.js
```

**Test Count:**
- Current: 145+ tests
- Coverage target: 70% (enforced in `collectCoverageFrom` and `coverageThreshold`)

## Test Structure

**Suite Organization:**
```javascript
describe('Button Component', () => {
  // Nested describe for logical grouping
  describe('Rendering', () => {
    test('renders button with children', () => {
      // Arrange
      render(<Button>Click me</Button>);

      // Act
      const button = screen.getByRole('button');

      // Assert
      expect(button).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    test('renders primary variant by default', () => {
      render(<Button>Primary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-ember-500');
    });
  });
});
```

**Setup & Teardown:**
```javascript
beforeEach(() => {
  // Run before each test
  jest.clearAllMocks();
  localStorage.clear();
});

afterEach(() => {
  // Run after each test (automatic in jest.setup.js)
  jest.clearAllMocks();
});

beforeAll(() => {
  // Run once before all tests in suite
});

afterAll(() => {
  // Run once after all tests in suite
});
```

**Assertion Patterns:**
```javascript
// Component rendering
expect(screen.getByRole('button')).toBeInTheDocument();
expect(button).toHaveTextContent('Click me');
expect(button).toHaveClass('bg-ember-500');

// State & props
expect(button).toBeDisabled();
expect(input).toHaveValue('test value');
expect(component).toHaveAttribute('aria-label', 'Submit form');

// Mocks
expect(mockFunction).toHaveBeenCalled();
expect(mockFunction).toHaveBeenCalledTimes(1);
expect(mockFunction).toHaveBeenCalledWith('argument');

// DOM queries
expect(screen.queryByText('Not found')).not.toBeInTheDocument();
expect(screen.getAllByRole('button')).toHaveLength(3);
```

## Mocking

**Framework:** Jest mocks with `jest.mock()` and `jest.fn()`

**Module Mocking Pattern:**
```javascript
// Mock at top of file, BEFORE imports
jest.mock('@/lib/hue/hueApi');
jest.mock('@/lib/auth0', () => ({
  auth0: {
    getSession: jest.fn(),
  },
}));

// Then import mocked modules
import { discoverBridges } from '@/lib/hue/hueApi';
import { auth0 } from '@/lib/auth0';

describe('GET /api/hue/discover', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    auth0.getSession.mockResolvedValue(mockSession);
  });

  it('should return discovered bridges', async () => {
    const mockBridges = [
      { id: '001788fffe123456', internalipaddress: '192.168.1.100' }
    ];

    discoverBridges.mockResolvedValue(mockBridges);

    const response = await GET(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
```

**Jest Setup Mocks (Global):**
Global mocks in `jest.setup.js` that apply to all tests:

```javascript
// React-DOM Portal fix
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (node) => node,
}));

// Firebase mocks
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(() => []),
}));

jest.mock('firebase/database', () => ({
  ref: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
  update: jest.fn(),
  runTransaction: jest.fn(),
}));

// Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  })),
  usePathname: jest.fn(() => '/'),
}));

// Environment variables
process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-api-key';
```

**Mocking Implementation Examples:**

Resolving promises:
```javascript
getLatestVersion.mockResolvedValue(mockLatestVersion);
```

Rejecting promises:
```javascript
getLatestVersion.mockRejectedValue(new Error('API Error'));
```

Implementing custom behavior:
```javascript
firebase.runTransaction.mockImplementation((ref, updateFunction) => {
  const currentData = { currentHours: 10.0, targetHours: 50 };
  const result = updateFunction(currentData);
  return Promise.resolve({
    committed: true,
    snapshot: { val: () => result },
  });
});
```

## Fixtures and Factories

**Test Data Pattern:**
```javascript
// Define mock data at top of test file
const mockSession = {
  user: {
    sub: 'auth0|123',
    email: 'test@test.com'
  }
};

const mockBridges = [
  {
    id: '001788fffe123456',
    internalipaddress: '192.168.1.100',
  },
  {
    id: '001788fffe789abc',
    internalipaddress: '192.168.1.101',
  },
];

const mockLatestVersion = {
  version: '1.6.0',
  date: '2025-10-11',
  type: 'minor',
  changes: ['New feature'],
};
```

**Location:**
- Inline in test files (no separate fixtures folder)
- Defined at top of `describe()` block or in `beforeEach()`
- Use `const mockData = { ... }` pattern

## Coverage

**Requirements:** 70% threshold enforced
- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

**View Coverage:**
```bash
npm run test:coverage      # Generates coverage report
open coverage/lcov-report/index.html  # View HTML report
```

**Coverage Configuration (jest.config.js):**
```javascript
collectCoverageFrom: [
  'app/**/*.{js,jsx,ts,tsx}',
  'lib/**/*.{js,jsx,ts,tsx}',
  '!**/*.d.ts',
  '!**/node_modules/**',
  '!**/.next/**',
  '!**/coverage/**',
],

coverageThreshold: {
  global: {
    branches: 70,
    functions: 70,
    lines: 70,
    statements: 70,
  },
},
```

## Test Types

**Unit Tests:**
- Scope: Individual functions, components, hooks
- Approach: Isolate unit with mocks, test behavior
- Examples: `Button.test.js`, `formatHoursToHHMM()` function tests
- Assertion focus: Input → Output mapping

**Integration Tests:**
- Scope: Multiple modules working together
- Approach: Test real interactions (e.g., Firebase transactions)
- Examples: `maintenanceService.concurrency.test.js`, API route + error handler
- Assertion focus: Data flow through system

**E2E Tests:**
- Framework: Not in codebase (unit + integration used instead)
- Note: Project uses unit + integration tests, no E2E runner configured

## Common Patterns

**Async Testing - Hook Pattern:**
```javascript
import { renderHook, waitFor } from '@testing-library/react';
import { useVersionCheck } from '../useVersionCheck';

describe('useVersionCheck Hook', () => {
  test('detects newer version available', async () => {
    const mockLatestVersion = {
      version: '1.6.0',
      date: '2025-10-11',
      type: 'minor',
      changes: ['New feature']
    };

    getLatestVersion.mockResolvedValueOnce(mockLatestVersion);

    const { result } = renderHook(() => useVersionCheck());

    // Wait for async operation to complete
    await waitFor(() => {
      expect(result.current.hasNewVersion).toBe(true);
    });
  });
});
```

**Async Testing - Component Pattern:**
```javascript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('handles click events', async () => {
  const handleClick = jest.fn();
  const user = userEvent.setup();

  render(<Button onClick={handleClick}>Click me</Button>);
  const button = screen.getByRole('button');

  await user.click(button);
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

**Error Testing:**
```javascript
test('should handle API errors gracefully', async () => {
  const consoleError = jest.spyOn(console, 'error').mockImplementation();
  getLatestVersion.mockRejectedValueOnce(new Error('API Error'));

  const { result } = renderHook(() => useVersionCheck());

  await waitFor(() => {
    expect(consoleError).toHaveBeenCalled();
    expect(result.current.hasNewVersion).toBe(false);
  });

  consoleError.mockRestore();
});
```

**State Mutation in Tests:**
```javascript
import { act } from 'react';

test('dismisses modal and saves to localStorage', async () => {
  const { result } = renderHook(() => useVersionCheck());

  await waitFor(() => {
    expect(result.current.showWhatsNew).toBe(true);
  });

  // Use act() to wrap state mutations
  act(() => {
    result.current.dismissWhatsNew();
  });

  await waitFor(() => {
    expect(result.current.showWhatsNew).toBe(false);
  });

  expect(localStorage.getItem('lastSeenVersion')).toBe('1.5.0');
});
```

**API Route Testing Pattern:**
```javascript
describe('GET /api/health', () => {
  let mockRequest;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = new Request('http://localhost:3000/api/health');
    auth0.getSession.mockResolvedValue(mockSession);
  });

  it('should return 401 when not authenticated', async () => {
    auth0.getSession.mockResolvedValue(null);

    const response = await GET(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.code).toBe('UNAUTHORIZED');
  });

  it('should handle discovery errors gracefully', async () => {
    discoverBridges.mockRejectedValue(new Error('Network error'));

    const response = await GET(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });
});
```

**React Strict Mode Protection:**
```javascript
test('prevents double fetch in strict mode', async () => {
  getLatestVersion.mockResolvedValue(mockLatestVersion);

  // Render hook twice to simulate strict mode
  const { rerender } = renderHook(() => useVersionCheck());
  rerender();

  await waitFor(() => {
    // Should only call once despite double render
    expect(getLatestVersion).toHaveBeenCalledTimes(1);
  });
});
```

**Concurrency Testing (Firebase Transactions):**
```javascript
test('should handle concurrent calls safely with transaction retry', async () => {
  let attemptCount = 0;

  firebase.runTransaction.mockImplementation((ref, updateFunction) => {
    attemptCount++;

    // Simulate concurrent modification on first attempt
    if (attemptCount === 1) {
      const data = {
        currentHours: 10.0,
        targetHours: 50,
        lastUpdatedAt: new Date(Date.now() - 60000).toISOString(),
      };

      const result = updateFunction(data);

      // Second attempt with updated data from concurrent client
      return Promise.resolve()
        .then(() => {
          const updatedDataFromOtherClient = {
            currentHours: 10.02,
            targetHours: 50,
            lastUpdatedAt: new Date(Date.now() - 30000).toISOString(),
          };

          const finalResult = updateFunction(updatedDataFromOtherClient);
          return {
            committed: true,
            snapshot: { val: () => finalResult },
          };
        });
    }

    return Promise.resolve({
      committed: false,
      snapshot: null,
    });
  });

  const result = await trackUsageHours('WORK');

  expect(firebase.runTransaction).toHaveBeenCalled();
});
```

## What to Mock

**Always Mock:**
- External APIs (Hue, Netatmo, Firebase)
- Authentication (auth0)
- Next.js modules (next/navigation, next/server)
- Browser APIs (localStorage, window.matchMedia, IntersectionObserver)

**What NOT to Mock:**
- React and React DOM (use actual implementation)
- Utility functions under test
- Business logic of component being tested
- Internal state management (use userEvent for interactions)

## Special Considerations

**React 19 + Next.js 16 Compatibility:**
- Portal rendering: Mocked `react-dom.createPortal` to render inline (returns node directly)
- Act warnings: Global `IS_REACT_ACT_ENVIRONMENT = true` flag set in jest.setup.js
- Async timeout: `asyncUtilTimeout: 3000` in testing-library configuration for portal/Suspense

**Environment Setup:**
- Mock environment variables in jest.setup.js before tests run
- Test environment flag: `global.__TEST_ENVIRONMENT__ = true` for component-specific behavior
- All mocks reset via `jest.clearAllMocks()` in beforeEach()

---

*Testing analysis: 2026-01-23*
