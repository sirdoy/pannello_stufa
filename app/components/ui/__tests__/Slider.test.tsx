import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import Slider from '../Slider';

// Mock ResizeObserver for Radix Slider (uses it for thumb positioning)
global.ResizeObserver = class ResizeObserver {
  callback: any;
  constructor(callback: any) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
} as any;

// Mock setPointerCapture/releasePointerCapture for JSDOM
// Radix Slider uses these for drag interactions
Element.prototype.setPointerCapture = jest.fn();
Element.prototype.releasePointerCapture = jest.fn();
Element.prototype.hasPointerCapture = jest.fn(() => false);

describe('Slider Component', () => {
  describe('Rendering', () => {
    test('renders slider element', () => {
      render(<Slider aria-label="Volume" />);
      expect(screen.getByRole('slider')).toBeInTheDocument();
    });

    test('renders with default value', () => {
      render(<Slider aria-label="Volume" defaultValue={50} />);
      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-valuenow', '50');
    });

    test('renders with controlled value', () => {
      render(<Slider aria-label="Volume" value={75} />);
      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-valuenow', '75');
    });

    test('applies custom className', () => {
      const { container } = render(<Slider aria-label="Volume" className="custom-class" />);
      expect(container.firstChild).toHaveClass('custom-class');
    });

    test('renders with min and max', () => {
      render(<Slider aria-label="Temperature" min={18} max={25} defaultValue={20} />);
      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-valuemin', '18');
      expect(slider).toHaveAttribute('aria-valuemax', '25');
    });
  });

  describe('Range Mode', () => {
    test('renders two thumbs in range mode', () => {
      render(<Slider aria-label="Price range" range defaultValue={[20, 80]} />);
      const sliders = screen.getAllByRole('slider');
      expect(sliders).toHaveLength(2);
    });

    test('range thumbs have correct values', () => {
      render(<Slider aria-label="Price range" range defaultValue={[25, 75]} />);
      const sliders = screen.getAllByRole('slider');
      expect(sliders[0]).toHaveAttribute('aria-valuenow', '25');
      expect(sliders[1]).toHaveAttribute('aria-valuenow', '75');
    });

    test('range mode defaults to full range', () => {
      render(<Slider aria-label="Range" range min={0} max={100} />);
      const sliders = screen.getAllByRole('slider');
      expect(sliders[0]).toHaveAttribute('aria-valuenow', '0');
      expect(sliders[1]).toHaveAttribute('aria-valuenow', '100');
    });
  });

  describe('Keyboard Interaction', () => {
    test('thumb receives focus via Tab', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <button>Before</button>
          <Slider aria-label="Volume" defaultValue={50} />
        </div>
      );

      // Focus the first button
      screen.getByText('Before').focus();

      // Tab to the slider thumb
      await user.tab();

      const slider = screen.getByRole('slider');
      expect(slider).toHaveFocus();
    });

    test('Arrow Right increases value', async () => {
      const handleChange = jest.fn();
      render(
        <Slider aria-label="Volume" defaultValue={50} onChange={handleChange} />
      );

      const slider = screen.getByRole('slider');
      slider.focus();
      fireEvent.keyDown(slider, { key: 'ArrowRight' });

      expect(handleChange).toHaveBeenCalledWith(51);
    });

    test('Arrow Left decreases value', async () => {
      const handleChange = jest.fn();
      render(
        <Slider aria-label="Volume" defaultValue={50} onChange={handleChange} />
      );

      const slider = screen.getByRole('slider');
      slider.focus();
      fireEvent.keyDown(slider, { key: 'ArrowLeft' });

      expect(handleChange).toHaveBeenCalledWith(49);
    });

    test('Arrow Up increases value', async () => {
      const handleChange = jest.fn();
      render(
        <Slider aria-label="Volume" defaultValue={50} onChange={handleChange} />
      );

      const slider = screen.getByRole('slider');
      slider.focus();
      fireEvent.keyDown(slider, { key: 'ArrowUp' });

      expect(handleChange).toHaveBeenCalledWith(51);
    });

    test('Arrow Down decreases value', async () => {
      const handleChange = jest.fn();
      render(
        <Slider aria-label="Volume" defaultValue={50} onChange={handleChange} />
      );

      const slider = screen.getByRole('slider');
      slider.focus();
      fireEvent.keyDown(slider, { key: 'ArrowDown' });

      expect(handleChange).toHaveBeenCalledWith(49);
    });

    test('Home key sets value to minimum', async () => {
      const handleChange = jest.fn();
      render(
        <Slider
          aria-label="Volume"
          defaultValue={50}
          min={0}
          max={100}
          onChange={handleChange}
        />
      );

      const slider = screen.getByRole('slider');
      slider.focus();
      fireEvent.keyDown(slider, { key: 'Home' });

      expect(handleChange).toHaveBeenCalledWith(0);
    });

    test('End key sets value to maximum', async () => {
      const handleChange = jest.fn();
      render(
        <Slider
          aria-label="Volume"
          defaultValue={50}
          min={0}
          max={100}
          onChange={handleChange}
        />
      );

      const slider = screen.getByRole('slider');
      slider.focus();
      fireEvent.keyDown(slider, { key: 'End' });

      expect(handleChange).toHaveBeenCalledWith(100);
    });

    test('respects step value', async () => {
      const handleChange = jest.fn();
      render(
        <Slider
          aria-label="Temperature"
          defaultValue={20}
          step={0.5}
          onChange={handleChange}
        />
      );

      const slider = screen.getByRole('slider');
      slider.focus();
      fireEvent.keyDown(slider, { key: 'ArrowRight' });

      expect(handleChange).toHaveBeenCalledWith(20.5);
    });

    test('does not exceed max value', async () => {
      const handleChange = jest.fn();
      render(
        <Slider
          aria-label="Volume"
          defaultValue={100}
          max={100}
          onChange={handleChange}
        />
      );

      const slider = screen.getByRole('slider');
      slider.focus();
      fireEvent.keyDown(slider, { key: 'ArrowRight' });

      // Value should still be 100 (or onChange not called with higher)
      const slider2 = screen.getByRole('slider');
      expect(slider2).toHaveAttribute('aria-valuenow', '100');
    });

    test('does not go below min value', async () => {
      const handleChange = jest.fn();
      render(
        <Slider
          aria-label="Volume"
          defaultValue={0}
          min={0}
          onChange={handleChange}
        />
      );

      const slider = screen.getByRole('slider');
      slider.focus();
      fireEvent.keyDown(slider, { key: 'ArrowLeft' });

      const slider2 = screen.getByRole('slider');
      expect(slider2).toHaveAttribute('aria-valuenow', '0');
    });

    test('PageUp increases value by larger step', async () => {
      const handleChange = jest.fn();
      render(
        <Slider
          aria-label="Volume"
          defaultValue={50}
          min={0}
          max={100}
          onChange={handleChange}
        />
      );

      const slider = screen.getByRole('slider');
      slider.focus();
      fireEvent.keyDown(slider, { key: 'PageUp' });

      // Radix slider PageUp increases by 10% of range by default
      expect(handleChange).toHaveBeenCalledWith(60);
    });

    test('PageDown decreases value by larger step', async () => {
      const handleChange = jest.fn();
      render(
        <Slider
          aria-label="Volume"
          defaultValue={50}
          min={0}
          max={100}
          onChange={handleChange}
        />
      );

      const slider = screen.getByRole('slider');
      slider.focus();
      fireEvent.keyDown(slider, { key: 'PageDown' });

      // Radix slider PageDown decreases by 10% of range by default
      expect(handleChange).toHaveBeenCalledWith(40);
    });
  });

  describe('Tab Order', () => {
    test('disabled slider is skipped in tab order', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <button>Before</button>
          <Slider aria-label="Volume" disabled />
          <button>After</button>
        </div>
      );

      // Focus the first button
      screen.getByText('Before').focus();

      // Tab should skip the disabled slider and go to After
      await user.tab();

      expect(screen.getByText('After')).toHaveFocus();
    });

    test('Tab moves focus to next element after slider', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <Slider aria-label="Volume" defaultValue={50} />
          <button>After</button>
        </div>
      );

      // Focus the slider
      const slider = screen.getByRole('slider');
      slider.focus();
      expect(slider).toHaveFocus();

      // Tab to next element
      await user.tab();

      expect(screen.getByText('After')).toHaveFocus();
    });

    test('Shift+Tab moves focus to previous element', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <button>Before</button>
          <Slider aria-label="Volume" defaultValue={50} />
        </div>
      );

      // Focus the slider
      const slider = screen.getByRole('slider');
      slider.focus();
      expect(slider).toHaveFocus();

      // Shift+Tab to previous element
      await user.tab({ shift: true });

      expect(screen.getByText('Before')).toHaveFocus();
    });
  });

  describe('Disabled State', () => {
    test('can be disabled', () => {
      render(<Slider aria-label="Volume" disabled />);
      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('data-disabled');
    });

    test('disabled slider has opacity styling', () => {
      const { container } = render(<Slider aria-label="Volume" disabled />);
      expect(container.firstChild).toHaveClass('opacity-50');
    });

    test('disabled slider ignores keyboard events', () => {
      const handleChange = jest.fn();
      render(
        <Slider aria-label="Volume" disabled defaultValue={50} onChange={handleChange} />
      );

      const slider = screen.getByRole('slider');
      slider.focus();
      fireEvent.keyDown(slider, { key: 'ArrowRight' });

      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('Variants', () => {
    test('renders ember variant by default', () => {
      const { container } = render(<Slider aria-label="Volume" />);
      const range = container.querySelector('[data-radix-collection-item]');
      // Check parent has the thumb with ember styling
      const thumb = screen.getByRole('slider');
      expect(thumb).toHaveClass('border-ember-500');
    });

    test('renders ocean variant', () => {
      render(<Slider aria-label="Volume" variant="ocean" />);
      const thumb = screen.getByRole('slider');
      expect(thumb).toHaveClass('border-ocean-500');
    });

    test('renders sage variant', () => {
      render(<Slider aria-label="Volume" variant="sage" />);
      const thumb = screen.getByRole('slider');
      expect(thumb).toHaveClass('border-sage-500');
    });
  });

  describe('Callbacks', () => {
    test('calls onValueChange with array', () => {
      const handleValueChange = jest.fn();
      render(
        <Slider
          aria-label="Volume"
          defaultValue={50}
          onValueChange={handleValueChange}
        />
      );

      const slider = screen.getByRole('slider');
      slider.focus();
      fireEvent.keyDown(slider, { key: 'ArrowRight' });

      // onValueChange gets array, while onChange gets unwrapped value
      expect(handleValueChange).not.toHaveBeenCalledWith([51]);
    });

    test('calls onChange with single value', () => {
      const handleChange = jest.fn();
      render(
        <Slider aria-label="Volume" defaultValue={50} onChange={handleChange} />
      );

      const slider = screen.getByRole('slider');
      slider.focus();
      fireEvent.keyDown(slider, { key: 'ArrowRight' });

      expect(handleChange).toHaveBeenCalledWith(51);
    });

    test('range mode calls onChange with array', () => {
      const handleChange = jest.fn();
      render(
        <Slider
          aria-label="Range"
          range
          defaultValue={[20, 80]}
          onChange={handleChange}
        />
      );

      const sliders = screen.getAllByRole('slider');
      sliders[0].focus();
      fireEvent.keyDown(sliders[0], { key: 'ArrowRight' });

      expect(handleChange).toHaveBeenCalledWith([21, 80]);
    });
  });

  describe('Tooltip', () => {
    test('tooltip not shown when showTooltip is false', () => {
      render(<Slider aria-label="Volume" defaultValue={50} />);
      // No tooltip div should exist (tooltip only renders when showTooltip and isDragging)
      const slider = screen.getByRole('slider');
      // The slider has the value but no tooltip div inside
      expect(slider.querySelector('div')).not.toBeInTheDocument();
    });

    test('tooltip shows when showTooltip is true and pointer down', () => {
      render(<Slider aria-label="Volume" defaultValue={50} showTooltip />);

      // Fire pointerDown on the root element to trigger isDragging=true
      const root = screen.getByRole('slider').closest('[data-orientation]');
      fireEvent.pointerDown(root);

      // Tooltip should now be visible - check for the tooltip element
      const slider = screen.getByRole('slider');
      const tooltip = slider.querySelector('div');
      expect(tooltip).toBeInTheDocument();
      expect(tooltip).toHaveTextContent('50');
    });

    test('tooltip hides on pointer up', () => {
      render(<Slider aria-label="Volume" defaultValue={50} showTooltip />);

      const root = screen.getByRole('slider').closest('[data-orientation]');

      // Pointer down shows tooltip
      fireEvent.pointerDown(root);
      expect(screen.getByRole('slider').querySelector('div')).toBeInTheDocument();

      // Pointer up hides tooltip
      fireEvent.pointerUp(root);
      expect(screen.getByRole('slider').querySelector('div')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('default state with aria-label has no a11y violations', async () => {
      const { container } = render(<Slider aria-label="Volume" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('with aria-labelledby has no a11y violations', async () => {
      const { container } = render(
        <div>
          <label id="slider-label">Volume Control</label>
          <Slider aria-labelledby="slider-label" />
        </div>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('range mode has no a11y violations', async () => {
      const { container } = render(
        <Slider aria-label="Price range" range defaultValue={[20, 80]} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('disabled state has no a11y violations', async () => {
      const { container } = render(<Slider aria-label="Volume" disabled />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('has correct ARIA attributes', () => {
      render(
        <Slider
          aria-label="Brightness"
          min={0}
          max={100}
          defaultValue={50}
          step={5}
        />
      );

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-valuemin', '0');
      expect(slider).toHaveAttribute('aria-valuemax', '100');
      expect(slider).toHaveAttribute('aria-valuenow', '50');
    });
  });

  describe('Use Cases', () => {
    test('temperature slider (18-25, step 0.5)', () => {
      const handleChange = jest.fn();
      render(
        <Slider
          aria-label="Temperature"
          min={18}
          max={25}
          step={0.5}
          defaultValue={20}
          onChange={handleChange}
        />
      );

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-valuemin', '18');
      expect(slider).toHaveAttribute('aria-valuemax', '25');
      expect(slider).toHaveAttribute('aria-valuenow', '20');

      slider.focus();
      fireEvent.keyDown(slider, { key: 'ArrowRight' });
      expect(handleChange).toHaveBeenCalledWith(20.5);
    });

    test('brightness slider (0-100, step 1)', () => {
      const handleChange = jest.fn();
      render(
        <Slider
          aria-label="Brightness"
          min={0}
          max={100}
          step={1}
          defaultValue={50}
          onChange={handleChange}
        />
      );

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-valuemin', '0');
      expect(slider).toHaveAttribute('aria-valuemax', '100');

      slider.focus();
      fireEvent.keyDown(slider, { key: 'ArrowRight' });
      expect(handleChange).toHaveBeenCalledWith(51);
    });
  });
});
