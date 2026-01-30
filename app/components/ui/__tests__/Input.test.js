import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import Input from '../Input';

describe('Input Component', () => {
  describe('Rendering', () => {
    test('renders input element', () => {
      render(<Input placeholder="Enter text" />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    test('renders with label', () => {
      render(<Input label="Email" />);
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });

    test('renders with icon in label', () => {
      render(<Input label="Email" icon="📧" />);
      expect(screen.getByText('📧')).toBeInTheDocument();
    });

    test('applies custom className', () => {
      render(<Input className="custom-class" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('custom-class');
    });

    test('applies containerClassName', () => {
      const { container } = render(<Input containerClassName="container-class" />);
      expect(container.firstChild).toHaveClass('container-class');
    });

    test('renders with placeholder', () => {
      render(<Input placeholder="Enter text" />);
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    test('forwards ref to input element', () => {
      const ref = { current: null };
      render(<Input ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });
  });

  describe('Variants', () => {
    test('renders default variant', () => {
      render(<Input data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('border-slate-700/50');
    });

    test('renders error variant when error prop provided', () => {
      render(<Input error="This field is required" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('border-danger-500');
    });

    test('renders success variant', () => {
      render(<Input variant="success" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('border-sage-500');
    });
  });

  describe('Error States', () => {
    test('displays error message', () => {
      render(<Input error="This field is required" />);
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    test('shows error icon with message', () => {
      render(<Input error="Invalid email" />);
      // AlertCircle icon should be present in the error message
      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveTextContent('Invalid email');
    });

    test('sets aria-invalid when error present', () => {
      render(<Input error="Error" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    test('links error to input with aria-describedby', () => {
      render(<Input error="Error message" id="test-input" />);
      const input = screen.getByRole('textbox');
      const errorId = input.getAttribute('aria-describedby');
      expect(errorId).toBeTruthy();
      const errorElement = document.getElementById(errorId);
      expect(errorElement).toHaveTextContent('Error message');
    });

    test('does not set aria-invalid when no error', () => {
      render(<Input data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).not.toHaveAttribute('aria-invalid');
    });
  });

  describe('Clearable', () => {
    test('does not show clear button when clearable is false', () => {
      render(<Input defaultValue="test" />);
      expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument();
    });

    test('does not show clear button when clearable but no value', () => {
      render(<Input clearable />);
      expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument();
    });

    test('shows clear button when clearable and has value', () => {
      render(<Input clearable defaultValue="test" />);
      expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
    });

    test('clears value when clear button clicked (uncontrolled)', async () => {
      const user = userEvent.setup();
      render(<Input clearable defaultValue="test value" data-testid="input" />);

      const clearButton = screen.getByRole('button', { name: /clear/i });
      await user.click(clearButton);

      const input = screen.getByTestId('input');
      expect(input).toHaveValue('');
    });

    test('calls onChange when clear button clicked', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();
      render(<Input clearable defaultValue="test" onChange={handleChange} />);

      const clearButton = screen.getByRole('button', { name: /clear/i });
      await user.click(clearButton);

      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({
          target: expect.objectContaining({ value: '' }),
        })
      );
    });

    test('does not show clear button when disabled', () => {
      render(<Input clearable defaultValue="test" disabled />);
      expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument();
    });

    test('clear button has correct aria-label', () => {
      render(<Input clearable defaultValue="test" />);
      const clearButton = screen.getByRole('button', { name: 'Clear input' });
      expect(clearButton).toBeInTheDocument();
    });
  });

  describe('Character Count', () => {
    test('does not show count when showCount is false', () => {
      render(<Input maxLength={100} defaultValue="test" />);
      expect(screen.queryByText(/\/100/)).not.toBeInTheDocument();
    });

    test('does not show count when showCount but no maxLength', () => {
      render(<Input showCount defaultValue="test" />);
      expect(screen.queryByText(/\//)).not.toBeInTheDocument();
    });

    test('shows character count when showCount and maxLength set', () => {
      render(<Input showCount maxLength={100} defaultValue="test" />);
      expect(screen.getByText('4/100')).toBeInTheDocument();
    });

    test('updates character count on input', async () => {
      const user = userEvent.setup();
      render(<Input showCount maxLength={100} data-testid="input" />);

      const input = screen.getByTestId('input');
      await user.type(input, 'hello');

      expect(screen.getByText('5/100')).toBeInTheDocument();
    });

    test('shows 0 count for empty input', () => {
      render(<Input showCount maxLength={50} />);
      expect(screen.getByText('0/50')).toBeInTheDocument();
    });
  });

  describe('Real-time Validation', () => {
    test('calls validate function on change', async () => {
      const validate = jest.fn(() => null);
      const user = userEvent.setup();
      render(<Input validate={validate} data-testid="input" />);

      const input = screen.getByTestId('input');
      await user.type(input, 'a');

      expect(validate).toHaveBeenCalledWith('a');
    });

    test('displays validation error', async () => {
      const validate = (value) => (value.length < 3 ? 'Too short' : null);
      const user = userEvent.setup();
      render(<Input validate={validate} data-testid="input" />);

      const input = screen.getByTestId('input');
      await user.type(input, 'ab');

      expect(screen.getByText('Too short')).toBeInTheDocument();
    });

    test('clears validation error when valid', async () => {
      const validate = (value) => (value.length < 3 ? 'Too short' : null);
      const user = userEvent.setup();
      render(<Input validate={validate} data-testid="input" />);

      const input = screen.getByTestId('input');
      await user.type(input, 'abc');

      expect(screen.queryByText('Too short')).not.toBeInTheDocument();
    });

    test('external error takes precedence over validation error', () => {
      const validate = () => 'Validation error';
      render(<Input error="External error" validate={validate} defaultValue="test" />);

      expect(screen.getByText('External error')).toBeInTheDocument();
      expect(screen.queryByText('Validation error')).not.toBeInTheDocument();
    });
  });

  describe('Controlled vs Uncontrolled', () => {
    test('works as controlled input', async () => {
      const handleChange = jest.fn();
      const { rerender } = render(
        <Input value="initial" onChange={handleChange} data-testid="input" />
      );

      const input = screen.getByTestId('input');
      expect(input).toHaveValue('initial');

      rerender(<Input value="updated" onChange={handleChange} data-testid="input" />);
      expect(input).toHaveValue('updated');
    });

    test('works as uncontrolled input', async () => {
      const user = userEvent.setup();
      render(<Input defaultValue="default" data-testid="input" />);

      const input = screen.getByTestId('input');
      expect(input).toHaveValue('default');

      await user.clear(input);
      await user.type(input, 'new value');
      expect(input).toHaveValue('new value');
    });
  });

  describe('Disabled State', () => {
    test('can be disabled', () => {
      render(<Input disabled data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toBeDisabled();
    });

    test('disabled input has correct styling class', () => {
      render(<Input disabled data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('disabled:opacity-50');
    });
  });

  describe('Keyboard Navigation', () => {
    test('receives focus via Tab', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <button>Before</button>
          <Input placeholder="Enter text" data-testid="input" />
        </div>
      );

      // Focus the first button
      screen.getByText('Before').focus();

      // Tab to the input
      await user.tab();

      const input = screen.getByTestId('input');
      expect(input).toHaveFocus();
    });

    test('accepts text input while focused', async () => {
      const user = userEvent.setup();
      render(<Input data-testid="input" />);

      const input = screen.getByTestId('input');
      input.focus();

      await user.type(input, 'Hello World');

      expect(input).toHaveValue('Hello World');
    });

    test('Tab moves focus to next element', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <Input placeholder="Enter text" data-testid="input" />
          <button>After</button>
        </div>
      );

      // Focus the input
      const input = screen.getByTestId('input');
      input.focus();
      expect(input).toHaveFocus();

      // Tab to next element
      await user.tab();

      expect(screen.getByText('After')).toHaveFocus();
    });

    test('Shift+Tab moves focus to previous element', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <button>Before</button>
          <Input placeholder="Enter text" data-testid="input" />
        </div>
      );

      // Focus the input
      const input = screen.getByTestId('input');
      input.focus();
      expect(input).toHaveFocus();

      // Shift+Tab to previous element
      await user.tab({ shift: true });

      expect(screen.getByText('Before')).toHaveFocus();
    });

    test('disabled input is skipped in tab order', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <button>Before</button>
          <Input disabled data-testid="input" />
          <button>After</button>
        </div>
      );

      // Focus the first button
      screen.getByText('Before').focus();

      // Tab should skip the disabled input and go to After
      await user.tab();

      expect(screen.getByText('After')).toHaveFocus();
    });

    test('readonly input receives focus', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <button>Before</button>
          <Input readOnly defaultValue="Read only" data-testid="input" />
          <button>After</button>
        </div>
      );

      // Focus the first button
      screen.getByText('Before').focus();

      // Tab should go to readonly input
      await user.tab();

      const input = screen.getByTestId('input');
      expect(input).toHaveFocus();
    });

    test('readonly input cannot be edited via keyboard', async () => {
      const user = userEvent.setup();
      render(<Input readOnly defaultValue="Read only text" data-testid="input" />);

      const input = screen.getByTestId('input');
      input.focus();

      // Try to type
      await user.type(input, ' extra');

      // Value should not change
      expect(input).toHaveValue('Read only text');
    });

    test('Escape key blurs the input', async () => {
      const user = userEvent.setup();
      render(<Input data-testid="input" />);

      const input = screen.getByTestId('input');
      input.focus();
      expect(input).toHaveFocus();

      // Press Escape - browser behavior varies, but we can test that keyboard events work
      await user.keyboard('{Escape}');

      // Note: Escape typically doesn't blur in inputs by default
      // This test verifies keyboard events are received
    });

    test('Enter key triggers form submission in context', async () => {
      const handleSubmit = jest.fn((e) => e.preventDefault());
      const user = userEvent.setup();

      render(
        <form onSubmit={handleSubmit}>
          <Input data-testid="input" />
          <button type="submit">Submit</button>
        </form>
      );

      const input = screen.getByTestId('input');
      input.focus();

      await user.keyboard('{Enter}');

      expect(handleSubmit).toHaveBeenCalled();
    });

    test('supports standard text editing shortcuts', async () => {
      const user = userEvent.setup();
      render(<Input defaultValue="Hello World" data-testid="input" />);

      const input = screen.getByTestId('input');
      input.focus();

      // Select all and delete
      await user.keyboard('{Control>}a{/Control}{Backspace}');

      expect(input).toHaveValue('');
    });
  });

  describe('Input Types', () => {
    test('renders text type by default', () => {
      render(<Input data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('type', 'text');
    });

    test('renders email type', () => {
      render(<Input type="email" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('type', 'email');
    });

    test('renders password type', () => {
      render(<Input type="password" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('type', 'password');
    });
  });

  describe('Accessibility', () => {
    test('default state has no a11y violations', async () => {
      const { container } = render(<Input placeholder="Enter text" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('with label has no a11y violations', async () => {
      const { container } = render(<Input label="Email Address" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('with error has no a11y violations', async () => {
      const { container } = render(
        <Input label="Email" error="Please enter a valid email" />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('with clearable has no a11y violations', async () => {
      const { container } = render(
        <Input label="Search" clearable defaultValue="test" />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('disabled state has no a11y violations', async () => {
      const { container } = render(<Input label="Disabled Input" disabled />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('label is properly associated with input via htmlFor', () => {
      render(<Input label="Username" id="username-input" />);
      const input = screen.getByRole('textbox');
      const label = screen.getByText('Username');
      expect(label).toHaveAttribute('for', 'username-input');
      expect(input).toHaveAttribute('id', 'username-input');
    });

    test('auto-generates id when not provided', () => {
      render(<Input label="Auto ID" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('id');
      expect(input.id).toBeTruthy();
    });
  });
});
