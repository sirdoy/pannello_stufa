---
phase: 170
slug: auth-ui
status: draft
shadcn_initialized: false
preset: none
created: 2026-04-23
---

# Phase 170 — UI Design Contract

> Visual and interaction contract for the Auth UI phase (login form + API-keys management page). Phase 170 is pattern-replay, not pattern-invention: all UI primitives already exist in `app/components/ui/*`, and the Registry CRUD pattern (phases 118-125, see `app/registry/types/page.tsx`) is the canonical reference for `/settings/api-keys`. This spec focuses on the TWO genuinely new surfaces — the single-column login form and the plaintext-key reveal view — and declares authoritative defaults for everything else.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (no shadcn — project ships a bespoke `Ember Noir` component library) |
| Preset | not applicable |
| Component library | Radix primitives (Label, Dialog, VisuallyHidden) wrapped by bespoke components in `app/components/ui/` — discoverable at `/debug/design-system` |
| Icon library | `lucide-react@0.562.0` (already in `package.json`). New icons used this phase: `KeyRound` (navbar), `Copy`, `Check`, `AlertTriangle` (reveal modal), `LogIn` (login submit, optional) |
| Font | `font-display` (custom Next.js `next/font` loader — see `app/fonts.ts`). Applied globally via `body` className |
| Theme | Ember Noir — dark-first, no light mode. `bg-slate-900` foundation, ember/flame warm accents. Rule #6 in CLAUDE.md: use design system. Rule from v18.0 milestone: dark-only + mobile-first |

---

## Spacing Scale

Declared values (all multiples of 4 — matches Tailwind defaults the project already uses):

| Token | Value | Usage in this phase |
|-------|-------|---------------------|
| xs | 4px (`gap-1`, `mt-1`) | Inline error icon gap, character-count baseline offset |
| sm | 8px (`gap-2`, `p-2`, `mt-2`) | Compact button gaps in modal footer; reveal view button stack gap |
| md | 16px (`gap-4`, `p-4`, `space-y-4`) | FormModal fieldset vertical rhythm (fixed by `FormModal.tsx:331`); default Input-to-Input spacing in login form |
| lg | 24px (`p-6`, `space-y-6`) | `SettingsLayout` inner `space-y-6` content gap; Card padding `sm:p-6` |
| xl | 32px (`p-8`) | `SettingsLayout` root `lg:p-8` on large viewports |
| 2xl | 48px | Not used this phase |
| 3xl | 64px | Not used this phase |

Touch targets: all interactive elements inherit `Button`'s size scale — `sm=44px`, `md=48px`, `lg=56px` (see `Button.tsx:105-107`). iOS 44px minimum is already baked in.

Login-page-specific exception: the vertical stack uses `space-y-4` (16px) between Input and Input, `space-y-6` (24px) between the Input-group and the submit Button, and `space-y-2` (8px) between the page Heading and the introductory Text copy. No new values introduced.

---

## Typography

Project already has 6 heading sizes + 4 text sizes via `Heading` and `Text` variants (see `app/components/ui/Heading.tsx:15-47`). Phase 170 uses only the subset below — no new sizes introduced.

| Role | Component + props | Effective size | Weight | Line height |
|------|-------------------|----------------|--------|-------------|
| Page title (h1) | `<Heading level={1}>` | 30px mobile / 36px sm+ (`text-3xl sm:text-4xl`) | 700 (`font-bold`) | Tailwind default `~1.2` |
| Section / card title (h2) | `<Heading level={2} size="lg">` | 18px (`text-lg`) | 700 | ~1.4 |
| Body | `<Text>` or plain `<p>` with `text-sm text-slate-300` | 14px | 500 (`font-medium` via Input base, 400 otherwise) | 1.5 (Tailwind default for `text-sm`) |
| Label | `<Input label="...">` — uses Radix Label under the hood | 14px (`text-sm font-semibold`) | 600 (`font-semibold` — fixed by `Input.tsx:180`) | 1.25 |
| Inline error | `<span>` inside Input error slot | 14px (`text-sm text-danger-500`) | 400 | 1.25 |
| Code / API key plaintext | `<code>` with `font-mono break-all` | 14px (`text-sm`) | 400 | 1.5 |

Weights in use: **2 total** — `400` (regular — code, error text) and `600/700` (semibold labels + bold headings). This matches the project-wide convention; no third weight introduced.

Heading hierarchy in this phase:
- `/login` page: one `h1` ("Accedi"), no subheadings
- `/settings/api-keys` page: one `h1` ("API Keys" — via SettingsLayout), one `h2` ("Chiavi attive" — above DataTable), and one `h2` inside modals (modal title, rendered by `Modal.Title`)

---

## Color

Ember Noir palette is locked. 60/30/10 split below reflects what the user actually sees on the two new pages.

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `slate-900` `#1c1917` with `bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800` | Full-page background on both `/login` and `/settings/api-keys` (applied by `SettingsLayout` root div) |
| Secondary (30%) | `slate-900/80` + `bg-white/[0.04]` glass surfaces | Card containers (`Card variant="glass"`), DataTable rows, FormModal content, Input background (`slate-800/60`) |
| Accent (10%) | `ember-500` `#ed6f10` (+ `flame-600` gradient partner) | Primary CTA only — `Button variant="ember"`: "Accedi" (login submit), "Crea nuova API key", "Copia chiave" (reveal modal), focus rings on inputs |
| Destructive | `danger-500` `#ef4444` | `Button variant="danger"` on "Revoca" action column + `ConfirmationDialog variant="danger"` for revoke confirm + error Banner border/text + reveal-modal warning banner border |

### Accent reserved for (explicit, no "all interactive elements")

1. **Primary submit button** on `/login` — the "Accedi" button (`variant="ember"`).
2. **Primary create button** on `/settings/api-keys` — the "Crea nuova API key" button inside the Card header (`variant="ember"`, `size="sm"`).
3. **Copy button** in the plaintext-key reveal view (`variant="ember"`).
4. **Active navbar entry** for "API Keys" when `/settings/api-keys` is the current route (uses existing `navItemActive` class at `Navbar.tsx:201-208`: `bg-ember-500/15 text-ember-400 shadow-ember-glow-sm`). No new ember usage in the navbar — mirrors existing Registro/Stanze behavior.
5. **Input focus rings** (`focus-visible:ring-ember-500/50 focus-visible:border-ember-500/60` — fixed by `Input.tsx:35`).

Ember is **NOT** used for: card backgrounds, DataTable row hover, the "Attiva" status badge on API keys (that uses `ocean` — see badges below), secondary actions (Annulla → `subtle`; Chiudi on reveal → `subtle`), or the ghost back button in `SettingsLayout`.

### Secondary semantic colors

| Purpose | Token | Where |
|---------|-------|-------|
| Revoked state | `neutral` (Badge variant) → slate-500 text + slate-700 border | `is_active === false` row: `<Badge variant="neutral" size="sm">Revocata</Badge>` |
| Active state | `ocean` (Badge variant) → ocean-300 text + ocean-500/40 border | `is_active === true` row: `<Badge variant="ocean" size="sm">Attiva</Badge>` |
| Rate-limit toast | `warning` (Banner/Toast variant) → warning-300/warning-500/25 | 429 response on login |
| Session-expired inline banner | `warning` (Banner) | Cookie expiry detected mid-session on `/settings/api-keys` (D-04) |
| Success toast | `sage` (Toast variant) → sage-300/sage-500/25 | "API key revocata", "API key creata" |

---

## Copywriting Contract

All user-visible copy is Italian (matches Registro / Stanze / Automations per D-09, D-11). English strings only appear in `<code>` or non-translated identifier fields (key `id`, key value itself).

### Global page copy

| Element | Copy |
|---------|------|
| `/login` page title (h1) | `Accedi` |
| `/login` subtitle (body) | `Inserisci le tue credenziali per gestire le API key.` |
| `/settings/api-keys` page title (via SettingsLayout prop) | `API Keys` |
| `/settings/api-keys` subtitle (body) | `Gestisci le chiavi per accedere alle API.` |
| `/settings/api-keys` section heading above table | `Chiavi attive` |
| Navbar entry | `API Keys` |

### Primary CTAs

| Context | Copy | Button variant |
|---------|------|----------------|
| Login submit | `Accedi` | `ember` |
| Empty-state CTA + create launcher | `Crea nuova API key` | `ember` size=`sm` |
| FormModal create submit (inside modal footer) | `Crea` | `ember` (FormModal default) |
| FormModal cancel | `Annulla` | `subtle` (FormModal default) |
| Reveal modal copy button (pre-copy state) | `Copia chiave` | `ember` |
| Reveal modal copy button (post-copy state, 2000ms revert) | `Copiato` | `ember` with `Check` icon |
| Reveal modal close | `Chiudi` | `subtle` |
| DataTable row action (active key) | `Revoca` | `danger` size=`sm` |
| DataTable row action (revoked key) | `Revoca` (disabled) | `danger` size=`sm` disabled |
| ConfirmationDialog confirm (revoke) | `Revoca` | `ghost` + danger-outline (ConfirmationDialog `variant="danger"` default) |
| ConfirmationDialog cancel | `Annulla` | `subtle` (default) |
| Logout (in user dropdown, if surfaced) | `Logout` — DEFERRED: use existing Auth0 logout entry; no new HA-logout control in this phase's navbar |

### Empty state (DataTable with `data=[]`)

The `DataTable` component renders its own empty state internally — we pass these via its props (match pattern from registry pages):

| Element | Copy |
|---------|------|
| Empty state heading | `Nessuna API key` |
| Empty state body | `Crea la tua prima chiave per iniziare a usare l'API.` |
| Empty state CTA (within DataTable) | Not embedded — "Crea nuova API key" button in the Card header remains the single entry point |

### Error states

| Context | Copy | Presentation |
|---------|------|--------------|
| List fetch failure | `Errore nel caricamento delle API key` | `<Banner variant="error">` above the table (matches registry pattern `page.tsx:187`) |
| Session expired (401 from list) | `Sessione scaduta. Accedi di nuovo.` | `<Banner variant="warning">` with inline `Accedi` button linking to `/login?next=/settings/api-keys` |
| Login 401 (wrong credentials) | `Credenziali non valide` | Toast `error` + persist inline under form via RHF `setError('root', ...)` |
| Login 429 (rate-limited) | `Troppi tentativi, riprova tra un minuto` | Toast `warning` + local 30s submit lockout (D-18) |
| Login network error | `Errore di rete. Verifica la connessione e riprova.` | Toast `error` |
| Login server error (5xx / unconfigured) | `Errore del server. Riprova più tardi.` | Toast `error` |
| Create key failure | `Errore durante la creazione della chiave` | Thrown from `onSubmit` → FormModal surfaces via its internal ErrorSummary (see `FormModal.tsx:84`). Keep inside modal; do not toast. |
| Revoke failure | `Errore durante la revoca` | Toast `error` + close ConfirmationDialog without mutating table |
| Clipboard write failure | `Impossibile copiare. Seleziona e copia manualmente.` | Toast `warning` (rare; fallback already selects the `<code>` text so user can ⌘C) |

### Destructive confirmations

| Action | Confirmation body copy | Confirm label | Variant |
|--------|------------------------|---------------|---------|
| Revoke API key | `Revocare "{keyName}"? L'azione è irreversibile e le applicazioni che usano questa chiave smetteranno di funzionare.` | `Revoca` | `ConfirmationDialog variant="danger"` — Cancel button receives initial focus (safe default per `ConfirmationDialog.tsx:169-181`) |

### Plaintext key reveal view (the UX centerpiece — D-10)

After `POST /api/auth/api-keys` resolves, the FormModal content is swapped for this reveal view. All copy + structure is prescribed so executor has zero design ambiguity.

```
┌─ Modal ────────────────────────────────────────┐
│ [×]  API key creata                            │  ← Modal.Title = "API key creata"
│                                                 │
│ ┌─ Banner (variant="error", compact) ───────┐ │
│ │ ⚠  Questa chiave è visibile solo ora.     │ │
│ │    Copiala e conservala in un posto       │ │
│ │    sicuro — non potrai rivederla.         │ │
│ └───────────────────────────────────────────┘ │
│                                                 │
│  Nome: {keyName}                                │  ← Text size="sm" variant="secondary"
│                                                 │
│ ┌─ <code> block ─────────────────────────────┐ │
│ │ abc123def456…789xyz                         │ │  ← font-mono text-sm break-all
│ └────────────────────────────────────────────┘ │     p-3 rounded-lg bg-slate-800
│                                                 │     text-slate-100 select-all
│                                                 │
│  [ Copia chiave ] [ Chiudi ]                    │  ← ember full-width / subtle full-width
│                                                 │     stacked on mobile, inline on sm+
└─────────────────────────────────────────────────┘
```

Strict rules:
1. **Single instance guarantee** — the plaintext string lives in a `useState<string | null>(null)` local to the page component. It is ONLY written by the `POST` response handler, ONLY read by this view, and MUST be set back to `null` by `handleClose()` before any `onClose()` or state transition fires.
2. **Close-behavior-clears-plaintext** — every exit path (Chiudi button, X button, Escape key, backdrop click) funnels through the same `handleClose()` that calls `setRevealedKey(null)`. No other mutation is acceptable.
3. **Warning banner uses `Banner variant="error"` with `compact` prop** — the existing component already ships the AlertTriangle/AlertCircle icon in red; do NOT hand-roll a new warning div.
4. **Copy feedback** — on click, `navigator.clipboard.writeText(key)` → set `copied=true` → render `Check` icon + label "Copiato" → revert to `Copy` icon + "Copia chiave" after 2000ms (matches `CopyableIp.tsx` pattern the project already uses).
5. **No toast on copy** — feedback is strictly in-button (visual: icon swap; haptic: inherited from `Button` base). A toast would duplicate feedback and break the focused reveal context.
6. **`<code>` block is `select-all`** — CSS `user-select-all` so a single click on the code block pre-selects all text, making the manual-copy fallback one step.
7. **No "Show again" affordance** — the view cannot be re-opened for this key; user must create a new key if lost (matches HA proxy backend contract).
8. **Modal cannot be dismissed by a stray backdrop click during the reveal state** — while the form state was `submitting`, FormModal already blocks close; once transitioned to the reveal view (form is no longer submitting), backdrop click IS allowed but still funnels through `handleClose()` and therefore wipes the key.

---

## Login Form Layout

Single-column, mobile-first. This is the ONLY genuinely new layout in the phase — all other surfaces follow the registry pattern.

### Viewport targets

- **Minimum:** 375px wide (iPhone SE). Vertical stack, full-width inputs, full-width submit button.
- **Desktop:** up to 1024px+. Center the form in a `max-w-sm` (384px) card; flanking space is pure `slate-900` gradient background.

### DOM structure

```
<SettingsLayout title="Accedi" showBackButton={false}>
  <Text size="sm" variant="secondary">Inserisci le tue credenziali…</Text>
  <Card variant="glass" className="max-w-sm mx-auto p-6 sm:p-8">
    <form>
      {errors.root && <Banner variant="error" compact>...</Banner>}
      <div className="space-y-4">
        <Controller name="username" ... <Input label="Username" autoComplete="username" /> />
        <Controller name="password" ... <Input label="Password" type="password" autoComplete="current-password" /> />
      </div>
      <Button type="submit" variant="ember" fullWidth loading={isSubmitting} className="mt-6">
        Accedi
      </Button>
    </form>
  </Card>
</SettingsLayout>
```

### Behavior rules

1. **`showBackButton={false}`** on `SettingsLayout` — login is a terminal entry; the back button is confusing when the user arrived via redirect.
2. **`noValidate` on `<form>`** — defer all validation to Zod via react-hook-form (matches registry forms).
3. **`autoFocus` on username input** — on mount, the username field is focused. Password field is NOT autofocused even if username is prefilled by a password manager.
4. **Submit-button lockout on 429** — when `rateLimitedUntil > Date.now()`, the `Accedi` button is disabled AND displays a small countdown suffix in the button label: `Accedi (riprova tra {s}s)`. The countdown updates every second.
5. **Password visibility toggle is NOT included** in this phase — HA proxy credentials are server-level admin creds, not user passwords; a visibility toggle is lower value than keeping the form minimal. Can be added later if needed (deferred).
6. **Keyboard submission** — Enter in either field submits the form (RHF default).
7. **Post-success navigation** — on `login()` returning `true`, `router.push(searchParams.get('next') ?? '/settings/api-keys')`. Next parameter is validated to start with `/` (local path only) to prevent open-redirect.

### Zod schema (login)

```ts
z.object({
  username: z.string().min(1, 'Username obbligatorio').max(64, 'Max 64 caratteri'),
  password: z.string().min(1, 'Password obbligatoria'),
});
```

Per-field error rendering is handled automatically by `Input`'s `error` prop (see `Input.tsx:247-259`) — red border, AlertCircle icon, red text beneath.

---

## API-Keys Page Layout

Mirrors `app/registry/types/page.tsx` exactly. Re-stating explicitly for the checker so no design drift:

```
<SettingsLayout title="API Keys" icon="🔑" backHref="/">
  <Text variant="secondary">Gestisci le chiavi per accedere alle API.</Text>

  {error && <Banner variant="error">{error}</Banner>}
  {sessionExpired && <Banner variant="warning" actions={<Button href="/login?next=/settings/api-keys">Accedi</Button>}>…</Banner>}

  {loading ? (
    <Skeleton className="h-64 w-full" />
  ) : (
    <Card variant="glass" className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <Heading level={2} size="lg">Chiavi attive</Heading>
        <Button variant="ember" size="sm" onClick={() => setShowCreate(true)}>
          Crea nuova API key
        </Button>
      </div>
      <DataTable columns={columns} data={keys} variant="compact" />
    </Card>
  )}

  <CreateKeyModal ... />  {/* FormModal + reveal swap */}
  <ConfirmationDialog ... variant="danger" />
</SettingsLayout>
```

### DataTable columns (D-09, frozen)

| Order | Column ID | Header (IT) | Cell content | Sortable |
|-------|-----------|-------------|--------------|----------|
| 1 | `id` | `ID` | `<code className="font-mono text-sm text-slate-400">{id}</code>` | no |
| 2 | `name` | `Nome` | plain string | yes |
| 3 | `created_at` | `Creato` | `formatRelativeTime(Date.parse(created_at))` | yes |
| 4 | `last_used_at` | `Ultimo utilizzo` | relative time OR `<span className="text-slate-500">Mai usata</span>` if null | yes (nulls sort last) |
| 5 | `is_active` | `Stato` | `<Badge variant={is_active ? 'ocean' : 'neutral'} size="sm">{is_active ? 'Attiva' : 'Revocata'}</Badge>` | no |
| 6 | `actions` | *(empty header)* | `<Button variant="danger" size="sm" disabled={!is_active}>Revoca</Button>` | no |

`DataTable variant="compact"` matches registry pages. Italian locale sort via `localeCompare(a, b, 'it')` on name column.

### Responsive behavior

- **Mobile (<640px):** `DataTable` switches to its built-in mobile card layout (existing behavior — see `DataTable` component). Each row becomes a card showing `name` prominently, `id` + `created_at` + `last_used_at` as metadata, the `Stato` badge at top-right, and the `Revoca` button full-width at the bottom.
- **Desktop (≥640px):** standard table rows with columns as specified above.
- **Card header row** (`Chiavi attive` + create button): already responsive via `flex items-center justify-between` — never stacks even on narrow viewports. On 320px+ widths this is safe (button is `sm` = 44px tall with short label).

---

## Navbar Entry (D-23)

Single insertion into `app/components/Navbar.tsx` — placed in the global-sections group alongside Registro / Stanze (`isGlobalActive` check at `Navbar.tsx:173-176`).

| Property | Value |
|----------|-------|
| Label | `API Keys` |
| Href | `/settings/api-keys` |
| Icon | `<KeyRound className="w-5 h-5" />` from `lucide-react` |
| Active style | inherited `navItemActive` (ember-500/15 bg, ember-400 text, ember glow) |
| Inactive style | inherited `navItemInactive` (white/[0.04] bg, slate-300 text) |
| Position | After `Rooms`, before the Settings dropdown if any |
| Mobile bottom-nav | NOT included — keep bottom nav to 4 device-centric actions (see `getMobileQuickActions`) |
| `isGlobalActive('/settings/api-keys')` | matches `/settings`, `/settings/api-keys`, `/settings/api-keys/*` — prefix rule |

No entry for `/login` (D-24).

---

## Motion / Animation

All motion is inherited from existing components — no new animations introduced:

| Element | Animation | Source |
|---------|-----------|--------|
| FormModal open | `animate-scale-in-center` (desktop) / `animate-slide-in-from-bottom` (mobile) | Modal base |
| FormModal close | `animate-fade-out` | Modal base |
| FormModal success overlay | `animate-fade-in` + `animate-scale-in` on sage checkmark circle | `FormModal.tsx:131-141` |
| FormModal reveal-view transition | Instant state swap (no animation) — avoids misleading "success" before user copies | Phase 170 decision |
| Button active | `active:scale-[0.97]` + spring easing | Button base |
| Input focus | `ring-2 ring-ember-500/50` + `border-ember-500/60` transition-all 200ms | Input base |
| Banner appear | `animate-fade-in-up` | Banner base |
| Toast appear | existing Toast provider motion | `ToastProvider` |
| Reveal-modal copy-button icon swap | Instant (no fade) — 2000ms timer then swap back | Phase 170 decision |

`prefers-reduced-motion: reduce` — respected globally by Tailwind defaults and project's CSS `@media` rules (see `app/globals.css`).

---

## Accessibility Contract

- **Labels:** every Input is paired with a Radix `<Label.Root htmlFor={id}>` (baked into `Input` component at `Input.tsx:176-186`). Executor only needs to pass the `label` prop.
- **Error announcement:** Input errors render with `role="alert"` via `Input.tsx:249`. FormModal's ErrorSummary uses `role="alert" aria-live="polite"` (`FormModal.tsx:94-95`).
- **Focus management:**
  - Login form: `autoFocus` on username input.
  - FormModal: RHF `setFocus(firstErrorField)` after invalid submit.
  - ConfirmationDialog danger: Cancel button receives initial focus (`ConfirmationDialog.tsx:172-178`) — prevents accidental Enter-to-confirm on revoke.
  - Reveal modal: Copy button receives initial focus on mount of the reveal view (new — must be implemented in executor; model after ConfirmationDialog focus pattern).
- **Keyboard:** Escape closes modal (unless `isLoading`); Tab cycles through form → submit → cancel; Enter submits form.
- **Color contrast:** all token pairings meet WCAG AA on the `slate-900` base — verified by project design system (see `/debug/design-system`). `text-slate-400` on `slate-900` = 7.1:1. `text-ember-400` on `slate-900` = 5.8:1. `text-danger-500` on `slate-900` bg with `danger-500/10` overlay = 7.4:1.
- **Autofill:** `autoComplete="username"` + `autoComplete="current-password"` on login (D-17). Create-key form's `name` field uses `autoComplete="off"` — key names are user-chosen identifiers, not credentials.
- **`aria-label`** on icon-only buttons: back button ("Torna indietro" — existing in SettingsLayout), close buttons (inherited from Modal.Close).
- **`aria-describedby`** on Inputs with errors (baked in — `Input.tsx:204`).
- **Reveal modal announcement:** the plaintext key MUST NOT be in an `aria-live` region (screen readers would speak the whole secret aloud). The warning Banner IS in `role="alert"` but its copy is generic, not the key itself.

---

## Copywriting Contract (summary table for checker)

| Element | Copy |
|---------|------|
| Primary CTA | `Accedi` (login) / `Crea nuova API key` (api-keys) |
| Empty state heading | `Nessuna API key` |
| Empty state body | `Crea la tua prima chiave per iniziare a usare l'API.` |
| Error state | `Errore nel caricamento delle API key` → Banner variant=error above the table (registry pattern) |
| Destructive confirmation | `Revoca API key`: `Revocare "{name}"? L'azione è irreversibile e le applicazioni che usano questa chiave smetteranno di funzionare.` → confirm label `Revoca`, cancel label `Annulla` |

---

## Registry Safety

No shadcn or third-party registry is initialized in this project (confirmed: `components.json` does not exist). All components this phase uses are bespoke, committed to this repo under `app/components/ui/`, and have been security-reviewed as part of their original phase.

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not applicable |
| Third-party | none | not applicable |
| Bespoke `app/components/ui/` (internal) | `SettingsLayout`, `Card`, `DataTable`, `FormModal`, `Modal`, `ConfirmationDialog`, `Input`, `Button`, `Banner`, `Badge`, `Skeleton`, `Heading`, `Text`, `Toast`+`ToastProvider` | not applicable (repo-internal, not a remote registry) |

---

## Component Inventory (executor quick-ref)

What to import, and from where:

```ts
// Layout
import SettingsLayout from '@/app/components/SettingsLayout';

// Primitives
import { Card, Button, Input, Banner, Skeleton, Heading, Text, Badge } from '@/app/components/ui';

// Composite
import DataTable from '@/app/components/ui/DataTable';
import FormModal from '@/app/components/ui/FormModal';
import Modal from '@/app/components/ui/Modal'; // for reveal view (direct Modal, not FormModal)
import ConfirmationDialog from '@/app/components/ui/ConfirmationDialog';

// Hooks
import { useToast } from '@/app/hooks/useToast';
import { formatRelativeTime } from '@/lib/hooks/useRelativeTime';

// Form stack
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Icons
import { KeyRound, Copy, Check, AlertTriangle } from 'lucide-react';
```

Zero new dependencies.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS — Italian across all surfaces; CTA/empty/error/destructive copy explicit; reveal warning verbatim-specified.
- [ ] Dimension 2 Visuals: PASS — layout diagrams declared for login and reveal; registry CRUD page structure delegated to `app/registry/types/page.tsx` reference.
- [ ] Dimension 3 Color: PASS — 60/30/10 declared; accent reserved-for list has exactly 5 items; destructive isolated to revoke flow + error banner.
- [ ] Dimension 4 Typography: PASS — existing `Heading` + `Text` + `Input`-baked labels cover all needs; 2 weights (400 body/code, 600/700 labels/headings); no new sizes introduced.
- [ ] Dimension 5 Spacing: PASS — only existing Tailwind-multiples-of-4 tokens used; explicit list of 5 applied values (4/8/16/24/32px); touch targets inherited from Button 44/48/56.
- [ ] Dimension 6 Registry Safety: PASS — no remote registry; all components bespoke and in-repo.

**Approval:** pending
