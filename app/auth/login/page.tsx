'use client';

/**
 * /auth/login — email/password sign-in (roadmap Fase 8, replaces the Auth0 redirect).
 *
 * Posts to /api/auth/session, which sets the httpOnly session cookie, then
 * performs a full navigation to `returnTo` (local paths only) so every server
 * component and the client providers start from the new session.
 */

import { Suspense, useState, type FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { Flame } from 'lucide-react';
import { GlassCard } from '@/app/components/EmberGlass/GlassCard';
import {
  errorTextStyle,
  inputStyle,
  labelStyle,
  primaryButtonStyle,
} from '@/app/components/EmberGlass/formStyles';
import { safeReturnTo } from '@/lib/auth/returnTo';
import { hardNavigate } from '@/lib/auth/hardNavigate';

function LoginForm() {
  const searchParams = useSearchParams();
  const returnTo = safeReturnTo(searchParams.get('returnTo'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (response.ok) {
        hardNavigate(returnTo);
        return;
      }
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        retryAfter?: number | null;
      };
      if (response.status === 429 && data.retryAfter) {
        setError(`Troppi tentativi. Riprova tra ${Math.ceil(data.retryAfter / 60)} min.`);
      } else {
        setError(data.error ?? 'Accesso non riuscito');
      }
    } catch {
      setError('Connessione non riuscita, riprova');
    }
    setSubmitting(false);
  }

  return (
    <form onSubmit={onSubmit} noValidate data-testid="login-form">
      <div style={{ marginBottom: 14 }}>
        <label htmlFor="login-email" style={labelStyle}>
          Email
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="username"
          inputMode="email"
          autoFocus
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />
      </div>
      <div style={{ marginBottom: 18 }}>
        <label htmlFor="login-password" style={labelStyle}>
          Password
        </label>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />
      </div>
      {error && (
        <p
          role="alert"
          data-testid="login-error"
          style={errorTextStyle}
        >
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={submitting || !email || !password}
        style={{
          ...primaryButtonStyle(submitting || !email || !password),
          width: '100%',
          height: 46,
          cursor: submitting ? 'wait' : primaryButtonStyle(!email || !password).cursor,
        }}
      >
        {submitting ? 'Accesso…' : 'Accedi'}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div
      style={{
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <GlassCard style={{ aspectRatio: 'auto', width: '100%', maxWidth: 380 }} data-testid="login-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <Flame size={22} color="var(--accent)" aria-hidden="true" />
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Pannello Stufa</h1>
        </div>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </GlassCard>
    </div>
  );
}
