import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StoveModeControl from '@/app/components/devices/stove/components/StoveModeControl';

// Mock CronHealthBanner
jest.mock('@/app/components/CronHealthBanner', () => ({
  __esModule: true,
  default: ({ variant }: { variant: string }) => (
    <div data-testid="cron-health-banner">CronHealthBanner-{variant}</div>
  ),
}));

describe('StoveModeControl', () => {
  const mockProps = {
    schedulerEnabled: false,
    semiManualMode: false,
    returnToAutoAt: null,
    nextScheduledAction: null,
    onSetManualMode: jest.fn(),
    onSetAutomaticMode: jest.fn(),
    onClearSemiManual: jest.fn(),
    onNavigateToScheduler: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders "Modalità Controllo" divider label', () => {
    render(<StoveModeControl {...mockProps} />);
    expect(screen.getByText('Modalità Controllo')).toBeInTheDocument();
  });

  it('renders Manuale button with ember variant when schedulerEnabled=false', () => {
    render(<StoveModeControl {...mockProps} schedulerEnabled={false} />);
    const manualeButton = screen.getByRole('button', { name: 'Manuale' });
    expect(manualeButton).toBeInTheDocument();
    expect(manualeButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('renders Automatica button with ember variant when schedulerEnabled=true and semiManualMode=false', () => {
    render(<StoveModeControl {...mockProps} schedulerEnabled={true} semiManualMode={false} />);
    const automaticaButton = screen.getByRole('button', { name: 'Automatica' });
    expect(automaticaButton).toBeInTheDocument();
    expect(automaticaButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('renders Semi-man. button with ember variant when schedulerEnabled=true and semiManualMode=true', () => {
    render(<StoveModeControl {...mockProps} schedulerEnabled={true} semiManualMode={true} />);
    const semiManButton = screen.getByRole('button', { name: 'Semi-man.' });
    expect(semiManButton).toBeInTheDocument();
    expect(semiManButton).toHaveAttribute('aria-pressed', 'true');
    expect(semiManButton).toBeDisabled();
  });

  it('renders "Torna in Automatico" button when semiManualMode=true', () => {
    render(<StoveModeControl {...mockProps} schedulerEnabled={true} semiManualMode={true} returnToAutoAt={Date.now() + 3600000} />);
    const tornaButton = screen.getByRole('button', { name: 'Torna alla modalita automatica' });
    expect(tornaButton).toBeInTheDocument();
  });

  it('renders next scheduled action time when schedulerEnabled and nextScheduledAction provided', () => {
    const nextAction = {
      action: 'ignite',
      timestamp: new Date('2026-02-12T18:00:00').getTime(),
      power: 3,
      fan: 4,
    };
    render(<StoveModeControl {...mockProps} schedulerEnabled={true} nextScheduledAction={nextAction} />);
    expect(screen.getByText('🔥 Accensione')).toBeInTheDocument();
    expect(screen.getByText(/18:00/)).toBeInTheDocument();
  });

  it('renders shutdown action in next scheduled display', () => {
    const nextAction = {
      action: 'shutdown',
      timestamp: new Date('2026-02-12T22:00:00').getTime(),
    };
    render(<StoveModeControl {...mockProps} schedulerEnabled={true} nextScheduledAction={nextAction} />);
    expect(screen.getByText('❄️ Spegnimento')).toBeInTheDocument();
  });

  it('calls onSetManualMode when Manuale button clicked', async () => {
    const user = userEvent.setup();
    render(<StoveModeControl {...mockProps} schedulerEnabled={true} />);
    const manualeButton = screen.getByRole('button', { name: 'Manuale' });
    await user.click(manualeButton);
    expect(mockProps.onSetManualMode).toHaveBeenCalledTimes(1);
  });

  it('calls onSetAutomaticMode when Automatica button clicked', async () => {
    const user = userEvent.setup();
    render(<StoveModeControl {...mockProps} schedulerEnabled={false} />);
    const automaticaButton = screen.getByRole('button', { name: 'Automatica' });
    await user.click(automaticaButton);
    expect(mockProps.onSetAutomaticMode).toHaveBeenCalledTimes(1);
  });

  it('calls onClearSemiManual when Torna in Automatico button clicked', async () => {
    const user = userEvent.setup();
    render(<StoveModeControl {...mockProps} schedulerEnabled={true} semiManualMode={true} returnToAutoAt={Date.now() + 3600000} />);
    const tornaButton = screen.getByRole('button', { name: 'Torna alla modalita automatica' });
    await user.click(tornaButton);
    expect(mockProps.onClearSemiManual).toHaveBeenCalledTimes(1);
  });

  it('calls onNavigateToScheduler when Configura Pianificazione button clicked', async () => {
    const user = userEvent.setup();
    render(<StoveModeControl {...mockProps} />);
    const configButton = screen.getByRole('button', { name: 'Vai alle impostazioni di pianificazione' });
    await user.click(configButton);
    expect(mockProps.onNavigateToScheduler).toHaveBeenCalledTimes(1);
  });

  it('renders CronHealthBanner component', () => {
    render(<StoveModeControl {...mockProps} />);
    expect(screen.getByTestId('cron-health-banner')).toBeInTheDocument();
    expect(screen.getByText('CronHealthBanner-inline')).toBeInTheDocument();
  });

  it('displays returnToAutoAt time when in semi-manual mode', () => {
    const returnTime = new Date('2026-02-13T15:30:00').getTime();
    render(<StoveModeControl {...mockProps} schedulerEnabled={true} semiManualMode={true} returnToAutoAt={returnTime} />);
    expect(screen.getByText(/Ritorno auto:/)).toBeInTheDocument();
    expect(screen.getByText(/15:30/)).toBeInTheDocument();
  });

  it('displays "Controllo automatico attivo" when schedulerEnabled without nextAction', () => {
    render(<StoveModeControl {...mockProps} schedulerEnabled={true} />);
    expect(screen.getByText('Controllo automatico attivo')).toBeInTheDocument();
  });

  it('displays "Controllo manuale attivo" when schedulerEnabled=false', () => {
    render(<StoveModeControl {...mockProps} schedulerEnabled={false} />);
    expect(screen.getByText('Controllo manuale attivo')).toBeInTheDocument();
  });
});
