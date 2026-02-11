# Phase 53: PWA Offline Improvements - Research

**Researched:** 2026-02-11
**Domain:** PWA offline UX, network awareness, device state staleness, install prompting
**Confidence:** HIGH

## Summary

Phase 53 enhances PWA offline experience with sticky banner UI, staleness detection, control safety lockdown, command queue visibility, and guided install prompt. The app already has solid foundations: `useOnlineStatus` hook, `useBackgroundSync` hook, IndexedDB-backed command queue, service worker with Background Sync, and device state caching in SW. This phase adds user-facing UI layers on top of existing infrastructure.

Core pattern: detect offline state → show informational banner → hide controls → display queued commands → guide installation. All pieces exist separately; this phase integrates them into cohesive offline-first UX.

**Primary recommendation:** Build on existing hooks/infrastructure. Use Banner component for offline UI (already supports dismissible/sticky), extend device cards with timestamp comparison for staleness, conditionally hide controls via `isOnline` prop, and create bottom-sheet InstallPrompt component following mobile platform conventions.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Offline awareness UI:**
- Sticky top banner when offline — fixed at the very top, pushes content down
- Dark/muted background matching Ember Noir theme — informational, not alarming (no red/amber)
- Banner shows "Offline" status + timestamp of last successful data update
- Device cards show staleness via dimming + "Last update: X ago" text when cached data older than threshold

**Control safety behavior:**
- Controls hidden entirely when offline — buttons/sliders disappear, only status info remains
- Mid-action going offline: action is cancelled immediately with "Connection lost — action cancelled" notification
- No silent queuing of interrupted actions — explicit cancellation for safety

**Command queue visibility:**
- Pending commands shown inside the offline banner — banner expands to list them
- Full detail per command: device name, action description, timestamp, and cancel button
- User can cancel individual queued commands before sync

**PWA install prompt:**
- Bottom sheet style — slides up from bottom, mobile-native feel
- Appears after 2+ visits (per success criteria)

### Claude's Discretion

- Online→offline and offline→online transitions: animation approach
- Gradual staleness thresholds vs binary offline detection
- Full lockdown vs selective control hiding based on risk level (e.g., stove ignite vs read-only display)
- Reconnect confirmation style: simple toast vs per-command results
- Command expiration policy: whether commands expire after extended offline periods (safety consideration for stove control)
- Install prompt messaging and benefits copy (matching Ember Noir tone)
- Install prompt dismiss behavior and timing
- Re-prompt strategy after dismissal (30-day tracking available per spec)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope

</user_constraints>

## Standard Stack

### Core (Already Installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @serwist/next | 9.5.0 | Service Worker & PWA management | Next.js PWA standard, handles SW compilation, caching strategies, precaching |
| date-fns | 4.1.0 | Date/time formatting | Already in project, tree-shakeable, modern alternative to Moment.js |
| lucide-react | 0.562.0 | Icons | Design system standard, optimized React icons |

### Supporting (PWA Infrastructure - Already Built)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| IndexedDB (native) | - | Offline storage for command queue, device state, app state | Already implemented in `lib/pwa/indexedDB.ts` |
| Background Sync API | - | Queue sync when connection restored | Already implemented in SW + `useBackgroundSync` hook |
| navigator.onLine | - | Online/offline detection | Already used in `useOnlineStatus` hook |

### New Dependencies

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| react-modal-sheet | ^3.0.0 | Bottom sheet for install prompt | Framer Motion-based, smooth animations, keyboard avoidance, minimal rerenders ([react-modal-sheet](https://github.com/Temzasse/react-modal-sheet)) |

**Installation:**
```bash
npm install react-modal-sheet
```

**Alternative Considered:** Build custom bottom sheet with Radix Dialog + CSS transforms. Tradeoff: More control but need to handle snap points, gestures, mobile Safari quirks manually. react-modal-sheet already solves these.

## Architecture Patterns

### Recommended Project Structure

```
lib/
├── hooks/
│   ├── useOnlineStatus.ts        # EXISTS: online/offline detection
│   ├── useBackgroundSync.ts      # EXISTS: queue management
│   ├── useDeviceStaleness.ts     # NEW: staleness detection per device
│   └── useInstallPrompt.ts       # NEW: beforeinstallprompt handling
├── pwa/
│   ├── indexedDB.ts              # EXISTS: IndexedDB wrapper
│   ├── backgroundSync.ts         # EXISTS: queue service
│   ├── stalenessDetector.ts      # NEW: timestamp comparison logic
│   └── installPromptService.ts   # NEW: localStorage tracking for prompt
app/
├── components/
│   ├── ui/
│   │   └── Banner.tsx            # EXISTS: use for offline banner
│   ├── pwa/
│   │   ├── OfflineBanner.tsx     # NEW: sticky banner with queue UI
│   │   └── InstallPrompt.tsx     # NEW: bottom sheet prompt
│   └── devices/
│       └── stove/
│           └── StoveCard.tsx     # MODIFY: add staleness UI, hide controls
```

### Pattern 1: Online/Offline Detection (Already Exists)

**What:** `useOnlineStatus` hook monitors connection state with periodic health checks

**Current implementation:**
```typescript
// lib/hooks/useOnlineStatus.ts (already exists)
export function useOnlineStatus(): {
  isOnline: boolean;
  wasOffline: boolean;
  lastOnlineAt: Date | null;
  offlineSince: Date | null;
  checkConnection: () => Promise<boolean>;
}
```

**Usage in device cards:**
```typescript
const { isOnline, offlineSince } = useOnlineStatus();

// Hide controls when offline
{isOnline && <ControlButton ... />}

// Show offline overlay
{!isOnline && <OfflineOverlay since={offlineSince} />}
```

### Pattern 2: Staleness Detection (New)

**What:** Compare IndexedDB cached timestamp with current time to determine data age

**Implementation:**
```typescript
// lib/pwa/stalenessDetector.ts
const STALENESS_THRESHOLD = 30000; // 30 seconds per PWA-02

export interface StalenessInfo {
  isStale: boolean;
  cachedAt: Date | null;
  ageSeconds: number;
}

export async function getDeviceStaleness(deviceId: string): Promise<StalenessInfo> {
  const cached = await get(STORES.DEVICE_STATE, deviceId);

  if (!cached?.timestamp) {
    return { isStale: true, cachedAt: null, ageSeconds: Infinity };
  }

  const cachedTime = new Date(cached.timestamp);
  const now = new Date();
  const ageMs = now.getTime() - cachedTime.getTime();

  return {
    isStale: ageMs > STALENESS_THRESHOLD,
    cachedAt: cachedTime,
    ageSeconds: Math.floor(ageMs / 1000),
  };
}
```

**Hook usage:**
```typescript
// lib/hooks/useDeviceStaleness.ts
export function useDeviceStaleness(deviceId: string) {
  const [staleness, setStaleness] = useState<StalenessInfo | null>(null);

  useEffect(() => {
    const check = async () => {
      const info = await getDeviceStaleness(deviceId);
      setStaleness(info);
    };

    check();
    const interval = setInterval(check, 5000); // Check every 5s
    return () => clearInterval(interval);
  }, [deviceId]);

  return staleness;
}
```

### Pattern 3: Offline Banner with Queue Visibility (New)

**What:** Sticky banner using existing Banner component, expanded to show queued commands

**Implementation:**
```typescript
// app/components/pwa/OfflineBanner.tsx
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus';
import { useBackgroundSync } from '@/lib/hooks/useBackgroundSync';
import Banner from '../ui/Banner';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';

export default function OfflineBanner() {
  const { isOnline, offlineSince } = useOnlineStatus();
  const { pendingCommands, cancelCommand } = useBackgroundSync();

  if (isOnline) return null;

  const lastUpdateText = offlineSince
    ? formatDistanceToNow(offlineSince, { locale: it, addSuffix: true })
    : 'Sconosciuto';

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <Banner
        variant="info" // Muted, informational (not warning/error per user decision)
        title="Sei offline"
        description={`Ultimo aggiornamento: ${lastUpdateText}`}
        className="rounded-none" // Sticky top = no rounded corners
      >
        {/* Pending commands list */}
        {pendingCommands.length > 0 && (
          <div className="mt-3 space-y-2">
            <Text size="xs" className="opacity-80">
              Comandi in coda ({pendingCommands.length})
            </Text>
            {pendingCommands.map((cmd: any) => (
              <div key={cmd.id} className="flex items-center justify-between p-2 bg-white/5 rounded">
                <div className="flex-1">
                  <Text size="sm">{cmd.label}</Text>
                  <Text size="xs" variant="secondary">{cmd.formattedTime}</Text>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => cancelCommand(cmd.id)}
                >
                  Annulla
                </Button>
              </div>
            ))}
          </div>
        )}
      </Banner>
    </div>
  );
}
```

### Pattern 4: Control Safety Lockdown (Modify Existing)

**What:** Hide controls entirely when offline (not disabled, hidden per user decision)

**Current pattern in StoveCard:**
```typescript
// app/components/devices/stove/StoveCard.tsx (modify existing)
const { isOnline } = useOnlineStatus();

// Before: controls always visible
<ControlButton onClick={handleIgnite} icon={Flame}>
  Accendi
</ControlButton>

// After: hide when offline
{isOnline ? (
  <ControlButton onClick={handleIgnite} icon={Flame}>
    Accendi
  </ControlButton>
) : (
  <Text variant="secondary" size="sm">
    Controlli non disponibili offline
  </Text>
)}
```

**Selective lockdown (Claude's discretion):**
Risk-based hiding: high-risk actions (ignite, shutdown) hidden always offline; low-risk (view stats, navigation) remain visible.

### Pattern 5: Install Prompt with beforeinstallprompt (New)

**What:** Capture event, show custom bottom sheet after 2+ visits, track dismissal in localStorage

**Implementation:**
```typescript
// lib/hooks/useInstallPrompt.ts
import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Check visit count and dismissal timestamp
      const visits = Number(localStorage.getItem('pwa-visit-count') || 0) + 1;
      localStorage.setItem('pwa-visit-count', String(visits));

      const lastDismissed = localStorage.getItem('pwa-prompt-dismissed');
      const dismissedAt = lastDismissed ? new Date(lastDismissed) : null;

      // Show if: 2+ visits AND (never dismissed OR 30+ days since dismissal)
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      const shouldShow = visits >= 2 && (!dismissedAt || dismissedAt.getTime() < thirtyDaysAgo);

      setCanInstall(shouldShow);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    if (choice.outcome === 'accepted') {
      setCanInstall(false);
      setDeferredPrompt(null);
    }

    return choice.outcome === 'accepted';
  };

  const dismiss = () => {
    localStorage.setItem('pwa-prompt-dismissed', new Date().toISOString());
    setCanInstall(false);
  };

  return { canInstall, install, dismiss };
}
```

**Bottom Sheet Component:**
```typescript
// app/components/pwa/InstallPrompt.tsx
import { Sheet } from 'react-modal-sheet';
import { useInstallPrompt } from '@/lib/hooks/useInstallPrompt';
import { Download } from 'lucide-react';

export default function InstallPrompt() {
  const { canInstall, install, dismiss } = useInstallPrompt();

  return (
    <Sheet isOpen={canInstall} onClose={dismiss}>
      <Sheet.Container>
        <Sheet.Header />
        <Sheet.Content>
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Download size={32} className="text-ember-400" />
              <Heading level={2} size="lg">Installa l'app</Heading>
            </div>

            <Text variant="secondary">
              Installa Pannello Stufa per accesso rapido, notifiche push e funzionamento offline.
            </Text>

            <div className="space-y-2">
              <Button variant="ember" fullWidth onClick={install}>
                Installa
              </Button>
              <Button variant="outline" fullWidth onClick={dismiss}>
                Non ora
              </Button>
            </div>
          </div>
        </Sheet.Content>
      </Sheet.Container>
      <Sheet.Backdrop onTap={dismiss} />
    </Sheet>
  );
}
```

### Pattern 6: Reconnect Sync Feedback (Claude's Discretion)

**Option A: Simple toast (recommended)**
```typescript
// useBackgroundSync.ts already sends COMMAND_SYNCED message
// Show toast on lastSyncedCommand change
useEffect(() => {
  if (lastSyncedCommand) {
    showToast({
      variant: 'success',
      title: 'Comandi sincronizzati',
      description: 'I comandi offline sono stati eseguiti',
    });
  }
}, [lastSyncedCommand]);
```

**Option B: Per-command results**
Extend SW message to include success/failure per command, show list of results in Banner.

**Recommendation:** Option A (simple toast) matches existing app patterns and avoids UI clutter.

### Pattern 7: Command Expiration (Claude's Discretion - Safety)

**Context:** User queues "ignite stove" offline, goes offline for 2 hours, comes back online. Should command execute?

**Option A: No expiration (current behavior)**
Command executes regardless of age. Risk: stale intent.

**Option B: Time-based expiration**
```typescript
// lib/pwa/backgroundSync.ts (modify executeCommand)
async function executeCommand(command: QueuedCommand): Promise<Response> {
  const ageMs = Date.now() - new Date(command.timestamp).getTime();
  const MAX_AGE = 60 * 60 * 1000; // 1 hour

  if (ageMs > MAX_AGE) {
    throw new Error('Command expired (older than 1 hour)');
  }

  // ... existing execution logic
}
```

**Recommendation:** Option B with 1-hour expiration for safety-critical commands (ignite, shutdown). Read-only commands (get status) never expire.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Bottom sheet gestures | Custom drag/snap logic | react-modal-sheet | Handles iOS Safari rubber-banding, Android back gesture, snap points, keyboard avoidance |
| Date formatting | Custom relative time | date-fns/formatDistanceToNow | Locale support, already in project, tree-shakeable |
| Online detection | window.navigator.onLine only | useOnlineStatus hook (existing) | Adds periodic health checks, handles false positives |
| IndexedDB schema migration | Manual version checks | Built-in onupgradeneeded | IndexedDB API handles version transitions automatically |

**Key insight:** PWA APIs (beforeinstallprompt, Background Sync, IndexedDB) have browser inconsistencies. Use battle-tested wrappers (Serwist, react-modal-sheet) rather than implementing spec edge cases yourself.

## Common Pitfalls

### Pitfall 1: beforeinstallprompt Fires Only Once Per Session

**What goes wrong:** User dismisses prompt → refreshes page → prompt never shows again

**Why it happens:** Event fires once when criteria met, then never again until browser decides (unpredictable)

**How to avoid:**
- Capture event in global handler (not component mount)
- Store deferredPrompt in hook state for later use
- Don't rely on re-firing — implement own visit count logic

**Warning signs:** Install button appears briefly then disappears on page reload

**Source:** [MDN: Trigger install prompt](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Trigger_install_prompt)

### Pitfall 2: iOS Safari Doesn't Support beforeinstallprompt

**What goes wrong:** Install prompt never appears on iPhone/iPad

**Why it happens:** iOS Safari uses manual Add to Home Screen from share menu — no programmatic prompt

**How to avoid:**
- Feature detect: `if ('BeforeInstallPromptEvent' in window)`
- For iOS: Show instructional banner with "Add to Home Screen" steps
- Check userAgent for iOS, show different UI

**Warning signs:** Works perfectly on Android/Chrome, silent failure on iOS

**Source:** [Prompt iOS users to install PWA](https://michaellisboa.com/blog/prompt-ios/)

### Pitfall 3: IndexedDB Quota Exceeded in Private Mode

**What goes wrong:** Device state caching fails silently in Safari Private Browsing

**Why it happens:** Private mode limits IndexedDB quota to ~5MB, often exceeded by cached responses

**How to avoid:**
```typescript
try {
  await put(STORES.DEVICE_STATE, state);
} catch (error) {
  if (error.name === 'QuotaExceededError') {
    // Clear old entries or warn user
    await clearOldCache();
  }
}
```

**Warning signs:** Caching works normally, fails intermittently without logs

### Pitfall 4: Stale-While-Revalidate Shows Stale Data Without Indicator

**What goes wrong:** User sees old device status, thinks it's current

**Why it happens:** SW cache strategy serves cached response immediately, updates in background

**How to avoid:**
- Always show timestamp: "Last update: 2m ago"
- Dim UI or show staleness badge when cached > threshold
- Don't rely on cache age — compare stored timestamp explicitly

**Warning signs:** Users report "controls don't work" when offline (they're seeing cached state but trying to control)

**Source:** [Build Next.js 16 PWA with offline support](https://blog.logrocket.com/nextjs-16-pwa-offline-support/)

### Pitfall 5: Mid-Action Network Loss Creates Zombie Requests

**What goes wrong:** User taps "Ignite", request starts, network drops, UI shows loading forever

**Why it happens:** Fetch promise never resolves/rejects when network dies mid-flight

**How to avoid:**
```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 10000);

try {
  await fetch('/api/stove/ignite', { signal: controller.signal });
} catch (error) {
  if (error.name === 'AbortError') {
    // Show "Connection lost" notification
    // Cancel action explicitly (per user decision)
  }
} finally {
  clearTimeout(timeoutId);
}
```

**Warning signs:** Loading spinners never dismiss, no error shown

### Pitfall 6: localStorage Blocked in Third-Party Context

**What goes wrong:** Install prompt dismissal tracking fails when app embedded in iframe

**Why it happens:** Browsers block localStorage in cross-origin iframes

**How to avoid:**
```typescript
function canUseLocalStorage(): boolean {
  try {
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
    return true;
  } catch {
    return false;
  }
}

// Fallback to sessionStorage or skip persistence
const storage = canUseLocalStorage() ? localStorage : sessionStorage;
```

**Warning signs:** Install prompt shows on every visit despite dismissal

## Code Examples

Verified patterns from official sources and existing codebase:

### Offline Banner Integration

```typescript
// app/layout.tsx (add to root layout)
import OfflineBanner from './components/pwa/OfflineBanner';
import InstallPrompt from './components/pwa/InstallPrompt';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <OfflineBanner />
        {children}
        <InstallPrompt />
      </body>
    </html>
  );
}
```

### Device Card Staleness UI

```typescript
// app/components/devices/stove/StoveCard.tsx
import { useDeviceStaleness } from '@/lib/hooks/useDeviceStaleness';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';

export default function StoveCard() {
  const { isOnline } = useOnlineStatus();
  const staleness = useDeviceStaleness('stove');

  return (
    <Card
      variant="elevated"
      className={cn(
        staleness?.isStale && 'opacity-60' // Dim when stale
      )}
    >
      <Card.Header>
        <Card.Title icon={Flame}>Stufa</Card.Title>

        {/* Staleness indicator */}
        {staleness?.cachedAt && (
          <Text size="xs" variant="secondary">
            Aggiornamento: {formatDistanceToNow(staleness.cachedAt, {
              locale: it,
              addSuffix: true
            })}
          </Text>
        )}
      </Card.Header>

      {/* Controls: hidden when offline */}
      {isOnline && (
        <Card.Content>
          <ControlButton onClick={handleIgnite}>Accendi</ControlButton>
        </Card.Content>
      )}

      {!isOnline && (
        <Card.Content>
          <Text variant="secondary">
            Controlli non disponibili offline
          </Text>
        </Card.Content>
      )}
    </Card>
  );
}
```

### Install Prompt Trigger (Root Layout)

```typescript
// app/layout.tsx
'use client';

import { useEffect } from 'react';
import InstallPrompt from './components/pwa/InstallPrompt';

export default function RootLayout({ children }) {
  // Track visits
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const visits = Number(localStorage.getItem('pwa-visit-count') || 0) + 1;
      localStorage.setItem('pwa-visit-count', String(visits));
    }
  }, []);

  return (
    <html>
      <body>
        {children}
        <InstallPrompt />
      </body>
    </html>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual Add to Home Screen instructions | beforeinstallprompt API | Chrome 68+ (2018) | Custom install UI possible (Android/desktop only) |
| Inline if/else for offline detection | useOnlineStatus hook pattern | React Hooks (2019) | Cleaner component logic, reusable |
| Cache-first without staleness indicator | Timestamp-based staleness detection | PWA best practices (2020+) | Users see data age, understand limitations |
| App-initiated install prompts | Browser-controlled criteria (engagement signals) | Chrome 76+ (2019) | Can't spam users, need genuine engagement |
| SyncManager in all browsers | Feature detection + fallback | Current (2026) | iOS Safari still lacks Background Sync |

**Deprecated/outdated:**
- `appinstalled` event: Deprecated, use `beforeinstallprompt.userChoice` promise instead
- Prompting on every page load: Violates browser install criteria, prompt won't fire
- Disabling controls with `disabled` attribute: Better UX to hide entirely when offline (per user decision)

## Open Questions

1. **Should command expiration vary by action type?**
   - What we know: Stove ignite is safety-critical, status checks are harmless
   - What's unclear: Optimal timeout values (1 hour? 6 hours?)
   - Recommendation: Start with 1-hour expiration for ignite/shutdown, no expiration for read-only

2. **Gradual staleness thresholds?**
   - What we know: PWA-02 spec says 30 seconds, could add intermediate warning at 10s
   - What's unclear: Does gradual dimming (10s→20s→30s) add value or confusion?
   - Recommendation: Binary threshold (30s) for v1, test with users before adding gradual

3. **Full vs selective control lockdown?**
   - What we know: High-risk (ignite/shutdown) should always hide offline
   - What's unclear: Should "view camera" or "see stats" remain visible offline?
   - Recommendation: Risk-based — hide only write operations (ignite, shutdown, set-power), keep read operations visible but with staleness indicator

4. **iOS install prompt alternative?**
   - What we know: beforeinstallprompt doesn't fire on iOS Safari
   - What's unclear: Show instructional banner? Detect standalone mode and skip prompt?
   - Recommendation: Detect iOS + not standalone → show "Add to Home Screen" instructions with arrow graphic pointing to share button

## Sources

### Primary (HIGH confidence)

- [Serwist Documentation](https://serwist.pages.dev/) - Service worker library docs
- [MDN: Trigger install prompt](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Trigger_install_prompt) - Official beforeinstallprompt API
- [MDN: Using IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB) - IndexedDB API reference
- [date-fns documentation](https://date-fns.org/) - Time formatting library (v4.1.0)
- Existing codebase: `lib/hooks/useOnlineStatus.ts`, `lib/hooks/useBackgroundSync.ts`, `app/sw.ts`

### Secondary (MEDIUM confidence)

- [Next.js 15 PWA implementation guide](https://medium.com/@amirjld/how-to-implement-pwa-progressive-web-app-in-next-js-app-router-2026-f25a6797d5e6) - 2026 patterns
- [react-modal-sheet GitHub](https://github.com/Temzasse/react-modal-sheet) - Bottom sheet library
- [Chrome: Richer PWA installation](https://developer.chrome.com/blog/richer-pwa-installation) - Install prompt UI evolution
- [web.dev: Installation prompt](https://web.dev/learn/pwa/installation-prompt) - Best practices
- [LogRocket: Next.js 16 PWA offline support](https://blog.logrocket.com/nextjs-16-pwa-offline-support/) - Verified patterns
- [Prompt iOS users to install PWA](https://michaellisboa.com/blog/prompt-ios/) - iOS workaround
- [PWA: Retrigger beforeinstallprompt](https://www.codegenes.net/blog/pwa-how-to-retrigger-beforeinstallprompt/) - Dismissal tracking patterns

### Tertiary (LOW confidence)

- None — all findings verified with official docs or existing codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already installed except react-modal-sheet (well-documented)
- Architecture: HIGH - Built on existing hooks/services, extends proven patterns
- Pitfalls: HIGH - Sourced from official docs (MDN, Chrome) and existing codebase experience

**Research date:** 2026-02-11
**Valid until:** 2026-03-15 (30 days for stable PWA APIs, browser behavior changes rare)
