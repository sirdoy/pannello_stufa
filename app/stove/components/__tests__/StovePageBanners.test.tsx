import { render, screen } from '@testing-library/react';
import StovePageBanners, { type StovePageBannersProps } from '../StovePageBanners';

const baseProps: StovePageBannersProps = {
  errorCode: 0,
  errorDescription: '',
  pelletLow: false,
  needsMaintenance: false,
  maintenanceStatus: null,
  cleaningInProgress: false,
  hasPendingCommands: false,
  pendingCommands: [],
  onConfirmCleaning: jest.fn(),
  onNavigateToMaintenance: jest.fn(),
};

// ROADMAP D11: reserve sensor of the stove, read by the Pi from the local WiNet module.
describe('StovePageBanners — pellet reserve', () => {
  it('shows the warning when the reserve is low', () => {
    render(<StovePageBanners {...baseProps} pelletLow />);

    expect(screen.getByTestId('stove-pellet-low-banner')).toBeInTheDocument();
    expect(screen.getByText('Pellet in riserva')).toBeInTheDocument();
    expect(screen.getByText(/ricarica il serbatoio/)).toBeInTheDocument();
  });

  it('shows nothing when the reserve is ok', () => {
    render(<StovePageBanners {...baseProps} />);

    expect(screen.queryByTestId('stove-pellet-low-banner')).toBeNull();
  });
});

// ROADMAP M78: a failed status read keeps the last state and says so.
describe('StovePageBanners — unreachable stove', () => {
  it('shows the warning when the last read failed', () => {
    render(<StovePageBanners {...baseProps} unreachable />);

    expect(screen.getByTestId('stove-unreachable-banner')).toBeInTheDocument();
    expect(screen.getByText('Stufa non raggiungibile')).toBeInTheDocument();
  });

  it('shows nothing when the stove answers', () => {
    render(<StovePageBanners {...baseProps} />);

    expect(screen.queryByTestId('stove-unreachable-banner')).toBeNull();
  });
});
