# Page Transitions - Sistema Cinematografico

Sistema di transizioni di pagina professionale integrato con Ember Noir Design System.

## Overview

Il sistema di transizioni utilizza:
- **View Transitions API** (nativa, Chrome 111+, Safari 18+)
- **CSS Animations** (fallback per tutti i browser)
- **Direction awareness** (animazioni diverse per avanti/indietro)
- **Accessibilità** (rispetta automaticamente `prefers-reduced-motion`)

## Quick Start

### 1. Usa TransitionLink

Sostituisci `Link` di Next.js con `TransitionLink`:

```jsx
import TransitionLink from '@/app/components/TransitionLink';

// Default transition (slide-morph)
<TransitionLink href="/stove">
  Go to Stove
</TransitionLink>

// Custom transition per link
<TransitionLink
  href="/stove"
  transitionType="ember-burst"
>
  Go to Stove with Ember Burst
</TransitionLink>
```

### 2. Cambia transizione globalmente

```jsx
import { usePageTransition, TRANSITION_TYPES } from '@/app/context/PageTransitionContext';

function MyComponent() {
  const { setTransitionType } = usePageTransition();

  const handleClick = () => {
    setTransitionType(TRANSITION_TYPES.EMBER_BURST);
  };

  return <button onClick={handleClick}>Set Ember Burst</button>;
}
```

## Tipi di Transizione

### 1. **slide-morph** (Default)
Slide laterale + scale + blur. Stile iOS moderno.
- Forward: slide da destra
- Backward: slide da sinistra
- Durata: 500ms
- Uso: Navigazione standard

```jsx
<TransitionLink href="/page" transitionType="slide-morph">
  Navigate
</TransitionLink>
```

### 2. **fade-scale**
Zoom gentile con fade in/out.
- Forward: zoom in
- Backward: zoom out
- Durata: 500ms
- Uso: Transizioni delicate, contenuti leggeri

```jsx
<TransitionLink href="/page" transitionType="fade-scale">
  Navigate
</TransitionLink>
```

### 3. **ember-burst**
Esplosione ember glow con brightness boost. Effetto spettacolare!
- Forward/Backward: esplosione simmetrica
- Durata: 500ms
- Uso: Momenti importanti, azioni primarie

```jsx
<TransitionLink href="/page" transitionType="ember-burst">
  Navigate with Impact!
</TransitionLink>
```

### 4. **liquid-flow**
Flow liquido verticale con clip-path.
- Forward: flow dall'alto
- Backward: flow dal basso
- Durata: 500ms
- Uso: Contenuti verticali, scroll narrativo

```jsx
<TransitionLink href="/page" transitionType="liquid-flow">
  Navigate
</TransitionLink>
```

### 5. **stack-lift**
Card lift con rotazione 3D. Stile iOS stack.
- Forward: lift up
- Backward: lift down
- Durata: 500ms
- Uso: Navigazione gerarchica (dettagli → lista)

```jsx
<TransitionLink href="/page" transitionType="stack-lift">
  Navigate
</TransitionLink>
```

### 6. **diagonal-sweep**
Wipe diagonale cinematografico.
- Forward: sweep da angolo superiore-sinistro
- Backward: sweep inverso
- Durata: 500ms
- Uso: Cambi di contesto, scene cinematografiche

```jsx
<TransitionLink href="/page" transitionType="diagonal-sweep">
  Navigate
</TransitionLink>
```

## API Reference

### PageTransitionContext

```jsx
import { usePageTransition } from '@/app/context/PageTransitionContext';

const {
  startTransition,    // (callback) => Promise<void>
  isTransitioning,    // boolean
  transitionType,     // string
  setTransitionType,  // (type: string) => void
  direction,          // 'forward' | 'backward'
} = usePageTransition();
```

### TRANSITION_TYPES

```jsx
import { TRANSITION_TYPES } from '@/app/context/PageTransitionContext';

TRANSITION_TYPES.SLIDE_MORPH     // 'slide-morph'
TRANSITION_TYPES.FADE_SCALE      // 'fade-scale'
TRANSITION_TYPES.EMBER_BURST     // 'ember-burst'
TRANSITION_TYPES.LIQUID_FLOW     // 'liquid-flow'
TRANSITION_TYPES.STACK_LIFT      // 'stack-lift'
TRANSITION_TYPES.DIAGONAL_SWEEP  // 'diagonal-sweep'
```

### TransitionLink Props

Tutti i props di `next/link` sono supportati:

```jsx
<TransitionLink
  href="/page"              // required
  transitionType="..."      // optional
  className="..."           // optional
  prefetch={true}           // optional
  replace={false}           // optional
  scroll={true}             // optional
  // ... tutti gli altri props di Link
>
  Children
</TransitionLink>
```

## Architettura

### File Structure

```
app/
├── context/
│   └── PageTransitionContext.js    # Provider + hooks
├── components/
│   └── TransitionLink.js           # Link wrapper
└── globals.css                     # CSS animations

docs/
└── page-transitions.md             # Questa documentazione
```

### Flow Diagram

```
User clicks TransitionLink
    ↓
TransitionLink intercetta click
    ↓
startTransition() chiamato
    ↓
Set data attributes su <html>
    ↓
View Transitions API disponibile?
    ├─ YES → document.startViewTransition()
    │          └─ CSS ::view-transition-* animations
    │
    └─ NO  → Fallback CSS animations
               ├─ data-transition-phase="exit"
               ├─ Exit animation (400ms)
               ├─ Router push/replace
               ├─ data-transition-phase="enter"
               └─ Enter animation (400ms)
    ↓
Clean up data attributes
    ↓
Done ✓
```

### Browser Support

| Feature | Chrome | Safari | Firefox | Edge |
|---------|--------|--------|---------|------|
| View Transitions API | 111+ | 18+ | ❌ | 111+ |
| CSS Fallback | ✅ | ✅ | ✅ | ✅ |
| Direction Detection | ✅ | ✅ | ✅ | ✅ |
| Reduced Motion | ✅ | ✅ | ✅ | ✅ |

**Note**:
- Firefox non supporta View Transitions API → usa CSS fallback
- Tutti i browser moderni supportano CSS fallback
- `prefers-reduced-motion` disabilita tutte le transizioni

## Testing

### Test Page

Visita `/debug/transitions` per:
- Vedere tutti i tipi di transizione
- Cambiare tipo in real-time
- Testare su pagine reali
- Vedere esempi di codice

### Test Manuale

```bash
npm run dev

# Naviga a http://localhost:3000/debug/transitions
# Seleziona transizione → Clicca su una pagina demo → Osserva transizione
```

### Accessibilità

Il sistema rispetta automaticamente le preferenze utente:

```css
@media (prefers-reduced-motion: reduce) {
  ::view-transition-old(root),
  ::view-transition-new(root) {
    animation: none !important;
  }
}
```

## Performance

### Metriche

- **Durata transizione**: 500ms (ottimale per percezione utente)
- **Frame rate target**: 60fps (16.67ms/frame)
- **GPU acceleration**: ✅ (transform, opacity, filter)
- **Layout thrashing**: ❌ (no reflows)

### Best Practices

1. **Usa transform invece di position**
   ```css
   /* ✅ GOOD - GPU accelerated */
   transform: translateX(100%);

   /* ❌ BAD - triggers reflow */
   left: 100%;
   ```

2. **Limita filter blur**
   ```css
   /* ✅ GOOD - subtle blur */
   filter: blur(8px);

   /* ❌ BAD - performance hit */
   filter: blur(50px);
   ```

3. **Evita transizioni su pagine pesanti**
   - Preferisci `fade-scale` per pagine con molte immagini
   - Usa `slide-morph` per contenuti leggeri

## Customization

### Creare nuova transizione

1. **Aggiungi tipo in Context**
   ```jsx
   // app/context/PageTransitionContext.js
   export const TRANSITION_TYPES = {
     // ... existing
     MY_TRANSITION: 'my-transition',
   };
   ```

2. **Aggiungi CSS animations**
   ```css
   /* app/globals.css */
   [data-transition-type="my-transition"] ::view-transition-old(root) {
     animation-name: my-transition-out;
   }

   [data-transition-type="my-transition"] ::view-transition-new(root) {
     animation-name: my-transition-in;
   }

   @keyframes my-transition-out {
     /* ... */
   }

   @keyframes my-transition-in {
     /* ... */
   }
   ```

3. **Usa la transizione**
   ```jsx
   <TransitionLink href="/page" transitionType="my-transition">
     Navigate
   </TransitionLink>
   ```

### Modificare durata

```css
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 0.5s; /* Default */
  /* Cambia a 0.3s per transizioni più veloci */
  animation-duration: 0.3s;
}
```

### Modificare easing

```css
::view-transition-old(root),
::view-transition-new(root) {
  animation-timing-function: var(--ease-out-expo); /* Default */
  /* Usa custom easing */
  animation-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

## Troubleshooting

### Transizioni non funzionano

1. **Verifica View Transitions API support**
   ```js
   console.log('View Transitions:', !!document.startViewTransition);
   ```
   - Se `false` → Browser non supportato, dovrebbe usare fallback CSS

2. **Verifica PageTransitionProvider**
   ```jsx
   // app/components/ClientProviders.js
   <PageTransitionProvider>
     {children}
   </PageTransitionProvider>
   ```

3. **Verifica meta tag**
   ```html
   <!-- app/layout.js -->
   <meta name="view-transition" content="same-origin" />
   ```

### Transizioni troppo lente/veloci

Modifica durata in `globals.css`:

```css
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 0.3s; /* Più veloce (default: 0.5s) */
}
```

### Direction detection non funziona

Il sistema traccia la history stack. Se navigi direttamente (URL bar), direction sarà sempre `forward`.

Per testare `backward`:
1. Naviga da A → B → C
2. Click "indietro" nel browser
3. C → B dovrebbe avere direction `backward`

### Reduced motion non funziona

Verifica CSS:

```css
@media (prefers-reduced-motion: reduce) {
  ::view-transition-old(root),
  ::view-transition-new(root) {
    animation: none !important;
  }
}
```

Test manualmente:
- macOS: System Preferences → Accessibility → Display → Reduce motion
- Windows: Settings → Ease of Access → Display → Show animations

## Examples

### Conditional transitions

```jsx
function MyLink({ href, isImportant }) {
  const transitionType = isImportant
    ? TRANSITION_TYPES.EMBER_BURST
    : TRANSITION_TYPES.SLIDE_MORPH;

  return (
    <TransitionLink href={href} transitionType={transitionType}>
      Navigate
    </TransitionLink>
  );
}
```

### Programmatic navigation

```jsx
import { useRouter } from 'next/navigation';
import { usePageTransition, TRANSITION_TYPES } from '@/app/context/PageTransitionContext';

function MyComponent() {
  const router = useRouter();
  const { startTransition, setTransitionType } = usePageTransition();

  const handleNavigate = async () => {
    setTransitionType(TRANSITION_TYPES.EMBER_BURST);
    await startTransition(() => {
      router.push('/stove');
    });
  };

  return <button onClick={handleNavigate}>Go to Stove</button>;
}
```

### Listen to transition state

```jsx
import { usePageTransition } from '@/app/context/PageTransitionContext';

function TransitionIndicator() {
  const { isTransitioning } = usePageTransition();

  if (!isTransitioning) return null;

  return (
    <div className="fixed top-4 right-4 bg-ember-500 px-4 py-2 rounded-xl">
      Transitioning...
    </div>
  );
}
```

## Migration Guide

### Da Link standard a TransitionLink

**Before:**
```jsx
import Link from 'next/link';

<Link href="/stove">Go to Stove</Link>
```

**After:**
```jsx
import TransitionLink from '@/app/components/TransitionLink';

<TransitionLink href="/stove">Go to Stove</TransitionLink>
```

Tutti i props rimangono compatibili!

### Existing navigation components

Se hai componenti navigation custom:

**Before:**
```jsx
function NavItem({ href, children }) {
  return <Link href={href} className="nav-item">{children}</Link>;
}
```

**After:**
```jsx
import TransitionLink from '@/app/components/TransitionLink';

function NavItem({ href, children }) {
  return (
    <TransitionLink href={href} className="nav-item">
      {children}
    </TransitionLink>
  );
}
```

## Credits

- **View Transitions API**: Chrome team, Safari team
- **Design**: Ember Noir Design System
- **Animations**: Custom cinematographic transitions
- **Integration**: Next.js 15 App Router

---

**Version**: 1.0.0
**Last Updated**: 2025-01-16
**Maintainer**: Federico Manfredi
