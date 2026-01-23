# Technology Stack

**Analysis Date:** 2026-01-23

## Languages

**Primary:**
- JavaScript (ES2020) - Client components, utilities, and API routes
- TypeScript (ES2020) - Service worker, type definitions
- JSX - React component syntax throughout app

**Target Compatibility:**
- ES2020 (compiled to browser-compatible JavaScript)
- Node.js runtime for server operations

## Runtime

**Environment:**
- Node.js (via Next.js server runtime)
- Browser (client-side runtime)
- Web Workers (Service Worker - `app/sw.ts`)

**Package Manager:**
- npm
- Lockfile: `package-lock.json` (present)

## Frameworks

**Core:**
- Next.js 16.1.0 - Full-stack framework with App Router, API routes, middleware
- React 19.2.0 - UI library
- React DOM 19.2.0 - DOM rendering

**UI & Styling:**
- Tailwind CSS 4.1.18 - Utility-first CSS framework
- Lucide React 0.562.0 - Icon library
- @tailwindcss/postcss 4.1.18 - PostCSS processor for Tailwind

**Progressive Web App (PWA):**
- Serwist 9.0.0 - Service Worker library
- @serwist/next 9.0.0 - Next.js integration for PWA
- Service worker source: `app/sw.ts` → compiled to `public/sw.js`

**Authentication:**
- @auth0/nextjs-auth0 4.13.1 - Auth0 integration

**Backend/Database:**
- Firebase 12.8.0 - Client SDK (Realtime Database, Cloud Messaging)
- firebase-admin 13.6.0 - Admin SDK (server-side operations, push notifications)

**Media:**
- hls.js 1.6.15 - HLS video streaming (for camera feeds)

## Key Dependencies

**Critical:**
- next 16.1.0 - Application framework (required)
- firebase / firebase-admin - Data persistence and push notifications
- @auth0/nextjs-auth0 - User authentication and session management
- @serwist/next - PWA support (offline capability, background sync)

**Infrastructure:**
- autoprefixer 10.4.23 - CSS vendor prefix support
- postcss 8.5.6 - CSS transformation
- baseline-browser-mapping 2.9.15 - Browser compatibility mapping

## Build & Development Tools

**Build:**
- Next.js built-in Webpack (via `npm run build --webpack` flag for PWA compatibility)
- Turbopack (enabled in `next.config.mjs` for dev mode: `turbopack: {}`)
- SWC transformer (Next.js internal)

**Development:**
- Jest 30.2.0 - Test runner
- @testing-library/react 16.3.1 - Component testing utilities
- @testing-library/dom 10.4.0 - DOM testing utilities
- @testing-library/jest-dom 6.9.1 - Jest DOM matchers
- @testing-library/user-event 14.6.1 - User event simulation

**Linting & Code Quality:**
- ESLint 9 - JavaScript/TypeScript linting
- eslint-config-next 16.1.0 - Next.js-specific ESLint config
- @eslint/eslintrc 3 - ESLint configuration resolver

**Type Checking:**
- TypeScript (bundled with Next.js)
- @types/react 19.2.8 - React type definitions
- @types/jest 30.0.0 - Jest type definitions

**Testing Environment:**
- jest-environment-jsdom 30.2.0 - DOM environment for tests

## Configuration Files

**Build Configuration:**
- `next.config.mjs` - Next.js configuration (ES modules)
  - Serwist PWA setup
  - Remote image patterns for Gravatar and Google user photos
  - Turbopack enabled in dev, Webpack used for build (PWA compatibility)
  - React strict mode enabled
- `tsconfig.json` - TypeScript compiler options
  - Target: ES2020
  - Module resolution: bundler
  - Path aliases: `@/*` → root directory
  - Includes WebWorker types (for Service Worker)
- `postcss.config.mjs` - PostCSS configuration
  - @tailwindcss/postcss plugin
- `jest.config.js` - Jest test configuration
  - Setup file: `jest.setup.js`
  - Test environment: jsdom
  - Coverage thresholds: 70% (branches, functions, lines, statements)
  - Module name mapper: `@/` path alias

**Environment Configuration:**
- `.env.example` - Template for required environment variables
- `.env.local` - Development secrets (Git-ignored)

**Other:**
- `firebase.json` - Firebase CLI configuration
- `vercel.json` - Vercel deployment configuration
- `database.rules.json` - Firebase Realtime Database security rules

## Platform Requirements

**Development:**
- Node.js with npm
- Port 3000 (default Next.js dev server)
- Port 3001 (Netatmo OAuth redirect in development)
- Modern browser with Web Worker support (for PWA)

**Production:**
- Vercel (inferred from `vercel.json` and Vercel OIDC token in env)
- Node.js runtime environment
- Firebase project (backend data and messaging)
- Auth0 tenant for authentication

## Scripts

```bash
npm run dev              # Start Next.js dev server (localhost:3000)
npm run build            # Build for production (with --webpack for PWA)
npm start                # Start production server
npm test                 # Run Jest tests
npm test:watch           # Jest in watch mode
npm test:coverage        # Jest with coverage report
npm test:ci              # Jest for CI (parallel mode: 2 workers)
npm run lint             # Run ESLint
npm run migrate:schedules      # Data migration script (Node.js)
npm run migrate:schedules:dry-run  # Preview migration without changes
```

---

*Stack analysis: 2026-01-23*
