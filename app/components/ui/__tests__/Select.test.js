import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Select from '../Select';

describe('Select Component', () => {
  const mockOptions = [
    { value: 1, label: 'Option 1' },
    { value: 2, label: 'Option 2' },
    { value: 3, label: 'Option 3' },
  ];

  describe('Rendering', () => {
    test('renders with label', () => {
      render(
        <Select
          label="Test Label"
          options={mockOptions}
          value={1}
          onChange={jest.fn()}
        />
      );
      expect(screen.getByText('Test Label')).toBeInTheDocument();
    });

    test('renders without label', () => {
      render(
        <Select
          options={mockOptions}
          value={1}
          onChange={jest.fn()}
        />
      );
      expect(screen.queryByRole('label')).not.toBeInTheDocument();
    });

    test('renders with icon in label', () => {
      render(
        <Select
          label="Test Label"
          icon="🔥"
          options={mockOptions}
          value={1}
          onChange={jest.fn()}
        />
      );
      expect(screen.getByText('🔥')).toBeInTheDocument();
    });

    test('displays selected option', () => {
      render(
        <Select
          options={mockOptions}
          value={2}
          onChange={jest.fn()}
        />
      );
      expect(screen.getByRole('button')).toHaveTextContent('Option 2');
    });

    test('displays first option when no value provided', () => {
      render(
        <Select
          options={mockOptions}
          onChange={jest.fn()}
        />
      );
      expect(screen.getByRole('button')).toHaveTextContent('Option 1');
    });
  });

  describe('Dropdown Behavior', () => {
    test('dropdown is closed by default', () => {
      render(
        <Select
          options={mockOptions}
          value={1}
          onChange={jest.fn()}
        />
      );
      expect(screen.queryByText('Option 2')).not.toBeInTheDocument();
    });

    test('opens dropdown when trigger button clicked', async () => {
      const user = userEvent.setup();
      render(
        <Select
          options={mockOptions}
          value={1}
          onChange={jest.fn()}
        />
      );

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('Option 2')).toBeInTheDocument();
        expect(screen.getByText('Option 3')).toBeInTheDocument();
      });
    });

    test('closes dropdown when option selected', async () => {
      const onChange = jest.fn();
      const user = userEvent.setup();

      render(
        <Select
          options={mockOptions}
          value={1}
          onChange={onChange}
        />
      );

      // Open dropdown
      await user.click(screen.getByRole('button'));

      // Select option
      const option2 = screen.getAllByRole('button')[1]; // First is trigger, second is Option 1
      await user.click(option2);

      await waitFor(() => {
        // Dropdown should be closed - option should no longer be visible in menu
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBe(1); // Only trigger button remains
      });
    });

    test('closes dropdown when clicking outside', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <Select
            options={mockOptions}
            value={1}
            onChange={jest.fn()}
          />
          <div data-testid="outside">Outside element</div>
        </div>
      );

      // Open dropdown
      await user.click(screen.getByRole('button'));

      // Click outside
      await user.click(screen.getByTestId('outside'));

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBe(1); // Only trigger button remains
      });
    });
  });

  describe('Option Selection', () => {
    test('calls onChange with correct value when option selected', async () => {
      const onChange = jest.fn();
      const user = userEvent.setup();

      render(
        <Select
          options={mockOptions}
          value={1}
          onChange={onChange}
        />
      );

      await user.click(screen.getByRole('button'));

      const optionButtons = screen.getAllByRole('button');
      await user.click(optionButtons[2]); // Select Option 2

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          target: { value: 2 }
        })
      );
    });

    test('shows checkmark on selected option', async () => {
      const user = userEvent.setup();
      render(
        <Select
          options={mockOptions}
          value={2}
          onChange={jest.fn()}
        />
      );

      await user.click(screen.getByRole('button'));

      const checkmarks = screen.getAllByText('✓');
      expect(checkmarks.length).toBeGreaterThan(0);
    });
  });

  describe('Disabled State', () => {
    test('disables trigger button when disabled prop is true', () => {
      render(
        <Select
          options={mockOptions}
          value={1}
          onChange={jest.fn()}
          disabled
        />
      );
      const trigger = screen.getByRole('button');
      expect(trigger).toBeDisabled();
      expect(trigger).toHaveClass('disabled:opacity-50');
    });

    test('does not open dropdown when disabled', async () => {
      const user = userEvent.setup();
      render(
        <Select
          options={mockOptions}
          value={1}
          onChange={jest.fn()}
          disabled
        />
      );

      await user.click(screen.getByRole('button'));

      expect(screen.queryByText('Option 2')).not.toBeInTheDocument();
    });

    test('does not select disabled option', async () => {
      const onChange = jest.fn();
      const user = userEvent.setup();

      const optionsWithDisabled = [
        { value: 1, label: 'Option 1' },
        { value: 2, label: 'Option 2', disabled: true },
        { value: 3, label: 'Option 3' },
      ];

      render(
        <Select
          options={optionsWithDisabled}
          value={1}
          onChange={onChange}
        />
      );

      await user.click(screen.getByRole('button'));

      const optionButtons = screen.getAllByRole('button');
      await user.click(optionButtons[2]); // Try to select disabled Option 2

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('Custom Styling', () => {
    test('applies custom className to trigger button', () => {
      render(
        <Select
          options={mockOptions}
          value={1}
          onChange={jest.fn()}
          className="custom-trigger"
        />
      );
      expect(screen.getByRole('button')).toHaveClass('custom-trigger');
    });

    test('applies custom containerClassName', () => {
      const { container } = render(
        <Select
          options={mockOptions}
          value={1}
          onChange={jest.fn()}
          containerClassName="custom-container"
        />
      );
      expect(container.firstChild).toHaveClass('custom-container');
    });
  });

  describe('Arrow Icon', () => {
    test('rotates arrow when dropdown is open', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <Select
          options={mockOptions}
          value={1}
          onChange={jest.fn()}
        />
      );

      const arrow = container.querySelector('svg');
      expect(arrow?.parentElement).not.toHaveClass('rotate-180');

      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(arrow?.parentElement).toHaveClass('rotate-180');
      });
    });
  });
});
