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
