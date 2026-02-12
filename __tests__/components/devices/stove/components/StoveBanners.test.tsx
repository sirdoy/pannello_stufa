import { render, screen, fireEvent } from '@testing-library/react';
import StoveBanners from '@/app/components/devices/stove/components/StoveBanners';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('StoveBanners', () => {
  const mockOnConfirmCleaning = jest.fn();
  const mockOnNavigateToMaintenance = jest.fn();
  const mockRetry = jest.fn();

  const defaultProps = {
    errorCode: 0,
    errorDescription: '',
    needsMaintenance: false,
    maintenanceStatus: null,
    cleaningInProgress: false,
    isFirebaseConnected: true,
    hasPendingCommands: false,
    pendingCommands: [],
    igniteCmd: { lastError: null, retry: mockRetry },
    shutdownCmd: { lastError: null, retry: mockRetry },
    setFanCmd: { lastError: null, retry: mockRetry },
    setPowerCmd: { lastError: null, retry: mockRetry },
    onConfirmCleaning: mockOnConfirmCleaning,
    onNavigateToMaintenance: mockOnNavigateToMaintenance,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders error alert when errorCode > 0', () => {
    render(<StoveBanners {...defaultProps} errorCode={5} errorDescription="Test error" />);
    // ErrorAlert is rendered (check via text content)
    expect(screen.getByText('Allarme Stufa - Codice 5')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('renders maintenance banner when needsMaintenance is true', () => {
    const maintenanceStatus = { currentHours: 25.5, needsCleaning: true, percentage: 85, remainingHours: 4.5, isNearLimit: true, targetHours: 30, lastCleaning: null };
    render(<StoveBanners {...defaultProps} needsMaintenance={true} maintenanceStatus={maintenanceStatus} />);
    expect(screen.getByText('Pulizia Stufa Richiesta')).toBeInTheDocument();
    expect(screen.getByText(/25.5 ore/)).toBeInTheDocument();
  });

  it('renders Firebase banner when isFirebaseConnected is false', () => {
    render(<StoveBanners {...defaultProps} isFirebaseConnected={false} />);
    expect(screen.getByText('Connessione Firebase Interrotta')).toBeInTheDocument();
  });

  it('renders pending commands banner when hasPendingCommands is true', () => {
    render(<StoveBanners {...defaultProps} hasPendingCommands={true} pendingCommands={[{ id: '1' }, { id: '2' }]} />);
    expect(screen.getByText('Comandi in attesa')).toBeInTheDocument();
    expect(screen.getByText(/2 comandi/)).toBeInTheDocument();
  });

  it('renders retry banner when igniteCmd has lastError', () => {
    const error = new Error('Ignite failed');
    render(<StoveBanners {...defaultProps} igniteCmd={{ lastError: error, retry: mockRetry }} />);
    expect(screen.getByText('Ignite failed')).toBeInTheDocument();
    expect(screen.getByText('Riprova')).toBeInTheDocument();
  });

  it('renders retry banner when any command has lastError', () => {
    const error = new Error('Command failed');
    render(<StoveBanners {...defaultProps} setPowerCmd={{ lastError: error, retry: mockRetry }} />);
    expect(screen.getByText('Command failed')).toBeInTheDocument();
  });

  it('calls retry when Riprova button is clicked', () => {
    const error = new Error('Test error');
    render(<StoveBanners {...defaultProps} igniteCmd={{ lastError: error, retry: mockRetry }} />);
    const retryButton = screen.getByText('Riprova');
    fireEvent.click(retryButton);
    expect(mockRetry).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirmCleaning when cleaning button is clicked', () => {
    const maintenanceStatus = { currentHours: 25.5, needsCleaning: true, percentage: 85, remainingHours: 4.5, isNearLimit: true, targetHours: 30, lastCleaning: null };
    render(<StoveBanners {...defaultProps} needsMaintenance={true} maintenanceStatus={maintenanceStatus} />);
    const button = screen.getByText('✓ Ho Pulito');
    fireEvent.click(button);
    expect(mockOnConfirmCleaning).toHaveBeenCalledTimes(1);
  });

  it('calls onNavigateToMaintenance when settings button is clicked', () => {
    const maintenanceStatus = { currentHours: 25.5, needsCleaning: true, percentage: 85, remainingHours: 4.5, isNearLimit: true, targetHours: 30, lastCleaning: null };
    render(<StoveBanners {...defaultProps} needsMaintenance={true} maintenanceStatus={maintenanceStatus} />);
    const button = screen.getByText('⚙️ Impostazioni');
    fireEvent.click(button);
    expect(mockOnNavigateToMaintenance).toHaveBeenCalledTimes(1);
  });

  it('does NOT render any banners when all conditions are false', () => {
    const { container } = render(<StoveBanners {...defaultProps} />);
    // Should render an empty fragment or minimal content
    expect(container.textContent).toBe('');
  });
});
