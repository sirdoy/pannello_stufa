'use client';

/**
 * /settings/users — account & user management (roadmap 8.4).
 *
 * - Everyone: change your own password.
 * - Admins: list, create and edit users (name, role, active, password reset,
 *   legacy Auth0 subject). Non-admins get 403 from /api/users and the section
 *   is simply not shown.
 */

import { useEffect, useState, type FormEvent } from 'react';
import { GlassCard } from '@/app/components/EmberGlass/GlassCard';
import {
  errorTextStyle,
  inputStyle,
  labelStyle,
  okTextStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
} from '@/app/components/EmberGlass/formStyles';
import type { UserAdmin, UserCreateResponse, UserRole, UserUpdateRequest } from '@/types/users';

const ROLE_LABEL: Record<UserRole, string> = { admin: 'Admin', user: 'Utente', test: 'Test' };
const MIN_PASSWORD = 10;

const cardStyle = { aspectRatio: 'auto', marginBottom: 16 } as const;

async function errorMessage(response: Response, fallback: string): Promise<string> {
  const data = (await response.json().catch(() => null)) as
    | { message?: string; error?: string | { message?: string }; detail?: string }
    | null;
  if (!data) return fallback;
  if (typeof data.error === 'object' && data.error?.message) return data.error.message;
  return data.message ?? (typeof data.error === 'string' ? data.error : undefined) ?? data.detail ?? fallback;
}

function formatDate(iso: string | null): string {
  if (!iso) return 'mai';
  return new Date(iso).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' });
}

// ---------------------------------------------------------------------------
// Own password
// ---------------------------------------------------------------------------

function PasswordSection() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const mismatch = confirm.length > 0 && next !== confirm;
  const valid = current.length > 0 && next.length >= MIN_PASSWORD && next === confirm;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!valid || saving) return;
    setSaving(true);
    setStatus(null);
    const response = await fetch('/api/account/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current_password: current, new_password: next }),
    }).catch(() => null);
    if (response?.ok) {
      setStatus({ ok: true, text: 'Password aggiornata. Gli altri dispositivi dovranno rientrare.' });
      setCurrent('');
      setNext('');
      setConfirm('');
    } else {
      const text = response
        ? response.status === 401
          ? 'Password attuale errata'
          : await errorMessage(response, 'Aggiornamento non riuscito')
        : 'Connessione non riuscita';
      setStatus({ ok: false, text });
    }
    setSaving(false);
  }

  return (
    <GlassCard style={cardStyle} data-testid="password-card">
      <h2 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 14px' }}>Cambia password</h2>
      <form onSubmit={onSubmit} noValidate>
        {/* Hidden username helps password managers pair the new password with the account */}
        <input type="text" autoComplete="username" hidden readOnly />
        <div style={{ marginBottom: 12 }}>
          <label htmlFor="pw-current" style={labelStyle}>Password attuale</label>
          <input id="pw-current" type="password" autoComplete="current-password" value={current}
            onChange={(e) => setCurrent(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label htmlFor="pw-new" style={labelStyle}>Nuova password (min {MIN_PASSWORD} caratteri)</label>
          <input id="pw-new" type="password" autoComplete="new-password" value={next}
            onChange={(e) => setNext(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label htmlFor="pw-confirm" style={labelStyle}>Conferma nuova password</label>
          <input id="pw-confirm" type="password" autoComplete="new-password" value={confirm}
            onChange={(e) => setConfirm(e.target.value)} style={inputStyle} />
        </div>
        {mismatch && <p style={errorTextStyle}>Le password non coincidono</p>}
        {status && (
          <p role="status" data-testid="password-status" style={status.ok ? okTextStyle : errorTextStyle}>
            {status.text}
          </p>
        )}
        <button type="submit" disabled={!valid || saving} style={primaryButtonStyle(!valid || saving)}>
          {saving ? 'Salvataggio…' : 'Aggiorna password'}
        </button>
      </form>
    </GlassCard>
  );
}

// ---------------------------------------------------------------------------
// Admin: create
// ---------------------------------------------------------------------------

function CreateUserForm({ onCreated }: { onCreated: (user: UserAdmin) => void }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [generated, setGenerated] = useState<{ email: string; password: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const passwordOk = password === '' || password.length >= MIN_PASSWORD;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email || !passwordOk || saving) return;
    setSaving(true);
    setError(null);
    setGenerated(null);
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        role,
        ...(name.trim() ? { display_name: name.trim() } : {}),
        ...(password ? { password } : {}),
      }),
    }).catch(() => null);
    if (response?.ok) {
      const data = (await response.json()) as UserCreateResponse;
      onCreated(data.user);
      if (data.generated_password) {
        setGenerated({ email: data.user.email, password: data.generated_password });
      }
      setEmail('');
      setName('');
      setPassword('');
      setRole('user');
    } else {
      setError(
        response?.status === 409
          ? 'Email già registrata'
          : response
            ? await errorMessage(response, 'Creazione non riuscita')
            : 'Connessione non riuscita'
      );
    }
    setSaving(false);
  }

  return (
    <form onSubmit={onSubmit} noValidate data-testid="create-user-form" style={{ marginTop: 18 }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px' }}>Nuovo utente</h3>
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div>
          <label htmlFor="new-email" style={labelStyle}>Email</label>
          <input id="new-email" type="email" autoComplete="off" value={email}
            onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label htmlFor="new-name" style={labelStyle}>Nome (opzionale)</label>
          <input id="new-name" type="text" autoComplete="off" value={name}
            onChange={(e) => setName(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label htmlFor="new-role" style={labelStyle}>Ruolo</label>
          <select id="new-role" value={role} onChange={(e) => setRole(e.target.value as UserRole)} style={inputStyle}>
            {(Object.keys(ROLE_LABEL) as UserRole[]).map((r) => (
              <option key={r} value={r}>{ROLE_LABEL[r]}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="new-password" style={labelStyle}>Password (vuota = generata)</label>
          <input id="new-password" type="password" autoComplete="new-password" value={password}
            onChange={(e) => setPassword(e.target.value)} style={inputStyle} />
        </div>
      </div>
      {!passwordOk && <p style={{ ...errorTextStyle, marginTop: 10 }}>Minimo {MIN_PASSWORD} caratteri</p>}
      {error && <p role="alert" style={{ ...errorTextStyle, marginTop: 10 }}>{error}</p>}
      {generated && (
        <p data-testid="generated-password" style={{ ...okTextStyle, marginTop: 10 }}>
          Password per {generated.email}: <code style={{ userSelect: 'all' }}>{generated.password}</code>
          {' '}— copiala ora, non verrà più mostrata.
        </p>
      )}
      <div style={{ marginTop: 12 }}>
        <button type="submit" disabled={!email || !passwordOk || saving}
          style={primaryButtonStyle(!email || !passwordOk || saving)}>
          {saving ? 'Creazione…' : 'Crea utente'}
        </button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Admin: edit one user
// ---------------------------------------------------------------------------

function UserRow({ user, onSaved }: { user: UserAdmin; onSaved: (user: UserAdmin) => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.display_name ?? '');
  const [role, setRole] = useState<UserRole>(user.role);
  const [active, setActive] = useState(user.is_active);
  const [password, setPassword] = useState('');
  const [legacySub, setLegacySub] = useState(user.legacy_sub ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function startEdit() {
    setName(user.display_name ?? '');
    setRole(user.role);
    setActive(user.is_active);
    setPassword('');
    setLegacySub(user.legacy_sub ?? '');
    setError(null);
    setEditing(true);
  }

  async function save() {
    const changes: UserUpdateRequest = {};
    if (name.trim() !== (user.display_name ?? '')) changes.display_name = name.trim() || null;
    if (role !== user.role) changes.role = role;
    if (active !== user.is_active) changes.is_active = active;
    if (password) changes.password = password;
    if (legacySub.trim() !== (user.legacy_sub ?? '')) changes.legacy_sub = legacySub.trim() || null;
    if (Object.keys(changes).length === 0) {
      setEditing(false);
      return;
    }
    if (password && password.length < MIN_PASSWORD) {
      setError(`Password: minimo ${MIN_PASSWORD} caratteri`);
      return;
    }
    setSaving(true);
    setError(null);
    const response = await fetch(`/api/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(changes),
    }).catch(() => null);
    if (response?.ok) {
      onSaved((await response.json()) as UserAdmin);
      setEditing(false);
    } else {
      setError(response ? await errorMessage(response, 'Salvataggio non riuscito') : 'Connessione non riuscita');
    }
    setSaving(false);
  }

  return (
    <li
      data-testid={`user-row-${user.id}`}
      style={{ padding: '12px 0', borderTop: '0.5px solid rgba(255,255,255,0.08)', listStyle: 'none' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontWeight: 600, opacity: user.is_active ? 1 : 0.5 }}>
            {user.display_name || user.email}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
            {user.email} · {ROLE_LABEL[user.role]}
            {!user.is_active && ' · disattivato'} · ultimo accesso {formatDate(user.last_login_at)}
          </div>
        </div>
        {!editing && (
          <button type="button" onClick={startEdit} style={secondaryButtonStyle} aria-label={`Modifica ${user.email}`}>
            Modifica
          </button>
        )}
      </div>

      {editing && (
        <div style={{ marginTop: 12, display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <div>
            <label htmlFor={`name-${user.id}`} style={labelStyle}>Nome</label>
            <input id={`name-${user.id}`} value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label htmlFor={`role-${user.id}`} style={labelStyle}>Ruolo</label>
            <select id={`role-${user.id}`} value={role} onChange={(e) => setRole(e.target.value as UserRole)} style={inputStyle}>
              {(Object.keys(ROLE_LABEL) as UserRole[]).map((r) => (
                <option key={r} value={r}>{ROLE_LABEL[r]}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={`pw-${user.id}`} style={labelStyle}>Nuova password (opzionale)</label>
            <input id={`pw-${user.id}`} type="password" autoComplete="new-password" value={password}
              onChange={(e) => setPassword(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label htmlFor={`legacy-${user.id}`} style={labelStyle}>ID dati Auth0 (avanzato)</label>
            <input id={`legacy-${user.id}`} value={legacySub} onChange={(e) => setLegacySub(e.target.value)}
              style={{ ...inputStyle, fontFamily: 'ui-monospace, SF Mono, monospace', fontSize: 13 }} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            Attivo
          </label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', gridColumn: '1 / -1' }}>
            <button type="button" onClick={() => void save()} disabled={saving} style={primaryButtonStyle(saving)}>
              {saving ? 'Salvataggio…' : 'Salva'}
            </button>
            <button type="button" onClick={() => setEditing(false)} style={secondaryButtonStyle}>
              Annulla
            </button>
          </div>
          {error && <p role="alert" style={{ ...errorTextStyle, gridColumn: '1 / -1' }}>{error}</p>}
        </div>
      )}
    </li>
  );
}

// ---------------------------------------------------------------------------
// Admin section
// ---------------------------------------------------------------------------

function UsersSection() {
  const [users, setUsers] = useState<UserAdmin[] | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch('/api/users')
      .then(async (response) => {
        if (!alive) return;
        if (response.status === 403) {
          setForbidden(true);
        } else if (!response.ok) {
          setError('Impossibile caricare gli utenti');
        } else {
          const data = (await response.json()) as { users: UserAdmin[] };
          if (alive) setUsers(data.users);
        }
      })
      .catch(() => {
        if (alive) setError('Impossibile caricare gli utenti');
      });
    return () => {
      alive = false;
    };
  }, []);

  // Render nothing until /api/users answers: non-admins (403) never see the section
  if (forbidden || (!users && !error)) return null;

  const upsert = (user: UserAdmin) =>
    setUsers((prev) => {
      const list = prev ?? [];
      return list.some((u) => u.id === user.id) ? list.map((u) => (u.id === user.id ? user : u)) : [...list, user];
    });

  return (
    <GlassCard style={cardStyle} data-testid="users-card">
      <h2 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 6px' }}>Utenti</h2>
      {error && <p role="alert" style={errorTextStyle}>{error}</p>}
      {users && (
        <ul style={{ margin: 0, padding: 0 }}>
          {users.map((u) => (
            <UserRow key={u.id} user={u} onSaved={upsert} />
          ))}
        </ul>
      )}
      <CreateUserForm onCreated={upsert} />
    </GlassCard>
  );
}

export default function UsersSettingsPage() {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, margin: '4px 0 18px' }}>Account e utenti</h1>
      <PasswordSection />
      <UsersSection />
    </div>
  );
}
