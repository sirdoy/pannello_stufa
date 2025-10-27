# UI Components

Componenti UI riutilizzabili con liquid glass style iOS 18.

## Card

Componente container base con supporto liquid glass e legacy glassmorphism.

```jsx
<Card className="p-6">Content</Card>
<Card liquid className="p-6">Liquid Glass iOS 18 style</Card>
<Card glass className="p-6">Legacy glassmorphism</Card>  // Mantenuto per compatibilità
```

**Props**:
- `liquid={true}` - Applica liquid glass style
- `glass={true}` - Legacy glassmorphism
- `className` - Classi Tailwind aggiuntive

**Styling Standards**:
```jsx
<Card className="p-6">Standard</Card>              // Default solid
<Card liquid className="p-6">Liquid Glass</Card>   // iOS 18 style (preferito)
<Card className="p-8">Hero Content</Card>          // Hero sections
<Card glass className="p-6">Legacy Glass</Card>    // Glassmorphism legacy
<Card className="p-6 bg-info-50 border-2 border-info-200">Info</Card> // Colored info
```

**Best practice**: Usa `liquid` per UI moderna consistente, `glass` mantenuto per compatibilità.

**Implementazione**: `app/components/ui/Card.js`

## Button

Componente pulsante con varianti semantiche e liquid glass support.

```jsx
<Button
  liquid
  variant="primary|secondary|success|danger|accent|outline|ghost"
  size="sm|md|lg"
  icon="🔥"
>
  Accendi
</Button>
```

**Props**:
- `liquid={true}` - Applica liquid glass style a tutte le varianti
- `variant` - Variante semantica (default: primary)
  - `primary` - Azioni primarie (rosso)
  - `secondary` - Azioni secondarie
  - `success` - Successo/conferma (verde)
  - `danger` - Azioni distruttive (rosso scuro)
  - `accent` - Accenti (arancione)
  - `outline` - Bordo senza fill
  - `ghost` - Trasparente al hover
- `size` - Dimensione (sm/md/lg, default: md)
- `icon` - Emoji/icona opzionale
- `disabled` - Stato disabilitato

**Implementazione**: `app/components/ui/Button.js`

## Banner

Componente alert/warning riutilizzabile con 4 varianti semantiche.

```jsx
<Banner
  liquid
  variant="info|warning|error|success"
  icon="ℹ️"
  title="Titolo"
  description="Descrizione o JSX inline"
  actions={<Button>Azione</Button>}
  dismissible
  onDismiss={() => {}}
/>
```

**Props**:
- `liquid={true}` - Applica liquid glass style con colori semantici
- `variant` - Variante semantica (default: info)
  - `info` - Informazioni (blu)
  - `warning` - Attenzioni (giallo-arancio)
  - `error` - Errori (rosso)
  - `success` - Successo (verde)
- `icon` - Emoji/icona
- `title` - Titolo del banner
- `description` - Descrizione (supporta JSX inline)
- `actions` - Pulsanti azione (supporta JSX inline)
- `dismissible` - Mostra pulsante chiusura
- `onDismiss` - Callback chiusura

**Supporto JSX inline**: Sia `description` che `actions` accettano JSX per layout complessi.

**Implementazione**: `app/components/ui/Banner.js`

## Toast

Notifiche temporanee con auto-dismiss per feedback UX immediato.

```jsx
<Toast
  message="Operazione completata"
  icon="✓"
  variant="success|warning|info|error"
  duration={3000}
  onDismiss={() => setToast(null)}
/>
```

**Props**:
- `message` - Testo notifica (required)
- `icon` - Emoji/icona (default: '✓')
- `variant` - Variante semantica (default: success)
  - `success` - Operazioni completate (verde)
  - `warning` - Attenzioni (giallo)
  - `info` - Informazioni (blu)
  - `error` - Errori (rosso)
- `duration` - Millisecondi prima auto-dismiss (default: 3000, 0 = no auto-dismiss)
- `onDismiss` - Callback chiamato su dismiss (auto o manuale)

**Posizionamento**: Fixed top-center (`fixed top-4 left-1/2 -translate-x-1/2 z-[9999]`)

**Animazione**: slideDown CSS custom con opacity fade-in (300ms ease-out)

**Pattern d'uso**:
```jsx
const [toast, setToast] = useState(null);

// Trigger toast
setToast({
  message: 'Salvataggio completato',
  icon: '✓',
  variant: 'success'
});

// Render
{toast && (
  <Toast
    message={toast.message}
    icon={toast.icon}
    variant={toast.variant}
    duration={3000}
    onDismiss={() => setToast(null)}
  />
)}
```

**Best practice**:
- Usa per feedback operazioni utente (salvataggio, modifica, errori)
- Massimo 1 toast alla volta (sostituisci stato)
- Messaggi concisi (max 2 righe)
- Variante semantica appropriata al contesto

**Implementazione**: `app/components/ui/Toast.js`, animazione in `app/globals.css`

## Select

Dropdown con liquid glass style e z-index ottimizzato.

```jsx
<Select
  liquid
  value={power}
  onChange={setPower}
  options={[
    {value: 1, label: 'P1'},
    {value: 2, label: 'P2'},
    // ...
  ]}
  disabled={!isOn}
/>
```

**Props**:
- `liquid={true}` - Applica liquid glass a trigger button e dropdown menu
- `value` - Valore selezionato
- `onChange` - Callback selezione
- `options` - Array di opzioni `{value, label}`
- `disabled` - Stato disabilitato

**Z-index**: Dropdown menu usa `z-[100]` per apparire sopra altri elementi.

**Implementazione**: `app/components/ui/Select.js`

## Input

Input field con liquid glass style e backdrop blur.

```jsx
<Input
  liquid
  type="text|number|email|password"
  placeholder="Inserisci valore"
  value={value}
  onChange={setValue}
/>
```

**Props**:
- `liquid={true}` - Applica liquid glass style con backdrop blur
- `type` - Tipo input HTML
- `placeholder` - Placeholder text
- `value` - Valore controllato
- `onChange` - Callback change

**Implementazione**: `app/components/ui/Input.js`

## Skeleton

Componente loading placeholder con animazione pulse.

```jsx
<Skeleton className="h-6 w-full" />
<Skeleton className="h-8 w-32" />
```

**Props**:
- `className` - Classi Tailwind per dimensioni

**Implementazione**: `app/components/ui/Skeleton.js`

## Footer

Footer applicazione con link e informazioni.

**Implementazione**: `app/components/ui/Footer.js`

## Liquid Glass Style Pattern

Pattern unificato iOS 18 per componenti UI con trasparenza e blur.

### Composizione Base

```jsx
className="bg-white/[0.08] backdrop-blur-3xl shadow-liquid-sm ring-1 ring-white/20 ring-inset
           relative overflow-hidden
           before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/10 before:to-transparent before:pointer-events-none"
```

**Elementi**:
- `bg-white/[0.08]` - Trasparenza sottile
- `backdrop-blur-3xl` - Blur intenso dello sfondo
- `shadow-liquid-sm` - Shadow personalizzata (vedi sotto)
- `ring-1 ring-white/20 ring-inset` - Bordo sottile interno
- `before:bg-gradient-to-br` - Gradient overlay per effetto vetro

### Shadow Variants

Definite in `tailwind.config.js`:

- **`shadow-liquid-sm`**: Piccoli elementi (buttons, input)
  - `0 2px 8px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)`

- **`shadow-liquid`**: Elementi medi (cards, dropdowns)
  - `0 4px 16px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.06)`

- **`shadow-liquid-lg`**: Elementi grandi (modals, panels)
  - `0 8px 32px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.08)`

- **`shadow-liquid-xl`**: Hero sections
  - `0 16px 64px rgba(0,0,0,0.16), 0 8px 16px rgba(0,0,0,0.12)`

### Z-index Layers

Pattern per gestione layer con gradient overlay:

```jsx
<div className="relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/10 before:to-transparent before:pointer-events-none">
  {/* Contenuto con relative z-10 per stare sopra gradient */}
  <div className="relative z-10">
    Content here
  </div>
</div>
```

**Regola**: Contenuto deve avere `relative z-10` per apparire sopra gradient overlay.

### Quando Usare

Applicare liquid glass a:
- ✅ Tutti i componenti interattivi (buttons, inputs, dropdowns)
- ✅ Cards e containers principali
- ✅ Mobile menu e overlay
- ✅ Modals e panels

**Obiettivo**: Consistenza visiva iOS 18 style in tutta l'app.

## Navbar

Navbar responsive con architettura stati separati mobile/desktop.

**Architettura**: Stati separati mobile/desktop per zero interferenze
- **Desktop** (≥1024px): Links orizzontali + dropdown device + dropdown utente
- **Mobile** (< 1024px): Hamburger button + fixed overlay menu

### Pattern Mobile Menu

```jsx
// State management
const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

// Body scroll lock
useEffect(() => {
  if (mobileMenuOpen) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = 'unset';
  }
  return () => { document.body.style.overflow = 'unset'; };
}, [mobileMenuOpen]);

// Auto-close on route change
useEffect(() => {
  setMobileMenuOpen(false);
}, [pathname]);

// ESC key handler
useEffect(() => {
  const handleEsc = (e) => {
    if (e.key === 'Escape') setMobileMenuOpen(false);
  };
  window.addEventListener('keydown', handleEsc);
  return () => window.removeEventListener('keydown', handleEsc);
}, []);
```

**Struttura**:
- Fixed overlay: backdrop (`z-[100]`) + menu panel (`z-[101]`) sotto navbar (`z-50`)
- Backdrop position: `fixed top-[navbar-height]` per mantenere header visibile
- Click fuori → chiude menu (backdrop onClick)
- Body scroll lock quando menu aperto
- Auto-chiusura: route change + ESC key

### Pattern Dropdown Desktop

```jsx
// State + ref
const [isOpen, setIsOpen] = useState(false);
const dropdownRef = useRef(null);

// Click outside detection
useEffect(() => {
  const handleClickOutside = (e) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
      setIsOpen(false);
    }
  };
  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, []);

// ESC key handler
useEffect(() => {
  const handleEsc = (e) => {
    if (e.key === 'Escape') setIsOpen(false);
  };
  window.addEventListener('keydown', handleEsc);
  return () => window.removeEventListener('keydown', handleEsc);
}, []);

// Auto-close on route change
useEffect(() => {
  setIsOpen(false);
}, [pathname]);
```

**Chiusura**: click outside + ESC key + route change
**Z-index**: `z-[100]` per dropdown sopra altri elementi

**Implementazione completa**: `app/components/Navbar.js:89-145`

## Badge Pulsante con Animazione

Pattern per badge notifica con glow effect.

```jsx
{/* Badge container */}
<div className="relative">
  {/* Main button */}
  <Button>Errori</Button>

  {/* Badge */}
  {hasError && (
    <div className="absolute -top-2 -right-2">
      {/* Blur layer for glow */}
      <div className="absolute inset-0 bg-danger-500 rounded-full blur-sm animate-pulse" />
      {/* Solid layer */}
      <div className="relative bg-danger-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
        !
      </div>
    </div>
  )}
</div>
```

**Pattern**:
- Doppio layer (blur + solid) per glow effect
- `animate-pulse` per attirare attenzione
- Positioning `absolute -top-2 -right-2`

**Implementazione esempio**: `app/page.js:180-195` (badge errore stufa)

## Responsive Breakpoints Strategy

```jsx
// Mobile: < 768px
<div className="md:hidden">Mobile only</div>

// Tablet/Intermediate: 768px-1024px
<div className="hidden md:flex lg:hidden">Tablet only</div>

// Desktop Small: 1024px-1280px
<div className="hidden lg:flex xl:hidden">Desktop small</div>

// Desktop Large: > 1280px
<div className="hidden xl:flex">Desktop large</div>
```

**Breakpoints**:
- **Mobile**: < 768px (`md:hidden`)
- **Tablet/Intermediate**: 768px-1024px (`md:flex`)
- **Desktop Small**: 1024px-1280px (`lg:`)
- **Desktop Large**: > 1280px (`xl:`)

**Best Practice**:
- Text truncation responsive: `max-w-[80px] xl:max-w-[120px]`
- Dropdown/collapse elementi non-critici su mobile

## Componenti con Varianti Multiple

Pattern per componenti con layout/stile diversi.

```jsx
// Esempio: CronHealthBanner
<CronHealthBanner variant="banner" />  // Default: standalone banner
<CronHealthBanner variant="inline" />  // Integrato in card esistente
```

**Pattern**:
- Usa prop `variant` per layout/stile diversi
- Default variant sempre standalone
- Varianti aggiuntive per integrazioni (inline, compact, minimal)

**Esempi**:
- `CronHealthBanner` - banner/inline
- `Banner` - info/warning/error/success

## See Also

- [Design System](./design-system.md) - Palette colori, styling hierarchy
- [Patterns](./patterns.md) - Pattern riutilizzabili (modal, collapse, etc.)
- [Architecture](./architecture.md) - Device cards pattern

---

**Last Updated**: 2025-10-21
