# Navigation Components

Componenti riutilizzabili per dropdown menu e navigazione mobile con design **liquid glass iOS 18** uniforme.

## 📦 Componenti

### Desktop Dropdown Components

#### `DropdownContainer`
Container principale per i dropdown menu desktop.

```jsx
<DropdownContainer className="w-64" align="left">
  {/* Children here */}
</DropdownContainer>
```

**Props:**
- `children` - Contenuto del dropdown
- `className` - Classi CSS aggiuntive (es. larghezza)
- `align` - Allineamento (`'left'` | `'right'`)

---

#### `DropdownItem`
Item singolo del dropdown con hover effects e animazioni.

```jsx
<DropdownItem
  href="/path"
  icon={<Home />}
  label="Home"
  description="Optional description"
  isActive={false}
  onClick={() => {}}
  animationDelay={40}
/>
```

**Props:**
- `href` - URL di destinazione
- `icon` - Icona (componente React o emoji)
- `label` - Testo principale
- `description` - Testo secondario (opzionale)
- `isActive` - Stato attivo
- `onClick` - Callback click
- `animationDelay` - Delay animazione ingresso (ms)

---

#### `DropdownInfoCard`
Card informativa per dropdown utente.

```jsx
<DropdownInfoCard
  title="Connesso come"
  subtitle="John Doe"
  details="john@example.com"
/>
```

**Props:**
- `title` - Titolo superiore
- `subtitle` - Testo principale
- `details` - Dettagli aggiuntivi (opzionale)

---

### Mobile Menu Components

#### `MenuSection`
Sezione con header per menu mobile.

```jsx
<MenuSection
  icon="🔥"
  title="Stufa"
  hasBorder={false}
>
  {/* MenuItem components */}
</MenuSection>
```

**Props:**
- `icon` - Icona della sezione
- `title` - Titolo sezione (se vuoto, nasconde header)
- `children` - Contenuto della sezione
- `hasBorder` - Bordo superiore separatore
- `className` - Classi CSS aggiuntive

---

#### `MenuItem`
Item singolo del menu mobile con effetti.

```jsx
<MenuItem
  href="/path"
  icon={<Home />}
  label="Home"
  isActive={false}
  onClick={() => {}}
  animationDelay={50}
  variant="default"
/>
```

**Props:**
- `href` - URL di destinazione
- `icon` - Icona (componente React o emoji)
- `label` - Testo dell'item
- `isActive` - Stato attivo
- `onClick` - Callback click
- `animationDelay` - Delay animazione ingresso (ms)
- `variant` - Stile (`'default'` | `'prominent'`)

**Variants:**
- `default` - Stile standard neutro
- `prominent` - Gradiente rosso per azioni primarie (es. Logout)

---

#### `UserInfoCard`
Card utente per menu mobile.

```jsx
<UserInfoCard
  icon={User}
  name="Jane Doe"
  email="jane@example.com"
/>
```

**Props:**
- `icon` - Componente icona Lucide
- `name` - Nome utente
- `email` - Email (opzionale)

---

## 🎨 Design System

### Liquid Glass iOS 18 Style

Tutti i componenti seguono il design system liquid glass:

**Background:**
- Light: `bg-white/[0.92]`
- Dark: `bg-neutral-900/[0.95]`
- Backdrop blur: `80px`

**Borders:**
- Light: `border-white/30`
- Dark: `border-white/15`
- Ring: `ring-white/20 dark:ring-white/10`

**Shadows:**
- Container: `shadow-liquid-xl`
- Item: `shadow-liquid-sm`

**Hover States:**
- Background: `hover:bg-neutral-100/80 dark:hover:bg-neutral-800/80`
- Scale: `hover:scale-[1.02]`
- Shine effect: Gradiente animato orizzontale

**Active States:**
- Background: `bg-primary-500/20 dark:bg-primary-500/30`
- Text: `text-primary-700 dark:text-primary-300`

---

## 🚀 Utilizzo

### Esempio Desktop Dropdown

```jsx
import { DropdownContainer, DropdownItem, DropdownInfoCard } from '@/app/components/navigation';

// Device dropdown
<DropdownContainer className="w-64" align="left">
  {items.map((item, idx) => (
    <DropdownItem
      key={item.id}
      href={item.route}
      icon={item.icon}
      label={item.label}
      isActive={isActive(item.route)}
      onClick={handleClose}
      animationDelay={idx * 40}
    />
  ))}
</DropdownContainer>

// User dropdown
<DropdownContainer className="w-72" align="right">
  <DropdownInfoCard
    title="Connesso come"
    subtitle={user.name}
    details={user.email}
  />
  <DropdownItem
    href="/auth/logout"
    icon={<LogOut />}
    label="Logout"
    onClick={handleClose}
  />
</DropdownContainer>
```

### Esempio Mobile Menu

```jsx
import { MenuSection, MenuItem, UserInfoCard } from '@/app/components/navigation';

// User card
<UserInfoCard
  icon={User}
  name={user.name}
  email={user.email}
/>

// Device section
<MenuSection icon="🔥" title="Stufa">
  {items.map((item, idx) => (
    <MenuItem
      key={item.id}
      href={item.route}
      icon={item.icon}
      label={item.label}
      isActive={isActive(item.route)}
      onClick={handleClose}
      animationDelay={idx * 50}
    />
  ))}
</MenuSection>

// Prominent action
<MenuSection title="" hasBorder={true}>
  <MenuItem
    href="/auth/logout"
    icon={<LogOut />}
    label="Logout"
    variant="prominent"
    onClick={handleClose}
  />
</MenuSection>
```

---

## 🧪 Testing

I componenti sono testati con Jest e React Testing Library:

```bash
npm test -- navigation/__tests__/DropdownComponents.test.js
```

---

## 📝 Best Practices

1. **Animazione stagger**: Usa `animationDelay` incrementale (40-50ms) per effetti sequenziali
2. **Allineamento dropdown**: Desktop left per device, right per settings/user
3. **Variant prominent**: Solo per azioni critiche (logout, submit, delete)
4. **Border sections**: Usa `hasBorder={true}` per separare logicamente le sezioni
5. **Icone consistenti**: Usa Lucide React o emoji, non mescolare stili

---

## 🎯 Accessibility

- ✅ Keyboard navigation supportata (tab, enter)
- ✅ Focus visible con ring
- ✅ ARIA labels per dropdown button
- ✅ Semantic HTML (nav, section)
- ✅ Hover shine senza interferire con screen readers (`pointer-events-none`)

---

**Versione**: 1.0.0
**Ultimo aggiornamento**: 2026-01-13
