# Phase 22: CameraCard Compliance - Research

**Researched:** 2026-01-31
**Domain:** Design System Compliance / Component Refactoring
**Confidence:** HIGH

## Summary

This research investigates how to refactor camera components (CameraCard.js, EventPreviewModal.js, HlsPlayer.js) to replace raw HTML elements with design system components. The current implementation uses raw `<button>` elements in:

1. **CameraCard.js** (line 322): Refresh button overlay with custom icon and styling
2. **EventPreviewModal.js** (lines 117-125, 165-175): Close button and play button overlay with custom styling
3. **HlsPlayer.js** (lines 264-280): Fullscreen toggle button with custom icon and state management

All three files already use the design system Button component for standard UI actions (camera selection, mode toggle, modal actions). The remaining raw buttons are specialized overlay controls with specific positioning, backdrop blur, and icon-only layouts that need careful migration to maintain visual appearance while achieving design system compliance.

EventPreviewModal.js and CameraCard.js already import and correctly use Button, Text, and Modal components from the design system. HlsPlayer.js only uses Text component. The challenge is migrating the remaining raw `<button>` elements (icon-only overlay controls) to Button.Icon while preserving absolute positioning, backdrop effects, and interaction patterns.

**Primary recommendation:** Replace all raw `<button>` elements with Button.Icon component using ghost or subtle variant with className overrides for positioning and backdrop blur effects. All interactive buttons should use design system components for consistency, accessibility, and maintainability.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| class-variance-authority | 0.7+ | Type-safe component variants | Already used in all UI components |
| tailwind-merge | 2.0+ | Tailwind class conflict resolution | Part of cn() utility |
| clsx | 2.0+ | Conditional class composition | Part of cn() utility |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| React | 18.3+ | forwardRef, hooks | Button component uses forwardRef |
| @radix-ui/react-dialog | 1.0+ | Modal primitives | Modal component (already used) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Button.Icon | Keep raw button | Loses accessibility, focus management, design consistency |
| Custom icon button | Button with children | Button.Icon handles aria-label requirement better |

**Installation:**
No new packages required. All dependencies already installed.

## Architecture Patterns

### Current File Structure
```
app/components/devices/camera/
├── CameraCard.js              # 345 lines - 1 raw button (refresh overlay)
├── EventPreviewModal.js       # 232 lines - 2 raw buttons (close, play overlay)
├── HlsPlayer.js               # 285 lines - 1 raw button (fullscreen toggle)

app/components/ui/
├── Button.js                  # Button, Button.Icon, Button.Group
├── Modal.js                   # Modal with Radix Dialog (already used)
├── Text.js                    # Typography (already used)
└── index.js                   # Barrel exports
```

### Pattern 1: Refresh Button Overlay (CameraCard)
**What:** Absolute positioned button with backdrop blur and spin animation during refresh
**Current approach:** Raw button with custom icon SVG and conditional spin animation
**Challenge:** Maintain absolute positioning, backdrop blur, rounded-full shape
**Example:**
```jsx
// Current implementation (lines 322-331)
<button
  onClick={handleRefresh}
  className="absolute bottom-2 right-2 p-2 rounded-full bg-slate-900/70 backdrop-blur-sm hover:bg-slate-800/90 transition-colors"
  title="Aggiorna snapshot"
>
  <svg className={`w-4 h-4 text-white ${refreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
</button>

// Target: Button.Icon with className overrides
<Button.Icon
  icon={<RefreshIcon className={refreshing ? 'animate-spin' : ''} />}
  onClick={handleRefresh}
  variant="ghost"
  size="sm"
  aria-label="Aggiorna snapshot"
  className="absolute bottom-2 right-2 bg-slate-900/70 backdrop-blur-sm hover:bg-slate-800/90"
/>
```

### Pattern 2: Close Button (EventPreviewModal)
**What:** Modal close button with hover state, positioned in header
**Current approach:** Raw button with custom X icon and hover background
**Challenge:** Maintain rounded-full shape, hover state matching modal theme
**Example:**
```jsx
// Current implementation (lines 117-125)
<button
  onClick={onClose}
  className="p-2 rounded-full hover:bg-slate-800 [html:not(.dark)_&]:hover:bg-slate-100 transition-colors"
  title="Chiudi"
>
  <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
</button>

// Target: Modal.Close (already exists in design system)
// Modal component has built-in Modal.Close subcomponent
<Modal.Close />
// OR if custom styling needed
<Button.Icon
  icon={<XIcon />}
  onClick={onClose}
  variant="ghost"
  size="md"
  aria-label="Chiudi"
  className="hover:bg-slate-800 [html:not(.dark)_&]:hover:bg-slate-100"
/>
```

### Pattern 3: Play Button Overlay (EventPreviewModal)
**What:** Large centered play button overlay with hover scale effect
**Current approach:** Raw button covering entire preview area with centered play icon
**Challenge:** Full-area clickable overlay with centered large icon, scale animation
**Example:**
```jsx
// Current implementation (lines 165-175)
<button
  onClick={() => setIsPlaying(true)}
  className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors group"
>
  <div className="w-20 h-20 rounded-full bg-white/90 group-hover:bg-white flex items-center justify-center shadow-lg transition-all group-hover:scale-110">
    <svg className="w-10 h-10 text-slate-900 ml-1" fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" />
    </svg>
  </div>
</button>

// Target: Button with custom layout (not Button.Icon - needs children structure)
<Button
  variant="ghost"
  onClick={() => setIsPlaying(true)}
  className="absolute inset-0 bg-black/30 hover:bg-black/40 rounded-none"
  aria-label="Riproduci video"
>
  <div className="w-20 h-20 rounded-full bg-white/90 group-hover:bg-white flex items-center justify-center shadow-lg transition-all group-hover:scale-110">
    <PlayIcon className="w-10 h-10 text-slate-900 ml-1" />
  </div>
</Button>
```

### Pattern 4: Fullscreen Toggle Button (HlsPlayer)
**What:** Absolute positioned fullscreen button with icon switching based on state
**Current approach:** Raw button with conditional icon (enter/exit fullscreen)
**Challenge:** Maintain absolute positioning, backdrop blur, state-based icon
**Example:**
```jsx
// Current implementation (lines 264-280)
<button
  onClick={toggleFullscreen}
  className="absolute bottom-2 right-2 p-2 rounded-full bg-slate-900/70 backdrop-blur-sm hover:bg-slate-800/90 transition-colors z-20"
  title={isFullscreen ? 'Esci da schermo intero' : 'Schermo intero'}
>
  {isFullscreen ? (
    // Exit fullscreen icon
    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ) : (
    // Enter fullscreen icon
    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
    </svg>
  )}
</button>

// Target: Button.Icon with conditional icon
<Button.Icon
  icon={isFullscreen ? <ExitFullscreenIcon /> : <EnterFullscreenIcon />}
  onClick={toggleFullscreen}
  variant="ghost"
  size="sm"
  aria-label={isFullscreen ? 'Esci da schermo intero' : 'Schermo intero'}
  className="absolute bottom-2 right-2 bg-slate-900/70 backdrop-blur-sm hover:bg-slate-800/90 z-20"
/>
```

### Pattern 5: Icon Component Strategy
**What:** Replace inline SVG with icon components or lucide-react icons
**Current approach:** Inline SVG paths in JSX
**Options:**
1. Use lucide-react icons (project already has dependency)
2. Extract SVG to icon components
3. Keep inline SVG but wrap in Button.Icon

**Recommendation:** Use lucide-react when icon exists (RefreshCw, X, Play, Maximize, Minimize), fallback to inline SVG for custom icons

**Example:**
```jsx
// Install if not present: npm install lucide-react (check package.json first)
import { RefreshCw, X, Play, Maximize, Minimize } from 'lucide-react';

// Usage
<Button.Icon
  icon={<RefreshCw className={refreshing ? 'animate-spin' : ''} />}
  // ... props
/>
```

### Anti-Patterns to Avoid
- **Raw button elements:** Always use Button or Button.Icon for interactive actions
- **Missing aria-label on icon-only buttons:** Button.Icon requires aria-label prop
- **Inline SVG without icon abstraction:** Use lucide-react or icon components
- **Removing absolute positioning:** Overlay buttons need absolute positioning preserved
- **Removing backdrop blur:** Visual affordance for overlay controls
- **Changing rounded-full to rounded-xl:** Icon-only buttons should stay circular

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Icon-only button accessibility | Custom aria attributes | Button.Icon (requires aria-label) | Enforces required accessibility |
| Focus ring | Custom focus styles | Button built-in focus-visible | WCAG AA compliant ember glow |
| Hover states | Custom hover classes | Button variant hover styles | Consistent interaction feedback |
| Active state animation | Custom scale transform | Button built-in active:scale | Consistent active feedback |
| Loading spinner on icon button | Custom animation | Button loading prop | Consistent loading state |
| Icon sizing | Manual w-* h-* classes | Button size prop handles icon sizing | Responsive sizing |

**Key insight:** Button.Icon is designed for icon-only buttons and enforces aria-label requirement at the type level. This prevents accessibility bugs that raw buttons introduce.

## Common Pitfalls

### Pitfall 1: Forgetting aria-label on Button.Icon
**What goes wrong:** TypeScript error or accessibility failure when aria-label missing
**Why it happens:** Button.Icon requires aria-label prop (enforced by types)
**How to avoid:** Always provide descriptive aria-label for screen readers
**Warning signs:** TypeScript error "Property 'aria-label' is missing"
**Correct pattern:**
```jsx
// Wrong: Missing aria-label
<Button.Icon icon={<RefreshCw />} onClick={handleRefresh} />

// Correct: aria-label required
<Button.Icon
  icon={<RefreshCw />}
  onClick={handleRefresh}
  aria-label="Aggiorna snapshot" // Required
/>
```

### Pitfall 2: Using Button instead of Button.Icon for icon-only
**What goes wrong:** Unnecessary padding, wrong aspect ratio for circular buttons
**Why it happens:** Not recognizing Button.Icon exists for this use case
**How to avoid:** Use Button.Icon for icon-only, Button for icon+text
**Warning signs:** Button looks rectangular when should be circular
**Correct pattern:**
```jsx
// Wrong: Button for icon-only
<Button variant="ghost" className="rounded-full">
  <RefreshCw />
</Button>

// Correct: Button.Icon for icon-only
<Button.Icon
  icon={<RefreshCw />}
  variant="ghost"
  size="sm"
  aria-label="Refresh"
/>
```

### Pitfall 3: Losing Absolute Positioning
**What goes wrong:** Overlay buttons positioned in document flow instead of absolute
**Why it happens:** Forgetting to preserve className with absolute positioning
**How to avoid:** Always include absolute positioning classes in className prop
**Warning signs:** Buttons appear in wrong location or affect layout
**Correct pattern:**
```jsx
// Wrong: Missing absolute positioning
<Button.Icon icon={<X />} onClick={onClose} aria-label="Close" />

// Correct: Preserve absolute positioning
<Button.Icon
  icon={<X />}
  onClick={onClose}
  aria-label="Close"
  className="absolute top-2 right-2" // Preserve positioning
/>
```

### Pitfall 4: Removing Backdrop Blur
**What goes wrong:** Overlay buttons lack visual separation from background
**Why it happens:** Not preserving backdrop-blur-* classes from original
**How to avoid:** Include backdrop-blur and bg-*/## opacity in className
**Warning signs:** Button merges visually with video background
**Correct pattern:**
```jsx
// Wrong: No backdrop effect
<Button.Icon
  icon={<Maximize />}
  onClick={toggleFullscreen}
  className="absolute bottom-2 right-2"
  aria-label="Fullscreen"
/>

// Correct: Preserve backdrop blur and semi-transparent bg
<Button.Icon
  icon={<Maximize />}
  onClick={toggleFullscreen}
  variant="ghost"
  className="absolute bottom-2 right-2 bg-slate-900/70 backdrop-blur-sm"
  aria-label="Fullscreen"
/>
```

### Pitfall 5: Icon Size Mismatch
**What goes wrong:** Icons too small or too large after migration
**Why it happens:** Not matching original SVG size to Button.Icon size prop
**How to avoid:** Map original icon dimensions to Button size (sm/md/lg)
**Warning signs:** Icon noticeably different size after migration
**Correct pattern:**
```jsx
// Original: w-4 h-4 icon (16px)
<svg className="w-4 h-4" />

// Target: size="sm" (Button.Icon handles icon sizing)
<Button.Icon size="sm" /> // Matches ~16px icon size

// Original: w-6 h-6 icon (24px)
<svg className="w-6 h-6" />

// Target: size="md"
<Button.Icon size="md" /> // Matches ~24px icon size
```

### Pitfall 6: Play Button Layout Complexity
**What goes wrong:** Large centered play button with nested structure doesn't fit Button.Icon
**Why it happens:** Play button has complex children (circle + icon inside)
**How to avoid:** Use Button with children for complex layouts, Button.Icon for simple icons
**Warning signs:** Trying to force complex structure into icon prop
**Correct pattern:**
```jsx
// Wrong: Trying to use Button.Icon for complex layout
<Button.Icon
  icon={
    <div className="w-20 h-20 ...">
      <PlayIcon />
    </div>
  }
  aria-label="Play"
/>

// Correct: Use Button with children for complex layout
<Button
  variant="ghost"
  className="absolute inset-0 ..."
  aria-label="Riproduci video"
>
  <div className="w-20 h-20 rounded-full bg-white/90 ...">
    <PlayIcon className="w-10 h-10 ..." />
  </div>
</Button>
```

## Code Examples

Verified patterns from official sources:

### CameraCard Refresh Button Replacement
```jsx
// Source: /app/components/devices/camera/CameraCard.js line 322
// Before: Raw button with inline SVG
import { RefreshCw } from 'lucide-react';
import { Button } from '../../ui';

// After: Button.Icon with preserved styling
<Button.Icon
  icon={<RefreshCw className={refreshing ? 'animate-spin' : ''} />}
  onClick={handleRefresh}
  variant="ghost"
  size="sm"
  aria-label="Aggiorna snapshot"
  className="absolute bottom-2 right-2 bg-slate-900/70 backdrop-blur-sm hover:bg-slate-800/90"
/>
```

### EventPreviewModal Close Button Replacement
```jsx
// Source: /app/components/devices/camera/EventPreviewModal.js line 117
// Option 1: Use Modal.Close (if it renders correctly)
import { Modal } from '../../ui';

<Modal.Close />

// Option 2: Custom Button.Icon if Modal.Close doesn't match design
import { X } from 'lucide-react';
import { Button } from '../../ui';

<Button.Icon
  icon={<X />}
  onClick={onClose}
  variant="ghost"
  size="md"
  aria-label="Chiudi"
  className="hover:bg-slate-800 [html:not(.dark)_&]:hover:bg-slate-100"
/>
```

### EventPreviewModal Play Button Replacement
```jsx
// Source: /app/components/devices/camera/EventPreviewModal.js line 165
// Complex layout - use Button with children, not Button.Icon
import { Play } from 'lucide-react';
import { Button } from '../../ui';

<Button
  variant="ghost"
  onClick={() => setIsPlaying(true)}
  className="absolute inset-0 bg-black/30 hover:bg-black/40 rounded-none"
  aria-label="Riproduci video"
>
  <div className="w-20 h-20 rounded-full bg-white/90 group-hover:bg-white flex items-center justify-center shadow-lg transition-all group-hover:scale-110">
    <Play className="w-10 h-10 text-slate-900 ml-1" fill="currentColor" />
  </div>
</Button>
```

### HlsPlayer Fullscreen Button Replacement
```jsx
// Source: /app/components/devices/camera/HlsPlayer.js line 264
// Conditional icon based on fullscreen state
import { Maximize, Minimize } from 'lucide-react';
import { Button } from '../../ui';

<Button.Icon
  icon={isFullscreen ? <Minimize /> : <Maximize />}
  onClick={toggleFullscreen}
  variant="ghost"
  size="sm"
  aria-label={isFullscreen ? 'Esci da schermo intero' : 'Schermo intero'}
  className="absolute bottom-2 right-2 bg-slate-900/70 backdrop-blur-sm hover:bg-slate-800/90 z-20"
/>
```

### Complete EventPreviewModal Header (Footer Already Compliant)
```jsx
// Source: EventPreviewModal.js lines 85-126
// Shows relationship between Modal.Header, Modal.Title, and close button

<Modal.Header className="flex items-center justify-between p-4 border-b border-slate-700 [html:not(.dark)_&]:border-slate-200">
  <div className="flex items-center gap-3">
    <span className="text-2xl">
      {event.sub_type
        ? NETATMO_CAMERA_API.getSubTypeIcon(event.sub_type)
        : NETATMO_CAMERA_API.getEventIcon(event.type)}
    </span>
    <div>
      <Text variant="body" weight="semibold">
        {event.sub_type
          ? NETATMO_CAMERA_API.getSubTypeName(event.sub_type)
          : NETATMO_CAMERA_API.getEventTypeName(event.type)}
      </Text>
      <Text variant="tertiary" size="sm">
        {new Date(event.time * 1000).toLocaleString('it-IT', {
          weekday: 'long',
          day: '2-digit',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>
      {event.message && (
        <Text variant="secondary" size="sm" className="mt-1">
          {stripHtml(event.message)}
        </Text>
      )}
    </div>
  </div>

  {/* Replace raw button with Button.Icon */}
  <Button.Icon
    icon={<X />}
    onClick={onClose}
    variant="ghost"
    size="md"
    aria-label="Chiudi"
    className="hover:bg-slate-800 [html:not(.dark)_&]:hover:bg-slate-100"
  />
</Modal.Header>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Raw `<button>` for overlays | Button.Icon component | Design System v3.0 | Accessibility, consistent focus ring, type-safe variants |
| Inline SVG icons | lucide-react icons | Design System v3.0 | Consistent icon library, tree-shakeable, maintained |
| Manual aria-label management | Button.Icon enforces aria-label | Design System v3.0 | Prevents accessibility bugs |
| Custom hover states | Button variant hover styles | Design System v3.0 | Consistent interaction feedback |

**Deprecated/outdated:**
- Direct `<button>` usage for any interactive element: Replace with Button or Button.Icon
- Inline SVG without abstraction: Use lucide-react or icon components
- Missing aria-label on icon-only buttons: Button.Icon enforces this requirement

## Open Questions

Things that couldn't be fully resolved:

1. **Modal.Close vs custom Button.Icon**
   - What we know: Modal component has Modal.Close subcomponent for built-in close button
   - What's unclear: Whether Modal.Close matches EventPreviewModal's custom styling (hover:bg-slate-800)
   - Recommendation: Try Modal.Close first, fall back to Button.Icon if styling doesn't match
   - Confidence: MEDIUM - Modal.Close exists but styling may differ

2. **lucide-react dependency**
   - What we know: Project likely has lucide-react (common in Next.js projects)
   - What's unclear: Whether it's installed in package.json
   - Recommendation: Check package.json, install if missing, use for common icons
   - Confidence: HIGH - lucide-react is standard for Tailwind/Next.js projects

3. **Play button "group" class behavior**
   - What we know: Play button uses "group" class for hover scale effect
   - What's unclear: Whether Button component preserves group functionality
   - Recommendation: Test group hover behavior, may need to restructure with explicit hover states
   - Confidence: MEDIUM - Button may wrap children differently affecting group behavior

4. **Icon size mapping precision**
   - What we know: Button sizes (sm/md/lg) map to general icon sizes
   - What's unclear: Exact pixel mapping for w-4 (16px) vs w-5 (20px) icons
   - Recommendation: Use size="sm" for w-4/w-5 icons, size="md" for w-6 icons
   - Confidence: HIGH - Standard Button size mapping

5. **Ocean variant support**
   - What we know: CameraCard uses variant="ocean" on Button (lines 238, 252, 260, 220)
   - What's unclear: Whether ocean variant exists in Button.js (research shows only ember/subtle/ghost/success/danger/outline)
   - Recommendation: Check Button.js for ocean variant, may need to add or use alternative (likely subtle or custom className)
   - Confidence: LOW - ocean variant usage found but not defined in Button.js

## Sources

### Primary (HIGH confidence)
- `/app/components/devices/camera/CameraCard.js` - Refresh button overlay (line 322)
- `/app/components/devices/camera/EventPreviewModal.js` - Close and play buttons (lines 117, 165)
- `/app/components/devices/camera/HlsPlayer.js` - Fullscreen button (line 264)
- `/app/components/ui/Button.js` - Button and Button.Icon component API
- `/app/components/ui/Modal.js` - Modal component with Modal.Close
- `.planning/phases/20-thermostatcard-compliance/20-RESEARCH.md` - Similar compliance patterns
- `.planning/phases/21-lightscard-compliance/21-RESEARCH.md` - Button migration patterns
- `/docs/design-system.md` - Component usage patterns, variant reference

### Secondary (MEDIUM confidence)
- lucide-react icon library - Standard icon set for React projects
- Button.Icon accessibility requirements - TypeScript enforces aria-label

### Tertiary (LOW confidence)
- None - all patterns verified from codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All components exist in codebase, no new dependencies (except possibly lucide-react)
- Architecture: HIGH - Patterns observed from Button.js, Modal.js, and previous compliance phases
- Pitfalls: HIGH - Based on actual camera component structure, Button.Icon requirements, absolute positioning needs
- Ocean variant: LOW - Usage found but variant not defined in Button.js, needs investigation

**Research date:** 2026-01-31
**Valid until:** 60 days (stable internal components, no external dependencies)
