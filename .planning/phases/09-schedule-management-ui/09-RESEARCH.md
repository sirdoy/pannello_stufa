# Phase 9: Schedule Management UI - Research

**Researched:** 2026-01-27
**Domain:** React schedule visualization with temperature data
**Confidence:** HIGH

## Summary

Phase 9 requires building a UI for viewing Netatmo thermostat weekly schedules, switching between pre-configured schedules, and creating temporary temperature overrides. The backend APIs already exist from Phase 6 (`/api/netatmo/schedules`, `/api/netatmo/setroomthermpoint`), so this phase focuses exclusively on the UI layer.

Key findings: Timeline visualization for weekly schedules is best done with **custom React components** rather than heavy third-party libraries, given the specific requirements for temperature gradients, mobile-first design, and integration with the Ember Noir design system. Horizontal timeline is appropriate for weekly schedule view (established pattern for time-based data), but vertical scrolling for overall page layout maintains mobile usability. The project already has comprehensive UI primitives (Card, Button, Select, Input with liquid glass styling) that should be composed rather than introducing new dependencies.

**Primary recommendation:** Build custom timeline components using existing design system primitives, implement duration picker with native slider controls, use bottom sheet modal pattern for mobile override UI, and ensure color-blind accessible temperature gradients with supplemental text labels.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 15.5 | Framework | Already in project, App Router with React 19 |
| React | 19.2 | UI library | Latest stable, already in use |
| Tailwind CSS | 4.1.18 | Styling | Project standard, Ember Noir design tokens |
| lucide-react | 0.562.0 | Icons | Project standard, lightweight SVG icons |
| date-fns | 4.1.0 | Date utilities | Already in project, lighter than moment.js |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-hook-form | 7.54.2 | Form handling | Already in project, use for override form |
| zod | 3.24.2 | Validation | Already in project, validate temperature/duration |
| Framer Motion | (optional) | Animations | If smooth timeline interactions needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom timeline | Planby / react-calendar-timeline | Heavy dependencies (50kb+), over-engineered for simple weekly view, difficult to style with Ember Noir |
| Native slider | react-range / rc-slider | Custom slider libs add complexity; HTML5 input[type="range"] with CSS is 90% sufficient, better mobile support |
| Custom modal | react-modal-sheet | Good bottom sheet lib, but project doesn't have Framer Motion dependency yet; evaluate if simple CSS transition suffices |

**Installation:**
```bash
# No new dependencies recommended - use existing project stack
# Optional: if complex animations needed
npm install framer-motion
```

## Architecture Patterns

### Recommended Project Structure
```
app/
├── schedule/              # Schedule management page
│   ├── page.tsx          # Main schedule view
│   └── components/       # Schedule-specific components
│       ├── WeeklyTimeline.tsx
│       ├── ScheduleSelector.tsx
│       ├── OverrideModal.tsx
│       └── TemperatureGradient.tsx
lib/
├── hooks/
│   ├── useScheduleData.ts    # Fetch schedules from API
│   └── useManualOverride.ts  # Override state management
└── utils/
    └── scheduleHelpers.ts    # Parse timetable, format slots
```

### Pattern 1: Timeline Visualization with Temperature Gradients
**What:** Transform Netatmo timetable array (m_offset + zone_id) into visual timeline with color-coded temperature slots

**When to use:** Weekly schedule view must show 7 days with time/temperature information at a glance

**Example:**
```typescript
// Netatmo schedule structure (from parseSchedules helper)
interface Schedule {
  id: string;
  name: string;
  selected: boolean;
  zones: Array<{ id: number; name: string; temp: number; rooms: string[] }>;
  timetable: Array<{ m_offset: number; zone_id: number }>; // m_offset = minutes from Monday 00:00
}

// Transform to timeline slots
function parseTimelineSlots(schedule: Schedule) {
  return schedule.timetable.map((slot, i) => {
    const zone = schedule.zones.find(z => z.id === slot.zone_id);
    const startMinutes = slot.m_offset;
    const endMinutes = schedule.timetable[i + 1]?.m_offset || 10080; // Week ends at 10080 min

    return {
      day: Math.floor(startMinutes / 1440), // 0-6 (Mon-Sun)
      startTime: formatTime(startMinutes % 1440),
      endTime: formatTime(endMinutes % 1440),
      temperature: zone?.temp || 0,
      zoneName: zone?.name || 'Unknown',
    };
  });
}

// Horizontal timeline component (mobile-first)
<div className="overflow-x-auto pb-4">
  <div className="min-w-[700px] space-y-2">
    {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map((day, i) => (
      <div key={day} className="flex items-center gap-2">
        <span className="w-12 text-sm font-medium">{day}</span>
        <div className="flex-1 flex gap-px rounded-xl overflow-hidden">
          {slotsForDay(i).map(slot => (
            <div
              key={slot.startTime}
              style={{
                width: `${slot.durationPercent}%`,
                backgroundColor: tempToColor(slot.temperature),
              }}
              className="h-12 flex items-center justify-center text-xs font-medium text-white"
            >
              {slot.temperature}°
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
</div>
```

### Pattern 2: Color-Blind Accessible Temperature Gradient
**What:** Use cyan→yellow→red gradient with text labels, avoid red-green gradients

**When to use:** Any temperature visualization must meet WCAG AA contrast (4.5:1 text)

**Example:**
```typescript
// Source: Accessibility research - avoid red-green, use single-hue intensity or cyan-yellow-red
function tempToColor(temp: number): string {
  // Normalize temperature range (e.g., 15-23°C home heating)
  const minTemp = 15;
  const maxTemp = 23;
  const normalized = Math.max(0, Math.min(1, (temp - minTemp) / (maxTemp - minTemp)));

  // Cyan-yellow-red gradient (colorblind safe)
  if (normalized < 0.33) {
    // Cyan to blue-white
    return `hsl(${180 + normalized * 30}, 70%, ${60 + normalized * 20}%)`;
  } else if (normalized < 0.66) {
    // Blue-white to yellow
    return `hsl(${210 - (normalized - 0.33) * 180}, 70%, 80%)`;
  } else {
    // Yellow to red
    return `hsl(${30 - (normalized - 0.66) * 30}, 85%, ${70 - (normalized - 0.66) * 20}%)`;
  }
}

// Always include text labels - color alone is not sufficient
<div style={{ backgroundColor: tempToColor(temp) }}>
  <span className="font-semibold text-slate-900">{temp}°C</span>
</div>
```

### Pattern 3: Duration Picker with Range Slider
**What:** Native HTML5 range input styled with Tailwind, 5 minutes to 12 hours (5-720 min)

**When to use:** Manual override duration selection

**Example:**
```typescript
// Source: Project already uses native controls, avoid react-range dependency
function DurationPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  // Use logarithmic scale for better UX (more granularity at low end)
  const minLog = Math.log(5);   // 5 min
  const maxLog = Math.log(720); // 12 hours

  const scale = (minLog + maxLog) / 2;
  const toSlider = (minutes: number) => ((Math.log(minutes) - minLog) / (maxLog - minLog)) * 100;
  const fromSlider = (percent: number) => Math.round(Math.exp(minLog + (percent / 100) * (maxLog - minLog)));

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Durata: {formatDuration(value)}</label>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={toSlider(value)}
        onChange={(e) => onChange(fromSlider(Number(e.target.value)))}
        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6
          [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-ember-500 [&::-webkit-slider-thumb]:shadow-lg
          [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:hover:scale-110
          [&::-webkit-slider-thumb]:transition-transform"
        // Touch target: 44px minimum (WCAG)
        style={{ touchAction: 'none' }}
      />
      <div className="flex justify-between text-xs text-slate-400">
        <span>5 min</span>
        <span>1h</span>
        <span>6h</span>
        <span>12h</span>
      </div>
    </div>
  );
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}
```

### Pattern 4: Mobile Bottom Sheet Modal
**What:** Modal slides up from bottom on mobile, standard modal on desktop

**When to use:** Manual override UI, schedule switching confirmation

**Example:**
```typescript
// Simple CSS-only bottom sheet (no Framer Motion dependency needed)
function OverrideModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  useEffect(() => {
    // Lock body scroll when modal open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40
          animate-fade-in"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="fixed inset-x-0 bottom-0 z-50
          md:left-1/2 md:-translate-x-1/2 md:bottom-auto md:top-1/2 md:-translate-y-1/2
          md:max-w-md md:rounded-2xl
          bg-slate-900 rounded-t-2xl shadow-liquid-lg
          animate-slide-up md:animate-scale-in"
      >
        {/* Handle (mobile only) */}
        <div className="md:hidden w-12 h-1 bg-slate-700 rounded-full mx-auto mt-3" />

        {/* Content */}
        <div className="p-6 space-y-4">
          <h2 className="text-xl font-semibold text-ember-400">Manual Boost</h2>
          {/* Duration picker, temperature selector, confirm button */}
        </div>
      </div>
    </>
  );
}
```

### Pattern 5: Active Override Badge
**What:** Overlay badge on timeline showing active override with tap-to-cancel

**When to use:** Visual distinction between permanent schedule and temporary override

**Example:**
```typescript
// Display active override from homestatus API
interface ActiveOverride {
  temp: number;
  endtime: number; // UNIX timestamp
}

function OverrideBadge({ override, onCancel }: { override: ActiveOverride; onCancel: () => void }) {
  const remainingMinutes = Math.max(0, Math.floor((override.endtime - Date.now()) / 60000));

  return (
    <button
      onClick={onCancel}
      className="absolute top-4 right-4
        bg-ember-500 text-white px-4 py-2 rounded-full
        shadow-ember-glow hover:scale-105 transition-transform
        flex items-center gap-2 animate-pulse-ember"
    >
      <span className="font-semibold">{override.temp}°C</span>
      <span className="text-sm opacity-90">fino alle {formatTime(override.endtime)}</span>
      <X size={16} />
    </button>
  );
}
```

### Anti-Patterns to Avoid
- **Building custom calendar library**: Netatmo timetable is simple array, doesn't need complex calendar logic
- **Using red-green gradients**: 8% of men are color-blind, cyan-yellow-red is safer
- **Horizontal page scroll**: Only timeline itself scrolls horizontally, not entire page (breaks mobile UX)
- **Heavy animation libraries**: Project uses CSS animations, don't add Framer Motion unless truly needed
- **Tiny touch targets**: Minimum 44px tap area (WCAG guideline, iOS HIG)

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Date/time formatting | Custom formatters | date-fns (already in project) | Handles timezones, locales, edge cases (DST, leap years) |
| Form validation | Manual validation | zod + react-hook-form (in project) | Type-safe, declarative, reduces bugs |
| Accessible sliders | Completely custom | Native input[type="range"] + CSS | Browser handles keyboard nav, screen readers, touch events |
| API state management | Manual useState | SWR or React Query | Handles caching, revalidation, race conditions, but project doesn't use either - manual is acceptable with existing getCached pattern |
| Color interpolation | Manual HSL math | Existing gradient functions or CSS gradients | CSS linear-gradient handles interpolation smoothly, more performant |

**Key insight:** The project already has well-established patterns (liquid glass UI, getCached for API calls, native form controls). Introducing new dependencies for this phase creates maintenance burden. Custom components built with existing primitives are preferable.

## Common Pitfalls

### Pitfall 1: Timeline Performance with Large DOM
**What goes wrong:** Rendering all 168 hours of a week (7 days × 24 hours) as individual DOM elements causes scroll jank on mobile

**Why it happens:** Netatmo timetable can have many small slots (15-minute intervals), leading to 672 DOM elements for a week

**How to avoid:**
- Group consecutive slots with same temperature into single element
- Use CSS for visual subdivision (borders) rather than separate divs
- Consider virtualization if schedule has >100 distinct slots (rare)

**Warning signs:** Choppy horizontal scroll, slow initial render, high memory usage in DevTools

### Pitfall 2: m_offset Confusion (Netatmo Timetable Format)
**What goes wrong:** Misinterpreting `m_offset` as "minutes from start of day" instead of "minutes from Monday 00:00"

**Why it happens:** Netatmo's timetable uses week-based offset, not day-based

**How to avoid:**
```typescript
// WRONG: Assumes m_offset resets each day
const hour = Math.floor(m_offset / 60);
const day = getDayFromSomewhere();

// CORRECT: m_offset is absolute minutes from Monday 00:00
const day = Math.floor(m_offset / 1440);      // 1440 min/day
const minutesInDay = m_offset % 1440;
const hour = Math.floor(minutesInDay / 60);
const minute = minutesInDay % 60;
```

**Warning signs:** Schedule displays correctly for Monday but wrong for other days, times shift by multiples of 24 hours

### Pitfall 3: Color Gradient Without Text Labels (WCAG Violation)
**What goes wrong:** Using only color to convey temperature information fails WCAG 1.4.1 (Use of Color)

**Why it happens:** Developers assume color gradient is self-explanatory, forget about color-blind users

**How to avoid:**
- Always include temperature text inside or adjacent to colored elements
- Ensure text meets WCAG AA contrast (4.5:1) against background
- Use colorblind-safe palette (avoid red-green)
- Test with Chrome DevTools color-blind simulator

**Warning signs:** Temperature not readable without seeing color, fails automated accessibility audit

### Pitfall 4: Modal Z-Index Conflicts with Navbar
**What goes wrong:** Bottom sheet modal slides under the navbar/bottom navigation

**Why it happens:** Project uses bottom navigation on mobile (Navbar component), z-index stacking context conflicts

**How to avoid:**
```typescript
// Navbar typically uses z-40 or z-50
// Modal backdrop: z-40
// Modal content: z-50
// Ensure modal content has higher z-index than navbar

// Check project's existing z-index values
// From docs: "Dropdown con z-index ottimizzato" suggests existing z-index system
```

**Warning signs:** Modal appears behind navigation, bottom sheet cut off, can't interact with modal

### Pitfall 5: Endtime Validation (Manual Override)
**What goes wrong:** Sending endtime in wrong format to Netatmo API causes silent failure

**Why it happens:** Netatmo expects UNIX timestamp (seconds), JavaScript Date.now() returns milliseconds

**How to avoid:**
```typescript
// WRONG: milliseconds
const endtime = Date.now() + durationMinutes * 60 * 1000;

// CORRECT: seconds (UNIX timestamp)
const endtime = Math.floor(Date.now() / 1000) + durationMinutes * 60;

// Validate with zod
const overrideSchema = z.object({
  temp: z.number().min(5).max(30),
  endtime: z.number().int().positive(),
  mode: z.literal('manual'),
});
```

**Warning signs:** API call succeeds but override doesn't activate, no error in logs, endtime shows year 3000+ when debugging

### Pitfall 6: Cache Invalidation After Schedule Switch
**What goes wrong:** UI doesn't update after switching schedules because cached data is stale

**Why it happens:** Phase 6 implements `getCached` with 5-minute TTL, but schedule switch should immediately invalidate

**How to avoid:**
```typescript
// Already implemented in /api/netatmo/schedules POST
await invalidateCache('schedules');

// In UI, refetch after successful switch
async function switchSchedule(scheduleId: string) {
  const res = await fetch('/api/netatmo/schedules', {
    method: 'POST',
    body: JSON.stringify({ scheduleId }),
  });

  if (res.ok) {
    // Force refetch (cache was invalidated server-side)
    mutate('/api/netatmo/schedules'); // If using SWR
    // OR simply reload data
    await fetchSchedules();
  }
}
```

**Warning signs:** Active schedule indicator doesn't update, timeline shows old schedule after switch

## Code Examples

Verified patterns from official sources and project codebase:

### Fetching Schedules from Existing API
```typescript
// Source: /app/api/netatmo/schedules/route.js
async function fetchSchedules() {
  const res = await fetch('/api/netatmo/schedules');
  const data = await res.json();

  // Response includes:
  // - schedules: array of schedules with timetable/zones
  // - _source: 'cache' | 'api'
  // - _age_seconds: cache age

  return data.schedules;
}

// Schedule structure (from NETATMO_API.parseSchedules)
interface Schedule {
  id: string;
  name: string;
  type: string;           // 'therm'
  selected: boolean;      // Is active schedule
  zones: Zone[];
  timetable: Slot[];
}

interface Zone {
  id: number;
  name: string;
  type: number;
  rooms: string[];        // room_ids
  temp: number;
}

interface Slot {
  m_offset: number;       // Minutes from Monday 00:00
  zone_id: number;
}
```

### Switching Schedules
```typescript
// Source: /app/api/netatmo/schedules/route.js POST
async function switchSchedule(scheduleId: string) {
  const res = await fetch('/api/netatmo/schedules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scheduleId }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to switch schedule');
  }

  return res.json(); // { success: true, scheduleId, message }
}
```

### Creating Manual Override (Room-Level)
```typescript
// Source: /app/api/netatmo/setroomthermpoint/route.js
async function createManualOverride({
  room_id,
  temp,
  durationMinutes,
}: {
  room_id: string;
  temp: number;
  durationMinutes: number;
}) {
  const endtime = Math.floor(Date.now() / 1000) + durationMinutes * 60;

  const res = await fetch('/api/netatmo/setroomthermpoint', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      room_id,
      mode: 'manual',
      temp,
      endtime,
    }),
  });

  if (!res.ok) {
    throw new Error('Failed to create override');
  }

  return res.json();
}

// Cancel override: set mode back to 'home'
async function cancelOverride(room_id: string) {
  const res = await fetch('/api/netatmo/setroomthermpoint', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      room_id,
      mode: 'home', // Return to schedule
    }),
  });

  return res.json();
}
```

### Using Existing UI Components
```typescript
// Source: /docs/ui-components.md
import { Card, Button, Select, Input, Heading, Text } from '@/components/ui';

// Schedule selector
<Select
  liquid
  value={activeScheduleId}
  onChange={(e) => handleSwitchSchedule(e.target.value)}
  options={schedules.map(s => ({ value: s.id, label: s.name }))}
/>

// Manual boost button
<Button
  variant="ember"
  size="lg"
  icon={<Flame size={20} />}
  onClick={() => setShowOverrideModal(true)}
>
  Manual Boost
</Button>

// Timeline card
<Card liquid className="p-6">
  <Heading level={2} variant="ember">Weekly Schedule</Heading>
  <Text variant="secondary">{activeSchedule.name}</Text>
  {/* Timeline component */}
</Card>
```

### Ember Noir Styling
```typescript
// Source: /docs/design-system.md
// Temperature colors that respect design system
const tempColors = {
  cold: 'hsl(195, 70%, 60%)',    // Ocean-ish
  medium: 'hsl(45, 85%, 75%)',   // Warm neutral
  hot: 'hsl(15, 85%, 65%)',      // Ember-adjacent
};

// Liquid glass modal (design system pattern)
<div className="
  bg-white/[0.08] backdrop-blur-3xl shadow-liquid-lg
  ring-1 ring-white/20 ring-inset rounded-2xl
  [html:not(.dark)_&]:bg-white/[0.15] [html:not(.dark)_&]:ring-slate-200
">
  {/* Modal content */}
</div>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Full-page calendar UI | Timeline + Quick Actions | 2024+ thermostat UIs | Faster access, less chrome, mobile-first |
| Desktop-first dropdowns | Bottom sheet modals (mobile) | iOS 15+ patterns (2021) | Better thumb reachability, native feel |
| Red-green gradients | Cyan-yellow-red or single-hue | WCAG 2.2 emphasis (2023) | 8% more users can read charts |
| Heavy React calendar libs | Custom lightweight components | 2024+ trend | Smaller bundles, faster load, easier to style |
| Manual useState for API | SWR/React Query | 2023+ adoption | Better UX, but this project uses manual - OK given getCached pattern |

**Deprecated/outdated:**
- **React-Calendar**: Overkill for simple weekly view, doesn't handle temperature visualization
- **FullCalendar**: Enterprise-grade (large bundle), not designed for IoT/thermostat UIs
- **Moment.js**: Deprecated in favor of date-fns (already in project) or Day.js

## Open Questions

Things that couldn't be fully resolved:

1. **Which room to target for manual override?**
   - What we know: Netatmo API requires room_id for setroomthermpoint
   - What's unclear: Does the user select a room first, or is there a "primary room" concept?
   - Recommendation: Check if Firebase stores a preferred_room_id, or default to first room from topology. Plan should include room selector in override modal if multiple rooms exist.

2. **Active override detection**
   - What we know: homestatus API returns therm_setpoint_mode per room ('manual', 'home', 'max', 'off')
   - What's unclear: Does the project already poll homestatus, or does Phase 9 need to implement this?
   - Recommendation: Verify if /api/netatmo/homestatus exists and is called periodically. If not, override badge will need to fetch status on mount and after override creation.

3. **Schedule switch confirmation flow**
   - What we know: User decision specifies immediate vs dialog based on "undo capability"
   - What's unclear: Netatmo API doesn't provide undo - once switched, it's switched
   - Recommendation: Include confirmation dialog with schedule preview (name + current temp targets) before switching. User can always switch back, but disrupts heating schedule temporarily.

4. **Horizontal scroll indicators**
   - What we know: UX best practice requires visual hint that content is scrollable
   - What's unclear: Project design system doesn't document scrollable container patterns
   - Recommendation: Add subtle fade gradient at right edge of timeline container, show "peek" of next day. Test with actual project design tokens.

## Sources

### Primary (HIGH confidence)
- Project codebase:
  - `/app/api/netatmo/schedules/route.js` - Schedule fetching and switching API
  - `/app/api/netatmo/setroomthermpoint/route.js` - Manual override API
  - `/lib/netatmoApi.js` - parseSchedules helper, timetable structure
  - `/docs/design-system.md` - Ember Noir tokens, liquid glass pattern
  - `/docs/ui-components.md` - Existing UI primitives
  - `package.json` - Dependency versions

### Secondary (MEDIUM confidence)
- [React Modal Sheet](https://github.com/Temzasse/react-modal-sheet) - Bottom sheet pattern reference
- [HeroUI Slider Documentation](https://www.heroui.com/docs/components/slider) - Touch-accessible slider implementation
- [WebAIM Contrast Checker](https://webaim.org/articles/contrast/) - WCAG 2.2 AA requirements (4.5:1 text)
- [UX Planet: Horizontal Scrolling in Mobile](https://uxplanet.org/horizontal-scrolling-in-mobile-643c81901af3) - Timeline scroll patterns
- [Experience UX: Horizontal Scrolling](https://www.experienceux.co.uk/ux-blog/a-ux-perspective-on-horizontal-scrolling/) - When horizontal scroll is appropriate

### Tertiary (LOW confidence)
- [Planby](https://planby.app/) - React timeline library (not recommended due to bundle size, but pattern reference)
- [LogRocket: React Timeline Libraries](https://blog.logrocket.com/comparing-best-react-timeline-libraries/) - Library comparison
- [DEV: React Performance Pitfalls](https://dev.to/kigazon/react-performance-pitfalls-avoiding-common-mistakes-2pdd) - Virtual scrolling guidance
- Color-blind accessibility articles - General guidance on gradient colors

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Project already has all necessary dependencies, no new libs needed
- Architecture: HIGH - Netatmo API structure documented, existing UI primitives verified, patterns align with project conventions
- Pitfalls: HIGH - Common mistakes verified against Netatmo API docs and project patterns (m_offset, endtime format, cache invalidation)
- Color accessibility: MEDIUM - WCAG guidelines clear, but specific gradient implementation needs visual testing

**Research date:** 2026-01-27
**Valid until:** ~2026-02-27 (30 days - stable domain, UI patterns evolve slowly)

---

**Notes for Planner:**
- Phase 6 backend APIs are complete and functional - UI can be built independently
- Project has strong design system (Ember Noir) - custom components will integrate better than third-party libraries
- Mobile-first is critical (user controls thermostat on phone, not desktop)
- Accessibility requirements (color-blind gradients, touch targets, WCAG contrast) are non-negotiable
- Open questions about room selection and status polling should be resolved early in planning phase
