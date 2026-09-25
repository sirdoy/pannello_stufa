import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import UsersSettingsPage from '../page';

const admin = {
  id: 1, email: 'me@example.com', display_name: 'Federico', role: 'admin', last_login_at: null,
  legacy_sub: 'google-oauth2|1', is_active: true, created_at: '', updated_at: '',
};
const plain = { ...admin, id: 2, email: 'test@example.com', display_name: null, role: 'test', legacy_sub: null };

type Handler = (url: string, init?: RequestInit) => { status: number; body?: unknown };
function mockFetch(handler: Handler) {
  global.fetch = jest.fn(async (url: string, init?: RequestInit) => {
    const { status, body } = handler(url, init);
    return { ok: status < 300, status, json: async () => body } as Response;
  }) as unknown as typeof fetch;
}
const calls = () => (global.fetch as jest.Mock).mock.calls as [string, RequestInit | undefined][];

describe('/settings/users page', () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('hides the admin section for non-admins but keeps password change', async () => {
    mockFetch(() => ({ status: 403 }));
    render(<UsersSettingsPage />);
    await waitFor(() => expect(calls().some(([u]) => u === '/api/users')).toBe(true));
    expect(screen.getByTestId('password-card')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByTestId('users-card')).toBeNull());
  });

  it('lists users for admins', async () => {
    mockFetch(() => ({ status: 200, body: { users: [admin, plain], count: 2 } }));
    render(<UsersSettingsPage />);
    expect(await screen.findByText('Federico')).toBeInTheDocument();
    expect(screen.getByTestId('user-row-2')).toHaveTextContent('test@example.com');
  });

  it('creates a user and shows the generated password once', async () => {
    mockFetch((url, init) =>
      url === '/api/users' && init?.method === 'POST'
        ? { status: 201, body: { user: { ...plain, id: 3, email: 'new@example.com' }, generated_password: 'Gen-Pass-123' } }
        : { status: 200, body: { users: [admin], count: 1 } }
    );
    render(<UsersSettingsPage />);
    await screen.findByText('Federico');
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'new@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Crea utente' }));

    expect(await screen.findByTestId('generated-password')).toHaveTextContent('Gen-Pass-123');
    const post = calls().find(([u, i]) => u === '/api/users' && i?.method === 'POST')!;
    expect(JSON.parse(post[1]!.body as string)).toEqual({ email: 'new@example.com', role: 'user' });
    expect(screen.getByTestId('user-row-3')).toBeInTheDocument();
  });

  it('sends only changed fields when editing', async () => {
    mockFetch((url, init) =>
      init?.method === 'PATCH'
        ? { status: 200, body: { ...plain, role: 'user', is_active: false } }
        : { status: 200, body: { users: [admin, plain], count: 2 } }
    );
    render(<UsersSettingsPage />);
    const row = await screen.findByTestId('user-row-2');
    fireEvent.click(within(row).getByRole('button', { name: /modifica/i }));
    fireEvent.change(within(row).getByLabelText('Ruolo'), { target: { value: 'user' } });
    fireEvent.click(within(row).getByLabelText('Attivo'));
    fireEvent.click(within(row).getByRole('button', { name: 'Salva' }));

    await waitFor(() => expect(calls().some(([, i]) => i?.method === 'PATCH')).toBe(true));
    const patch = calls().find(([, i]) => i?.method === 'PATCH')!;
    expect(patch[0]).toBe('/api/users/2');
    expect(JSON.parse(patch[1]!.body as string)).toEqual({ role: 'user', is_active: false });
    await waitFor(() => expect(within(screen.getByTestId('user-row-2')).getByText(/disattivato/)).toBeInTheDocument());
  });

  it('password change validates and reports wrong current password', async () => {
    mockFetch((url) => (url === '/api/account/password' ? { status: 401 } : { status: 403 }));
    render(<UsersSettingsPage />);
    const submit = screen.getByRole('button', { name: 'Aggiorna password' });
    fireEvent.change(screen.getByLabelText('Password attuale'), { target: { value: 'old' } });
    fireEvent.change(screen.getByLabelText(/Nuova password/), { target: { value: 'short' } });
    fireEvent.change(screen.getByLabelText('Conferma nuova password'), { target: { value: 'short' } });
    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/Nuova password/), { target: { value: 'long-enough-1' } });
    fireEvent.change(screen.getByLabelText('Conferma nuova password'), { target: { value: 'long-enough-1' } });
    fireEvent.click(submit);
    expect(await screen.findByTestId('password-status')).toHaveTextContent('Password attuale errata');
  });
});
