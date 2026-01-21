# Patterns

Pattern app-specifici. Per pattern generici vedi i componenti in [ui-components.md](./ui-components.md).

---

## Immediate Feedback UX

Triplo feedback: **preventivo → azione → conferma**.

```jsx
const [toast, setToast] = useState(null);

const handleAction = async () => {
  const response = await fetch('/api/action', { method: 'POST' });
  const data = await response.json();

  if (data.stateChanged) {
    setMode(data.newMode);  // Update immediato (no polling wait)
    setToast({ message: 'Stato cambiato', variant: 'success' });
    setTimeout(() => fetchLatestState(), 500);  // Verify backend
  }
};

return (
  <>
    {/* 1. PREVENTIVO */}
    {isAuto && <div className="bg-info-50">Questa azione cambierà modalità</div>}

    {/* 2. AZIONE */}
    <button onClick={handleAction}>Esegui</button>

    {/* 3. CONFERMA */}
    {toast && <Toast {...toast} onDismiss={() => setToast(null)} />}
  </>
);
```

---

## Skeleton UI Alignment

**Quando modifichi UI, aggiorna SEMPRE il Skeleton corrispondente.**

```jsx
// ❌ Anti-pattern: Skeleton non allineato
<StoveCard><NewLayout /></StoveCard>
<Skeleton.StovePanel /> // Vecchio layout

// ✅ Correct
<StoveCard>
  <div className="grid grid-cols-2 gap-4">...</div>
</StoveCard>
<Skeleton.StovePanel>
  <div className="grid grid-cols-2 gap-4">  // STESSO layout
    <Skeleton className="h-8" />
  </div>
</Skeleton.StovePanel>
```

**Checklist**: struttura HTML, layout classes, dimensioni, z-index, margin negativi.

---

## API Wrapper Functions

Intercetta chiamate per sandbox/mock/caching:

```javascript
export async function getSomeData() {
  if (shouldUseMock()) {
    const mock = await getMockData();
    return { ...mock, isMock: true };
  }
  const res = await fetch('/api/real');
  return { ...(await res.json()), isMock: false };
}
```

**Best practices**:
- Flag `isMock: true` per identificare source
- Wrapper per TUTTI gli endpoint correlati
- Formato response consistente

---

## Environment Detection

Feature solo in localhost:

```javascript
export function isLocalEnvironment() {
  if (typeof window === 'undefined') {
    return process.env.NODE_ENV === 'development';
  }
  return window.location.hostname === 'localhost' ||
         window.location.hostname === '127.0.0.1';
}
```

Guards a tutti i livelli: UI, service, API route.

---

## Firebase Listeners

```javascript
useEffect(() => {
  const unsubscribe = onValue(ref(db, 'path'), (snapshot) => {
    setData(snapshot.val());
  });
  return () => unsubscribe();  // CRITICO: sempre cleanup
}, []);
```

**Multi-listener**: Dichiara `unsubscribe1/2` come null, verifica prima di cleanup.

---

## Dropdown/Modal

```javascript
const [isOpen, setIsOpen] = useState(false);
const dropdownRef = useRef(null);
const pathname = usePathname();

// Click outside
useEffect(() => {
  const handle = (e) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
  };
  document.addEventListener('mousedown', handle);
  return () => document.removeEventListener('mousedown', handle);
}, []);

// ESC key
useEffect(() => {
  const handle = (e) => e.key === 'Escape' && setIsOpen(false);
  window.addEventListener('keydown', handle);
  return () => window.removeEventListener('keydown', handle);
}, []);

// Route change
useEffect(() => setIsOpen(false), [pathname]);
```

---

## Middleware Configuration

```javascript
// middleware.js
import { auth0 } from '@/lib/auth0';
export default auth0.middleware();

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png|offline|manifest.json|icons/|sw.js|firebase-messaging-sw.js|auth/*).*)',
  ],
};
```

**Escludi sempre**: auth routes, PWA assets, service workers.

---

## Polling

```javascript
useEffect(() => {
  const fetch = async () => { /* ... */ };
  fetch();  // Initial
  const interval = setInterval(fetch, 5000);
  return () => clearInterval(interval);
}, []);
```

---

## Format Conversion

```javascript
export function convertAToB(dataA) {
  return {
    fieldB1: dataA.fieldA1,
    fieldB2: dataA.fieldA2 || 'default',  // Defaults espliciti
  };
}
```

---

## See Also

- [UI Components](./ui-components.md) - Component patterns
- [Firebase](./firebase.md) - Database patterns
