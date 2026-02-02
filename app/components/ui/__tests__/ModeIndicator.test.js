import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ModeIndicator from '../ModeIndicator';

describe('ModeIndicator Component', () => {
  describe('Mode Display', () => {
    test('displays manual mode when enabled is false', () => {
      render(<ModeIndicator enabled={false} />);
      expect(screen.getByText('Manuale')).toBeInTheDocument();
      expect(screen.getByText('🔧')).toBeInTheDocument();
      // Design system uses ember variant for manual mode
      expect(screen.getByText('Manuale').className).toMatch(/text-ember/);
    });

    test('displays automatic mode when enabled is true', () => {
      render(<ModeIndicator enabled={true} />);
      expect(screen.getByText('Automatica')).toBeInTheDocument();
      expect(screen.getByText('⏰')).toBeInTheDocument();
      // Design system uses sage variant for automatic mode
      expect(screen.getByText('Automatica').className).toMatch(/text-sage/);
    });

    test('displays semi-manual mode when enabled and semiManual are true', () => {
      render(<ModeIndicator enabled={true} semiManual={true} />);
      expect(screen.getByText('Semi-manuale')).toBeInTheDocument();
      expect(screen.getByText('⚙️')).toBeInTheDocument();
      // Design system uses warning variant for semi-manual mode
      expect(screen.getByText('Semi-manuale').className).toMatch(/text-warning/);
    });
  });

  describe('Subtitle', () => {
    test('always shows "Modalità controllo" subtitle', () => {
      render(<ModeIndicator enabled={false} />);
      expect(screen.getByText('Modalità controllo')).toBeInTheDocument();
    });
  });

  describe('Config Button', () => {
    test('shows config button by default when onConfigClick provided', () => {
      const handleConfig = jest.fn();
      render(<ModeIndicator enabled={true} onConfigClick={handleConfig} />);
      expect(screen.getByRole('button', { name: /configura/i })).toBeInTheDocument();
    });

    test('calls onConfigClick when config button clicked', async () => {
      const handleConfig = jest.fn();
      const user = userEvent.setup();

      render(<ModeIndicator enabled={true} onConfigClick={handleConfig} />);
      const button = screen.getByRole('button', { name: /configura/i });

      await user.click(button);
      expect(handleConfig).toHaveBeenCalledTimes(1);
    });

    test('does not show config button when showConfigButton is false', () => {
      const handleConfig = jest.fn();
      render(
        <ModeIndicator
          enabled={true}
          onConfigClick={handleConfig}
          showConfigButton={false}
        />
      );
      expect(screen.queryByRole('button', { name: /configura/i })).not.toBeInTheDocument();
    });

    test('does not show config button when onConfigClick is not provided', () => {
      render(<ModeIndicator enabled={true} />);
      expect(screen.queryByRole('button', { name: /configura/i })).not.toBeInTheDocument();
    });
  });

  describe('Return to Auto Info', () => {
    test('shows return to auto time in semi-manual mode', () => {
      const returnDate = new Date('2025-10-10T18:30:00');
      render(
        <ModeIndicator
          enabled={true}
          semiManual={true}
          returnToAutoAt={returnDate.toISOString()}
        />
      );

      const returnInfo = screen.getByText(/ritorno automatico:/i);
      expect(returnInfo).toBeInTheDocument();
      expect(returnInfo).toHaveTextContent('10/10');
      expect(returnInfo).toHaveTextContent('18:30');
    });

    test('does not show return to auto time in automatic mode', () => {
      const returnDate = new Date('2025-10-10T18:30:00');
      render(
        <ModeIndicator
          enabled={true}
          semiManual={false}
          returnToAutoAt={returnDate.toISOString()}
        />
      );

      expect(screen.queryByText(/ritorno automatico:/i)).not.toBeInTheDocument();
    });

    test('does not show return to auto time in manual mode', () => {
      const returnDate = new Date('2025-10-10T18:30:00');
      render(
        <ModeIndicator
          enabled={false}
          returnToAutoAt={returnDate.toISOString()}
        />
      );

      expect(screen.queryByText(/ritorno automatico:/i)).not.toBeInTheDocument();
    });

    test('does not show return to auto time when not provided', () => {
      render(
        <ModeIndicator
          enabled={true}
          semiManual={true}
        />
      );

      expect(screen.queryByText(/ritorno automatico:/i)).not.toBeInTheDocument();
    });
  });

  describe('Compact Mode', () => {
    test('applies smaller icon in compact mode', () => {
      const { container } = render(<ModeIndicator enabled={true} compact={true} />);
      const icon = screen.getByText('⏰');
      expect(icon).toHaveClass('text-xl');
    });

    test('applies normal icon size in non-compact mode', () => {
      const { container } = render(<ModeIndicator enabled={true} compact={false} />);
      const icon = screen.getByText('⏰');
      expect(icon).toHaveClass('text-2xl');
    });
  });

  describe('Layout', () => {
    test('renders with flex layout', () => {
      const { container } = render(<ModeIndicator enabled={true} />);
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('flex');
      expect(wrapper).toHaveClass('items-center');
      expect(wrapper).toHaveClass('justify-between');
    });

    test('has proper gap in compact mode', () => {
      const { container } = render(<ModeIndicator enabled={true} compact={true} />);
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('gap-2');
    });
  });

  describe('Mode Icon and Color Combinations', () => {
    const testCases = [
      {
        name: 'Manual mode',
        props: { enabled: false },
        expectedIcon: '🔧',
        expectedColorPattern: /text-ember/,
        expectedLabel: 'Manuale'
      },
      {
        name: 'Automatic mode',
        props: { enabled: true, semiManual: false },
        expectedIcon: '⏰',
        expectedColorPattern: /text-sage/,
        expectedLabel: 'Automatica'
      },
      {
        name: 'Semi-manual mode',
        props: { enabled: true, semiManual: true },
        expectedIcon: '⚙️',
        expectedColorPattern: /text-warning/,
        expectedLabel: 'Semi-manuale'
      }
    ];

    testCases.forEach(({ name, props, expectedIcon, expectedColorPattern, expectedLabel }) => {
      test(`displays correct icon, color, and label for ${name}`, () => {
        render(<ModeIndicator {...props} />);

        expect(screen.getByText(expectedIcon)).toBeInTheDocument();
        expect(screen.getByText(expectedLabel)).toBeInTheDocument();
        expect(screen.getByText(expectedLabel).className).toMatch(expectedColorPattern);
      });
    });
  });
});
