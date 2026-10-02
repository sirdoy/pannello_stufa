/**
 * First-launch push question (workspace ROADMAP M48).
 */
import { act, fireEvent, render, screen } from '@testing-library/react';

const mockPathname = jest.fn(() => '/');
jest.mock('next/navigation', () => ({ usePathname: () => mockPathname() }));
const mockUser = jest.fn(() => ({ user: { sub: 'user:1' } as { sub: string } | undefined }));
jest.mock('@/lib/auth/useUser', () => ({ useUser: () => mockUser() }));
jest.mock('@/lib/push/pushClient', () => ({
  shouldAskForPush: jest.fn(),
  enablePush: jest.fn(),
  setChoice: jest.fn(),
}));

import NotificationOptInPrompt, { PROMPT_DELAY_MS } from '../NotificationOptInPrompt';
import { enablePush, setChoice, shouldAskForPush } from '@/lib/push/pushClient';

const ask = jest.mocked(shouldAskForPush);

function renderAndWait() {
  render(<NotificationOptInPrompt />);
  act(() => {
    jest.advanceTimersByTime(PROMPT_DELAY_MS);
  });
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  mockPathname.mockReturnValue('/');
  mockUser.mockReturnValue({ user: { sub: 'user:1' } });
  ask.mockReturnValue(true);
});

afterEach(() => {
  jest.useRealTimers();
});

it('asks once the user is signed in and no answer is stored', () => {
  renderAndWait();
  expect(screen.getByText('Vuoi ricevere le notifiche su questo dispositivo?')).toBeInTheDocument();
});

it.each([
  ['an answer is already stored', () => ask.mockReturnValue(false)],
  ['nobody is signed in', () => mockUser.mockReturnValue({ user: undefined })],
  ['on the login page', () => mockPathname.mockReturnValue('/auth/login')],
])('does not ask when %s', (_label, setup) => {
  setup();
  renderAndWait();
  expect(screen.queryByTestId('push-optin')).toBeNull();
});

it('"No, grazie" stores the refusal', () => {
  renderAndWait();
  fireEvent.click(screen.getByRole('button', { name: 'No, grazie' }));
  expect(setChoice).toHaveBeenCalledWith('disabled');
  expect(enablePush).not.toHaveBeenCalled();
});

it('"Attiva notifiche" enables push and closes', async () => {
  jest.mocked(enablePush).mockResolvedValue({ ok: true, subscriptionId: 3 });
  renderAndWait();
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Attiva notifiche' }));
  });
  expect(enablePush).toHaveBeenCalled();
  expect(screen.queryByRole('alert')).toBeNull();
});

it('shows the error and stays open when the registration fails', async () => {
  jest.mocked(enablePush).mockResolvedValue({ ok: false, reason: 'error', message: 'Server giù' });
  renderAndWait();
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Attiva notifiche' }));
  });
  expect(screen.getByRole('alert')).toHaveTextContent('Server giù');
});
