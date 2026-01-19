import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DuplicateDayModal from '../DuplicateDayModal';

describe('DuplicateDayModal', () => {
  const mockOnConfirm = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Reset body overflow
    document.body.style.overflow = '';
  });

  it('renders nothing when isOpen is false', () => {
    render(
      <DuplicateDayModal
        isOpen={false}
        sourceDay="Lunedì"
        excludeDays={[]}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    // Modal uses portal, so content won't be in container but in document.body
    // When closed, modal should not render anything
    expect(screen.queryByText('Duplica Lunedì')).not.toBeInTheDocument();
  });

  it('renders modal when isOpen is true', async () => {
    render(
      <DuplicateDayModal
        isOpen={true}
        sourceDay="Lunedì"
        excludeDays={[]}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    // Wait for portal to render
    await waitFor(() => {
      expect(screen.getByText('Duplica Lunedì')).toBeInTheDocument();
    });
    expect(screen.getByText(/Seleziona i giorni su cui duplicare/)).toBeInTheDocument();
  });

  it('shows available days excluding source day', () => {
    render(
      <DuplicateDayModal
        isOpen={true}
        sourceDay="Lunedì"
        excludeDays={['Lunedì']}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    // Lunedì should not be in the list
    expect(screen.queryByText('Lunedì', { selector: 'span' })).not.toBeInTheDocument();

    // Other days should be present
    expect(screen.getByText('Martedì')).toBeInTheDocument();
    expect(screen.getByText('Mercoledì')).toBeInTheDocument();
    expect(screen.getByText('Giovedì')).toBeInTheDocument();
    expect(screen.getByText('Venerdì')).toBeInTheDocument();
    expect(screen.getByText('Sabato')).toBeInTheDocument();
    expect(screen.getByText('Domenica')).toBeInTheDocument();
  });

  it('allows selecting multiple days', () => {
    render(
      <DuplicateDayModal
        isOpen={true}
        sourceDay="Lunedì"
        excludeDays={['Lunedì']}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    // Initially confirm button should be disabled
    const confirmButton = screen.getByText(/Duplica/i, { selector: 'button span' });
    expect(confirmButton.closest('button')).toBeDisabled();

    // Select Martedì
    const martediCheckbox = screen.getByRole('checkbox', { name: /Martedì/i });
    fireEvent.click(martediCheckbox);

    // Confirm button should now show "Duplica su 1 giorno"
    expect(screen.getByText('Duplica su 1 giorno')).toBeInTheDocument();

    // Select Mercoledì
    const mercolediCheckbox = screen.getByRole('checkbox', { name: /Mercoledì/i });
    fireEvent.click(mercolediCheckbox);

    // Confirm button should now show "Duplica su 2 giorni"
    expect(screen.getByText('Duplica su 2 giorni')).toBeInTheDocument();
  });

  it('calls onConfirm with selected days', () => {
    render(
      <DuplicateDayModal
        isOpen={true}
        sourceDay="Lunedì"
        excludeDays={['Lunedì']}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    // Select Martedì and Mercoledì
    fireEvent.click(screen.getByRole('checkbox', { name: /Martedì/i }));
    fireEvent.click(screen.getByRole('checkbox', { name: /Mercoledì/i }));

    // Click confirm
    const confirmButton = screen.getByText(/Duplica su 2 giorni/i).closest('button');
    fireEvent.click(confirmButton);

    expect(mockOnConfirm).toHaveBeenCalledWith(['Martedì', 'Mercoledì']);
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(
      <DuplicateDayModal
        isOpen={true}
        sourceDay="Lunedì"
        excludeDays={['Lunedì']}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByText('Annulla').closest('button');
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('calls onCancel when backdrop is clicked', () => {
    render(
      <DuplicateDayModal
        isOpen={true}
        sourceDay="Lunedì"
        excludeDays={['Lunedì']}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    // Click backdrop (first div inside modal container)
    const backdrop = screen.getByText('Duplica Lunedì').closest('.fixed').querySelector('.absolute');
    fireEvent.click(backdrop);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('calls onCancel when close button is clicked', () => {
    render(
      <DuplicateDayModal
        isOpen={true}
        sourceDay="Lunedì"
        excludeDays={['Lunedì']}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const closeButton = screen.getByLabelText('Chiudi');
    fireEvent.click(closeButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('quick action: select weekdays', () => {
    render(
      <DuplicateDayModal
        isOpen={true}
        sourceDay="Domenica"
        excludeDays={['Domenica']}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const weekdaysButton = screen.getByText('Giorni feriali').closest('button');
    fireEvent.click(weekdaysButton);

    // Should show 5 days selected
    expect(screen.getByText('Duplica su 5 giorni')).toBeInTheDocument();

    // Verify all weekdays are checked
    expect(screen.getByRole('checkbox', { name: /Lunedì/i })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /Martedì/i })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /Mercoledì/i })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /Giovedì/i })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /Venerdì/i })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /Sabato/i })).not.toBeChecked();
  });

  it('quick action: select weekend', () => {
    render(
      <DuplicateDayModal
        isOpen={true}
        sourceDay="Lunedì"
        excludeDays={['Lunedì']}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const weekendButton = screen.getByText('Weekend').closest('button');
    fireEvent.click(weekendButton);

    // Should show 2 days selected
    expect(screen.getByText('Duplica su 2 giorni')).toBeInTheDocument();

    // Verify weekend days are checked
    expect(screen.getByRole('checkbox', { name: /Sabato/i })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /Domenica/i })).toBeChecked();
    // Lunedì is excluded, so no checkbox for it
    expect(screen.queryByRole('checkbox', { name: /Lunedì/i })).not.toBeInTheDocument();
  });

  it('quick action: select all', () => {
    render(
      <DuplicateDayModal
        isOpen={true}
        sourceDay="Lunedì"
        excludeDays={['Lunedì']}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const allButton = screen.getByText('Tutti').closest('button');
    fireEvent.click(allButton);

    // Should show 6 days selected (all except Lunedì)
    expect(screen.getByText('Duplica su 6 giorni')).toBeInTheDocument();

    // Verify all available days are checked
    expect(screen.getByRole('checkbox', { name: /Martedì/i })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /Mercoledì/i })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /Giovedì/i })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /Venerdì/i })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /Sabato/i })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /Domenica/i })).toBeChecked();
  });

  it('allows deselecting days', () => {
    render(
      <DuplicateDayModal
        isOpen={true}
        sourceDay="Lunedì"
        excludeDays={['Lunedì']}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    // Select all days
    const allButton = screen.getByText('Tutti').closest('button');
    fireEvent.click(allButton);
    expect(screen.getByText('Duplica su 6 giorni')).toBeInTheDocument();

    // Deselect Martedì
    const martediCheckbox = screen.getByRole('checkbox', { name: /Martedì/i });
    fireEvent.click(martediCheckbox);

    // Should now show 5 days
    expect(screen.getByText('Duplica su 5 giorni')).toBeInTheDocument();
    expect(martediCheckbox).not.toBeChecked();
  });

  it('resets selected days when modal reopens', async () => {
    const { rerender } = render(
      <DuplicateDayModal
        isOpen={true}
        sourceDay="Lunedì"
        excludeDays={['Lunedì']}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    // Select some days
    fireEvent.click(screen.getByRole('checkbox', { name: /Martedì/i }));
    expect(screen.getByText('Duplica su 1 giorno')).toBeInTheDocument();

    // Close modal
    rerender(
      <DuplicateDayModal
        isOpen={false}
        sourceDay="Lunedì"
        excludeDays={['Lunedì']}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    // Reopen modal
    rerender(
      <DuplicateDayModal
        isOpen={true}
        sourceDay="Lunedì"
        excludeDays={['Lunedì']}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    // Confirm button should be disabled (no days selected)
    await waitFor(() => {
      const confirmButton = screen.getByText(/Duplica/i, { selector: 'button span' }).closest('button');
      expect(confirmButton).toBeDisabled();
    });
  });

  it('prevents body scroll when modal is open', () => {
    const { rerender } = render(
      <DuplicateDayModal
        isOpen={true}
        sourceDay="Lunedì"
        excludeDays={['Lunedì']}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    // Modal now uses 'modal-open' class instead of direct overflow style
    expect(document.body.classList.contains('modal-open')).toBe(true);

    // Close modal
    rerender(
      <DuplicateDayModal
        isOpen={false}
        sourceDay="Lunedì"
        excludeDays={['Lunedì']}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(document.body.classList.contains('modal-open')).toBe(false);
  });

  it('shows checkmark for selected days', () => {
    render(
      <DuplicateDayModal
        isOpen={true}
        sourceDay="Lunedì"
        excludeDays={['Lunedì']}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    // Select Martedì
    fireEvent.click(screen.getByRole('checkbox', { name: /Martedì/i }));

    // Checkmark should appear (✓ character with ocean variant text)
    const martediLabel = screen.getByText('Martedì').closest('label');
    const checkmark = martediLabel.querySelector('span.text-ocean-400, span.text-ocean-600');
    expect(checkmark).toBeInTheDocument();
    expect(checkmark.textContent).toBe('✓');
  });

  it('does not call onConfirm when no days are selected', () => {
    render(
      <DuplicateDayModal
        isOpen={true}
        sourceDay="Lunedì"
        excludeDays={['Lunedì']}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    // Try to click confirm without selecting days
    const confirmButton = screen.getByText(/Duplica/i, { selector: 'button span' }).closest('button');

    // Button should be disabled
    expect(confirmButton).toBeDisabled();

    // Try to click anyway
    fireEvent.click(confirmButton);

    // onConfirm should not be called
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });
});
