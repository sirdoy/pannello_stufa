import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LightsHouseControl from '@/app/components/devices/lights/components/LightsHouseControl';

describe('LightsHouseControl', () => {
  const mockOnToggle = jest.fn();

  const defaultProps = {
    hasAnyLights: true,
    totalLightsOn: 3,
    totalLights: 10,
    allHouseLightsOn: false,
    allHouseLightsOff: false,
    refreshing: false,
    onAllLightsToggle: mockOnToggle,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when hasAnyLights is false', () => {
    const { container } = render(
      <LightsHouseControl {...defaultProps} hasAnyLights={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders house icon and title', () => {
    render(<LightsHouseControl {...defaultProps} />);
    expect(screen.getByText('🏠')).toBeInTheDocument();
    expect(screen.getByText('Tutta la Casa')).toBeInTheDocument();
  });

  it('displays correct light count', () => {
    render(<LightsHouseControl {...defaultProps} />);
    expect(screen.getByText('3/10 accese')).toBeInTheDocument();
  });

  describe('Mixed State (some lights on, some off)', () => {
    it('shows both "Tutte" and "Spegni" buttons', () => {
      render(<LightsHouseControl {...defaultProps} />);
      expect(screen.getByRole('button', { name: /tutte/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /spegni/i })).toBeInTheDocument();
    });

    it('calls onAllLightsToggle(true) when "Tutte" clicked', async () => {
      const user = userEvent.setup();
      render(<LightsHouseControl {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /tutte/i }));
      expect(mockOnToggle).toHaveBeenCalledWith(true);
    });

    it('calls onAllLightsToggle(false) when "Spegni" clicked', async () => {
      const user = userEvent.setup();
      render(<LightsHouseControl {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /spegni/i }));
      expect(mockOnToggle).toHaveBeenCalledWith(false);
    });

    it('disables buttons when refreshing', () => {
      render(<LightsHouseControl {...defaultProps} refreshing={true} />);
      expect(screen.getByRole('button', { name: /tutte/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /spegni/i })).toBeDisabled();
    });
  });

  describe('All Lights Off State', () => {
    const allOffProps = {
      ...defaultProps,
      totalLightsOn: 0,
      allHouseLightsOff: true,
    };

    it('shows only "Accendi Tutte" button', () => {
      render(<LightsHouseControl {...allOffProps} />);
      expect(screen.getByRole('button', { name: /accendi tutte/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^spegni/i })).not.toBeInTheDocument();
    });

    it('calls onAllLightsToggle(true) when clicked', async () => {
      const user = userEvent.setup();
      render(<LightsHouseControl {...allOffProps} />);

      await user.click(screen.getByRole('button', { name: /accendi tutte/i }));
      expect(mockOnToggle).toHaveBeenCalledWith(true);
    });

    it('displays 0/10 accese', () => {
      render(<LightsHouseControl {...allOffProps} />);
      expect(screen.getByText('0/10 accese')).toBeInTheDocument();
    });
  });

  describe('All Lights On State', () => {
    const allOnProps = {
      ...defaultProps,
      totalLightsOn: 10,
      allHouseLightsOn: true,
    };

    it('shows only "Spegni Tutte" button', () => {
      render(<LightsHouseControl {...allOnProps} />);
      expect(screen.getByRole('button', { name: /spegni tutte/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /accendi/i })).not.toBeInTheDocument();
    });

    it('calls onAllLightsToggle(false) when clicked', async () => {
      const user = userEvent.setup();
      render(<LightsHouseControl {...allOnProps} />);

      await user.click(screen.getByRole('button', { name: /spegni tutte/i }));
      expect(mockOnToggle).toHaveBeenCalledWith(false);
    });

    it('displays 10/10 accese', () => {
      render(<LightsHouseControl {...allOnProps} />);
      expect(screen.getByText('10/10 accese')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles single light correctly', () => {
      render(
        <LightsHouseControl
          {...defaultProps}
          totalLightsOn={1}
          totalLights={1}
          allHouseLightsOn={true}
        />
      );
      expect(screen.getByText('1/1 accese')).toBeInTheDocument();
    });

    it('handles zero lights (should not render)', () => {
      const { container } = render(
        <LightsHouseControl {...defaultProps} totalLights={0} hasAnyLights={false} />
      );
      expect(container.firstChild).toBeNull();
    });
  });
});
