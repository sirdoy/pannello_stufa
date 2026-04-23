'use client';

/**
 * Login page — HA-proxy credential gate for /settings/api-keys.
 *
 * Per phase 170 UI-SPEC §"Login Form Layout":
 * - SettingsLayout wrapper with showBackButton={false}
 * - Card variant="glass" max-w-sm centered, single-column form
 * - Zod validation, React Hook Form, autoComplete + autoFocus attrs
 * - 30s rate-limit lockout with live countdown suffix
 * - ?next= open-redirect protection (T-170-10): accepts local paths only
 */

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import SettingsLayout from '@/app/components/SettingsLayout';
import Card from '@/app/components/ui/Card';
import Input from '@/app/components/ui/Input';
import Button from '@/app/components/ui/Button';
import Banner from '@/app/components/ui/Banner';
import { Text } from '@/app/components/ui';
import { useLogin } from '@/app/hooks/useLogin';
import { useToast } from '@/app/hooks/useToast';

const loginSchema = z.object({
  username: z
    .string()
    .min(1, 'Username obbligatorio')
    .max(64, 'Max 64 caratteri'),
  password: z.string().min(1, 'Password obbligatoria'),
});

type LoginForm = z.infer<typeof loginSchema>;

const FALLBACK_REDIRECT = '/settings/api-keys';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, error, rateLimitedUntil } = useLogin();
  const { error: toastError, warning: toastWarning } = useToast();

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  });

  // Rate-limit countdown tick (triggers re-render once per second while locked).
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (rateLimitedUntil <= Date.now()) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [rateLimitedUntil]);

  const isLockedOut = rateLimitedUntil > now;
  const secondsLeft = isLockedOut
    ? Math.ceil((rateLimitedUntil - now) / 1000)
    : 0;

  // Surface hook-level errors as toasts (copy pinned by UI-SPEC §Error states).
  useEffect(() => {
    if (error === 'INVALID_CREDENTIALS') toastError('Credenziali non valide');
    if (error === 'RATE_LIMITED')
      toastWarning('Troppi tentativi, riprova tra un minuto');
    if (error === 'NETWORK_ERROR')
      toastError('Errore di rete. Verifica la connessione e riprova.');
    if (error === 'SERVER_ERROR')
      toastError('Errore del server. Riprova più tardi.');
  }, [error, toastError, toastWarning]);

  const onSubmit = async (values: LoginForm) => {
    const ok = await login(values);
    if (ok) {
      // Open-redirect protection (T-170-10): accept `next` only when it starts
      // with a single `/`. Protocol-relative `//evil.com` would be interpreted
      // as a cross-origin navigation by the browser — reject explicitly.
      const next = searchParams.get('next');
      const target =
        next && next.startsWith('/') && !next.startsWith('//')
          ? next
          : FALLBACK_REDIRECT;
      router.push(target);
    }
  };

  return (
    <SettingsLayout title="Accedi" showBackButton={false}>
      <Text size="sm" variant="secondary">
        Inserisci le tue credenziali per gestire le API key.
      </Text>

      <Card variant="glass" className="max-w-sm mx-auto p-6 sm:p-8 mt-6">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {error === 'INVALID_CREDENTIALS' && (
            <Banner variant="error" compact>
              Credenziali non valide
            </Banner>
          )}

          <div className="space-y-4">
            <Controller
              name="username"
              control={control}
              render={({ field, fieldState }) => (
                <Input
                  label="Username"
                  autoComplete="username"
                  autoFocus
                  {...field}
                  error={fieldState.error?.message}
                />
              )}
            />
            <Controller
              name="password"
              control={control}
              render={({ field, fieldState }) => (
                <Input
                  label="Password"
                  type="password"
                  autoComplete="current-password"
                  {...field}
                  error={fieldState.error?.message}
                />
              )}
            />
          </div>

          <Button
            type="submit"
            variant="ember"
            fullWidth
            loading={isSubmitting}
            disabled={isLockedOut || isSubmitting}
            className="mt-6"
          >
            {isLockedOut ? `Accedi (riprova tra ${secondsLeft}s)` : 'Accedi'}
          </Button>
        </form>
      </Card>
    </SettingsLayout>
  );
}
