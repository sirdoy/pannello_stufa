# Modal Component - Base UI

**Component**: `app/components/ui/Modal.js`
**Version**: 1.35.0
**Status**: ✅ Production Ready

## Overview

Componente base riutilizzabile per **tutti i modali** dell'applicazione. Centralizza la logica comune per evitare duplicazione di codice e garantire comportamento consistente.

## Features

✅ **React Portal** - Renderizza al livello `document.body`, evita problemi con z-index/position
✅ **Scroll Lock** - Blocca scroll della pagina quando il modal è aperto, con ripristino posizione
✅ **Centratura Automatica** - Sempre centrato verticalmente e orizzontalmente
✅ **Backdrop Overlay** - Sfondo blur con click-to-close configurabile
✅ **Escape Key** - Chiude con tasto Escape (configurabile)
✅ **Max Height Responsive** - `max-h-[90vh]` con scroll interno se necessario
✅ **Smooth Animations** - Animazioni fade-in/scale-in integrate
✅ **Accessibilità** - ARIA roles e attributes corretti

---

## Usage

### Basic Example

```jsx
import Modal from '@/app/components/ui/Modal';
import Card from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';

function MyModal({ isOpen, onClose }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Card liquid className="p-6">
        <h2>My Modal Title</h2>
        <p>Modal content here...</p>
        <Button onClick={onClose}>Close</Button>
      </Card>
    </Modal>
  );
}
```

### With Custom Width

```jsx
<Modal
  isOpen={isOpen}
  onClose={onClose}
  maxWidth="max-w-4xl" // Default: max-w-2xl
>
  <Card liquid className="p-8">
    {/* Wide modal content */}
  </Card>
</Modal>
```

### Prevent Close on Overlay Click

```jsx
<Modal
  isOpen={isOpen}
  onClose={onClose}
  closeOnOverlayClick={false} // Requires explicit button click
>
  <Card liquid className="p-6">
    {/* Critical content - must use button to close */}
  </Card>
</Modal>
```

### Custom Escape Key Handler

```jsx
function MyComplexModal({ isOpen, onClose }) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      closeOnEscape={false} // Disable default
    >
      <Card liquid className="p-6">
        {/* Handle Escape manually */}
        {isEditing && <EditMode onEscape={() => setIsEditing(false)} />}
      </Card>
    </Modal>
  );
}
```

---

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | `boolean` | **required** | Modal open state |
| `onClose` | `function` | **required** | Callback to close modal |
| `children` | `ReactNode` | **required** | Modal content (usually a Card) |
| `maxWidth` | `string` | `'max-w-2xl'` | Tailwind max-width class |
| `closeOnOverlayClick` | `boolean` | `true` | Close when clicking backdrop |
| `closeOnEscape` | `boolean` | `true` | Close on Escape key |
| `className` | `string` | `''` | Additional classes for modal container |

---

## Implementation Details

### Scroll Lock Mechanism

```javascript
// Salva posizione scroll corrente
const scrollY = window.scrollY;
document.body.classList.add('modal-open'); // CSS: position: fixed
document.body.style.top = `-${scrollY}px`;

// Al close, ripristina posizione
window.scrollTo(0, parseInt(scrollY) * -1);
```

**CSS (globals.css)**:
```css
body.modal-open {
  overflow: hidden !important;
  position: fixed !important;
  width: 100% !important;
  height: 100% !important;
}
```

### Portal Structure

```jsx
createPortal(
  <>
    <div className="overlay" /> {/* Backdrop */}
    <div className="container"> {/* Centering */}
      <div className="content"> {/* Your children */}
        {children}
      </div>
    </div>
  </>,
  document.body
)
```

---

## Examples from Codebase

### ✅ ScheduleManagementModal

```jsx
import Modal from '../ui/Modal';

export default function ScheduleManagementModal({ isOpen, onClose, schedules }) {
  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        maxWidth="max-w-2xl"
        closeOnEscape={false} // Custom escape handler
      >
        <Card liquid className="animate-scale-in-center p-6">
          {/* Modal content */}
        </Card>
      </Modal>

      {/* Nested modal example */}
      <ConfirmDialog isOpen={confirmDelete.isOpen} ... />
    </>
  );
}
```

### ✅ CreateScheduleModal

```jsx
import Modal from '../ui/Modal';

export default function CreateScheduleModal({ isOpen, onCancel }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      maxWidth="max-w-lg" // Smaller modal
    >
      <Card liquid className="animate-scale-in-center p-6">
        {/* Form content */}
      </Card>
    </Modal>
  );
}
```

---

## Best Practices

### ✅ DO

- Always wrap content in a `<Card>` component for consistent styling
- Add `animate-scale-in-center` class to Card for smooth entrance
- Use `max-w-lg` for small modals (forms), `max-w-2xl` for medium, `max-w-4xl` for large
- Provide clear close button inside modal content
- Use `closeOnEscape={false}` when you have custom Escape handling

### ❌ DON'T

- Don't add scroll lock manually - Modal handles it
- Don't use `createPortal` manually - Modal handles it
- Don't create custom overlay/backdrop - Modal provides it
- Don't add z-index styles - Modal uses correct z-50
- Don't forget to handle `onClose` callback

---

## Migration Guide

### Old Pattern (Manual Portal + Scroll Lock)

```jsx
// ❌ OLD - Don't do this anymore
import { createPortal } from 'react-dom';

function OldModal({ isOpen, onClose }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const content = (
    <>
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center">
        <Card>{/* content */}</Card>
      </div>
    </>
  );

  return createPortal(content, document.body);
}
```

### New Pattern (Modal Component)

```jsx
// ✅ NEW - Use Modal component
import Modal from '@/app/components/ui/Modal';

function NewModal({ isOpen, onClose }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Card>{/* content */}</Card>
    </Modal>
  );
}
```

**Benefits**: -50 lines of code, no duplicazione, comportamento garantito

---

## Troubleshooting

### Modal non si centra correttamente

**Problema**: Parent component ha `transform`, `filter` o `position: fixed`
**Soluzione**: ✅ Modal usa `createPortal` quindi è immune a questo problema

### Scroll della pagina non bloccato

**Problema**: Classe `modal-open` non applicata al body
**Soluzione**: Verifica che `isOpen` prop sia passato correttamente

### Escape key non funziona

**Problema**: `closeOnEscape={false}` impostato
**Soluzione**: Rimuovi prop o implementa custom handler

### Modal non si chiude cliccando overlay

**Problema**: `closeOnOverlayClick={false}` impostato
**Soluzione**: Rimuovi prop o aggiungi bottone Close esplicito

---

## Related Components

- `Card` - Wrapper UI per modal content ([docs/ui-components.md](ui-components.md))
- `Button` - Bottoni per close/confirm ([docs/ui-components.md](ui-components.md))
- `ConfirmDialog` - Modal di conferma specializzato (potrebbe usare Modal internamente)

---

## Changelog

**v1.35.0** (2026-01-02)
- ✨ Created base Modal component
- ♻️ Refactored ScheduleManagementModal to use Modal
- ♻️ Refactored CreateScheduleModal to use Modal
- 📝 Added comprehensive documentation

---

**For questions or issues, refer to**: [docs/patterns.md](patterns.md), [docs/ui-components.md](ui-components.md)
