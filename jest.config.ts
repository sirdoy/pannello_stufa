import nextJest from 'next/jest.js';
import type { Config } from 'jest';

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig: Config = {
  // Add more setup options before each test is run
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

  testEnvironment: 'jest-environment-jsdom',

  // Module name mapper for path aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    // Next.js 16: Redirect internal module imports to mocked version
    '^next/dist/server/web/exports/next-response$': '<rootDir>/__mocks__/next-server.ts',
  },

  // Test match patterns
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
    '!**/jest.config.js',
  ],

  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },

  // Transform files with the Next.js transformer
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['next/dist/build/swc/jest-transformer', {}],
  },

  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/out/',
    '<rootDir>/__tests__/__utils__/',
    '<rootDir>/tests/',   // Playwright .spec.ts files
    '<rootDir>/.claude/', // GSD worktree copies (duplicate mocks + haste collisions)
    '<rootDir>/.planning/', // GSD planning artifacts
  ],

  // Haste-map ignores: prevent duplicate manual mock + package.json collisions
  // when GSD worktrees live under .claude/worktrees/agent-*/. testPathIgnorePatterns
  // alone is not enough — haste still indexes for module resolution.
  modulePathIgnorePatterns: [
    '<rootDir>/.claude/',
    '<rootDir>/.planning/',
    '<rootDir>/.next/',
  ],

  // Watch-mode ignores: keep editor-based iteration snappy.
  watchPathIgnorePatterns: [
    '<rootDir>/.claude/',
    '<rootDir>/.planning/',
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
  ],

  // Cap worker count: 2 in CI (matches test:ci script), 50% of cores locally.
  // Override with `--maxWorkers=N` on the CLI when needed.
  maxWorkers: process.env.CI ? 2 : '50%',

  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(customJestConfig);
