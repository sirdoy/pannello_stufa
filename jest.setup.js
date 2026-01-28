// Mock react-dom FIRST (before testing-library loads it)
// This ensures createPortal renders inline in tests
jest.mock('react-dom', () => {
  const actualReactDOM = jest.requireActual('react-dom');
  return {
    ...actualReactDOM,
    // Render portal content inline instead of to document.body
    // This fixes React 19 + Next.js 16 portal components not rendering in testing-library container
    createPortal: (node) => node,
  };
});

// Learn more: https://github.com/testing-library/jest-dom
require('@testing-library/jest-dom');

// Configure testing-library for React 19 compatibility
const { configure, waitFor } = require('@testing-library/react');
configure({
  // React 19: Increase timeout for async rendering (portals, Suspense, etc.)
  asyncUtilTimeout: 3000,
  // Enable automatic waitFor after render for components with useEffect
  reactStrictMode: true,
});

// React 19 + Next.js 16: Portal components fixed with SSR-safe pattern
// Components check `typeof jest !== 'undefined'` to skip mounted delay in tests

// Polyfill for React 19 act compatibility
// React 19 removed act from react-dom/test-utils, but testing-library still expects it
global.IS_REACT_ACT_ENVIRONMENT = true;

// Fix for React 19 + Next.js 16: Simulate client-side environment for portals
// Portal components use "mounted" pattern (set to true after useEffect runs)
// In test environment, we need to simulate that we're already client-side mounted
// Solution: Set global flag that components can check
global.__TEST_ENVIRONMENT__ = true;
global.__CLIENT_SIDE_MOUNTED__ = true;

// Add React.act polyfill for React 19
// Standalone implementation that doesn't create circular dependencies
const React = require('react');
if (!React.act) {
  React.act = function (callback) {
    try {
      const result = callback();
      // If it's a promise, wait for it
      if (result !== null && typeof result === 'object' && typeof result.then === 'function') {
        return result.then(
          (value) => value,
          (error) => {
            throw error;
          }
        );
      }
      // Otherwise return the result directly
      return Promise.resolve(result);
    } catch (error) {
      return Promise.reject(error);
    }
  };
}

// Mock environment variables for testing
process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-api-key';
process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'test.firebaseapp.com';
process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL = 'https://test.firebaseio.com';
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'test-project';
process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'test.appspot.com';
process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = '123456789';
process.env.NEXT_PUBLIC_FIREBASE_APP_ID = 'test-app-id';
process.env.CRON_SECRET = 'test-secret';

// Mock window.matchMedia (only in jsdom environment)
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // Deprecated
      removeListener: jest.fn(), // Deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
};

// Mock Pointer Capture API (required for Radix UI Select)
// JSDOM doesn't support Pointer Capture API, so we need to polyfill it
if (typeof window !== 'undefined' && typeof Element !== 'undefined') {
  Element.prototype.hasPointerCapture = Element.prototype.hasPointerCapture || function() {
    return false;
  };
  Element.prototype.setPointerCapture = Element.prototype.setPointerCapture || function() {};
  Element.prototype.releasePointerCapture = Element.prototype.releasePointerCapture || function() {};
  Element.prototype.scrollIntoView = Element.prototype.scrollIntoView || function() {};
}

// Mock ResizeObserver (required for Radix UI positioning)
global.ResizeObserver = class ResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock DOMRect (required for Radix floating UI)
global.DOMRect = global.DOMRect || class DOMRect {
  constructor(x = 0, y = 0, width = 0, height = 0) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.top = y;
    this.right = x + width;
    this.bottom = y + height;
    this.left = x;
  }
  static fromRect(other) {
    return new DOMRect(other.x, other.y, other.width, other.height);
  }
  toJSON() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }
};

// Mock getBoundingClientRect to return a valid DOMRect
if (typeof Element !== 'undefined') {
  const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;
  Element.prototype.getBoundingClientRect = function() {
    try {
      return originalGetBoundingClientRect.call(this);
    } catch {
      return new DOMRect(0, 0, 0, 0);
    }
  };
}

// Polyfill Request for API route tests
if (typeof Request === 'undefined') {
  global.Request = class Request {
    constructor(url, init) {
      this.url = url;
      this.method = init?.method || 'GET';
      this.headers = init?.headers || {};
      this.body = init?.body;
    }
  };
}

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock Firebase to prevent initialization issues
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(() => []),
}));

jest.mock('firebase/database', () => ({
  getDatabase: jest.fn(),
  ref: jest.fn(),
  set: jest.fn(),
  get: jest.fn(),
  onValue: jest.fn(),
  push: jest.fn(),
  orderByChild: jest.fn(),
  query: jest.fn(),
  limitToLast: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  onSnapshot: jest.fn(),
}));

// Mock Auth0
jest.mock('@auth0/nextjs-auth0', () => ({
  getSession: jest.fn(),
  withApiAuthRequired: jest.fn((handler) => handler),
  withPageAuthRequired: jest.fn((component) => component),
  handleAuth: jest.fn(),
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  })),
  usePathname: jest.fn(() => '/'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
  useParams: jest.fn(() => ({})),
}));

// Mock Next.js server (updated for Next.js 16)
// Use mockImplementation to survive jest.clearAllMocks()
const nextResponseJsonImpl = (body, init) => {
  const response = {
    status: init?.status || 200,
    headers: new Headers(init?.headers || {}),
    json: async () => body,
  };
  return response;
};

// Create NextResponse as a constructor function with static methods
function NextResponseMock(body, init) {
  return {
    body,
    status: init?.status || 200,
    headers: new Headers(init?.headers || {}),
    json: async () => body,
  };
}

// Add static json method
NextResponseMock.json = jest.fn().mockImplementation(nextResponseJsonImpl);

jest.mock('next/server', () => ({
  __esModule: true,
  NextResponse: NextResponseMock,
  default: { NextResponse: NextResponseMock },
}));

// Reset all mocks after each test
afterEach(() => {
  jest.clearAllMocks();

  // Restore NextResponse.json implementation after clearAllMocks
  if (NextResponseMock.json.mockImplementation) {
    NextResponseMock.json.mockImplementation(nextResponseJsonImpl);
  }

  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
});

// ===== ACCESSIBILITY TESTING (jest-axe) =====
// Import and extend jest-axe matchers for a11y assertions
const { toHaveNoViolations, configureAxe } = require('jest-axe');
expect.extend(toHaveNoViolations);

// Configure axe for better test stability in JSDOM
// Note: Color contrast checks are disabled because JSDOM doesn't compute styles accurately
const configuredAxe = configureAxe({
  rules: {
    // Disable rules that have known issues in JSDOM
    'color-contrast': { enabled: false },
  },
});

// Export configured axe for test files that need custom configuration
global.axe = configuredAxe;

// Helper for jest-axe with fake timers (axe-core uses setTimeout internally)
// Usage: await runAxeWithRealTimers(container)
global.runAxeWithRealTimers = async (container) => {
  // If fake timers are active, temporarily switch to real timers
  const isUsingFakeTimers = typeof jest !== 'undefined' && jest.isFakeTimers && jest.isFakeTimers();

  if (isUsingFakeTimers) {
    jest.useRealTimers();
  }

  const { axe } = require('jest-axe');
  const results = await axe(container);

  if (isUsingFakeTimers) {
    jest.useFakeTimers();
  }

  return results;
};
