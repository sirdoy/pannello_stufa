import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LightsRoomControl from '@/app/components/devices/lights/components/LightsRoomControl';
import type { AdaptiveClasses } from '@/app/components/devices/lights/hooks/useLightsData';

describe('LightsRoomControl', () => {
  const mockOnRoomToggle = jest.fn();
  const mockOnBrightnessChange = jest.fn();
  const mockOnNavigateToColors = jest.fn();
  const mockSetLocalBrightness = jest.fn();

  const mockAdaptive: AdaptiveClasses = {
    heading: '',
    text: '',
    textSecondary: '',
    badge: '',
    badgeGlow: '',
    statusOn: '',
    statusOff: '',
    buttonVariant: null,
    buttonClass: '',
    slider: '',
    brightnessPanel: '',
    brightnessValue: '',
  };

  const defaultProps = {
    selectedRoom: { id: 'room1', metadata: { name: 'Living Room' } },
    selectedRoomGroupedLightId: 'grouped-light-1',
    roomLights: [
      { id: 'light1', on: { on: true } },
      { id: 'light2', on: { on: false } },
    ],
    isRoomOn: true,
    lightsOnCount: 1,
    lightsOffCount: 1,
    allLightsOn: false,
    allLightsOff: false,
    avgBrightness: 75,
    localBrightness: null,
    setLocalBrightness: mockSetLocalBrightness,
    dynamicRoomStyle: null,
    contrastMode: 'default' as const,
    adaptive: mockAdaptive,
    hasColorLights: true,
    refreshing: false,
    onRoomToggle: mockOnRoomToggle,
    onBrightnessChange: mockOnBrightnessChange,
    onNavigateToColors: mockOnNavigateToColors,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Room Name Display', () => {
    it('shows room name when single light', () => {
      render(
        <LightsRoomControl
          {...defaultProps}
          roomLights={[{ id: 'light1', on: { on: true } }]}
        />
      );
      expect(screen.getByText('Living Room')).toBeInTheDocument();
    });

    it('does not show room name when multiple lights', () => {
      render(<LightsRoomControl {...defaultProps} />);
      expect(screen.queryByText('Living Room')).not.toBeInTheDocument();
    });
  });

  describe('ON Badge', () => {
    it('shows ON badge when room is on', () => {
      render(<LightsRoomControl {...defaultProps} isRoomOn={true} />);
      expect(screen.getByText(/acceso/i)).toBeInTheDocument();
    });

    it('does not show ON badge when room is off', () => {
      render(<LightsRoomControl {...defaultProps} isRoomOn={false} />);
      expect(screen.queryByText(/acceso/i)).not.toBeInTheDocument();
    });
  });

  describe('Lights Status Summary', () => {
    it('shows status summary when multiple lights', () => {
      render(<LightsRoomControl {...defaultProps} />);
      expect(screen.getByText('1 accese')).toBeInTheDocument();
      expect(screen.getByText('1 spente')).toBeInTheDocument();
    });

    it('does not show status summary when single light', () => {
      render(
        <LightsRoomControl
          {...defaultProps}
          roomLights={[{ id: 'light1', on: { on: true } }]}
        />
      );
      expect(screen.queryByText(/accese/i)).not.toBeInTheDocument();
    });
  });

  describe('On/Off Buttons - Mixed State', () => {
    it('shows both buttons when mixed state', () => {
      render(<LightsRoomControl {...defaultProps} />);
      expect(screen.getByRole('button', { name: /accendi tutte/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /spegni tutte/i })).toBeInTheDocument();
    });

    it('calls onRoomToggle(true) when accendi clicked', async () => {
      const user = userEvent.setup();
      render(<LightsRoomControl {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /accendi tutte/i }));
      expect(mockOnRoomToggle).toHaveBeenCalledWith('grouped-light-1', true);
    });

    it('calls onRoomToggle(false) when spegni clicked', async () => {
      const user = userEvent.setup();
      render(<LightsRoomControl {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /spegni tutte/i }));
      expect(mockOnRoomToggle).toHaveBeenCalledWith('grouped-light-1', false);
    });
  });

  describe('On/Off Buttons - All Off State', () => {
    const allOffProps = {
      ...defaultProps,
      isRoomOn: false,
      lightsOnCount: 0,
      lightsOffCount: 2,
      allLightsOff: true,
    };

    it('shows only Accendi button', () => {
      render(<LightsRoomControl {...allOffProps} />);
      expect(screen.getByRole('button', { name: /^accendi$/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /spegni/i })).not.toBeInTheDocument();
    });

    it('calls onRoomToggle(true) when clicked', async () => {
      const user = userEvent.setup();
      render(<LightsRoomControl {...allOffProps} />);

      await user.click(screen.getByRole('button', { name: /^accendi$/i }));
      expect(mockOnRoomToggle).toHaveBeenCalledWith('grouped-light-1', true);
    });
  });

  describe('On/Off Buttons - All On State', () => {
    const allOnProps = {
      ...defaultProps,
      lightsOnCount: 2,
      lightsOffCount: 0,
      allLightsOn: true,
    };

    it('shows only Spegni button', () => {
      render(<LightsRoomControl {...allOnProps} />);
      expect(screen.getByRole('button', { name: /^spegni$/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /accendi/i })).not.toBeInTheDocument();
    });

    it('calls onRoomToggle(false) when clicked', async () => {
      const user = userEvent.setup();
      render(<LightsRoomControl {...allOnProps} />);

      await user.click(screen.getByRole('button', { name: /^spegni$/i }));
      expect(mockOnRoomToggle).toHaveBeenCalledWith('grouped-light-1', false);
    });
  });

  describe('Brightness Control', () => {
    it('shows brightness panel when room is on', () => {
      render(<LightsRoomControl {...defaultProps} isRoomOn={true} />);
      expect(screen.getByText('Luminosità')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('does not show brightness panel when room is off', () => {
      render(<LightsRoomControl {...defaultProps} isRoomOn={false} />);
      expect(screen.queryByText('Luminosità')).not.toBeInTheDocument();
    });

    it('displays localBrightness when set', () => {
      render(<LightsRoomControl {...defaultProps} localBrightness={50} />);
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('displays avgBrightness when localBrightness is null', () => {
      render(<LightsRoomControl {...defaultProps} localBrightness={null} />);
      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('shows brightness controls when room is on', () => {
      render(<LightsRoomControl {...defaultProps} isRoomOn={true} />);
      // Slider is present (tested via aria-label)
      expect(screen.getByLabelText('Luminosita')).toBeInTheDocument();
    });
  });

  describe('Color Control Link', () => {
    it('shows color control when room is on and has color lights', () => {
      render(
        <LightsRoomControl
          {...defaultProps}
          isRoomOn={true}
          hasColorLights={true}
        />
      );
      expect(screen.getByRole('button', { name: /controllo colore/i })).toBeInTheDocument();
    });

    it('does not show color control when room is off', () => {
      render(
        <LightsRoomControl
          {...defaultProps}
          isRoomOn={false}
          hasColorLights={true}
        />
      );
      expect(screen.queryByRole('button', { name: /controllo colore/i })).not.toBeInTheDocument();
    });

    it('does not show color control when no color lights', () => {
      render(
        <LightsRoomControl
          {...defaultProps}
          isRoomOn={true}
          hasColorLights={false}
        />
      );
      expect(screen.queryByRole('button', { name: /controllo colore/i })).not.toBeInTheDocument();
    });

    it('calls onNavigateToColors when clicked', async () => {
      const user = userEvent.setup();
      render(
        <LightsRoomControl
          {...defaultProps}
          isRoomOn={true}
          hasColorLights={true}
        />
      );

      await user.click(screen.getByRole('button', { name: /controllo colore/i }));
      expect(mockOnNavigateToColors).toHaveBeenCalledTimes(1);
    });
  });

  describe('Dynamic Styling', () => {
    it('applies dynamicRoomStyle when provided', () => {
      const dynamicStyle = { backgroundColor: 'rgb(255, 0, 0)' };
      const { container } = render(
        <LightsRoomControl {...defaultProps} dynamicRoomStyle={dynamicStyle} />
      );
      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv.style.backgroundColor).toBe('rgb(255, 0, 0)');
    });

    it('applies adaptive classes to elements', () => {
      const adaptive: AdaptiveClasses = {
        heading: 'text-white',
        text: '',
        textSecondary: '',
        badge: 'bg-blue-500',
        badgeGlow: 'bg-blue-300',
        statusOn: 'custom-status-on',
        statusOff: 'custom-status-off',
        buttonVariant: 'outline',
        buttonClass: 'custom-button',
        slider: 'custom-slider',
        brightnessPanel: 'custom-panel',
        brightnessValue: 'text-blue-500',
      };
      render(
        <LightsRoomControl
          {...defaultProps}
          adaptive={adaptive}
          roomLights={[{ id: 'light1', on: { on: true } }]}
        />
      );
      // Check heading has adaptive class
      expect(screen.getByText('Living Room')).toHaveClass('text-white');
    });
  });

  describe('Disabled States', () => {
    it('disables buttons when refreshing', () => {
      render(<LightsRoomControl {...defaultProps} refreshing={true} />);
      expect(screen.getByRole('button', { name: /accendi tutte/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /spegni tutte/i })).toBeDisabled();
    });

    it('disables buttons when no selectedRoomGroupedLightId', () => {
      render(<LightsRoomControl {...defaultProps} selectedRoomGroupedLightId={null} />);
      expect(screen.getByRole('button', { name: /accendi tutte/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /spegni tutte/i })).toBeDisabled();
    });
  });
});
