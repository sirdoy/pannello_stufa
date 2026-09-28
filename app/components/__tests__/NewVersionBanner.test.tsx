/**
 * Tests for NewVersionBanner (M17)
 */

jest.mock('@/lib/hooks/useNewVersion', () => ({
  useNewVersion: jest.fn(),
  reloadToNewVersion: jest.fn(),
}));
jest.mock('@/app/context/WebSocketContext', () => ({
  useWebSocketContext: () => ({ readyState: 1 }),
}));

import { fireEvent, render, screen } from '@testing-library/react';
import NewVersionBanner from '../NewVersionBanner';
import { reloadToNewVersion, useNewVersion } from '@/lib/hooks/useNewVersion';

const mockUseNewVersion = jest.mocked(useNewVersion);

describe('NewVersionBanner', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders nothing while up to date', () => {
    mockUseNewVersion.mockReturnValue({ updateAvailable: false, checkNow: jest.fn() });
    const { container } = render(<NewVersionBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it('passes the WS open state and reloads on click', () => {
    mockUseNewVersion.mockReturnValue({ updateAvailable: true, checkNow: jest.fn() });
    render(<NewVersionBanner />);
    expect(mockUseNewVersion).toHaveBeenCalledWith(true);
    expect(screen.getByText('Nuova versione disponibile')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Ricarica' }));
    expect(reloadToNewVersion).toHaveBeenCalled();
  });

  it('can be dismissed', () => {
    mockUseNewVersion.mockReturnValue({ updateAvailable: true, checkNow: jest.fn() });
    render(<NewVersionBanner />);
    fireEvent.click(screen.getByRole('button', { name: 'Chiudi' }));
    expect(screen.queryByText('Nuova versione disponibile')).not.toBeInTheDocument();
  });
});
