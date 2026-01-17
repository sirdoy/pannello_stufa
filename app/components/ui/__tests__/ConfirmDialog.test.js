import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmDialog from '../ConfirmDialog';

describe('ConfirmDialog', () => {
  const mockOnConfirm = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup body overflow style
    document.body.style.overflow = 'unset';
  });

  test('does not render when isOpen is false', () => {
    render(
      <ConfirmDialog
        isOpen={false}
        message="Test message"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('renders when isOpen is true', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="Test Title"
        message="Test message"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  test('calls onConfirm when confirm button is clicked', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        message="Test message"
        confirmText="Yes"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.click(screen.getByText('Yes'));
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  test('calls onCancel when cancel button is clicked', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        message="Test message"
        cancelText="No"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.click(screen.getByText('No'));
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  test('calls onCancel when backdrop is clicked', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        message="Test message"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const backdrop = screen.getByRole('dialog');
    fireEvent.click(backdrop);
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  test('calls onCancel when Escape key is pressed', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        message="Test message"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  test('prevents body scroll when open', () => {
    const { rerender } = render(
      <ConfirmDialog
        isOpen={true}
        message="Test message"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(document.body.style.overflow).toBe('hidden');

    rerender(
      <ConfirmDialog
        isOpen={false}
        message="Test message"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(document.body.style.overflow).toBe('unset');
  });

  test('renders custom icon', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        message="Test message"
        icon="🚨"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('🚨')).toBeInTheDocument();
  });

  test('renders with custom button variants', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        message="Test message"
        confirmText="Delete"
        confirmVariant="danger"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const deleteButton = screen.getByText('Delete');
    expect(deleteButton).toBeInTheDocument();
  });

  test('does not propagate click from dialog content', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        message="Test message"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    // Click on the heading inside the dialog content (not the backdrop)
    const heading = screen.getByRole('heading', { name: /Conferma azione/i });
    fireEvent.click(heading);

    // onCancel should NOT be called when clicking dialog content
    expect(mockOnCancel).not.toHaveBeenCalled();
  });
});
