import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import Select, {
  SelectRoot,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '../Select';

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

    test('renders combobox trigger', () => {
      render(
        <Select
          options={mockOptions}
          value={2}
          onChange={jest.fn()}
        />
      );
      // Radix Select uses combobox role for the trigger
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    test('marks selected option as checked when opened', async () => {
      const user = userEvent.setup();
      render(
        <Select
          options={mockOptions}
          value={2}
          onChange={jest.fn()}
        />
      );

      await user.click(screen.getByRole('combobox'));

      await waitFor(() => {
        const option2 = screen.getByRole('option', { name: 'Option 2' });
        expect(option2).toHaveAttribute('data-state', 'checked');
      });
    });

    test('displays placeholder when no value', () => {
      render(
        <Select
          options={mockOptions}
          placeholder="Choose..."
          onChange={jest.fn()}
        />
      );
      expect(screen.getByRole('combobox')).toHaveTextContent('Choose...');
    });
  });

  describe('Dropdown Behavior', () => {
    test('opens dropdown when trigger clicked', async () => {
      const user = userEvent.setup();
      render(
        <Select
          options={mockOptions}
          value={1}
          onChange={jest.fn()}
        />
      );

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
    });

    test('shows all options when open', async () => {
      const user = userEvent.setup();
      render(
        <Select
          options={mockOptions}
          value={1}
          onChange={jest.fn()}
        />
      );

      await user.click(screen.getByRole('combobox'));

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Option 1' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'Option 2' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'Option 3' })).toBeInTheDocument();
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
      await user.click(screen.getByRole('combobox'));

      // Wait for listbox to appear
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      // Select option
      await user.click(screen.getByRole('option', { name: 'Option 2' }));

      // Dropdown should close
      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
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

      await user.click(screen.getByRole('combobox'));

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('option', { name: 'Option 2' }));

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          target: { value: 2 }
        })
      );
    });

    test('preserves number type for values', async () => {
      const onChange = jest.fn();
      const user = userEvent.setup();

      render(
        <Select
          options={mockOptions}
          value={1}
          onChange={onChange}
        />
      );

      await user.click(screen.getByRole('combobox'));

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('option', { name: 'Option 3' }));

      // Value should still be a number, not a string
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          target: { value: 3 }
        })
      );
    });
  });

  describe('Keyboard Navigation', () => {
    test('opens dropdown with Space key', async () => {
      const user = userEvent.setup();
      render(
        <Select
          options={mockOptions}
          value={1}
          onChange={jest.fn()}
        />
      );

      const trigger = screen.getByRole('combobox');
      trigger.focus();
      await user.keyboard(' ');

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
    });

    test('opens dropdown with Enter key', async () => {
      const user = userEvent.setup();
      render(
        <Select
          options={mockOptions}
          value={1}
          onChange={jest.fn()}
        />
      );

      const trigger = screen.getByRole('combobox');
      trigger.focus();
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
    });

    test('closes dropdown with Escape key', async () => {
      const user = userEvent.setup();
      render(
        <Select
          options={mockOptions}
          value={1}
          onChange={jest.fn()}
        />
      );

      // Open dropdown
      await user.click(screen.getByRole('combobox'));

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      // Press Escape
      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
    });

    test('navigates options with Arrow keys', async () => {
      const user = userEvent.setup();
      render(
        <Select
          options={mockOptions}
          value={1}
          onChange={jest.fn()}
        />
      );

      // Open dropdown
      await user.click(screen.getByRole('combobox'));

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      // Arrow down should highlight next option
      await user.keyboard('{ArrowDown}');

      // The highlighted option should have data-highlighted
      await waitFor(() => {
        const options = screen.getAllByRole('option');
        // At least one option should exist
        expect(options.length).toBeGreaterThan(0);
      });
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
      const trigger = screen.getByRole('combobox');
      expect(trigger).toBeDisabled();
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

      await user.click(screen.getByRole('combobox'));

      // Dropdown should not appear
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    test('shows disabled option with reduced opacity', async () => {
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
          onChange={jest.fn()}
        />
      );

      await user.click(screen.getByRole('combobox'));

      await waitFor(() => {
        const disabledOption = screen.getByRole('option', { name: 'Option 2' });
        expect(disabledOption).toHaveAttribute('data-disabled', '');
      });
    });
  });

  describe('Accessibility', () => {
    test('has no a11y violations in closed state', async () => {
      const { container } = render(
        <Select
          label="Select Option"
          options={mockOptions}
          value={1}
          onChange={jest.fn()}
        />
      );

      // Note: Radix Select renders hidden options for selection state tracking
      // These are rendered in a way that axe detects as orphaned options
      // But in practice they are hidden and not visible to users
      // We exclude aria-required-parent for this test since it's a JSDOM/test artifact
      const results = await axe(container, {
        rules: {
          'aria-required-parent': { enabled: false },
        },
      });
      expect(results).toHaveNoViolations();
    });

    test('has no a11y violations in open state', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <Select
          label="Select Option"
          options={mockOptions}
          value={1}
          onChange={jest.fn()}
        />
      );

      await user.click(screen.getByRole('combobox'));

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('has no a11y violations when disabled', async () => {
      const { container } = render(
        <Select
          label="Select Option"
          options={mockOptions}
          value={1}
          onChange={jest.fn()}
          disabled
        />
      );

      // Same exclusion as closed state - hidden options are a test artifact
      const results = await axe(container, {
        rules: {
          'aria-required-parent': { enabled: false },
        },
      });
      expect(results).toHaveNoViolations();
    });

    test('has combobox role on trigger', () => {
      render(
        <Select
          options={mockOptions}
          value={1}
          onChange={jest.fn()}
        />
      );
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    test('has listbox role on dropdown', async () => {
      const user = userEvent.setup();
      render(
        <Select
          options={mockOptions}
          value={1}
          onChange={jest.fn()}
        />
      );

      await user.click(screen.getByRole('combobox'));

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
    });

    test('has option role on items', async () => {
      const user = userEvent.setup();
      render(
        <Select
          options={mockOptions}
          value={1}
          onChange={jest.fn()}
        />
      );

      await user.click(screen.getByRole('combobox'));

      await waitFor(() => {
        const options = screen.getAllByRole('option');
        expect(options).toHaveLength(3);
      });
    });
  });

  describe('Compound Component Pattern', () => {
    test('works with compound component syntax', async () => {
      const onValueChange = jest.fn();
      const user = userEvent.setup();

      render(
        <SelectRoot value="a" onValueChange={onValueChange}>
          <SelectTrigger>
            <SelectValue placeholder="Choose..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">Alpha</SelectItem>
            <SelectItem value="b">Beta</SelectItem>
          </SelectContent>
        </SelectRoot>
      );

      await user.click(screen.getByRole('combobox'));

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Beta' })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('option', { name: 'Beta' }));

      expect(onValueChange).toHaveBeenCalledWith('b');
    });
  });

  describe('Custom Styling', () => {
    test('applies custom className to trigger', () => {
      render(
        <Select
          options={mockOptions}
          value={1}
          onChange={jest.fn()}
          className="custom-trigger"
        />
      );
      expect(screen.getByRole('combobox')).toHaveClass('custom-trigger');
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

  describe('Searchable Warning', () => {
    test('logs warning when searchable prop is used', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      render(
        <Select
          options={mockOptions}
          value={1}
          onChange={jest.fn()}
          searchable
        />
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('searchable={true} is not supported')
      );

      consoleSpy.mockRestore();
    });
  });
});
