# Phase 28: Dashboard Customization - Research

**Researched:** 2026-02-03
**Domain:** Per-user preferences management, list reordering UI, Firebase RTDB
**Confidence:** HIGH

## Summary

Dashboard customization allows users to personalize their home page card layout by reordering and hiding cards. This phase involves building a settings page with up/down button controls for reordering, visibility toggles for each card, and per-user Firebase RTDB storage.

The standard approach uses:
1. **Up/down buttons** for reordering (not drag-and-drop) - faster, more accessible, and universally compatible
2. **Radix UI Switch** component for visibility toggles (already in use throughout the app)
3. **Per-user Firebase paths** using Auth0's `user.sub` as the user identifier
4. **Immutable state updates** for React 19 array manipulation
5. **Manual save pattern** with unsaved changes silently discarded on navigation

User testing shows up/down buttons have the lowest task completion time and highest immediate comprehension among reordering patterns. This aligns with the user decision to avoid drag-and-drop complexity.

**Primary recommendation:** Use button-based reordering with Firebase per-user storage at `users/{userId}/dashboardPreferences`.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @radix-ui/react-switch | ^1.1.7 | Toggle component | Already in app, accessible, smooth animations |
| firebase | ^12.8.0 | RTDB client SDK | Already integrated, real-time updates |
| @auth0/nextjs-auth0 | ^4.13.1 | User authentication | Already integrated, provides user.sub |
| Next.js 15 | ^16.1.0 | App Router | Current framework version |
| React 19 | ^19.2.0 | UI framework | Current React version |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | ^0.562.0 | Icons | Up/down arrow icons (ChevronUp/ChevronDown) |
| class-variance-authority | ^0.7.1 | CSS variants | Button disabled states |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Up/down buttons | Drag-and-drop (hello-pangea/dnd) | Adds complexity, accessibility issues, not needed for simple list |
| Per-user storage | Shared app-wide setting | User decision: each user needs their own preferences |
| Manual save | Auto-save on change | User decision: manual save required |

**Installation:**
```bash
# No new packages needed - all dependencies already in package.json
```

## Architecture Patterns

### Recommended Project Structure
```
app/settings/dashboard/
├── page.js                # Settings page (client component)

lib/services/
├── dashboardPreferencesService.js  # Refactor for per-user (exists, needs update)

components/ui/
├── Switch.js              # Toggle component (exists)
├── Button.js              # Up/down buttons (exists)
```

### Pattern 1: Per-User Firebase Path Structure
**What:** Store user preferences under `users/{userId}/` path using Auth0's `user.sub` claim
**When to use:** Any per-user data that should be isolated from other users
**Example:**
```javascript
// Firebase path structure
users/
  {auth0|user123}/
    dashboardPreferences/
      cardOrder: [
        { id: 'stove', label: 'Stufa', visible: true },
        { id: 'thermostat', label: 'Termostato', visible: true },
        { id: 'weather', label: 'Meteo', visible: false }
      ]
      updatedAt: 1706966400000

// Service layer
import { ref, get, set } from 'firebase/database';
import { db } from '@/lib/firebase';

export async function getDashboardPreferences(userId) {
  const prefRef = ref(db, `users/${userId}/dashboardPreferences`);
  const snapshot = await get(prefRef);
  return snapshot.val() || { cardOrder: DEFAULT_CARD_ORDER };
}

export async function setDashboardPreferences(userId, { cardOrder }) {
  const prefRef = ref(db, `users/${userId}/dashboardPreferences`);
  await set(prefRef, {
    cardOrder: cardOrder || DEFAULT_CARD_ORDER,
    updatedAt: Date.now(),
  });
}
```

### Pattern 2: Immutable Array Reordering
**What:** Never mutate state arrays directly - always create new arrays with spread operator
**When to use:** All array state updates in React 19
**Example:**
```javascript
// Source: React 19 official docs
const [cards, setCards] = useState(initialCards);

// Move card up (swap with previous)
const moveUp = (index) => {
  if (index === 0) return; // Already at top

  setCards(prev => {
    const newCards = [...prev]; // Create new array
    [newCards[index - 1], newCards[index]] = [newCards[index], newCards[index - 1]]; // Swap
    return newCards;
  });
};

// Move card down (swap with next)
const moveDown = (index) => {
  if (index === cards.length - 1) return; // Already at bottom

  setCards(prev => {
    const newCards = [...prev];
    [newCards[index], newCards[index + 1]] = [newCards[index + 1], newCards[index]];
    return newCards;
  });
};
```

### Pattern 3: SettingsLayout Pattern
**What:** Consistent layout wrapper for all settings pages with back button and header
**When to use:** All pages under `/app/settings/`
**Example:**
```javascript
// Source: Existing codebase pattern
'use client';

import { useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import SettingsLayout from '@/app/components/SettingsLayout';
import Card, { CardContent } from '@/app/components/ui/Card';

export default function DashboardSettingsPage() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <SettingsLayout title="Personalizza home" icon="🎨">
        <Skeleton className="h-64 w-full" />
      </SettingsLayout>
    );
  }

  return (
    <SettingsLayout title="Personalizza home" icon="🎨">
      <Card variant="glass">
        <CardContent>
          {/* Card list with reordering controls */}
        </CardContent>
      </Card>
    </SettingsLayout>
  );
}
```

### Pattern 4: Visibility Toggle with Switch
**What:** Use existing Switch component for show/hide controls
**When to use:** Any boolean toggle in the app
**Example:**
```javascript
// Source: Existing app/components/ui/Switch.js
import Switch from '@/app/components/ui/Switch';

<Switch
  checked={card.visible}
  onCheckedChange={(newValue) => handleToggleVisibility(index, newValue)}
  label={`Mostra ${card.label}`}
  size="md"
  variant="ember"
/>
```

### Anti-Patterns to Avoid
- **Drag-and-drop for simple lists:** Adds unnecessary complexity, accessibility issues, and dependency weight. Up/down buttons are faster for users.
- **Shared dashboard preferences:** User explicitly requested per-user storage. Don't use a single shared config.
- **Auto-save:** User decided manual save is required. Don't implement auto-save.
- **Confirmation dialog on discard:** User decided to silently discard unsaved changes. Don't add confirmation dialogs.
- **Direct array mutation:** React 19 won't detect changes if you use `.push()`, `.splice()`, or direct index assignment.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Toggle switch UI | Custom checkbox/slider | @radix-ui/react-switch | Accessibility (keyboard nav, screen readers), animations, already in app |
| Button variants | Inline Tailwind classes | Existing Button component with CVA | Consistent styling, size variants, disabled states handled |
| Settings page layout | Custom wrapper | SettingsLayout component | Consistent header, back button, responsive padding across all settings pages |
| Icon rendering | Custom SVG components | lucide-react icons | Tree-shakeable, consistent sizing, already imported throughout app |
| Firebase path helper | Manual env detection | getEnvironmentPath() | Already exists, handles dev/ namespace automatically |

**Key insight:** The app already has a mature design system with accessible components. Don't recreate what exists - compose from existing primitives.

## Common Pitfalls

### Pitfall 1: Mutating State Arrays Directly
**What goes wrong:** Using `.push()`, `.splice()`, or direct index assignment doesn't trigger React re-renders because the array reference doesn't change.
**Why it happens:** Coming from imperative programming where mutation is normal.
**How to avoid:** Always use spread operator `[...prev]` or array methods that return new arrays (`.map()`, `.filter()`, `.concat()`).
**Warning signs:** UI doesn't update after state change, or updates only after unrelated re-render.

```javascript
// WRONG - Mutates state directly
const moveUp = (index) => {
  cards[index] = cards[index - 1]; // Direct mutation
  setCards(cards); // Same reference, React ignores
};

// CORRECT - Creates new array
const moveUp = (index) => {
  setCards(prev => {
    const newCards = [...prev]; // New array
    [newCards[index - 1], newCards[index]] = [newCards[index], newCards[index - 1]];
    return newCards;
  });
};
```

### Pitfall 2: Not Handling Edge Cases in Reordering
**What goes wrong:** Allowing "move up" on first item or "move down" on last item can cause errors or unexpected behavior.
**Why it happens:** Forgetting to validate index boundaries before swapping.
**How to avoid:** Check if `index === 0` before moving up, or `index === length - 1` before moving down. Disable or hide buttons at edges.
**Warning signs:** Console errors about array index out of bounds, or cards disappearing.

```javascript
// WRONG - No boundary checks
const moveUp = (index) => {
  setCards(prev => {
    const newCards = [...prev];
    [newCards[index - 1], newCards[index]] = [newCards[index], newCards[index - 1]];
    // If index is 0, this tries to swap with index -1 (undefined)
    return newCards;
  });
};

// CORRECT - Guard clause at top
const moveUp = (index) => {
  if (index === 0) return; // Can't move up from top
  setCards(prev => {
    const newCards = [...prev];
    [newCards[index - 1], newCards[index]] = [newCards[index], newCards[index - 1]];
    return newCards;
  });
};
```

### Pitfall 3: Wrong Firebase Path Structure
**What goes wrong:** Using shared path like `config/dashboard` instead of per-user path causes all users to share the same preferences.
**Why it happens:** Existing `dashboardPreferencesService.js` uses shared path. Easy to miss the need to refactor.
**How to avoid:** Always include `userId` in the path for per-user data: `users/{userId}/dashboardPreferences`. Follow Firebase best practice of organizing by user ID at top level.
**Warning signs:** User A's changes affect User B's dashboard layout.

```javascript
// WRONG - Shared config path
const getDashboardPath = () => getEnvironmentPath('config/dashboard');
// This creates: config/dashboard (shared by all users)

// CORRECT - Per-user path
const getDashboardPath = (userId) => `users/${userId}/dashboardPreferences`;
// This creates: users/auth0|123/dashboardPreferences (isolated per user)
```

### Pitfall 4: Firebase RTDB Security Rules with Auth0
**What goes wrong:** Firebase Security Rules expect Firebase Auth tokens, but this app uses Auth0. Client SDK read operations may fail with PERMISSION_DENIED.
**Why it happens:** Firebase Rules check `auth.uid`, but Auth0 doesn't provide Firebase-compatible tokens.
**How to avoid:** The app already uses Admin SDK for writes (bypasses rules) and allows anonymous reads for specific paths. For per-user data, use API routes with Admin SDK, not direct client SDK writes.
**Warning signs:** PERMISSION_DENIED errors when trying to write from client components.

```javascript
// WRONG - Client component writing directly to Firebase
'use client';
import { setDashboardPreferences } from '@/lib/services/dashboardPreferencesService';

const handleSave = async () => {
  await setDashboardPreferences(user.sub, { cardOrder }); // May fail with PERMISSION_DENIED
};

// CORRECT - API route with Admin SDK
// app/settings/dashboard/page.js (client)
const handleSave = async () => {
  await fetch('/api/dashboard/preferences', {
    method: 'POST',
    body: JSON.stringify({ cardOrder }),
  });
};

// app/api/dashboard/preferences/route.js (server)
import { auth0 } from '@/lib/auth0';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(request) {
  const session = await auth0.getSession();
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = session.user.sub;
  const { cardOrder } = await request.json();

  await adminDb.ref(`users/${userId}/dashboardPreferences`).set({
    cardOrder,
    updatedAt: Date.now(),
  });

  return Response.json({ success: true });
}
```

### Pitfall 5: Not Preserving Order for Hidden Cards
**What goes wrong:** If hidden cards lose their position when re-enabled, users have to reorder them again.
**Why it happens:** Filtering out hidden cards from the array and losing their original position.
**How to avoid:** Store all cards (visible and hidden) in the same ordered array. Use the `visible` boolean property to control rendering, not array presence.
**Warning signs:** User hides a card, then shows it again, and it appears at the end instead of its original position.

```javascript
// WRONG - Filtering removes hidden cards
const visibleCards = cards.filter(c => c.visible);
// Hidden cards are lost, can't preserve their order

// CORRECT - All cards in order, filter only for display
const [cards, setCards] = useState([
  { id: 'stove', label: 'Stufa', visible: true },
  { id: 'weather', label: 'Meteo', visible: false }, // Still in array, just hidden
]);

// Render logic
{cards.map((card, index) => (
  <CardListItem
    key={card.id}
    card={card}
    onMoveUp={() => moveUp(index)}
    onMoveDown={() => moveDown(index)}
    onToggle={(newVisible) => toggleVisibility(index, newVisible)}
    isFirst={index === 0}
    isLast={index === cards.length - 1}
    // Display shows it's hidden, but card stays in same position
  />
))}
```

## Code Examples

Verified patterns from official sources:

### Up/Down Button Group
```javascript
// Source: Existing Button component + lucide-react
import Button from '@/app/components/ui/Button';
import { ChevronUp, ChevronDown } from 'lucide-react';

function ReorderButtons({ onMoveUp, onMoveDown, isFirst, isLast }) {
  return (
    <div className="flex gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={onMoveUp}
        disabled={isFirst}
        aria-label="Sposta su"
        icon={<ChevronUp size={20} />}
        iconOnly
      />
      <Button
        variant="ghost"
        size="sm"
        onClick={onMoveDown}
        disabled={isLast}
        aria-label="Sposta giù"
        icon={<ChevronDown size={20} />}
        iconOnly
      />
    </div>
  );
}
```

### Card List Item with Visibility Toggle
```javascript
// Source: Existing Switch + Card components
import Card, { CardContent } from '@/app/components/ui/Card';
import Switch from '@/app/components/ui/Switch';
import { Text, Badge } from '@/app/components/ui';

function CardListItem({ card, onToggle, onMoveUp, onMoveDown, isFirst, isLast }) {
  return (
    <Card variant="glass" className={card.visible ? '' : 'opacity-60'}>
      <CardContent className="flex items-center justify-between">
        {/* Icon + Label */}
        <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden="true">{card.icon}</span>
          <div>
            <Text weight="semibold">{card.label}</Text>
            {!card.visible && <Badge variant="subtle">Nascosto</Badge>}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <Switch
            checked={card.visible}
            onCheckedChange={onToggle}
            label={`Mostra ${card.label}`}
          />
          <ReorderButtons
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            isFirst={isFirst}
            isLast={isLast}
          />
        </div>
      </CardContent>
    </Card>
  );
}
```

### Firebase Service Refactor for Per-User
```javascript
// Source: Firebase SDK + existing service pattern
import { ref, get, set } from 'firebase/database';
import { db } from '@/lib/firebase';

export const DEFAULT_CARD_ORDER = [
  { id: 'stove', label: 'Stufa', icon: '🔥', visible: true },
  { id: 'thermostat', label: 'Termostato', icon: '🌡️', visible: true },
  { id: 'weather', label: 'Meteo', icon: '☀️', visible: true },
  { id: 'lights', label: 'Luci', icon: '💡', visible: true },
  { id: 'camera', label: 'Telecamera', icon: '📹', visible: true },
];

/**
 * Get dashboard preferences for a specific user
 * @param {string} userId - Auth0 user.sub
 */
export async function getDashboardPreferences(userId) {
  if (!userId) {
    console.warn('getDashboardPreferences: no userId provided');
    return { cardOrder: DEFAULT_CARD_ORDER };
  }

  const prefRef = ref(db, `users/${userId}/dashboardPreferences`);
  const snapshot = await get(prefRef);

  if (snapshot.exists()) {
    return snapshot.val();
  }

  // First time: return defaults (don't write yet)
  return { cardOrder: DEFAULT_CARD_ORDER };
}

/**
 * Set dashboard preferences for a specific user
 * @param {string} userId - Auth0 user.sub
 * @param {Object} preferences - { cardOrder: [...] }
 */
export async function setDashboardPreferences(userId, { cardOrder }) {
  if (!userId) {
    throw new Error('userId is required');
  }

  const prefRef = ref(db, `users/${userId}/dashboardPreferences`);
  await set(prefRef, {
    cardOrder: cardOrder || DEFAULT_CARD_ORDER,
    updatedAt: Date.now(),
  });
}
```

### Complete Settings Page Structure
```javascript
// Source: Existing location settings page pattern
'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import SettingsLayout from '@/app/components/SettingsLayout';
import Card, { CardContent } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import { Text, Banner } from '@/app/components/ui';
import Skeleton from '@/app/components/ui/Skeleton';
import {
  getDashboardPreferences,
  setDashboardPreferences,
  DEFAULT_CARD_ORDER,
} from '@/lib/services/dashboardPreferencesService';

export default function DashboardSettingsPage() {
  const { user, isLoading: userLoading } = useUser();
  const [cards, setCards] = useState(DEFAULT_CARD_ORDER);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);

  // Load preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) return;

      try {
        const prefs = await getDashboardPreferences(user.sub);
        setCards(prefs.cardOrder || DEFAULT_CARD_ORDER);
      } catch (err) {
        console.error('Error loading preferences:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadPreferences();
    } else if (!userLoading) {
      setIsLoading(false);
    }
  }, [user, userLoading]);

  // Save preferences
  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      await setDashboardPreferences(user.sub, { cardOrder: cards });
      setSaveMessage({ type: 'success', text: 'Preferenze salvate!' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      setSaveMessage({ type: 'error', text: 'Errore durante il salvataggio' });
    } finally {
      setIsSaving(false);
    }
  };

  // Reordering functions
  const moveUp = (index) => {
    if (index === 0) return;
    setCards(prev => {
      const newCards = [...prev];
      [newCards[index - 1], newCards[index]] = [newCards[index], newCards[index - 1]];
      return newCards;
    });
  };

  const moveDown = (index) => {
    if (index === cards.length - 1) return;
    setCards(prev => {
      const newCards = [...prev];
      [newCards[index], newCards[index + 1]] = [newCards[index + 1], newCards[index]];
      return newCards;
    });
  };

  const toggleVisibility = (index, newVisible) => {
    setCards(prev => prev.map((card, i) =>
      i === index ? { ...card, visible: newVisible } : card
    ));
  };

  // Loading state
  if (userLoading || isLoading) {
    return (
      <SettingsLayout title="Personalizza home" icon="🎨">
        <Skeleton className="h-64 w-full" />
      </SettingsLayout>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <SettingsLayout title="Personalizza home" icon="🎨">
        <Card variant="glass">
          <CardContent>
            <Text variant="secondary">Devi essere autenticato.</Text>
          </CardContent>
        </Card>
      </SettingsLayout>
    );
  }

  return (
    <SettingsLayout title="Personalizza home" icon="🎨">
      {saveMessage && (
        <Banner
          variant={saveMessage.type === 'success' ? 'success' : 'danger'}
          description={saveMessage.text}
        />
      )}

      <Card variant="glass">
        <CardContent className="space-y-4">
          {cards.map((card, index) => (
            <CardListItem
              key={card.id}
              card={card}
              onMoveUp={() => moveUp(index)}
              onMoveDown={() => moveDown(index)}
              onToggle={(newVisible) => toggleVisibility(index, newVisible)}
              isFirst={index === 0}
              isLast={index === cards.length - 1}
            />
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          loading={isSaving}
          disabled={isSaving}
        >
          Salva
        </Button>
      </div>
    </SettingsLayout>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Drag-and-drop libraries (react-beautiful-dnd) | Up/down buttons for simple lists | 2024+ | Simpler implementation, better accessibility, faster user task completion |
| Shared app-wide preferences | Per-user storage | Always | User isolation, personalization |
| Firebase Authentication | Auth0 for authentication | Project start | Need to use Admin SDK for Firebase writes, can't rely on Firebase Security Rules with auth.uid |
| Auto-save preferences | Manual save with button | User preference | Explicit user control over when changes persist |

**Deprecated/outdated:**
- **react-beautiful-dnd**: Maintenance mode, replaced by @hello-pangea/dnd. But for simple lists, buttons are simpler.
- **Client SDK writes to Firebase with Auth0**: Firebase Security Rules don't work with Auth0 tokens. Use Admin SDK via API routes.
- **Toggle component**: Deprecated alias, use Switch component directly.

## Open Questions

Things that couldn't be fully resolved:

1. **Firebase Security Rules for Per-User Data**
   - What we know: App uses Auth0 (not Firebase Auth), so Firebase Rules can't check `auth.uid`. Admin SDK bypasses rules.
   - What's unclear: Whether client SDK reads of per-user data will work, or if we need API routes for both reads and writes.
   - Recommendation: Start with client SDK reads (should work for public data). If PERMISSION_DENIED errors occur, create API route with Admin SDK for both read and write operations.

2. **Up/Down Button Placement**
   - What we know: User marked this as "Claude's Discretion" in CONTEXT.md
   - What's unclear: Whether buttons should be on left or right of each card item
   - Recommendation: Place on right side (after icon, label, and toggle) to follow reading order. Left side placement would require reversing visual flow.

3. **Edge Position Button State**
   - What we know: User marked "disabled vs hidden buttons" as Claude's Discretion
   - What's unclear: Should buttons be disabled (visible but grayed) or hidden (display: none) at top/bottom?
   - Recommendation: Use `disabled` prop, not hidden. Disabled state shows why action is unavailable (better UX) and maintains consistent layout (no shift when item moves).

4. **Animation on Card Swap**
   - What we know: User marked "subtle or instant" as Claude's Discretion
   - What's unclear: Whether to add transition animation when cards swap positions
   - Recommendation: Instant swap (no animation). User testing in research showed buttons are fastest when immediate. Animations could slow perceived responsiveness.

## Sources

### Primary (HIGH confidence)
- [Firebase RTDB Structure Your Database](https://firebase.google.com/docs/database/web/structure-data) - Per-user path best practices
- [React 19 Updating Arrays in State](https://react.dev/learn/updating-arrays-in-state) - Immutable array updates
- [Designing a Reorderable List Component](https://www.darins.page/articles/designing-a-reorderable-list-component) - Up/down button UX research
- Existing codebase patterns: Switch.js, Button.js, SettingsLayout.js, dashboardPreferencesService.js

### Secondary (MEDIUM confidence)
- [Next.js 15 Firebase RTDB Guide](https://mydevpa.ge/blog/how-to-setup-firebase-realtime-database-with-nextjs-15) - Integration patterns
- [Firebase RTDB Security Rules](https://www.fullstackfirebase.com/realtime-database/security-rules) - Security considerations
- [Next.js Unsaved Changes Handling](https://medium.com/@jonjamesdesigns/how-to-handle-unsaved-page-changes-with-nextjs-app-router-65b74f1148de) - App Router navigation
- [Auth0 Next.js Guide](https://auth0.com/blog/ultimate-guide-nextjs-authentication-auth0/) - Auth0 integration

### Tertiary (LOW confidence)
- WebSearch: "React 19 array state mutation best practices 2026" - General React patterns (not specific to this use case)
- WebSearch: "Firebase RTDB security rules user.sub Auth0 2026" - No specific Auth0+Firebase RTDB integration found, used general knowledge

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in use, versions verified from package.json
- Architecture: HIGH - Patterns verified from existing codebase (SettingsLayout, Switch, Button)
- Pitfalls: HIGH - Common React/Firebase issues documented in official sources and existing app patterns
- Firebase + Auth0 integration: MEDIUM - App already uses this pattern, but per-user data security may need API route verification

**Research date:** 2026-02-03
**Valid until:** 30 days (stable technologies, framework versions unchanged)
