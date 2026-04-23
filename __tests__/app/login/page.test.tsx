/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Hoisted mocks — must be set up before the component imports resolve.
const mockPush = jest.fn();
const mockSearchParamsGet = jest.fn<string | null, [string]>();
const mockLogin = jest.fn();
const mockLogout = jest.fn();

interface MockHookState {
  authenticated: boolean;
  loading: boolean;
  error: string | null;
  rateLimitedUntil: number;
  login: jest.Mock;
  logout: jest.Mock;
}

const defaultHookState: MockHookState = {
  authenticated: false,
  loading: false,
  error: null,
  rateLimitedUntil: 0,
  login: mockLogin,
  logout: mockLogout,
};

let mockHookState: MockHookState = { ...defaultHookState };

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({ get: mockSearchParamsGet }),
}));

// Mock SettingsLayout to a pass-through — we only assert LoginPage's own structure.
jest.mock('@/app/components/SettingsLayout', () => ({
  __esModule: true,
  default: function MockSettingsLayout({
    children,
    title,
  }: {
    children: React.ReactNode;
    title: string;
  }) {
    return (
      <div data-testid="settings-layout">
        <h1>{title}</h1>
        {children}
      </div>
    );
  },
}));

jest.mock('@/app/hooks/useLogin', () => ({
  useLogin: () => mockHookState,
}));

const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
  warning: jest.fn(),
  info: jest.fn(),
  toast: jest.fn(),
  dismiss: jest.fn(),
  dismissAll: jest.fn(),
};
jest.mock('@/app/hooks/useToast', () => ({
  useToast: () => mockToast,
}));

// Import AFTER mocks are set up (top-level import is hoisted above jest.mock,
// but jest.mock calls are also hoisted, so this ordering is equivalent).
// eslint-disable-next-line import/first
import LoginPage from '@/app/login/page';

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParamsGet.mockReturnValue(null);
    mockHookState = { ...defaultHookState };
  });

  it('renders title "Accedi" and username + password inputs', () => {
    render(<LoginPage />);
    expect(
      screen.getByRole('heading', { name: /accedi/i, level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /accedi/i })).toBeInTheDocument();
  });

  it('zod rejects empty username and empty password', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);
    await user.click(screen.getByRole('button', { name: /accedi/i }));
    expect(
      await screen.findByText(/username obbligatorio/i),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/password obbligatoria/i),
    ).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('submits {username, password} on valid input, redirects to /settings/api-keys on success', async () => {
    mockLogin.mockResolvedValueOnce(true);
    const user = userEvent.setup();
    render(<LoginPage />);
    await user.type(screen.getByLabelText(/username/i), 'bob');
    await user.type(screen.getByLabelText(/password/i), 'pw');
    await user.click(screen.getByRole('button', { name: /accedi/i }));
    await waitFor(() =>
      expect(mockLogin).toHaveBeenCalledWith({ username: 'bob', password: 'pw' }),
    );
    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith('/settings/api-keys'),
    );
  });

  it('redirects to ?next path when it starts with /', async () => {
    mockSearchParamsGet.mockImplementation((k: string) =>
      k === 'next' ? '/rooms/status' : null,
    );
    mockLogin.mockResolvedValueOnce(true);
    const user = userEvent.setup();
    render(<LoginPage />);
    await user.type(screen.getByLabelText(/username/i), 'bob');
    await user.type(screen.getByLabelText(/password/i), 'pw');
    await user.click(screen.getByRole('button', { name: /accedi/i }));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/rooms/status'));
  });

  it('refuses ?next when it does not start with / (open-redirect protection)', async () => {
    mockSearchParamsGet.mockImplementation((k: string) =>
      k === 'next' ? 'https://evil.example/' : null,
    );
    mockLogin.mockResolvedValueOnce(true);
    const user = userEvent.setup();
    render(<LoginPage />);
    await user.type(screen.getByLabelText(/username/i), 'bob');
    await user.type(screen.getByLabelText(/password/i), 'pw');
    await user.click(screen.getByRole('button', { name: /accedi/i }));
    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith('/settings/api-keys'),
    );
  });

  it('rejects protocol-relative URL in ?next= param (T-170-10 tightening)', async () => {
    mockSearchParamsGet.mockImplementation((k: string) =>
      k === 'next' ? '//evil.com' : null,
    );
    mockLogin.mockResolvedValueOnce(true);
    const user = userEvent.setup();
    render(<LoginPage />);
    await user.type(screen.getByLabelText(/username/i), 'bob');
    await user.type(screen.getByLabelText(/password/i), 'pw');
    await user.click(screen.getByRole('button', { name: /accedi/i }));
    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith('/settings/api-keys'),
    );
  });

  it('shows Credenziali non valide banner when hook error is INVALID_CREDENTIALS', () => {
    mockHookState = { ...defaultHookState, error: 'INVALID_CREDENTIALS' };
    render(<LoginPage />);
    expect(screen.getByText(/credenziali non valide/i)).toBeInTheDocument();
  });

  it('disables submit during rate-limit lockout and shows countdown suffix', () => {
    mockHookState = {
      ...defaultHookState,
      error: 'RATE_LIMITED',
      rateLimitedUntil: Date.now() + 15_000,
    };
    render(<LoginPage />);
    const btn = screen.getByRole('button', { name: /accedi/i });
    expect(btn).toBeDisabled();
    expect(btn.textContent).toMatch(/riprova tra \d+s/);
  });
});
