# Common Patterns

Pattern riutilizzabili per componenti e features comuni.

## Dropdown/Modal Pattern

Pattern base per dropdown, modal, overlay con gestione completa eventi.

### Pattern Base

```javascript
'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export default function DropdownExample() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const pathname = usePathname();

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

  return (
    <div ref={dropdownRef} className="relative">
      <button onClick={() => setIsOpen(!isOpen)}>
        Toggle
      </button>

      {isOpen && (
        <div className="absolute z-[100] ...">
          {/* Dropdown content */}
        </div>
      )}
    </div>
  );
}
```

**Features**:
- ✅ Click outside → chiude
- ✅ ESC key → chiude
- ✅ Route change → chiude
- ✅ Ref-based outside detection

**Implementazione completa**: `app/components/Navbar.js:89-145`

## Confirmation Modal Pattern

Modal conferma con backdrop, warning box, loading state.

### Pattern Base

```jsx
const [showModal, setShowModal] = useState(false);
const [isSubmitting, setIsSubmitting] = useState(false);

const handleConfirm = async () => {
  setIsSubmitting(true);
  try {
    // Async operation
    await performAction();
    setShowModal(false);
  } catch (error) {
    console.error(error);
  } finally {
    setIsSubmitting(false);
  }
};

return (
  <>
    <Button onClick={() => setShowModal(true)}>
      Azione
    </Button>

    {showModal && (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 z-[10000]"
          onClick={() => !isSubmitting && setShowModal(false)}
        />

        {/* Modal */}
        <div className="fixed inset-0 flex items-center justify-center z-[10001] p-4">
          <Card liquid className="w-full max-w-md p-6 space-y-4">
            <h3 className="text-xl font-bold">Conferma Azione</h3>

            {/* Warning box */}
            <div className="bg-warning-50 border-2 border-warning-200 rounded-lg p-4">
              <p className="text-sm text-warning-800">
                ⚠️ Questa azione non può essere annullata.
              </p>
            </div>

            <p className="text-neutral-700">
              Sei sicuro di voler procedere?
            </p>

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <Button
                liquid
                variant="secondary"
                onClick={() => setShowModal(false)}
                disabled={isSubmitting}
              >
                Annulla
              </Button>
              <Button
                liquid
                variant="danger"
                onClick={handleConfirm}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Attendere...' : 'Conferma'}
              </Button>
            </div>
          </Card>
        </div>
      </>
    )}
  </>
);
```

**Features**:
- ✅ Fixed backdrop z-[10000]
- ✅ Modal z-[10001] (sopra backdrop)
- ✅ Click backdrop → chiude (disabled durante submit)
- ✅ Warning box per azioni distruttive
- ✅ Loading state durante async operation
- ✅ Liquid glass style

**Implementazione esempio**: `app/maintenance/page.js:120-165`

## Collapse/Expand with localStorage

Pattern per componenti collapse/expand con persistenza preferenze utente.

### Pattern Base

```javascript
'use client';

import { useState, useEffect } from 'react';
import styles from './Component.module.css';

export default function CollapsibleComponent() {
  const [isExpanded, setIsExpanded] = useState(false);

  // Load saved state or auto-expand logic
  useEffect(() => {
    const savedState = localStorage.getItem('componentExpanded');

    if (savedState === 'true') {
      setIsExpanded(true);
    } else if (savedState === 'false') {
      setIsExpanded(false);
    } else if (/* auto-expand condition */) {
      // Auto-expand ONLY first time
      setIsExpanded(true);
    }
  }, [/* dependencies */]);

  const handleToggle = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    localStorage.setItem('componentExpanded', newState);
  };

  return (
    <div>
      <button onClick={handleToggle}>
        {isExpanded ? '▼' : '▶'} Toggle
      </button>

      <div className={isExpanded ? styles.expanded : styles.collapsed}>
        {/* Collapsible content */}
      </div>
    </div>
  );
}
```

**CSS Modules** (`Component.module.css`):
```css
.collapsed {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  transition: max-height 0.3s ease, opacity 0.3s ease;
}

.expanded {
  max-height: 500px; /* Adjust to content */
  opacity: 1;
  transition: max-height 0.3s ease, opacity 0.3s ease;
}
```

**Priority Logic**:
1. localStorage `'true'` → Expand
2. localStorage `'false'` → Collapse
3. localStorage `null` + condition → Auto-expand prima volta
4. Default → Collapse

**Implementazione esempio**: `app/components/MaintenanceBar.js:89-120`

## Firebase Realtime Listeners

Pattern per Firebase realtime listeners con cleanup.

### Pattern Base

```javascript
'use client';

import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';

export default function RealtimeComponent() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const dataRef = ref(db, 'path/to/data');

    // Setup listener
    const unsubscribe = onValue(dataRef, (snapshot) => {
      if (snapshot.exists()) {
        setData(snapshot.val());
      } else {
        setData(null);
      }
    });

    // Cleanup listener
    return () => unsubscribe();
  }, []);

  return (
    <div>
      {data ? JSON.stringify(data) : 'Loading...'}
    </div>
  );
}
```

**CRITICO**: Sempre cleanup listener (`return () => unsubscribe()`) per evitare memory leaks.

**Implementazione esempio**: `app/components/CronHealthBanner.js:25-45`

## Polling Pattern

Pattern per polling periodico con cleanup.

### Pattern Base

```javascript
'use client';

import { useState, useEffect } from 'react';

export default function PollingComponent() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch('/api/endpoint');
      const json = await res.json();
      setData(json);
    };

    // Initial fetch
    fetchData();

    // Setup polling
    const interval = setInterval(fetchData, 5000); // 5s

    // Cleanup
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      {data ? JSON.stringify(data) : 'Loading...'}
    </div>
  );
}
```

**Best Practices**:
- ✅ Initial fetch immediato (prima del primo interval)
- ✅ Cleanup interval in return
- ✅ Frequency ragionevole (5s per status, 30s per health check)

**Implementazione esempio**: `app/components/devices/stove/StoveCard.js`

## Form Validation Pattern

Pattern per validazione form con error states.

### Pattern Base

```javascript
'use client';

import { useState } from 'react';
import Input from './ui/Input';
import Button from './ui/Button';

export default function FormComponent() {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!value || value <= 0) {
      setError('Valore non valido');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/endpoint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      });

      if (!res.ok) {
        throw new Error('API error');
      }

      // Success
      setValue('');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        liquid
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Inserisci valore"
      />

      {error && (
        <p className="text-sm text-danger-600">
          {error}
        </p>
      )}

      <Button
        liquid
        type="submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Salvando...' : 'Salva'}
      </Button>
    </form>
  );
}
```

**Features**:
- ✅ Controlled input
- ✅ Client-side validation
- ✅ Error state display
- ✅ Loading state durante submit
- ✅ Disabled button durante submit

## Responsive Grid Pattern

Pattern per layout grid responsive.

### 2-Column Grid

```jsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
  <Card liquid>Column 1</Card>
  <Card liquid>Column 2</Card>
</div>
```

**Breakpoints**:
- Mobile (< 1024px): 1 colonna
- Desktop (≥ 1024px): 2 colonne
- Gap: 24px mobile, 32px desktop

### Auto-Fit Grid

```jsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {items.map(item => (
    <Card key={item.id} liquid>
      {item.name}
    </Card>
  ))}
</div>
```

**Breakpoints**:
- Mobile: 1 col
- Tablet (≥ 640px): 2 col
- Desktop (≥ 1024px): 3 col
- Large (≥ 1280px): 4 col

## See Also

- [UI Components](./ui-components.md) - Componenti base riutilizzabili
- [Firebase](./firebase.md) - Firebase operations patterns
- [Testing](./testing.md) - Testing patterns

---

**Last Updated**: 2025-10-21
