/**
 * @jest-environment jsdom
 *
 * Component tests for /settings/api-keys page (Phase 170 Plan 03).
 *
 * Pins VALIDATION rows 170-03-01..170-03-05:
 *   - list rendering (empty / populated / badges / "Mai usata")
 *   - create flow (Zod rejection / plaintext reveal / plaintext cleared on close)
 *   - revoke flow (ConfirmationDialog / disabled on revoked rows)
 *   - SESSION_EXPIRED banner with /login?next= link
 *
 * Key testing pattern: the `useApiKeys` hook is mocked as a controlled state
 * object so each test can drive different scenarios without touching fetch.
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// --- Hook mocks (must be declared before importing the SUT) ------------------

const mockCreate = jest.fn();
const mockRevoke = jest.fn();
const mockRefetch = jest.fn();

type HookState = {
  keys: any[];
  loading: boolean;
  error: 'SESSION_EXPIRED' | 'Errore nel caricamento delle API key' | null;
  refetch: jest.Mock;
  create: jest.Mock;
  revoke: jest.Mock;
};

let mockHookState: HookState = {
  keys: [],
  loading: false,
  error: null,
  refetch: mockRefetch,
  create: mockCreate,
  revoke: mockRevoke,
};

jest.mock('@/app/hooks/useApiKeys', () => ({
  useApiKeys: () => mockHookState,
}));

const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
  warning: jest.fn(),
  info: jest.fn(),
};

jest.mock('@/app/hooks/useToast', () => ({
  useToast: () => mockToast,
}));

// Simplify SettingsLayout so we only test the page's own markup.
jest.mock('@/app/components/SettingsLayout', () => {
  return function MockSettingsLayout({
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
  };
});

// Clipboard mock (one installation, reused across all tests).
Object.assign(navigator, {
  clipboard: { writeText: jest.fn().mockResolvedValue(undefined) },
});

// Now it's safe to import the SUT (its `useApiKeys` / `useToast` imports
// resolve to the mocks above).
import ApiKeysPage from '@/app/settings/api-keys/page';

// --- Fixtures ----------------------------------------------------------------

const ACTIVE_KEY = {
  id: 1,
  name: 'Prod',
  created_at: '2026-04-20T10:00:00Z',
  last_used_at: '2026-04-22T12:00:00Z',
  is_active: true,
};

const REVOKED_KEY = {
  id: 2,
  name: 'OldKey',
  created_at: '2026-04-15T10:00:00Z',
  last_used_at: null,
  is_active: false,
};

// --- Setup -------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();
  mockHookState = {
    keys: [],
    loading: false,
    error: null,
    refetch: mockRefetch,
    create: mockCreate,
    revoke: mockRevoke,
  };
});

// --- Tests -------------------------------------------------------------------

describe('ApiKeysPage — list/rendering', () => {
  it('renders skeleton while loading (no DataTable yet)', () => {
    mockHookState = { ...mockHookState, loading: true };
    render(<ApiKeysPage />);
    // Empty-state copy must not leak during loading — the page shows a Skeleton
    // placeholder, not the DataTable's zero-row rendering.
    expect(screen.queryByText(/nessuna api key/i)).not.toBeInTheDocument();
  });

  it('renders empty-state copy when keys=[]', async () => {
    render(<ApiKeysPage />);
    expect(await screen.findByText(/nessuna api key/i)).toBeInTheDocument();
  });

  it('renders list rows with is_active badges', () => {
    mockHookState = { ...mockHookState, keys: [ACTIVE_KEY, REVOKED_KEY] };
    render(<ApiKeysPage />);
    expect(screen.getByText('Prod')).toBeInTheDocument();
    expect(screen.getByText('OldKey')).toBeInTheDocument();
    expect(screen.getByText(/attiva/i)).toBeInTheDocument();
    expect(screen.getByText(/revocata/i)).toBeInTheDocument();
  });

  it('renders "Mai usata" for null last_used_at', () => {
    mockHookState = { ...mockHookState, keys: [REVOKED_KEY] };
    render(<ApiKeysPage />);
    expect(screen.getByText(/mai usata/i)).toBeInTheDocument();
  });

  it('shows re-auth banner when error=SESSION_EXPIRED (link points to /login?next=/settings/api-keys)', () => {
    mockHookState = { ...mockHookState, error: 'SESSION_EXPIRED' };
    render(<ApiKeysPage />);
    expect(screen.getByText(/sessione scaduta/i)).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /accedi/i });
    expect(link).toHaveAttribute('href', '/login?next=/settings/api-keys');
  });
});

describe('ApiKeysPage — create flow', () => {
  it('zod rejects empty name (no POST call)', async () => {
    const user = userEvent.setup();
    render(<ApiKeysPage />);
    await user.click(
      screen.getByRole('button', { name: /crea nuova api key/i }),
    );
    // Click Crea inside the FormModal with an empty name field.
    await user.click(screen.getByRole('button', { name: /^crea$/i }));
    expect(await screen.findByText(/nome obbligatorio/i)).toBeInTheDocument();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('reveals plaintext key after successful create', async () => {
    mockCreate.mockResolvedValueOnce({
      id: 3,
      name: 'Test',
      api_key: 'ha_live_abc123xyz',
      created_at: '2026-04-23T00:00:00Z',
    });
    const user = userEvent.setup();
    render(<ApiKeysPage />);
    await user.click(
      screen.getByRole('button', { name: /crea nuova api key/i }),
    );
    await user.type(screen.getByLabelText(/nome/i), 'Test');
    await user.click(screen.getByRole('button', { name: /^crea$/i }));
    await waitFor(() => expect(mockCreate).toHaveBeenCalledWith('Test'));
    expect(
      await screen.findByText(/ha_live_abc123xyz/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /copia chiave/i }),
    ).toBeInTheDocument();
  });

  it('plaintext is cleared from DOM after Chiudi (T-170-14 mitigation)', async () => {
    mockCreate.mockResolvedValueOnce({
      id: 3,
      name: 'Test',
      api_key: 'ha_live_topsecret_xyz',
      created_at: '2026-04-23T00:00:00Z',
    });
    const user = userEvent.setup();
    render(<ApiKeysPage />);
    await user.click(
      screen.getByRole('button', { name: /crea nuova api key/i }),
    );
    await user.type(screen.getByLabelText(/nome/i), 'Test');
    await user.click(screen.getByRole('button', { name: /^crea$/i }));
    await screen.findByText(/ha_live_topsecret_xyz/i);
    await user.click(screen.getByRole('button', { name: /chiudi/i }));
    await waitFor(() =>
      expect(
        screen.queryByText(/ha_live_topsecret_xyz/i),
      ).not.toBeInTheDocument(),
    );
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('create failure stays in FormModal (no reveal view, no success toast)', async () => {
    mockCreate.mockRejectedValueOnce(
      new Error('Errore durante la creazione della chiave'),
    );
    const user = userEvent.setup();
    render(<ApiKeysPage />);
    await user.click(
      screen.getByRole('button', { name: /crea nuova api key/i }),
    );
    await user.type(screen.getByLabelText(/nome/i), 'X');
    await user.click(screen.getByRole('button', { name: /^crea$/i }));
    await waitFor(() => expect(mockCreate).toHaveBeenCalled());
    expect(
      screen.queryByRole('button', { name: /copia chiave/i }),
    ).not.toBeInTheDocument();
    expect(mockToast.success).not.toHaveBeenCalled();
  });
});

describe('ApiKeysPage — revoke flow', () => {
  it('opens ConfirmationDialog on Revoca click and revokes on confirm', async () => {
    mockHookState = { ...mockHookState, keys: [ACTIVE_KEY] };
    mockRevoke.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    render(<ApiKeysPage />);
    await user.click(screen.getByRole('button', { name: /^revoca$/i }));
    expect(
      await screen.findByText(/revocare "Prod"/i),
    ).toBeInTheDocument();
    // ConfirmationDialog danger variant auto-focuses Cancel. The confirm
    // button is the last "Revoca" in DOM order (row button + dialog button).
    const revocaButtons = screen.getAllByRole('button', {
      name: /^revoca$/i,
    });
    const dialogConfirm = revocaButtons[revocaButtons.length - 1]!;
    await user.click(dialogConfirm);
    await waitFor(() => expect(mockRevoke).toHaveBeenCalledWith(1));
    await waitFor(() =>
      expect(mockToast.success).toHaveBeenCalledWith('API key revocata'),
    );
  });

  it('does not call revoke on Cancel', async () => {
    mockHookState = { ...mockHookState, keys: [ACTIVE_KEY] };
    const user = userEvent.setup();
    render(<ApiKeysPage />);
    await user.click(screen.getByRole('button', { name: /^revoca$/i }));
    await user.click(screen.getByRole('button', { name: /annulla/i }));
    expect(mockRevoke).not.toHaveBeenCalled();
  });

  it('revoke button is disabled on revoked rows', () => {
    mockHookState = { ...mockHookState, keys: [REVOKED_KEY] };
    render(<ApiKeysPage />);
    const btn = screen.getByRole('button', { name: /^revoca$/i });
    expect(btn).toBeDisabled();
  });
});
