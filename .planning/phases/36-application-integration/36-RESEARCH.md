# Phase 36: Application Integration - Research

**Researched:** 2026-02-05
**Domain:** Quick Actions, Context Menu Integration, Command Palette Extension, Application-Wide Component Audit
**Confidence:** HIGH

## Summary

This phase integrates quick action buttons into device cards, extends the Command Palette with device-specific commands, and performs an application-wide audit to ensure consistent component usage and accessibility. The user has provided detailed decisions in CONTEXT.md that constrain the research scope significantly.

The existing codebase already has the foundation in place: CommandPalette.js uses cmdk (1.1.1), ContextMenu.js exists as a click-triggered dropdown (not true right-click menu), and DeviceCard.js uses SmartHomeCard base with Controls namespace. Quick actions will be added to the Controls area as icon buttons following the existing Button.Icon pattern.

The audit approach does not require codemods or automated tooling—manual inspection with axe-core-react for accessibility verification is the standard practice. The project already uses Radix UI primitives extensively, which provide built-in accessibility, so the audit focuses on consistent usage patterns and proper ARIA attributes.

**Primary recommendation:** Add quick action icon buttons to DeviceCard.Controls area following existing Button.Icon pattern. Extend CommandPalette with device-specific commands using the existing command structure. Perform manual audit of all pages (including Debug pages) using axe-core-react and fix issues immediately (no report document).

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| lucide-react | 0.562.0 | Icon library for quick action buttons | Already in project, consistent across all components, 2600+ icons |
| cmdk | 1.1.1 | Command Palette foundation | Already implemented in CommandPalette.js, powers Linear/Raycast |
| @radix-ui/react-context-menu | 2.2.16 | Context menu primitives | Already in package.json, Radix UI ecosystem consistency |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Button.Icon | Design System | Icon-only action buttons | Quick actions (requires aria-label) |
| SmartHomeCard.Controls | Design System | Action button container | Footer area for device actions |
| axe-core-react | Latest | Runtime accessibility auditing | Development mode component audit |
| eslint-plugin-jsx-a11y | Latest | Static accessibility linting | Already standard for React projects |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual audit | react-codemod for automated migration | Project already uses v4.0 components consistently; codemods add complexity for no benefit |
| axe-core-react | jest-axe for testing only | Runtime auditing catches issues in actual usage; jest-axe only runs in tests |
| Custom audit report | Markdown documentation of issues | User decision: fix immediately, no report document |

**Installation:**
```bash
# No new dependencies needed
# axe-core-react is optional (development only)
npm install --save-dev @axe-core/react
```

## Architecture Patterns

### Recommended Project Structure
```
app/
├── components/
│   ├── ui/
│   │   ├── DeviceCard.js           # Existing - add quick actions support
│   │   ├── CommandPalette.js       # Existing - extend with device commands
│   │   ├── Button.js               # Existing - Button.Icon already available
│   │   └── RightClickMenu.js       # Phase 32 component (if implemented)
│   └── devices/
│       ├── stove/StoveCard.js      # Add quick actions to Controls area
│       ├── thermostat/ThermostatCard.js  # Add quick actions
│       └── lights/LightsCard.js    # Add quick actions
└── lib/
    └── commands/
        ├── deviceCommands.js       # NEW: Device-specific palette commands
        └── navigationCommands.js   # Existing navigation commands
```

### Pattern 1: Quick Action Icon Buttons in Device Cards
**What:** Icon-only buttons in device card footer (SmartHomeCard.Controls area) for immediate actions
**When to use:** Device cards with frequently-used controls (on/off, adjust temperature, change mode)
**Example:**
```javascript
// Source: Existing Button.Icon pattern from design-system.md + User decision (CONTEXT.md)
import { Button } from '@/app/components/ui';
import { Power, Plus, Minus, Fan, Thermometer } from 'lucide-react';

// Stove card quick actions (user decision: On/Off + Power level + Fan)
<SmartHomeCard.Controls className="flex items-center gap-2">
  <Button.Icon
    icon={<Power />}
    aria-label="Toggle Stove Power"
    variant={isOn ? 'ember' : 'subtle'}
    onClick={handleToggle}
  />
  <div className="flex items-center gap-1">
    <Button.Icon
      icon={<Minus />}
      aria-label="Decrease Power Level"
      variant="subtle"
      onClick={() => adjustPower(-1)}
      disabled={powerLevel <= 1}
    />
    <span className="text-sm font-medium w-8 text-center">{powerLevel}</span>
    <Button.Icon
      icon={<Plus />}
      aria-label="Increase Power Level"
      variant="subtle"
      onClick={() => adjustPower(1)}
      disabled={powerLevel >= 5}
    />
  </div>
  <Button.Icon
    icon={<Fan />}
    aria-label="Adjust Fan Speed"
    variant="subtle"
    onClick={openFanModal}
  />
</SmartHomeCard.Controls>

// Thermostat card quick actions (user decision: Temperature + Mode)
<SmartHomeCard.Controls className="flex items-center justify-between">
  <div className="flex items-center gap-1">
    <Button.Icon
      icon={<Minus />}
      aria-label="Decrease Temperature"
      variant="subtle"
      onClick={() => adjustTemp(-0.5)}
    />
    <span className="text-lg font-medium w-12 text-center">{temp}°C</span>
    <Button.Icon
      icon={<Plus />}
      aria-label="Increase Temperature"
      variant="subtle"
      onClick={() => adjustTemp(0.5)}
    />
  </div>
  <Button.Icon
    icon={<Thermometer />}
    aria-label="Change Mode"
    variant="subtle"
    onClick={cycleThermostatMode}
  />
</SmartHomeCard.Controls>

// Lights card quick actions (Claude's discretion: On/Off + Brightness)
<SmartHomeCard.Controls className="flex items-center gap-2">
  <Button.Icon
    icon={<Power />}
    aria-label="Toggle Lights"
    variant={isOn ? 'ember' : 'subtle'}
    onClick={handleToggle}
  />
  <Slider
    value={brightness}
    onChange={setBrightness}
    min={0}
    max={100}
    aria-label="Brightness"
    className="flex-1"
  />
</SmartHomeCard.Controls>
```

### Pattern 2: Device Commands in Command Palette
**What:** Extend existing CommandPalette with device-specific actions organized by device type
**When to use:** Power users navigating with ⌘K/Ctrl+K shortcuts
**Example:**
```javascript
// Source: Existing CommandPalette.js pattern + User decision (device commands)
// lib/commands/deviceCommands.js
import { Power, Plus, Minus, Thermometer, Lightbulb } from 'lucide-react';

export function getDeviceCommands(devices) {
  return [
    {
      heading: 'Stove Actions',
      items: [
        {
          id: 'stove-toggle',
          label: 'Toggle Stove Power',
          icon: <Power className="w-4 h-4" />,
          shortcut: '⌘S',
          onSelect: () => toggleStove(),
        },
        {
          id: 'stove-increase',
          label: 'Increase Stove Power',
          icon: <Plus className="w-4 h-4" />,
          onSelect: () => adjustStovePower(1),
        },
      ],
    },
    {
      heading: 'Thermostat Actions',
      items: [
        {
          id: 'thermo-increase',
          label: 'Increase Temperature',
          icon: <Plus className="w-4 h-4" />,
          shortcut: '⌘↑',
          onSelect: () => adjustTemp(0.5),
        },
        {
          id: 'thermo-decrease',
          label: 'Decrease Temperature',
          icon: <Minus className="w-4 h-4" />,
          shortcut: '⌘↓',
          onSelect: () => adjustTemp(-0.5),
        },
        {
          id: 'thermo-mode',
          label: 'Change Thermostat Mode',
          icon: <Thermometer className="w-4 h-4" />,
          onSelect: () => cycleThermostatMode(),
        },
      ],
    },
    {
      heading: 'Lights Actions',
      items: [
        {
          id: 'lights-toggle',
          label: 'Toggle Lights',
          icon: <Lightbulb className="w-4 h-4" />,
          shortcut: '⌘L',
          onSelect: () => toggleLights(),
        },
      ],
    },
  ];
}
```

### Pattern 3: Manual Component Audit with Runtime Accessibility
**What:** Manual inspection of all pages with axe-core-react for runtime accessibility checks
**When to use:** Application-wide component consistency verification (this phase)
**Example:**
```javascript
// Source: User decision (fix immediately, no report) + axe-core-react best practices
// app/layout.js (development mode only)
'use client';

import { useEffect } from 'react';

export default function RootLayout({ children }) {
  useEffect(() => {
    // Only run in development
    if (process.env.NODE_ENV !== 'development') return;

    // Load axe-core-react dynamically
    import('@axe-core/react').then((axe) => {
      const React = require('react');
      const ReactDOM = require('react-dom');
      axe.default(React, ReactDOM, 1000); // 1 second debounce
    });
  }, []);

  return (
    <html>
      <body>{children}</body>
    </html>
  );
}

// Manual audit checklist:
// 1. Visit every page (including /debug/*)
// 2. Check Chrome DevTools console for axe violations
// 3. Fix issues immediately (no documentation phase)
// 4. Verify patterns:
//    - Button.Icon has aria-label (not title)
//    - SmartHomeCard.Controls keyboard navigable
//    - Slider has aria-label
//    - CommandPalette items keyboard navigable
```

### Pattern 4: Context Menu Integration (if Phase 32 implemented)
**What:** Right-click/long-press context menu on device cards with extended actions
**When to use:** Device cards that support context menu (Phase 32 RightClickMenu component)
**Example:**
```javascript
// Source: Phase 32 RESEARCH.md + User decision (extended scope, no destructive actions)
import RightClickMenu from '@/app/components/ui/RightClickMenu';
import { Settings, Info, Activity, RotateCcw } from 'lucide-react';

<RightClickMenu.Root>
  <RightClickMenu.Trigger asChild>
    <div className="cursor-context-menu">
      {/* Device card content */}
    </div>
  </RightClickMenu.Trigger>

  <RightClickMenu.Portal>
    <RightClickMenu.Content>
      {/* User decision: Extended scope beyond quick buttons */}
      <RightClickMenu.Item onSelect={() => router.push('/settings/device')}>
        <Settings className="w-4 h-4" />
        <span>Device Settings</span>
      </RightClickMenu.Item>

      <RightClickMenu.Item onSelect={() => openDetailsModal()}>
        <Info className="w-4 h-4" />
        <span>View Details</span>
      </RightClickMenu.Item>

      <RightClickMenu.Separator />

      <RightClickMenu.Item onSelect={() => viewActivity()}>
        <Activity className="w-4 h-4" />
        <span>Activity Log</span>
      </RightClickMenu.Item>

      <RightClickMenu.Item onSelect={() => resetDevice()}>
        <RotateCcw className="w-4 h-4" />
        <span>Reset Device</span>
      </RightClickMenu.Item>

      {/* User decision: No destructive actions in context menu */}
      {/* Disconnect/remove only in device settings page */}
    </RightClickMenu.Content>
  </RightClickMenu.Portal>
</RightClickMenu.Root>
```

### Anti-Patterns to Avoid
- **Overloading quick actions:** User decision limits to 3-4 buttons (Stove: 3 button groups, Thermostat: 2 groups). More actions belong in context menu or settings page.
- **Generic aria-labels:** "Button 1" fails accessibility. Use descriptive labels: "Increase Temperature" or "Toggle Stove Power".
- **Mixing Button.Icon with regular Button in Controls:** Controls area should have consistent visual weight. Either all icon buttons or all labeled buttons.
- **Forgetting disabled states:** Power level at max? Disable increment button. Already provides visual feedback without error toasts.
- **Creating audit report document:** User decision explicitly says "fix issues as encountered" not "document issues". No AUDIT-REPORT.md.
- **Skipping Debug pages in audit:** User decision says "all pages including Debug pages". `/debug/*` routes must be checked.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Icon-only action buttons | Custom <button> with icon | Button.Icon component | Built-in aria-label requirement, consistent sizing, variant support |
| Runtime accessibility audit | Custom violation detector | axe-core-react | Industry standard (30-40% automation), Deque Systems maintains, integrates with Chrome DevTools |
| Command Palette device commands | Custom modal with search | Extend existing CommandPalette | Already has fuzzy search, keyboard nav, haptic feedback, ⌘K shortcut |
| Consistent spacing in Controls | Manual px/rem values | SmartHomeCard.Controls className="flex gap-2" | Design system enforces 8px (0.5rem) gap, responsive adjustments |
| Touch target sizing | Custom CSS for 44px minimum | Button.Icon default size | Already meets WCAG 2.5.5 (44x44px on mobile) |
| Context menu on device cards | Custom useEffect with right-click | RightClickMenu from Phase 32 | Handles collision detection, mobile long-press, accessibility |
| Component usage audit | grep/find command | Manual inspection with axe-core-react | Runtime checks catch actual violations; static analysis misses dynamic content |

**Key insight:** The project already has a mature design system (Ember Noir v4.0) with all necessary components. Quick actions are not new UI elements—they're existing Button.Icon components in a specific layout pattern. Audit is not automated tooling—it's manual verification with accessibility runtime checking.

## Common Pitfalls

### Pitfall 1: Missing aria-label on Button.Icon
**What goes wrong:** Icon-only buttons fail WCAG 4.1.2 (Name, Role, Value). Screen readers announce "button" with no context.
**Why it happens:** Developer forgets Button.Icon requires aria-label (not optional).
**How to avoid:** Button.Icon type definition enforces aria-label in TypeScript. For JavaScript, design system documentation states "aria-label (required)".
**Warning signs:** axe-core-react violation: "Buttons must have discernible text".
**Source:** [WCAG 4.1.2](https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html), design-system.md

### Pitfall 2: Quick Actions Not in Controls Area
**What goes wrong:** Quick action buttons placed above card content or in SmartHomeCard.Header break visual hierarchy and responsive layout.
**Why it happens:** Developer doesn't understand SmartHomeCard architecture (Header for title/status, Controls for actions).
**How to avoid:** Follow existing pattern: SmartHomeCard.Controls is the dedicated footer action area. All device cards (StoveCard, ThermostatCard, LightsCard) use this pattern.
**Warning signs:** Quick actions appear at top of card or mixed with status badges.
**Source:** design-system.md SmartHomeCard namespace pattern, DeviceCard.js line 233-248

### Pitfall 3: Overloading Controls with Too Many Buttons
**What goes wrong:** 5+ icon buttons in Controls area creates cluttered UI, poor mobile experience, decision fatigue.
**Why it happens:** Developer tries to expose all device features as quick actions.
**How to avoid:** User decision limits quick actions to frequent operations only (3-4 button groups max). Extended functionality belongs in context menu or settings page.
**Warning signs:** Controls area wraps to multiple rows on mobile, buttons smaller than 44x44px touch targets.
**Source:** [Best Practices for Cards](https://uxplanet.org/best-practices-for-cards-fa45e3ad94dd), CONTEXT.md user decisions

### Pitfall 4: Forgetting to Fix Issues During Audit
**What goes wrong:** Developer creates AUDIT-REPORT.md with list of issues, plans to fix "later". Technical debt accumulates.
**Why it happens:** Misunderstanding user decision: "No report document, just fix issues as encountered".
**How to avoid:** Open page in dev mode → Check console for axe violations → Fix immediately → Move to next page. No documentation phase.
**Warning signs:** Pull request includes AUDIT-REPORT.md or TODO comments like "// TODO: fix accessibility".
**Source:** CONTEXT.md user decision (Audit Criteria section)

### Pitfall 5: Skipping Debug Pages in Audit
**What goes wrong:** Debug pages (`/debug/*`) use old component patterns, fail accessibility checks, inconsistent with main app.
**Why it happens:** Developer assumes "debug pages don't need production quality".
**How to avoid:** User decision explicitly says "all pages including Debug pages". Audit checklist must include every route.
**Warning signs:** `/debug/design-system` uses raw HTML instead of design system components.
**Source:** CONTEXT.md user decision (Audit Criteria: "Scope: All pages including Debug pages")

### Pitfall 6: Not Disabling Buttons at Boundaries
**What goes wrong:** Increment button remains enabled when power level is at maximum (5). User clicks, nothing happens, feels broken.
**Why it happens:** Developer forgets to check state boundaries in onClick handler.
**How to avoid:** Add disabled prop when at min/max: `disabled={powerLevel >= 5}` for increment, `disabled={powerLevel <= 1}` for decrement.
**Warning signs:** Buttons clickable but no state change, users report "buttons don't work".
**Source:** ControlButton.js existing pattern (lines 85-90), design-system.md

### Pitfall 7: Using title Instead of aria-label
**What goes wrong:** Button has `title="Increase Power"` but no aria-label. Screen readers don't announce title attribute reliably.
**Why it happens:** Developer confuses title (visual tooltip) with aria-label (accessible name).
**How to avoid:** Button.Icon enforces aria-label. Use aria-label for accessibility, title is optional for sighted users.
**Warning signs:** axe-core-react violation even though title exists.
**Source:** [Accessible Icon Buttons](https://www.sarasoueidan.com/blog/accessible-icon-buttons/), design-system.md

### Pitfall 8: Command Palette Input Not Handling Parameterized Commands
**What goes wrong:** User types "set temperature 22" in Command Palette, command doesn't parse input value.
**Why it happens:** User decision says "Claude's discretion on input handling" but no pattern implemented.
**How to avoid:** For parameterized commands (temperature, brightness), either:
  - Option A: Show modal after selection ("Increase Temperature" → opens modal with slider)
  - Option B: Parse natural language input (complex, not recommended for this phase)
  Recommendation: Option A (modal) for simplicity.
**Warning signs:** Command items say "Set Temperature" but no way to specify value.
**Source:** CONTEXT.md user decision (Command Palette input handling for parameterized commands)

## Code Examples

Verified patterns from official sources:

### Stove Card Quick Actions
```javascript
// Source: User decision from CONTEXT.md + existing SmartHomeCard.Controls pattern
// app/components/devices/stove/StoveCard.js
import { Button } from '@/app/components/ui';
import { Power, Plus, Minus, Fan } from 'lucide-react';

export default function StoveCard() {
  const [isOn, setIsOn] = useState(false);
  const [powerLevel, setPowerLevel] = useState(3);

  function adjustPower(delta) {
    setPowerLevel((prev) => Math.max(1, Math.min(5, prev + delta)));
  }

  return (
    <SmartHomeCard icon="🔥" title="Stufa" colorTheme="ember">
      {/* Card content */}

      <SmartHomeCard.Controls className="flex items-center gap-2 justify-between">
        {/* User decision: On/Off toggle */}
        <Button.Icon
          icon={<Power />}
          aria-label={isOn ? "Turn Off Stove" : "Turn On Stove"}
          variant={isOn ? 'ember' : 'subtle'}
          onClick={() => setIsOn(!isOn)}
        />

        {/* User decision: Power level adjustment */}
        <div className="flex items-center gap-1">
          <Button.Icon
            icon={<Minus />}
            aria-label="Decrease Power Level"
            variant="subtle"
            size="sm"
            onClick={() => adjustPower(-1)}
            disabled={powerLevel <= 1}
          />
          <span className="text-sm font-medium w-8 text-center" aria-live="polite">
            {powerLevel}
          </span>
          <Button.Icon
            icon={<Plus />}
            aria-label="Increase Power Level"
            variant="subtle"
            size="sm"
            onClick={() => adjustPower(1)}
            disabled={powerLevel >= 5}
          />
        </div>

        {/* User decision: Fan control */}
        <Button.Icon
          icon={<Fan />}
          aria-label="Adjust Fan Speed"
          variant="subtle"
          onClick={openFanModal}
        />
      </SmartHomeCard.Controls>
    </SmartHomeCard>
  );
}
```

### Thermostat Card Quick Actions
```javascript
// Source: User decision from CONTEXT.md + existing pattern
// app/components/devices/thermostat/ThermostatCard.js
import { Button, Slider } from '@/app/components/ui';
import { Plus, Minus, Thermometer } from 'lucide-react';

export default function ThermostatCard() {
  const [temp, setTemp] = useState(21.5);
  const [mode, setMode] = useState('schedule'); // 'schedule' | 'manual' | 'away'

  function cycleThermostatMode() {
    const modes = ['schedule', 'manual', 'away'];
    const currentIndex = modes.indexOf(mode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setMode(nextMode);
  }

  return (
    <SmartHomeCard icon="🌡️" title="Termostato" colorTheme="ocean">
      {/* Card content */}

      <SmartHomeCard.Controls className="flex items-center justify-between gap-4">
        {/* User decision: Temperature adjustment */}
        <div className="flex items-center gap-1">
          <Button.Icon
            icon={<Minus />}
            aria-label="Decrease Temperature"
            variant="subtle"
            onClick={() => setTemp((prev) => Math.max(15, prev - 0.5))}
            disabled={temp <= 15}
          />
          <span className="text-lg font-medium w-12 text-center" aria-live="polite">
            {temp}°C
          </span>
          <Button.Icon
            icon={<Plus />}
            aria-label="Increase Temperature"
            variant="subtle"
            onClick={() => setTemp((prev) => Math.min(30, prev + 0.5))}
            disabled={temp >= 30}
          />
        </div>

        {/* User decision: Mode switcher (Schedule/Manual/Away) */}
        <Button.Icon
          icon={<Thermometer />}
          aria-label={`Change Mode (Current: ${mode})`}
          variant="subtle"
          onClick={cycleThermostatMode}
        />
      </SmartHomeCard.Controls>
    </SmartHomeCard>
  );
}
```

### Lights Card Quick Actions (Claude's Discretion)
```javascript
// Source: Claude's discretion (user decision delegates to research) + existing Slider pattern
// app/components/devices/lights/LightsCard.js
import { Button, Slider } from '@/app/components/ui';
import { Power, Palette } from 'lucide-react';

export default function LightsCard() {
  const [isOn, setIsOn] = useState(false);
  const [brightness, setBrightness] = useState(80);

  return (
    <SmartHomeCard icon="💡" title="Luci" colorTheme="warning">
      {/* Card content */}

      <SmartHomeCard.Controls className="space-y-3">
        {/* Claude's discretion: On/Off + Brightness */}
        <div className="flex items-center justify-between gap-3">
          <Button.Icon
            icon={<Power />}
            aria-label={isOn ? "Turn Off Lights" : "Turn On Lights"}
            variant={isOn ? 'ember' : 'subtle'}
            onClick={() => setIsOn(!isOn)}
          />

          <Slider
            value={brightness}
            onChange={setBrightness}
            min={0}
            max={100}
            aria-label="Brightness"
            disabled={!isOn}
            className="flex-1"
          />

          <span className="text-sm font-medium w-12 text-right" aria-live="polite">
            {brightness}%
          </span>
        </div>

        {/* Optional: Color picker button (if supported) */}
        <Button
          variant="subtle"
          className="w-full"
          onClick={openColorPicker}
        >
          <Palette className="w-4 h-4 mr-2" />
          Choose Color
        </Button>
      </SmartHomeCard.Controls>
    </SmartHomeCard>
  );
}
```

### Device Commands in Command Palette
```javascript
// Source: Existing CommandPalette.js + user decision (device command organization)
// lib/commands/deviceCommands.js
import { Power, Plus, Minus, Thermometer, Fan, Lightbulb } from 'lucide-react';

/**
 * Get device-specific commands for Command Palette
 * User decision: Organize by device type with clear grouping
 */
export function getDeviceCommands() {
  return [
    {
      heading: 'Stove',
      items: [
        {
          id: 'stove-toggle',
          label: 'Toggle Stove Power',
          icon: <Power className="w-4 h-4" />,
          shortcut: '⌘S',
          onSelect: async () => {
            await fetch('/api/stove/toggle', { method: 'POST' });
            // Haptic feedback handled by CommandPalette
          },
        },
        {
          id: 'stove-increase',
          label: 'Increase Stove Power',
          icon: <Plus className="w-4 h-4" />,
          onSelect: async () => {
            await fetch('/api/stove/power', {
              method: 'POST',
              body: JSON.stringify({ delta: 1 }),
            });
          },
        },
        {
          id: 'stove-decrease',
          label: 'Decrease Stove Power',
          icon: <Minus className="w-4 h-4" />,
          onSelect: async () => {
            await fetch('/api/stove/power', {
              method: 'POST',
              body: JSON.stringify({ delta: -1 }),
            });
          },
        },
      ],
    },
    {
      heading: 'Thermostat',
      items: [
        {
          id: 'thermo-increase',
          label: 'Increase Temperature (+0.5°C)',
          icon: <Plus className="w-4 h-4" />,
          shortcut: '⌘↑',
          onSelect: async () => {
            await fetch('/api/thermostat/adjust', {
              method: 'POST',
              body: JSON.stringify({ delta: 0.5 }),
            });
          },
        },
        {
          id: 'thermo-decrease',
          label: 'Decrease Temperature (-0.5°C)',
          icon: <Minus className="w-4 h-4" />,
          shortcut: '⌘↓',
          onSelect: async () => {
            await fetch('/api/thermostat/adjust', {
              method: 'POST',
              body: JSON.stringify({ delta: -0.5 }),
            });
          },
        },
        {
          id: 'thermo-mode',
          label: 'Change Thermostat Mode',
          icon: <Thermometer className="w-4 h-4" />,
          // User decision: Claude's discretion on input handling
          // Recommendation: Open modal for mode selection
          onSelect: () => {
            openThermostatModeModal();
          },
        },
      ],
    },
    {
      heading: 'Lights',
      items: [
        {
          id: 'lights-toggle',
          label: 'Toggle Lights',
          icon: <Lightbulb className="w-4 h-4" />,
          shortcut: '⌘L',
          onSelect: async () => {
            await fetch('/api/lights/toggle', { method: 'POST' });
          },
        },
      ],
    },
  ];
}

// Usage in CommandPaletteProvider
import { getDeviceCommands } from '@/lib/commands/deviceCommands';
import { getNavigationCommands } from '@/lib/commands/navigationCommands';

const allCommands = [
  ...getNavigationCommands(),
  ...getDeviceCommands(),
  ...getSettingsCommands(),
];

<CommandPalette open={open} onOpenChange={setOpen} commands={allCommands} />
```

### Manual Audit with axe-core-react
```javascript
// Source: axe-core-react documentation + user decision (fix immediately)
// app/layout.js
'use client';

import { useEffect } from 'react';

export default function RootLayout({ children }) {
  // Runtime accessibility auditing (development only)
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    import('@axe-core/react').then((axe) => {
      const React = require('react');
      const ReactDOM = require('react-dom');
      axe.default(React, ReactDOM, 1000); // 1 second debounce
    });
  }, []);

  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}

// Manual audit process (no automated report):
// 1. Start dev server: npm run dev
// 2. Open Chrome DevTools Console
// 3. Visit each page (including /debug/*)
// 4. Check for axe violations in console
// 5. Fix violations immediately:
//    - Missing aria-label → Add to Button.Icon
//    - Missing alt text → Add to images
//    - Color contrast → Use design system variants
//    - Keyboard trap → Verify Radix Dialog focus management
// 6. Re-check page, verify violation fixed
// 7. Move to next page
// 8. No AUDIT-REPORT.md creation (user decision)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Text buttons in device cards | Icon-only action buttons (Button.Icon) | Design System v3.0+ (2025) | Cleaner UI, better mobile experience, follows iOS/Android patterns |
| Static navigation only | Command Palette with device actions | Modern apps (Linear, Raycast) 2022+ | Power users can control devices without clicking, keyboard-first workflow |
| Automated component migration with codemods | Manual audit with runtime accessibility checks | React 19 era (2024+) | Codemods create false positives; manual verification more reliable for small codebases |
| Separate audit phase with report | Fix-as-you-go approach | Agile best practices (2020+) | No technical debt accumulation, faster delivery |
| Custom accessibility checkers | axe-core-react industry standard | Deque Systems 2015+ | 30-40% automated coverage, maintained by accessibility experts |

**Deprecated/outdated:**
- **react-codemod for component migration**: Useful for large refactors (React 18→19), overkill for design system consistency check
- **Manual accessibility testing only**: Runtime tools like axe-core-react catch 30-40% automatically; manual testing catches the rest
- **Audit report documents**: Living in Markdown creates stale documentation; fix immediately instead

## Open Questions

Things that couldn't be fully resolved:

1. **Should Camera card have quick actions?**
   - What we know: User decision says "Claude's discretion based on device capabilities"
   - What's unclear: Camera API capabilities not documented in project. Likely read-only (view stream)?
   - Recommendation: If camera supports snapshot capture, add single Button.Icon for "Take Snapshot". If read-only, no quick actions (just "View Stream" button in Controls).

2. **How should parameterized commands handle input in Command Palette?**
   - What we know: User decision says "Claude's discretion on input handling for parameterized commands (e.g., temperature)"
   - What's unclear: Should palette parse "set temperature 22" or open modal for input?
   - Recommendation: Open modal after command selection. Parsing natural language adds complexity with little UX benefit. Commands like "Increase Temperature" are clear and keyboard-friendly.

3. **Should context menu keyboard shortcuts be shown in the menu?**
   - What we know: User decision says "Claude's discretion on context menu keyboard shortcuts"
   - What's unclear: If shortcuts are shown in Command Palette (e.g., ⌘S for "Toggle Stove"), should they also appear in context menu?
   - Recommendation: No. User decision says "no keyboard shortcuts in menu items (shown in Command Palette instead)". Avoid duplication.

4. **What if axe-core-react doesn't catch all issues?**
   - What we know: Automated tools catch 30-40% of accessibility issues
   - What's unclear: Should manual testing with screen readers be required?
   - Recommendation: Phase 36 focuses on component consistency and automated checks. Manual screen reader testing is out of scope (could be Phase 37 if needed). Document assumption in plan.

## Sources

### Primary (HIGH confidence)
- Project's existing design-system.md - SmartHomeCard.Controls pattern, Button.Icon API
- Project's existing DeviceCard.js - SmartHomeCard integration, Controls area usage (line 233-248)
- Project's existing CommandPalette.js - Command structure, haptic feedback pattern
- [WCAG 2.1 Name, Role, Value (4.1.2)](https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html) - aria-label requirements
- [axe-core-react npm](https://www.npmjs.com/package/@axe-core/react) - Runtime accessibility auditing
- User decisions from CONTEXT.md - Locked choices for quick actions, audit criteria

### Secondary (MEDIUM confidence)
- [Best Practices for Cards (Nick Babich)](https://uxplanet.org/best-practices-for-cards-fa45e3ad94dd) - Action button placement, limiting actions
- [Card-Based UI Design: Structure and Best Practices](https://medium.com/design-bootcamp/spticard-based-ui-design-structure-advantages-and-best-practices-69042d1f0786) - Bottom action bar pattern
- [Accessible Icon Buttons (Sara Soueidan)](https://www.sarasoueidan.com/blog/accessible-icon-buttons/) - aria-label vs title
- [React Accessibility Testing Tools](https://medium.com/@ignatovich.dm/accessibility-testing-in-react-tools-and-best-practices-119f3c0aee6e) - axe-core-react integration
- [Codemods for Code Migration (Vasanthan K)](https://medium.com/@vasanthancomrads/codemods-for-code-migration-a-beginners-guide-to-smarter-refactoring-be90d3c60e41) - When codemods are useful (not this phase)

### Tertiary (LOW confidence)
- [Mobile App Design Trends for 2026](https://thebrandsbureau.com/mobile-app-design-trends-2026/) - Microinteractions, neomorphism (general trends, not specific to this project)
- [32 UI Elements Designers Need To Know](https://careerfoundry.com/en/blog/ui-design/ui-element-glossary/) - General UI element patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in project (lucide-react, cmdk, Radix UI), versions verified in package.json
- Architecture: HIGH - User decisions provide specific constraints, existing patterns well-documented in design-system.md
- Pitfalls: HIGH - axe-core-react violations documented, WCAG standards verified, user decision anti-patterns identified

**Research date:** 2026-02-05
**Valid until:** 2026-03-07 (30 days - stable domain, well-established patterns)

**Notes:**
- User decisions from CONTEXT.md significantly constrain scope (locked choices for quick actions, audit approach, Command Palette scope)
- Existing project patterns strongly influence architecture (Button.Icon, SmartHomeCard.Controls, CommandPalette structure already established)
- No new dependencies required (all libraries already in package.json)
- Manual audit approach chosen over automated codemods (user decision: fix immediately, small codebase)
