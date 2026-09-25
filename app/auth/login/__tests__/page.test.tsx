import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import LoginPage from '../page';

const mockNavigate = jest.fn();
jest.mock('@/lib/auth/hardNavigate', () => ({ hardNavigate: (url: string) => mockNavigate(url) }));

let search = '';
jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(search),
}));

function fill(email: string, password: string) {
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: email } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: password } });
  fireEvent.click(screen.getByRole('button', { name: 'Accedi' }));
}

function mockFetchResponse(status: number, body: unknown) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }) as unknown as typeof fetch;
}

describe('/auth/login page', () => {
  const originalFetch = global.fetch;
  beforeEach(() => {
    search = '';
    mockNavigate.mockReset();
  });
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('has password-manager friendly fields and disables submit until filled', () => {
    render(<LoginPage />);
    expect(screen.getByLabelText('Email')).toHaveAttribute('autocomplete', 'username');
    expect(screen.getByLabelText('Password')).toHaveAttribute('autocomplete', 'current-password');
    expect(screen.getByRole('button', { name: 'Accedi' })).toBeDisabled();
  });

  it('posts credentials and navigates to a safe returnTo', async () => {
    search = 'returnTo=%2Fstove%3Ftab%3Dx';
    mockFetchResponse(200, { user: { email: 'me@example.com' } });
    render(<LoginPage />);
    fill('me@example.com', 'pw');

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/stove?tab=x'));
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('/api/auth/session');
    expect(JSON.parse(init.body)).toEqual({ email: 'me@example.com', password: 'pw' });
  });

  it('ignores an off-site returnTo', async () => {
    search = 'returnTo=https%3A%2F%2Fevil.example';
    mockFetchResponse(200, {});
    render(<LoginPage />);
    fill('me@example.com', 'pw');
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'));
  });

  it('shows the error for wrong credentials and a lockout wait time', async () => {
    mockFetchResponse(401, { error: 'Email o password non validi' });
    render(<LoginPage />);
    fill('me@example.com', 'bad');
    expect(await screen.findByRole('alert')).toHaveTextContent('Email o password non validi');
    expect(mockNavigate).not.toHaveBeenCalled();

    mockFetchResponse(429, { error: 'x', retryAfter: 600 });
    fireEvent.click(screen.getByRole('button', { name: 'Accedi' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Riprova tra 10 min'));
  });
});
