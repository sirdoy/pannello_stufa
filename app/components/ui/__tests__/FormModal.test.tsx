import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { z } from 'zod';
import FormModal from '../FormModal';
import { Controller } from 'react-hook-form';

// Mock useHaptic hook to avoid vibration API issues in tests
jest.mock('@/app/hooks/useHaptic', () => ({
  useHaptic: () => ({
    trigger: jest.fn(),
    isSupported: false,
  }),
  default: () => ({
    trigger: jest.fn(),
    isSupported: false,
  }),
}));

// Test schema for validation
const testSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
});

// Helper component to render form fields
const TestFormFields = ({ control, isDisabled }) => (
  <>
    <Controller
      name="name"
      control={control}
      render={({ field, fieldState }) => (
        <div>
          <label htmlFor="name">Name</label>
          <input
            id="name"
            data-field="name"
            data-testid="name-input"
            {...field}
            disabled={isDisabled}
            aria-invalid={!!fieldState.error}
          />
          {fieldState.error && (
            <span data-testid="name-error" role="alert">
              {fieldState.error.message}
            </span>
          )}
        </div>
      )}
    />
    <Controller
      name="email"
      control={control}
      render={({ field, fieldState }) => (
        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            data-field="email"
            data-testid="email-input"
            {...field}
            disabled={isDisabled}
          />
          {fieldState.error && (
            <span data-testid="email-error" role="alert">
              {fieldState.error.message}
            </span>
          )}
        </div>
      )}
    />
  </>
);

describe('FormModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSubmit = jest.fn();
  const originalWarn = console.warn;

  beforeAll(() => {
    // Suppress Radix warnings
    console.warn = (...args) => {
      if (args[0]?.includes?.('Missing `Description`')) return;
      originalWarn.apply(console, args);
    };
  });

  afterAll(() => {
    console.warn = originalWarn;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    test('renders when isOpen is true', () => {
      render(
        <FormModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          title="Test Modal"
        >
          {() => <div>Form content</div>}
        </FormModal>
      );

      expect(screen.getByText('Test Modal')).toBeInTheDocument();
      expect(screen.getByText('Form content')).toBeInTheDocument();
    });

    test('does not render when isOpen is false', () => {
      render(
        <FormModal
          isOpen={false}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          title="Test Modal"
        >
          {() => <div>Form content</div>}
        </FormModal>
      );

      expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
    });

    test('renders description when provided', () => {
      render(
        <FormModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          title="Test Modal"
          description="This is a description"
        >
          {() => null}
        </FormModal>
      );

      expect(screen.getByText('This is a description')).toBeInTheDocument();
    });

    test('renders custom button labels', () => {
      render(
        <FormModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          title="Test Modal"
          submitLabel="Create"
          cancelLabel="Dismiss"
        >
          {() => null}
        </FormModal>
      );

      expect(screen.getByText('Create')).toBeInTheDocument();
      expect(screen.getByText('Dismiss')).toBeInTheDocument();
    });

    test('renders children via render prop', () => {
      render(
        <FormModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          title="Test Modal"
        >
          {({ control, isDisabled }) => (
            <TestFormFields control={control} isDisabled={isDisabled} />
          )}
        </FormModal>
      );

      expect(screen.getByLabelText('Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    test('validates on blur for touched fields', async () => {
      const user = userEvent.setup();

      render(
        <FormModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          title="Test Modal"
          validationSchema={testSchema}
          defaultValues={{ name: '', email: '' }}
        >
          {({ control, isDisabled }) => (
            <TestFormFields control={control} isDisabled={isDisabled} />
          )}
        </FormModal>
      );

      const emailInput = screen.getByTestId('email-input');

      // Type invalid email and blur
      await user.type(emailInput, 'invalid');
      await user.tab();

      // Error should appear after blur
      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toBeInTheDocument();
      });
    });

    test('shows error summary at top on submit with errors', async () => {
      const user = userEvent.setup();

      render(
        <FormModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          title="Test Modal"
          validationSchema={testSchema}
          defaultValues={{ name: '', email: '' }}
        >
          {({ control, isDisabled }) => (
            <TestFormFields control={control} isDisabled={isDisabled} />
          )}
        </FormModal>
      );

      const submitButton = screen.getByText('Save');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please fix the following errors:')).toBeInTheDocument();
      });
    });
  });

  describe('Shake Animation', () => {
    test('adds animate-shake class to invalid fields on submit', async () => {
      const user = userEvent.setup();

      render(
        <FormModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          title="Test Modal"
          validationSchema={testSchema}
          defaultValues={{ name: '', email: '' }}
        >
          {({ control, isDisabled }) => (
            <TestFormFields control={control} isDisabled={isDisabled} />
          )}
        </FormModal>
      );

      const nameInput = screen.getByTestId('name-input');
      const submitButton = screen.getByText('Save');

      await user.click(submitButton);

      await waitFor(() => {
        expect(nameInput.classList.contains('animate-shake')).toBe(true);
      });
    });
  });

  describe('Loading State', () => {
    test('disables form fields during submit', async () => {
      const user = userEvent.setup();
      let resolveSubmit;
      const slowSubmit = jest.fn(() => new Promise((resolve) => {
        resolveSubmit = resolve;
      }));

      render(
        <FormModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={slowSubmit}
          title="Test Modal"
          defaultValues={{ name: 'Test', email: 'test@test.com' }}
          validationSchema={testSchema}
        >
          {({ control, isDisabled }) => (
            <TestFormFields control={control} isDisabled={isDisabled} />
          )}
        </FormModal>
      );

      const submitButton = screen.getByText('Save');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('name-input')).toBeDisabled();
        expect(screen.getByTestId('email-input')).toBeDisabled();
      });

      expect(screen.getByText('Saving...')).toBeInTheDocument();

      await act(async () => {
        resolveSubmit();
      });
    });

    test('prevents close while loading', async () => {
      const user = userEvent.setup();
      let resolveSubmit;
      const slowSubmit = jest.fn(() => new Promise((resolve) => {
        resolveSubmit = resolve;
      }));

      render(
        <FormModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={slowSubmit}
          title="Test Modal"
          defaultValues={{ name: 'Test', email: 'test@test.com' }}
          validationSchema={testSchema}
        >
          {({ control, isDisabled }) => (
            <TestFormFields control={control} isDisabled={isDisabled} />
          )}
        </FormModal>
      );

      const submitButton = screen.getByRole('button', { name: /save/i });
      const cancelButton = screen.getByRole('button', { name: /cancel/i });

      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Saving...')).toBeInTheDocument();
      });

      expect(cancelButton).toBeDisabled();

      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toBeDisabled();

      await act(async () => {
        resolveSubmit();
      });
    });
  });

  describe('Success State', () => {
    test('shows success checkmark overlay after successful submit', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue();

      render(
        <FormModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          title="Test Modal"
          successMessage="Saved successfully!"
          defaultValues={{ name: 'Test', email: 'test@test.com' }}
          validationSchema={testSchema}
        >
          {({ control, isDisabled }) => (
            <TestFormFields control={control} isDisabled={isDisabled} />
          )}
        </FormModal>
      );

      const submitButton = screen.getByText('Save');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Saved successfully!')).toBeInTheDocument();
      });
    });

    test('auto-closes after success delay', async () => {
      jest.useFakeTimers();
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      mockOnSubmit.mockResolvedValue();

      render(
        <FormModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          title="Test Modal"
          successMessage="Saved!"
          defaultValues={{ name: 'Test', email: 'test@test.com' }}
          validationSchema={testSchema}
        >
          {({ control, isDisabled }) => (
            <TestFormFields control={control} isDisabled={isDisabled} />
          )}
        </FormModal>
      );

      const submitButton = screen.getByText('Save');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Saved!')).toBeInTheDocument();
      });

      act(() => {
        jest.advanceTimersByTime(800);
      });

      expect(mockOnClose).toHaveBeenCalled();

      jest.useRealTimers();
    });
  });

  describe('Cancel Behavior', () => {
    test('calls onClose when cancel button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <FormModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          title="Test Modal"
        >
          {() => null}
        </FormModal>
      );

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Submission', () => {
    test('calls onSubmit with form data on valid submit', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue();

      render(
        <FormModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          title="Test Modal"
          defaultValues={{ name: 'Test Name', email: 'test@example.com' }}
          validationSchema={testSchema}
        >
          {({ control, isDisabled }) => (
            <TestFormFields control={control} isDisabled={isDisabled} />
          )}
        </FormModal>
      );

      const submitButton = screen.getByText('Save');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          name: 'Test Name',
          email: 'test@example.com',
        });
      });
    });

    test('does not call onSubmit on invalid form', async () => {
      const user = userEvent.setup();

      render(
        <FormModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          title="Test Modal"
          defaultValues={{ name: '', email: '' }}
          validationSchema={testSchema}
        >
          {({ control, isDisabled }) => (
            <TestFormFields control={control} isDisabled={isDisabled} />
          )}
        </FormModal>
      );

      const submitButton = screen.getByText('Save');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please fix the following errors:')).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });
});
