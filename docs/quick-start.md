# Quick Start

Guida rapida per iniziare con il progetto.

## Prerequisites

- **Node.js**: 18+ (LTS recommended)
- **npm**: 9+
- **Git**: Latest version
- **Firebase Account**: Free tier OK
- **Account utente**: creato sul backend Pi (`scripts/create_user.py`), nessun account esterno richiesto

## Installation

### 1. Clone Repository

```bash
git clone <repository-url>
cd pannello-stufa
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```env
# Firebase (Client SDK)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your-vapid-key

# Firebase Admin (Server SDK)
FIREBASE_ADMIN_PROJECT_ID=your-project-id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Login session (first-party, utenti sul Pi DB)
SESSION_SECRET=use-openssl-rand-hex-32-to-generate

# Thermorossi API
THERMOROSSI_API_URL=https://api.thermorossi.com
THERMOROSSI_USERNAME=your-username
THERMOROSSI_PASSWORD=your-password

# Scheduler
CRON_SECRET=your-random-secret

# Admin
ADMIN_USER_ID=user:your-user-id
```

### 4. Firebase Setup

1. **Create Firebase Project**: https://console.firebase.google.com
2. **Enable Realtime Database**: Database → Create Database → Test mode
3. **Initialize Schema**: Use Firebase console to create base nodes:
   ```json
   {
     "stoveScheduler": {
       "mode": {
         "enabled": false,
         "semiManual": false,
         "returnToAutoAt": null
       }
     },
     "maintenance": {
       "currentHours": 0,
       "targetHours": 50,
       "lastCleanedAt": null,
       "needsCleaning": false,
       "lastUpdatedAt": null
     }
   }
   ```

### 5. User Setup

1. **Create user on the Pi**: `python scripts/create_user.py` (backend, DB SQLite)
2. **Login**: `/auth/login` (email/password), sessione via cookie `ps_session`

## Development

### Start Dev Server

```bash
npm run dev
```

Open http://localhost:3000

### Run Tests

```bash
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
```

### Build for Production

```bash
npm run build
```

### Start Production Server

```bash
npm run start
```

## Project Structure

```
pannello-stufa/
├── app/                      # Next.js 15 App Router
│   ├── api/                  # API Routes
│   ├── components/           # React Components
│   │   ├── ui/              # UI Components (Card, Button, etc.)
│   │   └── devices/         # Device-specific components
│   ├── context/             # React Context
│   └── hooks/               # Custom Hooks
├── lib/                      # Business Logic
│   ├── devices/             # Device registry
│   ├── netatmo/             # Netatmo integration
│   └── *.js                 # Services
├── docs/                     # Documentation
│   ├── systems/             # System docs
│   └── setup/               # Setup guides
├── public/                   # Static files
└── __tests__/               # Tests
```

## Common Commands

```bash
# Development
npm run dev              # Dev server (localhost:3000)
npm run build            # Production build
npm run start            # Production server
npm run lint             # ESLint check

# Testing
npm test                 # Run tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
npm run test:ci          # CI mode

# Firebase
node -e "require('./lib/changelogService').syncVersionHistoryToFirebase(require('./lib/version').VERSION_HISTORY)"

# Debugging
find app -name "*.js" -exec grep -l "useState" {} \;  # Find client components
```

## First Steps

### 1. Setup Authentication

1. Visit http://localhost:3000
2. Click "Login" (redirects to `/auth/login`)
3. Sign in with an account created on the Pi (`scripts/create_user.py`)

### 2. Configure Scheduler

1. Navigate to `/scheduler`
2. Click "Modalità Manuale" to enable scheduler
3. Add time intervals for each day

### 3. Configure Maintenance

1. Navigate to `/maintenance`
2. Set target hours (default: 50h)
3. System will auto-track usage

### 4. Setup Cronjob (Optional)

For automatic scheduler execution:

```bash
# Add to crontab
* * * * * curl -s "http://localhost:3000/api/scheduler/check?secret=YOUR_SECRET" > /dev/null
```

Or use external service (cron-job.org, EasyCron, etc.)

## External Integrations (Optional)

### Netatmo Thermostat

See [docs/setup/NETATMO-SETUP.md](./setup/netatmo-setup.md)

### Philips Hue Lights

See [docs/setup/HUE-SETUP.md](./setup/hue-setup.md)

### Push Notifications

See [docs/setup/NOTIFICATIONS-SETUP.md](./setup/notifications-setup.md)

## Troubleshooting

### Build Fails

```bash
# Clear cache and reinstall
rm -rf .next node_modules package-lock.json
npm install
npm run build
```

### Firebase Connection Error

Check:
1. `.env.local` has correct Firebase config
2. Firebase project exists and Realtime Database enabled
3. Database rules allow read/write (test mode)

### Login Fails

Check:
1. `SESSION_SECRET` set in `.env.local` (>= 32 caratteri)
2. Backend Pi raggiungibile (`HA_API_URL`) e utente esistente (`scripts/create_user.py`)
3. `BYPASS_AUTH` / `NEXT_PUBLIC_BYPASS_AUTH` a `false` (a meno di dev bypass intenzionale)

### Tests Fail

```bash
# Update snapshots
npm test -- -u

# Clear cache
npm test -- --clearCache
```

## Next Steps

- [Architecture](./architecture.md) - Understand project structure
- [API Routes](./api-routes.md) - API documentation
- [UI Components](./ui-components.md) - Component library
- [Versioning](./versioning.md) - Version management workflow
- [Troubleshooting](./troubleshooting.md) - Common issues

## Resources

- **Next.js Docs**: https://nextjs.org/docs
- **React Docs**: https://react.dev
- **Tailwind CSS**: https://tailwindcss.com
- **Firebase Docs**: https://firebase.google.com/docs

---

**Last Updated**: 2025-10-21
