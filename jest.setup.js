// Learn more: https://github.com/testing-library/jest-dom
require('@testing-library/jest-dom');

// Polyfill for React 19 act compatibility
// React 19 removed act from react-dom/test-utils, but testing-library still expects it
global.IS_REACT_ACT_ENVIRONMENT = true;

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

// Mock Next.js server
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body, init) => {
      const response = {
        status: init?.status || 200,
        headers: new Headers(init?.headers || {}),
        json: async () => body,
      };
      return response;
    }),
  },
}));

// Reset all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
});
