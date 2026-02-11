/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent } from '@testing-library/react';
import InstallPrompt from '../InstallPrompt';
import * as useInstallPromptHook from '@/lib/hooks/useInstallPrompt';

// Mock the useInstallPrompt hook
jest.mock('@/lib/hooks/useInstallPrompt');

describe('InstallPrompt', () => {
  const mockInstall = jest.fn();
  const mockDismiss = jest.fn();

  const defaultHookReturn: ReturnType<typeof useInstallPromptHook.useInstallPrompt> = {
    canInstall: false,
    isIOS: false,
    install: mockInstall,
    dismiss: mockDismiss,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useInstallPromptHook.useInstallPrompt).mockReturnValue(defaultHookReturn);
  });

  it('renders nothing when canInstall is false', () => {
    const { container } = render(<InstallPrompt />);
    expect(container.firstChild).toBeNull();
  });

  it('renders bottom sheet when canInstall is true', () => {
    jest.mocked(useInstallPromptHook.useInstallPrompt).mockReturnValue({
      ...defaultHookReturn,
      canInstall: true,
    });

    render(<InstallPrompt />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Installa Pannello Stufa')).toBeInTheDocument();
  });

  it('displays benefits list', () => {
    jest.mocked(useInstallPromptHook.useInstallPrompt).mockReturnValue({
      ...defaultHookReturn,
      canInstall: true,
    });

    render(<InstallPrompt />);

    expect(screen.getByText('Funziona anche offline')).toBeInTheDocument();
    expect(screen.getByText('Notifiche push in tempo reale')).toBeInTheDocument();
    expect(screen.getByText('Accesso rapido dalla home screen')).toBeInTheDocument();
  });

  it('shows install button for non-iOS devices', () => {
    jest.mocked(useInstallPromptHook.useInstallPrompt).mockReturnValue({
      ...defaultHookReturn,
      canInstall: true,
      isIOS: false,
    });

    render(<InstallPrompt />);

    const installButton = screen.getByRole('button', { name: /installa/i });
    expect(installButton).toBeInTheDocument();
  });

  it('shows iOS instructions instead of install button for iOS devices', () => {
    jest.mocked(useInstallPromptHook.useInstallPrompt).mockReturnValue({
      ...defaultHookReturn,
      canInstall: true,
      isIOS: true,
    });

    render(<InstallPrompt />);

    expect(screen.getByText('Come installare:')).toBeInTheDocument();
    expect(screen.getByText(/tocca/i)).toBeInTheDocument();
    expect(screen.getByText(/aggiungi alla schermata home/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /installa/i })).not.toBeInTheDocument();
  });

  it('calls install() when install button is clicked', () => {
    mockInstall.mockResolvedValue(true);

    jest.mocked(useInstallPromptHook.useInstallPrompt).mockReturnValue({
      ...defaultHookReturn,
      canInstall: true,
      isIOS: false,
    });

    render(<InstallPrompt />);

    const installButton = screen.getByRole('button', { name: /installa/i });
    fireEvent.click(installButton);

    expect(mockInstall).toHaveBeenCalled();
  });

  it('calls dismiss() when user rejects native prompt', async () => {
    mockInstall.mockResolvedValue(false); // User dismissed

    jest.mocked(useInstallPromptHook.useInstallPrompt).mockReturnValue({
      ...defaultHookReturn,
      canInstall: true,
      isIOS: false,
    });

    render(<InstallPrompt />);

    const installButton = screen.getByRole('button', { name: /installa/i });
    fireEvent.click(installButton);

    // Wait for async install to resolve
    await screen.findByRole('dialog');

    expect(mockDismiss).toHaveBeenCalled();
  });

  it('does not call dismiss() when user accepts native prompt', async () => {
    mockInstall.mockResolvedValue(true); // User accepted

    jest.mocked(useInstallPromptHook.useInstallPrompt).mockReturnValue({
      ...defaultHookReturn,
      canInstall: true,
      isIOS: false,
    });

    render(<InstallPrompt />);

    const installButton = screen.getByRole('button', { name: /installa/i });
    fireEvent.click(installButton);

    // Wait for async install to resolve
    await screen.findByRole('dialog');

    expect(mockDismiss).not.toHaveBeenCalled();
  });

  it('calls dismiss() when "Non ora" button is clicked', () => {
    jest.mocked(useInstallPromptHook.useInstallPrompt).mockReturnValue({
      ...defaultHookReturn,
      canInstall: true,
    });

    render(<InstallPrompt />);

    const dismissButton = screen.getByRole('button', { name: /non ora/i });
    fireEvent.click(dismissButton);

    expect(mockDismiss).toHaveBeenCalled();
  });

  it('calls dismiss() when close X button is clicked', () => {
    jest.mocked(useInstallPromptHook.useInstallPrompt).mockReturnValue({
      ...defaultHookReturn,
      canInstall: true,
    });

    render(<InstallPrompt />);

    const closeButton = screen.getByRole('button', { name: /chiudi/i });
    fireEvent.click(closeButton);

    expect(mockDismiss).toHaveBeenCalled();
  });

  it('calls dismiss() when backdrop is clicked', () => {
    jest.mocked(useInstallPromptHook.useInstallPrompt).mockReturnValue({
      ...defaultHookReturn,
      canInstall: true,
    });

    const { container } = render(<InstallPrompt />);

    // Find backdrop (first fixed div before dialog)
    const backdrop = container.querySelector('.fixed.inset-0.z-\\[54\\]');
    expect(backdrop).toBeInTheDocument();

    if (backdrop) {
      fireEvent.click(backdrop);
    }

    expect(mockDismiss).toHaveBeenCalled();
  });

  it('has proper ARIA attributes for accessibility', () => {
    jest.mocked(useInstallPromptHook.useInstallPrompt).mockReturnValue({
      ...defaultHookReturn,
      canInstall: true,
    });

    render(<InstallPrompt />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-labelledby', 'install-prompt-title');
    expect(dialog).toHaveAttribute('aria-describedby', 'install-prompt-description');
  });

  it('shows "Non ora" button for iOS devices', () => {
    jest.mocked(useInstallPromptHook.useInstallPrompt).mockReturnValue({
      ...defaultHookReturn,
      canInstall: true,
      isIOS: true,
    });

    render(<InstallPrompt />);

    const dismissButton = screen.getByRole('button', { name: /non ora/i });
    expect(dismissButton).toBeInTheDocument();
  });
});
