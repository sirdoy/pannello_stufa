import { render, screen, fireEvent, act } from '@testing-library/react';
import { axe } from 'jest-axe';
import ControlButton, { controlButtonVariants } from '../ControlButton';

// Mock the vibration module
jest.mock('@/lib/pwa/vibration', () => ({
  vibrateShort: jest.fn(),
}));

import { vibrateShort } from '@/lib/pwa/vibration';

describe('ControlButton Component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Accessibility', () => {
    // Use real timers for axe tests
    beforeEach(() => {
      jest.useRealTimers();
    });

    test('increment button has no accessibility violations', async () => {
      const { container } = render(
        <ControlButton type="increment" onChange={() => {}} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('decrement button has no accessibility violations', async () => {
      const { container } = render(
        <ControlButton type="decrement" onChange={() => {}} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('disabled button has no accessibility violations', async () => {
      const { container } = render(
        <ControlButton type="increment" disabled onChange={() => {}} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('has correct aria-label for increment', () => {
      render(<ControlButton type="increment" onChange={() => {}} />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Incrementa');
    });

    test('has correct aria-label for decrement', () => {
      render(<ControlButton type="decrement" onChange={() => {}} />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Decrementa');
    });
  });

  describe('CVA Variants', () => {
    // Use real timers for non-timing tests
    beforeEach(() => {
      jest.useRealTimers();
    });

    test('ember variant renders with gradient classes', () => {
      render(<ControlButton variant="ember" onChange={() => {}} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-gradient-to-br');
      expect(button).toHaveClass('from-ember-500');
    });

    test('ocean variant renders with ocean gradient', () => {
      render(<ControlButton variant="ocean" onChange={() => {}} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-gradient-to-br');
      expect(button).toHaveClass('from-ocean-500');
    });

    test('sage variant renders with sage gradient', () => {
      render(<ControlButton variant="sage" onChange={() => {}} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-gradient-to-br');
      expect(button).toHaveClass('from-sage-500');
    });

    test('warning variant renders with warning gradient', () => {
      render(<ControlButton variant="warning" onChange={() => {}} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-gradient-to-br');
      expect(button).toHaveClass('from-warning-500');
    });

    test('danger variant renders with danger gradient', () => {
      render(<ControlButton variant="danger" onChange={() => {}} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-gradient-to-br');
      expect(button).toHaveClass('from-danger-500');
    });

    test('subtle variant renders with glass effect', () => {
      render(<ControlButton variant="subtle" onChange={() => {}} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-white/[0.06]');
    });

    test('size sm applies correct min-h class', () => {
      render(<ControlButton size="sm" onChange={() => {}} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('min-h-[44px]');
    });

    test('size md applies correct min-h class', () => {
      render(<ControlButton size="md" onChange={() => {}} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('min-h-[48px]');
    });

    test('size lg applies correct min-h class', () => {
      render(<ControlButton size="lg" onChange={() => {}} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('min-h-[56px]');
    });

    test('has touch-manipulation class for mobile optimization', () => {
      render(<ControlButton onChange={() => {}} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('touch-manipulation');
    });

    test('has select-none class to prevent text selection', () => {
      render(<ControlButton onChange={() => {}} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('select-none');
    });
  });

  describe('onChange with Step', () => {
    test('calls onChange with positive step for increment', () => {
      jest.useRealTimers();
      const onChange = jest.fn();
      render(<ControlButton type="increment" step={1} onChange={onChange} />);
      const button = screen.getByRole('button');

      fireEvent.mouseDown(button);
      fireEvent.mouseUp(button);

      expect(onChange).toHaveBeenCalledWith(1);
    });

    test('calls onChange with negative step for decrement', () => {
      jest.useRealTimers();
      const onChange = jest.fn();
      render(<ControlButton type="decrement" step={1} onChange={onChange} />);
      const button = screen.getByRole('button');

      fireEvent.mouseDown(button);
      fireEvent.mouseUp(button);

      expect(onChange).toHaveBeenCalledWith(-1);
    });

    test('uses custom step value for increment', () => {
      jest.useRealTimers();
      const onChange = jest.fn();
      render(<ControlButton type="increment" step={0.5} onChange={onChange} />);
      const button = screen.getByRole('button');

      fireEvent.mouseDown(button);
      fireEvent.mouseUp(button);

      expect(onChange).toHaveBeenCalledWith(0.5);
    });

    test('uses custom step value for decrement', () => {
      jest.useRealTimers();
      const onChange = jest.fn();
      render(<ControlButton type="decrement" step={0.5} onChange={onChange} />);
      const button = screen.getByRole('button');

      fireEvent.mouseDown(button);
      fireEvent.mouseUp(button);

      expect(onChange).toHaveBeenCalledWith(-0.5);
    });
  });

  describe('Long Press Behavior', () => {
    test('triggers repeat after delay on long press', () => {
      const onChange = jest.fn();
      render(
        <ControlButton
          type="increment"
          step={1}
          longPressDelay={400}
          longPressInterval={100}
          onChange={onChange}
        />
      );
      const button = screen.getByRole('button');

      act(() => {
        fireEvent.mouseDown(button);
      });

      // Initial call
      expect(onChange).toHaveBeenCalledTimes(1);

      // Advance past delay + 2 intervals
      act(() => {
        jest.advanceTimersByTime(600);
      });

      // Initial + 2 intervals = 3 calls
      expect(onChange).toHaveBeenCalledTimes(3);

      act(() => {
        fireEvent.mouseUp(button);
      });
    });

    test('stops repeating on mouseup', () => {
      const onChange = jest.fn();
      render(<ControlButton type="increment" onChange={onChange} />);
      const button = screen.getByRole('button');

      act(() => {
        fireEvent.mouseDown(button);
      });

      expect(onChange).toHaveBeenCalledTimes(1);

      act(() => {
        fireEvent.mouseUp(button);
      });

      // Advance time - should not call again
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(onChange).toHaveBeenCalledTimes(1);
    });

    test('uses custom longPressDelay', () => {
      const onChange = jest.fn();
      render(
        <ControlButton
          type="increment"
          longPressDelay={200}
          longPressInterval={100}
          onChange={onChange}
        />
      );
      const button = screen.getByRole('button');

      act(() => {
        fireEvent.mouseDown(button);
      });

      // Initial call
      expect(onChange).toHaveBeenCalledTimes(1);

      // Advance 350ms (past 200ms delay + 100ms + 50ms buffer)
      act(() => {
        jest.advanceTimersByTime(350);
      });

      // Should have repeated at least once (initial + at least 1 interval)
      expect(onChange.mock.calls.length).toBeGreaterThanOrEqual(2);

      act(() => {
        fireEvent.mouseUp(button);
      });
    });
  });

  describe('Disabled State', () => {
    test('disabled button is disabled', () => {
      jest.useRealTimers();
      render(<ControlButton disabled onChange={() => {}} />);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    test('disabled button does not call onChange', () => {
      const onChange = jest.fn();
      render(<ControlButton disabled onChange={onChange} />);
      const button = screen.getByRole('button');

      act(() => {
        fireEvent.mouseDown(button);
      });

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(onChange).not.toHaveBeenCalled();
    });

    test('disabled state has correct classes', () => {
      jest.useRealTimers();
      render(<ControlButton disabled onChange={() => {}} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('disabled:opacity-50');
      expect(button).toHaveClass('disabled:cursor-not-allowed');
    });
  });

  describe('Haptic Feedback', () => {
    test('calls vibrateShort when haptic=true (default)', () => {
      const onChange = jest.fn();
      render(<ControlButton onChange={onChange} />);
      const button = screen.getByRole('button');

      act(() => {
        fireEvent.mouseDown(button);
      });

      expect(vibrateShort).toHaveBeenCalledTimes(1);

      act(() => {
        fireEvent.mouseUp(button);
      });
    });

    test('does not call vibrateShort when haptic=false', () => {
      const onChange = jest.fn();
      render(<ControlButton haptic={false} onChange={onChange} />);
      const button = screen.getByRole('button');

      act(() => {
        fireEvent.mouseDown(button);
      });

      expect(vibrateShort).not.toHaveBeenCalled();

      act(() => {
        fireEvent.mouseUp(button);
      });
    });
  });

  describe('Legacy onClick Support', () => {
    test('calls onClick when provided (legacy)', () => {
      jest.useRealTimers();
      const onClick = jest.fn();
      // Suppress console.warn for this test
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      render(<ControlButton onClick={onClick} />);
      const button = screen.getByRole('button');

      fireEvent.mouseDown(button);
      fireEvent.mouseUp(button);

      expect(onClick).toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });

  describe('Symbol Display', () => {
    test('shows + symbol for increment', () => {
      jest.useRealTimers();
      render(<ControlButton type="increment" onChange={() => {}} />);
      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('+');
    });

    test('shows - symbol for decrement', () => {
      jest.useRealTimers();
      render(<ControlButton type="decrement" onChange={() => {}} />);
      const button = screen.getByRole('button');
      // Uses minus sign (Unicode 2212)
      expect(button.textContent).toMatch(/[−-]/);
    });
  });

  describe('Focus Ring', () => {
    test('has focus-visible:ring-2 class', () => {
      jest.useRealTimers();
      render(<ControlButton onChange={() => {}} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus-visible:ring-2');
    });

    test('has focus-visible:ring-ember-500/50 class for ember glow', () => {
      jest.useRealTimers();
      render(<ControlButton onChange={() => {}} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus-visible:ring-ember-500/50');
    });
  });

  describe('Ref Forwarding', () => {
    test('forwards ref to button element', () => {
      jest.useRealTimers();
      const ref = { current: null };
      render(<ControlButton ref={ref} onChange={() => {}} />);
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });
  });

  describe('Custom className', () => {
    test('applies custom className', () => {
      jest.useRealTimers();
      render(<ControlButton className="custom-class" onChange={() => {}} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });
  });

  describe('Exports', () => {
    test('controlButtonVariants is exported', () => {
      expect(controlButtonVariants).toBeDefined();
      expect(typeof controlButtonVariants).toBe('function');
    });

    test('controlButtonVariants returns class string', () => {
      const classes = controlButtonVariants({ variant: 'ember', size: 'md' });
      expect(typeof classes).toBe('string');
      expect(classes).toContain('from-ember-500');
    });
  });
});
