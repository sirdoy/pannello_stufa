# Phase 182: Design System Reference Page v2 - Pattern Map

**Mapped:** 2026-05-03
**Files analyzed:** 18 new/modified files
**Analogs found:** 17 / 18

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `app/debug/design-system-v2/page.tsx` | component (edit) | event-driven | itself (667 LOC → 80 LOC trim) | exact |
| `app/debug/design-system-v2/sections/Section01Hue.tsx` | component | event-driven | `app/debug/design-system-v2/page.tsx` lines 161–219 | exact |
| `app/debug/design-system-v2/sections/Section02Ambient.tsx` | component | event-driven | `app/debug/design-system-v2/page.tsx` lines 222–292 | exact |
| `app/debug/design-system-v2/sections/Section03Tokens.tsx` | component | request-response | `app/debug/design-system-v2/page.tsx` lines 295–361 (extracted + extended in Plan 05) | exact |
| `app/debug/design-system-v2/sections/Section04GlassSurface.tsx` | component | request-response | `app/debug/design-system-v2/page.tsx` lines 364–423 | exact |
| `app/debug/design-system-v2/sections/Section05Press.tsx` | component | event-driven | `app/debug/design-system-v2/page.tsx` lines 426–513 | exact |
| `app/debug/design-system-v2/sections/Section06Sheet.tsx` | component | event-driven | `app/debug/design-system-v2/page.tsx` lines 517–593 | exact |
| `app/debug/design-system-v2/sections/Section07Splash.tsx` | component | event-driven | `app/debug/design-system-v2/page.tsx` lines 599–664 | exact |
| `app/debug/design-system-v2/sections/Section08CardPrimitives.tsx` | component | event-driven | `app/components/EmberGlass/automations/sections/TriggerSection.tsx` | role-match |
| `app/debug/design-system-v2/sections/Section09SheetPrimitives.tsx` | component | event-driven | `app/components/EmberGlass/automations/sections/TriggerSection.tsx` | role-match |
| `app/debug/design-system-v2/sections/Section10SheetGallery.tsx` | component | event-driven | `app/debug/design-system-v2/page.tsx` lines 517–593 | role-match |
| `app/debug/design-system-v2/sections/CodeSnippet.tsx` | component | event-driven | `app/components/EmberGlass/Pressable.tsx` + page.tsx inline buttons | role-match |
| `app/debug/design-system-v2/sections/sheetFixtures.ts` | utility | transform | `app/components/EmberGlass/sheets/__tests__/StoveSheet.test.tsx` | role-match |
| `app/components/EmberGlass/cards/CircBtn.tsx` | component | event-driven | `app/components/EmberGlass/StatusDot.tsx` + `MiniStat.tsx` | exact |
| `app/components/EmberGlass/cards/__tests__/CircBtn.test.tsx` | test | request-response | `app/components/EmberGlass/sheets/primitives/__tests__/Stepper.test.tsx` | exact |
| `app/components/EmberGlass/cards/index.ts` | config (barrel) | — | `app/components/EmberGlass/automations/index.ts` | exact |
| `app/components/EmberGlass/sheets/primitives/BigSlider.tsx` | component | event-driven | `app/components/EmberGlass/sheets/primitives/Slider.tsx` | exact |
| `app/components/EmberGlass/sheets/primitives/__tests__/BigSlider.test.tsx` | test | request-response | `app/components/EmberGlass/sheets/primitives/__tests__/Slider.test.tsx` | exact |
| `app/components/EmberGlass/index.ts` | config (barrel, edit) | — | itself | exact |
| `tests/smoke/design-system-v2-primitives.spec.ts` | test | request-response | `tests/smoke/accent-picker.spec.ts` + `tests/smoke/sheet-primitive.spec.ts` | exact |
| `app/debug/design-system-v2/__tests__/page.test.tsx` | test (edit) | request-response | itself (138 LOC, add 4th describe) | exact |

---

## Pattern Assignments

### `app/debug/design-system-v2/page.tsx` (edit — thin orchestrator)

**Analog:** itself (current 667 LOC — trim to ~80 LOC)

**What stays:** The `<main>` wrapper + page header block (lines 108–158). The `<hr>` separator (line 158).

**What is removed from page.tsx:** All state (`activeHue`, `ambientOn`, `sheetOpen`, `replayKey`), all helpers (`setAccent`, `setAmbient`, `onSwatchClick`, `onAmbientToggle`), all `useEffect`, `ACCENT_PRESETS`, `HUE_DISPLAY_NAMES`, and the 7 inline `<section>` blocks (lines 160–664). Each piece of state/helpers/JSX moves into its owning `Section0XYyy.tsx` file. **All 7 existing sections are preserved** (orchestrator reconciliation — see Plan 01 `<reconciliation>` block).

**Target imports pattern** (lines 1–27 → replaced with):
```tsx
'use client';
import React from 'react';
import { Section01Hue } from './sections/Section01Hue';
import { Section02Ambient } from './sections/Section02Ambient';
import { Section03Tokens } from './sections/Section03Tokens';
import { Section04GlassSurface } from './sections/Section04GlassSurface';
import { Section05Press } from './sections/Section05Press';
import { Section06Sheet } from './sections/Section06Sheet';
import { Section07Splash } from './sections/Section07Splash';
import { Section08CardPrimitives } from './sections/Section08CardPrimitives';
import { Section09SheetPrimitives } from './sections/Section09SheetPrimitives';
import { Section10SheetGallery } from './sections/Section10SheetGallery';
```

**Target page body:**
```tsx
export default function DesignSystemV2Page(): React.ReactElement {
  return (
    <main style={{ maxWidth: 1240, margin: '0 auto', padding: 'var(--pad-card)', position: 'relative', zIndex: 1 }}>
      {/* Page header verbatim from lines 119–156 */}
      <header style={{ marginBottom: 32 }}>...</header>
      <hr style={{ border: 0, borderTop: '0.5px solid var(--glass-border)', margin: '24px 0' }} />
      <Section01Hue />
      <Section02Ambient />
      <Section03Tokens />
      <Section04GlassSurface />
      <Section05Press />
      <Section06Sheet />
      <Section07Splash />
      <Section08CardPrimitives />
      <Section09SheetPrimitives />
      <Section10SheetGallery />
    </main>
  );
}
```

---

### `app/debug/design-system-v2/sections/Section01Hue.tsx` (NEW — verbatim extract)

**Analog:** `app/debug/design-system-v2/page.tsx` lines 26–219 (state + helpers + section JSX)

**Imports pattern** (copy verbatim):
```tsx
'use client';
import React, { useState, useEffect } from 'react';
import { Pressable } from '@/app/components/EmberGlass';
```

**State and helpers** (extracted from page.tsx lines 26–106):
```tsx
// AUDIT-EXCEPTION (DS-02): oklch preset map
const ACCENT_PRESETS = {
  copper: 'oklch(0.68 0.17 45)',
  rose:   'oklch(0.68 0.17 0)',
  violet: 'oklch(0.65 0.17 290)',
  blue:   'oklch(0.65 0.14 230)',
  green:  'oklch(0.68 0.12 150)',
  amber:  'oklch(0.76 0.15 75)',
} as const;
type HueName = keyof typeof ACCENT_PRESETS;
const HUE_DISPLAY_NAMES: Record<HueName, string> = { copper:'Copper', rose:'Rose', violet:'Violet', blue:'Blue', green:'Green', amber:'Amber' };
function setAccent(value: string): void {
  document.documentElement.style.setProperty('--accent', value);
  try { localStorage.setItem('ember-glass-accent', value); } catch { /* T-174-03-04 */ }
}

export function Section01Hue() {
  const [activeHue, setActiveHue] = useState<HueName>('copper');
  useEffect(() => {
    try {
      const p = localStorage.getItem('ember-glass-accent');
      if (p) { const m = (Object.entries(ACCENT_PRESETS) as Array<[HueName, string]>).find(([,v]) => v === p); if (m) setActiveHue(m[0]); }
    } catch { /* T-174-03-04 */ }
  }, []);
  const onSwatchClick = (hue: HueName) => { setAccent(ACCENT_PRESETS[hue]); setActiveHue(hue); };
  // ... JSX verbatim from page.tsx lines 161-219
}
```

**Section JSX structure** (lines 161–219 verbatim — do not alter):
```tsx
<section aria-labelledby="sec-01-heading" style={{ marginBottom: 48 }}>
  <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--text-2)' }}>
    01 / HUE
  </p>
  <h2 id="sec-01-heading" style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, color: 'var(--text-1)', margin: '4px 0 8px 0' }}>
    Tinte accento
  </h2>
  ...
</section>
```

---

### `app/debug/design-system-v2/sections/Section02Ambient.tsx` (NEW — verbatim extract)

**Analog:** `app/debug/design-system-v2/page.tsx` lines 60–68 (setAmbient helper) + lines 222–292 (section JSX)

**Imports + helper** (extracted):
```tsx
'use client';
import React, { useState } from 'react';
function setAmbient(on: boolean): void {
  try { localStorage.setItem('ember-glass-ambient', on ? 'true' : 'false'); } catch { /* noop */ }
  document.documentElement.dataset.ambient = on ? 'on' : 'off';
  window.dispatchEvent(new CustomEvent<boolean>('ember-glass-ambient-change', { detail: on }));
}
export function Section02Ambient() {
  const [ambientOn, setAmbientOn] = useState<boolean>(false);
  const onAmbientToggle = () => { const next = !ambientOn; setAmbient(next); setAmbientOn(next); };
  // JSX verbatim from lines 222-292
}
```

---

### `app/debug/design-system-v2/sections/Section03Splash.tsx` (NEW — verbatim extract)

**Analog:** `app/debug/design-system-v2/page.tsx` lines 599–664 (the **current** 07/SPLASH block)

**Key mapping:** Old section number 07 → new Section03. The JSX block at lines 599–664 is the source. Eyebrow changes from `07 / SPLASH` to `03 / SPLASH`. All else verbatim.

```tsx
'use client';
import React, { useState } from 'react';
import { SplashGate } from '@/app/components/EmberGlass';
export function Section03Splash() {
  const [replayKey, setReplayKey] = useState<number>(0);
  // JSX verbatim from page.tsx lines 599-664, eyebrow "03 / SPLASH"
}
```

---

### `app/debug/design-system-v2/sections/Section04Sheet.tsx` (NEW — verbatim extract)

**Analog:** `app/debug/design-system-v2/page.tsx` lines 517–593 (the **current** 06/SHEET block)

**Key mapping:** Old section number 06 → new Section04. Eyebrow changes from `06 / SHEET` to `04 / SHEET`. JSX verbatim otherwise. This section remains the simple demo sheet — the 5 device launchers go in Section08.

```tsx
'use client';
import React, { useState } from 'react';
import { Sheet } from '@/app/components/EmberGlass';
export function Section04Sheet() {
  const [sheetOpen, setSheetOpen] = useState<boolean>(false);
  // JSX verbatim from page.tsx lines 517-593, aria id "sec-04-heading", eyebrow "04 / SHEET"
}
```

---

### `app/debug/design-system-v2/sections/Section03Tokens.tsx` (NEW)

**Analog:** `app/debug/design-system-v2/page.tsx` lines 295–361 (old 03/TOKENS — but this is a full replacement, not a verbatim lift)

**Section heading pattern** (from page.tsx — every section uses this exact inline-style pattern):
```tsx
'use client';
import React, { useState, useEffect } from 'react';

export function Section03Tokens() {
  const [tokens, setTokens] = useState<Record<string, string>>({});
  // D-15: read CSS vars live — only client-side (Pitfall 7: SSR safety)
  useEffect(() => {
    const cs = getComputedStyle(document.documentElement);
    setTokens({
      '--accent':        cs.getPropertyValue('--accent').trim(),
      '--glass-bg':      cs.getPropertyValue('--glass-bg').trim(),
      '--glass-blur':    cs.getPropertyValue('--glass-blur').trim(),
      '--glass-border':  cs.getPropertyValue('--glass-border').trim(),
      '--glass-shadow':  cs.getPropertyValue('--glass-shadow').trim(),
      '--text-1':        cs.getPropertyValue('--text-1').trim(),
      '--text-2':        cs.getPropertyValue('--text-2').trim(),
      '--r-card':        cs.getPropertyValue('--r-card').trim(),
      '--pad-card':      cs.getPropertyValue('--pad-card').trim(),
      '--font-display':  cs.getPropertyValue('--font-display').trim(),
      '--font-body':     cs.getPropertyValue('--font-body').trim(),
    });
  }, []);  // re-runs on mount only; accent picker writes directly to documentElement

  return (
    <section aria-labelledby="sec-05-heading" style={{ marginBottom: 48 }}>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--text-2)' }}>
        05 / TOKENS
      </p>
      <h2 id="sec-05-heading" style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, lineHeight: 1.2, color: 'var(--text-1)', margin: '4px 0 8px' }}>
        Token, tipografia e spaziatura
      </h2>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 400, color: 'var(--text-2)', marginBottom: 24 }}>
        Valori risolti da :root in tempo reale
      </p>
      {/* color swatches, typography pairs, spacing scale, shadow/blur — D-15/D-16/D-17 */}
    </section>
  );
}
```

**Typography sample pattern** (D-17 — Outfit + Inter pairs, all inline-style):
```tsx
// Outfit display samples — AUDIT-EXCEPTION: font-size literals are documentary
<div style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 600, letterSpacing: '-1px', color: 'var(--text-1)' }}>Ember Glass — h1 40/600</div>
<div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, color: 'var(--text-1)' }}>Sezione — h2 24/600</div>
// Inter body samples
<div style={{ fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 400, color: 'var(--text-2)' }}>Corpo testo — Inter 16/400</div>
<div style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--text-2)' }}>EYEBROW — 12/600</div>
```

**Spacing scale pattern** (D-16 — hardcoded literals as documentary):
```tsx
// AUDIT-EXCEPTION: spacing px values below are harvested literals from bundle (D-16)
{[0, 4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 64].map(px => (
  <div key={px} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
    <div style={{ width: px, height: 16, background: 'var(--accent)', borderRadius: 2, minWidth: 1 }} />
    <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-2)' }}>{px}px</span>
  </div>
))}
```

---

### `app/debug/design-system-v2/sections/Section08CardPrimitives.tsx` (NEW)

**Analog:** `app/components/EmberGlass/automations/sections/TriggerSection.tsx` (inline-style + var(--token) section component)

**Imports pattern:**
```tsx
'use client';
import React, { useState } from 'react';
import {
  GlassCard, CardHead, StatusDot, InlineToggle, CircBtn, MiniStat, FlameViz, PlayingBars,
} from '@/app/components/EmberGlass';
import { Flame, Volume2 } from 'lucide-react';
import { CodeSnippet } from './CodeSnippet';
```

**Section heading** — same eyebrow/h2/description block as all other sections (D-10 contract):
```tsx
<section aria-labelledby="sec-06-heading" style={{ marginBottom: 48 }}>
  <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--text-2)' }}>
    06 / CARDS
  </p>
  <h2 id="sec-06-heading" style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, lineHeight: 1.2, color: 'var(--text-1)', margin: '4px 0 8px' }}>
    Primitive carta
  </h2>
  <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 400, color: 'var(--text-2)', marginBottom: 24 }}>
    Componenti delle dashboard card
  </p>
  {/* sub-blocks for each primitive */}
</section>
```

**Primitive sub-block layout** (D-11 — copy for every primitive in Section 06 and 07):
```tsx
{/* === GlassCard sub-block === */}
<div>  {/* sub-block container */}
  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, lineHeight: 1.2, color: 'var(--text-1)', margin: 0 }}>
    GlassCard
  </h3>
  <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 400, color: 'var(--text-2)', marginTop: 4 }}>
    Superficie base 1:1 vetro. Riceve tone wash, press scale via Pressable.
  </p>
  <div style={{ marginTop: 16 }}>
    {/* LIVE SAMPLE */}
    <GlassCard tone="var(--accent)" onOpen={() => {}} style={{ width: 120, height: 120 }}>
      <CardHead Icon={Flame} label="Stufa" tone="var(--accent)" />
    </GlassCard>
  </div>
  <div style={{ marginTop: 12 }}>
    <CodeSnippet code={`<GlassCard tone="var(--accent)" onOpen={() => openSheet()}>\n  <CardHead Icon={Flame} label="Stufa" tone="var(--accent)" />\n</GlassCard>`} />
  </div>
</div>
<hr style={{ border: 0, borderTop: '0.5px solid var(--glass-border)', margin: '24px 0' }} />
```

**InlineToggle onChange signature** (Pitfall 4 — critical):
```tsx
// InlineToggle.onChange is MouseEvent, NOT boolean
const [on, setOn] = useState(false);
<InlineToggle
  on={on}
  color="var(--accent)"
  onChange={(e) => { e.stopPropagation(); setOn(prev => !prev); }}
/>
```

---

### `app/debug/design-system-v2/sections/Section09SheetPrimitives.tsx` (NEW)

**Analog:** `app/components/EmberGlass/automations/sections/TriggerSection.tsx` + `Section08CardPrimitives.tsx` (same sub-block pattern)

**Imports pattern:**
```tsx
'use client';
import React, { useState } from 'react';
import {
  SheetRow, Stepper, Slider, BigSlider, RadialDial, SheetBtn, QuickActionButton,
} from '@/app/components/EmberGlass';
import { Settings } from 'lucide-react';
import { CodeSnippet } from './CodeSnippet';
```

**Stateful sample pattern** (each primitive has isolated useState, not shared):
```tsx
// Stepper sample
const [stepVal, setStepVal] = useState(3);
<Stepper value={stepVal} min={1} max={5} onChange={setStepVal} />

// RadialDial — give gap: 24 (CD-01) and always pass color="var(--accent)"
const [dialVal, setDialVal] = useState(22);
<div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
  <RadialDial value={dialVal} min={7} max={30} onChange={setDialVal} color="var(--accent)" label="°C" />
</div>

// QuickActionButton — active drives visual state (Pitfall: use useState(false))
const [qabActive, setQabActive] = useState(false);
<QuickActionButton active={qabActive} onClick={() => setQabActive(p => !p)} label="Timer" />
```

---

### `app/debug/design-system-v2/sections/Section10SheetGallery.tsx` (NEW)

**Analog:** `app/debug/design-system-v2/page.tsx` lines 517–593 (Section04Sheet pattern — one `sheetOpen` state + Sheet component)

**Critical finding (RESEARCH Pattern 3):** `<*Sheet>` components accept zero props and self-fetch. Section 08 renders them live without fixture injection — sheets show live device data or loading state.

**Imports + state pattern:**
```tsx
'use client';
import React, { useState } from 'react';
import {
  StoveSheet, ClimateSheet, LightsSheet, SonosSheet, PlugsSheet,
} from '@/app/components/EmberGlass';
import { Pressable } from '@/app/components/EmberGlass';

type DeviceKey = 'stove' | 'climate' | 'lights' | 'sonos' | 'plugs' | null;

export function Section10SheetGallery() {
  const [openSheet, setOpenSheet] = useState<DeviceKey>(null);
  const close = () => setOpenSheet(null);
  return (
    <section aria-labelledby="sec-08-heading" style={{ marginBottom: 48 }}>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--text-2)' }}>
        08 / DEMO
      </p>
      <h2 id="sec-08-heading" style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, lineHeight: 1.2, color: 'var(--text-1)', margin: '4px 0 8px' }}>
        Sheet device dal vivo
      </h2>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 400, color: 'var(--text-2)', marginBottom: 24 }}>
        Apri ciascun pannello con dati di esempio
      </p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {/* 5 launcher buttons — one per device sheet */}
        {(['stove','climate','lights','sonos','plugs'] as DeviceKey[]).filter(Boolean).map(key => (
          <Pressable key={key} as="button" type="button" onClick={() => setOpenSheet(key as DeviceKey)}
            style={{ height: 44, padding: '0 20px', borderRadius: 16, border: 'none', background: 'rgba(255,255,255,0.06)', color: 'var(--text-1)', fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            {key}
          </Pressable>
        ))}
      </div>
      {/* Sheets rendered outside the flex row — only one open at a time (D-14) */}
      <StoveSheet />    {/* zero props — self-fetches; Sheet open state is internal to its wrapper */}
      ...
    </section>
  );
}
```

**Note on sheet open prop:** The existing `<StoveSheet>` etc. use an internal `open` mechanism driven by the card click. For the gallery, the simplest approach is to wrap each in the Phase 175 `<Sheet>` primitive directly with the `open` state from Section 08. However, if `<StoveSheet>` itself renders a `<Sheet>` internally, Section 08 should expose its open state by checking `StoveSheet`'s implementation. Verify by reading `app/components/EmberGlass/sheets/StoveSheet.tsx`.

---

### `app/debug/design-system-v2/sections/CodeSnippet.tsx` (NEW)

**Analog:** `app/components/EmberGlass/Pressable.tsx` (for the copy button) + `app/debug/design-system-v2/page.tsx` inline button styles

**Full implementation pattern** (D-18, D-19):
```tsx
'use client';
import React, { useState } from 'react';
import { Pressable } from '@/app/components/EmberGlass';

interface CodeSnippetProps {
  code: string;
}

export function CodeSnippet({ code }: CodeSnippetProps) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(code).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }).catch(() => { /* D-04: silent noop */ });
    } catch {
      /* D-04: clipboard API unavailable — silent noop */
    }
  };
  return (
    <div style={{ position: 'relative' }}>
      <pre style={{
        fontFamily: 'ui-monospace, SF Mono, monospace',
        fontSize: 12,
        color: 'var(--text-2)',
        background: 'var(--glass-bg)',
        border: '0.5px solid var(--glass-border)',
        borderRadius: 8,
        padding: 12,
        margin: 0,
        overflowX: 'auto',
        whiteSpace: 'pre-wrap',
      }}>
        <code>{code}</code>
      </pre>
      <Pressable
        as="button"
        type="button"
        aria-label={copied ? 'Copiato' : 'Copia'}
        onClick={handleCopy}
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          height: 28,
          padding: '0 10px',
          borderRadius: 8,
          border: '0.5px solid var(--glass-border)',
          background: 'rgba(255,255,255,0.06)',
          color: 'var(--text-2)',
          fontFamily: 'var(--font-body)',
          fontSize: 12,
          fontWeight: 500,
          cursor: 'pointer',
        }}
      >
        {copied ? 'Copiato' : 'Copia'}
      </Pressable>
    </div>
  );
}
```

---

### `app/debug/design-system-v2/sections/sheetFixtures.ts` (NEW)

**Analog:** `app/components/EmberGlass/sheets/__tests__/StoveSheet.test.tsx` lines 46–65 (`baseStoveData` shape)

**Pattern:** Export typed fixture objects matching each hook's return shape. Used as documentation/reference (RESEARCH Pattern 3 — sheets self-fetch, fixtures are shapes only).

```typescript
// sheetFixtures.ts — D-13: fixture shapes for Section 08 reference
// These objects mirror the data hook return shapes from StoveSheet.test.tsx:46-65
// and analogous test files. They are documentation shapes, not injected props.

export const stoveFixture = {
  isAccesa: true,
  powerLevel: 3,
  fanLevel: 2,
  needsMaintenance: false,
  initialLoading: false,
  errorDescription: '',
  errorCode: 0,
} as const;

export const climateFixture = {
  roomTemp: 21.5,
  targetTemp: 22,
  mode: 'heating',
  // ... mirror ClimateSheet.test.tsx baseClimateData shape
} as const;

// ... stubs for LightsSheet, SonosSheet, PlugsSheet (mirror respective test files)
```

---

### `app/components/EmberGlass/cards/CircBtn.tsx` (NEW — verbatim port)

**Analog:** `app/components/EmberGlass/StatusDot.tsx` (inline-style + var(--token) pattern, exported interface, `'use client'`, JSDoc with bundle source)

**Exact bundle source** (`.planning/inbox/ember-glass-design/project/components/cards.jsx` lines 298–308):
```jsx
const CircBtn = ({ Icon, onClick, primary, tone }) => (
  <button onClick={onClick} style={{
    width: 34, height: 34, borderRadius: 999, border: 'none', cursor: 'pointer',
    background: primary ? tone : 'rgba(255,255,255,0.08)',
    color: primary ? '#1a0f08' : '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 0,
  }}>
    <Icon size={16} sw={2.2} />
  </button>
);
```

**TypeScript port pattern** (copy StatusDot.tsx structure — lines 1–38):
```tsx
'use client';
/**
 * CircBtn — Phase 182 (D-05)
 *
 * 34×34 circular button. Primary variant uses `tone` as background with dark text.
 * Default variant uses translucent white bg with white text.
 *
 * Bundle source:
 *   .planning/inbox/ember-glass-design/project/components/cards.jsx:298-308
 *
 * Adaptation: `sw={2.2}` → `strokeWidth={2.2}` (lucide-react prop name).
 * D-08: styles verbatim; only prop passing adapted for TypeScript + lucide-react.
 * RC-clean — no manual memoization hooks.
 */
import type { LucideIcon } from 'lucide-react';

export interface CircBtnProps {
  Icon: LucideIcon;
  onClick: () => void;
  primary?: boolean;
  tone: string;  // pass 'var(--accent)' for live recolor
}

export function CircBtn({ Icon, onClick, primary, tone }: CircBtnProps) {
  return (
    <button
      type="button"
      data-testid={primary ? 'circ-btn-primary' : 'circ-btn'}
      onClick={onClick}
      style={{
        width: 34, height: 34, borderRadius: 999, border: 'none', cursor: 'pointer',
        background: primary ? tone : 'rgba(255,255,255,0.08)',
        color: primary ? '#1a0f08' : '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 0,
      }}
    >
      <Icon size={16} strokeWidth={2.2} />  {/* sw → strokeWidth: lucide-react API */}
    </button>
  );
}
```

**CRITICAL PITFALL (RESEARCH Pitfall 3):** Bundle uses `<Icon size={16} sw={2.2} />` but lucide-react uses `strokeWidth`. The TypeScript port MUST render `<Icon size={16} strokeWidth={2.2} />`.

---

### `app/components/EmberGlass/cards/__tests__/CircBtn.test.tsx` (NEW)

**Analog:** `app/components/EmberGlass/sheets/primitives/__tests__/Stepper.test.tsx` (lines 1–48 — exact structural match)

**Pattern** (import, describe, fireEvent, inline-style assertion):
```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { CircBtn } from '../CircBtn';
import { Plus } from 'lucide-react';

describe('CircBtn (D-09)', () => {
  test('renders 34×34 button', () => {
    render(<CircBtn Icon={Plus} onClick={() => undefined} tone="var(--accent)" />);
    const btn = screen.getByRole('button') as HTMLButtonElement;
    expect(btn).toBeInTheDocument();
    const style = btn.getAttribute('style') ?? '';
    expect(style).toContain('width: 34px');
    expect(style).toContain('height: 34px');
  });

  test('primary variant uses tone as background', () => {
    render(<CircBtn Icon={Plus} onClick={() => undefined} primary tone="#ff6600" />);
    const btn = screen.getByTestId('circ-btn-primary');
    const style = btn.getAttribute('style') ?? '';
    expect(style).toContain('background: rgb(255, 102, 0)');  // or toContain('#ff6600')
  });

  test('default variant uses rgba(255,255,255,0.08) as background', () => {
    render(<CircBtn Icon={Plus} onClick={() => undefined} tone="var(--accent)" />);
    const btn = screen.getByTestId('circ-btn');
    const style = btn.getAttribute('style') ?? '';
    expect(style).toContain('rgba(255, 255, 255, 0.08)');
  });

  test('click fires onClick', () => {
    const onClick = jest.fn();
    render(<CircBtn Icon={Plus} onClick={onClick} tone="var(--accent)" />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
```

---

### `app/components/EmberGlass/cards/index.ts` (NEW barrel)

**Analog:** `app/components/EmberGlass/automations/index.ts` (lines 1–11 — barrel preamble) and `app/components/EmberGlass/sheets/index.ts` (lines 1–24)

**Pattern — explicit named exports only** (RESEARCH Pitfall 8 — do NOT use `export *`):
```typescript
/**
 * Phase 182 — cards namespace barrel.
 *
 * IMPORTANT: Explicit named exports only — do NOT use `export *` here.
 * The main EmberGlass/index.ts already re-exports existing card components
 * (StoveCard, ClimateCard etc.) via direct named exports. Adding `export *`
 * would shadow those and cause duplicate-export conflicts.
 *
 * Barrel collision check: CircBtn is a new name, no conflict.
 */
export { CircBtn } from './CircBtn';
export type { CircBtnProps } from './CircBtn';
```

---

### `app/components/EmberGlass/sheets/primitives/BigSlider.tsx` (NEW — verbatim port)

**Analog:** `app/components/EmberGlass/sheets/primitives/Slider.tsx` (lines 1–40 — same pattern: no `'use client'`, exported interface, inline-style range input)

**Exact bundle source** (`.planning/inbox/ember-glass-design/project/components/sheets.jsx` lines 515–533):
```jsx
const BigSlider = ({ value, onChange, color = 'var(--accent)' }) => (
  <div style={{ position: 'relative', height: 72, borderRadius: 20, overflow: 'hidden',
                background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.06)' }}>
    <div style={{
      position: 'absolute', left: 0, top: 0, bottom: 0, width: `${value}%`,
      background: `linear-gradient(90deg, color-mix(in oklab, ${color} 70%, transparent) 0%, ${color} 100%)`,
    }} />
    <input type="range" min="0" max="100" value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
    <div style={{
      position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 20px', pointerEvents: 'none',
    }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, color: '#fff' }}>{value}%</div>
      <IconBulb size={22} stroke="rgba(255,255,255,0.7)" />  {/* ADAPT: <Lightbulb> from lucide-react */}
    </div>
  </div>
);
```

**TypeScript port pattern** (mirror Slider.tsx structure, lines 1–40):
```typescript
/**
 * BigSlider — Phase 182 (D-06)
 *
 * Full-width 72px tall slider with color-mix gradient fill. Shows percentage
 * value as large display text. Transparent overlay `<input type="range">` handles
 * pointer interaction. Default color is var(--accent).
 *
 * Bundle source:
 *   .planning/inbox/ember-glass-design/project/components/sheets.jsx:515-533
 *
 * Adaptation: `<IconBulb>` → `<Lightbulb>` from lucide-react (Pitfall 2).
 * D-08: all styles verbatim.
 */
import { Lightbulb } from 'lucide-react';

export interface BigSliderProps {
  value: number;      // 0..100 (percent)
  onChange: (next: number) => void;
  color?: string;     // default: 'var(--accent)'
}

export function BigSlider({ value, onChange, color = 'var(--accent)' }: BigSliderProps) {
  return (
    <div
      data-testid="big-slider"
      style={{ position: 'relative', height: 72, borderRadius: 20, overflow: 'hidden',
               background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.06)' }}
    >
      {/* gradient fill track */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: `${value}%`,
        background: `linear-gradient(90deg, color-mix(in oklab, ${color} 70%, transparent) 0%, ${color} 100%)`,
      }} />
      {/* transparent range input overlay */}
      <input
        type="range" min="0" max="100" value={value}
        aria-valuenow={value}
        data-testid="big-slider-input"
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
      />
      {/* label overlay — pointerEvents: none so input receives events */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', pointerEvents: 'none',
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, color: '#fff' }}>{value}%</div>
        <Lightbulb size={22} stroke="rgba(255,255,255,0.7)" />
      </div>
    </div>
  );
}
```

**CRITICAL PITFALL (RESEARCH Pitfall 2):** Bundle uses `<IconBulb>` — lucide-react equivalent is `<Lightbulb>`. Import `{ Lightbulb }` from `'lucide-react'`.

---

### `app/components/EmberGlass/sheets/primitives/__tests__/BigSlider.test.tsx` (NEW)

**Analog:** `app/components/EmberGlass/sheets/primitives/__tests__/Slider.test.tsx` (lines 1–35 — exact structural match)

**Pattern** (mirror Slider.test.tsx):
```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { BigSlider } from '../BigSlider';

describe('BigSlider (D-09)', () => {
  test('renders input[type=range] min=0 max=100 value=60', () => {
    render(<BigSlider value={60} onChange={() => undefined} />);
    const input = screen.getByTestId('big-slider-input') as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.type).toBe('range');
    expect(input.min).toBe('0');
    expect(input.max).toBe('100');
    expect(input.value).toBe('60');
  });

  test('changing range input fires onChange(Number)', () => {
    const onChange = jest.fn();
    render(<BigSlider value={60} onChange={onChange} />);
    const input = screen.getByTestId('big-slider-input');
    fireEvent.change(input, { target: { value: '75' } });
    expect(onChange).toHaveBeenCalledWith(75);
  });

  test('percentage label shows value%', () => {
    render(<BigSlider value={42} onChange={() => undefined} />);
    expect(screen.getByText('42%')).toBeInTheDocument();
  });

  test('default color uses var(--accent) in gradient', () => {
    render(<BigSlider value={60} onChange={() => undefined} />);
    // The gradient fill div is the first child of the container
    const container = screen.getByTestId('big-slider');
    const fillDiv = container.firstElementChild as HTMLElement;
    const style = fillDiv?.getAttribute('style') ?? '';
    expect(style).toContain('var(--accent)');
  });

  test('custom color appears in gradient', () => {
    render(<BigSlider value={60} onChange={() => undefined} color="#b080ff" />);
    const container = screen.getByTestId('big-slider');
    const fillDiv = container.firstElementChild as HTMLElement;
    const style = fillDiv?.getAttribute('style') ?? '';
    expect(style).toContain('#b080ff');
  });
});
```

---

### `app/components/EmberGlass/index.ts` (edit — add CircBtn + BigSlider)

**Analog:** itself (lines 1–52 — current barrel)

**Lines to add** (after line 51, before `export { AltroRow }` or append at end):
```typescript
// Phase 182 — new primitives
export { CircBtn } from './cards/CircBtn';
export type { CircBtnProps } from './cards/CircBtn';
export { BigSlider } from './sheets/primitives/BigSlider';
export type { BigSliderProps } from './sheets/primitives/BigSlider';
```

**Also update** `app/components/EmberGlass/sheets/index.ts` (line 24, add before the `findSceneByName` export):
```typescript
export { BigSlider } from './primitives/BigSlider';
export type { BigSliderProps } from './primitives/BigSlider';
```

---

### `tests/smoke/design-system-v2-primitives.spec.ts` (NEW)

**Analog:** `tests/smoke/accent-picker.spec.ts` (lines 1–42) + `tests/smoke/sheet-primitive.spec.ts` (lines 1–94)

**Auth/page-load pattern** (from accent-picker.spec.ts lines 13–16):
```typescript
import { test, expect } from '@playwright/test';
// storageState from playwright.config.ts — auth session auto-applied
test.describe('Phase 182 primitives reference (DSREF-01..03)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/debug/design-system-v2');
    await expect(page.getByRole('heading', { level: 1, name: /Ember Glass/i })).toBeVisible({ timeout: 10000 });
  });
  // ...
});
```

**Section presence assertions** (D-20a — one per new section 05–08):
```typescript
test('new section headings 05-08 are rendered', async ({ page }) => {
  await expect(page.getByRole('heading', { name: /Token, tipografia e spaziatura/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Primitive carta/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Primitive sheet/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Sheet device dal vivo/i })).toBeVisible();
});
```

**Recolor invariant** (D-20c — SC-#3 contract, from accent-picker.spec.ts pattern):
```typescript
test('violet accent recolors CircBtn primary and BigSlider gradient (SC-#3)', async ({ page }) => {
  // Pick violet swatch (same pattern as accent-picker.spec.ts lines 19-26)
  await page.getByRole('button', { name: /Set accent to Violet/i }).click();

  // Assert --accent CSS var is set to violet value
  const accent = await page.evaluate(() =>
    document.documentElement.style.getPropertyValue('--accent').trim()
  );
  expect(accent).toBe('oklch(0.65 0.17 290)');

  // Assert CircBtn primary background contains the accent (data-testid set in D-09 CircBtn port)
  // getComputedStyle on inline-style background resolves the var() to RGB
  const circBtnBg = await page.locator('[data-testid="circ-btn-primary"]').first().evaluate(
    (el) => getComputedStyle(el as HTMLElement).backgroundColor
  );
  // Non-empty and not the default copper oklch(0.68 0.17 45) resolved RGB
  expect(circBtnBg).not.toBe('');

  // Assert BigSlider gradient fill contains --accent reference via --accent CSS var value
  // The fill div has inline background with color-mix(in oklab, ${color} 70%, ...) where color=var(--accent)
  const sliderBg = await page.locator('[data-testid="big-slider"]').first().evaluate((el) => {
    const fill = el.firstElementChild as HTMLElement;
    return fill?.style?.background ?? '';
  });
  expect(sliderBg).toContain('var(--accent)');
});
```

**Primitive sub-block presence** (D-20b — one locator per primitive from SC-#1):
```typescript
test('all 13 SC-#1 primitives have visible sub-block headings', async ({ page }) => {
  const primitiveNames = ['GlassCard','CardHead','StatusDot','InlineToggle','CircBtn',
    'MiniStat','FlameViz','PlayingBars','SheetRow','Stepper','Slider','BigSlider','RadialDial'];
  for (const name of primitiveNames) {
    await expect(page.getByRole('heading', { name: new RegExp(name, 'i') })).toBeVisible();
  }
});
```

---

### `app/debug/design-system-v2/__tests__/page.test.tsx` (edit — add 4th describe)

**Analog:** itself (lines 119–138 — `Page structure` describe block structure)

**Hook mocking required for Section 08** (RESEARCH Pitfall 5 — critical):

The page test renders `<DesignSystemV2Page />` which now includes `<Section10SheetGallery />`. That section renders `<StoveSheet />` (zero props but self-fetching). Add hook mocks mirroring `StoveSheet.test.tsx` lines 17–85:

```typescript
// Add at top of page.test.tsx (before all describe blocks):
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('@auth0/nextjs-auth0/client', () => ({ useUser: () => ({ user: { sub: 'auth0|test' } }) }));
jest.mock('@/app/context/VersionContext', () => ({ useVersion: () => ({ checkVersion: jest.fn() }) }));
jest.mock('@/app/components/devices/stove/hooks/useStoveData', () => ({
  useStoveData: () => ({ isAccesa: false, powerLevel: null, fanLevel: null, initialLoading: true, errorDescription: '', needsMaintenance: false, errorCode: 0 }),
}));
jest.mock('@/app/components/devices/stove/hooks/useStoveCommands', () => ({
  useStoveCommands: () => ({ handleIgnite: jest.fn(), handleShutdown: jest.fn(), handlePowerChange: jest.fn(), handleFanChange: jest.fn() }),
}));
// ... similar mocks for useThermostatData, useLightsData, useSonosFullData, useTuyaData
```

**4th describe block** (new):
```typescript
describe('Phase 182 — section decomposition (D-21)', () => {
  it('renders all 8 section headings', () => {
    render(<DesignSystemV2Page />);
    expect(screen.getByText('Tinte accento')).toBeInTheDocument();
    expect(screen.getByText('Glow ambient')).toBeInTheDocument();
    expect(screen.getByText('Splash post-Auth0')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Sheet primitivo/i })).toBeInTheDocument();
    expect(screen.getByText('Token, tipografia e spaziatura')).toBeInTheDocument();
    expect(screen.getByText('Primitive carta')).toBeInTheDocument();
    expect(screen.getByText('Primitive sheet')).toBeInTheDocument();
    expect(screen.getByText('Sheet device dal vivo')).toBeInTheDocument();
  });
});
```

---

## Shared Patterns

### Inline-Style + `var(--token)` Discipline (D-02)
**Source:** `app/components/EmberGlass/StatusDot.tsx` lines 22–38 + `app/components/EmberGlass/MiniStat.tsx` lines 22–57
**Apply to:** ALL new section files, `CircBtn.tsx`, `BigSlider.tsx`, `CodeSnippet.tsx`
```tsx
// D-02 canonical: every visual value is inline + var(--token).
// Layout Tailwind (flex, grid) on section wrapper is acceptable; color/font/spacing must be inline.
// AUDIT-EXCEPTION comment required when a literal value is documentary (e.g., oklch preset).
style={{ fontSize: 11, color: 'var(--text-2)', marginBottom: 3 }}  // ← MiniStat.tsx:26
style={{ height: 3, borderRadius: 999, background: 'rgba(255,255,255,0.08)' }}  // ← MiniStat.tsx:37
style={{ width: `${clamped * 100}%`, background: 'var(--accent)' }}  // ← MiniStat.tsx:48
```

### `'use client'` Directive (D-03)
**Source:** `app/debug/design-system-v2/page.tsx` line 1, `app/components/EmberGlass/MiniStat.tsx` line 1, `app/components/EmberGlass/StatusDot.tsx` line 1
**Apply to:** ALL new `sections/Section0X.tsx` files, `CodeSnippet.tsx`, `CircBtn.tsx`
**Exception:** `BigSlider.tsx` and `Slider.tsx` (the existing analog) do NOT have `'use client'` — they are leaf primitives without hooks.

### Section Eyebrow + Heading Block (D-10)
**Source:** `app/debug/design-system-v2/page.tsx` lines 161–188 (Section 01 heading verbatim)
**Apply to:** `Section03Tokens.tsx`, `Section08CardPrimitives.tsx`, `Section09SheetPrimitives.tsx`, `Section10SheetGallery.tsx`
```tsx
// Exact inline-style values — do not deviate
<p style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--text-2)' }}>
  0X / LABEL
</p>
<h2 id="sec-0X-heading" style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, color: 'var(--text-1)', margin: '4px 0 8px 0' }}>
  Titolo italiano
</h2>
<p style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: 'var(--text-2)', marginBottom: 24 }}>
  Descrizione italiana
</p>
```

### HR Divider Between Sub-Blocks (D-11)
**Source:** `app/debug/design-system-v2/page.tsx` line 158
**Apply to:** Inside every primitive sub-block sequence in Section 06 and 07
```tsx
<hr style={{ border: 0, borderTop: '0.5px solid var(--glass-border)', margin: '24px 0' }} />
```

### localStorage try/catch Silent Fallback (D-04, D-07, D-19)
**Source:** `app/debug/design-system-v2/page.tsx` lines 53–57
**Apply to:** `CodeSnippet.tsx` clipboard write, `Section01Hue.tsx` localStorage write
```tsx
try {
  localStorage.setItem('ember-glass-accent', value);
} catch {
  /* T-174-03-04: QuotaExceeded / disabled storage — silently noop. */
}
```

### Bundle-Verbatim Port Convention (D-08)
**Source:** `app/components/EmberGlass/StatusDot.tsx` JSDoc lines 5–13 + `app/components/EmberGlass/MiniStat.tsx` JSDoc lines 5–13
**Apply to:** `CircBtn.tsx`, `BigSlider.tsx`
```tsx
/**
 * PrimitiveName — Phase 182 (D-0X)
 *
 * One-line description.
 *
 * Bundle source:
 *   .planning/inbox/ember-glass-design/project/components/cards.jsx:298-308
 *
 * RC-clean — no manual memoization hooks (D-28 — React Compiler discipline).
 */
```

### Playwright Auth + Page Load Pattern
**Source:** `tests/smoke/accent-picker.spec.ts` lines 13–16
**Apply to:** `tests/smoke/design-system-v2-primitives.spec.ts`
```typescript
// storageState from playwright.config.ts applies Auth0 session automatically.
// No explicit auth setup needed in spec file.
await page.goto('/debug/design-system-v2');
await expect(page.getByRole('heading', { level: 1, name: /Ember Glass/i })).toBeVisible({ timeout: 10000 });
```

### JSDoc AUDIT-EXCEPTION Comment for Literal Values
**Source:** `app/debug/design-system-v2/page.tsx` lines 29–30, 346
**Apply to:** Any literal color/font-size value used for documentary display in Section 05/06/07
```tsx
// AUDIT-EXCEPTION (DS-02): the 6 oklch literal strings below are the source-of-truth
// preset map (D-05). Every other visual value on this page is a token reference.
```

---

## Section Line Range Reference (Critical for Plan 182-01)

**Reconciled extraction mapping (orchestrator override of CONTEXT.md D-10 — see Plan 01 `<reconciliation>` block):** all 7 existing sections are preserved verbatim. Existing `tests/smoke/press-primitive.spec.ts` (Phase 175) and `accent-picker.spec.ts` / `ambient-persist.spec.ts` (Phase 174) lock `sec-01..sec-07-heading` IDs — renumbering would break those test contracts.

| New Section | Source Block in current `page.tsx` | Line Range | Action |
|-------------|-------------------------------------|------------|--------|
| `Section01Hue.tsx` | Existing 01/HUE + state/helpers | lines 26–219 | Extract verbatim — eyebrow stays "01 / HUE" |
| `Section02Ambient.tsx` | Existing 02/AMBIENT + setAmbient | lines 60–68 + 222–292 | Extract verbatim — eyebrow stays "02 / AMBIENT" |
| `Section03Tokens.tsx` | Existing 03/TOKENS (live token grid) | lines 295–361 | Extract verbatim (eyebrow stays "03 / TOKENS"); Plan 05 then EXTENDS with typography specimens, spacing tiles, shadow/blur tiles |
| `Section04GlassSurface.tsx` | Existing 04/GLASS-SURFACE demo | lines 364–423 | Extract verbatim — eyebrow stays "04 / GLASS" |
| `Section05Press.tsx` | Existing 05/PRESS (Phase 175 demo) | lines 426–513 | Extract verbatim — eyebrow stays "05 / PRESS" (locked by `tests/smoke/press-primitive.spec.ts`) |
| `Section06Sheet.tsx` | Existing 06/SHEET (Phase 175 demo) | lines 517–593 | Extract verbatim — eyebrow stays "06 / SHEET" |
| `Section07Splash.tsx` | Existing 07/SPLASH (Phase 176 demo) | lines 599–664 | Extract verbatim — eyebrow stays "07 / SPLASH" |
| `Section08CardPrimitives.tsx` | NEW (Plan 06) | — | Add card primitive samples (eyebrow "08 / CARDS") |
| `Section09SheetPrimitives.tsx` | NEW (Plan 07) | — | Add sheet primitive samples (eyebrow "09 / SHEET") |
| `Section10SheetGallery.tsx` | NEW (Plan 08) | — | Add 5 device-sheet launchers (eyebrow "10 / DEMO") |

**State variables extracted out of `page.tsx`:**
- `activeHue`, `setActiveHue`, `ACCENT_PRESETS`, `HUE_DISPLAY_NAMES`, `setAccent` → `Section01Hue.tsx`
- `ambientOn`, `setAmbientOn`, `setAmbient`, `onAmbientToggle` → `Section02Ambient.tsx`
- `replayKey`, `setReplayKey` → `Section03Splash.tsx`
- `sheetOpen`, `setSheetOpen` → `Section04Sheet.tsx`
- `useEffect` (localStorage hydration) → `Section01Hue.tsx`
- `onSwatchClick` → `Section01Hue.tsx`

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `app/debug/design-system-v2/sections/sheetFixtures.ts` | utility | transform | No analogous fixture-shape-only TS file exists; nearest is `StoveSheet.test.tsx` mock data objects which are inline test fixtures, not standalone utility modules. Pattern is clear but file type is novel. |

---

## Metadata

**Analog search scope:** `app/debug/design-system-v2/`, `app/components/EmberGlass/`, `app/components/EmberGlass/sheets/`, `app/components/EmberGlass/automations/`, `tests/smoke/`
**Files scanned:** 19 source files + 4 test files read
**Pattern extraction date:** 2026-05-03

**Critical pitfalls to surface in plans:**
1. `CircBtn`: `sw={2.2}` → `strokeWidth={2.2}` (lucide-react — RESEARCH Pitfall 3)
2. `BigSlider`: `<IconBulb>` → `<Lightbulb>` from lucide-react (RESEARCH Pitfall 2)
3. `Section03Splash`: source is old **07**/SPLASH (line 599), NOT old 03/TOKENS (line 295) — RESEARCH Pitfall 1
4. `Section04Sheet`: source is old **06**/SHEET (line 517), NOT old 04/DEMO (line 364) — same pitfall family
5. `InlineToggle.onChange`: is `MouseEvent`, not `boolean` (RESEARCH Pitfall 4)
6. `page.test.tsx`: needs hook mocks for `<*Sheet>` components to avoid WebSocket/polling context errors (RESEARCH Pitfall 5)
7. `cards/index.ts`: explicit named exports only — do NOT use `export *` (RESEARCH Pitfall 8)
8. Playwright spec path: `tests/smoke/design-system-v2-primitives.spec.ts` — NOT `tests/playwright/` (RESEARCH Pitfall 6)
9. `Section03Tokens.tsx`: `getComputedStyle` must be in `useEffect` — never called at render time (RESEARCH Pitfall 7)
