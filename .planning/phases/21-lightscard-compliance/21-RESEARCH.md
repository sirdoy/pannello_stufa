# Phase 21: LightsCard Compliance - Research

**Researched:** 2026-01-31
**Domain:** Design System Compliance / Adaptive Styling / Component Refactoring
**Confidence:** HIGH

## Summary

This research investigates how to refactor LightsCard.js to replace raw HTML elements with design system components while preserving the sophisticated adaptive styling system. The current implementation uses:

1. **Raw `<input type="range">` slider** (lines 1059-1091) - brightness control with local drag state
2. **Raw `<button>` scene buttons** (lines 1149-1160) - horizontal scrolling cards with icon+label
3. **Adaptive styling system** (lines 761-809) - runtime color calculation for dynamic UI contrast

The LightsCard is significantly more complex than previous compliance phases (StoveCard, ThermostatCard) because it calculates light colors at runtime and adapts the entire UI (buttons, slider, text, badges) based on perceived brightness. This creates three contrast modes (light/dark/default) that cannot be represented purely with CVA variants.

The design system provides Slider (Radix-based with CVA), Button (with variants), and ControlButton (already used for +/- buttons). The challenge is preserving the adaptive color system while achieving component compliance.

**Primary recommendation:** Use design system Slider component with CSS custom properties for theming, migrate scene buttons to Button component, and maintain adaptive styling via runtime style prop + className overrides rather than attempting to force-fit into CVA variants.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @radix-ui/react-slider | 1.3.2 | Accessible range slider | Already used in design system Slider |
| class-variance-authority | 0.7+ | Type-safe component variants | All UI components use CVA |
| tailwind-merge | 2.0+ | Tailwind class conflict resolution | Part of cn() utility |
| clsx | 2.0+ | Conditional class composition | Part of cn() utility |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| React | 18.3+ | forwardRef, useState, useRef | Slider local state, drag tracking |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Slider component | Keep raw input | Loses accessibility, touch support, CVA consistency |
| Runtime style prop | CVA variants only | Cannot represent runtime color calculation |
| Button with className | Custom scene button | Loses design system consistency |

**Installation:**
No new packages required. All dependencies already installed.

## Architecture Patterns

### Current File Structure
```
app/components/devices/lights/
├── LightsCard.js              # 1185 lines - target of refactoring

app/components/ui/
├── Slider.js                  # Radix Slider + CVA (lines 1-210)
├── Button.js                  # Button component (lines 1-289)
├── ControlButton.js           # +/- buttons (already used, lines 1094-1118)
├── Heading.js                 # Typography (already used)
├── Text.js                    # Typography (already used)
└── index.js                   # Barrel exports
```

### Pattern 1: Slider Local State During Drag (Current Implementation)
**What:** Use local state during slider drag to avoid API call on every pixel movement
**Current approach:** `localBrightness` state + `isDraggingSlider` ref + manual event handlers
**Challenge:** Preserve UX while migrating to Slider component
**Example:**
```jsx
// Current implementation (lines 1059-1091)
const [localBrightness, setLocalBrightness] = useState(null);
const isDraggingSlider = useRef(false);

<input
  type="range"
  value={localBrightness !== null ? localBrightness : avgBrightness}
  onInput={(e) => setLocalBrightness(parseInt(e.target.value))}
  onMouseUp={(e) => {
    handleBrightnessChange(selectedRoomGroupedLightId, e.target.value);
    setLocalBrightness(null);
  }}
  onTouchEnd={(e) => {
    const value = localBrightness !== null ? localBrightness : avgBrightness;
    handleBrightnessChange(selectedRoomGroupedLightId, value.toString());
    setLocalBrightness(null);
  }}
/>
```

### Pattern 2: Slider Component with Controlled Value
**What:** Replace raw input with Slider component while preserving local drag state
**When to use:** Brightness control (this phase), any slider with API-backed values
**Challenge:** Slider has onChange callback, not separate onInput/onMouseUp
**Solution:** Use Slider in controlled mode with local state wrapper
**Example:**
```jsx
// Source: /app/components/ui/Slider.js
// Radix Slider supports onValueChange (during drag) + onValueCommit (on release)
// But design system Slider only exposes onChange/onValueChange

// Recommended approach: Wrap with local state
const [localBrightness, setLocalBrightness] = useState(null);
const actualBrightness = localBrightness !== null ? localBrightness : avgBrightness;

<Slider
  value={actualBrightness}
  onChange={(value) => {
    // Update local state during drag
    setLocalBrightness(value);
  }}
  onPointerUp={() => {
    // Commit to API on release
    if (localBrightness !== null) {
      handleBrightnessChange(selectedRoomGroupedLightId, localBrightness);
      setLocalBrightness(null);
    }
  }}
  min={1}
  max={100}
  variant="ember"
  aria-label="Luminosità"
  className={adaptive.slider} // Adaptive styling
/>
```

### Pattern 3: Scene Buttons - Card-Like Layout
**What:** Horizontal scrolling scene buttons with icon above text
**Current approach:** Raw button with flex-col layout, fixed width (w-32 sm:w-36)
**Challenge:** Button icon prop positions icon left/right, but scenes need vertical
**Example:**
```jsx
// Current implementation (lines 1149-1160)
<button className="flex-shrink-0 w-32 sm:w-36 p-4 rounded-xl ... font-display">
  <div className="text-3xl mb-2">🎨</div>
  <div className="text-xs font-semibold truncate">
    {scene.metadata?.name || 'Scena'}
  </div>
</button>

// Target: Button component with custom children layout
<Button
  variant="subtle"
  onClick={() => handleSceneActivate(scene.id)}
  disabled={refreshing}
  className="flex-shrink-0 w-32 sm:w-36 flex-col p-4"
  aria-label={`Attiva scena ${scene.metadata?.name}`}
>
  <span className="text-3xl mb-2">🎨</span>
  <span className="text-xs font-semibold truncate">
    {scene.metadata?.name || 'Scena'}
  </span>
</Button>
```

### Pattern 4: Adaptive Styling - Runtime Color Calculation
**What:** Calculate light colors at runtime and adapt entire UI contrast
**Current approach:** `getLuminance()` + `getContrastMode()` + `adaptiveClasses` object
**Challenge:** CVA variants are static at build time, cannot represent runtime colors
**Solution:** Keep runtime style calculation, apply via style prop + className overrides
**Example:**
```jsx
// Source: LightsCard.js lines 671-809
// Runtime functions (keep these)
const getLuminance = (hex) => { /* RGB to perceived brightness */ };
const getContrastMode = (colors, brightness) => {
  const avgLuminance = colors.reduce((sum, color) => sum + getLuminance(color), 0) / colors.length;
  const effectiveLuminance = avgLuminance * (brightness / 100);
  return effectiveLuminance > 0.25 ? 'light' : 'dark';
};

// Dynamic style generation (keep this)
const getRoomControlStyle = () => {
  if (!isRoomOn || roomColors.length === 0) return null;

  // Calculate gradients, borders, shadows based on room light colors
  return {
    background: `linear-gradient(135deg, ${color1}, ${color2})`,
    borderColor: `${primaryColor}${opacity}`,
    boxShadow: `0 0 ${glowSize}px ${primaryColor}${opacity}`,
  };
};

const dynamicRoomStyle = getRoomControlStyle();
const contrastMode = dynamicRoomStyle ? getContrastMode(roomColors, roomOnBrightness) : 'default';

// Apply to container
<div style={dynamicRoomStyle || {}}>
  {/* Use adaptive.buttonVariant and adaptive.buttonClass for buttons inside */}
  <Button
    variant={adaptive.buttonVariant || 'ember'}
    className={adaptive.buttonClass}
  >
    Action
  </Button>
</div>
```

### Pattern 5: Brightness Panel Layout (Already Compliant)
**What:** Header row (icon + label + value), slider, +/- buttons row
**Current state:** ControlButtons already used (design system components from Phase 15)
**No changes needed:** Layout follows grid spacing, components already compliant
**Example (lines 1043-1121):**
```jsx
// Already compliant - ControlButton is design system component
<div className="relative z-10 space-y-4">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <span className="text-xl">☀️</span>
      <Heading level={4} size="sm">Luminosità</Heading>
    </div>
    <span className="text-2xl sm:text-3xl font-black font-display">
      {localBrightness !== null ? localBrightness : avgBrightness}%
    </span>
  </div>

  {/* SLIDER HERE - replace raw input */}

  <div className="flex items-center gap-2">
    <ControlButton
      type="decrement"
      variant={adaptive.buttonVariant || 'subtle'}
      onChange={(delta) => /* handle change */}
      className={adaptive.buttonClass}
    />
    <ControlButton
      type="increment"
      variant={adaptive.buttonVariant || 'subtle'}
      onChange={(delta) => /* handle change */}
      className={adaptive.buttonClass}
    />
  </div>
</div>
```

### Anti-Patterns to Avoid
- **CVA variants for runtime colors:** Don't try to create CVA variants for every possible light color
- **Losing local drag state:** Don't call API on every onChange during slider drag
- **Button icon prop for vertical layout:** Don't use icon prop, use children with flex-col
- **Static slider styling:** Don't ignore adaptive.slider classes (needed for contrast modes)
- **Removing dynamic style object:** Don't try to convert runtime colors to Tailwind classes

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Range slider accessibility | Custom keyboard handlers | Slider component (Radix) | Arrow keys, Page Up/Down, Home/End built-in |
| Slider touch support | Touch event handling | Slider component (Radix) | Touch drag, multi-touch rejection, mobile optimized |
| Slider value display | Custom tooltip | Slider showTooltip prop | Positioned tooltip, drag-only display |
| Button loading state | Disable during async | Button loading prop | Spinner overlay, aria-hidden handling |
| Vertical icon layout | Custom flex structure | Button children with flex-col | Let Button handle base styles, override layout |
| Runtime color theming | Generate CVA variants | style prop + CSS variables | CVA is build-time, colors are runtime |

**Key insight:** Radix Slider handles 47+ edge cases for accessibility (focus traps, screen reader announcements, keyboard step increments, RTL support). Design system Slider wraps this with CVA variants for Ember Noir styling. Don't reimplement.

## Common Pitfalls

### Pitfall 1: Slider onChange vs onValueCommit
**What goes wrong:** Radix Slider has both `onValueChange` (during drag) and `onValueCommit` (on release), but design system Slider only exposes onChange
**Why it happens:** Simplified API for common use case (onChange fires continuously)
**How to avoid:** Use onPointerUp handler at Slider component level to detect drag end
**Warning signs:** API called on every pixel movement, performance degradation
**Correct pattern:**
```jsx
// Design system Slider doesn't expose onValueCommit
// Solution: Track local state + use onPointerUp
const [localValue, setLocalValue] = useState(null);

<Slider
  value={localValue ?? serverValue}
  onChange={setLocalValue}
  onPointerUp={() => {
    if (localValue !== null) {
      saveToApi(localValue);
      setLocalValue(null);
    }
  }}
/>
```

### Pitfall 2: CSS Variables vs CVA Variants for Runtime Colors
**What goes wrong:** Attempting to create CVA variants for every possible light color
**Why it happens:** Misunderstanding CVA as runtime theming system (it's build-time)
**How to avoid:** Use runtime style prop for dynamic colors, CVA for structural variants only
**Warning signs:** Hundreds of color variant combinations, build errors
**Correct pattern:**
```jsx
// Wrong: CVA cannot handle runtime colors
const sliderVariants = cva('...', {
  variants: {
    color: {
      '#ff0000': 'accent-red-500',  // ❌ Cannot generate at runtime
      '#00ff00': 'accent-green-500', // ❌ Impossible to enumerate
    }
  }
});

// Correct: CVA for structure, runtime style for colors
const sliderVariants = cva('...', {
  variants: {
    variant: { ember: '...', ocean: '...', sage: '...' } // ✅ Fixed variants
  }
});

// Apply runtime colors via style prop
<Slider
  variant="ember"
  className={adaptive.slider} // Adaptive classes for contrast
  style={{ '--slider-color': roomColor }} // Runtime color
/>
```

### Pitfall 3: Button Icon Position for Vertical Layout
**What goes wrong:** Using Button icon prop expects horizontal left/right positioning
**Why it happens:** Button designed for standard icon+text layout (most common)
**How to avoid:** Pass custom children with vertical layout, let Button provide base styles
**Warning signs:** Icon appears beside text instead of above
**Correct pattern:**
```jsx
// Wrong: icon prop is for horizontal layout
<Button icon="🎨" variant="subtle">
  Scene Name {/* Icon will be left or right, not above */}
</Button>

// Correct: Custom children for vertical layout
<Button variant="subtle" className="flex-col">
  <span className="text-3xl mb-2">🎨</span>
  <span className="text-xs font-semibold">Scene Name</span>
</Button>
```

### Pitfall 4: Adaptive Styling Lost During Migration
**What goes wrong:** Replacing raw elements with design system components loses adaptive styling
**Why it happens:** Forgetting to apply `adaptive.slider`, `adaptive.buttonClass`, `adaptive.buttonVariant`
**How to avoid:** Check every replaced element for adaptive classes usage, preserve all
**Warning signs:** Slider/buttons don't adjust contrast on bright backgrounds
**Correct pattern:**
```jsx
// Current adaptive system (lines 761-809)
const adaptive = adaptiveClasses[contrastMode]; // light, dark, or default

// Apply to Slider
<Slider
  className={adaptive.slider} // ✅ Preserves contrast adjustment
  // adaptive.slider = 'bg-slate-300 accent-slate-800' (light mode)
  // adaptive.slider = 'bg-slate-600 accent-white' (dark mode)
/>

// Apply to Button
<Button
  variant={adaptive.buttonVariant || 'subtle'}
  className={adaptive.buttonClass}
  // adaptive.buttonClass = '!bg-white/90 !text-slate-900' (dark bg)
/>
```

### Pitfall 5: Removing Runtime Style Object
**What goes wrong:** Trying to convert dynamic colors to static Tailwind classes
**Why it happens:** Preference for className over style prop (Tailwind best practice)
**How to avoid:** Accept that runtime colors require style prop, this is the exception
**Warning signs:** Gradients hardcoded, colors static, adaptive system broken
**Correct pattern:**
```jsx
// Runtime color calculation must stay
const getRoomControlStyle = () => {
  // Returns { background, borderColor, boxShadow } with runtime colors
};

const dynamicRoomStyle = getRoomControlStyle();

// Apply via style prop (only way to use runtime colors)
<div
  className={/* static Tailwind classes */}
  style={dynamicRoomStyle || {}} // ✅ Runtime colors
>
```

### Pitfall 6: Scene Button Horizontal Scroll Container
**What goes wrong:** Replacing scroll container div affects snap-scroll behavior
**Why it happens:** Focusing on button replacement, missing container context
**How to avoid:** Keep scroll container structure, only replace button elements inside
**Warning signs:** Scenes don't scroll horizontally, snap scroll broken
**Correct pattern:**
```jsx
// Keep scroll container structure (lines 1145-1171)
<div className="relative">
  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
    {roomScenes.map((scene) => (
      <Button
        key={scene.id}
        variant="subtle"
        onClick={() => handleSceneActivate(scene.id)}
        className="flex-shrink-0 w-32 sm:w-36 flex-col p-4 snap-start"
      >
        <span className="text-3xl mb-2">🎨</span>
        <span className="text-xs font-semibold truncate">
          {scene.metadata?.name || 'Scena'}
        </span>
      </Button>
    ))}
  </div>
  {/* Keep scroll indicator */}
</div>
```

## Code Examples

Verified patterns from official sources:

### Brightness Slider with Local Drag State (Recommended Approach)
```jsx
// Source: /app/components/ui/Slider.js + LightsCard adaptive pattern
// Preserves UX (no API spam) + uses design system Slider + adaptive styling

function BrightnessSlider({ avgBrightness, onBrightnessChange, adaptive, disabled }) {
  const [localBrightness, setLocalBrightness] = useState(null);
  const actualBrightness = localBrightness !== null ? localBrightness : avgBrightness;

  const handleCommit = () => {
    if (localBrightness !== null) {
      onBrightnessChange(localBrightness);
      setLocalBrightness(null);
    }
  };

  return (
    <Slider
      value={actualBrightness}
      onChange={(value) => setLocalBrightness(value)} // Update during drag
      onPointerUp={handleCommit} // Commit on release
      onTouchEnd={handleCommit} // Commit on touch release
      min={1}
      max={100}
      variant="ember"
      disabled={disabled}
      aria-label="Luminosità"
      className={cn(
        adaptive.slider, // Adaptive contrast classes
        'w-full'
      )}
    />
  );
}
```

### Scene Buttons with Vertical Icon Layout
```jsx
// Source: /app/components/ui/Button.js
// Button component with custom children for card-like scene buttons

function SceneButton({ scene, onActivate, disabled }) {
  return (
    <Button
      variant="subtle"
      onClick={() => onActivate(scene.id)}
      disabled={disabled}
      className="flex-shrink-0 w-32 sm:w-36 p-4 flex-col snap-start"
      aria-label={`Attiva scena ${scene.metadata?.name || 'Scena'}`}
    >
      <span className="text-3xl mb-2" aria-hidden="true">🎨</span>
      <span className="text-xs font-semibold truncate">
        {scene.metadata?.name || 'Scena'}
      </span>
    </Button>
  );
}

// Usage in horizontal scroll container
<div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
  {roomScenes.map((scene) => (
    <SceneButton
      key={scene.id}
      scene={scene}
      onActivate={handleSceneActivate}
      disabled={refreshing}
    />
  ))}
</div>
```

### Complete Brightness Panel (Slider + ControlButtons)
```jsx
// Source: LightsCard.js lines 1036-1121
// Shows relationship between Slider, ControlButtons, and adaptive styling

function BrightnessPanel({ brightness, onBrightnessChange, adaptive, disabled }) {
  const [localBrightness, setLocalBrightness] = useState(null);
  const displayBrightness = localBrightness ?? brightness;

  const handleSliderCommit = () => {
    if (localBrightness !== null) {
      onBrightnessChange(localBrightness);
      setLocalBrightness(null);
    }
  };

  const handleIncrement = (delta) => {
    const newValue = Math.min(100, brightness + delta);
    onBrightnessChange(newValue);
  };

  const handleDecrement = (delta) => {
    const newValue = Math.max(1, brightness + delta);
    onBrightnessChange(newValue);
  };

  return (
    <div className={cn(
      'relative overflow-hidden rounded-2xl backdrop-blur-xl border p-4 sm:p-5',
      adaptive.brightnessPanel // Adaptive contrast
    )}>
      <div className="relative z-10 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">☀️</span>
            <Heading
              level={4}
              size="sm"
              variant={adaptive.heading ? 'default' : undefined}
              className={adaptive.heading}
            >
              Luminosità
            </Heading>
          </div>
          <span className={cn(
            'text-2xl sm:text-3xl font-black font-display',
            adaptive.brightnessValue
          )}>
            {displayBrightness}%
          </span>
        </div>

        {/* Slider */}
        <Slider
          value={displayBrightness}
          onChange={setLocalBrightness}
          onPointerUp={handleSliderCommit}
          onTouchEnd={handleSliderCommit}
          min={1}
          max={100}
          variant="ember"
          disabled={disabled}
          aria-label="Luminosità"
          className={adaptive.slider}
        />

        {/* +/- Buttons */}
        <div className="flex items-center gap-2">
          <ControlButton
            type="decrement"
            variant={adaptive.buttonVariant || 'subtle'}
            size="sm"
            step={5}
            onChange={handleDecrement}
            disabled={disabled || brightness <= 1}
            className={cn('flex-1', adaptive.buttonClass)}
          />
          <ControlButton
            type="increment"
            variant={adaptive.buttonVariant || 'subtle'}
            size="sm"
            step={5}
            onChange={handleIncrement}
            disabled={disabled || brightness >= 100}
            className={cn('flex-1', adaptive.buttonClass)}
          />
        </div>
      </div>
    </div>
  );
}
```

### Adaptive Styling System (Preserve Unchanged)
```jsx
// Source: LightsCard.js lines 671-809
// Runtime color calculation system - DO NOT CONVERT TO CVA

// Calculate perceived luminance (0 = dark, 1 = bright)
const getLuminance = (hex) => {
  const rgb = hex.replace('#', '').match(/.{2}/g)?.map(x => parseInt(x, 16) / 255) || [0, 0, 0];
  const [r, g, b] = rgb.map(c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

// Determine contrast mode based on light colors
const getContrastMode = (colors, brightness) => {
  if (colors.length === 0) return 'default';
  const avgLuminance = colors.reduce((sum, color) => sum + getLuminance(color), 0) / colors.length;
  const effectiveLuminance = avgLuminance * (brightness / 100);
  return effectiveLuminance > 0.25 ? 'light' : 'dark';
};

// Generate dynamic background/border/shadow styles
const getRoomControlStyle = () => {
  if (!isRoomOn || roomColors.length === 0) return null;

  const baseOpacity = 0.15 + (roomOnBrightness / 100) * 0.35;
  const borderOpacity = 0.3 + (roomOnBrightness / 100) * 0.4;

  if (roomColors.length === 1) {
    return {
      background: `linear-gradient(135deg, ${roomColors[0]}${opacity} 0%, rgba(15, 23, 42, 0.6) 50%, ${roomColors[0]}${opacity/2} 100%)`,
      borderColor: `${roomColors[0]}${borderOpacity}`,
      boxShadow: `0 0 ${20 + roomOnBrightness * 0.3}px ${roomColors[0]}${opacity}`,
    };
  }

  // Multiple colors - gradient with all
  const gradientStops = roomColors.map((color, i) => {
    const position = (i / (roomColors.length - 1)) * 100;
    return `${color}${opacity} ${position}%`;
  }).join(', ');

  return {
    background: `linear-gradient(135deg, ${gradientStops})`,
    borderColor: `${roomColors[0]}${borderOpacity}`,
    boxShadow: `0 0 ${15}px ${roomColors[0]}${opacity}, 0 0 ${25}px ${roomColors[roomColors.length-1]}${opacity}`,
  };
};

const dynamicRoomStyle = getRoomControlStyle();
const contrastMode = dynamicRoomStyle ? getContrastMode(roomColors, roomOnBrightness) : 'default';

// Adaptive class object (maps contrast modes to class overrides)
const adaptiveClasses = {
  light: {
    heading: 'text-slate-900',
    slider: 'bg-slate-300 accent-slate-800',
    buttonVariant: 'outline',
    buttonClass: '!bg-slate-900/90 !text-white',
    brightnessPanel: 'bg-white/60 border border-slate-200/80',
    brightnessValue: 'text-slate-900',
  },
  dark: {
    heading: 'text-white',
    slider: 'bg-slate-600 accent-white',
    buttonVariant: 'outline',
    buttonClass: '!bg-white/90 !text-slate-900',
    brightnessPanel: 'bg-slate-900/60 border border-slate-500/80',
    brightnessValue: 'text-white',
  },
  default: {
    heading: '',
    slider: '',
    buttonVariant: null,
    buttonClass: '',
    brightnessPanel: '',
    brightnessValue: '',
  },
};

const adaptive = adaptiveClasses[contrastMode];

// Apply to main control area
<div
  className={/* static Tailwind classes */}
  style={dynamicRoomStyle || {}} // Runtime colors
>
  {/* Components use adaptive.* classes */}
</div>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Raw `<input type="range">` | Slider component (Radix + CVA) | Design System v3.0 | Accessibility, touch support, keyboard nav |
| Manual touch handlers | Radix built-in touch | Design System v3.0 | Multi-touch rejection, mobile optimization |
| Raw scene `<button>` | Button component | Design System v3.0 | Consistent styling, loading states, focus ring |
| Manual adaptive classes | Runtime style + className | Ongoing | Balance CVA (structure) + runtime (colors) |

**Deprecated/outdated:**
- Direct `<input type="range">` usage: Replace with Slider component
- Manual onMouseDown/onTouchStart for drag tracking: Use Slider onPointerDown/Up
- Raw button for scenes: Use Button with custom children layout

## Open Questions

Things that couldn't be fully resolved:

1. **Slider drag state pattern standardization**
   - What we know: Current uses localBrightness + isDraggingSlider ref
   - What's unclear: Should design system Slider expose onValueCommit callback?
   - Recommendation: Use current workaround (onPointerUp), consider Slider API enhancement later
   - Confidence: MEDIUM - Pattern works but not officially documented

2. **CSS custom properties for Slider theming**
   - What we know: Slider uses CVA variants (ember/ocean/sage), adaptive.slider provides className overrides
   - What's unclear: Whether Slider should accept CSS variables for runtime theming
   - Recommendation: Use adaptive.slider className approach (already works), don't modify Slider component
   - Confidence: HIGH - className overrides proven pattern from ThermostatCard

3. **Scene button variant selection**
   - What we know: Current uses custom hover states, Button has subtle/ghost variants
   - What's unclear: Which variant best matches current visual appearance
   - Recommendation: Use subtle variant (matches glass effect of current button)
   - Confidence: HIGH - Visual match confirmed from design system

4. **Adaptive button variant vs className**
   - What we know: adaptive.buttonVariant provides outline, adaptive.buttonClass provides override
   - What's unclear: Whether to use variant or className approach
   - Recommendation: Use both (variant for structure, className for color overrides)
   - Confidence: HIGH - Hybrid approach already used in lines 981-1033

5. **Brightness panel abstraction opportunity**
   - What we know: Pattern of header + slider + controls appears only in LightsCard
   - What's unclear: Whether to extract as reusable component
   - Recommendation: Keep inline for now (no reuse elsewhere), extract if pattern repeats
   - Confidence: MEDIUM - Premature abstraction risk

## Sources

### Primary (HIGH confidence)
- `/app/components/ui/Slider.js` - Radix Slider + CVA implementation, onValueChange API
- `/app/components/ui/Button.js` - Button component with CVA variants, icon positioning
- `/app/components/ui/ControlButton.js` - Already compliant +/- buttons (Phase 15)
- `/app/components/devices/lights/LightsCard.js` - Current implementation, adaptive system
- `.planning/phases/20-thermostatcard-compliance/20-RESEARCH.md` - Similar compliance patterns
- `.planning/phases/12-core-interactive-components/12-RESEARCH.md` - Slider component research
- `/docs/design-system.md` - Component usage patterns, variant reference

### Secondary (MEDIUM confidence)
- Radix UI Slider documentation - onValueChange vs onValueCommit (not exposed in design system wrapper)
- Phase 15 ControlButton implementation - Long-press, haptic feedback patterns

### Tertiary (LOW confidence)
- None - all patterns verified from codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All components exist in codebase, no new dependencies
- Architecture: HIGH - Patterns observed from Slider.js, Button.js, and previous compliance phases
- Pitfalls: HIGH - Based on actual LightsCard structure, adaptive styling complexity, Slider API limitations
- Adaptive styling preservation: HIGH - Runtime style prop + className override pattern established

**Research date:** 2026-01-31
**Valid until:** 60 days (stable internal components, no external dependencies)
